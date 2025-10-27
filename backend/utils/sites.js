import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

function getSitesStorePath() {
  // backend/public/sites/sites.json
  const root = path.resolve(__dirname, '..');
  const publicDir = path.join(root, 'public');
  const sitesDir = path.join(publicDir, 'sites');
  ensureDir(sitesDir);
  return path.join(sitesDir, 'sites.json');
}

export function loadSitesMap() {
  const p = getSitesStorePath();
  try {
    if (!fs.existsSync(p)) return {};
    const raw = fs.readFileSync(p, 'utf-8');
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function saveSitesMap(map) {
  const p = getSitesStorePath();
  fs.writeFileSync(p, JSON.stringify(map, null, 2), 'utf-8');
}

function sanitizeSlugPart(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

export function generateSiteSlug({ brokerName, brokerId }) {
  const namePart = sanitizeSlugPart(brokerName) || 'broker-site';
  const idPart = String(brokerId || '').replace(/[^0-9]/g, '').slice(-4) || Math.floor(Math.random() * 9000 + 1000);
  const rand = uuidv4().split('-')[0];
  return `${namePart}-${idPart}-${rand}`;
}

export function generateStableBrokerSlug({ brokerName, brokerId }) {
  const namePart = sanitizeSlugPart(brokerName) || 'broker';
  const idPart = String(brokerId || '').replace(/[^0-9]/g, '');
  return `${namePart}-${idPart}`;
}

export function getSiteBySlug(slug) {
  const map = loadSitesMap();
  return map[slug] || null;
}

export function publishSite({ slug, brokerId, template, siteTitle }) {
  const map = loadSitesMap();
  const now = new Date().toISOString();
  // Ensure only one active site per broker: remove any previous entries for this broker
  for (const key of Object.keys(map)) {
    if (String(map[key]?.brokerId) === String(brokerId)) {
      delete map[key];
    }
  }
  map[slug] = { slug, brokerId, template, siteTitle: siteTitle || null, createdAt: now, updatedAt: now };
  saveSitesMap(map);
  return map[slug];
}

export function listPublishedSitesForBroker(brokerId) {
  const map = loadSitesMap();
  return Object.values(map).filter((s) => String(s.brokerId) === String(brokerId));
}


