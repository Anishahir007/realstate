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

export function generateStableCompanySlug({ companyName, companyId }) {
  const namePart = sanitizeSlugPart(companyName) || 'company';
  const idPart = String(companyId || '').replace(/[^0-9]/g, '');
  return `${namePart}-${idPart}`;
}

export function getSiteBySlug(slug) {
  const map = loadSitesMap();
  return map[slug] || null;
}

export function publishSite({ slug, brokerId, companyId, ownerType, template, siteTitle }) {
  const map = loadSitesMap();
  const now = new Date().toISOString();
  const ownerId = ownerType === 'company' ? companyId : brokerId;
  // Ensure only one active site per owner: capture any previous domain then remove previous entries
  let preservedDomain = null;
  let preservedVerifiedAt = null;
  for (const key of Object.keys(map)) {
    const site = map[key];
    const siteOwnerId = site.ownerType === 'company' ? site.companyId : site.brokerId;
    if (String(siteOwnerId) === String(ownerId) && site.ownerType === ownerType) {
      if (site?.customDomain) {
        preservedDomain = site.customDomain;
        preservedVerifiedAt = site.domainVerifiedAt || null;
      }
      delete map[key];
    }
  }
  const siteData = {
    slug,
    template,
    siteTitle: siteTitle || null,
    createdAt: now,
    updatedAt: now,
    customDomain: preservedDomain,
    domainVerifiedAt: preservedVerifiedAt,
    ownerType: ownerType || 'broker',
  };
  if (ownerType === 'company') {
    siteData.companyId = companyId;
  } else {
    siteData.brokerId = brokerId;
  }
  map[slug] = siteData;
  saveSitesMap(map);
  return map[slug];
}

export function listPublishedSitesForBroker(brokerId) {
  const map = loadSitesMap();
  return Object.values(map).filter((s) => (s.ownerType !== 'company' && !s.ownerType) && String(s.brokerId) === String(brokerId));
}

export function listPublishedSitesForCompany(companyId) {
  const map = loadSitesMap();
  return Object.values(map).filter((s) => s.ownerType === 'company' && String(s.companyId) === String(companyId));
}


// ---- Domain helpers ----

function normalizeDomain(input) {
  return String(input || '')
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, '')
    .replace(/\/$/, '')
    .replace(/:\d+$/, ''); // Remove port numbers (e.g., :443, :80, :3000)
}

export function setCustomDomainForSite(slug, domain) {
  const map = loadSitesMap();
  const normalized = normalizeDomain(domain);
  if (!map[slug]) return null;
  // Ensure the domain is unique by clearing it from any other site
  for (const key of Object.keys(map)) {
    if (key !== slug && map[key]?.customDomain === normalized) {
      map[key].customDomain = null;
      map[key].domainVerifiedAt = null;
    }
  }
  map[slug].customDomain = normalized;
  map[slug].updatedAt = new Date().toISOString();
  saveSitesMap(map);
  return map[slug];
}

export function getSiteByDomain(domain) {
  const map = loadSitesMap();
  const normalized = normalizeDomain(domain);
  const withoutWww = normalized.replace(/^www\./, '');
  const withWww = normalized.startsWith('www.') ? normalized : `www.${normalized}`;
  for (const key of Object.keys(map)) {
    const cd = normalizeDomain(map[key]?.customDomain || '');
    if (!cd) continue;
    const cdWithoutWww = cd.replace(/^www\./, '');
    if (cd === normalized || cd === withoutWww || cd === withWww || cdWithoutWww === withoutWww) {
      return map[key];
    }
  }
  return null;
}

export function markDomainVerified(slug) {
  const map = loadSitesMap();
  if (!map[slug]) return null;
  map[slug].domainVerifiedAt = new Date().toISOString();
  map[slug].updatedAt = map[slug].domainVerifiedAt;
  saveSitesMap(map);
  return map[slug];
}


