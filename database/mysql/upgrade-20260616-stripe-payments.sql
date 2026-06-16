ALTER TABLE payments
  ADD COLUMN IF NOT EXISTS provider VARCHAR(40) AFTER payment_method,
  ADD COLUMN IF NOT EXISTS provider_payment_intent_id VARCHAR(191) AFTER provider,
  ADD COLUMN IF NOT EXISTS provider_charge_id VARCHAR(191) AFTER provider_payment_intent_id,
  ADD COLUMN IF NOT EXISTS provider_refund_id VARCHAR(191) AFTER provider_charge_id,
  ADD COLUMN IF NOT EXISTS idempotency_key VARCHAR(191) AFTER provider_refund_id,
  ADD COLUMN IF NOT EXISTS failure_message TEXT AFTER payment_proof_url,
  ADD COLUMN IF NOT EXISTS currency VARCHAR(10) NOT NULL DEFAULT 'pkr' AFTER amount,
  ADD COLUMN IF NOT EXISTS refunded_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00 AFTER amount,
  ADD COLUMN IF NOT EXISTS refunded_at DATETIME AFTER paid_at,
  ADD COLUMN IF NOT EXISTS updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER created_at,
  ADD UNIQUE KEY IF NOT EXISTS uniq_payments_provider_intent (provider_payment_intent_id),
  ADD UNIQUE KEY IF NOT EXISTS uniq_payments_idempotency_key (idempotency_key);

CREATE TABLE IF NOT EXISTS payment_refunds (
  id CHAR(36) PRIMARY KEY,
  payment_id CHAR(36) NOT NULL,
  order_id CHAR(36) NOT NULL,
  provider VARCHAR(40) NOT NULL DEFAULT 'stripe',
  provider_refund_id VARCHAR(191),
  amount DECIMAL(10,2) NOT NULL,
  reason VARCHAR(191),
  status VARCHAR(80) NOT NULL DEFAULT 'pending',
  idempotency_key VARCHAR(191),
  created_by CHAR(36),
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_payment_refunds_payment FOREIGN KEY (payment_id) REFERENCES payments(id) ON DELETE CASCADE,
  CONSTRAINT fk_payment_refunds_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  UNIQUE KEY uniq_payment_refunds_provider_refund (provider_refund_id),
  UNIQUE KEY uniq_payment_refunds_idempotency_key (idempotency_key),
  INDEX idx_payment_refunds_payment (payment_id),
  INDEX idx_payment_refunds_order (order_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS stripe_webhook_events (
  id CHAR(36) PRIMARY KEY,
  provider_event_id VARCHAR(191) NOT NULL,
  event_type VARCHAR(191) NOT NULL,
  payment_intent_id VARCHAR(191),
  processed_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uniq_stripe_webhook_event (provider_event_id),
  INDEX idx_stripe_webhook_payment_intent (payment_intent_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS payment_status_events (
  id CHAR(36) PRIMARY KEY,
  payment_id CHAR(36) NOT NULL,
  order_id CHAR(36) NOT NULL,
  status VARCHAR(80) NOT NULL,
  source VARCHAR(80) NOT NULL,
  provider_event_id VARCHAR(191),
  provider_object_id VARCHAR(191),
  message TEXT,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_payment_status_events_payment FOREIGN KEY (payment_id) REFERENCES payments(id) ON DELETE CASCADE,
  CONSTRAINT fk_payment_status_events_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  INDEX idx_payment_status_events_payment (payment_id),
  INDEX idx_payment_status_events_order (order_id),
  INDEX idx_payment_status_events_provider_event (provider_event_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
