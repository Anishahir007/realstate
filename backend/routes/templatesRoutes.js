import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { listTemplates, previewTemplate, publishTemplateAsSite, listMySites, serveSiteBySlug, getSiteContext, getPreviewContext } from '../controllers/templatesController.js';

const router = Router();

// Broker can list templates and preview
router.get('/list', requireAuth, requireRole('broker'), listTemplates);
router.get('/preview/:template', requireAuth, requireRole('broker'), previewTemplate);
// Preview JSON for frontend templates (use token in query or header)
router.get('/preview/:template/context', requireAuth, requireRole('broker'), getPreviewContext);

// Broker can publish
router.post('/publish', requireAuth, requireRole('broker'), publishTemplateAsSite);
router.get('/my-sites', requireAuth, requireRole('broker'), listMySites);

// JSON for frontend
router.get('/site/:slug/context', getSiteContext);

export default router;


