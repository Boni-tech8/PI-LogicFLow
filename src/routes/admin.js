import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { AppError } from '../lib/errors.js';
import { authenticate, requireRole } from '../middleware/auth.js';

const router = Router();
router.use(authenticate, requireRole('ADMIN'));

router.get('/reports', async (req, res) => {
  const { status } = z.object({ status: z.enum(['ABERTA', 'PROCEDENTE', 'IMPROCEDENTE']).default('ABERTA') }).parse(req.query);
  res.json(await prisma.report.findMany({
    where: { status }, orderBy: { createdAt: 'asc' },
    include: { reporter: { select: { id: true, name: true } } },
  }));
});

router.post('/reports/:id/resolve', async (req, res) => {
  const { decision, suspendUser } = z.object({
    decision: z.enum(['PROCEDENTE', 'IMPROCEDENTE']),
    suspendUser: z.boolean().default(false),
  }).parse(req.body);

  const report = await prisma.report.findUnique({ where: { id: req.params.id } });
  if (!report || report.status !== 'ABERTA') throw new AppError(404, 'Denúncia não encontrada ou já analisada');

  await prisma.$transaction(async (tx) => {
    if (decision === 'PROCEDENTE') {
      let ownerId = null;
      if (report.targetType === 'PERFIL') ownerId = report.targetId;
      if (report.targetType === 'DEMANDA') {
        const d = await tx.demand.update({ where: { id: report.targetId }, data: { status: 'ENCERRADA' } });
        ownerId = d.confeccaoId;
      }
      if (report.targetType === 'AVALIACAO') {
        const r = await tx.review.update({ where: { id: report.targetId }, data: { hidden: true } });
        ownerId = r.authorId;
      }
      if (suspendUser && ownerId) {
        await tx.user.update({ where: { id: ownerId }, data: { status: 'SUSPENSO' } });
      }
    }
    await tx.report.update({
      where: { id: report.id },
      data: { status: decision, resolvedById: req.user.id, resolvedAt: new Date() },
    });
  });
  res.status(204).end();
});

router.post('/users/:id/suspend', async (req, res) => {
  await prisma.user.update({ where: { id: req.params.id }, data: { status: 'SUSPENSO' } });
  res.status(204).end();
});

router.post('/users/:id/reactivate', async (req, res) => {
  await prisma.user.update({ where: { id: req.params.id }, data: { status: 'ATIVO' } });
  res.status(204).end();
});

// Selo de cadastro verificado (facções informais não precisam de CNPJ)
router.post('/users/:id/verify', async (req, res) => {
  await prisma.user.update({ where: { id: req.params.id }, data: { verified: true } });
  res.status(204).end();
});

router.post('/categories', async (req, res) => {
  const { name } = z.object({ name: z.string().min(2).max(60) }).parse(req.body);
  res.status(201).json(await prisma.serviceCategory.create({ data: { name } }));
});

router.patch('/categories/:id', async (req, res) => {
  const data = z.object({ name: z.string().min(2).max(60).optional(), active: z.boolean().optional() }).parse(req.body);
  res.json(await prisma.serviceCategory.update({ where: { id: Number(req.params.id) }, data }));
});

router.get('/stats', async (req, res) => {
  const [usersByRole, demandsByStatus, proposals, agreementsDone, openReports] = await Promise.all([
    prisma.user.groupBy({ by: ['role'], _count: true }),
    prisma.demand.groupBy({ by: ['status'], _count: true }),
    prisma.proposal.count(),
    prisma.agreement.count({ where: { status: 'CONCLUIDO' } }),
    prisma.report.count({ where: { status: 'ABERTA' } }),
  ]);
  res.json({ usersByRole, demandsByStatus, proposals, agreementsDone, openReports });
});

export default router;
