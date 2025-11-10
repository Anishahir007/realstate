import pool from '../config/database.js';

export async function emailExistsAnywhere(email) {
  if (!email) return { exists: false };
  const [sa] = await pool.query('SELECT id FROM super_admins WHERE email = ? LIMIT 1', [email]);
  if (sa[0]) return { exists: true, in: 'super_admins' };
  const [br] = await pool.query('SELECT id FROM brokers WHERE email = ? LIMIT 1', [email]);
  if (br[0]) return { exists: true, in: 'brokers' };
  const [us] = await pool.query('SELECT id FROM users WHERE email = ? LIMIT 1', [email]);
  if (us[0]) return { exists: true, in: 'users' };
  return { exists: false };
}

