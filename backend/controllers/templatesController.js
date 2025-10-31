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

function readTemplateAsset(templateName, assetPath) {
  const p = path.join(getTemplatesRoot(), templateName, assetPath);
  if (fs.existsSync(p)) return fs.readFileSync(p, 'utf-8');
  return '';
}

function injectBaseHref(html, baseHref) {
  try {
    if (!html) return html;
    const safe = String(baseHref || '/');
    if (html.includes('<head')) {
      return html.replace('<head>', `<head><base href="${safe}">`);
    }
    // Fallback prepend
    return `<base href="${safe}">` + html;
  } catch {
    return html;
  }
}

function tryInlineTemplateCss(html, templateName) {
  try {
    const root = getTemplatesRoot();
    const cssDir = path.join(root, templateName, 'public', 'css');
    if (!fs.existsSync(cssDir)) return html;
    const cssFiles = [
      'style.css',
      'navbar.css',
      'responsive.css',
      'hero.css',
      'featured.css',
      'insights.css',
      'contacthome.css',
      'testimonials.css',
      'about.css',
    ].filter(f => fs.existsSync(path.join(cssDir, f)));
    if (cssFiles.length === 0) return html;
    const blocks = cssFiles.map(f => {
      try { return `<style>\n${fs.readFileSync(path.join(cssDir, f), 'utf-8')}\n</style>`; } catch { return ''; }
    }).join('\n');
    if (!blocks.trim()) return html;
    if (html.includes('</head>')) return html.replace('</head>', `${blocks}\n</head>`);
    return blocks + html;
  } catch {
    return html;
  }
}

