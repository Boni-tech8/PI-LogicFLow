// tests/authMiddleware.test.js
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import jwt from 'jsonwebtoken';
import { authMiddleware } from '../src/middleware/authMiddleware.js';

process.env.JWT_SECRET ??= 'segredo-de-teste';

let server, base;

const assinar = (payload = {}, opcoes = {}) =>
  jwt.sign(
    { tipoPerfil: 'FACCAO', nome: 'Fulano', ...payload },
    process.env.JWT_SECRET,
    { subject: '42', expiresIn: '1h', ...opcoes },
  );

const chamar = (authorization) =>
  fetch(`${base}/protegida`, { headers: authorization ? { Authorization: authorization } : {} });

before(() => {
  const app = express();
  app.get('/protegida', authMiddleware, (req, res) => res.json({ user: req.user }));
  server = app.listen(0);
  base = `http://127.0.0.1:${server.address().port}`;
});

after(() => server.close());

test('sem token retorna 401', async () => {
  const r = await chamar();
  assert.equal(r.status, 401);
  assert.equal((await r.json()).message, 'Token não informado.');
});

test('esquema diferente de Bearer ou sem token retorna 401', async () => {
  assert.equal((await chamar('Basic abc123')).status, 401);
  assert.equal((await chamar('Bearer')).status, 401);
  assert.equal((await chamar(`Token ${assinar()}`)).status, 401);
});

test('token malformado retorna 401', async () => {
  assert.equal((await chamar('Bearer lixo')).status, 401);
});

test('assinatura errada retorna 401', async () => {
  const falso = jwt.sign({ tipoPerfil: 'ADMIN' }, 'outro-segredo', { subject: '1' });
  assert.equal((await chamar(`Bearer ${falso}`)).status, 401);
});

test('token expirado retorna 401 com mensagem de expiração', async () => {
  const expirado = assinar({ exp: Math.floor(Date.now() / 1000) - 60 }, { expiresIn: undefined });
  const r = await chamar(`Bearer ${expirado}`);
  assert.equal(r.status, 401);
  assert.equal((await r.json()).message, 'Token expirado.');
});

test('token com alg none retorna 401', async () => {
  const b64 = (o) => Buffer.from(JSON.stringify(o)).toString('base64url');
  const semAssinatura = `${b64({ alg: 'none', typ: 'JWT' })}.${b64({ sub: '1', tipoPerfil: 'ADMIN' })}.`;
  assert.equal((await chamar(`Bearer ${semAssinatura}`)).status, 401);
});

test('token válido libera a rota e injeta o usuário em req.user', async () => {
  const r = await chamar(`Bearer ${assinar()}`);
  assert.equal(r.status, 200);
  const { user } = await r.json();
  assert.equal(user.id, '42');
  assert.equal(user.tipoPerfil, 'FACCAO');
  assert.equal(user.nome, 'Fulano');
});

test('aceita "bearer" em minúsculas', async () => {
  assert.equal((await chamar(`bearer ${assinar()}`)).status, 200);
});

test('sem JWT_SECRET configurado retorna 500, não 401', async () => {
  const token = assinar();
  const guardado = process.env.JWT_SECRET;
  delete process.env.JWT_SECRET;
  try {
    assert.equal((await chamar(`Bearer ${token}`)).status, 500);
  } finally {
    process.env.JWT_SECRET = guardado;
  }
});