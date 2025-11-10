import pool from '../config/database.js';
import { validateEmail, validatePassword, isNonEmptyString, sanitizeName, getPasswordValidationError } from '../utils/validation.js';
import { hashPassword } from '../utils/hash.js';
import { emailExistsAnywhere } from '../utils/email.js';
import { normalizePortalRole, isValidPortalRole } from '../utils/portalRoles.js';

const STATUS_VALUES = ['active', 'suspended'];

function toApiSuperAdmin(row) {
  if (!row) return null;
  return {
    id: row.id,
    name: row.full_name,
    email: row.email,
    phone: row.phone,
    portalRole: row.portal_role,
    status: row.status,
    lastLoginAt: row.last_login_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function ensureManagingSuperAdmin(req, res) {
  const { role, id } = req.user || {};
  if (!role || role !== 'super_admin' || !id) {
    res.status(403).json({ message: 'Forbidden' });
    return null;
  }
  const [rows] = await pool.query(
    'SELECT id, portal_role FROM super_admins WHERE id = ? LIMIT 1',
    [id]
  );
  const current = rows[0];
  if (!current) {
    res.status(404).json({ message: 'Current super admin not found' });
    return null;
  }
  if (normalizePortalRole(current.portal_role) !== 'super_admin') {
    res.status(403).json({ message: 'Requires full super admin access' });
    return null;
  }
  return current;
}

function normalizeStatus(status) {
  if (!status) return 'active';
  const value = String(status).toLowerCase();
  return STATUS_VALUES.includes(value) ? value : 'active';
}

export async function listSuperAdminUsers(req, res) {
  try {
    const current = await ensureManagingSuperAdmin(req, res);
    if (!current) return;

    const [rows] = await pool.query(
      `SELECT id, full_name, email, phone, portal_role, status, last_login_at, created_at, updated_at
       FROM super_admins
       WHERE portal_role <> 'super_admin'
       ORDER BY created_at DESC`
    );
    const data = rows.map(toApiSuperAdmin);
    return res.json({ data });
  } catch (err) {
    const isProd = process.env.NODE_ENV === 'production';
    return res.status(500).json({ message: 'Server error', error: isProd ? undefined : String(err?.message || err) });
  }
}

export async function createSuperAdminUser(req, res) {
  try {
    const current = await ensureManagingSuperAdmin(req, res);
    if (!current) return;

    const { full_name, email, phone, password, portal_role, status } = req.body || {};
    if (!isNonEmptyString(full_name) || !validateEmail(email) || !validatePassword(password)) {
      const pwdErr = getPasswordValidationError(password);
      return res.status(400).json({
        message: 'Invalid input',
        errors: {
          full_name: isNonEmptyString(full_name) ? undefined : 'Name is required',
          email: validateEmail(email) ? undefined : 'Invalid email',
          password: pwdErr || 'Invalid password',
        },
      });
    }

    const existsAnywhere = await emailExistsAnywhere(email);
    if (existsAnywhere.exists) {
      return res.status(409).json({ message: 'Email already in use' });
    }

    const password_hash = await hashPassword(password);
    const safeName = sanitizeName(full_name);
    const portalRole = normalizePortalRole(portal_role);
    if (portalRole === 'super_admin') {
      return res.status(400).json({ message: 'Cannot create additional super admin users' });
    }
    const normalizedStatus = normalizeStatus(status);

    const [result] = await pool.query(
      `INSERT INTO super_admins (full_name, email, phone, portal_role, password_hash, status)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [safeName, email, phone || null, portalRole, password_hash, normalizedStatus]
    );

    const insertedId = result.insertId;
    const [[row]] = await pool.query(
      `SELECT id, full_name, email, phone, portal_role, status, last_login_at, created_at, updated_at
       FROM super_admins WHERE id = ? LIMIT 1`,
      [insertedId]
    );
    return res.status(201).json({ data: toApiSuperAdmin(row) });
  } catch (err) {
    const isProd = process.env.NODE_ENV === 'production';
    return res.status(500).json({ message: 'Server error', error: isProd ? undefined : String(err?.message || err) });
  }
}

export async function updateSuperAdminUser(req, res) {
  try {
    const current = await ensureManagingSuperAdmin(req, res);
    if (!current) return;

    const { id } = req.params || {};
    if (!id) return res.status(400).json({ message: 'Missing id' });

    const [[existing]] = await pool.query(
      'SELECT id, email, portal_role FROM super_admins WHERE id = ? LIMIT 1',
      [id]
    );
    if (!existing) {
      return res.status(404).json({ message: 'Super admin not found' });
    }
    if (normalizePortalRole(existing.portal_role) === 'super_admin') {
      return res.status(403).json({ message: 'Primary super admin cannot be modified' });
    }

    const { full_name, email, phone, password, portal_role, status } = req.body || {};

    const updates = [];
    const params = [];

    if (full_name !== undefined) {
      if (!isNonEmptyString(full_name)) {
        return res.status(400).json({ message: 'Invalid full_name' });
      }
      updates.push('full_name = ?');
      params.push(sanitizeName(full_name));
    }

    if (email !== undefined) {
      if (!validateEmail(email)) {
        return res.status(400).json({ message: 'Invalid email' });
      }
      if (email !== existing.email) {
        const existsAnywhere = await emailExistsAnywhere(email);
        if (existsAnywhere.exists) {
          return res.status(409).json({ message: 'Email already in use' });
        }
      }
      updates.push('email = ?');
      params.push(email);
    }

    if (phone !== undefined) {
      updates.push('phone = ?');
      params.push(isNonEmptyString(phone) ? phone : null);
    }

    if (portal_role !== undefined) {
      if (!isValidPortalRole(String(portal_role))) {
        return res.status(400).json({ message: 'Invalid portal_role' });
      }
      const normalizedRole = normalizePortalRole(portal_role);
      if (normalizedRole === 'super_admin') {
        return res.status(400).json({ message: 'Cannot assign super admin role' });
      }
      updates.push('portal_role = ?');
      params.push(normalizedRole);
    }

    if (status !== undefined) {
      updates.push('status = ?');
      params.push(normalizeStatus(status));
    }

    if (password !== undefined) {
      if (!isNonEmptyString(password) || !validatePassword(password)) {
        const pwdErr = getPasswordValidationError(password);
        return res.status(400).json({ message: pwdErr || 'Invalid password' });
      }
      const password_hash = await hashPassword(password);
      updates.push('password_hash = ?');
      params.push(password_hash);
    }

    if (updates.length === 0) {
      return res.status(400).json({ message: 'No fields to update' });
    }

    params.push(id);
    await pool.query(
      `UPDATE super_admins SET ${updates.join(', ')} WHERE id = ?`,
      params
    );

    const [[row]] = await pool.query(
      `SELECT id, full_name, email, phone, portal_role, status, last_login_at, created_at, updated_at
       FROM super_admins WHERE id = ? LIMIT 1`,
      [id]
    );
    return res.json({ data: toApiSuperAdmin(row) });
  } catch (err) {
    const isProd = process.env.NODE_ENV === 'production';
    return res.status(500).json({ message: 'Server error', error: isProd ? undefined : String(err?.message || err) });
  }
}

