import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import ejs from 'ejs';
import { getTenantPool } from '../utils/tenant.js';
import pool from '../config/database.js';
import { generateSiteSlug, generateStableBrokerSlug, generateStableCompanySlug, publishSite, listPublishedSitesForBroker, listPublishedSitesForCompany, getSiteBySlug, setCustomDomainForSite, getSiteByDomain, markDomainVerified } from '../utils/sites.js';
import dns from 'dns/promises';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function getTemplatesRoot() {
  return path.resolve(__dirname, '..', 'templates');
}

function getFrontendTemplatesRoot() {
  // Monorepo path: backend/controllers/ -> ../../frontend/src/superadmin/templates
  return path.resolve(__dirname, '..', '..', 'frontend', 'src', 'superadmin', 'templates');
}

function listTemplatesFromFrontend() {
  const root = getFrontendTemplatesRoot();
  try {
    if (!fs.existsSync(root)) return [];
    const entries = fs.readdirSync(root, { withFileTypes: true });
    return entries
      .filter((d) => d.isDirectory())
      .filter((d) => {
        const name = d.name.toLowerCase();
        if (name === 'preview') return false;
        const layoutDir = path.join(root, d.name, 'layout');
        try { return fs.existsSync(layoutDir) && fs.statSync(layoutDir).isDirectory(); } catch { return false; }
      })
      .map((d) => ({ name: d.name, label: d.name.replace(/[-_]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()), previewImage: '' }));
  } catch {
    return [];
  }
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
    // Prefer reading from frontend templates directory
    let items = listTemplatesFromFrontend();
    if (!items || items.length === 0) {
      // Fallback to legacy backend templates folder (if any exists)
      items = listTemplatesFromFs();
    }

    // Fetch template data from database (status, banner_image) and merge
    try {
      const [dbTemplates] = await pool.query('SELECT name, status, banner_image FROM templates');
      const dbMap = new Map(dbTemplates.map(t => [t.name, t]));
      
      // Only return active templates for brokers, merge banner_image
      items = items.map(item => {
        const db = dbMap.get(item.name);
        // Only show active templates to brokers
        if (db && db.status !== 'active') {
          return null;
        }
        return {
          ...item,
          banner_image: db?.banner_image || null,
        };
      }).filter(Boolean);
    } catch (dbErr) {
      // If templates table doesn't exist yet, just return FS templates
      // eslint-disable-next-line no-console
      console.error('Error fetching templates from DB:', dbErr);
    }

    return res.json({ data: items });
  } catch (err) {
    const isProd = process.env.NODE_ENV === 'production';
    return res.status(500).json({ message: 'Server error', error: isProd ? undefined : String(err?.message || err) });
  }
}

function getTemplateViewPath(templateName, view) {
  return path.join(getTemplatesRoot(), templateName, 'views', `${view}.ejs`);
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
    nav: nav || { home: '#', properties: '#', about: '#', contact: '#'}
  };
}

