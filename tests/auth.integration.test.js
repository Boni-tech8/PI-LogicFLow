import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import * as appModule from '../src/app.js';
import * as prismaModule from '../src/lib/prisma.js';
import { decodificarToken } from '../src/services/jwtService.js';
import { authorize } from '../src/middleware/rbac.js';
import { F } from '../src/lib/userFields.js';

const app = appModule.app ?? appModule.default;
const prisma = prismaModule.prisma ?? prismaModule.default;

process.env.JWT_SECRET ??= 'segredo-de-teste';

let server, base;
const criados = [];

const d = (n) => String(Math.floor(Math.random() * 10 ** n)).padStart(n, '0');
const novoTelefone = () => `(81) 9${d(4)}-${d(4)}`;
const digitos = (t) => t.replace(/\D/g, '');

const post = (path, body) =>
  fetch(`${base}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

const corpo = (extra = {}) => ({
  nome: 'Teste Auth',
  telefone: novoTelefone(),
  senha: 'senha123',
  tipoPerfil: 'CONFECCAO',
  consentimentoLgpd: true,
  ...extra,
});

before(() => {
  server = app.listen(0);
  base = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  await prisma.user.deleteMany({ where: { [F.phone]: { in: criados } } });
  await prisma.$disconnect();
  server.close();
});

test('cenário 1: cadastro e login com sucesso retornam JWT com a role', async () => {
  const dados = corpo({ tipoPerfil: 'FACCAO' });
  criados.push(digitos(dados.telefone));

  assert.equal((await post('/api/auth/cadastro', dados)).status, 201);

  const l = await post('/api/auth/login', { telefone: dados.telefone, senha: dados.senha });
  assert.equal(l.status, 200);
  const { token, tipo } = await l.json();
  assert.equal(tipo, 'Bearer');

  const claims = decodificarToken(token);
  assert.equal(claims.tipoPerfil, 'FACCAO');
  assert.equal(claims.nome, 'Teste Auth');
  assert.ok(claims.sub);
});

test('cenário 2: telefone duplicado retorna 409 com a mensagem esperada', async () => {
  const dados = corpo();
  criados.push(digitos(dados.telefone));
  assert.equal((await post('/api/auth/cadastro', dados)).status, 201);

  // mesmo número com formatação diferente também é duplicado
  const outra = await post('/api/auth/cadastro', { ...dados, telefone: digitos(dados.telefone) });
  assert.equal(outra.status, 409);
  assert.equal((await outra.json()).message, 'Número de telefone já cadastrado.');
});

test('rejeita telefone inválido, senha curta, ADMIN e falta de consentimento', async () => {
  assert.equal((await post('/api/auth/cadastro', corpo({ telefone: '123' }))).status, 400);
  assert.equal((await post('/api/auth/cadastro', corpo({ senha: '12345' }))).status, 400);
  assert.equal((await post('/api/auth/cadastro', corpo({ tipoPerfil: 'ADMIN' }))).status, 400);
  assert.equal((await post('/api/auth/cadastro', corpo({ consentimentoLgpd: false }))).status, 400);
});

test('login com senha errada ou telefone inexistente retorna 401', async () => {
  const dados = corpo();
  criados.push(digitos(dados.telefone));
  await post('/api/auth/cadastro', dados);

  assert.equal((await post('/api/auth/login', { telefone: dados.telefone, senha: 'errada123' })).status, 401);
  assert.equal((await post('/api/auth/login', { telefone: novoTelefone(), senha: 'senha123' })).status, 401);
});

test('senha é salva com hash BCrypt', async () => {
  const dados = corpo();
  criados.push(digitos(dados.telefone));
  await post('/api/auth/cadastro', dados);

  const user = await prisma.user.findFirst({ where: { [F.phone]: digitos(dados.telefone) } });
  assert.notEqual(user[F.passwordHash], dados.senha);
  assert.match(user[F.passwordHash], /^\$2[aby]\$/);
});

test('GET /me exige token e não expõe o hash', async () => {
  assert.equal((await fetch(`${base}/api/auth/me`)).status, 401);
  assert.equal(
    (await fetch(`${base}/api/auth/me`, { headers: { Authorization: 'Bearer lixo' } })).status,
    401,
  );

  const dados = corpo();
  criados.push(digitos(dados.telefone));
  const { token } = await (await post('/api/auth/cadastro', dados)).json();

  const r = await fetch(`${base}/api/auth/me`, { headers: { Authorization: `Bearer ${token}` } });
  assert.equal(r.status, 200);
  const me = await r.json();
  assert.equal(me.tipoPerfil, 'CONFECCAO');
  assert.equal(me.passwordHash, undefined);
});

test('authorize bloqueia perfil não permitido (403) e libera o permitido', () => {
  const res = { status(c) { this.code = c; return this; }, json() { return this; } };
  let passou = false;

  authorize('ADMIN')({ authUser: { tipoPerfil: 'FACCAO' } }, res, () => { passou = true; });
  assert.equal(res.code, 403);
  assert.equal(passou, false);

  authorize('ADMIN')({ authUser: { tipoPerfil: 'ADMIN' } }, res, () => { passou = true; });
  assert.equal(passou, true);
});