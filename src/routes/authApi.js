import { Router } from 'express';
import { cadastroSchema, loginSchema, tokenResponse, usuarioDto } from '../lib/authDto.js';
import * as authService from '../services/authService.js';
import { gerarToken } from '../services/jwtService.js';
import { authenticateJwt } from '../middleware/rbac.js';

const router = Router();

const tratar = (fn) => async (req, res) => {
  try {
    await fn(req, res);
  } catch (e) {
    if (e.status) return res.status(e.status).json({ message: e.message });
    console.error(e);
    res.status(500).json({ message: 'Erro interno do servidor.' });
  }
};

function validar(schema, body, res) {
  const r = schema.safeParse(body);
  if (r.success) return r.data;
  res.status(400).json({
    message: 'Dados inválidos.',
    errors: r.error.issues.map((i) => ({ campo: i.path.join('.'), mensagem: i.message })),
  });
  return null;
}

router.post('/cadastro', tratar(async (req, res) => {
  const dados = validar(cadastroSchema, req.body, res);
  if (!dados) return;
  const user = await authService.cadastrar(dados);
  res.status(201).json(tokenResponse(gerarToken(user), user));
}));

router.post('/login', tratar(async (req, res) => {
  const dados = validar(loginSchema, req.body, res);
  if (!dados) return;
  const { user, token } = await authService.autenticar(dados);
  res.status(200).json(tokenResponse(token, user));
}));

router.get('/me', authenticateJwt, tratar(async (req, res) => {
  const user = await authService.buscarPorId(req.authUser.id);
  if (!user) return res.status(404).json({ message: 'Usuário não encontrado.' });
  res.json(usuarioDto(user));
}));

export default router;