import { z } from 'zod';
import { statusDbParaApi } from './demandaDto.js';

export const novaPropostaDTO = z.object({
  price: z
    .number({
      required_error: 'Informe o preço unitário',
      invalid_type_error: 'O preço unitário deve ser um número',
    })
    .positive('O preço unitário deve ser maior que zero')
    .max(100000, 'O preço unitário não pode passar de R$ 100.000,00'),
  deadlineDays: z
    .number({
      required_error: 'Informe o prazo em dias',
      invalid_type_error: 'O prazo deve ser um número de dias',
    })
    .int('O prazo deve ser um número inteiro de dias')
    .min(1, 'O prazo deve ser de no mínimo 1 dia')
    .max(365, 'O prazo não pode passar de 365 dias'),
  message: z.string().trim().max(500, 'As observações devem ter no máximo 500 caracteres').optional(),
});

export const listarPropostasDTO = z.object({
  sort: z.enum(['price', 'deadline', 'recent']).default('price'),
});

// `quantity` é a quantidade da demanda, usada no preço total
export function toPropostaDTO(p, quantity) {
  const price = Number(p.price);
  return {
    id: p.id,
    demandId: p.demandId,
    faccaoId: p.faccaoId,
    status: p.status,
    price,
    totalPrice: Number((price * quantity).toFixed(2)),
    deadlineDays: p.deadlineDays,
    message: p.message ?? null,
    createdAt: p.createdAt,
  };
}

// Versão para a confecção comparar propostas. Nunca expõe telefone (RNF05).
export function toPropostaComFaccaoDTO(p, quantity, usuario, reputation) {
  return {
    ...toPropostaDTO(p, quantity),
    faccao: {
      id: usuario.id,
      name: usuario.name,
      verified: usuario.verified,
      companyName: usuario.faccao?.companyName ?? null,
      city: usuario.faccao?.city ?? null,
      weeklyCapacity: usuario.faccao?.weeklyCapacity ?? 0,
      reputation,
    },
  };
}

export const statusDemandaApi = (statusDb) => statusDbParaApi[statusDb];