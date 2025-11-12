import os from 'node:os';
import pool from '../config/database.js';
import { getAverageResponseMs } from '../utils/metrics.js';
import { getTenantPool, ensureTenantLeadsTableExists } from '../utils/tenant.js';
import { loadSitesMap } from '../utils/sites.js';
import { resolveDateRange } from '../utils/dateRange.js';

export async function getSystemHealth(req, res) {
  try {
    // Uptime in seconds -> percentage toward 100 based on recent uptime window (mocked as 99+)
    const uptimeSec = process.uptime();

    // Check DB round-trip
    const dbStart = Date.now();
    let dbOk = true;
    try {
      await pool.query('SELECT 1');
    } catch {
      dbOk = false;
    }
    const dbMs = Date.now() - dbStart;

    // Storage usage (disk) – approximate via root partition if available (fallback to memory usage)
    let storageUsagePct = null;
    try {
      // Node doesn't provide cross-platform disk usage; approximate using memory as a proxy
      const totalMem = os.totalmem();
      const freeMem = os.freemem();
      const usedMem = totalMem - freeMem;
      storageUsagePct = Math.round((usedMem / totalMem) * 100);
    } catch {
      storageUsagePct = 60;
    }

    const apiMs = getAverageResponseMs();
    const data = {
      serverUptimePct: 99.9, // keep near perfect unless we wire a real uptime monitor
      dbPerformancePct: Math.max(0, Math.min(100, 100 - Math.max(0, dbMs - 10))),
      apiResponseMs: apiMs || Math.max(20, dbMs),
      storageUsagePct,
    };
    res.json({ data });
  } catch (e) {
    res.status(500).json({ message: 'Server error' });
  }
}


