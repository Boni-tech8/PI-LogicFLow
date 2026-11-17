import { prisma } from '../lib/prisma.js';

export const demandaSelect = {
  id: true, code: true, title: true, description: true, quantity: true, deadline: true,
  city: true, photos: true, status: true, createdAt: true, updatedAt: true,
  category: true,
  confeccao: { select: { id: true, name: true, confeccao: { select: { companyName: true, city: true } } } },
  _count: { select: { proposals: true } },
};

// Códigos no formato DM-2026-001
export async function proximoCodigo(db = prisma) {
  const year = new Date().getFullYear();
  const c = await db.demandCounter.upsert({
    where: { year },
    update: { last: { increment: 1 } },
    create: { year, last: 1 },
  });
  return `DM-${year}-${String(c.last).padStart(3, '0')}`;
}

export const categoriaAtiva = (id, db = prisma) =>
  db.serviceCategory.findFirst({ where: { id, active: true } });

export async function idsFaccoesDaCategoria(categoryId, db = prisma) {
  const rows = await db.faccaoProfile.findMany({
    where: { services: { some: { categoryId } }, user: { status: 'ATIVO' } },
    select: { userId: true },
  });
  return rows.map((r) => r.userId);
}

export const criar = (data, db = prisma) => db.demand.create({ data, select: demandaSelect });

export const buscarPorId = (id, db = prisma) =>
  db.demand.findUnique({ where: { id }, select: demandaSelect });

// Dados mínimos para as regras de negócio (dono, estado, acordo, proposta aceita)
export const buscarComVinculos = (id, db = prisma) =>
  db.demand.findUnique({
    where: { id },
    select: {
      id: true, confeccaoId: true, status: true, categoryId: true, quantity: true,
      agreement: { select: { id: true } },
      _count: { select: { proposals: { where: { status: 'ACEITA' } } } },
    },
  });

export const propostaDaFaccao = (demandId, faccaoId, db = prisma) =>
  db.proposal.findUnique({ where: { demandId_faccaoId: { demandId, faccaoId } } });

export const listarPorConfeccao = (confeccaoId, db = prisma) =>
  db.demand.findMany({ where: { confeccaoId }, orderBy: { createdAt: 'desc' }, select: demandaSelect });

export async function listarAbertas(f, db = prisma) {
  const where = { status: 'RECEBENDO_PROPOSTAS' };
  if (f.serviceId) where.categoryId = f.serviceId;
  if (f.city) where.city = { equals: f.city, mode: 'insensitive' };
  if (f.minQty || f.maxQty) where.quantity = { gte: f.minQty, lte: f.maxQty };
  if (f.deadlineBefore) where.deadline = { lte: f.deadlineBefore };
  if (f.q) where.title = { contains: f.q, mode: 'insensitive' };

  return Promise.all([
    db.demand.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (f.page - 1) * f.pageSize,
      take: f.pageSize,
      select: demandaSelect,
    }),
    db.demand.count({ where }),
  ]);
}

// Atualização condicionada ao estado atual: evita corrida com o aceite de uma proposta
export async function atualizar(id, data, statusPermitidos, db = prisma) {
  const { count } = await db.demand.updateMany({
    where: { id, status: { in: statusPermitidos } },
    data,
  });
  return count ? buscarPorId(id, db) : null;
}

export async function transicionarStatus(id, de, para, db = prisma) {
  const { count } = await db.demand.updateMany({
    where: { id, status: { in: de } },
    data: { status: para },
  });
  return count === 1;
}

export const recusarPropostasEnviadas = (demandId, db = prisma) =>
  db.proposal.updateMany({ where: { demandId, status: 'ENVIADA' }, data: { status: 'RECUSADA' } });