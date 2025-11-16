import pool from '../config/database.js';
import { isNonEmptyString, sanitizeName, validateEmail, validatePassword, toSafeDbName } from '../utils/validation.js';
import { hashPassword } from '../utils/hash.js';
import { createBrokerDatabaseIfNotExists, getTenantPool, ensureTenantLeadsTableExists } from '../utils/tenant.js';
import { resolveDateRange } from '../utils/dateRange.js';
import { notifySuperAdmin } from '../utils/notifications.js';
import { normalizePortalRole } from '../utils/portalRoles.js';

function mapCompanyRow(row) {
  const status = row.status || (row.last_login_at ? 'active' : 'pending');
  return {
    id: row.id,
    name: row.full_name,
    email: row.email,
    phone: row.phone,
    photo: row.photo,
    portalRole: row.portal_role,
    companyName: row.company_name,
    location: row.location,
    address: row.address,
    storeName: row.store_name,
    tenantDb: row.tenant_db,
    documentType: row.document_type,
    documentFront: row.document_front,
    documentBack: row.document_back,
    instagram: row.instagram,
    facebook: row.facebook,
    linkedin: row.linkedin,
    youtube: row.youtube,
    whatsappNumber: row.whatsapp_number,
    createdByAdminId: row.created_by_admin_id,
    lastLoginAt: row.last_login_at,
    createdAt: row.created_at,
    status,
  };
}

