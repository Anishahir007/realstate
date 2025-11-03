import { Router } from 'express';
import multer from 'multer';
import { requireAuth, requireRole } from '../middleware/auth.js';
import {
  getAllTemplates,
  updateTemplateStatus,
  updateTemplateBanner,
  uploadBanner,
  previewTemplateForAdmin,
} from '../controllers/templateManagementController.js';

const router = Router();

// Error handling middleware for multer errors
const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ message: 'File size too large. Maximum size is 10MB.' });
    }
    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({ message: 'Unexpected file field. Please use "banner" as the field name.' });
    }
    return res.status(400).json({ message: err.message || 'File upload error' });
  }
  if (err) {
    return res.status(400).json({ message: err.message || 'File upload error' });
  }
  next();
};

// Super admin only routes
router.get('/all', requireAuth, requireRole('super_admin'), getAllTemplates);
router.patch('/:templateName/status', requireAuth, requireRole('super_admin'), updateTemplateStatus);
router.post('/:templateName/banner', requireAuth, requireRole('super_admin'), uploadBanner, handleMulterError, updateTemplateBanner);
router.get('/:template/preview', requireAuth, requireRole('super_admin'), previewTemplateForAdmin);

export default router;

