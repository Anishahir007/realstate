import pool from '../config/database.js';
import { isNonEmptyString, sanitizeName, validateEmail, validatePassword } from '../utils/validation.js';
import { hashPassword } from '../utils/hash.js';
import { createBrokerDatabaseIfNotExists } from '../utils/tenant.js';

function mapBrokerRow(row) {
  const status = row.status || (row.last_login_at ? 'active' : 'pending');
  return {
    id: row.id,
    name: row.full_name,
    email: row.email,
    phone: row.phone,
    photo: row.photo,
    licenseNo: row.license_no,
    tenantDb: row.tenant_db,
    createdByAdminId: row.created_by_admin_id,
    lastLoginAt: row.last_login_at,
    status,
  };
}

export async function listBrokers(req, res) {
  try {
    const q = (req.query.q || '').toString().trim();
    const status = (req.query.status || '').toString().trim().toLowerCase();
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const offset = (page - 1) * limit;

    const whereClauses = [];
    const params = [];
    if (q) {
      whereClauses.push('(full_name LIKE ? OR email LIKE ? OR phone LIKE ?)');
      params.push(`%${q}%`, `%${q}%`, `%${q}%`);
    }
    if (status) {
      if (status === 'active' || status === 'suspended') {
        whereClauses.push('status = ?');
        params.push(status);
      } else if (status === 'pending') {
        // Treat as not logged in yet
        whereClauses.push('last_login_at IS NULL');
      }
    }
    const where = whereClauses.length ? `WHERE ${whereClauses.join(' AND ')}` : '';

    const [rows] = await pool.query(
      `SELECT id, full_name, email, phone, photo, license_no, tenant_db, status, created_by_admin_id, last_login_at
       FROM brokers ${where} ORDER BY id DESC LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    const [countRows] = await pool.query(
      `SELECT COUNT(*) as total FROM brokers ${where}`,
      params
    );

    const data = rows.map(mapBrokerRow);
    return res.json({
      data,
      meta: { page, limit, total: countRows[0]?.total || 0 }
    });
  } catch (err) {
    const isProd = process.env.NODE_ENV === 'production';
    return res.status(500).json({ message: 'Server error', error: isProd ? undefined : String(err?.message || err) });
  }
}

export async function getMyBrokerProfile(req, res) {
  try {
    const brokerId = req.user?.id;
    if (!brokerId) return res.status(401).json({ message: 'Unauthorized' });

    const [rows] = await pool.query(
      'SELECT id, full_name, email, phone, photo, license_no, tenant_db, status, created_by_admin_id, last_login_at FROM brokers WHERE id = ? LIMIT 1',
      [brokerId]
    );
    const row = rows[0];
    if (!row) return res.status(404).json({ message: 'Not found' });
    return res.json({ data: mapBrokerRow(row) });
  } catch (err) {
    const isProd = process.env.NODE_ENV === 'production';
    return res.status(500).json({ message: 'Server error', error: isProd ? undefined : String(err?.message || err) });
  }
}

export async function getBrokerById(req, res) {
  try {
    const id = parseInt(req.params.id, 10);
    if (!id) return res.status(400).json({ message: 'Invalid id' });

    const [rows] = await pool.query(
      'SELECT id, full_name, email, phone, photo, license_no, tenant_db, status, created_by_admin_id, last_login_at FROM brokers WHERE id = ? LIMIT 1',
      [id]
    );
    const row = rows[0];
    if (!row) return res.status(404).json({ message: 'Not found' });
    return res.json({ data: mapBrokerRow(row) });
  } catch (err) {
    const isProd = process.env.NODE_ENV === 'production';
    return res.status(500).json({ message: 'Server error', error: isProd ? undefined : String(err?.message || err) });
  }
}

export async function createBroker(req, res) {
  try {
    const { full_name, email, phone, password, license_no, status } = req.body || {};
    if (!isNonEmptyString(full_name) || !validateEmail(email) || !validatePassword(password)) {
      return res.status(400).json({ message: 'Invalid input' });
    }
    const [existingRows] = await pool.query('SELECT id FROM brokers WHERE email = ? LIMIT 1', [email]);
    if (existingRows[0]) return res.status(409).json({ message: 'Email already exists' });

    const safeName = sanitizeName(full_name);
    const tenant_db = `realstate_broker_${Date.now()}`; // unique, sanitized in tenant creator
    await createBrokerDatabaseIfNotExists(tenant_db);

    const password_hash = await hashPassword(password);
    const photoPath = req.file ? `/profiles/${req.file.originalname}` : null;
    const normalizedStatus = (status && ['active', 'suspended'].includes(String(status).toLowerCase())) ? String(status).toLowerCase() : undefined;
    const [result] = await pool.query(
      `INSERT INTO brokers (full_name, email, phone, photo, password_hash, license_no, tenant_db, created_by_admin_id${normalizedStatus ? ', status' : ''}) VALUES (?, ?, ?, ?, ?, ?, ?, ?${normalizedStatus ? ', ?' : ''})`,
      [safeName, email, phone || null, photoPath, password_hash, license_no || null, tenant_db, req.user?.id || null, ...(normalizedStatus ? [normalizedStatus] : [])]
    );
    const id = result.insertId;
    const [rows] = await pool.query(
      'SELECT id, full_name, email, phone, photo, license_no, tenant_db, status, created_by_admin_id, last_login_at FROM brokers WHERE id = ? LIMIT 1',
      [id]
    );
    return res.status(201).json({ data: mapBrokerRow(rows[0]) });
  } catch (err) {
    const isProd = process.env.NODE_ENV === 'production';
    return res.status(500).json({ message: 'Server error', error: isProd ? undefined : String(err?.message || err) });
  }
}

export async function updateBroker(req, res) {
  try {
    const id = parseInt(req.params.id, 10);
    if (!id) return res.status(400).json({ message: 'Invalid id' });

    const { full_name, email, phone, license_no, status } = req.body || {};
    const updates = [];
    const params = [];

    if (full_name !== undefined) {
      if (!isNonEmptyString(full_name)) return res.status(400).json({ message: 'Invalid full_name' });
      updates.push('full_name = ?');
      params.push(sanitizeName(full_name));
    }
    if (email !== undefined) {
      if (!validateEmail(email)) return res.status(400).json({ message: 'Invalid email' });
      const [dupes] = await pool.query('SELECT id FROM brokers WHERE email = ? AND id <> ? LIMIT 1', [email, id]);
      if (dupes[0]) return res.status(409).json({ message: 'Email already exists' });
      updates.push('email = ?');
      params.push(email);
    }
    if (phone !== undefined) {
      updates.push('phone = ?');
      params.push(isNonEmptyString(phone) ? phone : null);
    }
    // photo from multipart
    if (req.file) {
      updates.push('photo = ?');
      params.push(`/profiles/${req.file.originalname}`);
    }
    if (license_no !== undefined) {
      updates.push('license_no = ?');
      params.push(isNonEmptyString(license_no) ? license_no : null);
    }
    if (status !== undefined) {
      const normalized = String(status).toLowerCase();
      if (!['active', 'suspended'].includes(normalized)) {
        return res.status(400).json({ message: 'Invalid status' });
      }
      updates.push('status = ?');
      params.push(normalized);
    }

    if (updates.length === 0) {
      return res.status(400).json({ message: 'No fields to update' });
    }

    params.push(id);
    await pool.query(`UPDATE brokers SET ${updates.join(', ')} WHERE id = ?`, params);

    const [rows] = await pool.query(
      'SELECT id, full_name, email, phone, photo, license_no, tenant_db, created_by_admin_id, last_login_at FROM brokers WHERE id = ? LIMIT 1',
      [id]
    );
    if (!rows[0]) return res.status(404).json({ message: 'Not found' });
    return res.json({ data: mapBrokerRow(rows[0]) });
  } catch (err) {
    const isProd = process.env.NODE_ENV === 'production';
    return res.status(500).json({ message: 'Server error', error: isProd ? undefined : String(err?.message || err) });
  }
}


