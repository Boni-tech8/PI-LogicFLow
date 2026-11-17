import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { normalizePhone } from '../src/lib/phone.js';

const prisma = new PrismaClient();

const categories = ['Costura', 'Corte', 'Bordado', 'Estamparia', 'Acabamento'];
for (const name of categories) {
  await prisma.serviceCategory.upsert({ where: { name }, update: {}, create: { name } });
}

const phone = normalizePhone(process.env.ADMIN_PHONE);
await prisma.user.upsert({
  where: { phone },
  update: {},
  create: { phone, name: 'Administrador', role: 'ADMIN', verified: true, consentAt: new Date() },
});

console.log('Seed concluído');
await prisma.$disconnect();
