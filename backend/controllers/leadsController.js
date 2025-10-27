import pool from '../config/database.js';
import { getTenantPool, ensureTenantLeadsTableExists } from '../utils/tenant.js';
import { isNonEmptyString, validateEmail } from '../utils/validation.js';
import { notifySuperAdmin } from '../utils/notifications.js';

async function getTenantLeadColumns(tenantPool, dbName) {
  const [rows] = await tenantPool.query(
    `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'leads'`,
    [dbName]
  );
  return new Set(rows.map(r => r.COLUMN_NAME));
}

async function ensureTenantLeadsSchema(tenantPool, dbName) {
  const cols = await getTenantLeadColumns(tenantPool, dbName);
  const alters = [];
  if (!cols.has('full_name')) alters.push(`ADD COLUMN full_name VARCHAR(255) NULL AFTER id`);
  if (!cols.has('city')) alters.push(`ADD COLUMN city VARCHAR(100) NULL`);
  if (!cols.has('property_interest')) alters.push(`ADD COLUMN property_interest VARCHAR(255) NULL`);
  if (!cols.has('source')) alters.push(`ADD COLUMN source ENUM('website','call','social_media','referral') NULL DEFAULT 'website'`);
  if (!cols.has('status')) alters.push(`ADD COLUMN status ENUM('new','contacted','qualified','proposal','closed','lost') NULL DEFAULT 'new'`);
  if (!cols.has('message')) alters.push(`ADD COLUMN message TEXT NULL`);
  if (!cols.has('assigned_to')) alters.push(`ADD COLUMN assigned_to VARCHAR(255) NULL`);
  if (!cols.has('created_at')) alters.push(`ADD COLUMN created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP`);
  if (!cols.has('updated_at')) alters.push(`ADD COLUMN updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`);
  if (alters.length > 0) {
    try {
      await tenantPool.query(`ALTER TABLE leads ${alters.join(', ')}`);
    } catch (e) {
      // ignore if concurrent or insufficient rights; we'll still try to select safely
    }
  }
}

// Admin (super admin) — operates on main DB leads table
export async function listAdminLeads(req, res) {
  try {
    const [rows] = await pool.query(
      'SELECT id, full_name, email, phone, city, property_interest, source, status, message, assigned_to, created_at, updated_at FROM leads ORDER BY id DESC'
    );
    // Add computed lead_source_type for frontend clarity
    const data = rows.map(r => ({ ...r, lead_source_type: 'main' }));
    return res.json({ data });
  } catch (err) {
    return res.status(500).json({ message: 'Server error' });
  }
}

export async function createAdminLead(req, res) {
  try {
    const { full_name, email, phone, city, property_interest, source, status, message, assigned_to } = req.body || {};
    if (!isNonEmptyString(full_name) || !validateEmail(email) || !isNonEmptyString(phone)) {
      return res.status(400).json({ message: 'Invalid input' });
    }
    const [result] = await pool.query(
      `INSERT INTO leads (full_name, email, phone, city, property_interest, source, status, message, assigned_to)
       VALUES (?, ?, ?, ?, ?, COALESCE(?, 'website'), COALESCE(?, 'new'), ?, ?)`,
      [full_name, email, phone, city || null, property_interest || null, source || null, status || null, message || null, assigned_to || null]
    );
    // Notify super admin about new main-site lead
    await notifySuperAdmin({ type: 'lead_created', title: 'New main website lead', message: `${full_name} (${email})` });
    return res.status(201).json({ id: result.insertId });
  } catch (err) {
    return res.status(500).json({ message: 'Server error' });
  }
}

