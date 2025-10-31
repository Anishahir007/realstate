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

// Routes
import authRoutes from './routes/authRoutes.js';
import brokerRoutes from './routes/brokerRoutes.js';
import propertyRoutes from './routes/propertyRoutes.js';
import brokerUserRoutes from './routes/brokerUserRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import leadsRoutes from './routes/leadsRoutes.js';
import systemRoutes from './routes/systemRoutes.js';
import templatesRoutes from './routes/templatesRoutes.js';

// Utils / Controllers
import { getSiteByDomain } from './utils/sites.js';
import { serveSiteBySlug, previewTemplate } from './controllers/templatesController.js';
import { recordResponseMs } from './utils/metrics.js';

dotenv.config();

const app = express();

// -------------------- PATH SETUP --------------------
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// -------------------- VIEW ENGINE --------------------
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'templates'));
app.use(expressLayouts);
app.set('layout', false); // we'll control layout manually

// -------------------- SECURITY + BASICS --------------------
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: {
    useDefaults: true,
    directives: {
      "style-src": ["'self'", "'unsafe-inline'"],
      "script-src": ["'self'", "'unsafe-inline'"],
      "img-src": [
        "'self'",
        "data:",
        "https://images.unsplash.com",
        "https://plus.unsplash.com",
        "https://images.pexels.com",
        process.env.PUBLIC_ORIGIN || 'https://www.proker.xyz',
        'https://www.proker.xyz',
        'https://proker.xyz',
        'https://prokers.cloud'
      ],
      "font-src": ["'self'", "data:"],
    }
  }
}));
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(cookieParser());

// -------------------- RATE LIMIT --------------------
const isProd = process.env.NODE_ENV === 'production';
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
});
if (isProd) {
  app.use('/api', limiter);
}

// -------------------- METRICS --------------------
app.use((req, res, next) => {
  const start = process.hrtime.bigint();
  res.on('finish', () => {
    const end = process.hrtime.bigint();
    const durationMs = Number(end - start) / 1e6;
    recordResponseMs(durationMs);
  });
  next();
});

// -------------------- HEALTH CHECK --------------------
app.get('/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'ok' });
  } catch (e) {
    res.status(500).json({ status: 'error' });
  }
});

// -------------------- API ROUTES --------------------
app.use('/api/auth', authRoutes);
app.use('/api/broker', brokerRoutes);
app.use('/api/properties', propertyRoutes);
app.use('/api/broker-users', brokerUserRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/system', systemRoutes);
app.use('/api/leads', leadsRoutes);
app.use('/api/templates', templatesRoutes);

// -------------------- STATIC FILES --------------------

// ✅ Serve uploaded images
app.use('/profiles', express.static(path.join(__dirname, 'public/profiles')));
app.use('/properties', express.static(path.join(__dirname, 'public/properties')));
app.use('/api/profiles', express.static(path.join(__dirname, 'public/profiles')));
app.use('/api/properties', express.static(path.join(__dirname, 'public/properties')));

// ✅ Serve per-template assets (CSS, JS, images)
app.use('/templates/:template/public', (req, res, next) => {
  const { template } = req.params;
  const templatePublicPath = path.join(__dirname, 'templates', template, 'public');
  express.static(templatePublicPath, { fallthrough: false })(req, res, next);
});

// ✅ Serve backend root public folder (if needed)
app.use(express.static(path.join(__dirname, 'public')));

// -------------------- TEMPLATE PREVIEW --------------------
app.get('/site/preview/:template', previewTemplate);
app.get('/site/preview/:template/:page', previewTemplate);

// -------------------- DOMAIN HANDLERS --------------------
app.get('/resolve-host', (req, res) => {
  try {
    const host = (req.headers['x-forwarded-host'] || req.headers.host || '').toString().split(',')[0].trim();
    const site = getSiteByDomain(host);
    if (!site) return res.status(404).send('Site not found');

    const p = (req.query.path || '/').toString();
    const clean = p.replace(/\/$/, '') || '/';
    const map = { '/': '', '/properties': '/properties', '/about': '/about', '/contact': '/contact' };
    const sub = map[clean] || '';
    return res.redirect(302, `/site/${site.slug}${sub}`);
  } catch (e) {
    return res.status(500).send('Server error');
  }
});

// -------------------- SITE BY SLUG --------------------
app.use('/site/:slug', (req, res) => {
  const remainder = (req.path || '/');
  const cleaned = remainder.replace(/^\/+|\/+$/g, '');
  const last = cleaned.split('/').filter(Boolean).pop() || '';
  req.params.page = /^[a-z0-9-_]+$/i.test(last) ? last : 'home';
  return serveSiteBySlug(req, res);
});

// -------------------- CUSTOM DOMAIN HANDLER --------------------
app.use(async (req, res, next) => {
  try {
    if (req.path.startsWith('/api') || req.path.startsWith('/profiles') || req.path.startsWith('/properties') || req.path.startsWith('/templates'))
      return next();

    const host = (req.headers['x-forwarded-host'] || req.headers.host || '').toString().split(',')[0].trim();
    if (!host) return next();

    const site = getSiteByDomain(host);
    if (!site) return next();

    const raw = (req.path || '/');
    const last = raw.replace(/^\/+|\/+$/g, '').split('/').filter(Boolean).pop() || 'home';
    const page = /^[a-z0-9-_]+$/i.test(last) ? last : 'home';
    req.params = { slug: site.slug, page };

    return serveSiteBySlug(req, res);
  } catch {
    return next();
  }
});

// -------------------- START SERVER --------------------
const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
