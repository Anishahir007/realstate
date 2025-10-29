import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import ejs from 'ejs';
import { getTenantPool } from '../utils/tenant.js';
import pool from '../config/database.js';
import { generateStableBrokerSlug, publishSite, listPublishedSitesForBroker, getSiteBySlug, setCustomDomainForSite, getSiteByDomain, markDomainVerified } from '../utils/sites.js';
import dns from 'dns/promises';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function getTemplatesRoot() {
  return path.resolve(__dirname, '..', 'templates');
}

function listTemplatesFromFs() {
  const root = getTemplatesRoot();
  if (!fs.existsSync(root)) return [];
  const names = fs.readdirSync(root, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name);
  return names.map((name) => ({ name, label: name.replace(/[-_]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()), previewImage: `/templates/${name}/assets/preview.jpg` }));
}

export async function listTemplates(req, res) {
  try {
    // Read from backend templates folder (EJS)
    const items = listTemplatesFromFs();
    // Merge status map; non-super_admins only see active
    const statusMap = readTemplateStatusMap();
    const withStatus = items.map(t => ({ ...t, status: statusMap[t.name] || 'active' }));
    const isSuper = req.user && req.user.role === 'super_admin';
    const filtered = isSuper ? withStatus : withStatus.filter(t => t.status !== 'inactive');
    return res.json({ data: filtered });
  } catch (err) {
    const isProd = process.env.NODE_ENV === 'production';
    return res.status(500).json({ message: 'Server error', error: isProd ? undefined : String(err?.message || err) });
  }
}

// ---- Template status (active/inactive) stored in a small JSON file ----
function getTemplateStatusPath() {
  return path.resolve(__dirname, '..', 'public', 'templates', 'templates-status.json');
}
function ensureDirExists(p) {
  const dir = path.dirname(p);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}
function readTemplateStatusMap() {
  try {
    const p = getTemplateStatusPath();
    if (!fs.existsSync(p)) return {};
    const raw = fs.readFileSync(p, 'utf-8');
    return JSON.parse(raw || '{}') || {};
  } catch {
    return {};
  }
}
function writeTemplateStatusMap(map) {
  try {
    const p = getTemplateStatusPath();
    ensureDirExists(p);
    fs.writeFileSync(p, JSON.stringify(map, null, 2));
  } catch {}
}

export async function setTemplateStatus(req, res) {
  try {
    if (!req.user || req.user.role !== 'super_admin') {
      return res.status(403).json({ message: 'Forbidden' });
    }
    const name = (req.body?.name || '').toString();
    const status = (req.body?.status || 'active').toString();
    if (!name || !['active','inactive'].includes(status)) {
      return res.status(400).json({ message: 'Invalid name/status' });
    }
    const map = readTemplateStatusMap();
    map[name] = status;
    writeTemplateStatusMap(map);
    return res.json({ ok: true });
  } catch (err) {
    const isProd = process.env.NODE_ENV === 'production';
    return res.status(500).json({ message: 'Server error', error: isProd ? undefined : String(err?.message || err) });
  }
}

function getTemplateViewPath(templateName, view) {
  const root = getTemplatesRoot();
  const pagesFirst = path.join(root, templateName, 'views', 'pages', `${view}.ejs`);
  if (fs.existsSync(pagesFirst)) return pagesFirst;
  return path.join(root, templateName, 'views', `${view}.ejs`);
}

function getTemplateViewRel(templateName, view) {
  const abs = getTemplateViewPath(templateName, view);
  const root = getTemplatesRoot();
  const relWithExt = path.relative(root, abs).replaceAll('\\', '/');
  return relWithExt.replace(/\.ejs$/i, '');
}

function getTemplateLayoutRel(templateName) {
  const root = getTemplatesRoot();
  const layoutPath = path.join(root, templateName, 'views', 'layout.ejs');
  if (fs.existsSync(layoutPath)) {
    return path.relative(root, layoutPath).replaceAll('\\', '/').replace(/\.ejs$/i, '');
  }
  return null;
}

function readTemplateAsset(templateName, assetPath) {
  const p = path.join(getTemplatesRoot(), templateName, assetPath);
  if (fs.existsSync(p)) return fs.readFileSync(p, 'utf-8');
  return '';
}

