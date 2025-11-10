ALTER TABLE super_admins
  ADD COLUMN portal_role ENUM('super_admin', 'sales', 'property_management') NOT NULL DEFAULT 'super_admin' AFTER photo;

