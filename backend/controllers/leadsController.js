import pool from '../config/database.js';
import { getTenantPool } from '../utils/tenant.js';
import { isNonEmptyString, validateEmail } from '../utils/validation.js';

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
    const [rows] = await tenantPool.query(
      'SELECT id, full_name, email, phone, city, property_interest, source, status, message, assigned_to, created_at, updated_at FROM leads ORDER BY id DESC'
    );
    const data = rows.map(r => ({ ...r, lead_source_type: 'broker' }));
    return res.json({ data });
  } catch (err) {
    return res.status(500).json({ message: 'Server error' });
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
    const [result] = await tenantPool.query(
      `INSERT INTO leads (full_name, email, phone, city, property_interest, source, status, message, assigned_to)
       VALUES (?, ?, ?, ?, ?, COALESCE(?, 'website'), COALESCE(?, 'new'), ?, ?)`,
      [full_name, email, phone, city || null, property_interest || null, source || null, status || null, message || null, assigned_to || null]
    );
    return res.status(201).json({ id: result.insertId });
  } catch (err) {
    return res.status(500).json({ message: 'Server error' });
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
    await tenantPool.query(`UPDATE leads SET ${updates.join(', ')} WHERE id = ?`, params);
    return res.json({ ok: true });
  } catch (err) {
    return res.status(500).json({ message: 'Server error' });
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


