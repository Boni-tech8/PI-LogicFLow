import * as prismaModule from '../lib/prisma.js';

// funciona se o prisma.js exporta "prisma" nomeado ou como default
const prisma = prismaModule.prisma ?? prismaModule.default;

export async function criarTicket(dados) {
  return prisma.ticket.create({
    data: {
      title: dados.titulo,
      description: dados.descricao,
      priority: dados.prioridade,
      category: dados.categoria,
      status: 'ABERTO', // status inicial fixo, nunca vem do cliente
    },
  });
}