function rewriteTemplateAssetUrls(html) {
  try {
    if (!html) return html;
    let out = html.replace(/(href|src)=["']\/templates\//g, (m, p1) => `${p1}="/api/templates/assets/`);
    // Replace CSS url(/templates/..)
    out = out.replace(/url\((['"]?)\/templates\//g, (m, q) => `url(${q}/api/templates/assets/`);
    return out;
  } catch { return html; }
}

function stripExternalTemplateAssets(html) {
  try {
    if (!html) return html;
    // Remove link tags that point to template css (both /templates and /api/templates/assets)
    let out = html.replace(/<link[^>]+href=["']\/(api\/templates\/assets|templates)\/[^"']+\.css["'][^>]*>/gi, '');
    // Remove script tags that point to template js
    out = out.replace(/<script[^>]+src=["']\/(api\/templates\/assets|templates)\/[^"']+\.js["'][^>]*><\/script>/gi, '');
    return out;
  } catch { return html; }
}

function tryInlineTemplateJs(html, templateName) {
  try {
    const root = getTemplatesRoot();
    const jsDir = path.join(root, templateName, 'public', 'js');
    if (!fs.existsSync(jsDir)) return html;
    const jsFiles = ['hero.js', 'testimonials.js'].filter(f => fs.existsSync(path.join(jsDir, f)));
    if (jsFiles.length === 0) return html;
    const blocks = jsFiles.map(f => {
      try { return `<script>\n${fs.readFileSync(path.join(jsDir, f), 'utf-8')}\n</script>`; } catch { return ''; }
    }).join('\n');
    if (!blocks.trim()) return html;
    if (html.includes('</body>')) return html.replace('</body>', `${blocks}\n</body>`);
    return html + blocks;
  } catch { return html; }
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
    let s = String(u).trim();
    if (!s) return '';
    // Preserve and strip query/hash temporarily
    let query = '';
    let hash = '';
    const hashIndex = s.indexOf('#');
    if (hashIndex !== -1) {
      hash = s.slice(hashIndex);
      s = s.slice(0, hashIndex);
    }
    const queryIndex = s.indexOf('?');
    if (queryIndex !== -1) {
      query = s.slice(queryIndex);
      s = s.slice(0, queryIndex);
    }

    s = s.replace(/\\/g, '/');
    // Remove leading './'
    s = s.replace(/^\.+\//, '');
    // Remove leading slashes but remember if it existed
    s = s.replace(/^\/+/, '');
    // Strip duplicated public/ prefixes
    s = s.replace(/^public\//i, '');
    // Strip template folder references (templates/<name>/public/...)
    const templatePublicMatch = s.match(/^templates\/[^/]+\/public\/(.+)$/i);
    if (templatePublicMatch) {
      s = templatePublicMatch[1];
    }
    // If path still contains assets/{profiles|properties}/ prefix, trim it down
    const assetsMatch = s.match(/(?:^|\/)assets\/(profiles|properties)\/(.+)$/i);
    if (assetsMatch) {
      s = `${assetsMatch[1].toLowerCase()}/${assetsMatch[2]}`;
    }

    // Already absolute http(s)
    if (/^https?:\/\//i.test(u)) {
      return String(u).trim();
    }

    // Ensure bucket prefix
    if (!/^profiles\//i.test(s) && !/^properties\//i.test(s)) {
      if (defaultBucket) s = `${defaultBucket.replace(/\/$/, '')}/${s}`;
    }

    s = '/' + s.replace(/^\/+/, '');
    const parts = s.split('/');
    const encoded = parts.map((part, idx) => idx === 0 ? part : encodeURIComponent(part));
    const built = encoded.join('/');
    return `${built}${query}${hash}`;
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
    const assetOrigin = (process.env.ASSET_ORIGIN || process.env.PUBLIC_ASSET_ORIGIN || process.env.PUBLIC_ORIGIN || origin).replace(/\/$/, '');
    const nav = { home: `${base}`, properties: `${base}/properties`, about: `${base}/about`, contact: `${base}/contact`, privacy: `${base}/privacy`, terms: `${base}/terms` };
    const featuredProperties = pickFeatured(properties);
    const context = { ...buildSiteContext({ broker, properties, page: view, nav, assetOrigin }), featuredProperties };
    // Use Express view engine + layouts when available
    const viewRel = getTemplateViewRel(template, view);
    const layoutRel = getTemplateLayoutRel(template);
    return res.render(viewRel, { ...context, layout: layoutRel || false }, (err, html) => {
      if (err) return res.status(500).send(process.env.NODE_ENV === 'production' ? 'Server error' : String(err?.message || err));
      let out = injectBaseHref(html, `/templates/${template}/`);
      out = tryInlineTemplateCss(out, template);
      out = tryInlineTemplateJs(out, template);
      out = rewriteTemplateAssetUrls(out);
      out = stripExternalTemplateAssets(out);
      out = encodeSpacesInPublicUrls(out);
      return res.send(out);
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
    const assetOrigin = (process.env.ASSET_ORIGIN || process.env.PUBLIC_ASSET_ORIGIN || process.env.PUBLIC_ORIGIN || origin).replace(/\/$/, '');
    const nav = { home: `/site/${slug}`, properties: `/site/${slug}/properties`, about: `/site/${slug}/about`, contact: `/site/${slug}/contact`, privacy: `/site/${slug}/privacy`, terms: `/site/${slug}/terms` };
    const featuredProperties = pickFeatured(properties);
    const context = { ...buildSiteContext({ broker, properties, page: view, nav, assetOrigin }), featuredProperties };
    const viewRel = getTemplateViewRel(site.template, view);
    const layoutRel = getTemplateLayoutRel(site.template);
    return res.render(viewRel, { ...context, layout: layoutRel || false }, (err, html) => {
      if (err) return res.status(500).send(process.env.NODE_ENV === 'production' ? 'Server error' : String(err?.message || err));
      let out = injectBaseHref(html, `/templates/${site.template}/`);
      out = tryInlineTemplateCss(out, site.template);
      out = tryInlineTemplateJs(out, site.template);
      out = rewriteTemplateAssetUrls(out);
      out = stripExternalTemplateAssets(out);
      out = encodeSpacesInPublicUrls(out);
      return res.send(out);
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


