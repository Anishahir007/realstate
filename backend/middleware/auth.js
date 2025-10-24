import { verifyJwt } from '../utils/jwt.js';

export function requireAuth(req, res, next) {
  const auth = req.headers.authorization || '';
  let token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  // Allow token via query param for preview links and simple GETs (dev convenience)
  if (!token && req.query && req.query.token) {
    token = String(req.query.token);
  }
  if (!token) return res.status(401).json({ message: 'Unauthorized' });
  try {
    const payload = verifyJwt(token);
    req.user = payload;
    return next();
  } catch (e) {
    return res.status(401).json({ message: 'Invalid token' });
  }
}

export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    next();
  };
}


