import { prisma } from '../lib/prisma.js';
import { AppError } from '../lib/errors.js';
import { notify, notifyMany } from '../lib/notify.js';
import { reputationMany } from '../lib/reputation.js';
import { toPropostaDTO, toPropostaComFaccaoDTO, statusDemandaApi } from '../dto/propostaDto.js';
import * as repo from '../repositories/propostaRepository.js';

const { PENDENTE, ACEITA, RECUSADA, RETIRADA } = repo;

// A confecção pode aceitar com a demanda aberta ou pausada
const ACEITAVEIS = ['RECEBENDO_PROPOSTAS', 'PAUSADA'];

const addDias = (data, n) => new Date(data.getTime() + n * 86_400_000);

function exigirDemanda(demanda) {
  if (!demanda) throw new AppError(404, 'Demanda não encontrada.');
  return demanda;
}

function exigirDono(demanda, user) {
  if (demanda.confeccaoId !== user.id) {
    throw new AppError(403, 'Apenas a confecção dona da demanda pode fazer isso.');
  }
}

export async function enviar(user, demandaId, dados) {
  try {
    return await prisma.$transaction(async (tx) => {
      const demanda = exigirDemanda(await repo.buscarDemanda(demandaId, tx));

      // Escrita sem efeito que trava a linha da demanda. Se um aceite estiver em andamento,
      // esta transação espera, reavalia o status e recusa a proposta tardia.
      const aberta = await tx.demand.updateMany({
        where: { id: demanda.id, status: 'RECEBENDO_PROPOSTAS' },
        data: { status: 'RECEBENDO_PROPOSTAS' },
      });
      if (aberta.count === 0) throw new AppError(400, 'Esta demanda não aceita novas propostas.');

      if (await repo.buscarDaFaccao(demanda.id, user.id, tx)) {
        throw new AppError(409, 'Você já enviou uma proposta para esta demanda.');
      }

      const proposta = await repo.criar(
        {
          demandId: demanda.id,
          faccaoId: user.id,
          price: dados.price,
          deadlineDays: dados.deadlineDays,
          message: dados.message,
          status: PENDENTE,
        },
        tx,
      );

      await notify(
        tx,
        demanda.confeccaoId,
        'NOVA_PROPOSTA',
        'Nova proposta recebida',
        `${demanda.code}: proposta de R$ ${dados.price.toFixed(2)} em ${dados.deadlineDays} dias`,
        { demandId: demanda.id, proposalId: proposta.id },
      );
      return toPropostaDTO(proposta, demanda.quantity);
    });
  } catch (e) {
    if (e.code === 'P2002') throw new AppError(409, 'Você já enviou uma proposta para esta demanda.');
    throw e;
  }
}

export async function listarDaDemanda(user, demandaId, sort) {
  const demanda = exigirDemanda(await repo.buscarDemanda(demandaId));
  exigirDono(demanda, user);

  const propostas = await repo.listarDaDemanda(demanda.id, sort);
  const ids = propostas.map((p) => p.faccaoId);
  const [usuarios, reputacoes] = await Promise.all([repo.buscarFaccoes(ids), reputationMany(ids)]);
  const porId = new Map(usuarios.map((u) => [u.id, u]));

  return propostas.map((p) =>
    toPropostaComFaccaoDTO(p, demanda.quantity, porId.get(p.faccaoId), reputacoes.get(p.faccaoId)),
  );
}

