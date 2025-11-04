import pool from '../config/database.js';
import { getTenantPool } from '../utils/tenant.js';

export async function listSuperAdminNotifications(req, res) {
  try {
    const limit = Math.min(parseInt(req.query.limit || '100', 10), 1000);
    const [rows] = await pool.query(
      `SELECT id, type, title, message, actor_broker_id, actor_broker_name, actor_broker_email, is_read, created_at, read_at
       FROM super_admin_notifications
       ORDER BY created_at DESC
       LIMIT ?`,
      [limit]
    );
    res.json({ data: rows });
  } catch (e) {
    res.status(500).json({ message: 'Server error' });
  }
}

export async function markSuperAdminNotificationRead(req, res) {
  try {
    const id = parseInt(req.params.id, 10);
    if (!id) return res.status(400).json({ message: 'Invalid id' });
    await pool.query(
      `UPDATE super_admin_notifications SET is_read = 1, read_at = NOW() WHERE id = ?`,
      [id]
    );
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ message: 'Server error' });
  }
}

export async function markAllSuperAdminNotificationsRead(req, res) {
  try {
    await pool.query(
      `UPDATE super_admin_notifications SET is_read = 1, read_at = NOW() WHERE is_read = 0`
    );
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ message: 'Server error' });
  }
}

// Broker notifications
export async function listBrokerNotifications(req, res) {
  try {
    const tenantDb = req.user?.tenant_db;
    if (!tenantDb) return res.status(400).json({ message: 'Missing tenant' });
    
    const limit = Math.min(parseInt(req.query.limit || '100', 10), 1000);
    const tenantPool = await getTenantPool(tenantDb);
    
    // Ensure table exists
    await tenantPool.query(
      `CREATE TABLE IF NOT EXISTS \`broker_notifications\` (
        id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
        type VARCHAR(100) NOT NULL,
        title VARCHAR(255) NOT NULL,
        message TEXT NULL,
        is_read TINYINT(1) NOT NULL DEFAULT 0,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        read_at TIMESTAMP NULL,
        PRIMARY KEY (id),
        KEY idx_broker_notifications_is_read (is_read),
        KEY idx_broker_notifications_created_at (created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`
    );
    
    const [rows] = await tenantPool.query(
      `SELECT id, type, title, message, is_read, created_at, read_at
       FROM broker_notifications
       ORDER BY created_at DESC
       LIMIT ?`,
      [limit]
    );
    res.json({ data: rows });
  } catch (e) {
    res.status(500).json({ message: 'Server error' });
  }
}

export async function markBrokerNotificationRead(req, res) {
  try {
    const tenantDb = req.user?.tenant_db;
    if (!tenantDb) return res.status(400).json({ message: 'Missing tenant' });
    
    const id = parseInt(req.params.id, 10);
    if (!id) return res.status(400).json({ message: 'Invalid id' });
    
    const tenantPool = await getTenantPool(tenantDb);
    await tenantPool.query(
      `UPDATE broker_notifications SET is_read = 1, read_at = NOW() WHERE id = ?`,
      [id]
    );
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ message: 'Server error' });
  }
}

export async function markAllBrokerNotificationsRead(req, res) {
  try {
    const tenantDb = req.user?.tenant_db;
    if (!tenantDb) return res.status(400).json({ message: 'Missing tenant' });
    
    const tenantPool = await getTenantPool(tenantDb);
    await tenantPool.query(
      `UPDATE broker_notifications SET is_read = 1, read_at = NOW() WHERE is_read = 0`
    );
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ message: 'Server error' });
  }
}


