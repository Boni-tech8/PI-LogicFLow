import * as service from '../services/propostaService.js';
import { novaPropostaDTO, listarPropostasDTO } from '../dto/propostaDto.js';

export async function enviar(req, res) {
  const dados = novaPropostaDTO.parse(req.body);
  res.status(201).json(await service.enviar(req.user, req.params.id, dados));
}

export async function listarDaDemanda(req, res) {
  const { sort } = listarPropostasDTO.parse(req.query);
  res.json(await service.listarDaDemanda(req.user, req.params.id, sort));
}

export async function aceitar(req, res) {
  res.status(201).json(await service.aceitar(req.user, req.params.id));
}

export async function recusar(req, res) {
  res.json(await service.recusar(req.user, req.params.id));
}

export async function retirar(req, res) {
  await service.retirar(req.user, req.params.id);
  res.status(204).end();
}

export async function listarMinhas(req, res) {
  res.json(await service.listarMinhas(req.user));
}