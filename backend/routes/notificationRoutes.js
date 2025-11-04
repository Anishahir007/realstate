import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { 
  listSuperAdminNotifications, 
  markSuperAdminNotificationRead,
  markAllSuperAdminNotificationsRead,
  listBrokerNotifications,
  markBrokerNotificationRead,
  markAllBrokerNotificationsRead,
} from '../controllers/notificationController.js';

const router = Router();

// Super Admin notifications
router.get('/super-admin', requireAuth, requireRole('super_admin'), listSuperAdminNotifications);
router.post('/super-admin/:id/read', requireAuth, requireRole('super_admin'), markSuperAdminNotificationRead);
router.post('/super-admin/mark-all-read', requireAuth, requireRole('super_admin'), markAllSuperAdminNotificationsRead);

// Broker notifications
router.get('/broker', requireAuth, requireRole('broker'), listBrokerNotifications);
router.post('/broker/:id/read', requireAuth, requireRole('broker'), markBrokerNotificationRead);
router.post('/broker/mark-all-read', requireAuth, requireRole('broker'), markAllBrokerNotificationsRead);

export default router;


