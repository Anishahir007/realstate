import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth.js';
import {
  listSuperAdminUsers,
  createSuperAdminUser,
  updateSuperAdminUser,
} from '../controllers/superAdminUserController.js';
import { upload } from '../middleware/multer.js';

const router = Router();

router.use(requireAuth, requireRole('super_admin'));

router.get('/users', listSuperAdminUsers);
router.post('/users', upload.single('photo', 'profiles'), createSuperAdminUser);
router.put('/users/:id', upload.single('photo', 'profiles'), updateSuperAdminUser);

export default router;

