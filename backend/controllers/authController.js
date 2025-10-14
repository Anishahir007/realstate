import pool from '../config/database.js';
import { validateEmail, validatePassword, isNonEmptyString, sanitizeName, toSafeDbName, getPasswordValidationError } from '../utils/validation.js';
import { hashPassword, comparePassword } from '../utils/hash.js';
import { signJwt } from '../utils/jwt.js';
import { createBrokerDatabaseIfNotExists } from '../utils/tenant.js';

async function findUserByEmail(table, email) {
  const [rows] = await pool.query(`SELECT * FROM ${table} WHERE email = ? LIMIT 1`, [email]);
  return rows[0] || null;
}

async function emailExistsAnywhere(email) {
  const [sa] = await pool.query('SELECT id FROM super_admins WHERE email = ? LIMIT 1', [email]);
  if (sa[0]) return { exists: true, in: 'super_admins' };
  const [br] = await pool.query('SELECT id FROM brokers WHERE email = ? LIMIT 1', [email]);
  if (br[0]) return { exists: true, in: 'brokers' };
  const [us] = await pool.query('SELECT id FROM users WHERE email = ? LIMIT 1', [email]);
  if (us[0]) return { exists: true, in: 'users' };
  return { exists: false };
}

export async function signupSuperAdmin(req, res) {
  try {
    const { full_name, email, phone, password, photo } = req.body || {};
    if (!isNonEmptyString(full_name) || !validateEmail(email) || !validatePassword(password)) {
      const pwdErr = getPasswordValidationError(password);
      return res.status(400).json({ message: 'Invalid input', errors: { password: pwdErr || 'Invalid password', email: validateEmail(email) ? undefined : 'Invalid email', full_name: isNonEmptyString(full_name) ? undefined : 'Name is required' } });
    }
    // Cross-role uniqueness
    const existsAnywhere = await emailExistsAnywhere(email);
    if (existsAnywhere.exists) return res.status(409).json({ message: 'Email already in use' });

    const password_hash = await hashPassword(password);
    const safeName = sanitizeName(full_name);
    const [result] = await pool.query(
      `INSERT INTO super_admins (full_name, email, phone, photo, password_hash) VALUES (?, ?, ?, ?, ?)`,
      [safeName, email, phone || null, photo || null, password_hash]
    );
    const id = result.insertId;
    const token = signJwt({ role: 'super_admin', id, email });
    return res.status(201).json({ id, token });
  } catch (err) {
    const isProd = process.env.NODE_ENV === 'production';
    return res.status(500).json({ message: 'Server error', error: isProd ? undefined : String(err?.message || err) });
  }
}

export async function loginSuperAdmin(req, res) {
  try {
    const { email, password } = req.body || {};
    if (!validateEmail(email) || !isNonEmptyString(password)) {
      return res.status(400).json({ message: 'Invalid input' });
    }
    const admin = await findUserByEmail('super_admins', email);
    if (!admin) return res.status(401).json({ message: 'Invalid credentials' });
    const ok = await comparePassword(password, admin.password_hash);
    if (!ok) return res.status(401).json({ message: 'Invalid credentials' });
    await pool.query('UPDATE super_admins SET last_login_at = NOW() WHERE id = ?', [admin.id]);
    const token = signJwt({ role: 'super_admin', id: admin.id, email: admin.email });
    return res.json({ token });
  } catch (err) {
    const isProd = process.env.NODE_ENV === 'production';
    return res.status(500).json({ message: 'Server error', error: isProd ? undefined : String(err?.message || err) });
  }
}

export async function signupBroker(req, res) {
  try {
    const { full_name, email, phone, photo, password, license_no, created_by_admin_id } = req.body || {};
    if (!isNonEmptyString(full_name) || !validateEmail(email) || !validatePassword(password)) {
      const pwdErr = getPasswordValidationError(password);
      return res.status(400).json({ message: 'Invalid input', errors: { password: pwdErr || 'Invalid password', email: validateEmail(email) ? undefined : 'Invalid email', full_name: isNonEmptyString(full_name) ? undefined : 'Name is required' } });
    }
    const existsAnywhere = await emailExistsAnywhere(email);
    if (existsAnywhere.exists) return res.status(409).json({ message: 'Email already in use' });

    // Validate foreign key if provided
    let adminIdToUse = null;
    if (created_by_admin_id !== undefined && created_by_admin_id !== null && created_by_admin_id !== '') {
      const [adminRows] = await pool.query('SELECT id FROM super_admins WHERE id = ? LIMIT 1', [created_by_admin_id]);
      if (!adminRows[0]) {
        return res.status(400).json({ message: 'Invalid created_by_admin_id (super admin not found)' });
      }
      adminIdToUse = created_by_admin_id;
    }

    const password_hash = await hashPassword(password);
    const safeName = sanitizeName(full_name);
    const tenant_db = toSafeDbName(`${safeName}_${Date.now()}`);

    // Create tenant database first
    await createBrokerDatabaseIfNotExists(tenant_db);

    const [result] = await pool.query(
      `INSERT INTO brokers (full_name, email, phone, photo, password_hash, license_no, tenant_db, created_by_admin_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [safeName, email, phone || null, photo || null, password_hash, license_no || null, tenant_db, adminIdToUse]
    );
    const id = result.insertId;
    // Create a super admin notification for new broker signup
    try {
      await pool.query(
        `INSERT INTO super_admin_notifications (type, title, message, actor_broker_id, actor_broker_name, actor_broker_email)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          'broker_signup',
          'New broker signup',
          `${safeName} has signed up as a broker`,
          id,
          safeName,
          email,
        ]
      );
    } catch (e) {
      // non-fatal
    }
    const token = signJwt({ role: 'broker', id, email, tenant_db });
    return res.status(201).json({ id, tenant_db, token });
  } catch (err) {
    console.error('signupBroker error:', err);
    const isProd = process.env.NODE_ENV === 'production';
    return res.status(500).json({ message: 'Server error', error: isProd ? undefined : String(err?.message || err) });
  }
}

