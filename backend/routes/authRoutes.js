import { Router } from 'express';
import {
  signupSuperAdmin,
  loginSuperAdmin,
  signupBroker,
  loginBroker,
  signupUser,
  loginUser,
  createBrokerByAdmin,
  whoami,
  updateSuperAdminProfile,
} from '../controllers/authController.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { upload } from '../middleware/multer.js';

const router = Router();

// Super Admin
router.post('/super-admin/signup', signupSuperAdmin);
router.post('/super-admin/login', loginSuperAdmin);
// Accepts JSON updates and also multipart upload for photo
router.put('/super-admin/profile', requireAuth, requireRole('super_admin'), upload.single('photo', 'profiles'), updateSuperAdminProfile);

// Broker
router.post('/broker/signup', signupBroker);
router.post('/broker/login', loginBroker);
router.post('/broker', requireAuth, requireRole('super_admin'), createBrokerByAdmin);

// User
router.post('/user/signup', signupUser);
router.post('/user/login', loginUser);

// Current authenticated user info
router.get('/whoami', requireAuth, whoami);

export default router;


