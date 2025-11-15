-- Migration: Add companies table
-- Date: 2025-01-25
-- Description: Add companies table completely separate from brokers (no relationship)

-- Create companies table
CREATE TABLE IF NOT EXISTS companies (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  full_name VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(20) NULL,
  photo VARCHAR(512) NULL,
  portal_role ENUM('company_admin', 'sales', 'property_management') NOT NULL DEFAULT 'company_admin',
  password_hash VARCHAR(255) NOT NULL,
  company_name VARCHAR(255) NOT NULL,
  location VARCHAR(100) NULL,
  tenant_db VARCHAR(128) NULL,
  document_type ENUM('aadhaar', 'pan_card', 'driving_license', 'voter_id', 'other') NULL,
  document_front VARCHAR(512) NULL,
  document_back VARCHAR(512) NULL,
  status ENUM('active', 'suspended') NOT NULL DEFAULT 'active',
  created_by_admin_id BIGINT UNSIGNED NULL,
  last_login_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_companies_email (email),
  UNIQUE KEY uq_companies_tenant_db (tenant_db),
  KEY ix_companies_created_by_admin_id (created_by_admin_id),
  CONSTRAINT fk_companies_created_by_admin
    FOREIGN KEY (created_by_admin_id)
    REFERENCES super_admins (id)
    ON UPDATE CASCADE
    ON DELETE SET NULL
);