export async function updateAdminLead(req, res) {
  try {
    const { id } = req.params || {};
    if (!id) return res.status(400).json({ message: 'Missing id' });
    const {
      full_name,
      email,
      phone,
      city,
      property_interest,
      source,
      status,
      message,
      assigned_to,
    } = req.body || {};

    const updates = [];
    const params = [];

    if (full_name !== undefined) {
      if (!isNonEmptyString(full_name)) return res.status(400).json({ message: 'Invalid full_name' });
      updates.push('full_name = ?');
      params.push(full_name);
    }
    if (email !== undefined) {
      if (!validateEmail(email)) return res.status(400).json({ message: 'Invalid email' });
      updates.push('email = ?');
      params.push(email);
    }
    if (phone !== undefined) {
      if (!isNonEmptyString(phone)) return res.status(400).json({ message: 'Invalid phone' });
      updates.push('phone = ?');
      params.push(phone);
    }
    if (city !== undefined) { updates.push('city = ?'); params.push(isNonEmptyString(city) ? city : null); }
    if (property_interest !== undefined) { updates.push('property_interest = ?'); params.push(isNonEmptyString(property_interest) ? property_interest : null); }
    if (source !== undefined) { updates.push('source = ?'); params.push(source || 'website'); }
    if (status !== undefined) { updates.push('status = ?'); params.push(status || 'new'); }
    if (message !== undefined) { updates.push('message = ?'); params.push(isNonEmptyString(message) ? message : null); }
    if (assigned_to !== undefined) { updates.push('assigned_to = ?'); params.push(isNonEmptyString(assigned_to) ? assigned_to : null); }

    if (updates.length === 0) return res.status(400).json({ message: 'No fields to update' });
    params.push(id);
    await pool.query(`UPDATE leads SET ${updates.join(', ')} WHERE id = ?`, params);
    await notifySuperAdmin({ type: 'lead_updated', title: 'Main website lead updated', message: `Lead #${id} updated` });
    return res.json({ ok: true });
  } catch (err) {
    return res.status(500).json({ message: 'Server error' });
  }
}

// Broker — operates on tenant DB leads table
export async function listBrokerLeads(req, res) {
  try {
    const tenantDb = req.user?.tenant_db;
    if (!tenantDb) return res.status(400).json({ message: 'Missing tenant' });
    const tenantPool = await getTenantPool(tenantDb);
    // Ensure table exists to avoid intermittent ER_NO_SUCH_TABLE
    await ensureTenantLeadsTableExists(tenantPool);
    // Be tolerant to older schemas: select * and map
    let rows = [];
    try {
      const [r] = await tenantPool.query('SELECT * FROM leads ORDER BY id DESC');
      rows = r;
    } catch (e) {
      // Log and surface a stable error
      // eslint-disable-next-line no-console
      console.error('listBrokerLeads query error:', e?.code || e?.message || e);
      return res.status(500).json({ message: 'Failed to fetch leads' });
    }
    const cols = await getTenantLeadColumns(tenantPool, tenantDb);
    const data = rows.map(r => ({
      id: r.id,
      full_name: r.full_name ?? r.name ?? null,
      email: r.email ?? null,
      phone: r.phone ?? null,
      city: cols.has('city') ? r.city : null,
      property_interest: cols.has('property_interest') ? r.property_interest : null,
      source: cols.has('source') ? r.source : (r.source ?? 'website'),
      status: cols.has('status') ? r.status : (r.status ?? 'new'),
      message: cols.has('message') ? r.message : (cols.has('notes') ? r.notes : null),
      assigned_to: cols.has('assigned_to') ? r.assigned_to : null,
      created_at: cols.has('created_at') ? r.created_at : null,
      updated_at: cols.has('updated_at') ? r.updated_at : null,
      lead_source_type: 'broker',
    }));
    return res.json({ data });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('listBrokerLeads fatal error:', err?.code || err?.message || err);
    return res.status(500).json({ message: 'Failed to fetch leads' });
  }
}

export async function createBrokerLead(req, res) {
  try {
    const tenantDb = req.user?.tenant_db;
    if (!tenantDb) return res.status(400).json({ message: 'Missing tenant' });
    const { full_name, email, phone, city, property_interest, source, status, message, assigned_to } = req.body || {};
    if (!isNonEmptyString(full_name) || !validateEmail(email) || !isNonEmptyString(phone)) {
      return res.status(400).json({ message: 'Invalid input' });
    }
    const tenantPool = await getTenantPool(tenantDb);
    await ensureTenantLeadsTableExists(tenantPool);
    await ensureTenantLeadsSchema(tenantPool, tenantDb);
    const cols = await getTenantLeadColumns(tenantPool, tenantDb);
    // Build insert dynamically based on available columns
    const insertCols = ['full_name','email','phone'];
    const insertVals = [full_name, email, phone];
    if (cols.has('city')) { insertCols.push('city'); insertVals.push(city || null); }
    if (cols.has('property_interest')) { insertCols.push('property_interest'); insertVals.push(property_interest || null); }
    if (cols.has('source')) { insertCols.push('source'); insertVals.push(source || 'website'); }
    if (cols.has('status')) { insertCols.push('status'); insertVals.push(status || 'new'); }
    if (cols.has('message')) { insertCols.push('message'); insertVals.push(message || null); }
    if (cols.has('assigned_to')) { insertCols.push('assigned_to'); insertVals.push(assigned_to || null); }
    const placeholders = insertCols.map(() => '?').join(', ');
    const [result] = await tenantPool.query(
      `INSERT INTO leads (${insertCols.join(', ')}) VALUES (${placeholders})`,
      insertVals
    );
    // Notify super admin with broker actor context
    await notifySuperAdmin({
      type: 'broker_lead_created',
      title: 'New broker lead',
      message: `${full_name} (${email})`,
      actorBrokerId: req.user?.id || null,
      actorBrokerEmail: req.user?.email || null,
    });
    return res.status(201).json({ id: result.insertId });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('createBrokerLead error:', err?.code || err?.message || err);
    return res.status(500).json({ message: 'Failed to create lead' });
  }
}

