import pool from '../config/database.js';
import { getTenantPool, ensureTenantLeadsTableExists } from '../utils/tenant.js';
import { notifySuperAdmin, notifyBroker } from '../utils/notifications.js';

function getTenantDb(req) {
  const fromUser = req.user && req.user.tenant_db ? req.user.tenant_db : null;
  const header = req.headers['x-tenant-db'] || req.headers['x-tenant'] || null;
  const tenantDb = (fromUser || header || '').toString();
  return tenantDb;
}

export async function listProperties(req, res) {
  try {
    const tenantDb = getTenantDb(req);
    if (!tenantDb) return res.status(400).json({ message: 'Missing tenant' });

    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const offset = (page - 1) * limit;

    const where = [];
    const params = [];
    const q = (req.query.q || '').toString().trim();
    if (q) {
      where.push('(p.city LIKE ? OR p.locality LIKE ? OR p.sub_locality LIKE ? OR p.address LIKE ? OR p.title LIKE ?)');
      params.push(`%${q}%`, `%${q}%`, `%${q}%`, `%${q}%`, `%${q}%`);
    }
    const building_type = (req.query.building_type || '').toString();
    if (building_type) { where.push('p.building_type = ?'); params.push(building_type); }
    const property_type = (req.query.property_type || '').toString();
    if (property_type) { where.push('p.property_type = ?'); params.push(property_type); }
    const city = (req.query.city || '').toString();
    if (city) { where.push('p.city = ?'); params.push(city); }
    const status = (req.query.status || '').toString();
    if (status) { where.push('p.status = ?'); params.push(status); }

    // Date range filtering
    const from = (req.query.from || '').toString().trim();
    const to = (req.query.to || '').toString().trim();
    const month = (req.query.month || '').toString().trim();
    const year = (req.query.year || '').toString().trim();
    
    if (from) {
      where.push('DATE(p.created_at) >= ?');
      params.push(from);
    }
    if (to) {
      where.push('DATE(p.created_at) <= ?');
      params.push(to);
    }
    if (month && !from && !to) {
      // Format: YYYY-MM
      const [yearPart, monthPart] = month.split('-');
      if (yearPart && monthPart) {
        const yearNum = parseInt(yearPart, 10);
        const monthNum = parseInt(monthPart, 10);
        if (Number.isFinite(yearNum) && Number.isFinite(monthNum) && monthNum >= 1 && monthNum <= 12) {
          const startDate = `${yearNum}-${String(monthNum).padStart(2, '0')}-01`;
          // Get last day of month
          const lastDay = new Date(yearNum, monthNum, 0).getDate();
          const endDate = `${yearNum}-${String(monthNum).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
          where.push('DATE(p.created_at) >= ? AND DATE(p.created_at) <= ?');
          params.push(startDate, endDate);
        }
      }
    }
    if (year && !month && !from && !to) {
      const startDate = `${year}-01-01`;
      const endDate = `${year}-12-31`;
      where.push('DATE(p.created_at) >= ? AND DATE(p.created_at) <= ?');
      params.push(startDate, endDate);
    }

    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';

    const tenantPool = await getTenantPool(tenantDb);
    const [rows] = await tenantPool.query(
      `SELECT p.id, p.title, p.city, p.state, p.locality, p.address, p.property_type, p.building_type,
              p.property_for, p.status,
              pf.expected_price, pf.built_up_area, pf.area_unit, p.created_at,
              (SELECT pm.file_url FROM property_media pm 
               WHERE pm.property_id = p.id 
               ORDER BY pm.is_primary DESC, pm.id ASC 
               LIMIT 1) as primary_image
       FROM properties p
       LEFT JOIN property_features pf ON pf.property_id = p.id
       ${whereSql}
       ORDER BY p.id DESC
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );
    const [countRows] = await tenantPool.query(`SELECT COUNT(*) as total FROM properties p ${whereSql}`, params);
    return res.json({ data: rows, meta: { page, limit, total: countRows[0]?.total || 0 } });
  } catch (err) {
    const isProd = process.env.NODE_ENV === 'production';
    return res.status(500).json({ message: 'Server error', error: isProd ? undefined : String(err?.message || err) });
  }
}

export async function getPropertyById(req, res) {
  try {
    const tenantDb = getTenantDb(req);
    if (!tenantDb) return res.status(400).json({ message: 'Missing tenant' });
    const id = parseInt(req.params.id, 10);
    if (!id) return res.status(400).json({ message: 'Invalid id' });
    const tenantPool = await getTenantPool(tenantDb);

    const [[property]] = await Promise.all([
      tenantPool.query('SELECT * FROM properties WHERE id = ? LIMIT 1', [id])
    ]);
    const p = property?.[0];
    if (!p) return res.status(404).json({ message: 'Not found' });

    const [features] = await tenantPool.query('SELECT * FROM property_features WHERE property_id = ? LIMIT 1', [id]);
    const [media] = await tenantPool.query('SELECT * FROM property_media WHERE property_id = ? ORDER BY id', [id]);
    const [highlights] = await tenantPool.query('SELECT * FROM property_highlights WHERE property_id = ? LIMIT 1', [id]);
    const [amenities] = await tenantPool.query('SELECT * FROM property_amenities WHERE property_id = ? LIMIT 1', [id]);
    const [landmarks] = await tenantPool.query('SELECT * FROM property_landmarks WHERE property_id = ? LIMIT 1', [id]);

    return res.json({ data: { ...p, features: features?.[0] || null, media, highlights: highlights?.[0]?.highlights || [], amenities: amenities?.[0]?.amenities || [], nearby_landmarks: landmarks?.[0]?.nearby_landmarks || [] } });
  } catch (err) {
    const isProd = process.env.NODE_ENV === 'production';
    return res.status(500).json({ message: 'Server error', error: isProd ? undefined : String(err?.message || err) });
  }
}

export async function getFeaturedProperties(req, res) {
  try {
    const tenantDb = getTenantDb(req);
    if (!tenantDb) {
      return res.status(400).json({ 
        message: 'Missing tenant database identifier. Please provide x-tenant-db header or ensure you are authenticated.' 
      });
    }

    const limit = Math.min(20, Math.max(1, parseInt(req.query.limit, 10) || 8));
    const tenantPool = await getTenantPool(tenantDb);
    const baseUrl = process.env.API_BASE_URL || req.protocol + '://' + req.get('host');

    // Fetch properties with highest price (featured = highest priced properties)
    const [rows] = await tenantPool.query(
      `SELECT p.id, p.title, p.city, p.state, p.locality, p.sub_locality, p.address, 
              p.property_type, p.building_type, p.property_for, p.status,
              p.description, p.created_at,
              pf.expected_price, pf.built_up_area, pf.area_unit, pf.carpet_area, pf.carpet_area_unit,
              pf.super_area, pf.super_area_unit, pf.num_bedrooms, pf.num_bathrooms,
              pf.sale_type, pf.availability, pf.furnishing_status, pf.facing
       FROM properties p
       LEFT JOIN property_features pf ON pf.property_id = p.id
       WHERE p.status = 'active' AND pf.expected_price IS NOT NULL AND pf.expected_price > 0
       ORDER BY pf.expected_price DESC
       LIMIT ?`,
      [limit]
    );

    // Fetch media for each property
    const propertiesWithMedia = await Promise.all(
      rows.map(async (r) => {
        let image_url = null;
        let primary_image = null;
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
            
            const primary = media.find(m => m.is_primary) || media[0];
            if (primary) {
              image_url = primary.file_url;
              primary_image = primary.file_url;
            }
          }
        } catch (mediaErr) {
          console.error(`Error fetching media for property ${r.id}:`, mediaErr);
        }

        return {
          ...r,
          image_url,
          primary_image,
          image: image_url,
          media,
          price: r.expected_price,
          area: r.built_up_area,
          areaUnit: r.area_unit,
          type: r.property_type
        };
      })
    );

    return res.json({ data: propertiesWithMedia });
  } catch (err) {
    const isProd = process.env.NODE_ENV === 'production';
    return res.status(500).json({ message: 'Server error', error: isProd ? undefined : String(err?.message || err) });
  }
}

