import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import * as appModule from '../src/app.js';
import * as prismaModule from '../src/lib/prisma.js';

const app = appModule.app ?? appModule.default;
const prisma = prismaModule.prisma ?? prismaModule.default;

let server, base;
const criados = [];

const post = (body) =>
  fetch(`${base}/tickets`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

const valido = (extra = {}) => ({
  titulo: 'Computador não liga',
  descricao: 'O computador da recepção não liga desde ontem.',
  ...extra,
});

before(() => {
  server = app.listen(0);
  base = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  await prisma.ticket.deleteMany({ where: { id: { in: criados } } });
  await prisma.$disconnect();
  server.close();
});

test('payload válido retorna 201, ID gerado e status ABERTO', async () => {
  const r = await post(valido());
  assert.equal(r.status, 201);
  const body = await r.json();
  criados.push(body.id);

  assert.ok(body.id);
  assert.equal(body.status, 'ABERTO');
  assert.equal(body.prioridade, 'MEDIA');
  assert.equal(body.categoria, 'OUTROS');

  const salvo = await prisma.ticket.findUnique({ where: { id: body.id } });
  assert.equal(salvo.title, 'Computador não liga');
});

test('prioridade e categoria informadas são gravadas', async () => {
  const r = await post(valido({ prioridade: 'ALTA', categoria: 'REDE' }));
  assert.equal(r.status, 201);
  const body = await r.json();
  criados.push(body.id);
  assert.equal(body.prioridade, 'ALTA');
  assert.equal(body.categoria, 'REDE');
});

test('cliente não consegue forçar o status inicial', async () => {
  const r = await post(valido({ status: 'FECHADO' }));
  assert.equal(r.status, 201);
  const body = await r.json();
  criados.push(body.id);
  assert.equal(body.status, 'ABERTO');
});

test('rejeita payload sem título, sem descrição, vazio e enums inválidos', async () => {
  assert.equal((await post({ descricao: 'Descrição suficientemente longa.' })).status, 400);
  assert.equal((await post({ titulo: 'Sem descrição' })).status, 400);
  assert.equal((await post({})).status, 400);
  assert.equal((await post(valido({ prioridade: 'URGENTISSIMA' }))).status, 400);
  assert.equal((await post(valido({ categoria: 'COZINHA' }))).status, 400);
});