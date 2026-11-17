// src/middleware/authMiddleware.js
import jwt from 'jsonwebtoken';

const naoAutorizado = (res, message) =>
  res
    .status(401)
    .set('WWW-Authenticate', 'Bearer')
    .json({ message });

export function authMiddleware(req, res, next) {
  // 1. Intercepta o cabeçalho Authorization: Bearer <token>
  const header = req.headers.authorization;
  if (!header) return naoAutorizado(res, 'Token não informado.');

  const [esquema, token, ...resto] = header.trim().split(/\s+/);
  if (esquema?.toLowerCase() !== 'bearer' || !token || resto.length > 0) {
    return naoAutorizado(res, 'Formato do token inválido. Use: Authorization: Bearer <token>.');
  }

  // Sem segredo configurado o problema é do servidor, não do cliente
  const segredo = process.env.JWT_SECRET;
  if (!segredo) {
    console.error('JWT_SECRET não configurado no .env');
    return res.status(500).json({ message: 'Erro interno do servidor.' });
  }

  // 2. Valida assinatura e expiração (só aceita HS256, o que bloqueia "alg: none")
  let claims;
  try {
    claims = jwt.verify(token, segredo, { algorithms: ['HS256'] });
  } catch (e) {
    return naoAutorizado(
      res,
      e.name === 'TokenExpiredError' ? 'Token expirado.' : 'Token inválido.',
    );
  }

  // 3. Injeta o usuário autenticado no request
  const id = claims.id ?? claims.userId ?? claims.sub;
  const tipoPerfil = claims.tipoPerfil ?? claims.role;
  if (!id || !tipoPerfil) return naoAutorizado(res, 'Token inválido.');

  req.user = {
    id,
    tipoPerfil,
    role: tipoPerfil, // alias para código antigo
    nome: claims.nome ?? claims.name ?? null,
  };
  req.authUser = req.user; // compatível com authorize() do rbac.js, se você o criou

  next();
}