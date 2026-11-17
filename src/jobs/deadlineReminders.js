import { prisma } from '../lib/prisma.js';
import { notify } from '../lib/notify.js';

// RF15: notificação de prazos
export function startDeadlineReminders() {
  const run = async () => {
    try {
      const soon = new Date(Date.now() + 2 * 86_400_000);
      const list = await prisma.agreement.findMany({
        where: { status: 'CONFIRMADO', dueDate: { lte: soon }, reminderSentAt: null },
        include: { demand: { select: { code: true } } },
      });
      for (const ag of list) {
        const msg = `${ag.demand.code}: o prazo termina em ${ag.dueDate.toLocaleDateString('pt-BR')}`;
        await notify(prisma, ag.faccaoId, 'PRAZO_PROXIMO', 'Prazo próximo', msg, { agreementId: ag.id });
        await notify(prisma, ag.confeccaoId, 'PRAZO_PROXIMO', 'Prazo próximo', msg, { agreementId: ag.id });
        await prisma.agreement.update({ where: { id: ag.id }, data: { reminderSentAt: new Date() } });
      }
    } catch (e) {
      console.error('Falha no job de prazos', e);
    }
  };
  run();
  setInterval(run, 60 * 60 * 1000);
}
