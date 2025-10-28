import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { listTemplates, previewTemplate, publishTemplateAsSite, listMySites, serveSiteBySlug, connectCustomDomain, checkCustomDomain } from '../controllers/templatesController.js';

const router = Router();

// Broker can list templates and preview (EJS-only)
router.get('/list', requireAuth, requireRole('broker'), listTemplates);
router.get('/preview/:template', requireAuth, requireRole('broker'), previewTemplate);

// Broker can publish
router.post('/publish', requireAuth, requireRole('broker'), publishTemplateAsSite);
router.get('/my-sites', requireAuth, requireRole('broker'), listMySites);

// Custom domain
router.post('/connect-domain', requireAuth, requireRole('broker'), connectCustomDomain);
router.get('/check-domain', requireAuth, requireRole('broker'), checkCustomDomain);

// Public EJS pages are handled at the app level (e.g., app.get('/site/:slug/:page?'))

export default router;


