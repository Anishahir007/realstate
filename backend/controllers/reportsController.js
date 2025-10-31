import pool from '../config/database.js';
import { getTenantPool, ensureTenantLeadsTableExists } from '../utils/tenant.js';
import { resolveDateRange } from '../utils/dateRange.js';

// ========== Broker Reports ==========
export async function getBrokerReports(req, res) {
  try {
    const { startDate, endDate } = resolveDateRange({
      range: req.query.range,
      from: req.query.from,
      to: req.query.to,
      month: req.query.month,
      year: req.query.year,
    });

    const params = [];
    let whereSql = '';
    if (startDate && endDate) {
      whereSql = 'WHERE created_at BETWEEN ? AND ?';
      params.push(startDate, endDate);
    }

    // Total brokers
    const [[totalBrokers]] = await pool.query(
      `SELECT COUNT(*) AS total FROM brokers ${whereSql}`,
      params
    );

    // Active brokers
    let activeWhereSql = whereSql;
    let activeParams = [...params];
    if (whereSql) {
      activeWhereSql += ' AND status = ?';
    } else {
      activeWhereSql = 'WHERE status = ?';
    }
    activeParams.push('active');
    const [[activeBrokers]] = await pool.query(
      `SELECT COUNT(*) AS total FROM brokers ${activeWhereSql}`,
      activeParams
    );

    // Suspended brokers
    let suspendedWhereSql = whereSql;
    let suspendedParams = [...params];
    if (whereSql) {
      suspendedWhereSql += ' AND status = ?';
    } else {
      suspendedWhereSql = 'WHERE status = ?';
    }
    suspendedParams.push('suspended');
    const [[suspendedBrokers]] = await pool.query(
      `SELECT COUNT(*) AS total FROM brokers ${suspendedWhereSql}`,
      suspendedParams
    );

    // Brokers by month
    const monthWhere = startDate && endDate ? 'AND created_at BETWEEN ? AND ?' : '';
    const monthParams = startDate && endDate ? [startDate, endDate] : [];
    const [monthlyData] = await pool.query(
      `SELECT 
        DATE_FORMAT(created_at, '%Y-%m') AS month,
        COUNT(*) AS count
       FROM brokers
       WHERE created_at IS NOT NULL ${monthWhere}
       GROUP BY DATE_FORMAT(created_at, '%Y-%m')
       ORDER BY month DESC
       LIMIT 12`,
      monthParams
    );

    // Top brokers by properties
    const [brokers] = await pool.query('SELECT id, full_name, tenant_db FROM brokers WHERE tenant_db IS NOT NULL');
    const brokerStats = [];
    
    for (const broker of brokers) {
      if (!broker.tenant_db) continue;
      try {
        const tenantPool = await getTenantPool(broker.tenant_db);
        const propParams = [];
        let propSql = 'SELECT COUNT(*) AS total FROM properties';
        if (startDate && endDate) {
          propSql += ' WHERE created_at BETWEEN ? AND ?';
          propParams.push(startDate, endDate);
        }
        const [[propCount]] = await tenantPool.query(propSql, propParams);
        brokerStats.push({
          brokerId: broker.id,
          brokerName: broker.full_name,
          propertyCount: Number(propCount?.total || 0),
        });
      } catch {
        // Skip unavailable tenants
      }
    }
    
    brokerStats.sort((a, b) => b.propertyCount - a.propertyCount);
    const topBrokers = brokerStats.slice(0, 10);

    return res.json({
      data: {
        total: Number(totalBrokers?.total || 0),
        active: Number(activeBrokers?.total || 0),
        suspended: Number(suspendedBrokers?.total || 0),
        monthlyTrend: monthlyData.map(r => ({
          month: r.month,
          count: Number(r.count || 0),
        })),
        topBrokers,
      },
      meta: {
        range: req.query.range || null,
        from: startDate ? startDate.toISOString() : null,
        to: endDate ? endDate.toISOString() : null,
      },
    });
  } catch (err) {
    const isProd = process.env.NODE_ENV === 'production';
    return res.status(500).json({ message: 'Server error', error: isProd ? undefined : String(err?.message || err) });
  }
}