export async function createBrokerByAdmin(req, res) {
  try {
    // Only for super admin via auth middleware
    const { full_name, email, phone, photo, password, license_no } = req.body || {};
    if (!isNonEmptyString(full_name) || !validateEmail(email) || !validatePassword(password)) {
      const pwdErr = getPasswordValidationError(password);
      return res.status(400).json({ message: 'Invalid input', errors: { password: pwdErr || 'Invalid password', email: validateEmail(email) ? undefined : 'Invalid email', full_name: isNonEmptyString(full_name) ? undefined : 'Name is required' } });
    }
    const existsAnywhere = await emailExistsAnywhere(email);
    if (existsAnywhere.exists) return res.status(409).json({ message: 'Email already in use' });

    const password_hash = await hashPassword(password);
    const safeName = sanitizeName(full_name);
    const tenant_db = toSafeDbName(`${safeName}_${Date.now()}`);

    await createBrokerDatabaseIfNotExists(tenant_db);

    const [result] = await pool.query(
      `INSERT INTO brokers (full_name, email, phone, photo, password_hash, license_no, tenant_db, created_by_admin_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [safeName, email, phone || null, photo || null, password_hash, license_no || null, tenant_db, req.user?.id || null]
    );
    const id = result.insertId;
    return res.status(201).json({ id, tenant_db });
  } catch (err) {
    console.error('createBrokerByAdmin error:', err);
    const isProd = process.env.NODE_ENV === 'production';
    return res.status(500).json({ message: 'Server error', error: isProd ? undefined : String(err?.message || err) });
  }
}

export async function loginBroker(req, res) {
  try {
    const { email, password } = req.body || {};
    if (!validateEmail(email) || !isNonEmptyString(password)) {
      return res.status(400).json({ message: 'Invalid input' });
    }
    const broker = await findUserByEmail('brokers', email);
    if (!broker) return res.status(401).json({ message: 'Invalid credentials' });
    const ok = await comparePassword(password, broker.password_hash);
    if (!ok) return res.status(401).json({ message: 'Invalid credentials' });
  // Block login for suspended brokers
  if (broker.status && broker.status === 'suspended') {
    return res.status(403).json({ message: 'Your account is suspended. Please contact customer support.' });
  }
    await pool.query('UPDATE brokers SET last_login_at = NOW() WHERE id = ?', [broker.id]);
    const token = signJwt({ role: 'broker', id: broker.id, email: broker.email, tenant_db: broker.tenant_db });
    return res.json({ token, tenant_db: broker.tenant_db });
  } catch (err) {
    const isProd = process.env.NODE_ENV === 'production';
    return res.status(500).json({ message: 'Server error', error: isProd ? undefined : String(err?.message || err) });
  }
}

export async function signupUser(req, res) {
  try {
    const { full_name, email, phone, photo, password, broker_id } = req.body || {};
    if (!isNonEmptyString(full_name) || !validateEmail(email) || !validatePassword(password)) {
      const pwdErr = getPasswordValidationError(password);
      return res.status(400).json({ message: 'Invalid input', errors: { password: pwdErr || 'Invalid password', email: validateEmail(email) ? undefined : 'Invalid email', full_name: isNonEmptyString(full_name) ? undefined : 'Name is required' } });
    }
    const existsAnywhere = await emailExistsAnywhere(email);
    if (existsAnywhere.exists) return res.status(409).json({ message: 'Email already in use' });
    const password_hash = await hashPassword(password);
    const safeName = sanitizeName(full_name);
    const [result] = await pool.query(
      `INSERT INTO users (full_name, email, phone, photo, password_hash, broker_id) VALUES (?, ?, ?, ?, ?, ?)`,
      [safeName, email, phone || null, photo || null, password_hash, broker_id || null]
    );
    const id = result.insertId;
    const token = signJwt({ role: 'user', id, email, broker_id: broker_id || null });
    return res.status(201).json({ id, token });
  } catch (err) {
    return res.status(500).json({ message: 'Server error' });
  }
}

export async function loginUser(req, res) {
  try {
    const { email, password } = req.body || {};
    if (!validateEmail(email) || !isNonEmptyString(password)) {
      return res.status(400).json({ message: 'Invalid input' });
    }
    const user = await findUserByEmail('users', email);
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });
    const ok = await comparePassword(password, user.password_hash);
    if (!ok) return res.status(401).json({ message: 'Invalid credentials' });
    await pool.query('UPDATE users SET last_login_at = NOW() WHERE id = ?', [user.id]);
    const token = signJwt({ role: 'user', id: user.id, email: user.email, broker_id: user.broker_id });
    return res.json({ token });
  } catch (err) {
    return res.status(500).json({ message: 'Server error' });
  }
}

export async function whoami(req, res) {
  try {
    const { role, id } = req.user || {};
    if (!role || !id) return res.status(401).json({ message: 'Unauthorized' });

    if (role === 'super_admin') {
      const [rows] = await pool.query(
        'SELECT id, full_name, email, phone, photo, last_login_at FROM super_admins WHERE id = ? LIMIT 1',
        [id]
      );
      const row = rows[0];
      if (!row) return res.status(404).json({ message: 'Not found' });
      return res.json({
        data: {
          id: row.id,
          role,
          name: row.full_name,
          email: row.email,
          phone: row.phone,
          photo: row.photo,
          lastLoginAt: row.last_login_at,
        },
      });
    }

    if (role === 'broker') {
      const [rows] = await pool.query(
        'SELECT id, full_name, email, phone, photo, license_no, tenant_db, created_by_admin_id, last_login_at FROM brokers WHERE id = ? LIMIT 1',
        [id]
      );
      const row = rows[0];
      if (!row) return res.status(404).json({ message: 'Not found' });
      return res.json({
        data: {
          id: row.id,
          role,
          name: row.full_name,
          email: row.email,
          phone: row.phone,
          photo: row.photo,
          licenseNo: row.license_no,
          tenantDb: row.tenant_db,
          createdByAdminId: row.created_by_admin_id,
          lastLoginAt: row.last_login_at,
        },
      });
    }

    if (role === 'user') {
      const [rows] = await pool.query(
        'SELECT id, full_name, email, phone, photo, broker_id, last_login_at FROM users WHERE id = ? LIMIT 1',
        [id]
      );
      const row = rows[0];
      if (!row) return res.status(404).json({ message: 'Not found' });
      return res.json({
        data: {
          id: row.id,
          role,
          name: row.full_name,
          email: row.email,
          phone: row.phone,
          photo: row.photo,
          brokerId: row.broker_id,
          lastLoginAt: row.last_login_at,
        },
      });
    }

    return res.status(400).json({ message: 'Unsupported role' });
  } catch (err) {
    const isProd = process.env.NODE_ENV === 'production';
    return res.status(500).json({ message: 'Server error', error: isProd ? undefined : String(err?.message || err) });
  }
}

export async function updateSuperAdminProfile(req, res) {
  try {
    const { role, id } = req.user || {};
    if (!role || role !== 'super_admin' || !id) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    const { full_name, email, phone } = req.body || {};  
    // If file upload present, map to photo URL
    let photo = undefined;
    if (req.file) {
      const relPath = `/${req.file.destination.replace(/\\/g, '/').replace(/^public\//, '')}/${req.file.filename}`;
      photo = relPath;
    } else if (Object.prototype.hasOwnProperty.call(req.body, 'photo')) {
      // allow JSON payload to set/reset photo as URL
      photo = req.body.photo;
    }

    const updates = [];
    const params = [];

    if (full_name !== undefined) {
      if (!isNonEmptyString(full_name)) return res.status(400).json({ message: 'Invalid full_name' });
      updates.push('full_name = ?');
      params.push(sanitizeName(full_name));
    }

    if (email !== undefined) {
      if (!validateEmail(email)) return res.status(400).json({ message: 'Invalid email' });
      const [dupes] = await pool.query('SELECT id FROM super_admins WHERE email = ? AND id <> ? LIMIT 1', [email, id]);
      if (dupes[0]) return res.status(409).json({ message: 'Email already exists' });
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

    if (updates.length === 0) {
      return res.status(400).json({ message: 'No fields to update' });
    }

    params.push(id);
    await pool.query(`UPDATE super_admins SET ${updates.join(', ')} WHERE id = ?`, params);

    const [rows] = await pool.query(
      'SELECT id, full_name, email, phone, photo, last_login_at FROM super_admins WHERE id = ? LIMIT 1',
      [id]
    );
    const row = rows[0];
    return res.json({
      data: {
        id: row.id,
        role: 'super_admin',
        name: row.full_name,
        email: row.email,
        phone: row.phone,
        photo: row.photo,
        lastLoginAt: row.last_login_at,
      },
    });
  } catch (err) {
    const isProd = process.env.NODE_ENV === 'production';
    return res.status(500).json({ message: 'Server error', error: isProd ? undefined : String(err?.message || err) });
  }
}


