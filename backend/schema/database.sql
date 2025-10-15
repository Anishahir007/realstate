-- RealEstate ERP core tables (MySQL 8+)
-- Tables: super_admins, brokers, users

-- Note: Run this after selecting your target database (e.g., USE realestate;)

-- =========================
-- super_admins
-- =========================
CREATE TABLE IF NOT EXISTS super_admins (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  full_name VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(20) NULL,
  photo VARCHAR(512) NULL,
  password_hash VARCHAR(255) NOT NULL,
  status ENUM('active', 'suspended') NOT NULL DEFAULT 'active',
  last_login_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_super_admins_email (email)
);

-- =========================
-- brokers
-- =========================
CREATE TABLE IF NOT EXISTS brokers (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  full_name VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(20) NULL,
  photo VARCHAR(512) NULL,
  password_hash VARCHAR(255) NOT NULL,
  license_no VARCHAR(100) NULL,
  tenant_db VARCHAR(128) NULL,
  status ENUM('active', 'suspended') NOT NULL DEFAULT 'active',
  created_by_admin_id BIGINT UNSIGNED NULL,
  last_login_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_brokers_email (email),
  UNIQUE KEY uq_brokers_tenant_db (tenant_db),
  KEY ix_brokers_created_by_admin_id (created_by_admin_id),
  CONSTRAINT fk_brokers_created_by_admin
    FOREIGN KEY (created_by_admin_id)
    REFERENCES super_admins (id)
    ON UPDATE CASCADE
    ON DELETE SET NULL
);

-- =========================
-- users (end customers)
-- =========================
CREATE TABLE IF NOT EXISTS users (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  full_name VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(20) NULL,
  photo VARCHAR(512) NULL,
  password_hash VARCHAR(255) NOT NULL,
  status ENUM('active', 'suspended') NOT NULL DEFAULT 'active',
  broker_id BIGINT UNSIGNED NULL,
  last_login_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_users_email (email),
  KEY ix_users_broker_id (broker_id),
  CONSTRAINT fk_users_broker
    FOREIGN KEY (broker_id)
    REFERENCES brokers (id)
    ON UPDATE CASCADE
    ON DELETE SET NULL
);


-- =========================
-- leads (global/admin scope)
-- =========================
CREATE TABLE IF NOT EXISTS leads (
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
);


-- =========================
-- super_admin_notifications
-- =========================
CREATE TABLE IF NOT EXISTS super_admin_notifications (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  type VARCHAR(50) NOT NULL,
  title VARCHAR(200) NOT NULL,
  message VARCHAR(500) NULL,
  actor_broker_id BIGINT UNSIGNED NULL,
  actor_broker_name VARCHAR(100) NULL,
  actor_broker_email VARCHAR(255) NULL,
  is_read TINYINT(1) NOT NULL DEFAULT 0,  
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  read_at DATETIME NULL,
  PRIMARY KEY (id),
  KEY ix_super_admin_notifications_read (is_read, created_at)
);


