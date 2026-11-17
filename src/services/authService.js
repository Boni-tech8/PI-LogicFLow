import bcrypt from 'bcryptjs';
import * as prismaModule from '../lib/prisma.js';
import { F, LGPD } from '../lib/userFields.js';
import { variantesTelefone } from '../lib/authDto.js';
import { gerarToken } from './jwtService.js';

// funciona se o prisma.js exporta "prisma" nomeado ou como default
const prisma = prismaModule.prisma ?? prismaModule.default;

export class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

const MSG_DUPLICADO = 'Número de telefone já cadastrado.';

const buscarPorTelefone = (telefone) =>
  prisma.user.findFirst({ where: { [F.phone]: { in: variantesTelefone(telefone).todas } } });

export async function cadastrar(dados) {
  if (await buscarPorTelefone(dados.telefone)) throw new HttpError(409, MSG_DUPLICADO);

  const data = {
    [F.name]: dados.nome,
    [F.phone]: variantesTelefone(dados.telefone).nacional,
    [F.passwordHash]: await bcrypt.hash(dados.senha, 10),
    [F.role]: dados.tipoPerfil,
  };
  if (LGPD) data[LGPD.field] = LGPD.value();

  try {
    return await prisma.user.create({ data });
  } catch (e) {
    // duas requisições simultâneas com o mesmo telefone
    if (e.code === 'P2002') throw new HttpError(409, MSG_DUPLICADO);
    throw e;
  }
}

export async function autenticar({ telefone, senha }) {
  const user = await buscarPorTelefone(telefone);
  // usuário antigo (só SMS) não tem hash: cai na mesma mensagem genérica
  const hash = user?.[F.passwordHash];
  const ok = hash ? await bcrypt.compare(senha, hash) : false;
  if (!ok) throw new HttpError(401, 'Telefone ou senha inválidos.');
  return { user, token: gerarToken(user) };
}

export const buscarPorId = (id) => prisma.user.findUnique({ where: { id } });