export async function getPropertyFilters(req, res) {
  try {
    const tenantDb = getTenantDb(req);
    if (!tenantDb) return res.status(400).json({ message: 'Missing tenant' });

    const tenantPool = await getTenantPool(tenantDb);

    // Debug: Check total properties first
    const [totalCheck] = await tenantPool.query(`SELECT COUNT(*) as total FROM properties`);
    const [activeCheck] = await tenantPool.query(`SELECT COUNT(*) as active FROM properties WHERE status = 'active'`);
    const [nullStatusCheck] = await tenantPool.query(`SELECT COUNT(*) as null_status FROM properties WHERE status IS NULL OR status = ''`);
    const [withCity] = await tenantPool.query(`SELECT COUNT(*) as with_city FROM properties WHERE city IS NOT NULL AND city != ''`);
    const [withType] = await tenantPool.query(`SELECT COUNT(*) as with_type FROM properties WHERE property_type IS NOT NULL AND property_type != ''`);
    console.log(`[getPropertyFilters] Tenant: ${tenantDb}, Total: ${totalCheck[0]?.total || 0}, Active: ${activeCheck[0]?.active || 0}, Null/Empty Status: ${nullStatusCheck[0]?.null_status || 0}, With City: ${withCity[0]?.with_city || 0}, With Type: ${withType[0]?.with_type || 0}`);

    // Get unique cities with count - show all properties (not just active) for filters
    const [cities] = await tenantPool.query(
      `SELECT city, COUNT(*) as count 
       FROM properties 
       WHERE city IS NOT NULL AND city != ''
       GROUP BY city 
       ORDER BY count DESC, city ASC`
    );

    // Get unique property types with count
    const [propertyTypes] = await tenantPool.query(
      `SELECT property_type, COUNT(*) as count 
       FROM properties 
       WHERE property_type IS NOT NULL AND property_type != ''
       GROUP BY property_type 
       ORDER BY count DESC, property_type ASC`
    );

    // Get unique localities with count
    const [localities] = await tenantPool.query(
      `SELECT locality, COUNT(*) as count 
       FROM properties 
       WHERE locality IS NOT NULL AND locality != ''
       GROUP BY locality 
       ORDER BY count DESC, locality ASC
       LIMIT 100`
    );

    return res.json({
      data: {
        cities: cities.map(c => ({ value: c.city, label: c.city, count: c.count })),
        propertyTypes: propertyTypes.map(pt => ({ 
          value: pt.property_type, 
          label: pt.property_type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
          count: pt.count 
        })),
        localities: localities.map(l => ({ value: l.locality, label: l.locality, count: l.count }))
      }
    });
  } catch (err) {
    const isProd = process.env.NODE_ENV === 'production';
    return res.status(500).json({ message: 'Server error', error: isProd ? undefined : String(err?.message || err) });
  }
}

