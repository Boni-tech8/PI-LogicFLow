import 'dotenv/config';
import assert from 'node:assert/strict';
import { after, before, describe, test } from 'node:test';
import jwt from 'jsonwebtoken';
import app from '../src/app.js';
import { env } from '../src/config/env.js';
import { prisma } from '../src/lib/prisma.js';

const sufixo = String(Date.now()).slice(-8);
const dias = (n) => new Date(Date.now() + n * 86_400_000);
const dia = (n) => dias(n).toISOString().slice(0, 10);

const usuarios = {};
const tokens = {};
const demandas = {};
let catServico;
let catOutra;
let server;
let base;

async function api(path, token) {
  const res = await fetch(`${base}${path}`, { headers: token ? { authorization: `Bearer ${token}` } : {} });
  return { status: res.status, body: await res.json() };
}

async function criarUsuario(chave, n, role, { status = 'ATIVO', city = 'Caruaru', faccao = {} } = {}) {
  const user = await prisma.user.create({
    data: {
      phone: `55829${n}${sufixo}`,
      name: `Busca ${chave}`,
      role,
      status,
      consentAt: new Date(),
      ...(role === 'FACCAO'
        ? { faccao: { create: { city, ...faccao } } }
        : { confeccao: { create: { city } } }),
    },
  });
  usuarios[chave] = user;
  tokens[chave] = jwt.sign({ sub: user.id, role: user.role }, env.JWT_SECRET, { expiresIn: '1h' });
}

async function criarDemanda(chave, extra = {}) {
  demandas[chave] = await prisma.demand.create({
    data: {
      code: `TB-${sufixo}-${chave}`,
      confeccaoId: usuarios.confeccao.id,
      categoryId: catServico.id,
      title: `Demanda ${chave}`,
      quantity: 1000,
      deadline: dias(15),
      city: 'Toritama',
      ...extra,
    },
  });
}

const idsDemandas = (...chaves) => chaves.map((k) => demandas[k].id).sort();
const idsFaccoes = (...chaves) => chaves.map((k) => usuarios[k].id).sort();
const ordenados = (r) => r.body.items.map((i) => i.id).sort();

