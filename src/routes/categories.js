import { Router } from 'express';
import { prisma } from '../lib/prisma.js';

const router = Router();

router.get('/', async (req, res) => {
  res.json(await prisma.serviceCategory.findMany({ where: { active: true }, orderBy: { name: 'asc' } }));
});

export default router;
