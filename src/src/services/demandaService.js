import { prisma } from '../lib/prisma.js';
import { AppError } from '../lib/errors.js';
import { notifyMany } from '../lib/notify.js';
import * as repo from '../repositories/demandaRepository.js';
import { statusApiParaDb, statusDbParaApi, toDemandaDetalheDTO } from '../dto/demandaDto.js';

const STATUS_ABERTOS = ['RECEBENDO_PROPOSTAS', 'PAUSADA'];
const STATUS_EDITAVEIS = [...STATUS_ABERTOS, 'EM_ANDAMENTO'];

// Estados de origem permitidos para cada estado de destino
const ORIGENS = {
  RECEBENDO_PROPOSTAS: ['PAUSADA'],
  PAUSADA: ['RECEBENDO_PROPOSTAS'],
  ENCERRADA: ['RECEBENDO_PROPOSTAS', 'PAUSADA'],
};

async function carregarPropria(user, id) {
  const d = await repo.buscarComVinculos(id);
  if (!d || d.confeccaoId !== user.id) throw new AppError(404, 'Demanda não encontrada');
  return d;
}

export async function publicar(user, dto) {
  const categoria = await repo.categoriaAtiva(dto.categoryId);
  if (!categoria) throw new AppError(400, 'Tipo de serviço inválido');

  const demanda = await prisma.$transaction(async (tx) => {
    const code = await repo.proximoCodigo(tx);
    const criada = await repo.criar({ ...dto, code, confeccaoId: user.id }, tx);

    // Facções que oferecem o serviço são notificadas
    const faccoes = await repo.idsFaccoesDaCategoria(dto.categoryId, tx);
    await notifyMany(
      tx, faccoes, 'NOVA_DEMANDA', 'Nova demanda disponível',
      `${code}: ${categoria.name} – ${dto.quantity} peças em ${dto.city}`,
      { demandId: criada.id },
    );
    return criada;
  });
  return toDemandaDetalheDTO(demanda);
}

export async function detalhar(user, id) {
  const d = await repo.buscarPorId(id);
  if (!d) throw new AppError(404, 'Demanda não encontrada');
  const minhaProposta = user.role === 'FACCAO' ? await repo.propostaDaFaccao(id, user.id) : undefined;
  return toDemandaDetalheDTO(d, minhaProposta);
}

export async function editar(user, id, dto) {
  const atual = await carregarPropria(user, id);
  if (!STATUS_EDITAVEIS.includes(atual.status)) {
    throw new AppError(409, 'Demanda encerrada ou concluída não pode ser editada');
  }

  const mudouServico = dto.categoryId !== atual.categoryId;
  const estrutural = mudouServico || dto.quantity !== atual.quantity;
  const comAcordo = atual.agreement !== null || atual._count.proposals > 0;
  if (estrutural && comAcordo) {
    throw new AppError(409, 'Quantidade e serviço não podem ser alterados após proposta aceita ou acordo firmado');
  }
  if (mudouServico && !(await repo.categoriaAtiva(dto.categoryId))) {
    throw new AppError(400, 'Tipo de serviço inválido');
  }

  const atualizada = await repo.atualizar(
    id,
    { ...dto, description: dto.description ?? null },
    estrutural ? STATUS_ABERTOS : STATUS_EDITAVEIS,
  );
  if (!atualizada) throw new AppError(409, 'A demanda mudou de estado. Recarregue e tente novamente');
  return toDemandaDetalheDTO(atualizada);
}

export async function alterarStatus(user, id, statusApi) {
  const atual = await carregarPropria(user, id);
  const destino = statusApiParaDb[statusApi];
  const origens = ORIGENS[destino];

  if (!origens.includes(atual.status)) {
    throw new AppError(409, `Não é possível mudar de ${statusDbParaApi[atual.status]} para ${statusApi}`);
  }

  await prisma.$transaction(async (tx) => {
    const ok = await repo.transicionarStatus(id, origens, destino, tx);
    if (!ok) throw new AppError(409, 'A demanda mudou de estado. Recarregue e tente novamente');
    if (destino === 'ENCERRADA') await repo.recusarPropostasEnviadas(id, tx);
  });
  return toDemandaDetalheDTO(await repo.buscarPorId(id));
}

export async function listarMinhas(user) {
  const lista = await repo.listarPorConfeccao(user.id);
  return lista.map((d) => toDemandaDetalheDTO(d));
}

export async function listarAbertas(filtros) {
  const [items, total] = await repo.listarAbertas(filtros);
  return {
    items: items.map((d) => toDemandaDetalheDTO(d)),
    total,
    page: filtros.page,
    pageSize: filtros.pageSize,
  };
}