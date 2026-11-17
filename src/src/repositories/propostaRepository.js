import { prisma } from '../lib/prisma.js';

export const PENDENTE = 'ENVIADA'; // proposta aguardando resposta
export const ACEITA = 'ACEITA';
export const RECUSADA = 'RECUSADA';
export const RETIRADA = 'RETIRADA';

const ORDEM = {
  price: [{ price: 'asc' }, { id: 'asc' }],
  deadline: [{ deadlineDays: 'asc' }, { price: 'asc' }, { id: 'asc' }],
  recent: [{ createdAt: 'desc' }, { id: 'asc' }],
};

export const buscarDemanda = (id, db = prisma) =>
  db.demand.findUnique({
    where: { id },
    select: { id: true, code: true, confeccaoId: true, status: true, quantity: true },
  });

export const buscarDemandas = (ids, db = prisma) =>
  db.demand.findMany({
    where: { id: { in: ids } },
    select: { id: true, code: true, title: true, status: true, quantity: true },
  });

export const buscarProposta = (id, db = prisma) => db.proposal.findUnique({ where: { id } });

export const buscarDaFaccao = (demandId, faccaoId, db = prisma) =>
  db.proposal.findFirst({ where: { demandId, faccaoId }, select: { id: true } });

export const criar = (data, db = prisma) => db.proposal.create({ data });

// Propostas retiradas pela facção não aparecem na comparação
export const listarDaDemanda = (demandId, sort, db = prisma) =>
  db.proposal.findMany({
    where: { demandId, status: { not: RETIRADA } },
    orderBy: ORDEM[sort],
  });

export const listarDaFaccao = (faccaoId, db = prisma) =>
  db.proposal.findMany({ where: { faccaoId }, orderBy: { createdAt: 'desc' } });

export const buscarFaccoes = (ids, db = prisma) =>
  db.user.findMany({
    where: { id: { in: ids } },
    select: {
      id: true,
      name: true,
      verified: true,
      faccao: { select: { companyName: true, city: true, weeklyCapacity: true } },
    },
  });