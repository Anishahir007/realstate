import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { getSystemHealth, getSuperAdminDashboardStats } from '../controllers/systemController.js';

const router = Router();

router.get('/health', requireAuth, requireRole('super_admin'), getSystemHealth);
router.get('/dashboard-stats', requireAuth, requireRole('super_admin'), getSuperAdminDashboardStats);

export default router;


