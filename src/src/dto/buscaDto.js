import { z } from 'zod';

const vazioParaUndefined = (v) => (v === '' ? undefined : v);
const opcional = (schema) => z.preprocess(vazioParaUndefined, schema.optional());

const inteiro = (nome, min = 0) =>
  opcional(
    z
      .coerce.number({ invalid_type_error: `${nome} deve ser um número` })
      .int(`${nome} deve ser inteiro`)
      .min(min, `${nome} deve ser no mínimo ${min}`),
  );

const booleano = (nome) =>
  z.preprocess(
    (v) => (v === 'true' ? true : v === 'false' ? false : vazioParaUndefined(v)),
    z.boolean({ invalid_type_error: `${nome} deve ser true ou false` }).optional(),
  );

const paginacao = {
  page: z.preprocess(vazioParaUndefined, z.coerce.number().int().min(1).default(1)),
  size: z.preprocess(vazioParaUndefined, z.coerce.number().int().min(1).max(50).default(20)),
  sort: opcional(z.string()),
};

export const STATUS_BUSCA = ['ABERTA', 'PAUSADA', 'EM_ANDAMENTO', 'CONCLUIDA', 'ENCERRADA'];

export const buscaDemandasDTO = z
  .object({
    servicoId: inteiro('servicoId', 1),
    cidade: opcional(z.string().trim().min(1)),
    quantidadeMin: inteiro('quantidadeMin'),
    quantidadeMax: inteiro('quantidadeMax'),
    prazoMax: opcional(
      z.coerce.date({ errorMap: () => ({ message: 'prazoMax inválido. Use o formato AAAA-MM-DD' }) }),
    ),
    status: z.preprocess(
      vazioParaUndefined,
      z
        .enum(STATUS_BUSCA, {
          errorMap: () => ({ message: `status deve ser um destes: ${STATUS_BUSCA.join(', ')}` }),
        })
        .default('ABERTA'),
    ),
    q: opcional(z.string().trim().min(1)),
    ...paginacao,
  })
  .refine(
    (f) =>
      f.quantidadeMin === undefined || f.quantidadeMax === undefined || f.quantidadeMin <= f.quantidadeMax,
    { message: 'quantidadeMin não pode ser maior que quantidadeMax', path: ['quantidadeMin'] },
  );

export const buscaFaccoesDTO = z.object({
  servicoId: inteiro('servicoId', 1),
  cidade: opcional(z.string().trim().min(1)),
  capacidadeMin: inteiro('capacidadeMin'),
  disponivel: booleano('disponivel'),
  ...paginacao,
});

// Resumo da facção para listagens: nunca expõe telefone (RNF05)
export function toFaccaoResumoDTO(f, reputation) {
  return {
    id: f.userId,
    name: f.user.name,
    verified: f.user.verified,
    companyName: f.companyName,
    city: f.city,
    weeklyCapacity: f.weeklyCapacity,
    photos: f.photos,
    services: f.services.map((s) => s.category),
    reputation,
  };
}