import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { signupTenantUser, loginTenantUser } from '../controllers/brokerUserController.js';

const router = Router();

// Public signup/login using tenant header `x-tenant-db`, or authenticated broker can create users for their tenant
router.post('/signup', signupTenantUser); // expects x-tenant-db header or broker token
router.post('/login', loginTenantUser);   // expects x-tenant-db header

// Example: broker can onboard users explicitly (auth optional since controller reads tenant from token if present)
router.post('/broker/create', requireAuth, requireRole('broker'), signupTenantUser);

export default router;


