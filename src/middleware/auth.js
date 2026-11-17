import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { prisma } from '../lib/prisma.js';
import { AppError } from '../lib/errors.js';

export async function authenticate(req, res, next) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) throw new AppError(401, 'Não autenticado');

  let payload;
  try {
    payload = jwt.verify(header.slice(7), env.JWT_SECRET);
  } catch {
    throw new AppError(401, 'Token inválido ou expirado');
  }

  const user = await prisma.user.findUnique({ where: { id: payload.sub } });
  if (!user) throw new AppError(401, 'Usuário não encontrado');
  if (user.status !== 'ATIVO') throw new AppError(403, 'Conta suspensa');

  req.user = user;
  next();
}

// RNF06: controle de acesso por perfil
export const requireRole = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) throw new AppError(403, 'Sem permissão para esta ação');
  next();
};
