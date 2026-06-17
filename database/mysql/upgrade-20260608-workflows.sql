ALTER TABLE payments
  ADD COLUMN IF NOT EXISTS payment_proof_url TEXT AFTER transaction_id;

ALTER TABLE profiles
  MODIFY COLUMN role ENUM('customer', 'seller', 'admin', 'manager', 'warehouse') NOT NULL DEFAULT 'customer',
  ADD COLUMN IF NOT EXISTS cnic_number VARCHAR(120) AFTER is_active,
  ADD COLUMN IF NOT EXISTS cnic_front_url TEXT AFTER cnic_number,
  ADD COLUMN IF NOT EXISTS cnic_back_url TEXT AFTER cnic_front_url,
  ADD COLUMN IF NOT EXISTS kyc_document_url TEXT AFTER cnic_back_url;

ALTER TABLE seller_profiles
  ADD COLUMN IF NOT EXISTS owner_full_name VARCHAR(255) AFTER tax_id,
  ADD COLUMN IF NOT EXISTS owner_cnic VARCHAR(120) AFTER owner_full_name,
  ADD COLUMN IF NOT EXISTS cnic_front_url TEXT AFTER owner_cnic,
  ADD COLUMN IF NOT EXISTS cnic_back_url TEXT AFTER cnic_front_url,
  ADD COLUMN IF NOT EXISTS business_registration_url TEXT AFTER cnic_back_url,
  ADD COLUMN IF NOT EXISTS tax_certificate_url TEXT AFTER business_registration_url,
  ADD COLUMN IF NOT EXISTS bank_statement_url TEXT AFTER tax_certificate_url,
  ADD COLUMN IF NOT EXISTS brand_authorization_url TEXT AFTER bank_statement_url,
  ADD COLUMN IF NOT EXISTS pickup_address TEXT AFTER brand_authorization_url,
  ADD COLUMN IF NOT EXISTS return_address TEXT AFTER pickup_address,
  ADD COLUMN IF NOT EXISTS seller_center_enabled_options TEXT AFTER admin_note,
  ADD COLUMN IF NOT EXISTS storefront_config JSON AFTER seller_center_enabled_options;

ALTER TABLE seller_earnings
  ADD COLUMN IF NOT EXISTS available_at DATETIME AFTER status,
  ADD COLUMN IF NOT EXISTS released_at DATETIME AFTER available_at,
  ADD INDEX IF NOT EXISTS idx_seller_earnings_release (status, available_at);

