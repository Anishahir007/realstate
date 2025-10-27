import mysql from 'mysql2/promise';

// Cache tenant pools to avoid creating a new pool per request
const tenantPools = new Map();

export async function createBrokerDatabaseIfNotExists(dbName) {
  if (!dbName) throw new Error('tenant dbName required');
  const rootPool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
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
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
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
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

        // Properties (core listing)
        `CREATE TABLE IF NOT EXISTS \`properties\` (
          id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
          user_id BIGINT UNSIGNED NOT NULL,
          property_for ENUM('sell') DEFAULT 'sell',
          building_type ENUM('residential', 'commercial') NOT NULL,
          property_type ENUM('flat','independent_house','builder_floor','farm_house','residential_land','penthouse','studio_apartment','villa','commercial_shop','showroom','office_space','business_center','farm_agricultural_land','commercial_plot','industrial_land','guest_house','hotel_restaurant','warehouse_godown','factory') NOT NULL,
          title VARCHAR(255) NOT NULL,
          description TEXT NULL,
          state VARCHAR(100) NOT NULL,
          city VARCHAR(100) NOT NULL,
          locality VARCHAR(255) NULL,
          sub_locality VARCHAR(255) NULL,
          society_name VARCHAR(255) NULL,
          address TEXT NULL,
          status ENUM('active','sold','inactive') DEFAULT 'active',
          created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          PRIMARY KEY (id),
          KEY idx_properties_user_id (user_id),
          KEY idx_properties_location (city, state),
          KEY idx_properties_filters (status, property_for, building_type, property_type),
          KEY idx_properties_created_at (created_at)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

        // Property features (pricing/specs)
        `CREATE TABLE IF NOT EXISTS \`property_features\` (
          id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
          property_id BIGINT UNSIGNED NOT NULL,
          built_up_area DECIMAL(10,2) NOT NULL,
          area_unit VARCHAR(32) DEFAULT 'sqft',
          carpet_area DECIMAL(10,2) NULL,
          carpet_area_unit VARCHAR(32) DEFAULT NULL,
          super_area DECIMAL(10,2) NULL,
          super_area_unit VARCHAR(32) DEFAULT NULL,
          expected_price DECIMAL(12,2) NOT NULL,
          booking_amount DECIMAL(12,2) DEFAULT 0,
          maintenance_charges DECIMAL(12,2) DEFAULT 0,
          sale_type ENUM('resale','new_property') DEFAULT 'new_property',
          no_of_floors INT DEFAULT 1,
          availability ENUM('under_construction','ready_to_move','upcoming') DEFAULT 'ready_to_move',
          possession_by VARCHAR(100) NULL,
          property_on_floor VARCHAR(50) NULL,
          furnishing_status ENUM('furnished','semi_furnished','unfurnished') DEFAULT 'unfurnished',
          facing VARCHAR(50) NULL,
          flooring_type VARCHAR(50) NULL,
          age_years VARCHAR(50) NULL,
          additional_rooms JSON NULL,
          approving_authority VARCHAR(50) NULL,
          ownership ENUM('freehold','leasehold','power_of_attorney','cooperative_society') DEFAULT 'freehold',
          rera_status ENUM('registered','applied','not_applicable') DEFAULT 'not_applicable',
          rera_number VARCHAR(100) NULL,
          num_bedrooms DECIMAL(3,1) DEFAULT NULL,
          num_bathrooms INT DEFAULT NULL,
          num_balconies INT DEFAULT NULL,
          PRIMARY KEY (id),
          KEY idx_prop_features_prop_id (property_id),
          KEY idx_prop_features_price (expected_price),
          KEY idx_prop_features_area (built_up_area),
          KEY idx_prop_features_filters (furnishing_status, availability),
          UNIQUE KEY uq_prop_features_property_id (property_id),
          CONSTRAINT fk_prop_features_property FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

        // Highlights (badges)
        `CREATE TABLE IF NOT EXISTS \`property_highlights\` (
          id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
          property_id BIGINT UNSIGNED NOT NULL,
          highlights JSON NULL,
          PRIMARY KEY (id),
          KEY idx_prop_highlights_property (property_id),
          UNIQUE KEY uq_prop_highlights_property_id (property_id),
          CONSTRAINT fk_prop_highlights_property FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

        // Amenities (multi-select)
        `CREATE TABLE IF NOT EXISTS \`property_amenities\` (
          id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
          property_id BIGINT UNSIGNED NOT NULL,
          amenities JSON NULL,
          PRIMARY KEY (id),
          KEY idx_prop_amenities_property (property_id),
          UNIQUE KEY uq_prop_amenities_property_id (property_id),
          CONSTRAINT fk_prop_amenities_property FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

        // Media (photos/videos by category)
        `CREATE TABLE IF NOT EXISTS \`property_media\` (
          id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
          property_id BIGINT UNSIGNED NOT NULL,
          media_type ENUM('image','video') DEFAULT 'image',
          file_url VARCHAR(500) NOT NULL,
          category ENUM('exterior','bedroom','bathroom','kitchen','floor_plan','location_map','other') DEFAULT 'exterior',
          is_primary TINYINT(1) NOT NULL DEFAULT 0,
          created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          PRIMARY KEY (id),
          KEY idx_prop_media_property (property_id),
          KEY idx_prop_media_category (category),
          CONSTRAINT fk_prop_media_property FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

        // Nearby landmarks
        `CREATE TABLE IF NOT EXISTS \`property_landmarks\` (
          id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
          property_id BIGINT UNSIGNED NOT NULL,
          nearby_landmarks JSON NULL,
          PRIMARY KEY (id),
          KEY idx_prop_landmarks_property (property_id),
          UNIQUE KEY uq_prop_landmarks_property_id (property_id),
          CONSTRAINT fk_prop_landmarks_property FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

        // Inquiries per property (contact requests)
        `CREATE TABLE IF NOT EXISTS \`property_inquiries\` (
          id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
          property_id BIGINT UNSIGNED NOT NULL,
          full_name VARCHAR(255) NOT NULL,
          email VARCHAR(255) NULL,
          phone VARCHAR(50) NULL,
          message TEXT NULL,
          source ENUM('website','call','social_media','referral') DEFAULT 'website',
          created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          PRIMARY KEY (id),
          KEY idx_prop_inquiries_property (property_id),
          KEY idx_prop_inquiries_created (created_at),
          CONSTRAINT fk_prop_inquiries_property FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE
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
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
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