export async function searchPropertiesPublic(req, res) {
  try {
    const tenantDb = getTenantDb(req);
    if (!tenantDb) return res.status(400).json({ message: 'Missing tenant' });

    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const offset = (page - 1) * limit;

    // Build WHERE conditions
    const where = [];
    const params = [];

    // Status filter - show all properties except 'inactive' and 'deleted'
    // This includes: 'active', NULL, empty string, or any other status
    where.push('(p.status IS NULL OR p.status NOT IN (?, ?))');
    params.push('inactive', 'deleted');

    // Property_for filter - handle multiple possible values with case-insensitive matching
    const property_for = (req.query.property_for || '').toString().toLowerCase().trim();
    if (property_for) {
      if (property_for === 'sale') {
        // When user selects "Buy", search for: sale, buy, purchase, sell (case-insensitive)
        where.push('LOWER(TRIM(p.property_for)) IN (?, ?, ?, ?)');
        params.push('sale', 'buy', 'purchase', 'sell');
      } else if (property_for === 'rent') {
        // When user selects "Rent", search for: rent, rental, lease (case-insensitive)
        where.push('LOWER(TRIM(p.property_for)) IN (?, ?, ?)');
        params.push('rent', 'rental', 'lease');
      } else {
        // For any other value, do case-insensitive match
        where.push('LOWER(TRIM(p.property_for)) = LOWER(TRIM(?))');
        params.push(property_for);
      }
    }

    const property_type = (req.query.property_type || '').toString();
    if (property_type) { where.push('p.property_type = ?'); params.push(property_type); }

    const city = (req.query.city || '').toString();
    if (city) { where.push('p.city = ?'); params.push(city); }

    const locality = (req.query.locality || '').toString();
    if (locality) { where.push('p.locality LIKE ?'); params.push(`%${locality}%`); }

    // General text search query parameter (searches across title, city, locality, address, state)
    const q = (req.query.q || '').toString().trim();
    if (q) {
      where.push('(p.title LIKE ? OR p.city LIKE ? OR p.locality LIKE ? OR p.sub_locality LIKE ? OR p.address LIKE ? OR p.state LIKE ?)');
      params.push(`%${q}%`, `%${q}%`, `%${q}%`, `%${q}%`, `%${q}%`, `%${q}%`);
    }

    const minPrice = parseFloat(req.query.min_price);
    if (!isNaN(minPrice) && minPrice > 0) { 
      where.push('pf.expected_price >= ?'); 
      params.push(minPrice); 
    }

    const maxPrice = parseFloat(req.query.max_price);
    if (!isNaN(maxPrice) && maxPrice > 0) { 
      where.push('pf.expected_price <= ?'); 
      params.push(maxPrice); 
    }

    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';

    const tenantPool = await getTenantPool(tenantDb);
    const baseUrl = process.env.API_BASE_URL || req.protocol + '://' + req.get('host');

    const [rows] = await tenantPool.query(
      `SELECT p.id, p.title, p.city, p.state, p.locality, p.sub_locality, p.address, 
              p.property_type, p.building_type, p.property_for, p.status,
              p.description, p.created_at,
              pf.expected_price, pf.built_up_area, pf.area_unit, pf.carpet_area, pf.carpet_area_unit,
              pf.super_area, pf.super_area_unit, pf.num_bedrooms, pf.num_bathrooms,
              pf.sale_type, pf.availability, pf.furnishing_status, pf.facing
       FROM properties p
       LEFT JOIN property_features pf ON pf.property_id = p.id
       ${whereSql}
       ORDER BY p.id DESC
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    const [countRows] = await tenantPool.query(`SELECT COUNT(*) as total FROM properties p LEFT JOIN property_features pf ON pf.property_id = p.id ${whereSql}`, params);
    
    // Debug logging - check what's actually in the database
    const [propertyForCheck] = await tenantPool.query(`SELECT DISTINCT property_for, COUNT(*) as count FROM properties GROUP BY property_for ORDER BY count DESC`);
    const [statusCheck] = await tenantPool.query(`SELECT DISTINCT status, COUNT(*) as count FROM properties GROUP BY status`);
    const [totalProps] = await tenantPool.query(`SELECT COUNT(*) as total FROM properties`);
    
    console.log(`[searchPropertiesPublic] Tenant: ${tenantDb}`);
    console.log(`[searchPropertiesPublic] Filter applied: property_for="${property_for}"`);
    console.log(`[searchPropertiesPublic] WHERE SQL: ${whereSql}`);
    console.log(`[searchPropertiesPublic] WHERE Params:`, params);
    console.log(`[searchPropertiesPublic] Results: ${rows.length} properties found, Total matching: ${countRows[0]?.total || 0}`);
    console.log(`[searchPropertiesPublic] DB Stats - Total properties: ${totalProps[0]?.total || 0}`);
    console.log(`[searchPropertiesPublic] DB Stats - property_for values:`, propertyForCheck);
    console.log(`[searchPropertiesPublic] DB Stats - status values:`, statusCheck);

    // Fetch media for each property
    const propertiesWithMedia = await Promise.all(
      rows.map(async (r) => {
        let image_url = null;
        let primary_image = null;
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
            
            const primary = media.find(m => m.is_primary) || media[0];
            if (primary) {
              image_url = primary.file_url;
              primary_image = primary.file_url;
            }
          }
        } catch (mediaErr) {
          console.error(`Error fetching media for property ${r.id}:`, mediaErr);
        }

        return {
          ...r,
          image_url,
          primary_image,
          image: image_url,
          media,
          price: r.expected_price,
          area: r.built_up_area,
          areaUnit: r.area_unit,
          type: r.property_type
        };
      })
    );

    return res.json({ 
      data: propertiesWithMedia, 
      meta: { page, limit, total: countRows[0]?.total || 0 } 
    });
  } catch (err) {
    const isProd = process.env.NODE_ENV === 'production';
    return res.status(500).json({ message: 'Server error', error: isProd ? undefined : String(err?.message || err) });
  }
}

export async function createProperty(req, res) {
  try {
    const tenantDb = getTenantDb(req);
    if (!tenantDb) return res.status(400).json({ message: 'Missing tenant' });
    const body = req.body || {};
    // Normalize complex fields
    if (Array.isArray(body.additional_rooms)) {
      body.additional_rooms = JSON.stringify(body.additional_rooms);
    }
    const required = ['building_type','property_type','title','state','city'];
    for (const f of required) {
      if (body[f] === undefined || body[f] === null || body[f] === '') {
        return res.status(400).json({ message: `Missing field ${f}` });
      }
    }

    // Ensure an authenticated user exists and is present in tenant users table
    const userId = req.user?.id || 1; // use authenticated broker id or default seeded owner (id=1)
    const tenantPool = await getTenantPool(tenantDb);

    // Use transaction to ensure all-or-nothing
    const conn = await tenantPool.getConnection();
    try {
      await conn.beginTransaction();

      const cols = ['user_id','property_for','building_type','property_type','title','description','state','city','locality','sub_locality','society_name','address','status'];
      const placeholders = cols.map(() => '?');
      const params = cols.map((c) => body[c] ?? null);
      params[0] = userId; // enforce owner as authenticated user

      const [insertRes] = await conn.query(`INSERT INTO properties (${cols.join(',')}) VALUES (${placeholders.join(',')})`, params);
      const newId = insertRes.insertId;
      
      // Seed related tables so forms have records immediately
      await conn.query('INSERT INTO property_features (property_id) VALUES (?)', [newId]);
      await conn.query('INSERT INTO property_highlights (property_id, highlights) VALUES (?, ?)', [newId, JSON.stringify([])]);
      await conn.query('INSERT INTO property_amenities (property_id, amenities) VALUES (?, ?)', [newId, JSON.stringify([])]);
      await conn.query('INSERT INTO property_landmarks (property_id, nearby_landmarks) VALUES (?, ?)', [newId, JSON.stringify([])]);
      
      await conn.commit();
      
      // Notify super admin
      try {
        const brokerName = req.user?.full_name || req.user?.name || 'Unknown Broker';
        const brokerEmail = req.user?.email || null;
        const brokerId = req.user?.id || null;
        await notifySuperAdmin({
          type: 'property_created',
          title: 'New property created',
          message: `${body.title || 'Untitled Property'} - ${body.city || ''}, ${body.state || ''}`,
          actorBrokerId: brokerId,
          actorBrokerName: brokerName,
          actorBrokerEmail: brokerEmail,
        });
      } catch (notifyErr) {
        // Non-blocking
      }
      
      // Notify broker
      try {
        await notifyBroker({
          tenantDb,
          type: 'property_created',
          title: 'Property Created Successfully',
          message: `Your property "${body.title || 'Untitled Property'}" has been created successfully in ${body.city || ''}, ${body.state || ''}`,
        });
      } catch (notifyErr) {
        // Non-blocking
      }
      return res.status(201).json({ id: newId });
    } catch (txErr) {
      await conn.rollback();
      throw txErr;
    } finally {
      conn.release();
    }
  } catch (err) {   
    const isProd = process.env.NODE_ENV === 'production';
    // Log full error on server for debugging
    // eslint-disable-next-line no-console
    console.error('createProperty error:', err);
    const payload = {
      message: 'Server error',
      error: String(err?.message || err)
    };
    if (!isProd && err?.stack) payload.stack = err.stack;
    if (err?.code) payload.code = err.code;
    return res.status(500).json(payload);
  }
}

export async function updateProperty(req, res) {
  try {
    const tenantDb = getTenantDb(req);
    if (!tenantDb) return res.status(400).json({ message: 'Missing tenant' });
    const id = parseInt(req.params.id, 10);
    if (!id) return res.status(400).json({ message: 'Invalid id' });
    const body = req.body || {};
    const allowed = ['property_for','building_type','property_type','title','description','state','city','locality','sub_locality','society_name','address','status','is_featured'];
    const updates = [];
    const params = [];
    for (const f of allowed) {
      if (body[f] !== undefined) { updates.push(`${f} = ?`); params.push(body[f]); }
    }
    if (!updates.length) return res.status(400).json({ message: 'No fields to update' });
    const tenantPool = await getTenantPool(tenantDb);
    params.push(id);
    await tenantPool.query(`UPDATE properties SET ${updates.join(', ')} WHERE id = ?`, params);
    // Notify super admin
    try {
      const [propRows] = await tenantPool.query('SELECT title, city, state FROM properties WHERE id = ? LIMIT 1', [id]);
      const prop = propRows?.[0];
      const brokerName = req.user?.full_name || req.user?.name || 'Unknown Broker';
      const brokerEmail = req.user?.email || null;
      const brokerId = req.user?.id || null;
      await notifySuperAdmin({
        type: 'property_updated',
        title: 'Property updated',
        message: `${prop?.title || 'Property'} #${id} - ${prop?.city || ''}, ${prop?.state || ''}`,
        actorBrokerId: brokerId,
        actorBrokerName: brokerName,
        actorBrokerEmail: brokerEmail,
      });
    } catch (notifyErr) {
      // Non-blocking
    }
    
    // Notify broker
    try {
      const [propRows] = await tenantPool.query('SELECT title, city, state FROM properties WHERE id = ? LIMIT 1', [id]);
      const prop = propRows?.[0];
      await notifyBroker({
        tenantDb,
        type: 'property_updated',
        title: 'Property Updated',
        message: `Property "${prop?.title || `#${id}`}" has been updated successfully`,
      });
    } catch (notifyErr) {
      // Non-blocking
    }
    return res.json({ message: 'Updated' });
  } catch (err) {
    const isProd = process.env.NODE_ENV === 'production';
    // eslint-disable-next-line no-console
    console.error('updateProperty error:', err);
    return res.status(500).json({ message: 'Server error', error: String(err?.message || err) });
  }
}

