import { ticketSchema, ticketResponse } from '../lib/ticketDto.js';
import * as ticketService from '../services/ticketService.js';

export async function criar(req, res) {
  const r = ticketSchema.safeParse(req.body ?? {});
  if (!r.success) {
    return res.status(400).json({
      message: 'Dados inválidos.',
      errors: r.error.issues.map((i) => ({ campo: i.path.join('.'), mensagem: i.message })),
    });
  }

  const ticket = await ticketService.criarTicket(r.data);
  res.status(201).json(ticketResponse(ticket));
}