function buildSiteContext({ broker, properties, page, nav }) {
  return {
    site: {
      title: broker?.full_name ? `${broker.full_name} Real Estate` : 'Real Estate',
      broker,
    },
    page,
    properties: properties || [],
    nav: nav || { home: '#', properties: '#', about: '#', contact: '#'},
    // urlFor is a dynamic link builder injected per request mode
    urlFor: (p) => nav && nav[p] ? nav[p] : '#',
  };
}

async function fetchBrokerAndProperties(tenantDb) {
  try {
    const tenantPool = await getTenantPool(tenantDb);
    const [rows] = await tenantPool.query(
      `SELECT p.id, p.title, p.city, p.state, p.locality, p.address, p.property_type, p.building_type,
              pf.expected_price, pf.built_up_area, pf.area_unit, p.created_at
       FROM properties p
       LEFT JOIN property_features pf ON pf.property_id = p.id
       ORDER BY p.id DESC
       LIMIT 20`
    );
    return rows;
  } catch {
    return [];
  }
}

export async function previewTemplate(req, res) {
  try {
    const template = (req.params.template || '').toString();
    const view = (req.query.page || 'home').toString();
    const tenantDb = req.headers['x-tenant-db'] || req.headers['x-tenant'] || req.user?.tenant_db || '';
    const viewPath = getTemplateViewPath(template, view);
    if (!fs.existsSync(viewPath)) return res.status(404).send('Not found');

    // Fetch broker basic profile if available
    let broker = null;
    if (req.user?.role === 'broker') {
      broker = { id: req.user.id, full_name: req.user.name || req.user.full_name || 'Broker', email: req.user.email, tenant_db: req.user.tenant_db };
    }
    const properties = tenantDb ? await fetchBrokerAndProperties(tenantDb) : [];
    const nav = { home: '?page=home', properties: '?page=properties', about: '?page=about', contact: '?page=contact', privacy: '?page=privacy', terms: '?page=terms' };
    const context = buildSiteContext({ broker, properties, page: view, nav });
    // Use Express view engine + layouts when available
    const viewRel = getTemplateViewRel(template, view);
    const layoutRel = getTemplateLayoutRel(template);
    return res.render(viewRel, { ...context, layout: layoutRel || false });
  } catch (err) {
    const isProd = process.env.NODE_ENV === 'production';
    return res.status(500).send(isProd ? 'Server error' : String(err?.message || err));
  }
}

export async function publishTemplateAsSite(req, res) {
  try {
    const template = (req.body?.template || '').toString();
    const siteTitle = (req.body?.siteTitle || '').toString();
    if (!template) return res.status(400).json({ message: 'template is required' });
    if (!req.user || req.user.role !== 'broker') return res.status(403).json({ message: 'Forbidden' });
    // Use a stable slug per broker so it replaces previous site
    const slug = generateStableBrokerSlug({ brokerName: req.user.name || req.user.full_name || 'broker', brokerId: req.user.id });
    const site = publishSite({ slug, brokerId: req.user.id, template, siteTitle });
    // Build a public URL that points through the frontend origin when available
    const origin = req.get('origin') || process.env.PUBLIC_ORIGIN || `${req.protocol}://${req.get('host')}`;
    const urlPath = `/site/${site.slug}`;
    const url = `${origin}${urlPath}`;
    return res.status(201).json({ data: { ...site, url, urlPath } });
  } catch (err) {
    const isProd = process.env.NODE_ENV === 'production';
    return res.status(500).json({ message: 'Server error', error: isProd ? undefined : String(err?.message || err) });
  }
}

export async function listMySites(req, res) {
  try {
    if (!req.user || req.user.role !== 'broker') return res.status(403).json({ message: 'Forbidden' });
    const sites = listPublishedSitesForBroker(req.user.id);
    const origin = req.get('origin') || process.env.PUBLIC_ORIGIN || `${req.protocol}://${req.get('host')}`;
    return res.json({ data: sites.map((s) => ({ ...s, url: `${origin}/site/${s.slug}`, urlPath: `/site/${s.slug}` })) });
  } catch (err) {
    const isProd = process.env.NODE_ENV === 'production';
    return res.status(500).json({ message: 'Server error', error: isProd ? undefined : String(err?.message || err) });
  }
}

