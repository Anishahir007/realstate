-- Add address, store_name and social media fields to brokers table
ALTER TABLE brokers
ADD COLUMN address TEXT NULL AFTER location,
ADD COLUMN store_name VARCHAR(255) NULL AFTER address,
ADD COLUMN instagram VARCHAR(512) NULL AFTER document_back,
ADD COLUMN facebook VARCHAR(512) NULL AFTER instagram,
ADD COLUMN linkedin VARCHAR(512) NULL AFTER facebook,
ADD COLUMN youtube VARCHAR(512) NULL AFTER linkedin,
ADD COLUMN whatsapp_number VARCHAR(20) NULL AFTER youtube;

-- Add address, store_name and social media fields to companies table
ALTER TABLE companies
ADD COLUMN address TEXT NULL AFTER location,
ADD COLUMN store_name VARCHAR(255) NULL AFTER address,
ADD COLUMN instagram VARCHAR(512) NULL AFTER document_back,
ADD COLUMN facebook VARCHAR(512) NULL AFTER instagram,
ADD COLUMN linkedin VARCHAR(512) NULL AFTER facebook,
ADD COLUMN youtube VARCHAR(512) NULL AFTER linkedin,
ADD COLUMN whatsapp_number VARCHAR(20) NULL AFTER youtube;

