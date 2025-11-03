-- Fix: Add missing columns to templates table if they don't exist
-- This migration is idempotent - safe to run multiple times

-- Add label column if it doesn't exist
SET @dbname = DATABASE();
SET @tablename = "templates";
SET @columnname = "label";
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (table_name = @tablename)
      AND (table_schema = @dbname)
      AND (column_name = @columnname)
  ) > 0,
  "SELECT 'Column label already exists.'",
  CONCAT("ALTER TABLE ", @tablename, " ADD COLUMN ", @columnname, " VARCHAR(255) NOT NULL DEFAULT '' AFTER name")
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Add status column if it doesn't exist
SET @columnname = "status";
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (table_name = @tablename)
      AND (table_schema = @dbname)
      AND (column_name = @columnname)
  ) > 0,
  "SELECT 'Column status already exists.'",
  CONCAT("ALTER TABLE ", @tablename, " ADD COLUMN ", @columnname, " ENUM('active', 'inactive') NOT NULL DEFAULT 'active' AFTER label")
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Add banner_image column if it doesn't exist
SET @columnname = "banner_image";
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (table_name = @tablename)
      AND (table_schema = @dbname)
      AND (column_name = @columnname)
  ) > 0,
  "SELECT 'Column banner_image already exists.'",
  CONCAT("ALTER TABLE ", @tablename, " ADD COLUMN ", @columnname, " VARCHAR(512) NULL AFTER status")
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Add preview_image column if it doesn't exist
SET @columnname = "preview_image";
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (table_name = @tablename)
      AND (table_schema = @dbname)
      AND (column_name = @columnname)
  ) > 0,
  "SELECT 'Column preview_image already exists.'",
  CONCAT("ALTER TABLE ", @tablename, " ADD COLUMN ", @columnname, " VARCHAR(512) NULL AFTER banner_image")
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Add description column if it doesn't exist
SET @columnname = "description";
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (table_name = @tablename)
      AND (table_schema = @dbname)
      AND (column_name = @columnname)
  ) > 0,
  "SELECT 'Column description already exists.'",
  CONCAT("ALTER TABLE ", @tablename, " ADD COLUMN ", @columnname, " TEXT NULL AFTER preview_image")
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Add slug column if it doesn't exist (and make it have a default value)
SET @columnname = "slug";
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (table_name = @tablename)
      AND (table_schema = @dbname)
      AND (column_name = @columnname)
  ) > 0,
  "SELECT 'Column slug already exists.'",
  CONCAT("ALTER TABLE ", @tablename, " ADD COLUMN ", @columnname, " VARCHAR(255) NULL AFTER name")
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- If slug column exists but doesn't allow NULL, make it nullable or add default
-- This handles the case where slug exists but requires a value
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (table_name = @tablename)
      AND (table_schema = @dbname)
      AND (column_name = @columnname)
      AND (is_nullable = 'NO')
      AND (column_default IS NULL)
  ) > 0,
  CONCAT("ALTER TABLE ", @tablename, " MODIFY COLUMN ", @columnname, " VARCHAR(255) NULL"),
  "SELECT 'Column slug is already nullable or has default.'"
));
PREPARE alterIfNeeded FROM @preparedStatement;
EXECUTE alterIfNeeded;
DEALLOCATE PREPARE alterIfNeeded;

-- Update existing rows to have proper label if label column was just added
UPDATE templates SET label = REPLACE(REPLACE(name, '-', ' '), '_', ' ') WHERE label = '' OR label IS NULL;

-- Update existing rows to have slug based on name if slug is null
-- Simple slug generation: lowercase and replace non-alphanumeric with dashes
UPDATE templates SET slug = LOWER(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(name, '_', '-'), ' ', '-'), '.', '-'), '--', '-'), '--', '-'), '--', '-')) WHERE slug IS NULL OR slug = '';

