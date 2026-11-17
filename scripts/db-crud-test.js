import 'dotenv/config';
import assert from 'node:assert/strict';
import { prisma } from '../src/lib/prisma.js';

const suffix = Date.now();
const phone = `55119${String(suffix).slice(-8)}`;
const demandCode = `TESTE-${suffix}`;

async function cleanup() {
  await prisma.demand.deleteMany({ where: { code: demandCode } });
  await prisma.user.deleteMany({ where: { phone } });
}

try {
  // --- Usuário: CREATE ---
  const user = await prisma.user.create({
    data: {
      phone,
      name: 'Usuário de Teste',
      role: 'CONFECCAO',
      consentAt: new Date(),
      confeccao: { create: { city: 'Recife', companyName: 'Confecção Teste' } },
    },
    include: { confeccao: true },
  });
  assert.equal(user.confeccao.city, 'Recife');
  console.log('OK  usuário criado:', user.id);

  // --- Usuário: READ ---
  const foundUser = await prisma.user.findUnique({ where: { phone } });
  assert.equal(foundUser.id, user.id);
  console.log('OK  usuário lido');

  // --- Usuário: UPDATE ---
  const updatedUser = await prisma.user.update({ where: { id: user.id }, data: { name: 'Nome Atualizado' } });
  assert.equal(updatedUser.name, 'Nome Atualizado');
  console.log('OK  usuário atualizado');

  // --- Demanda (chamado): CREATE ---
  const category = await prisma.serviceCategory.upsert({
    where: { name: 'Costura' },
    update: {},
    create: { name: 'Costura' },
  });
  const demand = await prisma.demand.create({
    data: {
      code: demandCode,
      confeccaoId: user.id,
      categoryId: category.id,
      title: 'Demanda de teste',
      quantity: 100,
      deadline: new Date(Date.now() + 10 * 86_400_000),
      city: 'Recife',
    },
  });
  assert.equal(demand.status, 'RECEBENDO_PROPOSTAS');
  console.log('OK  demanda criada:', demand.code);

  // --- Demanda: READ ---
  const list = await prisma.demand.findMany({ where: { confeccaoId: user.id } });
  assert.equal(list.length, 1);
  console.log('OK  demanda listada');

  // --- Demanda: UPDATE ---
  const updatedDemand = await prisma.demand.update({ where: { id: demand.id }, data: { status: 'PAUSADA' } });
  assert.equal(updatedDemand.status, 'PAUSADA');
  console.log('OK  demanda atualizada');

  // --- DELETE (demanda primeiro, depois o usuário) ---
  await prisma.demand.delete({ where: { id: demand.id } });
  await prisma.user.delete({ where: { id: user.id } });
  assert.equal(await prisma.user.findUnique({ where: { phone } }), null);
  console.log('OK  demanda e usuário removidos');

  console.log('\nCRUD funcionando com o PostgreSQL.');
} catch (err) {
  console.error('\nFALHA no teste de CRUD:', err);
  process.exitCode = 1;
} finally {
  await cleanup();
  await prisma.$disconnect();
}