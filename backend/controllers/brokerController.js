import pool from '../config/database.js';
import { isNonEmptyString, sanitizeName, validateEmail, validatePassword } from '../utils/validation.js';
import { hashPassword } from '../utils/hash.js';
import { createBrokerDatabaseIfNotExists, getTenantPool, ensureTenantLeadsTableExists } from '../utils/tenant.js';
import { resolveDateRange } from '../utils/dateRange.js';
import { notifySuperAdmin } from '../utils/notifications.js';

function mapBrokerRow(row) {
  const status = row.status || (row.last_login_at ? 'active' : 'pending');
  return {
    id: row.id,
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
    createdAt: row.created_at,
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
      `SELECT id, full_name, email, phone, photo, license_no, location, company_name, tenant_db, status, created_by_admin_id, last_login_at, created_at
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
      'SELECT id, full_name, email, phone, photo, license_no, location, company_name, tenant_db, document_type, document_front, document_back, status, created_by_admin_id, last_login_at, created_at FROM brokers WHERE id = ? LIMIT 1',
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
      'SELECT id, full_name, email, phone, photo, license_no, location, company_name, tenant_db, document_type, document_front, document_back, status, created_by_admin_id, last_login_at, created_at FROM brokers WHERE id = ? LIMIT 1',
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
    const { full_name, email, phone, password, license_no, status, location, company_name } = req.body || {};
    if (!isNonEmptyString(full_name) || !validateEmail(email) || !validatePassword(password)) {
      return res.status(400).json({ message: 'Invalid input' });
    }
    const [existingRows] = await pool.query('SELECT id FROM brokers WHERE email = ? LIMIT 1', [email]);
    if (existingRows[0]) return res.status(409).json({ message: 'Email already exists' });

    const safeName = sanitizeName(full_name);
    const tenant_db = `realstate_broker_${Date.now()}`; // unique, sanitized in tenant creator
    await createBrokerDatabaseIfNotExists(tenant_db);

    const password_hash = await hashPassword(password);
    
    // Handle file uploads
    let photoPath = null;
    if (req.files) {
      if (req.files.photo && req.files.photo[0]) {
        photoPath = `/${req.files.photo[0].destination.replace(/\\/g, '/').replace(/^public\//, '')}/${req.files.photo[0].filename}`;
      }
    } else if (req.file) {
      photoPath = `/profiles/${req.file.originalname}`;
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

    const normalizedStatus = (status && ['active', 'suspended'].includes(String(status).toLowerCase())) ? String(status).toLowerCase() : undefined;
    const [result] = await pool.query(
      `INSERT INTO brokers (full_name, email, phone, photo, password_hash, license_no, location, company_name, tenant_db, document_type, document_front, document_back, created_by_admin_id${normalizedStatus ? ', status' : ''}) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?${normalizedStatus ? ', ?' : ''})`,
      [safeName, email, phone || null, photoPath, password_hash, license_no || null, location || null, company_name || null, tenant_db, documentType, documentFront, documentBack, req.user?.id || null, ...(normalizedStatus ? [normalizedStatus] : [])]
    );
    const id = result.insertId;
    const [rows] = await pool.query(
      'SELECT id, full_name, email, phone, photo, license_no, location, company_name, tenant_db, document_type, document_front, document_back, status, created_by_admin_id, last_login_at FROM brokers WHERE id = ? LIMIT 1',
      [id]
    );
    // Notify super admin - broker created
    try {
      const adminName = req.user?.full_name || req.user?.name || 'Super Admin';
      await notifySuperAdmin({
        type: 'broker_created',
        title: 'New broker created',
        message: `Broker "${safeName}" (${email}) has been created`,
        actorBrokerId: null,
        actorBrokerName: adminName,
        actorBrokerEmail: req.user?.email || null,
      });
    } catch (notifyErr) {
      // Non-blocking
    }
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

    const { full_name, email, phone, license_no, status, location, company_name } = req.body || {};
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
    if (req.files) {
      if (req.files.photo && req.files.photo[0]) {
        updates.push('photo = ?');
        params.push(`/${req.files.photo[0].destination.replace(/\\/g, '/').replace(/^public\//, '')}/${req.files.photo[0].filename}`);
      }
    } else if (req.file) {
      updates.push('photo = ?');
      params.push(`/profiles/${req.file.originalname}`);
    }
    // document uploads
    if (req.files) {
      if (req.files.document_front && req.files.document_front[0]) {
        updates.push('document_front = ?');
        params.push(`/${req.files.document_front[0].destination.replace(/\\/g, '/').replace(/^public\//, '')}/${req.files.document_front[0].filename}`);
      }
      if (req.files.document_back && req.files.document_back[0]) {
        updates.push('document_back = ?');
        params.push(`/${req.files.document_back[0].destination.replace(/\\/g, '/').replace(/^public\//, '')}/${req.files.document_back[0].filename}`);
      }
    }
    if (req.body.document_type !== undefined) {
      if (req.body.document_type && ['aadhaar', 'pan_card', 'driving_license', 'voter_id', 'other'].includes(req.body.document_type)) {
        updates.push('document_type = ?');
        params.push(req.body.document_type);
      } else {
        updates.push('document_type = ?');
        params.push(null);
      }
    }
    if (license_no !== undefined) {
      updates.push('license_no = ?');
      params.push(isNonEmptyString(license_no) ? license_no : null);
    }
    if (location !== undefined) {
      updates.push('location = ?');
      params.push(isNonEmptyString(location) ? location : null);
    }
    if (company_name !== undefined) {
      updates.push('company_name = ?');
      params.push(isNonEmptyString(company_name) ? company_name : null);
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

    // Get broker info before update for status change notification
    let oldStatus = null;
    let brokerName = null;
    if (status !== undefined) {
      const [oldRows] = await pool.query('SELECT status, full_name FROM brokers WHERE id = ? LIMIT 1', [id]);
      oldStatus = oldRows?.[0]?.status || null;
      brokerName = oldRows?.[0]?.full_name || null;
    }

    params.push(id);
    await pool.query(`UPDATE brokers SET ${updates.join(', ')} WHERE id = ?`, params);

    const [rows] = await pool.query(
      'SELECT id, full_name, email, phone, photo, license_no, location, company_name, tenant_db, document_type, document_front, document_back, created_by_admin_id, last_login_at FROM brokers WHERE id = ? LIMIT 1',
      [id]
    );
    if (!rows[0]) return res.status(404).json({ message: 'Not found' });
    
    // Notify super admin - broker status changed
    if (status !== undefined && oldStatus && oldStatus !== status) {
      try {
        const adminName = req.user?.full_name || req.user?.name || 'Super Admin';
        await notifySuperAdmin({
          type: status === 'suspended' ? 'broker_suspended' : 'broker_activated',
          title: status === 'suspended' ? 'Broker suspended' : 'Broker activated',
          message: `Broker "${brokerName || rows[0].full_name}" status changed from ${oldStatus} to ${status}`,
          actorBrokerId: null,
          actorBrokerName: adminName,
          actorBrokerEmail: req.user?.email || null,
        });
      } catch (notifyErr) {
        // Non-blocking
      }
    }
    
    return res.json({ data: mapBrokerRow(rows[0]) });
  } catch (err) {
    const isProd = process.env.NODE_ENV === 'production';
    return res.status(500).json({ message: 'Server error', error: isProd ? undefined : String(err?.message || err) });
  }
}


// Monthly broker trends: counts of active (by created_at) vs suspended (by updated_at) per month
export async function getBrokerMonthlyTrends(req, res) {
  try {
    const year = Number.parseInt(req.query.year, 10) || new Date().getFullYear();
    const { startDate, endDate } = resolveDateRange({
      range: req.query.range,
      from: req.query.from,
      to: req.query.to,
      month: req.query.month,
      year: req.query.year,
    });

    // Active (onboarded) brokers per month based on created_at
    const activeParams = [year];
    let activeWhere = 'WHERE YEAR(created_at) = ? AND status = \'active\'';
    if (startDate && endDate) {
      activeWhere += ' AND created_at BETWEEN ? AND ?';
      activeParams.push(startDate, endDate);
    }
    const [activeRows] = await pool.query(
      `SELECT MONTH(created_at) AS m, COUNT(*) AS c
       FROM brokers
       ${activeWhere}
       GROUP BY MONTH(created_at)`,
      activeParams
    );

    // Suspended brokers per month based on updated_at (assumes status set that month)
    const suspendedParams = [year];
    let suspendedWhere = 'WHERE YEAR(updated_at) = ? AND status = \'suspended\'';
    if (startDate && endDate) {
      suspendedWhere += ' AND updated_at BETWEEN ? AND ?';
      suspendedParams.push(startDate, endDate);
    }
    const [suspendedRows] = await pool.query(
      `SELECT MONTH(updated_at) AS m, COUNT(*) AS c
       FROM brokers
       ${suspendedWhere}
       GROUP BY MONTH(updated_at)`,
      suspendedParams
    );

    const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sept','Oct','Nov','Dec'];
    const activeMap = Object.fromEntries(activeRows.map(r => [r.m, r.c]));
    const suspendedMap = Object.fromEntries(suspendedRows.map(r => [r.m, r.c]));
    const data = monthNames.map((label, idx) => {
      const monthIndex = idx + 1; // 1-12
      return {
        month: label,
        active: Number(activeMap[monthIndex] || 0),
        suspended: Number(suspendedMap[monthIndex] || 0),
      };
    });

    return res.json({ data, meta: { year, range: req.query.range || null, from: startDate ? startDate.toISOString() : null, to: endDate ? endDate.toISOString() : null } });
  } catch (err) {
    const isProd = process.env.NODE_ENV === 'production';
    return res.status(500).json({ message: 'Server error', error: isProd ? undefined : String(err?.message || err) });
  }
}


// Super Admin: List brokers with per-tenant metrics (propertiesCount, leadsCount)
export async function listBrokersWithStats(req, res) {
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
        whereClauses.push('last_login_at IS NULL');
      }
    }
    const where = whereClauses.length ? `WHERE ${whereClauses.join(' AND ')}` : '';

    const [rows] = await pool.query(
      `SELECT id, full_name, email, phone, photo, license_no, location, company_name, tenant_db, status, created_by_admin_id, last_login_at
       FROM brokers ${where} ORDER BY id DESC LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );
    const [countRows] = await pool.query(
      `SELECT COUNT(*) as total FROM brokers ${where}`,
      params
    );

    // For each broker, fetch counts from their tenant DB (if available)
    const data = [];
    for (const r of rows) {
      let propertiesCount = 0;
      let leadsCount = 0;
      if (r.tenant_db) {
        try {
          const tenantPool = await getTenantPool(r.tenant_db);
          const [[p]] = await tenantPool.query('SELECT COUNT(*) AS c FROM properties');
          propertiesCount = Number(p?.c || 0);
          await ensureTenantLeadsTableExists(tenantPool);
          const [[l]] = await tenantPool.query('SELECT COUNT(*) AS c FROM leads');
          leadsCount = Number(l?.c || 0);
        } catch (e) {
          // ignore isolated tenant errors; keep counts as 0
        }
      }
      const mapped = mapBrokerRow(r);
      data.push({ ...mapped, propertiesCount, leadsCount });
    }

    return res.json({ data, meta: { page, limit, total: countRows[0]?.total || 0 } });
  } catch (err) {
    const isProd = process.env.NODE_ENV === 'production';
    return res.status(500).json({ message: 'Server error', error: isProd ? undefined : String(err?.message || err) });
  }
}

// ========== Broker Dashboard Stats ==========
export async function getBrokerDashboardStats(req, res) {
  try {
    const brokerId = req.user?.id;
    if (!brokerId) return res.status(401).json({ message: 'Unauthorized' });

    // Get broker's tenant_db
    const [brokerRows] = await pool.query(
      'SELECT tenant_db FROM brokers WHERE id = ? LIMIT 1',
      [brokerId]
    );
    const broker = brokerRows?.[0];
    if (!broker || !broker.tenant_db) {
      return res.json({
        data: {
          totalProperties: 0,
          totalLeads: 0,
        },
      });
    }

    const tenantPool = await getTenantPool(broker.tenant_db);

    // Get total properties count (all properties)
    const [[propCount]] = await tenantPool.query(
      'SELECT COUNT(*) AS total FROM properties'
    );
    const totalProperties = Number(propCount?.total || 0);

    // Get total leads count
    let totalLeads = 0;
    try {
      await ensureTenantLeadsTableExists(tenantPool);
      const [[leadCount]] = await tenantPool.query('SELECT COUNT(*) AS total FROM leads');
      totalLeads = Number(leadCount?.total || 0);
    } catch (leadErr) {
      // If leads table doesn't exist or error, just return 0
      // eslint-disable-next-line no-console
      console.error('Error fetching leads count:', leadErr);
      totalLeads = 0;
    }

    return res.json({
      data: {
        totalProperties,
        totalLeads,
      },
    });
  } catch (err) {
    const isProd = process.env.NODE_ENV === 'production';
    // eslint-disable-next-line no-console
    console.error('getBrokerDashboardStats error:', err);
    return res.status(500).json({
      message: 'Server error',
      error: isProd ? undefined : String(err?.message || err),
    });
  }
}

