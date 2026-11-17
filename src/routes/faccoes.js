import { buscarFaccoes } from '../controllers/buscaController.js';
import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { AppError } from '../lib/errors.js';
import { reputation } from '../lib/reputation.js';
import { authenticate, requireRole } from '../middleware/auth.js';

const router = Router();
router.use(authenticate);

const faccaoOnly = requireRole('FACCAO');

router.put('/me/services', faccaoOnly, async (req, res) => {
  const { categoryIds } = z.object({ categoryIds: z.array(z.number().int()).min(1) }).parse(req.body);
  const valid = await prisma.serviceCategory.count({ where: { id: { in: categoryIds }, active: true } });
  if (valid !== new Set(categoryIds).size) throw new AppError(400, 'Categoria de serviço inválida');

  await prisma.$transaction([
    prisma.faccaoService.deleteMany({ where: { faccaoId: req.user.id } }),
    prisma.faccaoService.createMany({
      data: [...new Set(categoryIds)].map((categoryId) => ({ faccaoId: req.user.id, categoryId })),
    }),
  ]);
  res.status(204).end();
});

router.put('/me/capacity', faccaoOnly, async (req, res) => {
  const { weeklyCapacity } = z.object({ weeklyCapacity: z.number().int().min(0) }).parse(req.body);
  await prisma.faccaoProfile.update({ where: { userId: req.user.id }, data: { weeklyCapacity } });
  res.status(204).end();
});

const periodSchema = z
  .object({
    startDate: z.coerce.date(),
    endDate: z.coerce.date(),
    status: z.enum(['LIVRE', 'OCUPADO']).default('LIVRE'),
  })
  .refine((p) => p.endDate >= p.startDate, { message: 'Data final anterior à inicial' });

router.get('/me/availability', faccaoOnly, async (req, res) => {
  res.json(await prisma.availabilityPeriod.findMany({ where: { faccaoId: req.user.id }, orderBy: { startDate: 'asc' } }));
});

router.post('/me/availability', faccaoOnly, async (req, res) => {
  const data = periodSchema.parse(req.body);
  res.status(201).json(await prisma.availabilityPeriod.create({ data: { ...data, faccaoId: req.user.id } }));
});

router.delete('/me/availability/:id', faccaoOnly, async (req, res) => {
  const { count } = await prisma.availabilityPeriod.deleteMany({
    where: { id: req.params.id, faccaoId: req.user.id },
  });
  if (!count) throw new AppError(404, 'Período não encontrado');
  res.status(204).end();
});

// Busca de facções por serviço, cidade e disponibilidade (sem expor telefone: RNF05)
router.get('/', buscarFaccoes);

  const items = await prisma.faccaoProfile.findMany({
    where,
    skip: (q.page - 1) * q.pageSize,
    take: q.pageSize,
    select: {
      userId: true, companyName: true, city: true, weeklyCapacity: true, photos: true,
      user: { select: { name: true, verified: true } },
      services: { select: { category: true } },
    },
  });
  const withRep = await Promise.all(items.map(async (f) => ({ ...f, reputation: await reputation(f.userId) })));
  res.json(withRep);
;

router.get('/:id', async (req, res) => {
  const f = await prisma.faccaoProfile.findFirst({
    where: { userId: req.params.id, user: { status: 'ATIVO' } },
    select: {
      userId: true, companyName: true, city: true, description: true, weeklyCapacity: true, photos: true,
      user: { select: { name: true, verified: true, createdAt: true } },
      services: { select: { category: true } },
      availability: { where: { endDate: { gte: new Date() } }, orderBy: { startDate: 'asc' } },
    },
  });
  if (!f) throw new AppError(404, 'Facção não encontrada');

  const reviews = await prisma.review.findMany({
    where: { targetId: f.userId, hidden: false },
    orderBy: { createdAt: 'desc' },
    take: 20,
    select: { id: true, rating: true, comment: true, createdAt: true, author: { select: { name: true } } },
  });
  res.json({ ...f, reputation: await reputation(f.userId), reviews });
});

export default router;
