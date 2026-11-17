import { authMiddleware } from '../middleware/authMiddleware.js';
import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { AppError } from '../lib/errors.js';
import { notify } from '../lib/notify.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();
router.use(authenticate);
router.use(authMiddleware);

const include = {
  demand: { select: { id: true, code: true, title: true, quantity: true, city: true } },
  confeccao: { select: { id: true, name: true, phone: true } },
  faccao: { select: { id: true, name: true, phone: true } },
  reviews: { where: { hidden: false } },
};

// Só os participantes acessam o acordo
async function loadAgreement(id, userId) {
  const ag = await prisma.agreement.findUnique({ where: { id }, include });
  if (!ag || (ag.confeccaoId !== userId && ag.faccaoId !== userId)) throw new AppError(404, 'Acordo não encontrado');
  return ag;
}

// RNF05: o telefone da outra parte só é revelado dentro de um acordo
function present(ag, userId) {
  const isConf = ag.confeccaoId === userId;
  const other = isConf ? ag.faccao : ag.confeccao;
  const { confeccao, faccao, ...rest } = ag;
  return {
    ...rest,
    counterpart: { id: other.id, name: other.name },
    contact: { whatsappLink: `https://wa.me/${other.phone}` }, // RF14
  };
}

router.get('/', async (req, res) => {
  const list = await prisma.agreement.findMany({
    where: { OR: [{ confeccaoId: req.user.id }, { faccaoId: req.user.id }] },
    orderBy: { createdAt: 'desc' },
    include,
  });
  res.json(list.map((ag) => present(ag, req.user.id)));
});

router.get('/:id', async (req, res) => {
  res.json(present(await loadAgreement(req.params.id, req.user.id), req.user.id));
});

// RF13: o acordo só vale depois que as duas partes confirmam
router.post('/:id/confirm', async (req, res) => {
  const ag = await loadAgreement(req.params.id, req.user.id);
  if (ag.faccaoId !== req.user.id) throw new AppError(403, 'Apenas a facção confirma o acordo');
  if (ag.status !== 'AGUARDANDO_CONFIRMACAO') throw new AppError(409, 'Acordo já confirmado');

  const now = new Date();
  const updated = await prisma.$transaction(async (tx) => {
    const u = await tx.agreement.update({
      where: { id: ag.id },
      // o prazo passa a contar a partir da confirmação
      data: { status: 'CONFIRMADO', confirmedAt: now, dueDate: new Date(now.getTime() + ag.deadlineDays * 86_400_000) },
    });
    await notify(tx, ag.confeccaoId, 'ACORDO_CONFIRMADO', 'Acordo confirmado',
      `${ag.demand.code}: a facção confirmou as condições`, { agreementId: ag.id });
    return u;
  });
  res.json(updated);
});

// RF16: a facção registra a conclusão. RN07: pontualidade
router.post('/:id/complete', async (req, res) => {
  const ag = await loadAgreement(req.params.id, req.user.id);
  if (ag.faccaoId !== req.user.id) throw new AppError(403, 'Apenas a facção registra a conclusão');
  if (ag.status !== 'CONFIRMADO') throw new AppError(409, 'O acordo precisa estar confirmado');

  const now = new Date();
  const updated = await prisma.$transaction(async (tx) => {
    const u = await tx.agreement.update({
      where: { id: ag.id },
      data: { status: 'CONCLUIDO', completedAt: now, completedOnTime: now <= ag.dueDate },
    });
    await tx.demand.update({ where: { id: ag.demandId }, data: { status: 'CONCLUIDA' } });
    await notify(tx, ag.confeccaoId, 'SERVICO_CONCLUIDO', 'Serviço concluído',
      `${ag.demand.code}: avalie a facção`, { agreementId: ag.id });
    return u;
  });
  res.json(updated);
});

// RF17 + RN06: avaliação mútua, só após a conclusão
router.post('/:id/reviews', async (req, res) => {
  const data = z.object({ rating: z.number().int().min(1).max(5), comment: z.string().max(500).optional() })
    .parse(req.body);
  const ag = await loadAgreement(req.params.id, req.user.id);
  if (ag.status !== 'CONCLUIDO') throw new AppError(409, 'A avaliação só é liberada após a conclusão do serviço');

  const targetId = ag.confeccaoId === req.user.id ? ag.faccaoId : ag.confeccaoId;
  // unique(agreementId, authorId) impede avaliação duplicada
  const review = await prisma.review.create({
    data: { ...data, agreementId: ag.id, authorId: req.user.id, targetId },
  });
  await notify(prisma, targetId, 'NOVA_AVALIACAO', 'Você recebeu uma avaliação', `Nota ${data.rating}/5`, { agreementId: ag.id });
  res.status(201).json(review);
});

export default router;
