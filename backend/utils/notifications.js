import pool from '../config/database.js';
import { getTenantPool } from './tenant.js';

export async function notifySuperAdmin({ type, title, message, actorBrokerId = null, actorBrokerName = null, actorBrokerEmail = null }) {
  try {
    await pool.query(
      `INSERT INTO super_admin_notifications (type, title, message, actor_broker_id, actor_broker_name, actor_broker_email)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [String(type || ''), String(title || ''), message || null, actorBrokerId || null, actorBrokerName || null, actorBrokerEmail || null]
    );
  } catch (e) {
    // non-blocking: avoid failing main flow due to notification issues
  }
}

export async function notifyBroker({ tenantDb, type, title, message }) {
  try {
    if (!tenantDb) return;
    const tenantPool = await getTenantPool(tenantDb);
    await tenantPool.query(
      `INSERT INTO broker_notifications (type, title, message)
       VALUES (?, ?, ?)`,
      [String(type || ''), String(title || ''), message || null]
    );
  } catch (e) {
    // non-blocking: avoid failing main flow due to notification issues
  }
}


