import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();
router.use(authenticate);

router.get('/', async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    include: {
      confeccao: true,
      faccao: { include: { services: { include: { category: true } }, availability: true } },
    },
  });
  res.json(user);
});

const schema = z.object({
  name: z.string().min(2).max(100).optional(),
  companyName: z.string().max(120).optional(),
  city: z.string().min(2).optional(),
  description: z.string().max(1000).optional(),
  photos: z.array(z.string().url()).max(10).optional(), // só facção (RF05)
});

router.patch('/', async (req, res) => {
  const { name, photos, ...profile } = schema.parse(req.body);
  const data = {};
  if (name) data.name = name;
  if (req.user.role === 'FACCAO') data.faccao = { update: { ...profile, ...(photos && { photos }) } };
  if (req.user.role === 'CONFECCAO') data.confeccao = { update: profile };

  const user = await prisma.user.update({ where: { id: req.user.id }, data });
  res.json({ id: user.id, name: user.name });
});

export default router;
