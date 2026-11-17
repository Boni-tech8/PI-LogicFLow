import authApiRoutes from './routes/authApi.js';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import routes from './routes/index.js';
import { errorHandler } from './middleware/error.js';

const app = express();
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors());
app.use(express.json({ limit: '1mb' }));
app.use(rateLimit({ windowMs: 15 * 60_000, limit: 300 }));
app.use('/auth', rateLimit({ windowMs: 15 * 60_000, limit: 30 }));
app.use('/uploads', express.static('uploads'));
app.use(routes);
app.use((req, res) => res.status(404).json({ error: 'Rota não encontrada' }));
app.use(errorHandler);
app.use('/api/auth', authApiRoutes);

export default app;
