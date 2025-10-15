import mysql from 'mysql2/promise';

// Cache tenant pools to avoid creating a new pool per request
const tenantPools = new Map();

export async function createBrokerDatabaseIfNotExists(dbName) {
  if (!dbName) throw new Error('tenant dbName required');
  const rootPool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    waitForConnections: true,
    connectionLimit: 5,
    queueLimit: 0
  });
  try {
    // Create database if not exists (use server defaults to avoid collation issues)
    await rootPool.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\``);
    // Initialize tenant schema (idempotent)
    // Use a one-off pool to avoid interfering with cached pool lifecycle
    const tenantPool = mysql.createPool({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: dbName,
      waitForConnections: true,
      connectionLimit: 5,
      queueLimit: 0
    });
    try {
      const createTableQueries = [
        // Users table inside tenant DB
        `CREATE TABLE IF NOT EXISTS \`users\` (
          id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
          full_name VARCHAR(255) NOT NULL,
          email VARCHAR(255) NOT NULL,
          phone VARCHAR(50) NULL,
          photo VARCHAR(500) NULL,
          password_hash VARCHAR(255) NOT NULL,
          status ENUM('active','inactive') NOT NULL DEFAULT 'active',
          last_login_at DATETIME NULL,
          created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          PRIMARY KEY (id),
          UNIQUE KEY uq_users_email (email)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,


        // Leads table
        `CREATE TABLE IF NOT EXISTS \`leads\` (
          id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
          full_name VARCHAR(255) NOT NULL,
          email VARCHAR(255) NOT NULL,
          phone VARCHAR(50) NOT NULL,
          city VARCHAR(100) DEFAULT NULL,
          property_interest VARCHAR(255) DEFAULT NULL,
          source ENUM('website', 'call', 'social_media', 'referral') DEFAULT 'website',
          status ENUM('new', 'contacted', 'qualified', 'proposal', 'closed', 'lost') DEFAULT 'new',
          message TEXT DEFAULT NULL,
          lead_source_type ENUM('main', 'broker') DEFAULT 'main',
          broker_id BIGINT UNSIGNED DEFAULT NULL,
          assigned_to VARCHAR(255) DEFAULT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          PRIMARY KEY (id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`
      ];

      for (const sql of createTableQueries) {
        // Execute sequentially to respect FK dependencies
        // eslint-disable-next-line no-await-in-loop
        await tenantPool.query(sql);
      }
    } finally {
      await tenantPool.end();
    }
  } finally {
    await rootPool.end();
  }
}

export async function getTenantPool(dbName) {
  if (!dbName) throw new Error('tenant dbName required');
  const existing = tenantPools.get(dbName);
  if (existing) {
    try {
      // Ping to confirm health; if it fails, recreate
      await existing.query('SELECT 1');
      return existing;
    } catch (e) {
      try { await existing.end(); } catch {}
      tenantPools.delete(dbName);
    }
  }
  const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: dbName,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
  });
  tenantPools.set(dbName, pool);
  return pool;
}

// Ensure minimal leads table exists in a tenant DB (idempotent)
export async function ensureTenantLeadsTableExists(tenantPool) {
  const sql = `CREATE TABLE IF NOT EXISTS \`leads\` (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50) NOT NULL,
    city VARCHAR(100) DEFAULT NULL,
    property_interest VARCHAR(255) DEFAULT NULL,
    source ENUM('website', 'call', 'social_media', 'referral') DEFAULT 'website',
    status ENUM('new', 'contacted', 'qualified', 'proposal', 'closed', 'lost') DEFAULT 'new',
    message TEXT DEFAULT NULL,
    assigned_to VARCHAR(255) DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`;
  await tenantPool.query(sql);
}


