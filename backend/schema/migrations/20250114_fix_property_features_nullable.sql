-- Migration: Fix property_features table to allow NULL for built_up_area and expected_price
-- Date: 2025-01-14
-- Reason: These fields should be optional to allow properties to be created first, then features added later

-- For each tenant database, update the property_features table
-- Note: This should be run per tenant database

ALTER TABLE property_features 
  MODIFY COLUMN built_up_area DECIMAL(10,2) NULL,
  MODIFY COLUMN expected_price DECIMAL(12,2) NULL;