export async function serveSiteBySlug(req, res) {
  try {
    const slug = (req.params.slug || '').toString();
    // Support both named ':page' and wildcard '/*' captures
    const rawPage = (req.params.page || req.params[0] || '').toString();
    const cleaned = rawPage.replace(/^\/+|\/+$/g, '');
    const last = cleaned.split('/').filter(Boolean).pop() || '';
    let view = last || 'home';
    // only allow simple names like 'home', 'properties', 'post-property'
    if (!/^[a-z0-9-_]+$/i.test(view)) view = 'home';
    const site = getSiteBySlug(slug);
    if (!site) return res.status(404).send('Site not found');
    const viewPath = getTemplateViewPath(site.template, view);
    if (!fs.existsSync(viewPath)) return res.status(404).send('Page not found');
    // Look up broker name/email and tenant_db to pull properties
    let broker = { id: site.brokerId, full_name: site.siteTitle || 'Broker Site' };
    let properties = [];
    try {
      const [rows] = await pool.query('SELECT id, full_name, email, phone, photo, tenant_db FROM brokers WHERE id = ? LIMIT 1', [site.brokerId]);
      const row = rows?.[0];
      if (row) {
        broker = { id: row.id, full_name: row.full_name || broker.full_name, email: row.email, phone: row.phone, photo: row.photo, tenant_db: row.tenant_db };
        if (row.tenant_db) {
          properties = await fetchBrokerAndProperties(row.tenant_db);
        }
      }
    } catch {}
    const nav = { home: `/site/${slug}`, properties: `/site/${slug}/properties`, about: `/site/${slug}/about`, contact: `/site/${slug}/contact`, privacy: `/site/${slug}/privacy`, terms: `/site/${slug}/terms` };
    const context = buildSiteContext({ broker, properties, page: view, nav });
    const viewRel = getTemplateViewRel(site.template, view);
    const layoutRel = getTemplateLayoutRel(site.template);
    return res.render(viewRel, { ...context, layout: layoutRel || false });
  } catch (err) {
    const isProd = process.env.NODE_ENV === 'production';
    return res.status(500).send(isProd ? 'Server error' : String(err?.message || err));
  }
}

// ---- Custom domain management ----

const TARGET_A = process.env.DOMAIN_TARGET_A || '72.61.136.84';

function hostFromRequest(req) {
  return (req.headers['x-forwarded-host'] || req.headers.host || '').toString().split(',')[0].trim();
}

async function isDomainPointingToTarget(domain) {
  const candidates = [domain, domain.startsWith('www.') ? domain.slice(4) : `www.${domain}`];
  for (const d of candidates) {
    try {
      const ips = await dns.resolve4(d);
      if (ips && ips.includes(TARGET_A)) return true;
    } catch {}
  }
  return false;
}

export async function connectCustomDomain(req, res) {
  try {
    if (!req.user || req.user.role !== 'broker') return res.status(403).json({ message: 'Forbidden' });
    const slug = (req.body?.slug || '').toString();
    const domain = (req.body?.domain || '').toString();
    if (!slug) return res.status(400).json({ message: 'slug is required' });
    if (!domain) return res.status(400).json({ message: 'domain is required' });
    const site = getSiteBySlug(slug);
    if (!site || String(site.brokerId) !== String(req.user.id)) return res.status(404).json({ message: 'Site not found' });
    const updated = setCustomDomainForSite(slug, domain);
    const instructions = `Set an A record for ${updated.customDomain} to ${TARGET_A}`;
    return res.json({ data: { ...updated, instructions } });
  } catch (err) {
    const isProd = process.env.NODE_ENV === 'production';
    return res.status(500).json({ message: 'Server error', error: isProd ? undefined : String(err?.message || err) });
  }
}

export async function checkCustomDomain(req, res) {
  try {
    const slug = (req.query?.slug || '').toString();
    const site = getSiteBySlug(slug);
    if (!site) return res.status(404).json({ message: 'Site not found' });
    const domain = site.customDomain;
    if (!domain) return res.json({ data: { connected: false, reason: 'No custom domain set' } });
    const ok = await isDomainPointingToTarget(domain);
    if (ok) markDomainVerified(slug);
    return res.json({ data: { connected: ok, targetA: TARGET_A, domain } });
  } catch (err) {
    const isProd = process.env.NODE_ENV === 'production';
    return res.status(500).json({ message: 'Server error', error: isProd ? undefined : String(err?.message || err) });
  }
}