describe('BuscaController', () => {
  before(async () => {
    catServico = await prisma.serviceCategory.create({ data: { name: `Busca-${sufixo}-A` } });
    catOutra = await prisma.serviceCategory.create({ data: { name: `Busca-${sufixo}-B` } });

    await criarUsuario('confeccao', 1, 'CONFECCAO');
    await criarUsuario('outraConfeccao', 2, 'CONFECCAO');

    await criarUsuario('f1', 3, 'FACCAO', {
      city: 'Caruaru',
      faccao: {
        weeklyCapacity: 500,
        services: { create: [{ categoryId: catServico.id }] },
        availability: { create: [{ startDate: dias(-1), endDate: dias(30), status: 'LIVRE' }] },
      },
    });
    await criarUsuario('f2', 4, 'FACCAO', {
      city: 'Toritama',
      faccao: {
        weeklyCapacity: 2000,
        services: { create: [{ categoryId: catServico.id }] },
        availability: { create: [{ startDate: dias(-1), endDate: dias(30), status: 'OCUPADO' }] },
      },
    });
    await criarUsuario('f3', 5, 'FACCAO', {
      city: 'Caruaru',
      faccao: { weeklyCapacity: 100, services: { create: [{ categoryId: catOutra.id }] } },
    });
    await criarUsuario('f4', 6, 'FACCAO', {
      status: 'SUSPENSO',
      city: 'Caruaru',
      faccao: { weeklyCapacity: 800, services: { create: [{ categoryId: catServico.id }] } },
    });

    await criarDemanda('d1', { city: 'Toritama', quantity: 500, deadline: dias(10) });
    await criarDemanda('d2', { city: 'Caruaru', quantity: 1500, deadline: dias(30) });
    await criarDemanda('d3', { city: 'Toritama', quantity: 3000, deadline: dias(5) });
    await criarDemanda('d4', { categoryId: catOutra.id, city: 'Toritama', quantity: 800 });
    await criarDemanda('d5', { city: 'Toritama', quantity: 700, status: 'ENCERRADA' });
    await criarDemanda('d6', { city: 'Toritama', quantity: 900, status: 'PAUSADA' });

    // f1 participou da demanda encerrada (proposta recusada)
    await prisma.proposal.create({
      data: { demandId: demandas.d5.id, faccaoId: usuarios.f1.id, price: 10, deadlineDays: 5, status: 'RECUSADA' },
    });

    await new Promise((resolve) => {
      server = app.listen(0, resolve);
    });
    base = `http://127.0.0.1:${server.address().port}`;
  });

  after(async () => {
    await prisma.demand.deleteMany({ where: { code: { startsWith: `TB-${sufixo}-` } } });
    await prisma.user.deleteMany({ where: { id: { in: Object.values(usuarios).map((u) => u.id) } } });
    await prisma.serviceCategory.deleteMany({ where: { id: { in: [catServico.id, catOutra.id] } } });
    await prisma.$disconnect();
    server.closeAllConnections?.();
    await new Promise((resolve) => server.close(resolve));
  });

  describe('GET /api/demandas', () => {
    test('Cenário 1: filtra por cidade e serviço e devolve só as abertas de Toritama', async () => {
      const r = await api(`/api/demandas?cidade=Toritama&servicoId=${catServico.id}`, tokens.f1);
      assert.equal(r.status, 200);
      assert.deepEqual(ordenados(r), idsDemandas('d1', 'd3'));
      assert.ok(r.body.items.every((d) => d.status === 'ABERTA' && d.city === 'Toritama'));
      assert.ok(r.body.items.every((d) => d.category.id === catServico.id));
    });

    test('cidade ignora maiúsculas e minúsculas', async () => {
      const r = await api(`/api/demandas?cidade=toritama&servicoId=${catServico.id}`, tokens.f1);
      assert.deepEqual(ordenados(r), idsDemandas('d1', 'd3'));
    });

    test('Cenário 2: sem status explícito, encerradas e pausadas não aparecem', async () => {
      const r = await api(`/api/demandas?servicoId=${catServico.id}`, tokens.f2);
      assert.equal(r.status, 200);
      assert.deepEqual(ordenados(r), idsDemandas('d1', 'd2', 'd3'));
      assert.ok(!r.body.items.some((d) => d.status === 'ENCERRADA' || d.status === 'PAUSADA'));
    });

    test('filtra por quantidade mínima e máxima', async () => {
      const r = await api(`/api/demandas?servicoId=${catServico.id}&quantidadeMin=1000&quantidadeMax=2000`, tokens.f1);
      assert.deepEqual(ordenados(r), idsDemandas('d2'));
    });

    test('quantidadeMin maior que quantidadeMax responde 400', async () => {
      const r = await api(`/api/demandas?quantidadeMin=500&quantidadeMax=100`, tokens.f1);
      assert.equal(r.status, 400);
      assert.ok(r.body.details.some((d) => d.campo === 'quantidadeMin'));
    });

    test('prazoMax limita pelo prazo e sort=prazo,asc põe a mais urgente primeiro', async () => {
      const r = await api(`/api/demandas?servicoId=${catServico.id}&prazoMax=${dia(12)}&sort=prazo,asc`, tokens.f1);
      assert.equal(r.status, 200);
      assert.deepEqual(
        r.body.items.map((d) => d.id),
        [demandas.d3.id, demandas.d1.id],
      );
    });

    test('prazoMax inválido responde 400', async () => {
      const r = await api(`/api/demandas?prazoMax=amanha`, tokens.f1);
      assert.equal(r.status, 400);
      assert.ok(r.body.details.some((d) => d.campo === 'prazoMax'));
    });

    test('paginação: size, page, total e totalPages', async () => {
      const base = `/api/demandas?servicoId=${catServico.id}&sort=quantidade,asc&size=2`;
      const p1 = await api(`${base}&page=1`, tokens.f1);
      assert.equal(p1.status, 200);
      assert.deepEqual(p1.body.items.map((d) => d.id), [demandas.d1.id, demandas.d2.id]);
      assert.equal(p1.body.total, 3);
      assert.equal(p1.body.totalPages, 2);

      const p2 = await api(`${base}&page=2`, tokens.f1);
      assert.deepEqual(p2.body.items.map((d) => d.id), [demandas.d3.id]);
    });

    test('limite padrão é 20 itens por página e size acima de 50 responde 400', async () => {
      const r = await api(`/api/demandas?servicoId=${catServico.id}`, tokens.f1);
      assert.equal(r.body.size, 20);
      assert.equal(r.body.page, 1);

      const grande = await api(`/api/demandas?size=51`, tokens.f1);
      assert.equal(grande.status, 400);
    });

    test('ordenação inválida responde 400', async () => {
      const r = await api(`/api/demandas?sort=senha,asc`, tokens.f1);
      assert.equal(r.status, 400);
      assert.match(r.body.error, /Ordenação inválida/);
    });

    test('status explícito só mostra demandas de que o usuário participa', async () => {
      const url = `/api/demandas?status=ENCERRADA&servicoId=${catServico.id}`;

      const dona = await api(url, tokens.confeccao);
      assert.deepEqual(ordenados(dona), idsDemandas('d5'));
      assert.equal(dona.body.items[0].status, 'ENCERRADA');

      const participante = await api(url, tokens.f1);
      assert.deepEqual(ordenados(participante), idsDemandas('d5'));

      const estranha = await api(url, tokens.outraConfeccao);
      assert.equal(estranha.body.items.length, 0);
      const outraFaccao = await api(url, tokens.f2);
      assert.equal(outraFaccao.body.items.length, 0);
    });

    test('status inválido responde 400 e sem token responde 401', async () => {
      const r1 = await api(`/api/demandas?status=CANCELADA`, tokens.f1);
      assert.equal(r1.status, 400);
      const r2 = await api(`/api/demandas`);
      assert.equal(r2.status, 401);
    });
  });

  describe('GET /api/faccoes', () => {
    test('filtra por serviço e ignora facções de outro serviço ou suspensas', async () => {
      const r = await api(`/api/faccoes?servicoId=${catServico.id}`, tokens.confeccao);
      assert.equal(r.status, 200);
      assert.deepEqual(ordenados(r), idsFaccoes('f1', 'f2'));
    });

    test('filtra por cidade', async () => {
      const r = await api(`/api/faccoes?servicoId=${catServico.id}&cidade=caruaru`, tokens.confeccao);
      assert.deepEqual(ordenados(r), idsFaccoes('f1'));
    });

    test('filtra por capacidade mínima', async () => {
      const r = await api(`/api/faccoes?servicoId=${catServico.id}&capacidadeMin=1000`, tokens.confeccao);
      assert.deepEqual(ordenados(r), idsFaccoes('f2'));
    });

    test('disponivel=true traz só quem tem período livre', async () => {
      const r = await api(`/api/faccoes?servicoId=${catServico.id}&disponivel=true`, tokens.confeccao);
      assert.deepEqual(ordenados(r), idsFaccoes('f1'));
    });

    test('ordena por capacidade e traz reputação sem expor telefone', async () => {
      const r = await api(`/api/faccoes?servicoId=${catServico.id}&sort=capacidade,desc`, tokens.confeccao);
      assert.deepEqual(r.body.items.map((f) => f.id), [usuarios.f2.id, usuarios.f1.id]);
      assert.deepEqual(r.body.items[0].reputation, {
        avgRating: null,
        reviewsCount: 0,
        completedServices: 0,
        onTimeRate: null,
      });
      assert.ok(!JSON.stringify(r.body).includes(usuarios.f1.phone));
    });

    test('paginação, parâmetros inválidos e autenticação', async () => {
      const p = await api(`/api/faccoes?servicoId=${catServico.id}&size=1&page=2&sort=capacidade,asc`, tokens.confeccao);
      assert.equal(p.status, 200);
      assert.equal(p.body.items.length, 1);
      assert.equal(p.body.total, 2);
      assert.equal(p.body.totalPages, 2);

      const ruim = await api(`/api/faccoes?disponivel=talvez`, tokens.confeccao);
      assert.equal(ruim.status, 400);
      const semToken = await api(`/api/faccoes`);
      assert.equal(semToken.status, 401);
    });
  });
});