// ========== Property Reports ==========
export async function getPropertyReports(req, res) {
  try {
    const { startDate, endDate } = resolveDateRange({
      range: req.query.range,
      from: req.query.from,
      to: req.query.to,
      month: req.query.month,
      year: req.query.year,
    });

    const [brokers] = await pool.query('SELECT id, full_name, tenant_db FROM brokers WHERE tenant_db IS NOT NULL');
    
    let totalProperties = 0;
    let activeProperties = 0;
    let inactiveProperties = 0;
    const byType = {};
    const byBuildingType = {};
    const byStatus = {};
    const byCity = {};
    const monthlyTrend = {};
    const priceRanges = {
      '0-50L': 0,
      '50L-1Cr': 0,
      '1Cr-2Cr': 0,
      '2Cr-5Cr': 0,
      '5Cr+': 0,
    };

    for (const broker of brokers) {
      if (!broker.tenant_db) continue;
      try {
        const tenantPool = await getTenantPool(broker.tenant_db);
        const propParams = [];
        let propSql = `SELECT 
          p.id, p.property_type, p.building_type, p.status, p.city, p.created_at,
          pf.expected_price
        FROM properties p
        LEFT JOIN property_features pf ON pf.property_id = p.id`;
        if (startDate && endDate) {
          propSql += ' WHERE p.created_at BETWEEN ? AND ?';
          propParams.push(startDate, endDate);
        }
        const [rows] = await tenantPool.query(propSql, propParams);

        for (const row of rows) {
          totalProperties++;
          const status = row.status || 'active';
          if (status === 'active' || !status) activeProperties++;
          else inactiveProperties++;

          // By type
          const propType = row.property_type || 'other';
          byType[propType] = (byType[propType] || 0) + 1;

          // By building type
          const buildType = row.building_type || 'other';
          byBuildingType[buildType] = (byBuildingType[buildType] || 0) + 1;

          // By status
          byStatus[status] = (byStatus[status] || 0) + 1;

          // By city
          const city = row.city || 'Unknown';
          byCity[city] = (byCity[city] || 0) + 1;

          // Monthly trend
          if (row.created_at) {
            const monthKey = new Date(row.created_at).toISOString().slice(0, 7);
            monthlyTrend[monthKey] = (monthlyTrend[monthKey] || 0) + 1;
          }

          // Price ranges
          const price = Number(row.expected_price || 0);
          if (price > 0) {
            if (price < 5000000) priceRanges['0-50L']++;
            else if (price < 10000000) priceRanges['50L-1Cr']++;
            else if (price < 20000000) priceRanges['1Cr-2Cr']++;
            else if (price < 50000000) priceRanges['2Cr-5Cr']++;
            else priceRanges['5Cr+']++;
          }
        }
      } catch {
        // Skip unavailable tenants
      }
    }

    return res.json({
      data: {
        total: totalProperties,
        active: activeProperties,
        inactive: inactiveProperties,
        byType: Object.entries(byType).map(([type, count]) => ({ type, count })),
        byBuildingType: Object.entries(byBuildingType).map(([type, count]) => ({ type, count })),
        byStatus: Object.entries(byStatus).map(([status, count]) => ({ status, count })),
        byCity: Object.entries(byCity).map(([city, count]) => ({ city, count })).sort((a, b) => b.count - a.count).slice(0, 10),
        monthlyTrend: Object.entries(monthlyTrend).map(([month, count]) => ({ month, count })).sort((a, b) => a.month.localeCompare(b.month)),
        priceRanges,
      },
      meta: {
        range: req.query.range || null,
        from: startDate ? startDate.toISOString() : null,
        to: endDate ? endDate.toISOString() : null,
      },
    });
  } catch (err) {
    const isProd = process.env.NODE_ENV === 'production';
    return res.status(500).json({ message: 'Server error', error: isProd ? undefined : String(err?.message || err) });
  }
}

