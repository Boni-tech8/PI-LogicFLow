import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import jwt from 'jsonwebtoken';
import { Prisma } from '@prisma/client';
import { env } from '../src/config/env.js';
import { prisma } from '../src/lib/prisma.js';
import app from '../src/app.js';

const sufixo = String(Date.now()).slice(-9);
const QUANTIDADE = 100;
let sequencia = 0;
let server;
let base;
let categoria;
const usuarios = {};
const tokens = {};

// O model Demand pode ter `deadlineDays` (Int) ou `deadline` (DateTime), dependendo da migration aplicada
const camposDemanda = Prisma.dmmf.datamodel.models
  .find((m) => m.name === 'Demand')
  .fields.map((f) => f.name);
const prazoDemanda = () =>
  camposDemanda.includes('deadline')
    ? { deadline: new Date(Date.now() + 30 * 86_400_000) }
    : { deadlineDays: 30 };

async function api(method, caminho, token, body) {
  const res = await fetch(`${base}${caminho}`, {
    method,
    headers: {
      ...(body ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const texto = await res.text();
  return { status: res.status, body: texto ? JSON.parse(texto) : null, texto };
}

async function criarUsuario(chave, role, indice) {
  const perfil = { city: 'Recife' };
  const user = await prisma.user.create({
    data: {
      phone: `5500${sufixo}${indice}`,
      name: `Teste ${chave}`,
      role,
      verified: true,
      consentAt: new Date(),
      ...(role === 'FACCAO' ? { faccao: { create: perfil } } : { confeccao: { create: perfil } }),
    },
  });
  usuarios[chave] = user;
  tokens[chave] = jwt.sign({ sub: user.id, role: user.role }, env.JWT_SECRET, { expiresIn: '1h' });
}

// Cria a demanda direto no banco, de propriedade da confecção de teste
function novaDemanda(status = 'RECEBENDO_PROPOSTAS') {
  return prisma.demand.create({
    data: {
      code: `T-${sufixo}-${++sequencia}`,
      confeccaoId: usuarios.confeccao.id,
      categoryId: categoria.id,
      title: 'Demanda de teste',
      quantity: QUANTIDADE,
      city: 'Recife',
      status,
      ...prazoDemanda(),
    },
  });
}

// Envia uma proposta pela API e confere que deu certo
async function proporPara(demandId, chave, price, deadlineDays = 10) {
  const r = await api('POST', `/api/demandas/${demandId}/propostas`, tokens[chave], {
    price,
    deadlineDays,
  });
  assert.equal(r.status, 201, `proposta de ${chave} deveria ser criada: ${r.texto}`);
  return r.body;
}

const statusProposta = async (id) =>
  (await prisma.proposal.findUnique({ where: { id }, select: { status: true } })).status;

const statusDemanda = async (id) =>
  (await prisma.demand.findUnique({ where: { id }, select: { status: true } })).status;

const notificacoes = (userId, type, demandId) =>
  prisma.notification.count({
    where: { userId, type, data: { path: ['demandId'], equals: demandId } },
  });

describe('PropostaController', () => {
  before(async () => {
    await new Promise((resolve) => {
      server = app.listen(0, '127.0.0.1', resolve);
    });
    base = `http://127.0.0.1:${server.address().port}`;

    categoria = await prisma.serviceCategory.create({ data: { name: `Teste ${sufixo}` } });
    await criarUsuario('confeccao', 'CONFECCAO', 1);
    await criarUsuario('outra', 'CONFECCAO', 2);
    await criarUsuario('f1', 'FACCAO', 3);
    await criarUsuario('f2', 'FACCAO', 4);
    await criarUsuario('f3', 'FACCAO', 5);
  });

  after(async () => {
    const ids = Object.values(usuarios).map((u) => u.id);
    await prisma.agreement.deleteMany({ where: { demand: { confeccaoId: { in: ids } } } });
    await prisma.notification.deleteMany({ where: { userId: { in: ids } } });
    await prisma.demand.deleteMany({ where: { confeccaoId: { in: ids } } }); // propostas saem em cascata
    await prisma.user.deleteMany({ where: { id: { in: ids } } });
    await prisma.serviceCategory.delete({ where: { id: categoria.id } });
    server.closeAllConnections?.();
    await new Promise((resolve) => server.close(resolve));
    await prisma.$disconnect();
  });

  test('facção envia proposta, recebe o total e a confecção é notificada', async () => {
    const d = await novaDemanda();
    const r = await api('POST', `/api/demandas/${d.id}/propostas`, tokens.f1, {
      price: 25.5,
      deadlineDays: 7,
      message: 'Começo na segunda',
    });
    assert.equal(r.status, 201);
    assert.equal(r.body.status, 'ENVIADA');
    assert.equal(r.body.price, 25.5);
    assert.equal(r.body.totalPrice, 25.5 * QUANTIDADE);
    assert.equal(r.body.deadlineDays, 7);
    assert.equal(r.body.message, 'Começo na segunda');
    assert.equal(await notificacoes(usuarios.confeccao.id, 'NOVA_PROPOSTA', d.id), 1);
  });

  test('rejeita preço e prazo inválidos com 400', async () => {
    const d = await novaDemanda();
    const url = `/api/demandas/${d.id}/propostas`;
    const casos = [
      { price: 0, deadlineDays: 5 },
      { price: -10, deadlineDays: 5 },
      { price: 10, deadlineDays: 0 },
      { price: 10, deadlineDays: 1.5 },
      { deadlineDays: 5 },
      { price: 10 },
    ];
    for (const corpo of casos) {
      const r = await api('POST', url, tokens.f1, corpo);
      assert.equal(r.status, 400, `esperava 400 para ${JSON.stringify(corpo)}`);
    }
    assert.equal(await prisma.proposal.count({ where: { demandId: d.id } }), 0);
  });

  test('confecção e visitante não enviam proposta', async () => {
    const d = await novaDemanda();
    const url = `/api/demandas/${d.id}/propostas`;
    const corpo = { price: 10, deadlineDays: 5 };
    assert.equal((await api('POST', url, tokens.confeccao, corpo)).status, 403);
    assert.equal((await api('POST', url, null, corpo)).status, 401);
  });

  test('segunda proposta da mesma facção na mesma demanda retorna 409', async () => {
    const d = await novaDemanda();
    await proporPara(d.id, 'f1', 10);
    const r = await api('POST', `/api/demandas/${d.id}/propostas`, tokens.f1, {
      price: 9,
      deadlineDays: 5,
    });
    assert.equal(r.status, 409);
    assert.equal(await prisma.proposal.count({ where: { demandId: d.id } }), 1);
  });

  test('demanda inexistente retorna 404', async () => {
    const r = await api(
      'POST',
      '/api/demandas/00000000-0000-4000-8000-000000000000/propostas',
      tokens.f1,
      { price: 10, deadlineDays: 5 },
    );
    assert.equal(r.status, 404);
  });

  test('demanda acordada ou encerrada rejeita nova proposta com 400', async () => {
    for (const status of ['EM_ANDAMENTO', 'ENCERRADA']) {
      const d = await novaDemanda(status);
      const r = await api('POST', `/api/demandas/${d.id}/propostas`, tokens.f1, {
        price: 10,
        deadlineDays: 5,
      });
      assert.equal(r.status, 400, `esperava 400 para demanda ${status}`);
      assert.equal(await prisma.proposal.count({ where: { demandId: d.id } }), 0);
    }
  });

  test('demanda pausada também não recebe novas propostas', async () => {
    const d = await novaDemanda('PAUSADA');
    const r = await api('POST', `/api/demandas/${d.id}/propostas`, tokens.f1, {
      price: 10,
      deadlineDays: 5,
    });
    assert.equal(r.status, 400);
  });

  test('confecção dona lista e ordena as propostas, sem expor telefone', async () => {
    const d = await novaDemanda();
    const p1 = await proporPara(d.id, 'f1', 10, 20);
    const p2 = await proporPara(d.id, 'f2', 12, 5);
    const p3 = await proporPara(d.id, 'f3', 11, 10);
    const url = `/api/demandas/${d.id}/propostas`;

    const padrao = await api('GET', url, tokens.confeccao);
    assert.equal(padrao.status, 200);
    assert.deepEqual(padrao.body.map((p) => p.id), [p1.id, p3.id, p2.id]);
    assert.equal(padrao.body[0].faccao.name, 'Teste f1');

    const porPrazo = await api('GET', `${url}?sort=deadline`, tokens.confeccao);
    assert.deepEqual(porPrazo.body.map((p) => p.id), [p2.id, p3.id, p1.id]);

    const invalido = await api('GET', `${url}?sort=banana`, tokens.confeccao);
    assert.equal(invalido.status, 400);

    for (const f of ['f1', 'f2', 'f3']) {
      assert.ok(!padrao.texto.includes(usuarios[f].phone), 'telefone não pode aparecer na listagem');
    }
  });

  test('só a confecção dona lista as propostas', async () => {
    const d = await novaDemanda();
    await proporPara(d.id, 'f1', 10);
    const url = `/api/demandas/${d.id}/propostas`;
    assert.equal((await api('GET', url, tokens.outra)).status, 403);
    assert.equal((await api('GET', url, tokens.f1)).status, 403);
    assert.equal((await api('GET', url, null)).status, 401);
  });

  test('aceite cria o acordo, recusa as concorrentes e fecha a demanda', async () => {
    const d = await novaDemanda();
    const p1 = await proporPara(d.id, 'f1', 10, 15);
    const p2 = await proporPara(d.id, 'f2', 12, 5);
    const p3 = await proporPara(d.id, 'f3', 11, 10);

    const r = await api('POST', `/api/propostas/${p1.id}/aceite`, tokens.confeccao);
    assert.equal(r.status, 201);
    assert.equal(r.body.proposta.status, 'ACEITA');
    assert.equal(r.body.demanda.status, 'ACORDADA');
    assert.equal(r.body.acordo.status, 'AGUARDANDO_CONFIRMACAO');
    assert.equal(r.body.propostasRecusadas, 2);

    assert.equal(await statusProposta(p1.id), 'ACEITA');
    assert.equal(await statusProposta(p2.id), 'RECUSADA');
    assert.equal(await statusProposta(p3.id), 'RECUSADA');
    assert.equal(await statusDemanda(d.id), 'EM_ANDAMENTO');

    const acordo = await prisma.agreement.findUnique({ where: { demandId: d.id } });
    assert.equal(acordo.proposalId, p1.id);
    assert.equal(acordo.faccaoId, usuarios.f1.id);
    assert.equal(acordo.confeccaoId, usuarios.confeccao.id);
    assert.equal(Number(acordo.price), 10);
    assert.equal(acordo.deadlineDays, 15);
    assert.ok(acordo.dueDate > new Date());

    assert.equal(await notificacoes(usuarios.f1.id, 'PROPOSTA_ACEITA', d.id), 0); // usa agreementId, não demandId
    assert.equal(
      await prisma.notification.count({ where: { userId: usuarios.f1.id, type: 'PROPOSTA_ACEITA' } }) >= 1,
      true,
    );
    assert.equal(await notificacoes(usuarios.f2.id, 'PROPOSTA_RECUSADA', d.id), 1);
    assert.equal(await notificacoes(usuarios.f3.id, 'PROPOSTA_RECUSADA', d.id), 1);
  });

  test('depois do aceite a demanda rejeita novas propostas com 400', async () => {
    const d = await novaDemanda();
    const p = await proporPara(d.id, 'f1', 10);
    await api('POST', `/api/propostas/${p.id}/aceite`, tokens.confeccao);

    const r = await api('POST', `/api/demandas/${d.id}/propostas`, tokens.f2, {
      price: 8,
      deadlineDays: 3,
    });
    assert.equal(r.status, 400);
  });

  test('aceite exige ser a confecção dona e a proposta ainda pendente', async () => {
    const d = await novaDemanda();
    const p = await proporPara(d.id, 'f1', 10);
    const url = `/api/propostas/${p.id}/aceite`;

    assert.equal((await api('POST', url, tokens.outra)).status, 403);
    assert.equal((await api('POST', url, tokens.f1)).status, 403);
    assert.equal((await api('POST', url, null)).status, 401);
    assert.equal(await statusProposta(p.id), 'ENVIADA');

    assert.equal((await api('POST', url, tokens.confeccao)).status, 201);
    assert.equal((await api('POST', url, tokens.confeccao)).status, 409);
    assert.equal(await prisma.agreement.count({ where: { demandId: d.id } }), 1);
  });

  test('proposta inexistente retorna 404 no aceite e na recusa', async () => {
    const id = '00000000-0000-4000-8000-000000000000';
    assert.equal((await api('POST', `/api/propostas/${id}/aceite`, tokens.confeccao)).status, 404);
    assert.equal((await api('POST', `/api/propostas/${id}/recusa`, tokens.confeccao)).status, 404);
  });

  test('confecção aceita proposta feita antes de pausar a demanda', async () => {
    const d = await novaDemanda();
    const p = await proporPara(d.id, 'f1', 10);
    await prisma.demand.update({ where: { id: d.id }, data: { status: 'PAUSADA' } });

    const r = await api('POST', `/api/propostas/${p.id}/aceite`, tokens.confeccao);
    assert.equal(r.status, 201);
    assert.equal(await statusDemanda(d.id), 'EM_ANDAMENTO');
  });

  test('dois aceites simultâneos: só um vence e existe um único acordo', async () => {
    const d = await novaDemanda();
    const p1 = await proporPara(d.id, 'f1', 10);
    const p2 = await proporPara(d.id, 'f2', 11);

    const respostas = await Promise.all([
      api('POST', `/api/propostas/${p1.id}/aceite`, tokens.confeccao),
      api('POST', `/api/propostas/${p2.id}/aceite`, tokens.confeccao),
    ]);
    assert.deepEqual(respostas.map((r) => r.status).sort(), [201, 409]);
    assert.equal(await prisma.agreement.count({ where: { demandId: d.id } }), 1);

    const status = [await statusProposta(p1.id), await statusProposta(p2.id)].sort();
    assert.deepEqual(status, ['ACEITA', 'RECUSADA']);
  });

  test('recusa muda só a proposta, mantém a demanda aberta e notifica a facção', async () => {
    const d = await novaDemanda();
    const p1 = await proporPara(d.id, 'f1', 10);
    const p2 = await proporPara(d.id, 'f2', 11);
    const url = `/api/propostas/${p1.id}/recusa`;

    assert.equal((await api('POST', url, tokens.outra)).status, 403);
    assert.equal((await api('POST', url, tokens.f1)).status, 403);

    const r = await api('POST', url, tokens.confeccao);
    assert.equal(r.status, 200);
    assert.equal(r.body.status, 'RECUSADA');
    assert.equal(await statusProposta(p1.id), 'RECUSADA');
    assert.equal(await statusProposta(p2.id), 'ENVIADA');
    assert.equal(await statusDemanda(d.id), 'RECEBENDO_PROPOSTAS');
    assert.equal(await prisma.agreement.count({ where: { demandId: d.id } }), 0);
    assert.equal(await notificacoes(usuarios.f1.id, 'PROPOSTA_RECUSADA', d.id), 1);

    assert.equal((await api('POST', url, tokens.confeccao)).status, 409);
    assert.equal((await api('POST', `/api/propostas/${p1.id}/aceite`, tokens.confeccao)).status, 409);
  });

  test('facção retira a própria proposta e ela some da comparação', async () => {
    const d = await novaDemanda();
    const p1 = await proporPara(d.id, 'f1', 10);
    const p2 = await proporPara(d.id, 'f2', 11);

    const outra = await api('DELETE', `/api/propostas/${p1.id}`, tokens.f2);
    assert.equal(outra.status, 409);
    const confeccao = await api('DELETE', `/api/propostas/${p1.id}`, tokens.confeccao);
    assert.equal(confeccao.status, 403);

    const ok = await api('DELETE', `/api/propostas/${p1.id}`, tokens.f1);
    assert.equal(ok.status, 204);
    assert.equal(await statusProposta(p1.id), 'RETIRADA');

    const lista = await api('GET', `/api/demandas/${d.id}/propostas`, tokens.confeccao);
    assert.deepEqual(lista.body.map((p) => p.id), [p2.id]);

    const repetida = await api('DELETE', `/api/propostas/${p1.id}`, tokens.f1);
    assert.equal(repetida.status, 409);
  });

  test('facção lista as próprias propostas com a demanda correspondente', async () => {
    const d = await novaDemanda();
    const p = await proporPara(d.id, 'f3', 14, 9);

    const r = await api('GET', '/api/propostas/minhas', tokens.f3);
    assert.equal(r.status, 200);
    const minha = r.body.find((item) => item.id === p.id);
    assert.ok(minha, 'a proposta deveria aparecer na lista');
    assert.equal(minha.demanda.id, d.id);
    assert.equal(minha.demanda.status, 'RECEBENDO_PROPOSTAS');
    assert.ok(r.body.every((item) => item.faccaoId === usuarios.f3.id));

    assert.equal((await api('GET', '/api/propostas/minhas', tokens.confeccao)).status, 403);
  });
});