export async function listCompanies(req, res) {
  try {
    const q = (req.query.q || '').toString().trim();
    const status = (req.query.status || '').toString().trim().toLowerCase();
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const offset = (page - 1) * limit;

    const whereClauses = [];
    const params = [];
    if (q) {
      whereClauses.push('(full_name LIKE ? OR email LIKE ? OR phone LIKE ? OR company_name LIKE ?)');
      params.push(`%${q}%`, `%${q}%`, `%${q}%`, `%${q}%`);
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
      `SELECT id, full_name, email, phone, photo, portal_role, company_name, location, tenant_db, status, created_by_admin_id, last_login_at, created_at
       FROM companies ${where} ORDER BY id DESC LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    const [countRows] = await pool.query(
      `SELECT COUNT(*) as total FROM companies ${where}`,
      params
    );

    const data = rows.map(mapCompanyRow);
    return res.json({
      data,
      meta: { page, limit, total: countRows[0]?.total || 0 }
    });
  } catch (err) {
    const isProd = process.env.NODE_ENV === 'production';
    return res.status(500).json({ message: 'Server error', error: isProd ? undefined : String(err?.message || err) });
  }
}

export async function getMyCompanyProfile(req, res) {
  try {
    const companyId = req.user?.id;
    if (!companyId) return res.status(401).json({ message: 'Unauthorized' });

    const [rows] = await pool.query(
      'SELECT id, full_name, email, phone, photo, portal_role, company_name, location, address, store_name, tenant_db, document_type, document_front, document_back, instagram, facebook, linkedin, youtube, whatsapp_number, status, created_by_admin_id, last_login_at, created_at FROM companies WHERE id = ? LIMIT 1',
      [companyId]
    );
    const row = rows[0];
    if (!row) return res.status(404).json({ message: 'Not found' });
    return res.json({ data: mapCompanyRow(row) });
  } catch (err) {
    const isProd = process.env.NODE_ENV === 'production';
    return res.status(500).json({ message: 'Server error', error: isProd ? undefined : String(err?.message || err) });
  }
}

export async function getCompanyById(req, res) {
  try {
    const id = parseInt(req.params.id, 10);
    if (!id) return res.status(400).json({ message: 'Invalid id' });

    const [rows] = await pool.query(
      'SELECT id, full_name, email, phone, photo, portal_role, company_name, location, address, store_name, tenant_db, document_type, document_front, document_back, instagram, facebook, linkedin, youtube, whatsapp_number, status, created_by_admin_id, last_login_at, created_at FROM companies WHERE id = ? LIMIT 1',
      [id]
    );
    const row = rows[0];
    if (!row) return res.status(404).json({ message: 'Not found' });
    return res.json({ data: mapCompanyRow(row) });
  } catch (err) {
    const isProd = process.env.NODE_ENV === 'production';
    return res.status(500).json({ message: 'Server error', error: isProd ? undefined : String(err?.message || err) });
  }
}

export async function createCompany(req, res) {
  try {
    const { full_name, email, phone, password, company_name, location, address, store_name, portal_role, status, instagram, facebook, linkedin, youtube, whatsapp_number } = req.body || {};
    if (!isNonEmptyString(full_name) || !validateEmail(email) || !validatePassword(password) || !isNonEmptyString(company_name)) {
      return res.status(400).json({ message: 'Invalid input' });
    }
    const [existingRows] = await pool.query('SELECT id FROM companies WHERE email = ? LIMIT 1', [email]);
    if (existingRows[0]) return res.status(409).json({ message: 'Email already exists' });

    const safeName = sanitizeName(full_name);
    const tenant_db = toSafeDbName(`company_${safeName}_${Date.now()}`);
    await createBrokerDatabaseIfNotExists(tenant_db);

    const password_hash = await hashPassword(password);
    const portalRole = normalizePortalRole(portal_role || 'company_admin');
    
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
      `INSERT INTO companies (full_name, email, phone, photo, password_hash, portal_role, company_name, location, address, store_name, tenant_db, document_type, document_front, document_back, instagram, facebook, linkedin, youtube, whatsapp_number, created_by_admin_id${normalizedStatus ? ', status' : ''}) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?${normalizedStatus ? ', ?' : ''})`,
      [safeName, email, phone || null, photoPath, password_hash, portalRole, company_name, location || null, address || null, store_name || null, tenant_db, documentType, documentFront, documentBack, instagram || null, facebook || null, linkedin || null, youtube || null, whatsapp_number || null, req.user?.id || null, ...(normalizedStatus ? [normalizedStatus] : [])]
    );
    const id = result.insertId;
    const [rows] = await pool.query(
      'SELECT id, full_name, email, phone, photo, portal_role, company_name, location, address, store_name, tenant_db, document_type, document_front, document_back, instagram, facebook, linkedin, youtube, whatsapp_number, status, created_by_admin_id, last_login_at FROM companies WHERE id = ? LIMIT 1',
      [id]
    );
    // Notify super admin - company created
    try {
      const adminName = req.user?.full_name || req.user?.name || 'Super Admin';
      await notifySuperAdmin({
        type: 'company_created',
        title: 'New company created',
        message: `Company "${company_name}" (${email}) has been created`,
        actorBrokerId: null,
        actorBrokerName: adminName,
        actorBrokerEmail: req.user?.email || null,
      });
    } catch (notifyErr) {
      // Non-blocking
    }
    return res.status(201).json({ data: mapCompanyRow(rows[0]) });
  } catch (err) {
    const isProd = process.env.NODE_ENV === 'production';
    return res.status(500).json({ message: 'Server error', error: isProd ? undefined : String(err?.message || err) });
  }
}

export async function updateCompany(req, res) {
  try {
    const id = parseInt(req.params.id, 10);
    if (!id) return res.status(400).json({ message: 'Invalid id' });

    const { full_name, email, phone, company_name, location, address, store_name, portal_role, status, instagram, facebook, linkedin, youtube, whatsapp_number } = req.body || {};
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
    if (company_name !== undefined) {
      if (!isNonEmptyString(company_name)) return res.status(400).json({ message: 'Invalid company_name' });
      updates.push('company_name = ?');
      params.push(company_name);
    }
    if (location !== undefined) {
      updates.push('location = ?');
      params.push(isNonEmptyString(location) ? location : null);
    }
    if (address !== undefined) {
      updates.push('address = ?');
      params.push(isNonEmptyString(address) ? address : null);
    }
    if (store_name !== undefined) {
      updates.push('store_name = ?');
      params.push(isNonEmptyString(store_name) ? store_name : null);
    }
    if (portal_role !== undefined) {
      const portalRole = normalizePortalRole(portal_role);
      updates.push('portal_role = ?');
      params.push(portalRole);
    }
    if (instagram !== undefined) {
      updates.push('instagram = ?');
      params.push(isNonEmptyString(instagram) ? instagram : null);
    }
    if (facebook !== undefined) {
      updates.push('facebook = ?');
      params.push(isNonEmptyString(facebook) ? facebook : null);
    }
    if (linkedin !== undefined) {
      updates.push('linkedin = ?');
      params.push(isNonEmptyString(linkedin) ? linkedin : null);
    }
    if (youtube !== undefined) {
      updates.push('youtube = ?');
      params.push(isNonEmptyString(youtube) ? youtube : null);
    }
    if (whatsapp_number !== undefined) {
      updates.push('whatsapp_number = ?');
      params.push(isNonEmptyString(whatsapp_number) ? whatsapp_number : null);
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

    // Get company info before update for status change notification
    let oldStatus = null;
    let companyName = null;
    if (status !== undefined) {
      const [oldRows] = await pool.query('SELECT status, company_name FROM companies WHERE id = ? LIMIT 1', [id]);
      oldStatus = oldRows?.[0]?.status || null;
      companyName = oldRows?.[0]?.company_name || null;
    }

    params.push(id);
    await pool.query(`UPDATE companies SET ${updates.join(', ')} WHERE id = ?`, params);

    const [rows] = await pool.query(
      'SELECT id, full_name, email, phone, photo, portal_role, company_name, location, address, store_name, tenant_db, document_type, document_front, document_back, instagram, facebook, linkedin, youtube, whatsapp_number, created_by_admin_id, last_login_at FROM companies WHERE id = ? LIMIT 1',
      [id]
    );
    if (!rows[0]) return res.status(404).json({ message: 'Not found' });
    
    // Notify super admin - company status changed
    if (status !== undefined && oldStatus && oldStatus !== status) {
      try {
        const adminName = req.user?.full_name || req.user?.name || 'Super Admin';
        await notifySuperAdmin({
          type: status === 'suspended' ? 'company_suspended' : 'company_activated',
          title: status === 'suspended' ? 'Company suspended' : 'Company activated',
          message: `Company "${companyName || rows[0].company_name}" status changed from ${oldStatus} to ${status}`,
          actorBrokerId: null,
          actorBrokerName: adminName,
          actorBrokerEmail: req.user?.email || null,
        });
      } catch (notifyErr) {
        // Non-blocking
      }
    }
    
    return res.json({ data: mapCompanyRow(rows[0]) });
  } catch (err) {
    const isProd = process.env.NODE_ENV === 'production';
    return res.status(500).json({ message: 'Server error', error: isProd ? undefined : String(err?.message || err) });
  }
}

// Monthly company trends
export async function getCompanyMonthlyTrends(req, res) {
  try {
    const year = Number.parseInt(req.query.year, 10) || new Date().getFullYear();
    const { startDate, endDate } = resolveDateRange({
      range: req.query.range,
      from: req.query.from,
      to: req.query.to,
      month: req.query.month,
      year: req.query.year,
    });

    const activeParams = [year];
    let activeWhere = 'WHERE YEAR(created_at) = ? AND status = \'active\'';
    if (startDate && endDate) {
      activeWhere += ' AND created_at BETWEEN ? AND ?';
      activeParams.push(startDate, endDate);
    }
    const [activeRows] = await pool.query(
      `SELECT MONTH(created_at) AS m, COUNT(*) AS c
       FROM companies
       ${activeWhere}
       GROUP BY MONTH(created_at)`,
      activeParams
    );

    const suspendedParams = [year];
    let suspendedWhere = 'WHERE YEAR(updated_at) = ? AND status = \'suspended\'';
    if (startDate && endDate) {
      suspendedWhere += ' AND updated_at BETWEEN ? AND ?';
      suspendedParams.push(startDate, endDate);
    }
    const [suspendedRows] = await pool.query(
      `SELECT MONTH(updated_at) AS m, COUNT(*) AS c
       FROM companies
       ${suspendedWhere}
       GROUP BY MONTH(updated_at)`,
      suspendedParams
    );

    const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sept','Oct','Nov','Dec'];
    const activeMap = Object.fromEntries(activeRows.map(r => [r.m, r.c]));
    const suspendedMap = Object.fromEntries(suspendedRows.map(r => [r.m, r.c]));
    const data = monthNames.map((label, idx) => {
      const monthIndex = idx + 1;
      return {
        month: label,
        active: Number(activeMap[monthIndex] || 0),
        suspended: Number(suspendedMap[monthIndex] || 0),
      };
    });

    return res.json({ data, meta: { year, range: req.query.range || null, from: startDate ? startDate.toISOString() : null, to: endDate ? endDate.toISOString() : null } });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[getCompanyMonthlyTrends] error:', err);
    return res.status(500).json({
      message: 'Server error',
      error: err?.message || null,
      code: err?.code || null,
    });
  }
}

// Super Admin: List companies with per-tenant metrics
export async function listCompaniesWithStats(req, res) {
  try {
    const q = (req.query.q || '').toString().trim();
    const status = (req.query.status || '').toString().trim().toLowerCase();
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const offset = (page - 1) * limit;

    const whereClauses = [];
    const params = [];
    if (q) {
      whereClauses.push('(full_name LIKE ? OR email LIKE ? OR phone LIKE ? OR company_name LIKE ?)');
      params.push(`%${q}%`, `%${q}%`, `%${q}%`, `%${q}%`);
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
      `SELECT id, full_name, email, phone, photo, portal_role, company_name, location, tenant_db, status, created_by_admin_id, last_login_at
       FROM companies ${where} ORDER BY id DESC LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );
    const [countRows] = await pool.query(
      `SELECT COUNT(*) as total FROM companies ${where}`,
      params
    );

    // For each company, fetch counts from their tenant DB (if available)
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
      const mapped = mapCompanyRow(r);
      data.push({ ...mapped, propertiesCount, leadsCount });
    }

    return res.json({ data, meta: { page, limit, total: countRows[0]?.total || 0 } });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[listCompaniesWithStats] error:', err);
    return res.status(500).json({
      message: 'Server error',
      error: err?.message || null,
      code: err?.code || null,
    });
  }
}

// Company Dashboard Stats
export async function getCompanyDashboardStats(req, res) {
  try {
    const companyId = req.user?.id;
    if (!companyId) return res.status(401).json({ message: 'Unauthorized' });

    // Get company's tenant_db
    const [companyRows] = await pool.query(
      'SELECT tenant_db FROM companies WHERE id = ? LIMIT 1',
      [companyId]
    );
    const company = companyRows?.[0];
    if (!company || !company.tenant_db) {
      return res.json({
        data: {
          totalProperties: 0,
          totalLeads: 0,
        },
      });
    }

    const tenantPool = await getTenantPool(company.tenant_db);

    // Get total properties count
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
    console.error('getCompanyDashboardStats error:', err);
    return res.status(500).json({
      message: 'Server error',
      error: isProd ? undefined : String(err?.message || err),
    });
  }
}

