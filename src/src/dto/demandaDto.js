import { z } from 'zod';

// A API fala "ABERTA"; no banco o estado se chama RECEBENDO_PROPOSTAS
export const statusApiParaDb = {
  ABERTA: 'RECEBENDO_PROPOSTAS',
  PAUSADA: 'PAUSADA',
  ENCERRADA: 'ENCERRADA',
};

export const statusDbParaApi = {
  RECEBENDO_PROPOSTAS: 'ABERTA',
  PAUSADA: 'PAUSADA',
  EM_ANDAMENTO: 'EM_ANDAMENTO',
  CONCLUIDA: 'CONCLUIDA',
  ENCERRADA: 'ENCERRADA',
};

// Equivalente ao @Future: estritamente depois de agora
const prazoLimite = z.coerce
  .date({ errorMap: () => ({ message: 'Prazo limite inválido. Use o formato AAAA-MM-DD' }) })
  .refine((d) => d.getTime() > Date.now(), { message: 'O prazo limite deve ser uma data futura' });

const camposDemanda = {
  categoryId: z.number({ required_error: 'O tipo de serviço é obrigatório' }).int().positive(),
  title: z.string().trim().min(3).max(120),
  description: z.string().trim().max(2000).optional(),
  quantity: z
    .number({ required_error: 'A quantidade de peças é obrigatória' })
    .int()
    .positive({ message: 'A quantidade de peças deve ser maior que zero' }),
  deadline: prazoLimite,
  city: z.string().trim().min(2, 'A cidade é obrigatória'),
  photos: z.array(z.string().url()).max(5).default([]),
};

export const novaDemandaDTO = z.object(camposDemanda);
export const atualizarDemandaDTO = z.object(camposDemanda); // PUT: substituição completa
export const alterarStatusDTO = z.object({ status: z.enum(['ABERTA', 'PAUSADA', 'ENCERRADA']) });

export const filtrosListagemDTO = z.object({
  serviceId: z.coerce.number().int().optional(),
  city: z.string().optional(),
  minQty: z.coerce.number().int().optional(),
  maxQty: z.coerce.number().int().optional(),
  deadlineBefore: z.coerce.date().optional(),
  q: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(20),
});

// DemandaDetalheDTO: nunca expõe telefone (RNF05)
export function toDemandaDetalheDTO(d, minhaProposta) {
  return {
    id: d.id,
    code: d.code,
    title: d.title,
    description: d.description,
    quantity: d.quantity,
    deadline: d.deadline,
    city: d.city,
    photos: d.photos,
    status: statusDbParaApi[d.status],
    category: d.category,
    confeccao: {
      id: d.confeccao.id,
      name: d.confeccao.name,
      companyName: d.confeccao.confeccao?.companyName ?? null,
    },
    proposalsCount: d._count.proposals,
    createdAt: d.createdAt,
    updatedAt: d.updatedAt,
    ...(minhaProposta !== undefined && { myProposal: minhaProposta }),
  };
}