// ========== Leads Reports ==========
export async function getLeadsReports(req, res) {
  try {
    const { startDate, endDate } = resolveDateRange({
      range: req.query.range,
      from: req.query.from,
      to: req.query.to,
      month: req.query.month,
      year: req.query.year,
    });

    // Main database leads
    const adminLeadParams = [];
    let adminLeadSql = 'SELECT COUNT(*) AS total FROM leads';
    if (startDate && endDate) {
      adminLeadSql += ' WHERE created_at BETWEEN ? AND ?';
      adminLeadParams.push(startDate, endDate);
    }
    const [[adminLeadRow]] = await pool.query(adminLeadSql, adminLeadParams);
    let totalLeads = Number(adminLeadRow?.total || 0);

    // Tenant database leads
    const [brokers] = await pool.query('SELECT id, full_name, tenant_db FROM brokers WHERE tenant_db IS NOT NULL');
    const bySource = {};
    const byStatus = {};
    const monthlyTrend = {};
    const brokerLeads = {};

    for (const broker of brokers) {
      if (!broker.tenant_db) continue;
      try {
        const tenantPool = await getTenantPool(broker.tenant_db);
        await ensureTenantLeadsTableExists(tenantPool);
        
        const leadParams = [];
        let leadSql = 'SELECT source, status, created_at FROM leads';
        if (startDate && endDate) {
          leadSql += ' WHERE created_at BETWEEN ? AND ?';
          leadParams.push(startDate, endDate);
        }
        const [rows] = await tenantPool.query(leadSql, leadParams);

        brokerLeads[broker.id] = { name: broker.full_name, count: rows.length };

        for (const row of rows) {
          totalLeads++;

          // By source
          const source = row.source || 'unknown';
          bySource[source] = (bySource[source] || 0) + 1;

          // By status
          const status = row.status || 'new';
          byStatus[status] = (byStatus[status] || 0) + 1;

          // Monthly trend
          if (row.created_at) {
            const monthKey = new Date(row.created_at).toISOString().slice(0, 7);
            monthlyTrend[monthKey] = (monthlyTrend[monthKey] || 0) + 1;
          }
        }
      } catch {
        // Skip unavailable tenants
      }
    }

    return res.json({
      data: {
        total: totalLeads,
        bySource: Object.entries(bySource).map(([source, count]) => ({ source, count })),
        byStatus: Object.entries(byStatus).map(([status, count]) => ({ status, count })),
        monthlyTrend: Object.entries(monthlyTrend).map(([month, count]) => ({ month, count })).sort((a, b) => a.month.localeCompare(b.month)),
        brokerLeads: Object.entries(brokerLeads).map(([brokerId, data]) => ({ brokerId, brokerName: data.name, count: data.count })).sort((a, b) => b.count - a.count).slice(0, 10),
      },
      meta: {
        range: req.query.range || null,
        from: startDate ? startDate.toISOString() : null,
        to: endDate ? endDate.toISOString() : null,
      },
    });
  } catch (err) {
    const isProd = process.env.NODE_ENV === 'production';
    return res.status(500).json({ message: 'Server error', error: isProd ? undefined : String(err?.message || err) });
  }
}

// ========== Combined Analytics Report ==========
export async function getAnalyticsReport(req, res) {
  try {
    const { startDate, endDate } = resolveDateRange({
      range: req.query.range,
      from: req.query.from,
      to: req.query.to,
      month: req.query.month,
      year: req.query.year,
    });

    const [brokers] = await pool.query('SELECT id, full_name, tenant_db FROM brokers WHERE tenant_db IS NOT NULL');
    
    const brokerPerformance = [];
    let totalProperties = 0;
    let totalLeads = 0;

    for (const broker of brokers) {
      if (!broker.tenant_db) continue;
      try {
        const tenantPool = await getTenantPool(broker.tenant_db);
        await ensureTenantLeadsTableExists(tenantPool);

        const propParams = [];
        let propSql = 'SELECT COUNT(*) AS total FROM properties';
        if (startDate && endDate) {
          propSql += ' WHERE created_at BETWEEN ? AND ?';
          propParams.push(startDate, endDate);
        }
        const [[propCount]] = await tenantPool.query(propSql, propParams);

        const leadParams = [];
        let leadSql = 'SELECT COUNT(*) AS total FROM leads';
        if (startDate && endDate) {
          leadSql += ' WHERE created_at BETWEEN ? AND ?';
          leadParams.push(startDate, endDate);
        }
        const [[leadCount]] = await tenantPool.query(leadSql, leadParams);

        const propTotal = Number(propCount?.total || 0);
        const leadTotal = Number(leadCount?.total || 0);
        
        totalProperties += propTotal;
        totalLeads += leadTotal;

        brokerPerformance.push({
          brokerId: broker.id,
          brokerName: broker.full_name,
          properties: propTotal,
          leads: leadTotal,
          conversionRate: propTotal > 0 ? ((leadTotal / propTotal) * 100).toFixed(2) : '0.00',
        });
      } catch {
        // Skip unavailable tenants
      }
    }

    brokerPerformance.sort((a, b) => (b.properties + b.leads) - (a.properties + a.leads));

    return res.json({
      data: {
        totalBrokers: brokers.length,
        totalProperties,
        totalLeads,
        averagePropertiesPerBroker: brokers.length > 0 ? (totalProperties / brokers.length).toFixed(2) : '0.00',
        averageLeadsPerBroker: brokers.length > 0 ? (totalLeads / brokers.length).toFixed(2) : '0.00',
        brokerPerformance: brokerPerformance.slice(0, 20),
      },
      meta: {
        range: req.query.range || null,
        from: startDate ? startDate.toISOString() : null,
        to: endDate ? endDate.toISOString() : null,
      },
    });
  } catch (err) {
    const isProd = process.env.NODE_ENV === 'production';
    return res.status(500).json({ message: 'Server error', error: isProd ? undefined : String(err?.message || err) });
  }
}
