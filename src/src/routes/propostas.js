import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/auth.js';
import * as controller from '../controllers/propostaController.js';

const router = Router();

router.use(authenticate);

router.get('/minhas', requireRole('FACCAO'), controller.listarMinhas);
router.post('/:id/aceite', requireRole('CONFECCAO'), controller.aceitar);
router.post('/:id/recusa', requireRole('CONFECCAO'), controller.recusar);
router.delete('/:id', requireRole('FACCAO'), controller.retirar);

export default router;