async function fetchBrokerAndProperties(tenantDb, req = null) {
  try {
    const tenantPool = await getTenantPool(tenantDb);
    const [rows] = await tenantPool.query(
      `SELECT p.id, p.title, p.city, p.state, p.locality, p.sub_locality, p.address, p.property_type, p.building_type, p.property_for, p.status,
              p.description, p.created_at,
              pf.expected_price, pf.built_up_area, pf.area_unit, pf.carpet_area, pf.carpet_area_unit,
              pf.super_area, pf.super_area_unit, pf.num_bedrooms, pf.num_bathrooms,
              pf.sale_type, pf.availability, pf.approving_authority, pf.ownership, pf.rera_status, pf.rera_number,
              pf.no_of_floors, pf.property_on_floor, pf.furnishing_status, pf.facing, pf.flooring_type, pf.age_years,
              pf.booking_amount, pf.maintenance_charges, pf.possession_by
       FROM properties p
       LEFT JOIN property_features pf ON pf.property_id = p.id
       ORDER BY p.id DESC
       LIMIT 20`
    );
    
    // Fetch media for each property
    const baseUrl = process.env.API_BASE_URL || (req ? (req.protocol + '://' + req.get('host')) : 'http://localhost:8000');
    const propertiesWithMedia = await Promise.all(rows.map(async (r) => {
      let image = null;
      let imageUrl = null;
      let primaryImage = null;
      let media = [];
      
      try {
        const [mediaRows] = await tenantPool.query(
          'SELECT id, file_url, is_primary, category, media_type FROM property_media WHERE property_id = ? ORDER BY is_primary DESC, id ASC',
          [r.id]
        );
        
        if (mediaRows && mediaRows.length > 0) {
          media = mediaRows.map(m => {
            const fileUrl = m.file_url || '';
            const fullUrl = fileUrl.startsWith('http') ? fileUrl : (fileUrl.startsWith('/') ? `${baseUrl}${fileUrl}` : `${baseUrl}/${fileUrl}`);
            return {
              id: m.id,
              file_url: fullUrl,
              url: fullUrl,
              is_primary: Boolean(m.is_primary),
              category: m.category,
              media_type: m.media_type
            };
          });
          
          const primary = mediaRows.find(m => m.is_primary) || mediaRows[0];
          const fileUrl = primary?.file_url || '';
          const fullImageUrl = fileUrl.startsWith('http') ? fileUrl : (fileUrl.startsWith('/') ? `${baseUrl}${fileUrl}` : `${baseUrl}/${fileUrl}`);
          image = fileUrl ? fullImageUrl : null;
          imageUrl = fileUrl ? fullImageUrl : null;
          primaryImage = fileUrl ? fullImageUrl : null;
        }
      } catch (mediaErr) {
        console.error(`[fetchBrokerAndProperties] Error fetching media for property ${r.id}:`, mediaErr);
      }
      
      // Fetch amenities, highlights, and nearby landmarks
      let amenities = [];
      let highlights = [];
      let nearby_landmarks = [];
      let additional_rooms = null;
      
      try {
        const [highlightsRows] = await tenantPool.query('SELECT highlights FROM property_highlights WHERE property_id = ? LIMIT 1', [r.id]);
        if (highlightsRows && highlightsRows[0] && highlightsRows[0].highlights) {
          try {
            highlights = Array.isArray(highlightsRows[0].highlights) 
              ? highlightsRows[0].highlights 
              : JSON.parse(highlightsRows[0].highlights);
          } catch {
            highlights = [];
          }
        }
      } catch (err) {
        console.error(`[fetchBrokerAndProperties] Error fetching highlights for property ${r.id}:`, err);
      }
      
      try {
        const [amenitiesRows] = await tenantPool.query('SELECT amenities FROM property_amenities WHERE property_id = ? LIMIT 1', [r.id]);
        if (amenitiesRows && amenitiesRows[0] && amenitiesRows[0].amenities) {
          try {
            amenities = Array.isArray(amenitiesRows[0].amenities) 
              ? amenitiesRows[0].amenities 
              : JSON.parse(amenitiesRows[0].amenities);
          } catch {
            amenities = [];
          }
        }
      } catch (err) {
        console.error(`[fetchBrokerAndProperties] Error fetching amenities for property ${r.id}:`, err);
      }
      
      try {
        const [landmarksRows] = await tenantPool.query('SELECT nearby_landmarks FROM property_landmarks WHERE property_id = ? LIMIT 1', [r.id]);
        if (landmarksRows && landmarksRows[0] && landmarksRows[0].nearby_landmarks) {
          try {
            nearby_landmarks = Array.isArray(landmarksRows[0].nearby_landmarks) 
              ? landmarksRows[0].nearby_landmarks 
              : JSON.parse(landmarksRows[0].nearby_landmarks);
          } catch {
            nearby_landmarks = [];
          }
        }
      } catch (err) {
        console.error(`[fetchBrokerAndProperties] Error fetching landmarks for property ${r.id}:`, err);
      }

      // Parse additional_rooms from features if it exists
      try {
        const [featuresRows] = await tenantPool.query('SELECT additional_rooms FROM property_features WHERE property_id = ? LIMIT 1', [r.id]);
        if (featuresRows && featuresRows[0] && featuresRows[0].additional_rooms) {
          try {
            additional_rooms = Array.isArray(featuresRows[0].additional_rooms) 
              ? featuresRows[0].additional_rooms 
              : JSON.parse(featuresRows[0].additional_rooms);
          } catch {
            additional_rooms = null;
          }
        }
      } catch (err) {
        console.error(`[fetchBrokerAndProperties] Error fetching additional_rooms for property ${r.id}:`, err);
      }

      // Build features object similar to listAllBrokerPropertiesAdmin
      const features = {
        expected_price: r.expected_price,
        built_up_area: r.built_up_area,
        area_unit: r.area_unit,
        carpet_area: r.carpet_area,
        carpet_area_unit: r.carpet_area_unit,
        super_area: r.super_area,
        super_area_unit: r.super_area_unit,
        num_bedrooms: r.num_bedrooms,
        num_bathrooms: r.num_bathrooms,
        sale_type: r.sale_type,
        availability: r.availability,
        approving_authority: r.approving_authority,
        ownership: r.ownership,
        rera_status: r.rera_status,
        rera_number: r.rera_number,
        no_of_floors: r.no_of_floors,
        property_on_floor: r.property_on_floor,
        furnishing_status: r.furnishing_status,
        facing: r.facing,
        flooring_type: r.flooring_type,
        age_years: r.age_years,
        booking_amount: r.booking_amount,
        maintenance_charges: r.maintenance_charges,
        possession_by: r.possession_by,
        additional_rooms: additional_rooms,
      };

      return {
        id: r.id,
        title: r.title,
        property_type: r.property_type,
        type: r.property_type,
        building_type: r.building_type,
        buildingType: r.building_type,
        property_for: r.property_for,
        propertyFor: r.property_for,
        sale_type: r.sale_type,
        saleType: r.sale_type,
        availability: r.availability,
        approvingAuthority: r.approving_authority,
        ownership: r.ownership,
        rera_status: r.rera_status,
        reraStatus: r.rera_status,
        rera_number: r.rera_number,
        reraNumber: r.rera_number,
        floors: r.no_of_floors,
        no_of_floors: r.no_of_floors,
        property_on_floor: r.property_on_floor,
        propertyOnFloor: r.property_on_floor,
        furnishing_status: r.furnishing_status,
        furnishingStatus: r.furnishing_status,
        facing: r.facing,
        flooring_type: r.flooring_type,
        flooringType: r.flooring_type,
        age_years: r.age_years,
        ageYears: r.age_years,
        expected_price: r.expected_price,
        price: r.expected_price,
        built_up_area: r.built_up_area,
        area: r.built_up_area,
        area_unit: r.area_unit,
        areaUnit: r.area_unit,
        carpet_area: r.carpet_area,
        carpetArea: r.carpet_area,
        carpet_area_unit: r.carpet_area_unit,
        carpetAreaUnit: r.carpet_area_unit,
        super_area: r.super_area,
        superArea: r.super_area,
        super_area_unit: r.super_area_unit,
        superAreaUnit: r.super_area_unit,
        num_bedrooms: r.num_bedrooms,
        bedrooms: r.num_bedrooms,
        num_bathrooms: r.num_bathrooms,
        bathrooms: r.num_bathrooms,
        booking_amount: r.booking_amount,
        bookingAmount: r.booking_amount,
        maintenance_charges: r.maintenance_charges,
        maintenanceCharges: r.maintenance_charges,
        possession_by: r.possession_by,
        possessionBy: r.possession_by,
        description: r.description,
        city: r.city,
        state: r.state,
        locality: r.locality,
        sub_locality: r.sub_locality,
        subLocality: r.sub_locality,
        address: r.address,
        image: image || null,
        image_url: imageUrl || null,
        primary_image: primaryImage || null,
        media: media || [],
        status: r.status || 'active',
        created_at: r.created_at ? new Date(r.created_at).toISOString() : null,
        createdAt: r.created_at ? new Date(r.created_at).toISOString() : null,
        features: features,
        amenities: amenities,
        highlights: highlights,
        nearby_landmarks: nearby_landmarks,
        additional_rooms: additional_rooms
      };
    }));
    
    return propertiesWithMedia;
  } catch (err) {
    console.error('[fetchBrokerAndProperties] Error:', err);
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
    const properties = tenantDb ? await fetchBrokerAndProperties(tenantDb, req) : [];
    const nav = { home: '?page=home', properties: '?page=properties', about: '?page=about', contact: '?page=contact' };
    const context = buildSiteContext({ broker, properties, page: view, nav });
    const html = await ejs.renderFile(viewPath, context, { async: true, root: getTemplatesRoot() });
    return res.set('Content-Type', 'text/html').send(html);
  } catch (err) {
    const isProd = process.env.NODE_ENV === 'production';
    return res.status(500).send(isProd ? 'Server error' : String(err?.message || err));
  }
}

