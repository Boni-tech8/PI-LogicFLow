import { Router } from 'express';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { env } from '../config/env.js';
import { prisma } from '../lib/prisma.js';
import { AppError } from '../lib/errors.js';
import { normalizePhone } from '../lib/phone.js';
import { requestOtp, verifyOtp } from '../services/otp.js';

const router = Router();

const token = (user) =>
  jwt.sign({ sub: user.id, role: user.role }, env.JWT_SECRET, { expiresIn: '7d' });

const publicUser = (u) => ({ id: u.id, name: u.name, role: u.role, verified: u.verified });

router.post('/otp/request', async (req, res) => {
  const { phone } = z.object({ phone: z.string() }).parse(req.body);
  await requestOtp(normalizePhone(phone));
  res.status(204).end();
});

router.post('/login', async (req, res) => {
  const body = z.object({ phone: z.string(), code: z.string().length(6) }).parse(req.body);
  const phone = normalizePhone(body.phone);

  const user = await prisma.user.findUnique({ where: { phone } });
  if (!user) throw new AppError(404, 'Telefone não cadastrado');
  if (user.status !== 'ATIVO') throw new AppError(403, 'Conta suspensa');

  await verifyOtp(phone, body.code);
  res.json({ token: token(user), user: publicUser(user) });
});

// RF02: o perfil (confecção ou facção) é escolhido no cadastro
router.post('/register', async (req, res) => {
  const body = z
    .object({
      phone: z.string(),
      code: z.string().length(6),
      name: z.string().min(2).max(100),
      role: z.enum(['CONFECCAO', 'FACCAO']),
      city: z.string().min(2),
      companyName: z.string().max(120).optional(),
      consent: z.literal(true, { errorMap: () => ({ message: 'Consentimento LGPD obrigatório' }) }),
    })
    .parse(req.body);

  const phone = normalizePhone(body.phone);
  if (await prisma.user.findUnique({ where: { phone } })) throw new AppError(409, 'Telefone já cadastrado');

  await verifyOtp(phone, body.code);

  const profile = { companyName: body.companyName, city: body.city };
  const user = await prisma.user.create({
    data: {
      phone,
      name: body.name,
      role: body.role,
      consentAt: new Date(),
      ...(body.role === 'FACCAO' ? { faccao: { create: profile } } : { confeccao: { create: profile } }),
    },
  });
  res.status(201).json({ token: token(user), user: publicUser(user) });
});

export default router;
