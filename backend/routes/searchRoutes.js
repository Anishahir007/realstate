import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { superAdminSearch, brokerSearch } from '../controllers/searchController.js';

const router = Router();

// Super Admin search
router.get('/superadmin', requireAuth, requireRole('super_admin'), superAdminSearch);

// Broker search
router.get('/broker', requireAuth, requireRole('broker'), brokerSearch);

export default router;

