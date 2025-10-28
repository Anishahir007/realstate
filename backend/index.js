import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
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

app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  crossOriginEmbedderPolicy: false,
}));
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(cookieParser());

const isProd = process.env.NODE_ENV === 'production';
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
// Serve uploaded images
app.use('/profiles', express.static('public/profiles'));
app.use('/properties', express.static('public/properties'));  
// Frontend renders templates now; no static template assets from backend

// Public preview of a backend EJS template (no auth)
app.get('/site/preview/:template', previewTemplate);

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

// Site by slug pages (register explicit variants; some router versions dislike `?`)
app.get('/site/:slug', serveSiteBySlug);
app.get('/site/:slug/:page', serveSiteBySlug);

// Custom-domain serving: map Host header to site and render template pages
app.use(async (req, res, next) => {
  try {
    // Skip API and static asset routes
    if (req.path.startsWith('/api') || req.path.startsWith('/profiles') || req.path.startsWith('/properties') || req.path.startsWith('/templates')) return next();
    const host = (req.headers['x-forwarded-host'] || req.headers.host || '').toString().split(',')[0].trim();
    if (!host) return next();
    const site = getSiteByDomain(host);
    if (!site) return next();
    const pathname = (req.path || '/').replace(/\/$/, '') || '/';
    let page = 'home';
    if (pathname === '/' || pathname === '') page = 'home';
    else if (pathname === '/properties') page = 'properties';
    else if (pathname === '/about') page = 'about';
    else if (pathname === '/contact') page = 'contact';
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


