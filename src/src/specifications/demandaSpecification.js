import { statusDbParaApi } from '../dto/demandaDto.js';

const statusApiParaDb = Object.fromEntries(Object.entries(statusDbParaApi).map(([db, api]) => [api, db]));

// Combina os filtros opcionais em um único `where` do Prisma
export function demandaSpecification(f, user) {
  const status = statusApiParaDb[f.status];
  const and = [{ status }];

  if (status === 'RECEBENDO_PROPOSTAS') {
    // vitrine pública: não mostra demandas de contas suspensas
    and.push({ confeccao: { status: 'ATIVO' } });
  } else if (user.role !== 'ADMIN') {
    // estados não ativos só aparecem para quem participa da demanda
    and.push({ OR: [{ confeccaoId: user.id }, { proposals: { some: { faccaoId: user.id } } }] });
  }

  if (f.servicoId) and.push({ categoryId: f.servicoId });
  if (f.cidade) and.push({ city: { equals: f.cidade, mode: 'insensitive' } });
  if (f.quantidadeMin !== undefined || f.quantidadeMax !== undefined) {
    and.push({ quantity: { gte: f.quantidadeMin, lte: f.quantidadeMax } });
  }
  if (f.prazoMax) and.push({ deadline: { lte: f.prazoMax } });
  if (f.q) and.push({ title: { contains: f.q, mode: 'insensitive' } });

  return { AND: and };
}