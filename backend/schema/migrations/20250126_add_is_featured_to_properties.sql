-- Migration: Add is_featured column to properties table
-- Date: 2025-01-26
-- Description: Add is_featured boolean column to mark properties as featured

-- Add is_featured column to properties table
ALTER TABLE properties 
ADD COLUMN is_featured TINYINT(1) NOT NULL DEFAULT 0 
AFTER status;

-- Add index for faster queries
CREATE INDEX idx_properties_is_featured ON properties(is_featured, status);

