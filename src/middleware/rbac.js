import { decodificarToken } from '../services/jwtService.js';

export function authenticateJwt(req, res, next) {
  const [esquema, token] = (req.headers.authorization ?? '').split(' ');
  if (esquema !== 'Bearer' || !token) {
    return res.status(401).json({ message: 'Token não informado.' });
  }
  try {
    const c = decodificarToken(token);
    req.authUser = { id: c.id ?? c.sub, tipoPerfil: c.tipoPerfil, nome: c.nome };
    next();
  } catch {
    res.status(401).json({ message: 'Token inválido ou expirado.' });
  }
}

// Uso: router.get('/x', authenticateJwt, authorize('ADMIN'), handler)
export const authorize = (...perfis) => (req, res, next) => {
  if (!req.authUser || !perfis.includes(req.authUser.tipoPerfil)) {
    return res.status(403).json({ message: 'Acesso negado para o seu perfil.' });
  }
  next();
};