// JSON context for preview (frontend-rendered)
export async function getPreviewContext(req, res) {
  try {
    const template = (req.params.template || '').toString();
    const user = req.user || null;
    const tenantDb = user?.tenant_db || '';
    // basic owner object (broker or company)
    const owner = user ? { 
      id: user.id, 
      full_name: user.role === 'company' ? (user.companyName || user.name || user.full_name || 'Company') : (user.name || user.full_name || 'Broker'), 
      email: user.email, 
      tenant_db: user.tenant_db 
    } : null;
    const properties = tenantDb ? await fetchBrokerAndProperties(tenantDb, req) : [];
    return res.json({ site: { title: owner?.full_name ? `${owner.full_name} Real Estate` : 'Real Estate', broker: owner, template }, properties });
  } catch (err) {
    const isProd = process.env.NODE_ENV === 'production';
    return res.status(500).json({ message: 'Server error', error: isProd ? undefined : String(err?.message || err) });
  }
}

export async function publishTemplateAsSite(req, res) {
  try {
    const template = (req.body?.template || '').toString();
    const siteTitle = (req.body?.siteTitle || '').toString();
    if (!template) return res.status(400).json({ message: 'template is required' });
    if (!req.user || (req.user.role !== 'broker' && req.user.role !== 'company')) return res.status(403).json({ message: 'Forbidden' });
    
    let slug;
    let site;
    if (req.user.role === 'company') {
      // Use a stable slug per company so it replaces previous site
      const companyName = req.user.companyName || req.user.name || req.user.full_name || 'company';
      slug = generateStableCompanySlug({ companyName, companyId: req.user.id });
      site = publishSite({ slug, companyId: req.user.id, ownerType: 'company', template, siteTitle });
    } else {
      // Use a stable slug per broker so it replaces previous site
      const brokerName = req.user.name || req.user.full_name || 'broker';
      slug = generateStableBrokerSlug({ brokerName, brokerId: req.user.id });
      site = publishSite({ slug, brokerId: req.user.id, ownerType: 'broker', template, siteTitle });
    }
    
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
    if (!req.user || (req.user.role !== 'broker' && req.user.role !== 'company')) return res.status(403).json({ message: 'Forbidden' });
    const sites = req.user.role === 'company' 
      ? listPublishedSitesForCompany(req.user.id)
      : listPublishedSitesForBroker(req.user.id);
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
    const view = (req.params.page || 'home').toString();
    const site = getSiteBySlug(slug);
    if (!site) return res.status(404).send('Site not found');
    const viewPath = getTemplateViewPath(site.template, view);
    if (!fs.existsSync(viewPath)) return res.status(404).send('Page not found');
    // Look up owner (broker or company) name/email and tenant_db to pull properties
    const ownerType = site.ownerType || 'broker'; // default to broker for backward compatibility
    let owner = { id: ownerType === 'company' ? site.companyId : site.brokerId, full_name: site.siteTitle || (ownerType === 'company' ? 'Company Site' : 'Broker Site') };
    let properties = [];
    try {
      if (ownerType === 'company') {
        const [rows] = await pool.query('SELECT id, name, email, phone, photo, tenant_db FROM companies WHERE id = ? LIMIT 1', [site.companyId]);
        const row = rows?.[0];
        if (row) {
          owner = { id: row.id, full_name: row.name || owner.full_name, email: row.email, phone: row.phone, photo: row.photo, tenant_db: row.tenant_db };
          if (row.tenant_db) {
            properties = await fetchBrokerAndProperties(row.tenant_db, req);
          }
        }
      } else {
        const [rows] = await pool.query('SELECT id, full_name, email, phone, photo, tenant_db FROM brokers WHERE id = ? LIMIT 1', [site.brokerId]);
        const row = rows?.[0];
        if (row) {
          owner = { id: row.id, full_name: row.full_name || owner.full_name, email: row.email, phone: row.phone, photo: row.photo, tenant_db: row.tenant_db };
          if (row.tenant_db) {
            properties = await fetchBrokerAndProperties(row.tenant_db, req);
          }
        }
      }
    } catch {}
    const nav = { home: `/site/${slug}`, properties: `/site/${slug}/properties`, about: `/site/${slug}/about`, contact: `/site/${slug}/contact` };
    const context = buildSiteContext({ broker: owner, properties, page: view, nav });
    const html = await ejs.renderFile(viewPath, context, { async: true, root: getTemplatesRoot() });
    return res.set('Content-Type', 'text/html').send(html);
  } catch (err) {
    const isProd = process.env.NODE_ENV === 'production';
    return res.status(500).send(isProd ? 'Server error' : String(err?.message || err));
  }
}

