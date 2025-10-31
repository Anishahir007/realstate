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
const fsp = fs.promises;
const TEMPLATE_ASSET_CACHE_TTL_MS = process.env.NODE_ENV === 'production' ? 5 * 60 * 1000 : 5 * 1000;
const templateAssetCache = new Map();

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

function toPosix(p) {
  return p.replace(/\\/g, '/');
}

function escapeRegExp(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function buildVersionedUrl(base, relativePath, mtimeMs) {
  const cleanBase = base.replace(/\/+$/, '');
  const encoded = toPosix(relativePath).split('/').map((segment) => encodeURIComponent(segment)).join('/');
  const versionSuffix = Number.isFinite(mtimeMs) ? `?v=${Math.round(mtimeMs)}` : '';
  return `${cleanBase}/${encoded}${versionSuffix}`;
}

async function listAssetFiles(rootDir, extension) {
  const results = [];

  async function walk(currentDir, relative = '') {
    let entries;
    try {
      entries = await fsp.readdir(currentDir, { withFileTypes: true });
    } catch (err) {
      if (err && err.code === 'ENOENT') return;
      throw err;
    }
    for (const entry of entries) {
      const absPath = path.join(currentDir, entry.name);
      const relPath = relative ? `${relative}/${entry.name}` : entry.name;
      if (entry.isDirectory()) {
        await walk(absPath, relPath);
      } else if (entry.isFile() && entry.name.toLowerCase().endsWith(extension)) {
        let stat;
        try {
          stat = await fsp.stat(absPath);
        } catch {
          stat = { mtimeMs: undefined };
        }
        results.push({ relative: toPosix(relPath), mtimeMs: stat.mtimeMs });
      }
    }
  }

  await walk(rootDir);
  results.sort((a, b) => a.relative.localeCompare(b.relative));
  return results;
}

async function buildTemplateAssetManifest(template) {
  const baseHref = `/templates/${template}/`;
  const publicBase = `/templates/${template}/public`;
  const root = getTemplatesRoot();
  const cssDir = path.join(root, template, 'public', 'css');
  const jsDir = path.join(root, template, 'public', 'js');

  try {
    const [cssFiles, jsFiles] = await Promise.all([
      listAssetFiles(cssDir, '.css'),
      listAssetFiles(jsDir, '.js'),
    ]);

    return {
      template,
      baseHref,
      css: cssFiles.map((file) => buildVersionedUrl(`${publicBase}/css`, file.relative, file.mtimeMs)),
      js: jsFiles.map((file) => buildVersionedUrl(`${publicBase}/js`, file.relative, file.mtimeMs)),
    };
  } catch {
    return { template, baseHref, css: [], js: [] };
  }
}

async function getTemplateAssetManifest(template) {
  const cached = templateAssetCache.get(template);
  const now = Date.now();
  if (cached && cached.expires > now) {
    return cached.value;
  }
  const value = await buildTemplateAssetManifest(template);
  templateAssetCache.set(template, { value, expires: now + TEMPLATE_ASSET_CACHE_TTL_MS });
  return value;
}

function ensureBaseHref(html, baseHref) {
  if (!html) return html;
  const safeBase = baseHref.endsWith('/') ? baseHref : `${baseHref}/`;
  const baseRegex = /<base[^>]*href=["'][^"']*["'][^>]*>/i;
  if (baseRegex.test(html)) {
    return html.replace(baseRegex, `<base href="${safeBase}">`);
  }
  if (html.includes('<head')) {
    return html.replace('<head>', `<head><base href="${safeBase}">`);
  }
  return `<base href="${safeBase}">${html}`;
}

function stripLegacyTemplateAssets(html, template) {
  if (!html) return html;
  let out = html.replace(/<link[^>]+data-template-asset=["']css["'][^>]*>\s*/gi, '');
  out = out.replace(/<script[^>]+data-template-asset=["']js["'][^>]*>\s*<\/script>\s*/gi, '');
  const escapedTemplate = template ? escapeRegExp(template) : "[^\"']+";
  const cssPattern = new RegExp(`<link[^>]+href=["']\/(?:api\/templates\/assets|templates\/${escapedTemplate}\/public)[^"']+\.css["'][^>]*>\\s*`, 'gi');
  const jsPattern = new RegExp(`<script[^>]+src=["']\/(?:api\/templates\/assets|templates\/${escapedTemplate}\/public)[^"']+\.js["'][^>]*>\\s*<\\/script>`, 'gi');
  out = out.replace(cssPattern, '');
  out = out.replace(jsPattern, '');
  return out;
}

function injectTemplateAssets(html, manifest) {
  if (!html) return html;
  let out = html;
  if (manifest.css?.length) {
    const cssTags = manifest.css.map((href) => `<link rel="stylesheet" href="${href}" data-template-asset="css">`).join('\n    ');
    const block = `    <!-- template-css -->\n    ${cssTags}\n`;
    out = out.includes('</head>')
      ? out.replace('</head>', `${block}</head>`)
      : `${block}${out}`;
  }
  if (manifest.js?.length) {
    const jsTags = manifest.js.map((src) => `<script src="${src}" data-template-asset="js"></script>`).join('\n    ');
    const block = `    <!-- template-js -->\n    ${jsTags}\n`;
    out = out.includes('</body>')
      ? out.replace('</body>', `${block}</body>`)
      : `${out}\n${block}`;
  }
  return out;
}

function finalizeTemplateHtml(html, template, manifest) {
  let out = ensureBaseHref(html, manifest.baseHref);
  out = stripLegacyTemplateAssets(out, template);
  out = injectTemplateAssets(out, manifest);
  out = rewritePublicAssetUrls(out);
  out = encodeSpacesInPublicUrls(out);
  return out;
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

export async function previewTemplatePage(req, res) {
  try {
    const template = (req.params.template || '').toString();
    const token = (req.query?.t || '').toString();
    const origin = req.get('origin') || process.env.PUBLIC_ORIGIN || `${req.protocol}://${req.get('host')}`;
    const previewUrl = `${origin}/api/templates/preview/${template}`;
    const safeToken = token.replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const html = `<!doctype html>
<html>
  <head>
    <meta charset="utf-8">
    <title>Template Preview - ${template}</title>
    <base href="${origin}/">
    <style>body{margin:0;font:14px/1.5 system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, Cantarell, Noto Sans, Helvetica, Arial}#loading{padding:16px;color:#374151}</style>
  </head>
  <body>
    <div id="loading">Loading preview...</div>
    <script>
      (async function(){
        try {
          const resp = await fetch('${previewUrl}', { headers: { 'Authorization': 'Bearer ${safeToken}' } });
          const txt = await resp.text();
          document.open();
          document.write(txt);
          document.close();
        } catch (e) {
          document.getElementById('loading').textContent = 'Preview failed: ' + (e && e.message ? e.message : e);
        }
      })();
    </script>
  </body>
</html>`;
    return res.send(html);
  } catch (err) {
    const isProd = process.env.NODE_ENV === 'production';
    return res.status(500).send(isProd ? 'Server error' : String(err?.message || err));
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

function encodeSpacesInPublicUrls(html) {
  try {
    if (!html) return html;
    return html.replace(/(href|src)=("|')((\/)(profiles|properties)\/[^"']+)(\2)/gi, (m, attr, q, url, slash, bucket) => {
      try { return `${attr}=${q}${encodeURI(url)}${q}`; } catch { return m; }
    });
  } catch { return html; }
}

function rewritePublicAssetUrls(html) {
  try {
    if (!html) return html;
    let out = html.replace(/(href|src)=("|')\/profiles\//gi, (m, a, q) => `${a}=${q}/api/profiles/`);
    out = out.replace(/(href|src)=("|')\/properties\//gi, (m, a, q) => `${a}=${q}/api/properties/`);
    // Also rewrite inside CSS url()
    out = out.replace(/url\((['"]?)\/profiles\//gi, (m, q) => `url(${q}/api/profiles/`);
    out = out.replace(/url\((['"]?)\/properties\//gi, (m, q) => `url(${q}/api/properties/`);
    return out;
  } catch { return html; }
}

function normalizeAssetPath(u, defaultBucket) {
  try {
    if (!u) return '';
    let s = String(u).trim().replace(/\\/g, '/');
    // Remove leading './' or 'public/'
    s = s.replace(/^\.\//, '').replace(/^public\//i, '');
    // Already absolute http(s)
    if (/^https?:\/\//i.test(s)) return s;
    // Ensure bucket prefix
    if (!/^\//.test(s) && !/^profiles\//i.test(s) && !/^properties\//i.test(s)) {
      if (defaultBucket) s = `${defaultBucket.replace(/\/$/, '')}/` + s;
    }
    // Force absolute path so <base href> won't break it
    s = '/' + s.replace(/^\//, '');
    // URL-encode spaces and special chars but keep slashes
    const parts = s.split('/');
    const encoded = parts.map((p, idx) => idx === 0 ? p : encodeURIComponent(p));
    return encoded.join('/');
  } catch { return u; }
}

function makeAbsoluteIfNeeded(p, assetOrigin) {
  try {
    if (!p) return p;
    if (/^https?:\/\//i.test(p)) return p;
    if (!assetOrigin) return p;
    return assetOrigin.replace(/\/$/, '') + p;
  } catch { return p; }
}

function buildSiteContext({ broker, properties, page, nav, assetOrigin }) {
  const normalizedBroker = broker ? { ...broker, photo: makeAbsoluteIfNeeded(normalizeAssetPath(broker.photo, 'profiles'), assetOrigin) } : broker;
  const normalizedProps = Array.isArray(properties)
    ? properties.map((p) => ({ ...p, image_url: makeAbsoluteIfNeeded(normalizeAssetPath(p?.image_url, 'properties'), assetOrigin) }))
    : [];
  return {
    site: {
      title: normalizedBroker?.full_name ? `${normalizedBroker.full_name} Real Estate` : 'Real Estate',
      broker: normalizedBroker,
    },
    page,
    properties: normalizedProps,
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
              pf.expected_price, pf.built_up_area, pf.area_unit, p.created_at,
              (
                SELECT file_url FROM property_media m
                WHERE m.property_id = p.id
                ORDER BY m.is_primary DESC, m.id ASC
                LIMIT 1
              ) AS image_url
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

function pickFeatured(properties, limit = 6) {
  try {
    const arr = Array.isArray(properties) ? properties.slice() : [];
    arr.sort((a, b) => (Number(b?.expected_price) || 0) - (Number(a?.expected_price) || 0));
    return arr.slice(0, limit);
  } catch { return []; }
}

export async function previewTemplate(req, res) {
  try {
    const template = (req.params.template || '').toString();
    const view = ((req.params.page || req.query.page) || 'home').toString();
    const tenantDb = req.headers['x-tenant-db'] || req.headers['x-tenant'] || req.user?.tenant_db || '';
    const viewPath = getTemplateViewPath(template, view);
    if (!fs.existsSync(viewPath)) return res.status(404).send('Not found');

    // Fetch broker basic profile if available
    let broker = null;
    if (req.user?.role === 'broker') {
      broker = { id: req.user.id, full_name: req.user.name || req.user.full_name || 'Broker', email: req.user.email, tenant_db: req.user.tenant_db };
    }
    const properties = tenantDb ? await fetchBrokerAndProperties(tenantDb) : [];
    const base = `/site/preview/${template}`;
    const origin = `${req.protocol}://${req.get('host')}`;
    const nav = { home: `${base}`, properties: `${base}/properties`, about: `${base}/about`, contact: `${base}/contact`, privacy: `${base}/privacy`, terms: `${base}/terms` };
    const featuredProperties = pickFeatured(properties);
    const context = { ...buildSiteContext({ broker, properties, page: view, nav, assetOrigin: origin }), featuredProperties };
    // Use Express view engine + layouts when available
    const viewRel = getTemplateViewRel(template, view);
    const layoutRel = getTemplateLayoutRel(template);
    const manifest = await getTemplateAssetManifest(template);
    return res.render(viewRel, { ...context, layout: layoutRel || false }, (err, html) => {
      if (err) {
        const isProd = process.env.NODE_ENV === 'production';
        return res.status(500).send(isProd ? 'Server error' : String(err?.message || err));
      }
      try {
        const out = finalizeTemplateHtml(html, template, manifest);
        return res.send(out);
      } catch (renderErr) {
        const isProd = process.env.NODE_ENV === 'production';
        return res.status(500).send(isProd ? 'Server error' : String(renderErr?.message || renderErr));
      }
    });
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
    const origin = `${req.protocol}://${req.get('host')}`;
    const nav = { home: `/site/${slug}`, properties: `/site/${slug}/properties`, about: `/site/${slug}/about`, contact: `/site/${slug}/contact`, privacy: `/site/${slug}/privacy`, terms: `/site/${slug}/terms` };
    const featuredProperties = pickFeatured(properties);
    const context = { ...buildSiteContext({ broker, properties, page: view, nav, assetOrigin: origin }), featuredProperties };
    const viewRel = getTemplateViewRel(site.template, view);
    const layoutRel = getTemplateLayoutRel(site.template);
    const manifest = await getTemplateAssetManifest(site.template);
    return res.render(viewRel, { ...context, layout: layoutRel || false }, (err, html) => {
      if (err) {
        const isProd = process.env.NODE_ENV === 'production';
        return res.status(500).send(isProd ? 'Server error' : String(err?.message || err));
      }
      try {
        const out = finalizeTemplateHtml(html, site.template, manifest);
        return res.send(out);
      } catch (renderErr) {
        const isProd = process.env.NODE_ENV === 'production';
        return res.status(500).send(isProd ? 'Server error' : String(renderErr?.message || renderErr));
      }
    });
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


