import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { 
  listSuperAdminNotifications, 
  markSuperAdminNotificationRead,
  markAllSuperAdminNotificationsRead,
} from '../controllers/notificationController.js';

const router = Router();

router.get('/super-admin', requireAuth, requireRole('super_admin'), listSuperAdminNotifications);
router.post('/super-admin/:id/read', requireAuth, requireRole('super_admin'), markSuperAdminNotificationRead);
router.post('/super-admin/mark-all-read', requireAuth, requireRole('super_admin'), markAllSuperAdminNotificationsRead);

export default router;


