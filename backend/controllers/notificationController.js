import pool from '../config/database.js';

export async function listSuperAdminNotifications(req, res) {
  try {
    const limit = Math.min(parseInt(req.query.limit || '20', 10), 100);
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


