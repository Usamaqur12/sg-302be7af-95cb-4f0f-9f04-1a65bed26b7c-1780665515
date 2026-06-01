-- ============================================
-- MARKETPLACE DATABASE SCHEMA
-- ============================================

-- Create enum types
CREATE TYPE user_role AS ENUM ('customer', 'seller', 'admin');
CREATE TYPE seller_status AS ENUM ('pending', 'approved', 'rejected', 'suspended');
CREATE TYPE product_status AS ENUM ('draft', 'pending', 'approved', 'rejected', 'inactive');
CREATE TYPE order_status AS ENUM ('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded');
CREATE TYPE payment_status AS ENUM ('pending', 'completed', 'failed', 'refunded');
CREATE TYPE withdrawal_status AS ENUM ('pending', 'approved', 'rejected', 'completed');
CREATE TYPE ticket_status AS ENUM ('open', 'in_progress', 'resolved', 'closed');

-- Update profiles table to include role
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS role user_role DEFAULT 'customer';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS phone text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true;

-- ============================================
-- SELLER PROFILES
-- ============================================
CREATE TABLE seller_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  business_name text NOT NULL,
  business_description text,
  business_address text,
  business_phone text,
  business_email text,
  logo_url text,
  banner_url text,
  kyc_document_url text,
  kyc_document_type text,
  tax_id text,
  bank_account_name text,
  bank_account_number text,
  bank_name text,
  status seller_status DEFAULT 'pending',
  rejection_reason text,
  commission_rate decimal(5,2) DEFAULT 15.00,
  total_sales decimal(12,2) DEFAULT 0,
  total_earnings decimal(12,2) DEFAULT 0,
  available_balance decimal(12,2) DEFAULT 0,
  rating decimal(3,2) DEFAULT 0,
  total_reviews integer DEFAULT 0,
  verified_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE(user_id)
);

-- ============================================
-- CATEGORIES
-- ============================================
CREATE TABLE categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text,
  image_url text,
  parent_id uuid REFERENCES categories(id) ON DELETE CASCADE,
  display_order integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- ============================================
-- PRODUCTS
-- ============================================
CREATE TABLE products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id uuid NOT NULL REFERENCES seller_profiles(id) ON DELETE CASCADE,
  category_id uuid NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
  title text NOT NULL,
  slug text NOT NULL,
  description text,
  specifications jsonb,
  price decimal(10,2) NOT NULL,
  compare_at_price decimal(10,2),
  cost_per_item decimal(10,2),
  sku text,
  barcode text,
  stock_quantity integer DEFAULT 0,
  low_stock_threshold integer DEFAULT 10,
  status product_status DEFAULT 'draft',
  rejection_reason text,
  is_featured boolean DEFAULT false,
  is_deal boolean DEFAULT false,
  deal_expires_at timestamp with time zone,
  views_count integer DEFAULT 0,
  sales_count integer DEFAULT 0,
  rating decimal(3,2) DEFAULT 0,
  total_reviews integer DEFAULT 0,
  approved_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

CREATE INDEX idx_products_seller ON products(seller_id);
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_status ON products(status);
CREATE INDEX idx_products_slug ON products(slug);

-- ============================================
-- PRODUCT IMAGES
-- ============================================
CREATE TABLE product_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  url text NOT NULL,
  alt_text text,
  display_order integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now()
);

CREATE INDEX idx_product_images_product ON product_images(product_id);

-- ============================================
-- CART
-- ============================================
CREATE TABLE carts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE(user_id)
);

CREATE TABLE cart_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cart_id uuid NOT NULL REFERENCES carts(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantity integer NOT NULL DEFAULT 1,
  price_at_addition decimal(10,2) NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE(cart_id, product_id)
);

-- ============================================
-- WISHLISTS
-- ============================================
CREATE TABLE wishlists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(user_id, product_id)
);

-- ============================================
-- ORDERS
-- ============================================
CREATE TABLE orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number text NOT NULL UNIQUE,
  customer_id uuid NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  status order_status DEFAULT 'pending',
  subtotal decimal(10,2) NOT NULL,
  tax decimal(10,2) DEFAULT 0,
  shipping_cost decimal(10,2) DEFAULT 0,
  discount decimal(10,2) DEFAULT 0,
  total decimal(10,2) NOT NULL,
  
  shipping_full_name text NOT NULL,
  shipping_phone text NOT NULL,
  shipping_address text NOT NULL,
  shipping_city text NOT NULL,
  shipping_state text NOT NULL,
  shipping_postal_code text NOT NULL,
  shipping_country text NOT NULL,
  
  billing_same_as_shipping boolean DEFAULT true,
  billing_full_name text,
  billing_address text,
  billing_city text,
  billing_state text,
  billing_postal_code text,
  billing_country text,
  
  notes text,
  tracking_number text,
  shipped_at timestamp with time zone,
  delivered_at timestamp with time zone,
  cancelled_at timestamp with time zone,
  cancellation_reason text,
  
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