export async function upsertPropertyFeatures(req, res) {
  try {
    const tenantDb = getTenantDb(req);
    if (!tenantDb) return res.status(400).json({ message: 'Missing tenant' });
    const id = parseInt(req.params.id, 10);
    if (!id) return res.status(400).json({ message: 'Invalid id' });
    const body = req.body || {};
    // Normalize complex fields so each column maps to a single value
    if (Array.isArray(body.additional_rooms)) {
      body.additional_rooms = JSON.stringify(body.additional_rooms);
    } else if (body.additional_rooms && typeof body.additional_rooms !== 'string') {
      try { body.additional_rooms = JSON.stringify(body.additional_rooms); } catch { body.additional_rooms = String(body.additional_rooms); }
    }
    const cols = ['built_up_area','area_unit','carpet_area','carpet_area_unit','super_area','super_area_unit','expected_price','booking_amount','maintenance_charges','sale_type','no_of_floors','availability','possession_by','property_on_floor','furnishing_status','facing','flooring_type','age_years','additional_rooms','approving_authority','ownership','rera_status','rera_number','num_bedrooms','num_bathrooms','num_balconies'];
    const params = cols.map((c) => body[c] ?? null);
    const tenantPool = await getTenantPool(tenantDb);
    await tenantPool.query(
      `INSERT INTO property_features (property_id, ${cols.join(',')}) VALUES (?, ${cols.map(() => '?').join(',')})
       ON DUPLICATE KEY UPDATE ${cols.map((c) => `${c} = VALUES(${c})`).join(', ')}`,
      [id, ...params]
    );
    return res.json({ message: 'Features saved' });
  } catch (err) {
    const isProd = process.env.NODE_ENV === 'production';
    // eslint-disable-next-line no-console
    console.error('upsertPropertyFeatures error:', err);
    return res.status(500).json({ message: 'Server error', error: String(err?.message || err) });
  }
}

export async function setPropertyHighlights(req, res) {
  try {
    const tenantDb = getTenantDb(req);
    if (!tenantDb) return res.status(400).json({ message: 'Missing tenant' });
    const id = parseInt(req.params.id, 10);
    const highlights = Array.isArray(req.body?.highlights) ? req.body.highlights : [];
    const tenantPool = await getTenantPool(tenantDb);
    await tenantPool.query('INSERT INTO property_highlights (property_id, highlights) VALUES (?, ?) ON DUPLICATE KEY UPDATE highlights = VALUES(highlights)', [id, JSON.stringify(highlights)]);
    return res.json({ message: 'Highlights saved' });
  } catch (err) {
    const isProd = process.env.NODE_ENV === 'production';
    // eslint-disable-next-line no-console
    console.error('addPropertyMedia error:', err);
    return res.status(500).json({ message: 'Server error', error: String(err?.message || err) });
  }
}

export async function setPropertyAmenities(req, res) {
  try {
    const tenantDb = getTenantDb(req);
    if (!tenantDb) return res.status(400).json({ message: 'Missing tenant' });
    const id = parseInt(req.params.id, 10);
    const amenities = Array.isArray(req.body?.amenities) ? req.body.amenities : [];
    const tenantPool = await getTenantPool(tenantDb);
    await tenantPool.query('INSERT INTO property_amenities (property_id, amenities) VALUES (?, ?) ON DUPLICATE KEY UPDATE amenities = VALUES(amenities)', [id, JSON.stringify(amenities)]);
    return res.json({ message: 'Amenities saved' });
  } catch (err) {
    const isProd = process.env.NODE_ENV === 'production';
    // eslint-disable-next-line no-console
    console.error('deletePropertyMedia error:', err);
    return res.status(500).json({ message: 'Server error', error: String(err?.message || err) });
  }
}

export async function setPropertyLandmarks(req, res) {
  try {
    const tenantDb = getTenantDb(req);
    if (!tenantDb) return res.status(400).json({ message: 'Missing tenant' });
    const id = parseInt(req.params.id, 10);
    const nearby_landmarks = Array.isArray(req.body?.nearby_landmarks) ? req.body.nearby_landmarks : [];
    const tenantPool = await getTenantPool(tenantDb);
    await tenantPool.query('INSERT INTO property_landmarks (property_id, nearby_landmarks) VALUES (?, ?) ON DUPLICATE KEY UPDATE nearby_landmarks = VALUES(nearby_landmarks)', [id, JSON.stringify(nearby_landmarks)]);
    return res.json({ message: 'Landmarks saved' });
  } catch (err) {
    const isProd = process.env.NODE_ENV === 'production';
    // eslint-disable-next-line no-console
    console.error('setPrimaryPropertyMedia error:', err);
    return res.status(500).json({ message: 'Server error', error: String(err?.message || err) });
  }
}

