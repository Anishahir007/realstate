import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import pool from './config/database.js';
import authRoutes from './routes/authRoutes.js';
import brokerRoutes from './routes/brokerRoutes.js';
import propertyRoutes from './routes/propertyRoutes.js';
import brokerUserRoutes from './routes/brokerUserRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import leadsRoutes from './routes/leadsRoutes.js';
import systemRoutes from './routes/systemRoutes.js';
import templatesRoutes from './routes/templatesRoutes.js';
import reportsRoutes from './routes/reportsRoutes.js';
import { recordResponseMs } from './utils/metrics.js';

dotenv.config();

const app = express();

app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  crossOriginEmbedderPolicy: false
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
app.use('/api/reports', reportsRoutes);
// Serve template assets FIRST so it doesn't get swallowed by /api/templates router
app.use('/api/templates/assets', express.static(path.join(__dirname, 'templates')));
app.use('/api/templates', templatesRoutes);
// Serve uploaded images
app.use('/profiles', express.static('public/profiles'));
app.use('/properties', express.static('public/properties'));  
// API-prefixed mirrors for environments that only proxy /api to backend
app.use('/api/profiles', express.static('public/profiles'));
app.use('/api/properties', express.static('public/properties'));
// Serve any other files under /public at root (e.g., /public/* and relative links)
app.use(express.static(path.join(__dirname, 'public')));

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});


