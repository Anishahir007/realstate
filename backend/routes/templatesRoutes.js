import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { listTemplates, previewTemplate, publishTemplateAsSite, listMySites, serveSiteBySlug, getSiteContext, getPreviewContext, connectCustomDomain, checkCustomDomain, getDomainSiteContext } from '../controllers/templatesController.js';

const router = Router();

// Broker and Company can list templates and preview
router.get('/list', requireAuth, requireRole('broker', 'company'), listTemplates);
router.get('/preview/:template', requireAuth, requireRole('broker', 'company'), previewTemplate);
// Preview JSON for frontend templates (use token in query or header)
router.get('/preview/:template/context', requireAuth, requireRole('broker', 'company'), getPreviewContext);

// Broker and Company can publish
router.post('/publish', requireAuth, requireRole('broker', 'company'), publishTemplateAsSite);
router.get('/my-sites', requireAuth, requireRole('broker', 'company'), listMySites);

// Custom domain
router.post('/connect-domain', requireAuth, requireRole('broker', 'company'), connectCustomDomain);
router.get('/check-domain', requireAuth, requireRole('broker', 'company'), checkCustomDomain);

// JSON for frontend
router.get('/site/:slug/context', getSiteContext);
router.get('/domain/context', getDomainSiteContext);

export default router;


