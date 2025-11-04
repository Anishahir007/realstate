import pool from '../config/database.js';
import { getTenantPool, ensureTenantLeadsTableExists } from '../utils/tenant.js';

// Super Admin: Search across brokers, properties (all tenants), and leads (all sources)
export async function superAdminSearch(req, res) {
  try {
    const query = (req.query.q || '').toString().trim();
    if (!query || query.length < 2) {
      return res.json({
        data: {
          brokers: [],
          properties: [],
          leads: [],
        },
        meta: { query, total: 0 },
      });
    }

    const searchTerm = `%${query}%`;
    const results = {
      brokers: [],
      properties: [],
      leads: [],
    };

    // Search brokers
    try {
      const [brokerRows] = await pool.query(
        `SELECT id, full_name, email, phone, photo, company_name, location, status, created_at
         FROM brokers
         WHERE full_name LIKE ? OR email LIKE ? OR phone LIKE ? OR company_name LIKE ? OR location LIKE ?
         ORDER BY id DESC
         LIMIT 10`,
        [searchTerm, searchTerm, searchTerm, searchTerm, searchTerm]
      );
      results.brokers = brokerRows.map(row => ({
        id: row.id,
        name: row.full_name,
        email: row.email,
        phone: row.phone,
        photo: row.photo,
        companyName: row.company_name,
        location: row.location,
        status: row.status,
        createdAt: row.created_at,
        type: 'broker',
      }));
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Broker search error:', err);
    }

    // Search properties across all tenants
    try {
      const [brokers] = await pool.query('SELECT id, full_name, tenant_db FROM brokers WHERE tenant_db IS NOT NULL');
      for (const broker of brokers) {
        if (!broker.tenant_db) continue;
        try {
          const tenantPool = await getTenantPool(broker.tenant_db);
          const [propRows] = await tenantPool.query(
            `SELECT p.id, p.title, p.city, p.state, p.locality, p.address, p.property_type, p.building_type, p.status,
                    pf.expected_price, pf.built_up_area, pf.area_unit, p.created_at,
                    (SELECT pm.file_url FROM property_media pm 
                     WHERE pm.property_id = p.id 
                     ORDER BY pm.is_primary DESC, pm.id ASC 
                     LIMIT 1) as primary_image
             FROM properties p
             LEFT JOIN property_features pf ON pf.property_id = p.id
             WHERE p.title LIKE ? OR p.city LIKE ? OR p.locality LIKE ? OR p.address LIKE ? OR p.state LIKE ?
             ORDER BY p.id DESC
             LIMIT 5`,
            [searchTerm, searchTerm, searchTerm, searchTerm, searchTerm]
          );
          for (const prop of propRows) {
            results.properties.push({
              id: prop.id,
              brokerId: broker.id,
              brokerName: broker.full_name,
              tenantDb: broker.tenant_db,
              title: prop.title,
              city: prop.city,
              state: prop.state,
              locality: prop.locality,
              address: prop.address,
              propertyType: prop.property_type,
              buildingType: prop.building_type,
              price: prop.expected_price,
              area: prop.built_up_area,
              areaUnit: prop.area_unit,
              image: prop.primary_image,
              status: prop.status,
              createdAt: prop.created_at,
              type: 'property',
            });
          }
        } catch (err) {
          // Ignore tenant errors
        }
      }
      // Limit total properties to 20
      results.properties = results.properties.slice(0, 20);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Property search error:', err);
    }

    // Search leads (main + all broker tenants)
    try {
      // Main leads
      const [mainLeads] = await pool.query(
        `SELECT id, full_name, email, phone, city, property_interest, status, created_at
         FROM leads
         WHERE full_name LIKE ? OR email LIKE ? OR phone LIKE ? OR city LIKE ? OR property_interest LIKE ?
         ORDER BY id DESC
         LIMIT 10`,
        [searchTerm, searchTerm, searchTerm, searchTerm, searchTerm]
      );
      for (const lead of mainLeads) {
        results.leads.push({
          id: lead.id,
          brokerId: null,
          brokerName: 'Main Website',
          tenantDb: null,
          fullName: lead.full_name,
          email: lead.email,
          phone: lead.phone,
          city: lead.city,
          propertyInterest: lead.property_interest,
          status: lead.status,
          createdAt: lead.created_at,
          source: 'main',
          type: 'lead',
        });
      }

      // Broker tenant leads
      const [brokers] = await pool.query('SELECT id, full_name, tenant_db FROM brokers WHERE tenant_db IS NOT NULL');
      for (const broker of brokers) {
        if (!broker.tenant_db) continue;
        try {
          const tenantPool = await getTenantPool(broker.tenant_db);
          await ensureTenantLeadsTableExists(tenantPool);
          const [leadRows] = await tenantPool.query(
            `SELECT id, full_name, email, phone, city, property_interest, status, created_at
             FROM leads
             WHERE full_name LIKE ? OR email LIKE ? OR phone LIKE ? OR city LIKE ? OR property_interest LIKE ?
             ORDER BY id DESC
             LIMIT 5`,
            [searchTerm, searchTerm, searchTerm, searchTerm, searchTerm]
          );
          for (const lead of leadRows) {
            results.leads.push({
              id: lead.id,
              brokerId: broker.id,
              brokerName: broker.full_name,
              tenantDb: broker.tenant_db,
              fullName: lead.full_name,
              email: lead.email,
              phone: lead.phone,
              city: lead.city,
              propertyInterest: lead.property_interest,
              status: lead.status,
              createdAt: lead.created_at,
              source: 'broker',
              type: 'lead',
            });
          }
        } catch (err) {
          // Ignore tenant errors
        }
      }
      // Limit total leads to 20
      results.leads = results.leads.slice(0, 20);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Lead search error:', err);
    }

    const total = results.brokers.length + results.properties.length + results.leads.length;
    return res.json({
      data: results,
      meta: { query, total },
    });
  } catch (err) {
    const isProd = process.env.NODE_ENV === 'production';
    // eslint-disable-next-line no-console
    console.error('Super admin search error:', err);
    return res.status(500).json({
      message: 'Server error',
      error: isProd ? undefined : String(err?.message || err),
    });
  }
}