export async function updateBrokerLead(req, res) {
  try {
    const tenantDb = req.user?.tenant_db;
    if (!tenantDb) return res.status(400).json({ message: 'Missing tenant' });
    const { id } = req.params || {};
    if (!id) return res.status(400).json({ message: 'Missing id' });

    const {
      full_name,
      email,
      phone,
      city,
      property_interest,
      source,
      status,
      message,
      assigned_to,
    } = req.body || {};

    const updates = [];
    const params = [];

    if (full_name !== undefined) {
      if (!isNonEmptyString(full_name)) return res.status(400).json({ message: 'Invalid full_name' });
      updates.push('full_name = ?');
      params.push(full_name);
    }
    if (email !== undefined) {
      if (!validateEmail(email)) return res.status(400).json({ message: 'Invalid email' });
      updates.push('email = ?');
      params.push(email);
    }
    if (phone !== undefined) {
      if (!isNonEmptyString(phone)) return res.status(400).json({ message: 'Invalid phone' });
      updates.push('phone = ?');
      params.push(phone);
    }
    if (city !== undefined) { updates.push('city = ?'); params.push(isNonEmptyString(city) ? city : null); }
    if (property_interest !== undefined) { updates.push('property_interest = ?'); params.push(isNonEmptyString(property_interest) ? property_interest : null); }
    if (source !== undefined) { updates.push('source = ?'); params.push(source || 'website'); }
    if (status !== undefined) { updates.push('status = ?'); params.push(status || 'new'); }
    if (message !== undefined) { updates.push('message = ?'); params.push(isNonEmptyString(message) ? message : null); }
    if (assigned_to !== undefined) { updates.push('assigned_to = ?'); params.push(isNonEmptyString(assigned_to) ? assigned_to : null); }

    if (updates.length === 0) return res.status(400).json({ message: 'No fields to update' });
    params.push(id);
    const tenantPool = await getTenantPool(tenantDb);
    await ensureTenantLeadsTableExists(tenantPool);
    await ensureTenantLeadsSchema(tenantPool, tenantDb);
    await tenantPool.query(`UPDATE leads SET ${updates.join(', ')} WHERE id = ?`, params);
    await notifySuperAdmin({
      type: 'broker_lead_updated',
      title: 'Broker lead updated',
      message: `Lead #${id} updated`,
      actorBrokerId: req.user?.id || null,
      actorBrokerEmail: req.user?.email || null,
    });
    return res.json({ ok: true });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('updateBrokerLead error:', err?.code || err?.message || err);
    return res.status(500).json({ message: 'Failed to update lead' });
  }
}

// Super admin: combined list of admin + all broker tenant leads
export async function listAllSourcesLeads(req, res) {
  try {
    const [adminRows] = await pool.query(
      'SELECT id, full_name, email, phone, city, property_interest, source, status, message, assigned_to, created_at, updated_at FROM leads'
    );
    const adminLeads = adminRows.map(r => ({ ...r, lead_source_type: 'main' }));

    const [brokers] = await pool.query('SELECT id, full_name, tenant_db FROM brokers WHERE tenant_db IS NOT NULL');
    const brokerLeads = [];
    for (const br of brokers) {
      if (!br.tenant_db) continue;
      try {
        const tenantPool = await getTenantPool(br.tenant_db);
        const [rows] = await tenantPool.query(
          'SELECT id, full_name, email, phone, city, property_interest, source, status, message, assigned_to, created_at, updated_at FROM leads'
        );
        for (const r of rows) {
          brokerLeads.push({
            ...r,
            lead_source_type: 'broker',
            broker_id: br.id,
            broker_name: br.full_name,
            tenant_db: br.tenant_db,
          });
        }
      } catch (e) {
      }
    }

    return res.json({ data: [...adminLeads, ...brokerLeads] });
  } catch (err) {
    return res.status(500).json({ message: 'Server error' });
  }
}


