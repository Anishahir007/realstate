import bcrypt from 'bcryptjs';

const SALT_ROUNDS = 10;

export async function hashPassword(plain) {
  if (typeof plain !== 'string' || plain.length === 0) {
    throw new Error('Password required');
  }
  const salt = await bcrypt.genSalt(SALT_ROUNDS);
  return await bcrypt.hash(plain, salt);
}

export async function comparePassword(plain, hash) {
  if (typeof plain !== 'string' || typeof hash !== 'string') return false;
  return await bcrypt.compare(plain, hash);
}


