import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { getSystemHealth } from '../controllers/systemController.js';

const router = Router();

router.get('/health', requireAuth, requireRole('super_admin'), getSystemHealth);

export default router;


