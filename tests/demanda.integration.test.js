import 'dotenv/config';
import assert from 'node:assert/strict';
import { after, before, describe, test } from 'node:test';
import jwt from 'jsonwebtoken';
import app from '../src/app.js';
import { env } from '../src/config/env.js';
import { prisma } from '../src/lib/prisma.js';

const sufixo = String(Date.now()).slice(-8);
const usuarios = {};
const tokens = {};
let server;
let base;
let categoria;

const dia = (n) => new Date(Date.now() + n * 86_400_000).toISOString().slice(0, 10);

const payload = (extra = {}) => ({
  categoryId: categoria.id,
  title: 'Costura de calça jeans com pesponto duplo',
  description: 'Pesponto duplo na lateral',
  quantity: 1500,
  deadline: dia(30),
  city: 'Caruaru',
  ...extra,
});

async function api(method, path, token, body) {
  const res = await fetch(`${base}${path}`, {
    method,
    headers: { 'content-type': 'application/json', ...(token && { authorization: `Bearer ${token}` }) },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  return { status: res.status, body: text ? JSON.parse(text) : null };
}

async function criarUsuario(chave, role, n) {
  const perfil = { city: 'Caruaru' };
  const user = await prisma.user.create({
    data: {
      phone: `55819${n}${sufixo}`,
      name: `Teste ${chave}`,
      role,
      consentAt: new Date(),
      ...(role === 'FACCAO' ? { faccao: { create: perfil } } : { confeccao: { create: perfil } }),
    },
  });
  usuarios[chave] = user;
  tokens[chave] = jwt.sign({ sub: user.id, role: user.role }, env.JWT_SECRET, { expiresIn: '1h' });
}

async function publicar(extra) {
  const r = await api('POST', '/api/demandas', tokens.confeccao, payload(extra));
  assert.equal(r.status, 201);
  return r.body;
}

describe('DemandaController', () => {
  before(async () => {
    categoria = await prisma.serviceCategory.upsert({
      where: { name: 'Costura' },
      update: {},
      create: { name: 'Costura' },
    });
    await criarUsuario('confeccao', 'CONFECCAO', 1);
    await criarUsuario('outraConfeccao', 'CONFECCAO', 2);
    await criarUsuario('faccao', 'FACCAO', 3);

    await new Promise((resolve) => {
      server = app.listen(0, resolve);
    });
    base = `http://127.0.0.1:${server.address().port}`;
  });

  after(async () => {
    const ids = Object.values(usuarios).map((u) => u.id);
    const demandas = await prisma.demand.findMany({
      where: { confeccaoId: { in: ids } },
      select: { id: true },
    });
    const demandIds = demandas.map((d) => d.id);
    await prisma.agreement.deleteMany({ where: { demandId: { in: demandIds } } });
    await prisma.demand.deleteMany({ where: { id: { in: demandIds } } });
    await prisma.user.deleteMany({ where: { id: { in: ids } } });
    await prisma.$disconnect();
    server.closeAllConnections?.();
    await new Promise((resolve) => server.close(resolve));
  });

  test('Cenário 1: publica demanda válida e responde 201 com ID e status ABERTA', async () => {
    const r = await api('POST', '/api/demandas', tokens.confeccao, payload());
    assert.equal(r.status, 201);
    assert.ok(r.body.id);
    assert.match(r.body.code, /^DM-\d{4}-\d{3}$/);
    assert.equal(r.body.status, 'ABERTA');
    assert.equal(r.body.quantity, 1500);
    assert.equal(r.body.city, 'Caruaru');
  });

  test('Cenário 2: prazo no passado responde 400 com mensagem sobre o prazo', async () => {
    const r = await api('POST', '/api/demandas', tokens.confeccao, payload({ deadline: dia(-1) }));
    assert.equal(r.status, 400);
    const erro = r.body.details.find((d) => d.campo === 'deadline');
    assert.ok(erro, 'deve apontar o campo deadline');
    assert.match(erro.mensagem, /prazo/i);
  });

  test('quantidade zero ou negativa responde 400', async () => {
    const r = await api('POST', '/api/demandas', tokens.confeccao, payload({ quantity: 0 }));
    assert.equal(r.status, 400);
    assert.ok(r.body.details.some((d) => d.campo === 'quantity'));
  });

  test('facção não pode publicar demanda (403) e sem token responde 401', async () => {
    const r1 = await api('POST', '/api/demandas', tokens.faccao, payload());
    assert.equal(r1.status, 403);
    const r2 = await api('POST', '/api/demandas', null, payload());
    assert.equal(r2.status, 401);
  });

  test('detalha demanda existente e responde 404 para inexistente', async () => {
    const d = await publicar();
    const ok = await api('GET', `/api/demandas/${d.id}`, tokens.faccao);
    assert.equal(ok.status, 200);
    assert.equal(ok.body.id, d.id);
    assert.equal(ok.body.myProposal, null);
    assert.equal(ok.body.confeccao.phone, undefined);

    const nao = await api('GET', '/api/demandas/00000000-0000-0000-0000-000000000000', tokens.faccao);
    assert.equal(nao.status, 404);
  });

  test('lista apenas as demandas da confecção logada', async () => {
    const d = await publicar();
    const minhas = await api('GET', '/api/demandas/minhas', tokens.confeccao);
    assert.equal(minhas.status, 200);
    assert.ok(minhas.body.some((x) => x.id === d.id));

    const dela = await api('GET', '/api/demandas/minhas', tokens.outraConfeccao);
    assert.equal(dela.status, 200);
    assert.ok(!dela.body.some((x) => x.id === d.id));

    const faccao = await api('GET', '/api/demandas/minhas', tokens.faccao);
    assert.equal(faccao.status, 403);
  });

  test('edita demanda enquanto aberta e bloqueia outra confecção', async () => {
    const d = await publicar();
    const ok = await api('PUT', `/api/demandas/${d.id}`, tokens.confeccao, payload({ quantity: 2000, city: 'Toritama' }));
    assert.equal(ok.status, 200);
    assert.equal(ok.body.quantity, 2000);
    assert.equal(ok.body.city, 'Toritama');

    const alheia = await api('PUT', `/api/demandas/${d.id}`, tokens.outraConfeccao, payload());
    assert.equal(alheia.status, 404);

    const passado = await api('PUT', `/api/demandas/${d.id}`, tokens.confeccao, payload({ deadline: dia(-2) }));
    assert.equal(passado.status, 400);
  });

  test('transições de status: pausar, reabrir e encerrar', async () => {
    const d = await publicar();
    const url = `/api/demandas/${d.id}/status`;

    const pausa = await api('PATCH', url, tokens.confeccao, { status: 'PAUSADA' });
    assert.equal(pausa.status, 200);
    assert.equal(pausa.body.status, 'PAUSADA');

    const repetida = await api('PATCH', url, tokens.confeccao, { status: 'PAUSADA' });
    assert.equal(repetida.status, 409);

    const reabre = await api('PATCH', url, tokens.confeccao, { status: 'ABERTA' });
    assert.equal(reabre.body.status, 'ABERTA');

    const encerra = await api('PATCH', url, tokens.confeccao, { status: 'ENCERRADA' });
    assert.equal(encerra.body.status, 'ENCERRADA');

    const depois = await api('PATCH', url, tokens.confeccao, { status: 'ABERTA' });
    assert.equal(depois.status, 409);

    const editar = await api('PUT', `/api/demandas/${d.id}`, tokens.confeccao, payload());
    assert.equal(editar.status, 409);

    const invalido = await api('PATCH', url, tokens.confeccao, { status: 'EM_ANDAMENTO' });
    assert.equal(invalido.status, 400);

    const faccao = await api('PATCH', url, tokens.faccao, { status: 'PAUSADA' });
    assert.equal(faccao.status, 403);
  });

  test('encerrar a demanda recusa as propostas pendentes', async () => {
    const d = await publicar();
    const prop = await api('POST', `/api/demandas/${d.id}/proposals`, tokens.faccao, {
      price: 12.5,
      deadlineDays: 20,
    });
    assert.equal(prop.status, 201);

    await api('PATCH', `/api/demandas/${d.id}/status`, tokens.confeccao, { status: 'ENCERRADA' });

    const minhas = await api('GET', '/proposals/mine', tokens.faccao);
    const p = minhas.body.find((x) => x.id === prop.body.id);
    assert.equal(p.status, 'RECUSADA');
  });

  test('com proposta aceita: bloqueia edição estrutural, permite edição simples e bloqueia pausa', async () => {
    const d = await publicar();
    const prop = await api('POST', `/api/demandas/${d.id}/proposals`, tokens.faccao, {
      price: 10,
      deadlineDays: 15,
    });
    assert.equal(prop.status, 201);

    const aceite = await api('POST', `/proposals/${prop.body.id}/accept`, tokens.confeccao);
    assert.equal(aceite.status, 201);

    const estrutural = await api('PUT', `/api/demandas/${d.id}`, tokens.confeccao, payload({ quantity: 3000 }));
    assert.equal(estrutural.status, 409);

    const simples = await api('PUT', `/api/demandas/${d.id}`, tokens.confeccao, payload({ title: 'Título ajustado' }));
    assert.equal(simples.status, 200);
    assert.equal(simples.body.title, 'Título ajustado');
    assert.equal(simples.body.quantity, 1500);
    assert.equal(simples.body.status, 'EM_ANDAMENTO');

    const pausa = await api('PATCH', `/api/demandas/${d.id}/status`, tokens.confeccao, { status: 'PAUSADA' });
    assert.equal(pausa.status, 409);
  });
});