-- Simple Migration: Add document columns to brokers table
-- Run this SQL directly in your MySQL database

ALTER TABLE brokers 
ADD COLUMN document_type ENUM('aadhaar', 'pan_card', 'driving_license', 'voter_id', 'other') NULL AFTER tenant_db;

ALTER TABLE brokers 
ADD COLUMN document_front VARCHAR(512) NULL AFTER document_type;

ALTER TABLE brokers 
ADD COLUMN document_back VARCHAR(512) NULL AFTER document_front;

