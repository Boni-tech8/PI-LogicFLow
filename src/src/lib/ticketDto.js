import { z } from 'zod';

export const PRIORIDADES = ['BAIXA', 'MEDIA', 'ALTA', 'CRITICA'];
export const CATEGORIAS = ['HARDWARE', 'SOFTWARE', 'REDE', 'ACESSO', 'OUTROS'];

export const ticketSchema = z.object({
  titulo: z
    .string({ message: 'Título é obrigatório.' })
    .trim()
    .min(3, 'O título deve ter no mínimo 3 caracteres.')
    .max(150, 'O título deve ter no máximo 150 caracteres.'),
  descricao: z
    .string({ message: 'Descrição é obrigatória.' })
    .trim()
    .min(10, 'A descrição deve ter no mínimo 10 caracteres.')
    .max(2000, 'A descrição deve ter no máximo 2000 caracteres.'),
  prioridade: z.enum(PRIORIDADES, { message: `Prioridade deve ser: ${PRIORIDADES.join(', ')}.` }).default('MEDIA'),
  categoria: z.enum(CATEGORIAS, { message: `Categoria deve ser: ${CATEGORIAS.join(', ')}.` }).default('OUTROS'),
});

export const ticketResponse = (t) => ({
  id: t.id,
  titulo: t.title,
  descricao: t.description,
  prioridade: t.priority,
  categoria: t.category,
  status: t.status,
  criadoEm: t.createdAt,
});