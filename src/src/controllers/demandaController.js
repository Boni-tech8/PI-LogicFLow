import * as service from '../services/demandaService.js';
import {
  alterarStatusDTO,
  atualizarDemandaDTO,
  filtrosListagemDTO,
  novaDemandaDTO,
} from '../dto/demandaDto.js';

export async function publicar(req, res) {
  const dto = novaDemandaDTO.parse(req.body);
  res.status(201).json(await service.publicar(req.user, dto));
}

export async function detalhar(req, res) {
  res.json(await service.detalhar(req.user, req.params.id));
}

export async function editar(req, res) {
  const dto = atualizarDemandaDTO.parse(req.body);
  res.json(await service.editar(req.user, req.params.id, dto));
}

export async function alterarStatus(req, res) {
  const { status } = alterarStatusDTO.parse(req.body);
  res.json(await service.alterarStatus(req.user, req.params.id, status));
}

export async function listarMinhas(req, res) {
  res.json(await service.listarMinhas(req.user));
}

export async function listarAbertas(req, res) {
  res.json(await service.listarAbertas(filtrosListagemDTO.parse(req.query)));
}