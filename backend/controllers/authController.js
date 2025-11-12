import pool from '../config/database.js';
import { validateEmail, validatePassword, isNonEmptyString, sanitizeName, toSafeDbName, getPasswordValidationError } from '../utils/validation.js';
import { hashPassword, comparePassword } from '../utils/hash.js';
import { signJwt } from '../utils/jwt.js';
import { createBrokerDatabaseIfNotExists } from '../utils/tenant.js';
import { sendSignupOtp, verifySignupOtp, consumeOtp } from '../utils/otp.js';
import { normalizePortalRole, isValidPortalRole } from '../utils/portalRoles.js';
import { emailExistsAnywhere } from '../utils/email.js';

async function findUserByEmail(table, email) {
  const [rows] = await pool.query(`SELECT * FROM ${table} WHERE email = ? LIMIT 1`, [email]);
  return rows[0] || null;
}

export async function signupSuperAdmin(req, res) {
  try {
    const { full_name, email, phone, password, photo, portal_role } = req.body || {};
    if (!isNonEmptyString(full_name) || !validateEmail(email) || !validatePassword(password)) {
      const pwdErr = getPasswordValidationError(password);
      return res.status(400).json({ message: 'Invalid input', errors: { password: pwdErr || 'Invalid password', email: validateEmail(email) ? undefined : 'Invalid email', full_name: isNonEmptyString(full_name) ? undefined : 'Name is required' } });
    }
    const portalRole = normalizePortalRole(portal_role);
    // Cross-role uniqueness
    const existsAnywhere = await emailExistsAnywhere(email);
    if (existsAnywhere.exists) return res.status(409).json({ message: 'Email already in use' });

    const password_hash = await hashPassword(password);
    const safeName = sanitizeName(full_name);
    const [result] = await pool.query(
      `INSERT INTO super_admins (full_name, email, phone, photo, portal_role, password_hash) VALUES (?, ?, ?, ?, ?, ?)`,
      [safeName, email, phone || null, photo || null, portalRole, password_hash]
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
    const { full_name, email, phone, photo, password, license_no, location, company_name, created_by_admin_id, otpId, otpCode } = req.body || {};
    if (!isNonEmptyString(full_name) || !validateEmail(email) || !validatePassword(password) || !isNonEmptyString(phone)) {
      const pwdErr = getPasswordValidationError(password);
      return res.status(400).json({ message: 'Invalid input', errors: { password: pwdErr || 'Invalid password', email: validateEmail(email) ? undefined : 'Invalid email', full_name: isNonEmptyString(full_name) ? undefined : 'Name is required', phone: isNonEmptyString(phone) ? undefined : 'Phone is required' } });
    }
    const existsAnywhere = await emailExistsAnywhere(email);
    if (existsAnywhere.exists) return res.status(409).json({ message: 'Email already in use' });
    
    // Step 1: Send OTP if otpId/otpCode not provided
    if (!otpId || !otpCode) {
      console.log('[signupBroker] Sending OTP to', phone);
      const { otpId: createdOtpId } = await sendSignupOtp({
        phone,
        purpose: 'broker_signup',
        meta: { full_name, email, phone, photo: photo || null, password, license_no, location: location || null, company_name: company_name || null, created_by_admin_id: created_by_admin_id ?? null },
      });
      return res.status(202).json({ otpId: createdOtpId, message: 'OTP sent to phone' });
    }

    // Step 2: Verify OTP and create broker
    const verification = await verifySignupOtp({ otpId, code: otpCode, expectedPurpose: 'broker_signup' });
    console.log('[signupBroker] OTP verify result', verification);
    if (!verification.ok) return res.status(400).json({ message: 'OTP verification failed', reason: verification.reason });
    const meta = verification.meta || {};
    // Merge fields from current request if meta is missing (handles cases where OTP was sent without full payload)
    const merged = {
      full_name: req.body?.full_name ?? meta.full_name,
      email: req.body?.email ?? meta.email,
      phone: req.body?.phone ?? meta.phone ?? verification.phone,
      photo: req.body?.photo ?? meta.photo,
      password: req.body?.password ?? meta.password,
      license_no: req.body?.license_no ?? meta.license_no,
      location: req.body?.location ?? meta.location,
      company_name: req.body?.company_name ?? meta.company_name,
      created_by_admin_id: req.body?.created_by_admin_id ?? meta.created_by_admin_id,
    };
    if (!isNonEmptyString(merged.full_name) || !validateEmail(merged.email) || !validatePassword(merged.password) || !isNonEmptyString(merged.phone)) {
      const pwdErr = getPasswordValidationError(merged.password);
      return res.status(400).json({ message: 'Invalid input', errors: { password: pwdErr || 'Invalid password', email: validateEmail(merged.email) ? undefined : 'Invalid email', full_name: isNonEmptyString(merged.full_name) ? undefined : 'Name is required', phone: isNonEmptyString(merged.phone) ? undefined : 'Phone is required' } });
    }

    // Validate foreign key if provided
    let adminIdToUse = null;
    if (meta.created_by_admin_id !== undefined && meta.created_by_admin_id !== null && meta.created_by_admin_id !== '') {
      const [adminRows] = await pool.query('SELECT id FROM super_admins WHERE id = ? LIMIT 1', [meta.created_by_admin_id]);
      if (!adminRows[0]) {
        return res.status(400).json({ message: 'Invalid created_by_admin_id (super admin not found)' });
      }
      adminIdToUse = meta.created_by_admin_id;
    }

    const password_hash = await hashPassword(merged.password);
    const safeName = sanitizeName(merged.full_name);
    const tenant_db = toSafeDbName(`${safeName}_${Date.now()}`);

    await createBrokerDatabaseIfNotExists(tenant_db);

    const [result] = await pool.query(
      `INSERT INTO brokers (full_name, email, phone, photo, password_hash, license_no, location, company_name, tenant_db, created_by_admin_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [safeName, merged.email, merged.phone || null, merged.photo || null, password_hash, merged.license_no || null, merged.location || null, merged.company_name || null, tenant_db, adminIdToUse]
    );
    const id = result.insertId;
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
          merged.email,
        ]
      );
    } catch (e) {
    }
    await consumeOtp(otpId);
    const token = signJwt({ role: 'broker', id, email: meta.email, tenant_db });
    return res.status(201).json({ id, tenant_db, token });
  } catch (err) {
    console.error('signupBroker error:', err);
    const isProd = process.env.NODE_ENV === 'production';
    return res.status(500).json({ message: 'Server error', error: isProd ? undefined : String(err?.message || err), stack: isProd ? undefined : err?.stack });
  }
}

export async function createBrokerByAdmin(req, res) {
  try {
    // Only for super admin via auth middleware
    const { full_name, email, phone, photo, password, license_no, location, company_name } = req.body || {};
    if (!isNonEmptyString(full_name) || !validateEmail(email) || !validatePassword(password)) {
      const pwdErr = getPasswordValidationError(password);
      return res.status(400).json({ message: 'Invalid input', errors: { password: pwdErr || 'Invalid password', email: validateEmail(email) ? undefined : 'Invalid email', full_name: isNonEmptyString(full_name) ? undefined : 'Name is required' } });
    }
    const existsAnywhere = await emailExistsAnywhere(email);
    if (existsAnywhere.exists) return res.status(409).json({ message: 'Email already in use' });

    // Handle file uploads
    let photoPath = photo || null;
    if (req.files) {
      if (req.files.photo && req.files.photo[0]) {
        photoPath = `/${req.files.photo[0].destination.replace(/\\/g, '/').replace(/^public\//, '')}/${req.files.photo[0].filename}`;
      }
    } else if (req.file) {
      photoPath = `/${req.file.destination.replace(/\\/g, '/').replace(/^public\//, '')}/${req.file.filename}`;
    }

    let documentFront = null;
    let documentBack = null;
    let documentType = null;
    if (req.files) {
      if (req.files.document_front && req.files.document_front[0]) {
        documentFront = `/${req.files.document_front[0].destination.replace(/\\/g, '/').replace(/^public\//, '')}/${req.files.document_front[0].filename}`;
      }
      if (req.files.document_back && req.files.document_back[0]) {
        documentBack = `/${req.files.document_back[0].destination.replace(/\\/g, '/').replace(/^public\//, '')}/${req.files.document_back[0].filename}`;
      }
    }
    if (req.body.document_type && ['aadhaar', 'pan_card', 'driving_license', 'voter_id', 'other'].includes(req.body.document_type)) {
      documentType = req.body.document_type;
    }

    const password_hash = await hashPassword(password);
    const safeName = sanitizeName(full_name);
    const tenant_db = toSafeDbName(`${safeName}_${Date.now()}`);

    await createBrokerDatabaseIfNotExists(tenant_db);

    const [result] = await pool.query(
      `INSERT INTO brokers (full_name, email, phone, photo, password_hash, license_no, location, company_name, tenant_db, document_type, document_front, document_back, created_by_admin_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [safeName, email, phone || null, photoPath, password_hash, license_no || null, location || null, company_name || null, tenant_db, documentType, documentFront, documentBack, req.user?.id || null]
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

export async function signupCompany(req, res) {
  try {
    const { full_name, email, phone, photo, password, company_name, location, portal_role, created_by_admin_id, otpId, otpCode } = req.body || {};
    if (!isNonEmptyString(full_name) || !validateEmail(email) || !validatePassword(password) || !isNonEmptyString(phone) || !isNonEmptyString(company_name)) {
      const pwdErr = getPasswordValidationError(password);
      return res.status(400).json({ message: 'Invalid input', errors: { password: pwdErr || 'Invalid password', email: validateEmail(email) ? undefined : 'Invalid email', full_name: isNonEmptyString(full_name) ? undefined : 'Name is required', phone: isNonEmptyString(phone) ? undefined : 'Phone is required', company_name: isNonEmptyString(company_name) ? undefined : 'Company name is required' } });
    }
    const existsAnywhere = await emailExistsAnywhere(email);
    if (existsAnywhere.exists) return res.status(409).json({ message: 'Email already in use' });
    
    // Step 1: Send OTP if otpId/otpCode not provided
    if (!otpId || !otpCode) {
      console.log('[signupCompany] Sending OTP to', phone);
      const { otpId: createdOtpId } = await sendSignupOtp({
        phone,
        purpose: 'company_signup',
        meta: { full_name, email, phone, photo: photo || null, password, company_name, location: location || null, portal_role: portal_role || 'company_admin', created_by_admin_id: created_by_admin_id ?? null },
      });
      return res.status(202).json({ otpId: createdOtpId, message: 'OTP sent to phone' });
    }

    // Step 2: Verify OTP and create company
    const verification = await verifySignupOtp({ otpId, code: otpCode, expectedPurpose: 'company_signup' });
    console.log('[signupCompany] OTP verify result', verification);
    if (!verification.ok) return res.status(400).json({ message: 'OTP verification failed', reason: verification.reason });
    const meta = verification.meta || {};
    const merged = {
      full_name: req.body?.full_name ?? meta.full_name,
      email: req.body?.email ?? meta.email,
      phone: req.body?.phone ?? meta.phone ?? verification.phone,
      photo: req.body?.photo ?? meta.photo,
      password: req.body?.password ?? meta.password,
      company_name: req.body?.company_name ?? meta.company_name,
      location: req.body?.location ?? meta.location,
      portal_role: req.body?.portal_role ?? meta.portal_role ?? 'company_admin',
      created_by_admin_id: req.body?.created_by_admin_id ?? meta.created_by_admin_id,
    };
    if (!isNonEmptyString(merged.full_name) || !validateEmail(merged.email) || !validatePassword(merged.password) || !isNonEmptyString(merged.phone) || !isNonEmptyString(merged.company_name)) {
      const pwdErr = getPasswordValidationError(merged.password);
      return res.status(400).json({ message: 'Invalid input', errors: { password: pwdErr || 'Invalid password', email: validateEmail(merged.email) ? undefined : 'Invalid email', full_name: isNonEmptyString(merged.full_name) ? undefined : 'Name is required', phone: isNonEmptyString(merged.phone) ? undefined : 'Phone is required', company_name: isNonEmptyString(merged.company_name) ? undefined : 'Company name is required' } });
    }

    let adminIdToUse = null;
    if (meta.created_by_admin_id !== undefined && meta.created_by_admin_id !== null && meta.created_by_admin_id !== '') {
      const [adminRows] = await pool.query('SELECT id FROM super_admins WHERE id = ? LIMIT 1', [meta.created_by_admin_id]);
      if (!adminRows[0]) {
        return res.status(400).json({ message: 'Invalid created_by_admin_id (super admin not found)' });
      }
      adminIdToUse = meta.created_by_admin_id;
    }

    const password_hash = await hashPassword(merged.password);
    const safeName = sanitizeName(merged.full_name);
    const tenant_db = toSafeDbName(`company_${safeName}_${Date.now()}`);
    const portalRole = normalizePortalRole(merged.portal_role || 'company_admin');

    await createBrokerDatabaseIfNotExists(tenant_db);

    const [result] = await pool.query(
      `INSERT INTO companies (full_name, email, phone, photo, password_hash, portal_role, company_name, location, tenant_db, created_by_admin_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [safeName, merged.email, merged.phone || null, merged.photo || null, password_hash, portalRole, merged.company_name, merged.location || null, tenant_db, adminIdToUse]
    );
    const id = result.insertId;
    try {
      await pool.query(
        `INSERT INTO super_admin_notifications (type, title, message, actor_broker_id, actor_broker_name, actor_broker_email)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          'company_signup',
          'New company signup',
          `${merged.company_name} has signed up as a company`,
          id,
          safeName,
          merged.email,
        ]
      );
    } catch (e) {
    }
    await consumeOtp(otpId);
    const token = signJwt({ role: 'company', id, email: meta.email, tenant_db });
    return res.status(201).json({ id, tenant_db, token });
  } catch (err) {
    console.error('signupCompany error:', err);
    const isProd = process.env.NODE_ENV === 'production';
    return res.status(500).json({ message: 'Server error', error: isProd ? undefined : String(err?.message || err), stack: isProd ? undefined : err?.stack });
  }
}

export async function loginCompany(req, res) {
  try {
    const { email, password } = req.body || {};
    if (!validateEmail(email) || !isNonEmptyString(password)) {
      return res.status(400).json({ message: 'Invalid input' });
    }
    const company = await findUserByEmail('companies', email);
    if (!company) return res.status(401).json({ message: 'Invalid credentials' });
    const ok = await comparePassword(password, company.password_hash);
    if (!ok) return res.status(401).json({ message: 'Invalid credentials' });
    // Block login for suspended companies
    if (company.status && company.status === 'suspended') {
      return res.status(403).json({ message: 'Your account is suspended. Please contact customer support.' });
    }
    await pool.query('UPDATE companies SET last_login_at = NOW() WHERE id = ?', [company.id]);
    const token = signJwt({ role: 'company', id: company.id, email: company.email, tenant_db: company.tenant_db });
    return res.json({ token, tenant_db: company.tenant_db });
  } catch (err) {
    const isProd = process.env.NODE_ENV === 'production';
    return res.status(500).json({ message: 'Server error', error: isProd ? undefined : String(err?.message || err) });
  }
}

export async function signupUser(req, res) {
  try {
    const { full_name, email, phone, photo, password, broker_id, otpId, otpCode } = req.body || {};
    if (!isNonEmptyString(full_name) || !validateEmail(email) || !validatePassword(password) || !isNonEmptyString(phone)) {
      const pwdErr = getPasswordValidationError(password);
      return res.status(400).json({ message: 'Invalid input', errors: { password: pwdErr || 'Invalid password', email: validateEmail(email) ? undefined : 'Invalid email', full_name: isNonEmptyString(full_name) ? undefined : 'Name is required', phone: isNonEmptyString(phone) ? undefined : 'Phone is required' } });
    }
    const existsAnywhere = await emailExistsAnywhere(email);
    if (existsAnywhere.exists) return res.status(409).json({ message: 'Email already in use' });

    if (!otpId || !otpCode) {
      console.log('[signupUser] Sending OTP to', phone);
      const { otpId: createdOtpId } = await sendSignupOtp({
        phone,
        purpose: 'user_signup',
        meta: { full_name, email, phone, photo: photo || null, password, broker_id: broker_id ?? null },
      });
      return res.status(202).json({ otpId: createdOtpId, message: 'OTP sent to phone' });
    }

    const verification = await verifySignupOtp({ otpId, code: otpCode, expectedPurpose: 'user_signup' });
    console.log('[signupUser] OTP verify result', verification);
    if (!verification.ok) return res.status(400).json({ message: 'OTP verification failed', reason: verification.reason });
    const meta = verification.meta || {};

    const password_hash = await hashPassword(meta.password);
    const safeName = sanitizeName(meta.full_name);
    const [result] = await pool.query(
      `INSERT INTO users (full_name, email, phone, photo, password_hash, broker_id) VALUES (?, ?, ?, ?, ?, ?)`,
      [safeName, meta.email, meta.phone || null, meta.photo || null, password_hash, meta.broker_id || null]
    );
    const id = result.insertId;
    await consumeOtp(otpId);
    const token = signJwt({ role: 'user', id, email: meta.email, broker_id: meta.broker_id || null });
    return res.status(201).json({ id, token });
  } catch (err) {
    console.error('signupUser error:', err);
    const isProd = process.env.NODE_ENV === 'production';
    return res.status(500).json({ message: 'Server error', error: isProd ? undefined : String(err?.message || err), stack: isProd ? undefined : err?.stack });
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
        'SELECT id, full_name, email, phone, photo, portal_role, last_login_at FROM super_admins WHERE id = ? LIMIT 1',
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
          portalRole: row.portal_role,
          lastLoginAt: row.last_login_at,
        },
      });
    }

    if (role === 'broker') {
      // Check if document columns exist, if not use a fallback query
      let [rows] = [];
      try {
        [rows] = await pool.query(
          'SELECT id, full_name, email, phone, photo, license_no, location, company_name, tenant_db, document_type, document_front, document_back, created_by_admin_id, last_login_at FROM brokers WHERE id = ? LIMIT 1',
          [id]
        );
      } catch (err) {
        // If columns don't exist, use fallback query without document fields
        if (err.code === 'ER_BAD_FIELD_ERROR') {
          [rows] = await pool.query(
            'SELECT id, full_name, email, phone, photo, license_no, location, company_name, tenant_db, created_by_admin_id, last_login_at FROM brokers WHERE id = ? LIMIT 1',
            [id]
          );
        } else {
          throw err;
        }
      }
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
          documentType: row.document_type || null,
          documentFront: row.document_front || null,
          documentBack: row.document_back || null,
          createdByAdminId: row.created_by_admin_id,
          lastLoginAt: row.last_login_at,
        },
      });
    }

    if (role === 'company') {
      let [rows] = [];
      try {
        [rows] = await pool.query(
          'SELECT id, full_name, email, phone, photo, portal_role, company_name, location, tenant_db, document_type, document_front, document_back, created_by_admin_id, last_login_at FROM companies WHERE id = ? LIMIT 1',
          [id]
        );
      } catch (err) {
        if (err.code === 'ER_BAD_FIELD_ERROR') {
          [rows] = await pool.query(
            'SELECT id, full_name, email, phone, photo, portal_role, company_name, location, tenant_db, created_by_admin_id, last_login_at FROM companies WHERE id = ? LIMIT 1',
            [id]
          );
        } else {
          throw err;
        }
      }
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
          portalRole: row.portal_role,
          companyName: row.company_name,
          location: row.location,
          tenantDb: row.tenant_db,
          documentType: row.document_type || null,
          documentFront: row.document_front || null,
          documentBack: row.document_back || null,
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

    const { full_name, email, phone, portal_role } = req.body || {};  
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

    if (portal_role !== undefined) {
      if (!isValidPortalRole(String(portal_role))) {
        return res.status(400).json({ message: 'Invalid portal_role' });
      }
      updates.push('portal_role = ?');
      params.push(normalizePortalRole(portal_role));
    }

    if (updates.length === 0) {
      return res.status(400).json({ message: 'No fields to update' });
    }

    params.push(id);
    await pool.query(`UPDATE super_admins SET ${updates.join(', ')} WHERE id = ?`, params);

    const [rows] = await pool.query(
      'SELECT id, full_name, email, phone, photo, portal_role, last_login_at FROM super_admins WHERE id = ? LIMIT 1',
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
        portalRole: row.portal_role,
        lastLoginAt: row.last_login_at,
      },
    });
  } catch (err) {
    const isProd = process.env.NODE_ENV === 'production';
    return res.status(500).json({ message: 'Server error', error: isProd ? undefined : String(err?.message || err) });
  }
}


export async function updateBrokerProfile(req, res) {
  try {
    const { role, id } = req.user || {};
    if (!role || role !== 'broker' || !id) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    const { full_name, email, phone, license_no } = req.body || {};
    // If file upload present, map to photo URL
    let photo = undefined;
    if (req.files) {
      if (req.files.photo && req.files.photo[0]) {
        photo = `/${req.files.photo[0].destination.replace(/\\/g, '/').replace(/^public\//, '')}/${req.files.photo[0].filename}`;
      }
    } else if (req.file) {
      photo = `/${req.file.destination.replace(/\\/g, '/').replace(/^public\//, '')}/${req.file.filename}`;
    } else if (Object.prototype.hasOwnProperty.call(req.body, 'photo')) {
      // allow JSON payload to set/reset photo as URL
      photo = req.body.photo;
    }

    let documentFront = undefined;
    let documentBack = undefined;
    let documentType = undefined;
    if (req.files) {
      if (req.files.document_front && req.files.document_front[0]) {
        documentFront = `/${req.files.document_front[0].destination.replace(/\\/g, '/').replace(/^public\//, '')}/${req.files.document_front[0].filename}`;
      }
      if (req.files.document_back && req.files.document_back[0]) {
        documentBack = `/${req.files.document_back[0].destination.replace(/\\/g, '/').replace(/^public\//, '')}/${req.files.document_back[0].filename}`;
      }
    }
    if (Object.prototype.hasOwnProperty.call(req.body, 'document_type')) {
      if (req.body.document_type && ['aadhaar', 'pan_card', 'driving_license', 'voter_id', 'other'].includes(req.body.document_type)) {
        documentType = req.body.document_type;
      } else {
        documentType = null;
      }
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
      const [dupes] = await pool.query('SELECT id FROM brokers WHERE email = ? AND id <> ? LIMIT 1', [email, id]);
      if (dupes[0]) return res.status(409).json({ message: 'Email already exists' });
      updates.push('email = ?');
      params.push(email);
    }

    if (phone !== undefined) {
      updates.push('phone = ?');
      params.push(isNonEmptyString(phone) ? phone : null);
    }

    if (license_no !== undefined) {
      updates.push('license_no = ?');
      params.push(isNonEmptyString(license_no) ? license_no : null);
    }

    if (photo !== undefined) {
      updates.push('photo = ?');
      params.push(isNonEmptyString(photo) ? photo : null);
    }

    if (documentFront !== undefined) {
      updates.push('document_front = ?');
      params.push(isNonEmptyString(documentFront) ? documentFront : null);
    }

    if (documentBack !== undefined) {
      updates.push('document_back = ?');
      params.push(isNonEmptyString(documentBack) ? documentBack : null);
    }

    if (documentType !== undefined) {
      updates.push('document_type = ?');
      params.push(documentType);
    }

    if (updates.length === 0) {
      return res.status(400).json({ message: 'No fields to update' });
    }

    params.push(id);
    await pool.query(`UPDATE brokers SET ${updates.join(', ')} WHERE id = ?`, params);

      const [rows] = await pool.query(
        'SELECT id, full_name, email, phone, photo, license_no, location, company_name, tenant_db, document_type, document_front, document_back, created_by_admin_id, last_login_at FROM brokers WHERE id = ? LIMIT 1',
      [id]
    );
    const row = rows[0];
    return res.json({
      data: {
        id: row.id,
        role: 'broker',
        name: row.full_name,
        email: row.email,
        phone: row.phone,
        photo: row.photo,
          licenseNo: row.license_no,
          location: row.location,
          companyName: row.company_name,
        tenantDb: row.tenant_db,
        documentType: row.document_type,
        documentFront: row.document_front,
        documentBack: row.document_back,
        createdByAdminId: row.created_by_admin_id,
        lastLoginAt: row.last_login_at,
      },
    });
  } catch (err) {
    const isProd = process.env.NODE_ENV === 'production';
    return res.status(500).json({ message: 'Server error', error: isProd ? undefined : String(err?.message || err) });
  }
}

export async function updateCompanyProfile(req, res) {
  try {
    const { role, id } = req.user || {};
    if (!role || role !== 'company' || !id) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    const { full_name, email, phone } = req.body || {};
    // If file upload present, map to photo URL
    let photo = undefined;
    if (req.files) {
      if (req.files.photo && req.files.photo[0]) {
        photo = `/${req.files.photo[0].destination.replace(/\\/g, '/').replace(/^public\//, '')}/${req.files.photo[0].filename}`;
      }
    } else if (req.file) {
      photo = `/${req.file.destination.replace(/\\/g, '/').replace(/^public\//, '')}/${req.file.filename}`;
    } else if (Object.prototype.hasOwnProperty.call(req.body, 'photo')) {
      // allow JSON payload to set/reset photo as URL
      photo = req.body.photo;
    }

    let documentFront = undefined;
    let documentBack = undefined;
    let documentType = undefined;
    if (req.files) {
      if (req.files.document_front && req.files.document_front[0]) {
        documentFront = `/${req.files.document_front[0].destination.replace(/\\/g, '/').replace(/^public\//, '')}/${req.files.document_front[0].filename}`;
      }
      if (req.files.document_back && req.files.document_back[0]) {
        documentBack = `/${req.files.document_back[0].destination.replace(/\\/g, '/').replace(/^public\//, '')}/${req.files.document_back[0].filename}`;
      }
    }
    if (Object.prototype.hasOwnProperty.call(req.body, 'document_type')) {
      if (req.body.document_type && ['aadhaar', 'pan_card', 'driving_license', 'voter_id', 'other'].includes(req.body.document_type)) {
        documentType = req.body.document_type;
      } else {
        documentType = null;
      }
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
      const [dupes] = await pool.query('SELECT id FROM companies WHERE email = ? AND id <> ? LIMIT 1', [email, id]);
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

    if (documentFront !== undefined) {
      updates.push('document_front = ?');
      params.push(isNonEmptyString(documentFront) ? documentFront : null);
    }

    if (documentBack !== undefined) {
      updates.push('document_back = ?');
      params.push(isNonEmptyString(documentBack) ? documentBack : null);
    }

    if (documentType !== undefined) {
      updates.push('document_type = ?');
      params.push(documentType);
    }

    if (updates.length === 0) {
      return res.status(400).json({ message: 'No fields to update' });
    }

    params.push(id);
    await pool.query(`UPDATE companies SET ${updates.join(', ')} WHERE id = ?`, params);

    const [rows] = await pool.query(
      'SELECT id, full_name, email, phone, photo, portal_role, company_name, location, tenant_db, document_type, document_front, document_back, created_by_admin_id, last_login_at FROM companies WHERE id = ? LIMIT 1',
      [id]
    );
    const row = rows[0];
    return res.json({
      data: {
        id: row.id,
        role: 'company',
        name: row.full_name,
        email: row.email,
        phone: row.phone,
        photo: row.photo,
        portalRole: row.portal_role,
        companyName: row.company_name,
        location: row.location,
        tenantDb: row.tenant_db,
        documentType: row.document_type,
        documentFront: row.document_front,
        documentBack: row.document_back,
        createdByAdminId: row.created_by_admin_id,
        lastLoginAt: row.last_login_at,
      },
    });
  } catch (err) {
    const isProd = process.env.NODE_ENV === 'production';
    return res.status(500).json({ message: 'Server error', error: isProd ? undefined : String(err?.message || err) });
  }
}


