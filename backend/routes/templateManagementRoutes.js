import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth.js';
import {
  getAllTemplates,
  updateTemplateStatus,
  updateTemplateBanner,
  uploadBanner,
  previewTemplateForAdmin,
} from '../controllers/templateManagementController.js';

const router = Router();

// Super admin only routes
router.get('/all', requireAuth, requireRole('super_admin'), getAllTemplates);
router.patch('/:templateName/status', requireAuth, requireRole('super_admin'), updateTemplateStatus);
router.post('/:templateName/banner', requireAuth, requireRole('super_admin'), uploadBanner, updateTemplateBanner);
router.get('/:template/preview', requireAuth, requireRole('super_admin'), previewTemplateForAdmin);

export default router;

