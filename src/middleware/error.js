import { ZodError } from 'zod';
import { AppError } from '../lib/errors.js';

export function errorHandler(err, req, res, next) {
  if (err instanceof ZodError) {
    return res.status(400).json({
      error: 'Dados inválidos',
      details: err.issues.map((i) => ({ campo: i.path.join('.'), mensagem: i.message })),
    });
  }
  if (err instanceof AppError) return res.status(err.status).json({ error: err.message });
  if (err.code === 'P2002') return res.status(409).json({ error: 'Registro já existe ou conflito de estado' });
  if (err.name === 'MulterError') return res.status(400).json({ error: err.message });
  console.error(err);
  res.status(500).json({ error: 'Erro interno do servidor' });
}
