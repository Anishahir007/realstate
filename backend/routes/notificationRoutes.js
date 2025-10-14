import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { listSuperAdminNotifications, markSuperAdminNotificationRead } from '../controllers/notificationController.js';

const router = Router();

router.get('/super-admin', requireAuth, requireRole('super_admin'), listSuperAdminNotifications);
router.post('/super-admin/:id/read', requireAuth, requireRole('super_admin'), markSuperAdminNotificationRead);

export default router;


