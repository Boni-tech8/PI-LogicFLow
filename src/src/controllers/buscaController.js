import * as service from '../services/buscaService.js';
import { buscaDemandasDTO, buscaFaccoesDTO } from '../dto/buscaDto.js';

export async function buscarDemandas(req, res) {
  res.json(await service.buscarDemandas(req.user, buscaDemandasDTO.parse(req.query)));
}

export async function buscarFaccoes(req, res) {
  res.json(await service.buscarFaccoes(buscaFaccoesDTO.parse(req.query)));
}