export async function addPropertyMedia(req, res) {
  try {
    const tenantDb = getTenantDb(req);
    if (!tenantDb) return res.status(400).json({ message: 'Missing tenant' });
    const id = parseInt(req.params.id, 10);
    if (!id) return res.status(400).json({ message: 'Invalid id' });
    const file = req.file;
    if (!file || !file.filename) return res.status(400).json({ message: 'File is required' });
    const { media_type, category, caption } = req.body || {};
    const fileUrl = `/properties/${file.filename}`;
    const tenantPool = await getTenantPool(tenantDb);
    const [result] = await tenantPool.query(
      'INSERT INTO property_media (property_id, media_type, file_url, category, created_at) VALUES (?, ?, ?, ?, NOW())',
      [id, media_type || 'image', fileUrl, category || 'exterior']
    );
    if (caption) {
      // If you want to support captions, add a column later; for now ignore silently
    }
    return res.status(201).json({ id: result.insertId, file_url: fileUrl });
  } catch (err) {
    const isProd = process.env.NODE_ENV === 'production';
    // eslint-disable-next-line no-console
    console.error('getBrokerPropertyById error:', err);
    return res.status(500).json({ message: 'Server error', error: String(err?.message || err) });
  }
}

export async function addPropertyVideo(req, res) {
  try {
    const tenantDb = getTenantDb(req);
    if (!tenantDb) return res.status(400).json({ message: 'Missing tenant' });
    const id = parseInt(req.params.id, 10);
    if (!id) return res.status(400).json({ message: 'Invalid id' });
    const { url, category } = req.body || {};
    if (!url) return res.status(400).json({ message: 'Video url is required' });
    const tenantPool = await getTenantPool(tenantDb);
    const [result] = await tenantPool.query(
      'INSERT INTO property_media (property_id, media_type, file_url, category, created_at) VALUES (?, ?, ?, ?, NOW())',
      [id, 'video', url, category || 'video']
    );
    return res.status(201).json({ id: result.insertId, file_url: url });
  } catch (err) {
    const isProd = process.env.NODE_ENV === 'production';
    // eslint-disable-next-line no-console
    console.error('listProperties error:', err);
    return res.status(500).json({ message: 'Server error', error: String(err?.message || err) });
  }
}

export async function createPropertyFull(req, res) {
  let conn = null;
  try {
    const tenantDb = getTenantDb(req);
    if (!tenantDb) return res.status(400).json({ message: 'Missing tenant' });
    const userId = req.user?.id || 1;

    const body = req.body || {};
    const basic = body.basic || body.property || {};
    const features = body.features || {};
    const highlights = Array.isArray(body.highlights) ? body.highlights : [];
    const amenities = Array.isArray(body.amenities) ? body.amenities : [];
    const nearby = Array.isArray(body.nearby_landmarks) ? body.nearby_landmarks : [];

    // Validate required fields
    const required = ['building_type','property_type','title','state','city'];
    for (const f of required) {
      if (!basic[f] || (typeof basic[f] === 'string' && basic[f].trim() === '')) {
        return res.status(400).json({ message: `Missing required field: ${f}` });
      }
    }

    const tenantPool = await getTenantPool(tenantDb);
    conn = await tenantPool.getConnection();
    
    await conn.beginTransaction();

    try {
      // Insert base property
      const cols = ['user_id','property_for','building_type','property_type','title','description','state','city','locality','sub_locality','society_name','address','status'];
      const placeholders = cols.map(() => '?').join(',');
      const params = cols.map((c) => basic[c] ?? null);
      params[0] = userId;
      
      const [propRes] = await conn.query(`INSERT INTO properties (${cols.join(',')}) VALUES (${placeholders})`, params);
      const propertyId = propRes.insertId;

      if (!propertyId || propertyId <= 0) {
        throw new Error('Failed to create property: Invalid property ID returned');
      }

      // Insert features (normalize additional_rooms)
      const featureCols = ['built_up_area','area_unit','carpet_area','carpet_area_unit','super_area','super_area_unit','expected_price','booking_amount','maintenance_charges','sale_type','no_of_floors','availability','possession_by','property_on_floor','furnishing_status','facing','flooring_type','age_years','additional_rooms','approving_authority','ownership','rera_status','rera_number','num_bedrooms','num_bathrooms','num_balconies'];
      const featuresPayload = { ...features };
      if (Array.isArray(featuresPayload.additional_rooms)) {
        featuresPayload.additional_rooms = JSON.stringify(featuresPayload.additional_rooms);
      } else if (featuresPayload.additional_rooms && typeof featuresPayload.additional_rooms !== 'string') {
        try { 
          featuresPayload.additional_rooms = JSON.stringify(featuresPayload.additional_rooms); 
        } catch { 
          featuresPayload.additional_rooms = String(featuresPayload.additional_rooms); 
        }
      }
      
      // Always insert features row (even if empty) to maintain referential integrity
      if (featureCols.some((c) => featuresPayload[c] !== undefined && featuresPayload[c] !== null && featuresPayload[c] !== '')) {
        const fParams = featureCols.map((c) => featuresPayload[c] ?? null);
        await conn.query(
          `INSERT INTO property_features (property_id, ${featureCols.join(',')}) VALUES (?, ${featureCols.map(() => '?').join(',')})`,
          [propertyId, ...fParams]
        );
      } else {
        await conn.query('INSERT INTO property_features (property_id) VALUES (?)', [propertyId]);
      }

      // Highlights, amenities, landmarks - always insert to maintain referential integrity
      await conn.query(
        'INSERT INTO property_highlights (property_id, highlights) VALUES (?, ?) ON DUPLICATE KEY UPDATE highlights = VALUES(highlights)', 
        [propertyId, JSON.stringify(highlights)]
      );
      await conn.query(
        'INSERT INTO property_amenities (property_id, amenities) VALUES (?, ?) ON DUPLICATE KEY UPDATE amenities = VALUES(amenities)', 
        [propertyId, JSON.stringify(amenities)]
      );
      await conn.query(
        'INSERT INTO property_landmarks (property_id, nearby_landmarks) VALUES (?, ?) ON DUPLICATE KEY UPDATE nearby_landmarks = VALUES(nearby_landmarks)', 
        [propertyId, JSON.stringify(nearby)]
      );

      // Commit transaction only if all inserts succeed
      await conn.commit();
      return res.status(201).json({ id: propertyId });
    } catch (txErr) {
      // Rollback on any error within transaction
      if (conn) {
        try { 
          await conn.rollback(); 
          // eslint-disable-next-line no-console
          console.error('Transaction rolled back due to error:', txErr);
        } catch (rollbackErr) {
          // eslint-disable-next-line no-console
          console.error('Rollback failed:', rollbackErr);
        }
      }
      throw txErr;
    }
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('createPropertyFull error:', err);
    const errorMessage = err?.message || String(err);
    const isProd = process.env.NODE_ENV === 'production';
    return res.status(500).json({ 
      message: 'Failed to create property. No data was saved.', 
      error: isProd ? 'Internal server error' : errorMessage 
    });
  } finally {
    if (conn) {
      try {
        conn.release();
      } catch (releaseErr) {
        // eslint-disable-next-line no-console
        console.error('Connection release error:', releaseErr);
      }
    }
  }
}

