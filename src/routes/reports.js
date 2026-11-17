import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.post('/', authenticate, async (req, res) => {
  const data = z.object({
    targetType: z.enum(['PERFIL', 'DEMANDA', 'AVALIACAO']),
    targetId: z.string().uuid(),
    reason: z.string().min(5).max(500),
  }).parse(req.body);
  res.status(201).json(await prisma.report.create({ data: { ...data, reporterId: req.user.id } }));
});

export default router;
