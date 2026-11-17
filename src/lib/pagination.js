import { AppError } from './errors.js';

// sort=campo,asc|desc. `campos` mapeia o nome público para o orderBy do Prisma.
// O desempate garante uma ordem estável entre as páginas.
export function parseSort(sort, campos, padrao, desempate) {
  const [campo, direcao = 'asc'] = (sort ?? padrao).split(',').map((s) => s.trim());
  const dir = direcao.toLowerCase();
  if (!Object.hasOwn(campos, campo) || !['asc', 'desc'].includes(dir)) {
    throw new AppError(
      400,
      `Ordenação inválida. Use sort=campo,asc|desc com um destes campos: ${Object.keys(campos).join(', ')}`,
    );
  }
  return [campos[campo](dir), desempate];
}

export const paginar = (items, total, page, size) => ({
  items,
  total,
  page,
  size,
  totalPages: Math.ceil(total / size),
});