export async function deletePropertyMedia(req, res) {
  try {
    const tenantDb = getTenantDb(req);
    if (!tenantDb) return res.status(400).json({ message: 'Missing tenant' });
    const mediaId = parseInt(req.params.mediaId, 10);
    if (!mediaId) return res.status(400).json({ message: 'Invalid media id' });
    const tenantPool = await getTenantPool(tenantDb);
    await tenantPool.query('DELETE FROM property_media WHERE id = ?', [mediaId]);
    return res.json({ message: 'Deleted' });
  } catch (err) {
    const isProd = process.env.NODE_ENV === 'production';
    return res.status(500).json({ message: 'Server error', error: isProd ? undefined : String(err?.message || err) });
  }
}

export async function setPrimaryPropertyMedia(req, res) {
  try {
    const tenantDb = getTenantDb(req);
    if (!tenantDb) return res.status(400).json({ message: 'Missing tenant' });
    const mediaId = parseInt(req.params.mediaId, 10);
    const propertyId = parseInt(req.params.id, 10);
    if (!mediaId || !propertyId) return res.status(400).json({ message: 'Invalid id' });
    const tenantPool = await getTenantPool(tenantDb);
    await tenantPool.query('UPDATE property_media SET is_primary = 0 WHERE property_id = ?', [propertyId]);
    await tenantPool.query('UPDATE property_media SET is_primary = 1 WHERE id = ?', [mediaId]);
    return res.json({ message: 'Primary set' });
  } catch (err) {
    const isProd = process.env.NODE_ENV === 'production';
    return res.status(500).json({ message: 'Server error', error: isProd ? undefined : String(err?.message || err) });
  }
}

export async function deleteProperty(req, res) {
  try {
    const tenantDb = getTenantDb(req);
    if (!tenantDb) return res.status(400).json({ message: 'Missing tenant' });
    const id = parseInt(req.params.id, 10);
    if (!id) return res.status(400).json({ message: 'Invalid id' });
    const tenantPool = await getTenantPool(tenantDb);
    // Get property info before deletion for notification
    let propTitle = `Property #${id}`;
    try {
      const [propRows] = await tenantPool.query('SELECT title FROM properties WHERE id = ? LIMIT 1', [id]);
      if (propRows?.[0]) propTitle = propRows[0].title || propTitle;
    } catch {}
    await tenantPool.query("UPDATE properties SET status = 'inactive' WHERE id = ?", [id]);
    // Notify super admin
    try {
      const brokerName = req.user?.full_name || req.user?.name || 'Unknown Broker';
      const brokerEmail = req.user?.email || null;
      const brokerId = req.user?.id || null;
      await notifySuperAdmin({
        type: 'property_deleted',
        title: 'Property deleted',
        message: `${propTitle} has been deactivated`,
        actorBrokerId: brokerId,
        actorBrokerName: brokerName,
        actorBrokerEmail: brokerEmail,
      });
    } catch (notifyErr) {
      // Non-blocking
    }
    
    // Notify broker
    try {
      await notifyBroker({
        tenantDb,
        type: 'property_deleted',
        title: 'Property Deactivated',
        message: `Property "${propTitle}" has been deactivated`,
      });
    } catch (notifyErr) {
      // Non-blocking
    }
    return res.json({ message: 'Deleted' });
  } catch (err) {
    const isProd = process.env.NODE_ENV === 'production';
    return res.status(500).json({ message: 'Server error', error: isProd ? undefined : String(err?.message || err) });
  }
}
// ========== Super Admin: cross-tenant property listing ==========
export async function listAllBrokerPropertiesAdmin(req, res) {
  try {
    // Remove limit or set it very high to return all properties (frontend will handle pagination)
    const limit = req.query.limit ? Math.max(1, Math.min(10000, parseInt(req.query.limit, 10))) : 10000;
    const [brokers] = await pool.query('SELECT id, full_name, tenant_db FROM brokers WHERE tenant_db IS NOT NULL');
    const [companies] = await pool.query('SELECT id, full_name, company_name, tenant_db FROM companies WHERE tenant_db IS NOT NULL');
    const out = [];
    for (const br of brokers) {
      try {
        const tenantPool = await getTenantPool(br.tenant_db);
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
           ORDER BY p.id DESC`
        );
        for (const r of rows) {
          // fetch first/primary image and all media
          let image = null;
          let imageUrl = null;
          let primaryImage = null;
          let media = [];
          const baseUrl = process.env.API_BASE_URL || req.protocol + '://' + req.get('host');
          try {
            const [mediaRows] = await tenantPool.query(
              'SELECT id, file_url, is_primary, category, media_type FROM property_media WHERE property_id = ? ORDER BY is_primary DESC, id ASC',
              [r.id]
            );
            console.log(`[listAllBrokerPropertiesAdmin] Property ${r.id} - Found ${mediaRows?.length || 0} media items`);
            if (mediaRows && mediaRows.length > 0) {
              media = mediaRows.map(m => {
                const fileUrl = m.file_url || '';
                // Ensure file_url starts with / if it's a relative path
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
              console.log(`[listAllBrokerPropertiesAdmin] Property ${r.id} - Primary image URL: ${primaryImage}`);
            } else {
              console.log(`[listAllBrokerPropertiesAdmin] Property ${r.id} - No media found`);
            }
          } catch (mediaErr) {
            console.error(`[listAllBrokerPropertiesAdmin] Error fetching media for property ${r.id}:`, mediaErr);
          }
          
          out.push({
            id: r.id,
            tenantDb: br.tenant_db,
            brokerId: br.id,
            brokerName: br.full_name,
            companyId: null,
            companyName: null,
            sourceType: 'broker',
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
          });
          console.log(`[listAllBrokerPropertiesAdmin] Property ${r.id} - Added to output with image: ${image || 'null'}, media count: ${media.length}`);
        }
      } catch (e) {
        // ignore tenant failures
      }
    }
    
    // Fetch company properties
    for (const comp of companies) {
      try {
        const tenantPool = await getTenantPool(comp.tenant_db);
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
           ORDER BY p.id DESC`
        );
        for (const r of rows) {
          // fetch first/primary image and all media
          let image = null;
          let imageUrl = null;
          let primaryImage = null;
          let media = [];
          const baseUrl = process.env.API_BASE_URL || req.protocol + '://' + req.get('host');
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
            // Ignore media errors
          }
          
          out.push({
            id: r.id,
            tenantDb: comp.tenant_db,
            brokerId: null,
            brokerName: null,
            companyId: comp.id,
            companyName: comp.company_name || comp.full_name,
            sourceType: 'company',
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
          });
        }
      } catch (e) {
        // ignore tenant failures
      }
    }
    out.sort((a, b) => {
      const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return bTime - aTime;
    });
    const sliced = out.slice(0, limit);
    console.log(`[listAllBrokerPropertiesAdmin] Returning ${sliced.length} properties. Sample property image fields:`, sliced[0] ? {
      id: sliced[0].id,
      image: sliced[0].image,
      image_url: sliced[0].image_url,
      primary_image: sliced[0].primary_image,
      media_count: sliced[0].media?.length || 0
    } : 'No properties');
    return res.json({ data: sliced, meta: { total: out.length, returned: sliced.length } });
  } catch (err) {
    return res.status(500).json({ message: 'Server error' });
  }
}

