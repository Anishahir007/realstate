import mysql from 'mysql2/promise';

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
    const tenantPool = await getTenantPool(dbName);
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

        // Categories table
        `CREATE TABLE IF NOT EXISTS \`categories\` (
          id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
          name VARCHAR(255) NOT NULL,
          description TEXT NULL,
          created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          PRIMARY KEY (id),
          UNIQUE KEY uq_categories_name (name)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

        // Sub-categories table
        `CREATE TABLE IF NOT EXISTS \`sub_categories\` (
          id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
          category_id BIGINT UNSIGNED NOT NULL,
          name VARCHAR(255) NOT NULL,
          description TEXT NULL,
          created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          PRIMARY KEY (id),
          KEY idx_sub_categories_category_id (category_id),
          CONSTRAINT fk_sub_categories_category
            FOREIGN KEY (category_id) REFERENCES \`categories\` (id)
            ON DELETE CASCADE ON UPDATE CASCADE
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
  return mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: dbName,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
  });
}


