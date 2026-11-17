import { z } from 'zod';
import { F } from './userFields.js';

// Regex da issue (padrão brasileiro)
const TELEFONE_BR = /^|$?[1-9]{2}$|? ?(?:[2-8]|9[0-9])[0-9]{3}-?[0-9]{4}$/;

export const soDigitos = (t) => String(t).replace(/\D/g, '');

// Variações em que o telefone pode estar salvo (com ou sem código do país)
export function variantesTelefone(telefone) {
  let d = soDigitos(telefone);
  if (d.startsWith('55') && d.length >= 12) d = d.slice(2);
  return { nacional: d, todas: [d, `55${d}`, `+55${d}`] };
}

const telefone = z
  .string()
  .trim()
  .regex(TELEFONE_BR, 'Telefone inválido. Use o padrão brasileiro, ex.: (81) 98765-4321.');

export const cadastroSchema = z.object({
  nome: z.string().trim().min(2, 'Nome é obrigatório.'),
  telefone,
  senha: z.string().min(6, 'A senha deve ter no mínimo 6 caracteres.'),
  // ADMIN fica de fora de propósito: é criado pelo seed (RN08)
  tipoPerfil: z.enum(['CONFECCAO', 'FACCAO'], {
    message: 'Perfil deve ser CONFECCAO ou FACCAO.',
  }),
  // RN01 / LGPD: consentimento explícito
  consentimentoLgpd: z.literal(true, {
    message: 'É necessário aceitar o termo de consentimento (LGPD).',
  }),
});

export const loginSchema = z.object({
  telefone,
  senha: z.string().min(1, 'Senha é obrigatória.'),
});

export const tokenResponse = (token, user) => ({
  token,
  tipo: 'Bearer',
  expiraEm: process.env.JWT_EXPIRES_IN ?? '1d',
  usuario: { id: user.id, nome: user[F.name], tipoPerfil: user[F.role] },
});

// Nunca devolve o hash da senha
export const usuarioDto = (user) => ({
  id: user.id,
  nome: user[F.name],
  telefone: user[F.phone],
  tipoPerfil: user[F.role],
});