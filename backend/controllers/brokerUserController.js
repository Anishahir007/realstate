import { getTenantPool } from '../utils/tenant.js';
import { validateEmail, validatePassword, isNonEmptyString, sanitizeName } from '../utils/validation.js';
import { hashPassword, comparePassword } from '../utils/hash.js';
import { signJwt } from '../utils/jwt.js';

function getTenantFromRequest(req) {
  // Prefer tenant_db from authenticated broker token; fallback to header for public signup
  const fromUser = req.user && req.user.tenant_db ? req.user.tenant_db : null;
  const fromHeader = req.headers['x-tenant-db'] || req.headers['x-tenant'] || null;
  const tenantDb = (fromUser || fromHeader || '').toString();
  return tenantDb;
}

export async function signupTenantUser(req, res) {
  try {
    const tenantDb = getTenantFromRequest(req);
    if (!tenantDb) return res.status(400).json({ message: 'Missing tenant' });

    const { full_name, email, phone, photo, password } = req.body || {};
    if (!isNonEmptyString(full_name) || !validateEmail(email) || !validatePassword(password)) {
      return res.status(400).json({ message: 'Invalid input' });
    }

    const tenantPool = await getTenantPool(tenantDb);
    try {
      // Check existing
      const [existing] = await tenantPool.query('SELECT id FROM users WHERE email = ? LIMIT 1', [email]);
      if (existing[0]) return res.status(409).json({ message: 'Email already exists' });

      const safeName = sanitizeName(full_name);
      const password_hash = await hashPassword(password);
      const [result] = await tenantPool.query(
        `INSERT INTO users (full_name, email, phone, photo, password_hash) VALUES (?, ?, ?, ?, ?)`,
        [safeName, email, phone || null, photo || null, password_hash]
      );
      const id = result.insertId;
      const token = signJwt({ role: 'tenant_user', id, email, tenant_db: tenantDb });
      return res.status(201).json({ id, token });
    } finally {
      await tenantPool.end();
    }
  } catch (err) {
    const isProd = process.env.NODE_ENV === 'production';
    return res.status(500).json({ message: 'Server error', error: isProd ? undefined : String(err?.message || err) });
  }
}

export async function loginTenantUser(req, res) {
  try {
    const tenantDb = getTenantFromRequest(req);
    if (!tenantDb) return res.status(400).json({ message: 'Missing tenant' });

    const { email, password } = req.body || {};
    if (!validateEmail(email) || !isNonEmptyString(password)) {
      return res.status(400).json({ message: 'Invalid input' });
    }

    const tenantPool = await getTenantPool(tenantDb);
    try {
      const [rows] = await tenantPool.query('SELECT * FROM users WHERE email = ? LIMIT 1', [email]);
      const user = rows[0];
      if (!user) return res.status(401).json({ message: 'Invalid credentials' });
      const ok = await comparePassword(password, user.password_hash);
      if (!ok) return res.status(401).json({ message: 'Invalid credentials' });
      await tenantPool.query('UPDATE users SET last_login_at = NOW() WHERE id = ?', [user.id]);
      const token = signJwt({ role: 'tenant_user', id: user.id, email: user.email, tenant_db: tenantDb });
      return res.json({ token });
    } finally {
      await tenantPool.end();
    }
  } catch (err) {
    const isProd = process.env.NODE_ENV === 'production';
    return res.status(500).json({ message: 'Server error', error: isProd ? undefined : String(err?.message || err) });
  }
}