export async function getBrokerPropertyAdmin(req, res) {
  try {
    const brokerId = parseInt(req.params.brokerId, 10);
    const id = parseInt(req.params.id, 10);
    if (!brokerId || !id) return res.status(400).json({ message: 'Invalid id' });
    const [rows] = await pool.query('SELECT tenant_db, full_name FROM brokers WHERE id = ? LIMIT 1', [brokerId]);
    const br = rows?.[0];
    if (!br?.tenant_db) return res.status(404).json({ message: 'Broker or tenant not found' });
    const tenantPool = await getTenantPool(br.tenant_db);
    const [propRows] = await tenantPool.query('SELECT * FROM properties WHERE id = ? LIMIT 1', [id]);
    const p = propRows?.[0];
    if (!p) return res.status(404).json({ message: 'Not found' });
    let features = [];
    let media = [];
    let highlights = [];
    let amenities = [];
    let landmarks = [];
    try { const [r] = await tenantPool.query('SELECT * FROM property_features WHERE property_id = ? LIMIT 1', [id]); features = r; } catch {}
    try { const [r] = await tenantPool.query('SELECT * FROM property_media WHERE property_id = ? ORDER BY is_primary DESC, id', [id]); media = r; } catch {}
    try { const [r] = await tenantPool.query('SELECT * FROM property_highlights WHERE property_id = ? LIMIT 1', [id]); highlights = r; } catch {}
    try { const [r] = await tenantPool.query('SELECT * FROM property_amenities WHERE property_id = ? LIMIT 1', [id]); amenities = r; } catch {}
    try { const [r] = await tenantPool.query('SELECT * FROM property_landmarks WHERE property_id = ? LIMIT 1', [id]); landmarks = r; } catch {}
    return res.json({
      data: {
        ...p,
        features: features?.[0] || null,
        media,
        highlights: highlights?.[0]?.highlights || [],
        amenities: amenities?.[0]?.amenities || [],
        nearby_landmarks: landmarks?.[0]?.nearby_landmarks || [],
        brokerName: br.full_name,
      }
    });
  } catch (err) {
    return res.status(500).json({ message: 'Server error' });
  }
}

// Super Admin: Property statistics
export async function getSuperAdminPropertyStats(req, res) {
  try {
    const [brokers] = await pool.query('SELECT id, tenant_db FROM brokers WHERE tenant_db IS NOT NULL');
    const [companies] = await pool.query('SELECT id, tenant_db FROM companies WHERE tenant_db IS NOT NULL');
    let totalProperties = 0;
    let publishedProperties = 0;
    let highDemandProperties = 0;
    let newThisWeek = 0;
    let activeLeads = 0;
    
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);
    
    const oneWeekAgoStr = oneWeekAgo.toISOString().slice(0, 19).replace('T', ' ');
    const oneDayAgoStr = oneDayAgo.toISOString().slice(0, 19).replace('T', ' ');
    
    // Main leads (updated in last 24 hours)
    try {
      const [[mainLeads]] = await pool.query('SELECT COUNT(*) as count FROM leads WHERE updated_at >= ?', [oneDayAgoStr]);
      activeLeads += Number(mainLeads?.count || 0);
    } catch (e) {
      // Ignore if leads table doesn't exist
    }
    
    for (const broker of brokers) {
      if (!broker.tenant_db) continue;
      try {
        const tenantPool = await getTenantPool(broker.tenant_db);
        const [[total]] = await tenantPool.query('SELECT COUNT(*) as count FROM properties');
        totalProperties += Number(total?.count || 0);
        
        const [[published]] = await tenantPool.query('SELECT COUNT(*) as count FROM properties WHERE (status != ? AND status != ?) OR status IS NULL', ['inactive', 'sold']);
        publishedProperties += Number(published?.count || 0);
        
        const [[newWeek]] = await tenantPool.query('SELECT COUNT(*) as count FROM properties WHERE created_at >= ?', [oneWeekAgoStr]);
        newThisWeek += Number(newWeek?.count || 0);
        
        // High demand: properties updated in last 24 hours (most active)
        const [[highDemand]] = await tenantPool.query('SELECT COUNT(*) as count FROM properties WHERE updated_at >= ? AND (status = ? OR status IS NULL)', [oneDayAgoStr, 'active']);
        highDemandProperties += Number(highDemand?.count || 0);
        
        // Broker tenant leads (updated in last 24 hours)
        try {
          await ensureTenantLeadsTableExists(tenantPool);
          const [[leads]] = await tenantPool.query('SELECT COUNT(*) as count FROM leads WHERE updated_at >= ?', [oneDayAgoStr]);
          activeLeads += Number(leads?.count || 0);
        } catch (e) {
          // Ignore if leads table doesn't exist
        }
      } catch (e) {
        // Ignore tenant errors
      }
    }
    
    // Company properties
    for (const comp of companies) {
      if (!comp.tenant_db) continue;
      try {
        const tenantPool = await getTenantPool(comp.tenant_db);
        const [[total]] = await tenantPool.query('SELECT COUNT(*) as count FROM properties');
        totalProperties += Number(total?.count || 0);
        
        const [[published]] = await tenantPool.query('SELECT COUNT(*) as count FROM properties WHERE (status != ? AND status != ?) OR status IS NULL', ['inactive', 'sold']);
        publishedProperties += Number(published?.count || 0);
        
        const [[newWeek]] = await tenantPool.query('SELECT COUNT(*) as count FROM properties WHERE created_at >= ?', [oneWeekAgoStr]);
        newThisWeek += Number(newWeek?.count || 0);
        
        // High demand: properties updated in last 24 hours (most active)
        const [[highDemand]] = await tenantPool.query('SELECT COUNT(*) as count FROM properties WHERE updated_at >= ? AND (status = ? OR status IS NULL)', [oneDayAgoStr, 'active']);
        highDemandProperties += Number(highDemand?.count || 0);
        
        // Company tenant leads (updated in last 24 hours)
        try {
          await ensureTenantLeadsTableExists(tenantPool);
          const [[leads]] = await tenantPool.query('SELECT COUNT(*) as count FROM leads WHERE updated_at >= ?', [oneDayAgoStr]);
          activeLeads += Number(leads?.count || 0);
        } catch (e) {
          // Ignore if leads table doesn't exist
        }
      } catch (e) {
        // Ignore tenant errors
      }
    }
    
    return res.json({
      data: {
        totalProperties,
        publishedProperties,
        highDemandProperties,
        newThisWeek,
        activeLeads,
      }
    });
  } catch (err) {
    return res.status(500).json({ message: 'Server error' });
  }
}

