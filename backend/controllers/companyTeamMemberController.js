import pool from '../config/database.js';
import { validateEmail, validatePassword, isNonEmptyString, sanitizeName, getPasswordValidationError } from '../utils/validation.js';
import { hashPassword } from '../utils/hash.js';
import { emailExistsAnywhere } from '../utils/email.js';
import { normalizePortalRole, isValidPortalRole, COMPANY_PORTAL_ROLES } from '../utils/portalRoles.js';

const STATUS_VALUES = ['active', 'suspended'];

function buildPhotoPath(file) {
  if (!file) return null;
  return `/${file.destination.replace(/\\/g, '/').replace(/^public\//, '')}/${file.filename}`;
}

function toApiCompanyTeamMember(row) {
  if (!row) return null;
  return {
    id: row.id,
    name: row.full_name,
    email: row.email,
    phone: row.phone,
    photo: row.photo,
    portalRole: row.portal_role,
    status: row.status,
    lastLoginAt: row.last_login_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function ensureManagingCompany(req, res) {
  const { role, id, tenant_db } = req.user || {};
  if (!role || role !== 'company' || !id || !tenant_db) {
    res.status(403).json({ message: 'Forbidden' });
    return null;
  }
  const [rows] = await pool.query(
    'SELECT id, portal_role, tenant_db FROM companies WHERE id = ? LIMIT 1',
    [id]
  );
  const current = rows[0];
  if (!current) {
    res.status(404).json({ message: 'Current company not found' });
    return null;
  }
  if (current.tenant_db !== tenant_db) {
    res.status(403).json({ message: 'Invalid tenant' });
    return null;
  }
  return current;
}

function normalizeStatus(status) {
  if (!status) return 'active';
  const value = String(status).toLowerCase();
  return STATUS_VALUES.includes(value) ? value : 'active';
}

// List company team members (all companies with same tenant_db, excluding the main company_admin)
export async function listCompanyTeamMembers(req, res) {
  try {
    const current = await ensureManagingCompany(req, res);
    if (!current) return;

    const [rows] = await pool.query(
      `SELECT id, full_name, email, phone, photo, portal_role, status, last_login_at, created_at, updated_at
       FROM companies
       WHERE tenant_db = ? AND portal_role <> 'company_admin'
       ORDER BY created_at DESC`,
      [current.tenant_db]
    );
    const data = rows.map(toApiCompanyTeamMember);
    return res.json({ data });
  } catch (err) {
    const isProd = process.env.NODE_ENV === 'production';
    return res.status(500).json({ message: 'Server error', error: isProd ? undefined : String(err?.message || err) });
  }
}

export async function createCompanyTeamMember(req, res) {
  try {
    const current = await ensureManagingCompany(req, res);
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
    if (!COMPANY_PORTAL_ROLES.includes(portalRole) || portalRole === 'company_admin') {
      return res.status(400).json({ message: 'Invalid portal role for team member' });
    }
    const normalizedStatus = normalizeStatus(status);
    const photoPath = buildPhotoPath(req.file);

    // Get company_name from current company
    const [companyRows] = await pool.query('SELECT company_name FROM companies WHERE id = ? LIMIT 1', [current.id]);
    const companyName = companyRows[0]?.company_name || 'Company';

    const [result] = await pool.query(
      `INSERT INTO companies (full_name, email, phone, photo, portal_role, password_hash, status, company_name, tenant_db)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [safeName, email, isNonEmptyString(phone) ? phone : null, photoPath, portalRole, password_hash, normalizedStatus, companyName, current.tenant_db]
    );

    const insertedId = result.insertId;
    const [[row]] = await pool.query(
      `SELECT id, full_name, email, phone, photo, portal_role, status, last_login_at, created_at, updated_at
       FROM companies WHERE id = ? LIMIT 1`,
      [insertedId]
    );
    return res.status(201).json({ data: toApiCompanyTeamMember(row) });
  } catch (err) {
    const isProd = process.env.NODE_ENV === 'production';
    return res.status(500).json({ message: 'Server error', error: isProd ? undefined : String(err?.message || err) });
  }
}

export async function updateCompanyTeamMember(req, res) {
  try {
    const current = await ensureManagingCompany(req, res);
    if (!current) return;

    const { id } = req.params || {};
    if (!id) return res.status(400).json({ message: 'Missing id' });

    const [[existing]] = await pool.query(
      'SELECT id, email, portal_role, tenant_db FROM companies WHERE id = ? LIMIT 1',
      [id]
    );
    if (!existing) {
      return res.status(404).json({ message: 'Team member not found' });
    }
    if (existing.tenant_db !== current.tenant_db) {
      return res.status(403).json({ message: 'Cannot modify team member from different company' });
    }
    if (normalizePortalRole(existing.portal_role) === 'company_admin') {
      return res.status(403).json({ message: 'Company admin cannot be modified here' });
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
      if (!COMPANY_PORTAL_ROLES.includes(normalizedRole) || normalizedRole === 'company_admin') {
        return res.status(400).json({ message: 'Cannot assign company_admin role' });
      }
      updates.push('portal_role = ?');
      params.push(normalizedRole);
    }

    if (status !== undefined) {
      updates.push('status = ?');
      params.push(normalizeStatus(status));
    }

    if (password !== undefined) {
      const trimmedPassword = typeof password === 'string' ? password.trim() : '';
      if (trimmedPassword) {
        if (!validatePassword(trimmedPassword)) {
          const pwdErr = getPasswordValidationError(trimmedPassword);
          return res.status(400).json({ message: pwdErr || 'Invalid password' });
        }
        const password_hash = await hashPassword(trimmedPassword);
        updates.push('password_hash = ?');
        params.push(password_hash);
      }
    }

    if (req.file) {
      updates.push('photo = ?');
      params.push(buildPhotoPath(req.file));
    } else if (req.body && Object.prototype.hasOwnProperty.call(req.body, 'remove_photo')) {
      const removeFlag = String(req.body.remove_photo).toLowerCase();
      if (['1', 'true', 'yes'].includes(removeFlag)) {
        updates.push('photo = ?');
        params.push(null);
      }
    }

    if (updates.length === 0) {
      return res.status(400).json({ message: 'No fields to update' });
    }

    params.push(id);
    await pool.query(
      `UPDATE companies SET ${updates.join(', ')} WHERE id = ?`,
      params
    );

    const [[row]] = await pool.query(
      `SELECT id, full_name, email, phone, photo, portal_role, status, last_login_at, created_at, updated_at
       FROM companies WHERE id = ? LIMIT 1`,
      [id]
    );
    return res.json({ data: toApiCompanyTeamMember(row) });
  } catch (err) {
    const isProd = process.env.NODE_ENV === 'production';
    return res.status(500).json({ message: 'Server error', error: isProd ? undefined : String(err?.message || err) });
  }
}

