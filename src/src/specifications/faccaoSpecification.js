export function faccaoSpecification(f, agora = new Date()) {
  const and = [{ user: { status: 'ATIVO' } }];

  if (f.servicoId) and.push({ services: { some: { categoryId: f.servicoId } } });
  if (f.cidade) and.push({ city: { equals: f.cidade, mode: 'insensitive' } });
  if (f.capacidadeMin !== undefined) and.push({ weeklyCapacity: { gte: f.capacidadeMin } });
  if (f.disponivel) {
    and.push({ availability: { some: { status: 'LIVRE', endDate: { gte: agora } } } });
  }

  return { AND: and };
}