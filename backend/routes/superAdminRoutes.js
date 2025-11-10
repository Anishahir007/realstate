import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth.js';
import {
  listSuperAdminUsers,
  createSuperAdminUser,
  updateSuperAdminUser,
} from '../controllers/superAdminUserController.js';

const router = Router();

router.use(requireAuth, requireRole('super_admin'));

router.get('/users', listSuperAdminUsers);
router.post('/users', createSuperAdminUser);
router.put('/users/:id', updateSuperAdminUser);

export default router;

