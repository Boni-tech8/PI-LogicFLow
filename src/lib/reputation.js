import { prisma } from './prisma.js';

// RF18 / RN07: média das avaliações e taxa de entregas no prazo.
// Fórmula adotada (a definir com a turma): concluídos no prazo / total concluídos.
export async function reputation(userId) {
  const [reviews, done, onTime] = await Promise.all([
    prisma.review.aggregate({
      where: { targetId: userId, hidden: false },
      _avg: { rating: true },
      _count: true,
    }),
    prisma.agreement.count({ where: { faccaoId: userId, status: 'CONCLUIDO' } }),
    prisma.agreement.count({ where: { faccaoId: userId, status: 'CONCLUIDO', completedOnTime: true } }),
  ]);
  return {
    avgRating: reviews._avg.rating ? Number(reviews._avg.rating.toFixed(2)) : null,
    reviewsCount: reviews._count,
    completedServices: done,
    onTimeRate: done ? Number((onTime / done).toFixed(2)) : null,
  };
}
  // Versão em lote: 3 queries para qualquer quantidade de facções
export async function reputationMany(userIds) {
  const ids = [...new Set(userIds)];
  const result = new Map(
    ids.map((id) => [id, { avgRating: null, reviewsCount: 0, completedServices: 0, onTimeRate: null }]),
  );
  if (!ids.length) return result;

  const [reviews, done, onTime] = await Promise.all([
    prisma.review.groupBy({
      by: ['targetId'],
      where: { targetId: { in: ids }, hidden: false },
      _avg: { rating: true },
      _count: { _all: true },
    }),
    prisma.agreement.groupBy({
      by: ['faccaoId'],
      where: { faccaoId: { in: ids }, status: 'CONCLUIDO' },
      _count: { _all: true },
    }),
    prisma.agreement.groupBy({
      by: ['faccaoId'],
      where: { faccaoId: { in: ids }, status: 'CONCLUIDO', completedOnTime: true },
      _count: { _all: true },
    }),
  ]);

  for (const r of reviews) {
    const x = result.get(r.targetId);
    x.avgRating = r._avg.rating === null ? null : Number(r._avg.rating.toFixed(2));
    x.reviewsCount = r._count._all;
  }
  const noPrazo = new Map(onTime.map((r) => [r.faccaoId, r._count._all]));
  for (const r of done) {
    const x = result.get(r.faccaoId);
    x.completedServices = r._count._all;
    x.onTimeRate = Number(((noPrazo.get(r.faccaoId) ?? 0) / r._count._all).toFixed(2));
  }
  return result;
}
