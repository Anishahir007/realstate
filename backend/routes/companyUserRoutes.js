import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { signupTenantUser, loginTenantUser, listTenantUsers, getTenantUserById, updateTenantUser } from '../controllers/companyUserController.js';

const router = Router();

// Public signup/login using tenant header `x-tenant-db`, or authenticated company can create users for their tenant
router.post('/signup', signupTenantUser); // expects x-tenant-db header or company token
router.post('/login', loginTenantUser);   // expects x-tenant-db header

// Example: company can onboard users explicitly (auth optional since controller reads tenant from token if present)
router.post('/company/create', requireAuth, requireRole('company'), signupTenantUser);

// Company-authenticated tenant user management
router.get('/', requireAuth, requireRole('company'), listTenantUsers);
router.get('/:id', requireAuth, requireRole('company'), getTenantUserById);
router.put('/:id', requireAuth, requireRole('company'), updateTenantUser);

export default router;

