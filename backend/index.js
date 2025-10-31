import fs from 'fs';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import expressLayouts from 'express-ejs-layouts';
import pool from './config/database.js';
import authRoutes from './routes/authRoutes.js';
import brokerRoutes from './routes/brokerRoutes.js';
import propertyRoutes from './routes/propertyRoutes.js';
import brokerUserRoutes from './routes/brokerUserRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import leadsRoutes from './routes/leadsRoutes.js';
import systemRoutes from './routes/systemRoutes.js';
import templatesRoutes from './routes/templatesRoutes.js';
import { getSiteByDomain } from './utils/sites.js';
import { serveSiteBySlug, previewTemplate } from './controllers/templatesController.js';
import { recordResponseMs } from './utils/metrics.js';

dotenv.config();

const app = express();

// View engine for server-rendered templates (EJS with layouts)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'templates'));
app.use(expressLayouts);
// We'll pass layout per-render; keep default off
app.set('layout', false);

const isProd = process.env.NODE_ENV === 'production';
const templatesRoot = path.join(__dirname, 'templates');
const publicRoot = path.join(__dirname, 'public');
const staticCacheControl = isProd ? 'public, max-age=31536000, immutable' : 'public, max-age=0, must-revalidate';
const staticOptions = {
  fallthrough: true,
  setHeaders(res) {
    res.setHeader('Cache-Control', staticCacheControl);
  },
};

const templateStaticCache = new Map();

function isSafeTemplateName(name) {
  return typeof name === 'string' && /^[a-z0-9-_]+$/i.test(name);
}

function getTemplatePublicHandler(template) {
  if (templateStaticCache.has(template)) {
    return templateStaticCache.get(template);
  }
  const publicDir = path.join(templatesRoot, template, 'public');
  try {
    const stat = fs.statSync(publicDir);
    if (!stat.isDirectory()) return null;
  } catch {
    return null;
  }
  const handler = express.static(publicDir, staticOptions);
  templateStaticCache.set(template, handler);
  return handler;
}

function createTemplateAssetsRouter() {
  const router = express.Router({ mergeParams: true });

  const serveTemplatePublic = (req, res, next) => {
    const { template } = req.params;
    if (!isSafeTemplateName(template)) return res.status(404).end();
    const handler = getTemplatePublicHandler(template);
    if (!handler) return res.status(404).end();
    return handler(req, res, next);
  };

  router.use('/:template/public', serveTemplatePublic);
  router.use('/:template/assets', serveTemplatePublic); // optional alias for legacy asset URLs
  router.use(express.static(templatesRoot, staticOptions));
  return router;
}

const templateAssetsRouter = createTemplateAssetsRouter();
app.use('/templates', templateAssetsRouter);

const legacyTemplateAssets = express.Router({ mergeParams: true });
legacyTemplateAssets.use('/:template', (req, res, next) => {
  const { template } = req.params;
  if (!isSafeTemplateName(template)) return res.status(404).end();
  const handler = getTemplatePublicHandler(template);
  if (!handler) return res.status(404).end();
  return handler(req, res, next);
});
app.use('/api/templates/assets', legacyTemplateAssets);

app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: {
    useDefaults: true,
    directives: {
      'style-src': ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      'script-src': ["'self'", "'unsafe-inline'"],
      'img-src': [
        "'self'",
        'data:',
        'blob:',
        'https://images.unsplash.com',
        'https://plus.unsplash.com',
        'https://images.pexels.com',
        process.env.PUBLIC_ORIGIN || 'https://www.proker.xyz',
        'https://www.proker.xyz',
        'https://proker.xyz',
      ],
      'font-src': ["'self'", 'data:', 'https://fonts.gstatic.com'],
    },
  },
}));
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(cookieParser());

const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 200, standardHeaders: true, legacyHeaders: false });
if (isProd) {
  // Only enforce rate limits in production
  app.use('/api', limiter);
}

// Measure response time (simple middleware)
app.use((req, res, next) => {
  const start = process.hrtime.bigint();
  res.on('finish', () => {
    const end = process.hrtime.bigint();
    const durationMs = Number(end - start) / 1e6;
    recordResponseMs(durationMs);
  });
  next();
});

app.get('/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'ok' });
  } catch (e) {
    res.status(500).json({ status: 'error' });
  }
});

app.use('/api/auth', authRoutes);
app.use('/api/broker', brokerRoutes);
app.use('/api/properties', propertyRoutes);
app.use('/api/broker-users', brokerUserRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/system', systemRoutes);
app.use('/api/leads', leadsRoutes);
app.use('/api/templates', templatesRoutes);

function mountStaticDir(url, dir) {
  app.use(url, express.static(dir, staticOptions));
}

// Serve uploaded images
mountStaticDir('/profiles', path.join(publicRoot, 'profiles'));
mountStaticDir('/properties', path.join(publicRoot, 'properties'));
// API-prefixed mirrors for environments that only proxy /api to backend
mountStaticDir('/api/profiles', path.join(publicRoot, 'profiles'));
mountStaticDir('/api/properties', path.join(publicRoot, 'properties'));
// Serve any other files under /public at root (e.g., /public/* and relative links)
app.use(express.static(publicRoot, staticOptions));

// Public preview of a backend EJS template (no auth)
app.get('/site/preview/:template', previewTemplate);
app.get('/site/preview/:template/:page', previewTemplate);

// Resolve custom-domain root to site pages
app.get('/resolve-host', (req, res) => {
  try {
    const host = (req.headers['x-forwarded-host'] || req.headers.host || '').toString().split(',')[0].trim();
    const site = getSiteByDomain(host);
    if (!site) return res.status(404).send('Site not found');
    const p = (req.query.path || '/').toString();
    const clean = p.replace(/\/$/, '') || '/';
    let sub = '';
    if (clean === '/' || clean === '') sub = '';
    else if (clean === '/properties') sub = '/properties';
    else if (clean === '/about') sub = '/about';
    else if (clean === '/contact') sub = '/contact';
    return res.redirect(302, `/site/${site.slug}${sub}`);
  } catch (e) {
    return res.status(500).send('Server error');
  }
});

// Site by slug pages (generic handler to support deep paths without path-to-regexp wildcards)
app.use('/site/:slug', (req, res) => {
  // When mounted via app.use, req.baseUrl is '/site/:slug', req.path is the remainder (e.g., '/', '/properties', '/x/y')
  const remainder = req.path || '/';
  const cleaned = remainder.replace(/^\/+|\/+$/g, '');
  const last = cleaned.split('/').filter(Boolean).pop() || '';
  req.params.page = /^[a-z0-9-_]+$/i.test(last) ? last : 'home';
  return serveSiteBySlug(req, res);
});

// Custom-domain serving: map Host header to site and render template pages
app.use(async (req, res, next) => {
  try {
    // Skip API and static asset routes
    if (req.path.startsWith('/api') || req.path.startsWith('/profiles') || req.path.startsWith('/properties') || req.path.startsWith('/templates')) {
      return next();
    }
    const host = (req.headers['x-forwarded-host'] || req.headers.host || '').toString().split(',')[0].trim();
    if (!host) return next();
    const site = getSiteByDomain(host);
    if (!site) return next();
    const raw = req.path || '/';
    const last = raw.replace(/^\/+|\/+$/g, '').split('/').filter(Boolean).pop() || 'home';
    const page = /^[a-z0-9-_]+$/i.test(last) ? last : 'home';
    // Delegate rendering to existing site renderer
    req.params = { slug: site.slug, page };
    return serveSiteBySlug(req, res);
  } catch {
    return next();
  }
});

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});