// JSON context for frontend templates (broker/company + properties)
export async function getSiteContext(req, res) {
  try {
    const slug = (req.params.slug || '').toString();
    const site = getSiteBySlug(slug);
    if (!site) return res.status(404).json({ message: 'Site not found' });
    
    const ownerType = site.ownerType || 'broker';
    let owner = { id: ownerType === 'company' ? site.companyId : site.brokerId, full_name: site.siteTitle || (ownerType === 'company' ? 'Company Site' : 'Broker Site') };
    let properties = [];
    let tenantDb = null;
    
    try {
      if (ownerType === 'company') {
        const [rows] = await pool.query('SELECT id, name, email, phone, photo, tenant_db FROM companies WHERE id = ? LIMIT 1', [site.companyId]);
        const row = rows?.[0];
        if (row) {
          owner = { id: row.id, full_name: row.name || owner.full_name, email: row.email, phone: row.phone, photo: row.photo, tenant_db: row.tenant_db };
          tenantDb = row.tenant_db;
          if (row.tenant_db) {
            properties = await fetchBrokerAndProperties(row.tenant_db, req);
          }
        }
      } else {
        const [rows] = await pool.query('SELECT id, full_name, email, phone, photo, tenant_db FROM brokers WHERE id = ? LIMIT 1', [site.brokerId]);
        const row = rows?.[0];
        if (row) {
          owner = { id: row.id, full_name: row.full_name || owner.full_name, email: row.email, phone: row.phone, photo: row.photo, tenant_db: row.tenant_db };
          tenantDb = row.tenant_db;
          if (row.tenant_db) {
            properties = await fetchBrokerAndProperties(row.tenant_db, req);
          }
        }
      }
    } catch (err) {
      console.error('getSiteContext error fetching owner:', err);
    }
    
    return res.json({ 
      site: { 
        ...site, 
        broker: owner, 
        tenant_db: tenantDb 
      }, 
      properties 
    });
  } catch (err) {
    const isProd = process.env.NODE_ENV === 'production';
    return res.status(500).json({ message: 'Server error', error: isProd ? undefined : String(err?.message || err) });
  }
}


