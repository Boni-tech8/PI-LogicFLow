import { AppError } from './errors.js';

// Guarda sempre no formato 55 + DDD + número (somente dígitos)
export function normalizePhone(raw) {
  const digits = String(raw ?? '').replace(/\D/g, '');
  const full = digits.length === 10 || digits.length === 11 ? `55${digits}` : digits;
  if (!/^55\d{10,11}$/.test(full)) throw new AppError(400, 'Telefone inválido');
  return full;
}
