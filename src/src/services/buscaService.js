import { reputationMany } from '../lib/reputation.js';
import { paginar, parseSort } from '../lib/pagination.js';
import { toDemandaDetalheDTO } from '../dto/demandaDto.js';
import { toFaccaoResumoDTO } from '../dto/buscaDto.js';
import { demandaSpecification } from '../specifications/demandaSpecification.js';
import { faccaoSpecification } from '../specifications/faccaoSpecification.js';
import * as repo from '../repositories/buscaRepository.js';

const CAMPOS_DEMANDA = {
  criacao: (d) => ({ createdAt: d }),
  prazo: (d) => ({ deadline: d }),
  quantidade: (d) => ({ quantity: d }),
};

const CAMPOS_FACCAO = {
  nome: (d) => ({ user: { name: d } }),
  capacidade: (d) => ({ weeklyCapacity: d }),
  cidade: (d) => ({ city: d }),
};

export async function buscarDemandas(user, filtros) {
  const { page, size, sort } = filtros;
  const [items, total] = await repo.buscarDemandas({
    where: demandaSpecification(filtros, user),
    orderBy: parseSort(sort, CAMPOS_DEMANDA, 'criacao,desc', { id: 'asc' }),
    skip: (page - 1) * size,
    take: size,
  });
  return paginar(items.map((d) => toDemandaDetalheDTO(d)), total, page, size);
}

export async function buscarFaccoes(filtros) {
  const { page, size, sort } = filtros;
  const [lista, total] = await repo.buscarFaccoes({
    where: faccaoSpecification(filtros),
    orderBy: parseSort(sort, CAMPOS_FACCAO, 'nome,asc', { userId: 'asc' }),
    skip: (page - 1) * size,
    take: size,
  });
  const reputacoes = await reputationMany(lista.map((f) => f.userId));
  return paginar(
    lista.map((f) => toFaccaoResumoDTO(f, reputacoes.get(f.userId))),
    total,
    page,
    size,
  );
}