// Site context by custom domain (Host header) for SPA clean URLs
export async function getDomainSiteContext(req, res) {
  try {
    const override = (req.query.host || req.query.domain || req.headers['x-site-host'] || '').toString().split(',')[0].trim();
    const host = (override || req.headers['x-forwarded-host'] || req.headers.host || '').toString().split(',')[0].trim();
    const site = getSiteByDomain(host);
    if (!site) return res.status(404).json({ message: 'Site not found' });
    const ownerType = site.ownerType || 'broker';
    let owner = { id: ownerType === 'company' ? site.companyId : site.brokerId, full_name: site.siteTitle || (ownerType === 'company' ? 'Company Site' : 'Broker Site') };
    let properties = [];
    let tenantDb = null;
    
    try {
      if (ownerType === 'company') {
        const [rows] = await pool.query('SELECT id, name, email, phone, photo, tenant_db FROM companies WHERE id = ? LIMIT 1', [site.companyId]);
        const row = rows?.[0];
        if (row) {
          owner = { id: row.id, full_name: row.name || owner.full_name, email: row.email, phone: row.phone, photo: row.photo, tenant_db: row.tenant_db };
          tenantDb = row.tenant_db;
          if (row.tenant_db) {
            properties = await fetchBrokerAndProperties(row.tenant_db, req);
          }
        }
      } else {
        const [rows] = await pool.query('SELECT id, full_name, email, phone, photo, tenant_db FROM brokers WHERE id = ? LIMIT 1', [site.brokerId]);
        const row = rows?.[0];
        if (row) {
          owner = { id: row.id, full_name: row.full_name || owner.full_name, email: row.email, phone: row.phone, photo: row.photo, tenant_db: row.tenant_db };
          tenantDb = row.tenant_db;
          if (row.tenant_db) {
            properties = await fetchBrokerAndProperties(row.tenant_db, req);
          }
        }
      }
    } catch (err) {
      console.error('getDomainSiteContext error fetching owner:', err);
    }
    
    return res.json({ 
      site: { 
        ...site, 
        broker: owner, 
        tenant_db: tenantDb,
        title: owner?.full_name ? `${owner.full_name} Real Estate` : 'Real Estate' 
      }, 
      properties, 
      slug: site.slug, 
      template: site.template 
    });
  } catch (err) {
    const isProd = process.env.NODE_ENV === 'production';
    return res.status(500).json({ message: 'Server error', error: isProd ? undefined : String(err?.message || err) });
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
    if (!req.user || (req.user.role !== 'broker' && req.user.role !== 'company')) return res.status(403).json({ message: 'Forbidden' });
    const slug = (req.body?.slug || '').toString();
    const domain = (req.body?.domain || '').toString();
    if (!slug) return res.status(400).json({ message: 'slug is required' });
    if (!domain) return res.status(400).json({ message: 'domain is required' });
    const site = getSiteBySlug(slug);
    if (!site) return res.status(404).json({ message: 'Site not found' });
    // Verify ownership
    const siteOwnerType = site.ownerType || 'broker'; // default to broker for backward compatibility
    const siteOwnerId = siteOwnerType === 'company' ? site.companyId : site.brokerId;
    if (String(siteOwnerId) !== String(req.user.id) || siteOwnerType !== req.user.role) {
      return res.status(403).json({ message: 'Forbidden' });
    }
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


