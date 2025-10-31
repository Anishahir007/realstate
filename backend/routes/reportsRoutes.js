import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth.js';
import {
  getBrokerReports,
  getPropertyReports,
  getLeadsReports,
  getAnalyticsReport,
} from '../controllers/reportsController.js';

const router = Router();

router.get('/brokers', requireAuth, requireRole('super_admin'), getBrokerReports);
router.get('/properties', requireAuth, requireRole('super_admin'), getPropertyReports);
router.get('/leads', requireAuth, requireRole('super_admin'), getLeadsReports);
router.get('/analytics', requireAuth, requireRole('super_admin'), getAnalyticsReport);

export default router;