CREATE INDEX idx_orders_customer ON orders(customer_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_number ON orders(order_number);

-- ============================================
-- ORDER ITEMS
-- ============================================
CREATE TABLE order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  seller_id uuid NOT NULL REFERENCES seller_profiles(id) ON DELETE RESTRICT,
  product_title text NOT NULL,
  product_image text,
  quantity integer NOT NULL,
  price decimal(10,2) NOT NULL,
  subtotal decimal(10,2) NOT NULL,
  commission_rate decimal(5,2) NOT NULL,
  commission_amount decimal(10,2) NOT NULL,
  seller_earnings decimal(10,2) NOT NULL,
  created_at timestamp with time zone DEFAULT now()
);

CREATE INDEX idx_order_items_order ON order_items(order_id);
CREATE INDEX idx_order_items_seller ON order_items(seller_id);

-- ============================================
-- PAYMENTS
-- ============================================
CREATE TABLE payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  payment_method text NOT NULL,
  transaction_id text,
  amount decimal(10,2) NOT NULL,
  status payment_status DEFAULT 'pending',
  paid_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(order_id)
);

-- ============================================
-- SELLER EARNINGS & WITHDRAWALS
-- ============================================
CREATE TABLE seller_earnings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id uuid NOT NULL REFERENCES seller_profiles(id) ON DELETE CASCADE,
  order_item_id uuid NOT NULL REFERENCES order_items(id) ON DELETE CASCADE,
  amount decimal(10,2) NOT NULL,
  commission_amount decimal(10,2) NOT NULL,
  status text DEFAULT 'pending',
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE withdrawal_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id uuid NOT NULL REFERENCES seller_profiles(id) ON DELETE CASCADE,
  amount decimal(10,2) NOT NULL,
  status withdrawal_status DEFAULT 'pending',
  requested_at timestamp with time zone DEFAULT now(),
  approved_at timestamp with time zone,
  rejected_at timestamp with time zone,
  completed_at timestamp with time zone,
  rejection_reason text,
  approved_by uuid REFERENCES profiles(id),
  notes text,
  created_at timestamp with time zone DEFAULT now()
);

-- ============================================
-- REVIEWS & RATINGS
-- ============================================
CREATE TABLE reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  order_id uuid REFERENCES orders(id) ON DELETE SET NULL,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title text,
  comment text,
  is_verified_purchase boolean DEFAULT false,
  helpful_count integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE(product_id, user_id, order_id)
);

CREATE INDEX idx_reviews_product ON reviews(product_id);
CREATE INDEX idx_reviews_user ON reviews(user_id);

-- ============================================
-- COUPONS
-- ============================================
CREATE TABLE coupons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  description text,
  discount_type text NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value decimal(10,2) NOT NULL,
  min_purchase_amount decimal(10,2),
  max_discount_amount decimal(10,2),
  usage_limit integer,
  used_count integer DEFAULT 0,
  valid_from timestamp with time zone,
  valid_until timestamp with time zone,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now()
);

-- ============================================
-- BANNERS
-- ============================================
CREATE TABLE banners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  image_url text NOT NULL,
  link_url text,
  display_order integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now()
);

-- ============================================
-- SUPPORT TICKETS
-- ============================================
CREATE TABLE support_tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_number text NOT NULL UNIQUE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  order_id uuid REFERENCES orders(id) ON DELETE SET NULL,
  subject text NOT NULL,
  description text NOT NULL,
  category text,
  priority text DEFAULT 'medium',
  status ticket_status DEFAULT 'open',
  assigned_to uuid REFERENCES profiles(id),
  resolved_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE ticket_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id uuid NOT NULL REFERENCES support_tickets(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  message text NOT NULL,
  is_internal boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now()
);

-- ============================================
-- SYSTEM SETTINGS
-- ============================================
CREATE TABLE system_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL UNIQUE,
  value jsonb NOT NULL,
  description text,
  updated_at timestamp with time zone DEFAULT now()
);

-- Insert default commission rate
INSERT INTO system_settings (key, value, description) VALUES
('default_commission_rate', '15.00', 'Default commission percentage for new sellers'),
('tax_rate', '0.00', 'Default tax rate percentage'),
('shipping_rate', '0.00', 'Default shipping rate');