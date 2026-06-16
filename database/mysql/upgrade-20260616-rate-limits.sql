CREATE TABLE IF NOT EXISTS rate_limit_counters (
  bucket_key VARCHAR(255) PRIMARY KEY,
  rate_limit_key VARCHAR(120) NOT NULL,
  ip_address VARCHAR(80) NOT NULL,
  request_count INT NOT NULL DEFAULT 0,
  window_reset_at DATETIME NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_rate_limit_key (rate_limit_key),
  INDEX idx_rate_limit_reset (window_reset_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS abuse_audit_events (
  id CHAR(36) PRIMARY KEY,
  event_type VARCHAR(80) NOT NULL,
  rate_limit_key VARCHAR(120),
  ip_address VARCHAR(80),
  user_agent VARCHAR(500),
  metadata JSON,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_abuse_event_type (event_type),
  INDEX idx_abuse_rate_limit_key (rate_limit_key),
  INDEX idx_abuse_ip_created (ip_address, created_at),
  INDEX idx_abuse_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