export async function aceitar(user, propostaId) {
  return prisma.$transaction(async (tx) => {
    const proposta = await repo.buscarProposta(propostaId, tx);
    if (!proposta) throw new AppError(404, 'Proposta não encontrada.');
    const demanda = exigirDemanda(await repo.buscarDemanda(proposta.demandId, tx));
    exigirDono(demanda, user);

    if (proposta.status !== PENDENTE) throw new AppError(409, 'Esta proposta já foi respondida.');

    // Muda o status da demanda de forma atômica: só uma proposta vence,
    // mesmo que dois aceites cheguem ao mesmo tempo.
    const travada = await tx.demand.updateMany({
      where: { id: demanda.id, status: { in: ACEITAVEIS } },
      data: { status: 'EM_ANDAMENTO' },
    });
    if (travada.count === 0) throw new AppError(409, 'Esta demanda não está mais recebendo propostas.');

    const aceita = await tx.proposal.updateMany({
      where: { id: proposta.id, status: PENDENTE },
      data: { status: ACEITA },
    });
    if (aceita.count === 0) throw new AppError(409, 'Esta proposta já foi respondida.');

    // Guarda quem será recusada antes, para notificar depois
    const concorrentes = await tx.proposal.findMany({
      where: { demandId: demanda.id, id: { not: proposta.id }, status: PENDENTE },
      select: { faccaoId: true },
    });
    const recusadas = await tx.proposal.updateMany({
      where: { demandId: demanda.id, id: { not: proposta.id }, status: PENDENTE },
      data: { status: RECUSADA },
    });

    const agora = new Date();
    const acordo = await tx.agreement.create({
      data: {
        demandId: demanda.id,
        proposalId: proposta.id,
        confeccaoId: demanda.confeccaoId,
        faccaoId: proposta.faccaoId,
        price: proposta.price,
        deadlineDays: proposta.deadlineDays,
        dueDate: addDias(agora, proposta.deadlineDays), // recalculado quando a facção confirmar
        status: 'AGUARDANDO_CONFIRMACAO',
      },
    });

    await notify(
      tx,
      proposta.faccaoId,
      'PROPOSTA_ACEITA',
      'Sua proposta foi aceita',
      `${demanda.code}: confirme o acordo para iniciar o serviço`,
      { agreementId: acordo.id },
    );
    await notifyMany(
      tx,
      concorrentes.map((c) => c.faccaoId),
      'PROPOSTA_RECUSADA',
      'Proposta não selecionada',
      `${demanda.code}: a confecção escolheu outra proposta`,
      { demandId: demanda.id },
    );

    const atualizada = await repo.buscarProposta(proposta.id, tx);
    return {
      proposta: toPropostaDTO(atualizada, demanda.quantity),
      demanda: { id: demanda.id, status: statusDemandaApi('EM_ANDAMENTO') },
      acordo: { id: acordo.id, status: acordo.status },
      propostasRecusadas: recusadas.count,
    };
  });
}

export async function recusar(user, propostaId) {
  return prisma.$transaction(async (tx) => {
    const proposta = await repo.buscarProposta(propostaId, tx);
    if (!proposta) throw new AppError(404, 'Proposta não encontrada.');
    const demanda = exigirDemanda(await repo.buscarDemanda(proposta.demandId, tx));
    exigirDono(demanda, user);

    const r = await tx.proposal.updateMany({
      where: { id: proposta.id, status: PENDENTE },
      data: { status: RECUSADA },
    });
    if (r.count === 0) throw new AppError(409, 'Esta proposta já foi respondida.');

    await notify(
      tx,
      proposta.faccaoId,
      'PROPOSTA_RECUSADA',
      'Proposta recusada',
      `${demanda.code}: a confecção recusou a sua proposta`,
      { demandId: demanda.id },
    );
    return toPropostaDTO(await repo.buscarProposta(proposta.id, tx), demanda.quantity);
  });
}

// A facção retira a própria proposta enquanto ela não foi respondida
export async function retirar(user, propostaId) {
  const r = await prisma.proposal.updateMany({
    where: { id: propostaId, faccaoId: user.id, status: PENDENTE },
    data: { status: RETIRADA },
  });
  if (r.count === 0) throw new AppError(409, 'Proposta não encontrada ou já processada.');
}

export async function listarMinhas(user) {
  const propostas = await repo.listarDaFaccao(user.id);
  const demandas = new Map(
    (await repo.buscarDemandas(propostas.map((p) => p.demandId))).map((d) => [d.id, d]),
  );
  return propostas.map((p) => {
    const d = demandas.get(p.demandId);
    return {
      ...toPropostaDTO(p, d.quantity),
      demanda: { id: d.id, code: d.code, title: d.title, status: statusDemandaApi(d.status) },
    };
  });
}