import jwt from 'jsonwebtoken';

const DEFAULT_EXPIRES_IN = '7d';

export function signJwt(payload, options = {}) {
  const secret = process.env.JWT_SECRET || 'dev_secret_change_me';
  const expiresIn = options.expiresIn || DEFAULT_EXPIRES_IN;
  return jwt.sign(payload, secret, { expiresIn });
}

export function verifyJwt(token) {
  const secret = process.env.JWT_SECRET || 'dev_secret_change_me';
  return jwt.verify(token, secret);
}


