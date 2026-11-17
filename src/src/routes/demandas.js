import * as buscaController from '../controllers/buscaController.js';
import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/auth.js';
import * as controller from '../controllers/demandaController.js';

const router = Router();
const confeccaoOnly = requireRole('CONFECCAO');

router.use(authenticate);

router.get('/', buscaController.buscarDemandas);
router.get('/minhas', confeccaoOnly, controller.listarMinhas); // antes de /:id
router.post('/', confeccaoOnly, controller.publicar);
router.get('/:id', controller.detalhar);
router.put('/:id', confeccaoOnly, controller.editar);
router.patch('/:id/status', confeccaoOnly, controller.alterarStatus);

export default router;