import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth.js';
import {
  listTemplates,
  previewTemplate,
  publishTemplateAsSite,
  listMySites,
  connectCustomDomain,
  checkCustomDomain,
  setTemplateStatus,
  previewTemplatePage,
} from '../controllers/templatesController.js';

const router = Router();

// Template catalogue & status management
router.get('/list', requireAuth, listTemplates);
router.post('/admin/set-status', requireAuth, requireRole('super_admin'), setTemplateStatus);

// Preview experiences
router.get('/admin/preview-page/:template', previewTemplatePage);
router.get('/preview/:template', requireAuth, previewTemplate);
router.get('/preview/:template/:page', requireAuth, previewTemplate);

// Publishing and broker site management
router.post('/publish', requireAuth, requireRole('broker'), publishTemplateAsSite);
router.get('/my-sites', requireAuth, requireRole('broker'), listMySites);

// Custom domain lifecycle
router.post('/connect-domain', requireAuth, requireRole('broker'), connectCustomDomain);
router.get('/check-domain', requireAuth, requireRole('broker'), checkCustomDomain);

// Legacy guard – public site routing handled at app level
router.get('/site/:slug', (req, res) => res.status(410).send('Deprecated: use /site/:slug at app level'));

export default router;