// Broker: Property statistics
export async function getBrokerPropertyStats(req, res) {
  try {
    const tenantDb = req.user?.tenant_db;
    if (!tenantDb) return res.status(400).json({ message: 'Missing tenant' });
    
    const tenantPool = await getTenantPool(tenantDb);
    
    // Date filtering parameters
    const from = (req.query.from || '').toString().trim();
    const to = (req.query.to || '').toString().trim();
    const month = (req.query.month || '').toString().trim();
    const year = (req.query.year || '').toString().trim();
    
    // Build date filter conditions
    const dateWhere = [];
    const dateParams = [];
    
    if (from) {
      dateWhere.push('DATE(p.created_at) >= ?');
      dateParams.push(from);
    }
    if (to) {
      dateWhere.push('DATE(p.created_at) <= ?');
      dateParams.push(to);
    }
    if (month && !from && !to) {
      const [yearPart, monthPart] = month.split('-');
      if (yearPart && monthPart) {
        const yearNum = parseInt(yearPart, 10);
        const monthNum = parseInt(monthPart, 10);
        if (Number.isFinite(yearNum) && Number.isFinite(monthNum) && monthNum >= 1 && monthNum <= 12) {
          const startDate = `${yearNum}-${String(monthNum).padStart(2, '0')}-01`;
          const lastDay = new Date(yearNum, monthNum, 0).getDate();
          const endDate = `${yearNum}-${String(monthNum).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
          dateWhere.push('DATE(p.created_at) >= ? AND DATE(p.created_at) <= ?');
          dateParams.push(startDate, endDate);
        }
      }
    }
    if (year && !month && !from && !to) {
      const startDate = `${year}-01-01`;
      const endDate = `${year}-12-31`;
      dateWhere.push('DATE(p.created_at) >= ? AND DATE(p.created_at) <= ?');
      dateParams.push(startDate, endDate);
    }
    
    const dateFilterSql = dateWhere.length ? ` AND ${dateWhere.join(' AND ')}` : '';
    
    // Calculate date ranges for "New This Week" and "High Demand"
    // Always use last 7 days and last 24 hours, but filter by date range if provided
    const newWeekStartDate = new Date();
    newWeekStartDate.setDate(newWeekStartDate.getDate() - 7);
    const newWeekStartStr = newWeekStartDate.toISOString().slice(0, 19).replace('T', ' ');
    
    const highDemandStartDate = new Date();
    highDemandStartDate.setDate(highDemandStartDate.getDate() - 1);
    const highDemandStartStr = highDemandStartDate.toISOString().slice(0, 19).replace('T', ' ');
    
    // Build WHERE clauses - fix table alias references
    const dateWhereFixed = dateWhere.map(w => w.replace(/p\.created_at/g, 'created_at').replace(/p\.updated_at/g, 'updated_at'));
    
    // Total properties: filter by date range if provided
    const totalWhere = dateWhereFixed.length ? `WHERE ${dateWhereFixed.join(' AND ')}` : '';
    
    // Published: filter by status AND date range if provided
    const publishedWhere = dateWhereFixed.length 
      ? `WHERE ((status != ? AND status != ?) OR status IS NULL) AND ${dateWhereFixed.join(' AND ')}`
      : `WHERE (status != ? AND status != ?) OR status IS NULL`;
    const publishedParams = dateWhereFixed.length ? ['inactive', 'sold', ...dateParams] : ['inactive', 'sold'];
    
    // New This Week: created in last 7 days AND within date filter if provided
    // Convert date filter to use created_at instead of generic p.created_at
    const newWeekDateFilter = dateWhereFixed.length
      ? dateWhereFixed.map(c => c.replace(/updated_at/g, 'created_at')).join(' AND ')
      : '';
    const newWeekWhere = newWeekDateFilter
      ? `WHERE created_at >= ? AND ${newWeekDateFilter}`
      : 'WHERE created_at >= ?';
    const newWeekParams = newWeekDateFilter ? [newWeekStartStr, ...dateParams] : [newWeekStartStr];
    
    // High Demand: updated in last 24 hours AND within date filter if provided
    // Convert date filter to use updated_at
    const highDemandDateFilter = dateWhereFixed.length
      ? dateWhereFixed.map(c => c.replace(/created_at/g, 'updated_at')).join(' AND ')
      : '';
    const highDemandWhere = highDemandDateFilter
      ? `WHERE updated_at >= ? AND (status = ? OR status IS NULL) AND ${highDemandDateFilter}`
      : 'WHERE updated_at >= ? AND (status = ? OR status IS NULL)';
    const highDemandParams = highDemandDateFilter ? [highDemandStartStr, 'active', ...dateParams] : [highDemandStartStr, 'active'];
    
    // Active Leads: updated in last 24 hours AND within date filter if provided
    const leadsDateFilter = dateWhereFixed.length
      ? dateWhereFixed.map(c => c.replace(/created_at/g, 'updated_at')).join(' AND ')
      : '';
    const leadsWhere = leadsDateFilter
      ? `WHERE updated_at >= ? AND ${leadsDateFilter}`
      : 'WHERE updated_at >= ?';
    const leadsParams = leadsDateFilter ? [highDemandStartStr, ...dateParams] : [highDemandStartStr];
    
    const [[total]] = await tenantPool.query(`SELECT COUNT(*) as count FROM properties ${totalWhere}`, dateParams);
    const [[published]] = await tenantPool.query(`SELECT COUNT(*) as count FROM properties ${publishedWhere}`, publishedParams);
    const [[newWeek]] = await tenantPool.query(`SELECT COUNT(*) as count FROM properties ${newWeekWhere}`, newWeekParams);
    const [[highDemand]] = await tenantPool.query(`SELECT COUNT(*) as count FROM properties ${highDemandWhere}`, highDemandParams);
    
    // Active leads (updated in last 24 hours or within filter range)
    let activeLeads = 0;
    try {
      await ensureTenantLeadsTableExists(tenantPool);
      const [[leads]] = await tenantPool.query(`SELECT COUNT(*) as count FROM leads ${leadsWhere}`, leadsParams);
      activeLeads = Number(leads?.count || 0);
    } catch (e) {
      // If leads table doesn't exist, return 0
    }
    
    return res.json({
      data: {
        totalProperties: Number(total?.count || 0),
        publishedProperties: Number(published?.count || 0),
        highDemandProperties: Number(highDemand?.count || 0),
        newThisWeek: Number(newWeek?.count || 0),
        activeLeads,
      }
    });
  } catch (err) {
    return res.status(500).json({ message: 'Server error' });
  }
}

