import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { listTemplates, previewTemplate, publishTemplateAsSite, listMySites, serveSiteBySlug, getSiteContext, getPreviewContext, connectCustomDomain, checkCustomDomain, getDomainSiteContext } from '../controllers/templatesController.js';
import { getHeroBanners, uploadHeroBanner, updateHeroBannerPosition, updateHeroBannerDimensions, deleteHeroBanner, getPublicHeroBanners, getSiteLogo, uploadSiteLogo, updateLogoDimensions, deleteSiteLogo } from '../controllers/heroBannerController.js';
import { getAboutUs, updateAboutUs, uploadAboutUsImage, updateAboutUsImagePosition, updateAboutUsImageCaption, deleteAboutUsImage, getPublicAboutUs } from '../controllers/aboutUsController.js';
import { upload } from '../middleware/multer.js';

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

// Hero banners management (authenticated)
// Routes without slug use getUserSiteSlug from req.user
router.get('/hero-banners', requireAuth, requireRole('broker', 'company'), getHeroBanners);
router.get('/hero-banners/:slug', requireAuth, requireRole('broker', 'company'), getHeroBanners);
router.post('/hero-banners', requireAuth, requireRole('broker', 'company'), upload.single('file', 'banners'), uploadHeroBanner);
router.post('/hero-banners/:slug', requireAuth, requireRole('broker', 'company'), upload.single('file', 'banners'), uploadHeroBanner);
router.put('/hero-banners/:bannerId/position', requireAuth, requireRole('broker', 'company'), updateHeroBannerPosition);
router.put('/hero-banners/:slug/:bannerId/position', requireAuth, requireRole('broker', 'company'), updateHeroBannerPosition);
router.put('/hero-banners/:bannerId/dimensions', requireAuth, requireRole('broker', 'company'), updateHeroBannerDimensions);
router.put('/hero-banners/:slug/:bannerId/dimensions', requireAuth, requireRole('broker', 'company'), updateHeroBannerDimensions);
router.delete('/hero-banners/:bannerId', requireAuth, requireRole('broker', 'company'), deleteHeroBanner);
router.delete('/hero-banners/:slug/:bannerId', requireAuth, requireRole('broker', 'company'), deleteHeroBanner);

// Public endpoint for hero banners (for website display)
router.get('/site/:slug/hero-banners', getPublicHeroBanners);

// Logo management (authenticated)
router.get('/logo', requireAuth, requireRole('broker', 'company'), getSiteLogo);
router.get('/logo/:slug', requireAuth, requireRole('broker', 'company'), getSiteLogo);
router.post('/logo', requireAuth, requireRole('broker', 'company'), upload.single('file', 'banners'), uploadSiteLogo);
router.post('/logo/:slug', requireAuth, requireRole('broker', 'company'), upload.single('file', 'banners'), uploadSiteLogo);
router.put('/logo/dimensions', requireAuth, requireRole('broker', 'company'), updateLogoDimensions);
router.put('/logo/:slug/dimensions', requireAuth, requireRole('broker', 'company'), updateLogoDimensions);
router.delete('/logo', requireAuth, requireRole('broker', 'company'), deleteSiteLogo);
router.delete('/logo/:slug', requireAuth, requireRole('broker', 'company'), deleteSiteLogo);

// Public endpoint for logo (for website display)
router.get('/site/:slug/logo', getSiteLogo);

// About Us management (authenticated)
router.get('/about-us', requireAuth, requireRole('broker', 'company'), getAboutUs);
router.get('/about-us/:slug', requireAuth, requireRole('broker', 'company'), getAboutUs);
router.put('/about-us', requireAuth, requireRole('broker', 'company'), updateAboutUs);
router.put('/about-us/:slug', requireAuth, requireRole('broker', 'company'), updateAboutUs);
router.post('/about-us/images', requireAuth, requireRole('broker', 'company'), upload.single('file', 'about-us'), uploadAboutUsImage);
router.post('/about-us/images/:slug', requireAuth, requireRole('broker', 'company'), upload.single('file', 'about-us'), uploadAboutUsImage);
router.put('/about-us/images/:imageId/position', requireAuth, requireRole('broker', 'company'), updateAboutUsImagePosition);
router.put('/about-us/images/:slug/:imageId/position', requireAuth, requireRole('broker', 'company'), updateAboutUsImagePosition);
router.put('/about-us/images/:imageId/caption', requireAuth, requireRole('broker', 'company'), updateAboutUsImageCaption);
router.put('/about-us/images/:slug/:imageId/caption', requireAuth, requireRole('broker', 'company'), updateAboutUsImageCaption);
router.delete('/about-us/images/:imageId', requireAuth, requireRole('broker', 'company'), deleteAboutUsImage);
router.delete('/about-us/images/:slug/:imageId', requireAuth, requireRole('broker', 'company'), deleteAboutUsImage);

// Public endpoint for About Us (for website display)
router.get('/site/:slug/about-us', getPublicAboutUs);

export default router;


