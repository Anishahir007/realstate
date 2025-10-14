-- OTP requests table for SMS verification via Twilio
CREATE TABLE IF NOT EXISTS otp_requests (
  id CHAR(36) NOT NULL,
  phone VARCHAR(32) NOT NULL,
  purpose VARCHAR(64) NOT NULL,
  code_hash VARCHAR(255) NOT NULL,
  meta JSON NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expires_at DATETIME NOT NULL,
  verified_at DATETIME NULL,
  PRIMARY KEY (id),
  KEY ix_otp_requests_phone (phone),
  KEY ix_otp_requests_exp (expires_at)
);


