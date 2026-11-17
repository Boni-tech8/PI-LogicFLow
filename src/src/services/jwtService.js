import '../config/env.js'; // garante que o .env foi carregado
import jwt from 'jsonwebtoken';
import { F } from '../lib/userFields.js';

function segredo() {
  if (!process.env.JWT_SECRET) throw new Error('JWT_SECRET não configurado no .env');
  return process.env.JWT_SECRET;
}

// Claims exigidas pela issue: sub, tipoPerfil, nome.
// id/userId/role/name são aliases para não quebrar rotas antigas.
export function gerarToken(user) {
  return jwt.sign(
    {
      id: user.id,
      userId: user.id,
      tipoPerfil: user[F.role],
      role: user[F.role],
      nome: user[F.name],
      name: user[F.name],
    },
    segredo(),
    { subject: String(user.id), expiresIn: process.env.JWT_EXPIRES_IN ?? '1d', algorithm: 'HS256' },
  );
}

export function decodificarToken(token) {
  return jwt.verify(token, segredo(), { algorithms: ['HS256'] });
}