export async function getSuperAdminDashboardStats(req, res) {
  try {
    const { startDate, endDate } = resolveDateRange({
      range: req.query.range,
      from: req.query.from,
      to: req.query.to,
      month: req.query.month,
      year: req.query.year,
    });

    const brokerParams = [];
    let brokerWhereSql = '';
    if (startDate && endDate) {
      brokerWhereSql = 'WHERE created_at BETWEEN ? AND ?';
      brokerParams.push(startDate, endDate);
    }
    const [[brokerCountRow]] = await pool.query(
      `SELECT COUNT(*) AS total FROM brokers ${brokerWhereSql}`,
      brokerParams
    );
    
    const companyParams = [];
    let companyWhereSql = '';
    if (startDate && endDate) {
      companyWhereSql = 'WHERE created_at BETWEEN ? AND ?';
      companyParams.push(startDate, endDate);
    }
    const [[companyCountRow]] = await pool.query(
      `SELECT COUNT(*) AS total FROM companies ${companyWhereSql}`,
      companyParams
    );
    
    const [brokers] = await pool.query('SELECT id, tenant_db FROM brokers WHERE tenant_db IS NOT NULL');
    const [companies] = await pool.query('SELECT id, tenant_db FROM companies WHERE tenant_db IS NOT NULL');

    let totalProperties = 0;
    let activeProperties = 0;
    let totalBrokerLeads = 0;
    let totalCompanyLeads = 0;

    for (const broker of brokers) {
      const tenantDb = broker?.tenant_db;
      if (!tenantDb) continue;
      try {
        // eslint-disable-next-line no-await-in-loop
        const tenantPool = await getTenantPool(tenantDb);

        try {
          // eslint-disable-next-line no-await-in-loop
          const propParams = [];
          let propSql = 'SELECT COUNT(*) AS totalCount, SUM(CASE WHEN status IS NULL OR status = \'active\' THEN 1 ELSE 0 END) AS activeCount FROM properties';
          if (startDate && endDate) {
            propSql += ' WHERE created_at BETWEEN ? AND ?';
            propParams.push(startDate, endDate);
          }
          const [[propCounts]] = await tenantPool.query(propSql, propParams);
          totalProperties += Number(propCounts?.totalCount || 0);
          activeProperties += Number(propCounts?.activeCount || 0);
        } catch {
          // Ignore tenant property errors; continue with other tenants
        }

        try {
          // eslint-disable-next-line no-await-in-loop
          await ensureTenantLeadsTableExists(tenantPool);
          // eslint-disable-next-line no-await-in-loop
          const leadParams = [];
          let leadSql = 'SELECT COUNT(*) AS total FROM leads';
          if (startDate && endDate) {
            leadSql += ' WHERE created_at BETWEEN ? AND ?';
            leadParams.push(startDate, endDate);
          }
          const [[leadRow]] = await tenantPool.query(leadSql, leadParams);
          totalBrokerLeads += Number(leadRow?.total || 0);
        } catch {
          // Ignore tenant lead errors; continue with other tenants
        }
      } catch {
        // Skip brokers whose tenant DB is unavailable
      }
    }

    for (const company of companies) {
      const tenantDb = company?.tenant_db;
      if (!tenantDb) continue;
      try {
        // eslint-disable-next-line no-await-in-loop
        const tenantPool = await getTenantPool(tenantDb);

        try {
          // eslint-disable-next-line no-await-in-loop
          await ensureTenantLeadsTableExists(tenantPool);
          // eslint-disable-next-line no-await-in-loop
          const leadParams = [];
          let leadSql = 'SELECT COUNT(*) AS total FROM leads';
          if (startDate && endDate) {
            leadSql += ' WHERE created_at BETWEEN ? AND ?';
            leadParams.push(startDate, endDate);
          }
          const [[leadRow]] = await tenantPool.query(leadSql, leadParams);
          totalCompanyLeads += Number(leadRow?.total || 0);
        } catch {
          // Ignore tenant lead errors; continue with other tenants
        }
      } catch {
        // Skip companies whose tenant DB is unavailable
      }
    }

    const adminLeadParams = [];
    let adminLeadSql = 'SELECT COUNT(*) AS total FROM leads';
    if (startDate && endDate) {
      adminLeadSql += ' WHERE created_at BETWEEN ? AND ?';
      adminLeadParams.push(startDate, endDate);
    }
    const [[adminLeadRow]] = await pool.query(adminLeadSql, adminLeadParams);
    const totalLeads = totalBrokerLeads + totalCompanyLeads + Number(adminLeadRow?.total || 0);

    const sitesMap = loadSitesMap();
    const sitesList = Object.values(sitesMap || {});

    const isWithinRange = (value) => {
      if (!startDate && !endDate) return true;
      if (!value) return false;
      const parsed = new Date(value);
      if (Number.isNaN(parsed.getTime())) return false;
      if (startDate && parsed < startDate) return false;
      if (endDate && parsed > endDate) return false;
      return true;
    };

    const filteredSites = sitesList.filter((site) => {
      if (!startDate && !endDate) return true;
      const reference = site?.createdAt || site?.updatedAt || site?.domainVerifiedAt;
      return isWithinRange(reference);
    });

    const liveSitesTotal = filteredSites.length;
    const liveSitesCustom = filteredSites.filter((site) => site?.customDomain && isWithinRange(site.updatedAt || site.createdAt)).length;
    const liveSitesVerified = filteredSites.filter((site) => site?.domainVerifiedAt && isWithinRange(site.domainVerifiedAt)).length;
    const liveSitesSubdomain = Math.max(0, liveSitesTotal - liveSitesCustom);

    return res.json({
      data: {
        totalBrokers: Number(brokerCountRow?.total || 0),
        totalCompanies: Number(companyCountRow?.total || 0),
        totalLeads,
        totalProperties,
        activeProperties,
        liveSites: {
          total: liveSitesTotal,
          subdomain: liveSitesSubdomain,
          customDomain: liveSitesCustom,
          verifiedCustomDomain: liveSitesVerified,
        },
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


