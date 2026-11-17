import crypto from 'node:crypto';
import { env } from '../config/env.js';
import { prisma } from '../lib/prisma.js';
import { AppError } from '../lib/errors.js';
import { sendSms } from './sms.js';

const hash = (phone, code) =>
  crypto.createHash('sha256').update(`${phone}:${code}:${env.OTP_PEPPER}`).digest('hex');

export async function requestOtp(phone) {
  const recent = await prisma.otpCode.findFirst({
    where: { phone, createdAt: { gt: new Date(Date.now() - 60_000) } },
  });
  if (recent) throw new AppError(429, 'Aguarde 1 minuto para solicitar um novo código');

  const code = String(crypto.randomInt(0, 1_000_000)).padStart(6, '0');
  await prisma.otpCode.create({
    data: { phone, codeHash: hash(phone, code), expiresAt: new Date(Date.now() + 5 * 60_000) },
  });
  await sendSms(phone, `Logicflow: seu código de verificação é ${code}`);
}

export async function verifyOtp(phone, code) {
  const otp = await prisma.otpCode.findFirst({
    where: { phone, consumed: false, expiresAt: { gt: new Date() } },
    orderBy: { createdAt: 'desc' },
  });
  if (!otp || otp.attempts >= 5) throw new AppError(401, 'Código inválido ou expirado');

  if (otp.codeHash !== hash(phone, code)) {
    await prisma.otpCode.update({ where: { id: otp.id }, data: { attempts: { increment: 1 } } });
    throw new AppError(401, 'Código inválido ou expirado');
  }
  await prisma.otpCode.update({ where: { id: otp.id }, data: { consumed: true } });
}
