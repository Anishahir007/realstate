import pool from '../config/database.js';
import { getTenantPool } from '../utils/tenant.js';
import { notifySuperAdmin } from '../utils/notifications.js';

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

    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';

    const tenantPool = await getTenantPool(tenantDb);
    const [rows] = await tenantPool.query(
      `SELECT p.id, p.title, p.city, p.state, p.locality, p.address, p.property_type, p.building_type,
              pf.expected_price, pf.built_up_area, pf.area_unit, p.created_at
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

    const cols = ['user_id','property_for','building_type','property_type','title','description','state','city','locality','sub_locality','society_name','address','status'];
    const placeholders = cols.map(() => '?');
    const params = cols.map((c) => body[c] ?? null);
    params[0] = userId; // enforce owner as authenticated user

    const [insertRes] = await tenantPool.query(`INSERT INTO properties (${cols.join(',')}) VALUES (${placeholders.join(',')})`, params);
    const newId = insertRes.insertId;
    // Seed related tables so forms have records immediately
    try {
      await tenantPool.query('INSERT INTO property_features (property_id) VALUES (?)', [newId]);
      await tenantPool.query('INSERT INTO property_highlights (property_id, highlights) VALUES (?, ?)', [newId, JSON.stringify([])]);
      await tenantPool.query('INSERT INTO property_amenities (property_id, amenities) VALUES (?, ?)', [newId, JSON.stringify([])]);
      await tenantPool.query('INSERT INTO property_landmarks (property_id, nearby_landmarks) VALUES (?, ?)', [newId, JSON.stringify([])]);
    } catch (seedErr) {
      // eslint-disable-next-line no-console
      console.warn('createProperty seed warning:', seedErr?.message || seedErr);
    }
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
    return res.status(201).json({ id: newId });
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
    const allowed = ['property_for','building_type','property_type','title','description','state','city','locality','sub_locality','society_name','address','status'];
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

    const required = ['building_type','property_type','title','state','city'];
    for (const f of required) {
      if (!basic[f]) return res.status(400).json({ message: `Missing field ${f}` });
    }

    const tenantPool = await getTenantPool(tenantDb);
    const conn = await tenantPool.getConnection();
    try {
      await conn.beginTransaction();

      // Insert base property
      const cols = ['user_id','property_for','building_type','property_type','title','description','state','city','locality','sub_locality','society_name','address','status'];
      const placeholders = cols.map(() => '?').join(',');
      const params = cols.map((c) => basic[c] ?? null);
      params[0] = userId;
      const [propRes] = await conn.query(`INSERT INTO properties (${cols.join(',')}) VALUES (${placeholders})`, params);
      const propertyId = propRes.insertId;

      // Insert features (normalize additional_rooms)
      const featureCols = ['built_up_area','area_unit','carpet_area','carpet_area_unit','super_area','super_area_unit','expected_price','booking_amount','maintenance_charges','sale_type','no_of_floors','availability','possession_by','property_on_floor','furnishing_status','facing','flooring_type','age_years','additional_rooms','approving_authority','ownership','rera_status','rera_number','num_bedrooms','num_bathrooms','num_balconies'];
      const featuresPayload = { ...features };
      if (Array.isArray(featuresPayload.additional_rooms)) {
        featuresPayload.additional_rooms = JSON.stringify(featuresPayload.additional_rooms);
      } else if (featuresPayload.additional_rooms && typeof featuresPayload.additional_rooms !== 'string') {
        try { featuresPayload.additional_rooms = JSON.stringify(featuresPayload.additional_rooms); } catch { featuresPayload.additional_rooms = String(featuresPayload.additional_rooms); }
      }
      if (featureCols.some((c) => featuresPayload[c] !== undefined && featuresPayload[c] !== null && featuresPayload[c] !== '')) {
        const fParams = featureCols.map((c) => featuresPayload[c] ?? null);
        await conn.query(
          `INSERT INTO property_features (property_id, ${featureCols.join(',')}) VALUES (?, ${featureCols.map(() => '?').join(',')})`,
          [propertyId, ...fParams]
        );
      } else {
        await conn.query('INSERT INTO property_features (property_id) VALUES (?)', [propertyId]);
      }

      // Highlights, amenities, landmarks
      await conn.query('INSERT INTO property_highlights (property_id, highlights) VALUES (?, ?) ON DUPLICATE KEY UPDATE highlights = VALUES(highlights)', [propertyId, JSON.stringify(highlights)]);
      await conn.query('INSERT INTO property_amenities (property_id, amenities) VALUES (?, ?) ON DUPLICATE KEY UPDATE amenities = VALUES(amenities)', [propertyId, JSON.stringify(amenities)]);
      await conn.query('INSERT INTO property_landmarks (property_id, nearby_landmarks) VALUES (?, ?) ON DUPLICATE KEY UPDATE nearby_landmarks = VALUES(nearby_landmarks)', [propertyId, JSON.stringify(nearby)]);

      await conn.commit();
      return res.status(201).json({ id: propertyId });
    } catch (txErr) {
      try { await conn.rollback(); } catch {}
      throw txErr;
    } finally {
      conn.release();
    }
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('createPropertyFull error:', err);
    return res.status(500).json({ message: 'Server error', error: String(err?.message || err) });
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
    return res.json({ message: 'Deleted' });
  } catch (err) {
    const isProd = process.env.NODE_ENV === 'production';
    return res.status(500).json({ message: 'Server error', error: isProd ? undefined : String(err?.message || err) });
  }
}

// ========== Super Admin: cross-tenant property listing ==========
export async function listAllBrokerPropertiesAdmin(req, res) {
  try {
    const limit = Math.max(1, Math.min(50, parseInt(req.query.limit, 10) || 10));
    const [brokers] = await pool.query('SELECT id, full_name, tenant_db FROM brokers WHERE tenant_db IS NOT NULL');
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
          // fetch first/primary image
          let image = null;
          try {
            const [m] = await tenantPool.query('SELECT file_url FROM property_media WHERE property_id = ? ORDER BY is_primary DESC, id ASC LIMIT 1', [r.id]);
            image = m?.[0]?.file_url || null;
          } catch {}
          out.push({
            id: r.id,
            tenantDb: br.tenant_db,
            brokerId: br.id,
            brokerName: br.full_name,
            title: r.title,
            type: r.property_type,
            buildingType: r.building_type,
            propertyFor: r.property_for,
            saleType: r.sale_type,
            availability: r.availability,
            approvingAuthority: r.approving_authority,
            ownership: r.ownership,
            reraStatus: r.rera_status,
            reraNumber: r.rera_number,
            floors: r.no_of_floors,
            propertyOnFloor: r.property_on_floor,
            furnishingStatus: r.furnishing_status,
            facing: r.facing,
            flooringType: r.flooring_type,
            ageYears: r.age_years,
            price: r.expected_price,
            area: r.built_up_area,
            areaUnit: r.area_unit,
            carpetArea: r.carpet_area,
            carpetAreaUnit: r.carpet_area_unit,
            superArea: r.super_area,
            superAreaUnit: r.super_area_unit,
            bedrooms: r.num_bedrooms,
            bathrooms: r.num_bathrooms,
            bookingAmount: r.booking_amount,
            maintenanceCharges: r.maintenance_charges,
            possessionBy: r.possession_by,
            description: r.description,
            city: r.city,
            state: r.state,
            locality: r.locality,
            subLocality: r.sub_locality,
            address: r.address,
            image,
            status: r.status || 'active',
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
