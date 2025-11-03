-- Templates management table
CREATE TABLE IF NOT EXISTS templates (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  label VARCHAR(255) NOT NULL,
  status ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
  banner_image VARCHAR(512) NULL,
  preview_image VARCHAR(512) NULL,
  description TEXT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_templates_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert initial templates (if they don't exist)
INSERT IGNORE INTO templates (name, label, status, banner_image, preview_image) VALUES
('classic', 'Classic', 'active', NULL, NULL),
('proclassic', 'Proclassic', 'active', NULL, NULL);

