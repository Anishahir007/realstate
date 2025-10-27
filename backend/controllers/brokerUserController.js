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
      const [rows] = await tenantPool.query('SELECT * FROM users WHERE email = ? LIMIT 1', [email]);
      const user = rows[0];
      if (!user) return res.status(401).json({ message: 'Invalid credentials' });
      const ok = await comparePassword(password, user.password_hash);
      if (!ok) return res.status(401).json({ message: 'Invalid credentials' });
      await tenantPool.query('UPDATE users SET last_login_at = NOW() WHERE id = ?', [user.id]);
      const token = signJwt({ role: 'tenant_user', id: user.id, email: user.email, tenant_db: tenantDb });
      return res.json({ token });
    
  } catch (err) {
    const isProd = process.env.NODE_ENV === 'production';
    return res.status(500).json({ message: 'Server error', error: isProd ? undefined : String(err?.message || err) });
  }
}


// List all tenant users for the authenticated broker's tenant
export async function listTenantUsers(req, res) {
  try {
    const tenantDb = (req.user && req.user.tenant_db) ? req.user.tenant_db : (req.headers['x-tenant-db'] || req.headers['x-tenant'] || '').toString();
    if (!tenantDb) return res.status(400).json({ message: 'Missing tenant' });

    const q = (req.query.q || '').toString().trim();
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const offset = (page - 1) * limit;

    const whereClauses = [];
    const params = [];
    if (q) {
      whereClauses.push('(full_name LIKE ? OR email LIKE ? OR phone LIKE ?)');
      params.push(`%${q}%`, `%${q}%`, `%${q}%`);
    }
    const where = whereClauses.length ? `WHERE ${whereClauses.join(' AND ')}` : '';

    const tenantPool = await getTenantPool(tenantDb);
      const [rows] = await tenantPool.query(
        `SELECT id, full_name, email, phone, photo, status, last_login_at, created_at, updated_at
         FROM users ${where}
         ORDER BY id DESC
         LIMIT ? OFFSET ?`,
        [...params, limit, offset]
      );
      const [countRows] = await tenantPool.query(
        `SELECT COUNT(*) as total FROM users ${where}`,
        params
      );
      return res.json({
        data: rows.map(r => ({
          id: r.id,
          name: r.full_name,
          email: r.email,
          phone: r.phone,
          photo: r.photo,
          status: r.status,
          lastLoginAt: r.last_login_at,
          createdAt: r.created_at,
          updatedAt: r.updated_at,
        })),
        meta: { page, limit, total: countRows[0]?.total || 0 }
      });
    
  } catch (err) {
    const isProd = process.env.NODE_ENV === 'production';
    return res.status(500).json({ message: 'Server error', error: isProd ? undefined : String(err?.message || err) });
  }
}

// Get a single tenant user by id
export async function getTenantUserById(req, res) {
  try {
    const tenantDb = (req.user && req.user.tenant_db) ? req.user.tenant_db : (req.headers['x-tenant-db'] || req.headers['x-tenant'] || '').toString();
    if (!tenantDb) return res.status(400).json({ message: 'Missing tenant' });
    const id = parseInt(req.params.id, 10);
    if (!id) return res.status(400).json({ message: 'Invalid id' });

    const tenantPool = await getTenantPool(tenantDb);
      const [rows] = await tenantPool.query(
        'SELECT id, full_name, email, phone, photo, status, last_login_at, created_at, updated_at FROM users WHERE id = ? LIMIT 1',
        [id]
      );
      const r = rows[0];
      if (!r) return res.status(404).json({ message: 'Not found' });
      return res.json({ data: {
        id: r.id,
        name: r.full_name,
        email: r.email,
        phone: r.phone,
        photo: r.photo,
        status: r.status,
        lastLoginAt: r.last_login_at,
        createdAt: r.created_at,
        updatedAt: r.updated_at,
      } });
    
  } catch (err) {
    const isProd = process.env.NODE_ENV === 'production';
    return res.status(500).json({ message: 'Server error', error: isProd ? undefined : String(err?.message || err) });
  }
}

// Update a tenant user's profile (by broker within same tenant)
export async function updateTenantUser(req, res) {
  try {
    const tenantDb = (req.user && req.user.tenant_db) ? req.user.tenant_db : (req.headers['x-tenant-db'] || req.headers['x-tenant'] || '').toString();
    if (!tenantDb) return res.status(400).json({ message: 'Missing tenant' });
    const id = parseInt(req.params.id, 10);
    if (!id) return res.status(400).json({ message: 'Invalid id' });

    const { full_name, email, phone, photo, password, status } = req.body || {};
    const updates = [];
    const params = [];

    if (full_name !== undefined) {
      if (!isNonEmptyString(full_name)) return res.status(400).json({ message: 'Invalid full_name' });
      updates.push('full_name = ?');
      params.push(sanitizeName(full_name));
    }
    if (email !== undefined) {
      if (!validateEmail(email)) return res.status(400).json({ message: 'Invalid email' });
      updates.push('email = ?');
      params.push(email);
    }
    if (phone !== undefined) {
      updates.push('phone = ?');
      params.push(isNonEmptyString(phone) ? phone : null);
    }
    if (photo !== undefined) {
      updates.push('photo = ?');
      params.push(isNonEmptyString(photo) ? photo : null);
    }
    if (password !== undefined) {
      if (!validatePassword(password)) return res.status(400).json({ message: 'Invalid password' });
      const password_hash = await hashPassword(password);
      updates.push('password_hash = ?');
      params.push(password_hash);
    }
    if (status !== undefined) {
      const normalized = String(status).toLowerCase();
      if (!['active','inactive'].includes(normalized)) return res.status(400).json({ message: 'Invalid status' });
      updates.push('status = ?');
      params.push(normalized);
    }

    if (updates.length === 0) return res.status(400).json({ message: 'No fields to update' });

    const tenantPool = await getTenantPool(tenantDb);
      params.push(id);
      await tenantPool.query(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`, params);
      const [rows] = await tenantPool.query(
        'SELECT id, full_name, email, phone, photo, status, last_login_at, created_at, updated_at FROM users WHERE id = ? LIMIT 1',
        [id]
      );
      const r = rows[0];
      if (!r) return res.status(404).json({ message: 'Not found' });
      return res.json({ data: {
        id: r.id,
        name: r.full_name,
        email: r.email,
        phone: r.phone,
        photo: r.photo,
        status: r.status,
        lastLoginAt: r.last_login_at,
        createdAt: r.created_at,
        updatedAt: r.updated_at,
      } });
    
  } catch (err) {
    const isProd = process.env.NODE_ENV === 'production';
    return res.status(500).json({ message: 'Server error', error: isProd ? undefined : String(err?.message || err) });
  }
}


