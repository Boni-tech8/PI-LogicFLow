import { prisma } from '../lib/prisma.js';
import { demandaSelect } from './demandaRepository.js';

const faccaoSelect = {
  userId: true,
  companyName: true,
  city: true,
  weeklyCapacity: true,
  photos: true,
  user: { select: { name: true, verified: true } },
  services: { select: { category: true } },
};

// Página e total na mesma ida ao banco
export function buscarDemandas({ where, orderBy, skip, take }, db = prisma) {
  return Promise.all([
    db.demand.findMany({ where, orderBy, skip, take, select: demandaSelect }),
    db.demand.count({ where }),
  ]);
}

export function buscarFaccoes({ where, orderBy, skip, take }, db = prisma) {
  return Promise.all([
    db.faccaoProfile.findMany({ where, orderBy, skip, take, select: faccaoSelect }),
    db.faccaoProfile.count({ where }),
  ]);
}