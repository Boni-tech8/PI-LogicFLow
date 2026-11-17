import { prisma } from '../lib/prisma.js';
import { Router } from 'express';
import auth from './auth.js';
import me from './me.js';
import categories from './categories.js';
import faccoes from './faccoes.js';
import demandas from './demandas.js';
import { demandProposals, proposals } from './proposals.js';
import agreements from './agreements.js';
import notifications from './notifications.js';
import reports from './reports.js';
import admin from './admin.js';
import uploads from './uploads.js';

const router = Router();
router.get('/health', (req, res) => res.json({ ok: true }));
router.get('/health/db', async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.status(200).json({ status: 'ok', database: 'connected' });
  } catch (err) {
    console.error('Falha na conexão com o banco', err);
    res.status(503).json({ status: 'error', database: 'disconnected' });
  }
});
router.use('/auth', auth);
router.use('/me', me);
router.use('/categories', categories);
router.use('/api/faccoes', faccoes);
router.use('/api/demandas/:demandId/proposals', demandProposals);
router.use('/api/demandas', demandas);
router.use('/demands', demands);
router.use('/proposals', proposals);
router.use('/agreements', agreements);
router.use('/notifications', notifications);
router.use('/reports', reports);
router.use('/admin', admin);
router.use('/uploads', uploads);

export default router;