// Broker: Search across own properties and leads
export async function brokerSearch(req, res) {
  try {
    const brokerId = req.user?.id;
    const tenantDb = req.user?.tenant_db;
    if (!brokerId || !tenantDb) {
      return res.status(400).json({ message: 'Missing tenant' });
    }

    const query = (req.query.q || '').toString().trim();
    if (!query || query.length < 2) {
      return res.json({
        data: {
          properties: [],
          leads: [],
        },
        meta: { query, total: 0 },
      });
    }

    const searchTerm = `%${query}%`;
    const results = {
      properties: [],
      leads: [],
    };

    const tenantPool = await getTenantPool(tenantDb);

    // Search properties
    try {
      const [propRows] = await tenantPool.query(
        `SELECT p.id, p.title, p.city, p.state, p.locality, p.address, p.property_type, p.building_type, p.status,
                pf.expected_price, pf.built_up_area, pf.area_unit, p.created_at,
                (SELECT pm.file_url FROM property_media pm 
                 WHERE pm.property_id = p.id 
                 ORDER BY pm.is_primary DESC, pm.id ASC 
                 LIMIT 1) as primary_image
         FROM properties p
         LEFT JOIN property_features pf ON pf.property_id = p.id
         WHERE p.title LIKE ? OR p.city LIKE ? OR p.locality LIKE ? OR p.address LIKE ? OR p.state LIKE ?
         ORDER BY p.id DESC
         LIMIT 20`,
        [searchTerm, searchTerm, searchTerm, searchTerm, searchTerm]
      );
      results.properties = propRows.map(prop => ({
        id: prop.id,
        title: prop.title,
        city: prop.city,
        state: prop.state,
        locality: prop.locality,
        address: prop.address,
        propertyType: prop.property_type,
        buildingType: prop.building_type,
        price: prop.expected_price,
        area: prop.built_up_area,
        areaUnit: prop.area_unit,
        image: prop.primary_image,
        status: prop.status,
        createdAt: prop.created_at,
        type: 'property',
      }));
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Property search error:', err);
    }

    // Search leads
    try {
      await ensureTenantLeadsTableExists(tenantPool);
      const [leadRows] = await tenantPool.query(
        `SELECT id, full_name, email, phone, city, property_interest, status, created_at
         FROM leads
         WHERE full_name LIKE ? OR email LIKE ? OR phone LIKE ? OR city LIKE ? OR property_interest LIKE ?
         ORDER BY id DESC
         LIMIT 20`,
        [searchTerm, searchTerm, searchTerm, searchTerm, searchTerm]
      );
      results.leads = leadRows.map(lead => ({
        id: lead.id,
        fullName: lead.full_name,
        email: lead.email,
        phone: lead.phone,
        city: lead.city,
        propertyInterest: lead.property_interest,
        status: lead.status,
        createdAt: lead.created_at,
        type: 'lead',
      }));
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Lead search error:', err);
    }

    const total = results.properties.length + results.leads.length;
    return res.json({
      data: results,
      meta: { query, total },
    });
  } catch (err) {
    const isProd = process.env.NODE_ENV === 'production';
    // eslint-disable-next-line no-console
    console.error('Broker search error:', err);
    return res.status(500).json({
      message: 'Server error',
      error: isProd ? undefined : String(err?.message || err),
    });
  }
}

