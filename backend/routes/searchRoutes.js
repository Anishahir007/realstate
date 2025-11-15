import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { superAdminSearch, brokerSearch, companySearch } from '../controllers/searchController.js';

const router = Router();

// Super Admin search
router.get('/superadmin', requireAuth, requireRole('super_admin'), superAdminSearch);

// Broker search
router.get('/broker', requireAuth, requireRole('broker'), brokerSearch);

// Company search
router.get('/company', requireAuth, requireRole('company'), companySearch);

export default router;

