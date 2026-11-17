import { Router } from 'express';
import { criar } from '../controllers/ticketController.js';

const router = Router();

router.post('/', criar);

export default router;