CREATE TABLE IF NOT EXISTS return_requests (
  id CHAR(36) PRIMARY KEY,
  return_number VARCHAR(80) NOT NULL UNIQUE,
  order_id CHAR(36) NOT NULL,
  customer_id CHAR(36) NOT NULL,
  status ENUM('requested', 'approved', 'rejected', 'received', 'refunded') NOT NULL DEFAULT 'requested',
  reason VARCHAR(191) NOT NULL,
  details TEXT,
  refund_amount DECIMAL(10,2),
  admin_note TEXT,
  approved_at DATETIME,
  rejected_at DATETIME,
  refunded_at DATETIME,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_returns_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  CONSTRAINT fk_returns_customer FOREIGN KEY (customer_id) REFERENCES profiles(id) ON DELETE CASCADE,
  INDEX idx_returns_order (order_id),
  INDEX idx_returns_customer (customer_id),
  INDEX idx_returns_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS admin_audit_logs (
  id CHAR(36) PRIMARY KEY,
  admin_id CHAR(36) NOT NULL,
  action VARCHAR(80) NOT NULL,
  table_name VARCHAR(120) NOT NULL,
  record_id CHAR(36),
  metadata JSON,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_admin_audit_admin FOREIGN KEY (admin_id) REFERENCES profiles(id) ON DELETE CASCADE,
  INDEX idx_admin_audit_admin (admin_id),
  INDEX idx_admin_audit_table (table_name, record_id),
  INDEX idx_admin_audit_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS upload_files (
  id CHAR(36) PRIMARY KEY,
  owner_id CHAR(36) NOT NULL,
  scope ENUM('product', 'seller-logo', 'seller-banner', 'kyc', 'cms', 'category', 'payment-proof') NOT NULL,
  storage ENUM('public', 'private') NOT NULL,
  url TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  original_name VARCHAR(255) NOT NULL,
  mime_type VARCHAR(120) NOT NULL,
  size_bytes BIGINT UNSIGNED NOT NULL,
  review_status ENUM('pending', 'approved', 'manual_review') NOT NULL DEFAULT 'pending',
  retention_days INT,
  expires_at DATETIME,
  deleted_at DATETIME,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_upload_files_owner FOREIGN KEY (owner_id) REFERENCES profiles(id) ON DELETE CASCADE,
  INDEX idx_upload_files_owner_scope (owner_id, scope, created_at),
  INDEX idx_upload_files_scope_status (scope, review_status),
  INDEX idx_upload_files_expires (expires_at, deleted_at),
  INDEX idx_upload_files_deleted (deleted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS promotion_requests (
  id CHAR(36) PRIMARY KEY,
  seller_id CHAR(36) NOT NULL,
  product_id CHAR(36),
  request_type VARCHAR(80) NOT NULL DEFAULT 'seller_voucher',
  title VARCHAR(255) NOT NULL,
  details TEXT,
  discount_type VARCHAR(40),
  discount_value DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  min_order_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  max_discount_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  budget_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  start_at DATETIME,
  end_at DATETIME,
  status ENUM('pending', 'approved', 'active', 'rejected', 'ended') NOT NULL DEFAULT 'pending',
  approved_by CHAR(36),
  approved_at DATETIME,
  rejected_at DATETIME,
  rejection_reason TEXT,
  admin_note TEXT,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_promotion_requests_seller FOREIGN KEY (seller_id) REFERENCES seller_profiles(id) ON DELETE CASCADE,
  CONSTRAINT fk_promotion_requests_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL,
  CONSTRAINT fk_promotion_requests_admin FOREIGN KEY (approved_by) REFERENCES profiles(id) ON DELETE SET NULL,
  INDEX idx_promotion_requests_seller (seller_id),
  INDEX idx_promotion_requests_product (product_id),
  INDEX idx_promotion_requests_type_status (request_type, status),
  INDEX idx_promotion_requests_status_dates (status, start_at, end_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS marketing_campaigns (
  id CHAR(36) PRIMARY KEY,
  seller_id CHAR(36) NOT NULL,
  product_id CHAR(36),
  campaign_type VARCHAR(80) NOT NULL DEFAULT 'sponsored_products',
  name VARCHAR(255) NOT NULL,
  objective VARCHAR(80) NOT NULL DEFAULT 'traffic',
  placement VARCHAR(80) NOT NULL DEFAULT 'search_results',
  status ENUM('pending', 'approved', 'active', 'paused', 'rejected', 'ended') NOT NULL DEFAULT 'pending',
  daily_budget DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  total_budget DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  bid_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  spent_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  impressions INT NOT NULL DEFAULT 0,
  clicks INT NOT NULL DEFAULT 0,
  conversions INT NOT NULL DEFAULT 0,
  revenue DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  target_keywords TEXT,
  target_categories TEXT,
  admin_score INT NOT NULL DEFAULT 50,
  quality_score INT NOT NULL DEFAULT 50,
  seller_health_score INT NOT NULL DEFAULT 50,
  start_at DATETIME,
  end_at DATETIME,
  approved_by CHAR(36),
  approved_at DATETIME,
  rejected_at DATETIME,
  rejection_reason TEXT,
  admin_note TEXT,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_marketing_campaigns_seller FOREIGN KEY (seller_id) REFERENCES seller_profiles(id) ON DELETE CASCADE,
  CONSTRAINT fk_marketing_campaigns_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  CONSTRAINT fk_marketing_campaigns_admin FOREIGN KEY (approved_by) REFERENCES profiles(id) ON DELETE SET NULL,
  INDEX idx_marketing_campaigns_seller (seller_id),
  INDEX idx_marketing_campaigns_product (product_id),
  INDEX idx_marketing_campaigns_status (status, start_at, end_at),
  INDEX idx_marketing_campaigns_score (status, admin_score, bid_amount)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS marketing_ad_events (
  id CHAR(36) PRIMARY KEY,
  campaign_id CHAR(36) NOT NULL,
  product_id CHAR(36),
  seller_id CHAR(36) NOT NULL,
  event_type ENUM('impression', 'click', 'conversion') NOT NULL DEFAULT 'impression',
  cost DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  revenue DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  metadata JSON,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_marketing_events_campaign FOREIGN KEY (campaign_id) REFERENCES marketing_campaigns(id) ON DELETE CASCADE,
  CONSTRAINT fk_marketing_events_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL,
  CONSTRAINT fk_marketing_events_seller FOREIGN KEY (seller_id) REFERENCES seller_profiles(id) ON DELETE CASCADE,
  INDEX idx_marketing_events_campaign (campaign_id, event_type),
  INDEX idx_marketing_events_seller (seller_id, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT IGNORE INTO system_settings (id, `key`, value, description) VALUES
(UUID(), 'site_name', 'Mercato', 'Public marketplace name'),
(UUID(), 'site_currency_code', 'PKR', 'Currency code displayed across the marketplace'),
(UUID(), 'site_currency_symbol', 'Rs', 'Currency symbol displayed before marketplace prices'),
(UUID(), 'site_currency_rate', '1', 'Display conversion rate applied to base product prices'),
(UUID(), 'default_delivery_city', 'Karachi', 'Default customer delivery city shown in the header'),
(UUID(), 'seller_payout_hold_days', '2', 'Days after delivery before seller earnings become available'),
(UUID(), 'seller_campaign_slots_json', '[{"title":"Mid Month Mega Campaign","window":"Jun 15 - Jun 20","eligibility":"Approved products with stock above 10 units","discount":"5% - 20%","channel":"Homepage + category slots","type":"campaign","status":"active"},{"title":"Electronics Week","window":"Jun 22 - Jun 29","eligibility":"Electronics, computers and accessories","discount":"8% - 25%","channel":"Category campaign","type":"campaign","status":"active"},{"title":"Payday Deals","window":"Jul 01 - Jul 05","eligibility":"All active sellers with ready stock","discount":"Flat or percentage voucher","channel":"Campaign landing page","type":"campaign","status":"active"},{"title":"Flash Deal Rush","window":"Admin scheduled flash sale","eligibility":"Approved products with ready stock and competitive pricing","discount":"Limited-time flash discount","channel":"DrzFlash slot","type":"drzflash","status":"active"}]', 'Admin-created campaign invitations shown in Seller Marketing Center'),
(UUID(), 'homepage_hero_title', 'Everything your customers search for, all in one marketplace', 'Homepage hero title controlled by admin CMS'),
(UUID(), 'homepage_hero_subtitle', 'Discover trusted sellers, daily deals, fast order tracking and admin-approved products built for a serious multivendor store.', 'Homepage hero subtitle controlled by admin CMS'),
(UUID(), 'homepage_hero_cta_label', 'Shop Today''s Deals', 'Homepage hero CTA label controlled by admin CMS'),
(UUID(), 'homepage_hero_cta_href', '/deals', 'Homepage hero CTA link controlled by admin CMS'),
(UUID(), 'footer_about_text', 'Mercato connects customers with verified sellers, curated products, secure checkout and reliable support.', 'Footer about text controlled by admin CMS'),
(UUID(), 'footer_links_json', '[{"title":"Get to Know Us","links":[{"label":"About Mercato","href":"/about"},{"label":"Careers","href":"/careers"},{"label":"Blog","href":"/blog"},{"label":"Press Center","href":"/press"},{"label":"Investor Relations","href":"/investors"}]},{"title":"Make Money with Us","links":[{"label":"Sell on Mercato","href":"/seller-info"},{"label":"Seller Center","href":"/seller"},{"label":"Vendor Signup","href":"/seller/register"},{"label":"Advertise Products","href":"/seller/marketing-solutions"},{"label":"Fulfillment Services","href":"/seller/learn?view=fulfillment"}]},{"title":"Payment Products","links":[{"label":"Business Account","href":"/business"},{"label":"Shop with Points","href":"/rewards"},{"label":"Reload Balance","href":"/account/dashboard"},{"label":"Currency Converter","href":"/currency"},{"label":"Payment Help","href":"/help?topic=payments"}]},{"title":"Let Us Help You","links":[{"label":"Your Account","href":"/account/dashboard"},{"label":"Your Orders","href":"/account/orders"},{"label":"Shipping Rates","href":"/shipping"},{"label":"Returns & Replacements","href":"/returns"},{"label":"Help Center","href":"/help"}]}]', 'Editable footer column links as JSON'),
(UUID(), 'public_pages_json', '[{"slug":"terms","title":"Terms of Service","summary":"Marketplace rules for buyers, sellers, payments, delivery and returns.","lastUpdated":"June 2026","sections":[{"heading":"Acceptance of Terms","body":"By using this marketplace, buyers and sellers agree to platform rules, product approvals, payments, returns and account safety."},{"heading":"Seller Listings","body":"Products remain pending until admin approval. Admin can approve, reject, feature, suspend or remove listings."}]},{"slug":"privacy","title":"Privacy Policy","summary":"How account, order, seller KYC and payment data is handled.","lastUpdated":"June 2026","sections":[{"heading":"Information We Collect","body":"We collect account details, order activity, seller business information, KYC documents and support messages needed to operate the marketplace."},{"heading":"KYC Access","body":"Authorized admin staff can review seller CNIC, business documents and buyer KYC data where provided."}]},{"slug":"contact","title":"Contact Us","summary":"Reach marketplace support for buyer help, seller support, payments, returns and KYC questions.","lastUpdated":"June 2026","contact":{"email":"support@marketplace.com","phone":"+92 300 0000000","address":"Karachi, Pakistan","hours":"Monday - Saturday, 9:00 AM - 6:00 PM"},"sections":[{"heading":"Support Scope","body":"Use this page for order issues, seller onboarding, payment proof, return requests, KYC questions and technical support."}]},{"slug":"about","title":"About Mercato","summary":"A multivendor marketplace built for verified sellers, trusted products and reliable operations.","lastUpdated":"June 2026","sections":[{"heading":"Marketplace Mission","body":"Mercato helps customers discover products from verified sellers while keeping approvals, content, seller access and fulfillment workflows organized."}]}]', 'Editable public pages such as terms, privacy, contact and custom pages');

UPDATE products
SET status = 'inactive', is_featured = 0, is_deal = 0, deal_expires_at = NULL
WHERE id = '00000000-0000-4000-8000-000000000301'
  AND title = 'Wireless Headphones';
