# Database Schema Documentation

## Overview
Complete database schema for the multi-vendor marketplace with 20+ tables, relationships, indexes, and Row-Level Security policies.

## Entity Relationship Diagram

```
profiles (users)
    ↓ (1:1)
seller_profiles
    ↓ (1:N)
products ← categories
    ↓ (1:N)
product_images
    ↓
order_items → orders ← profiles
    ↓              ↓
payments      order_status_history
```

## Tables

### 1. profiles
User accounts with role-based access.

```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  phone TEXT,
  role TEXT CHECK (role IN ('customer', 'seller', 'admin')) DEFAULT 'customer',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Indexes:**
- `idx_profiles_email` on email
- `idx_profiles_role` on role

**RLS Policies:**
- Users can read their own profile
- Users can update their own profile
- Admins can read all profiles

---

### 2. seller_profiles
Extended information for sellers.

```sql
CREATE TABLE seller_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
  business_name TEXT NOT NULL,
  business_description TEXT,
  business_address TEXT,
  email TEXT,
  phone TEXT,
  tax_id TEXT,
  bank_account_number TEXT,
  bank_name TEXT,
  bank_routing_number TEXT,
  status TEXT CHECK (status IN ('pending', 'approved', 'rejected', 'suspended')) DEFAULT 'pending',
  commission_rate DECIMAL(5,2) DEFAULT 10.00,
  rating DECIMAL(3,2) DEFAULT 0.00,
  total_reviews INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Indexes:**
- `idx_seller_profiles_user_id` on user_id
- `idx_seller_profiles_status` on status

**RLS Policies:**
- Seller can read/update their own profile
- Admin can read/update all seller profiles
- Customers can read approved seller profiles

---

### 3. categories
Hierarchical product categories.

```sql
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  parent_id UUID REFERENCES categories(id) ON DELETE CASCADE,
  image_url TEXT,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Indexes:**
- `idx_categories_slug` on slug
- `idx_categories_parent_id` on parent_id

**RLS Policies:**
- Public read access for active categories
- Admin-only write access

---

### 4. products
Product listings from sellers.

```sql
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID REFERENCES seller_profiles(id) ON DELETE CASCADE,
  category_id UUID REFERENCES categories(id) ON DELETE RESTRICT,
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL CHECK (price >= 0),
  compare_at_price DECIMAL(10,2) CHECK (compare_at_price >= price),
  cost_per_item DECIMAL(10,2),
  sku TEXT,
  barcode TEXT,
  stock_quantity INTEGER DEFAULT 0 CHECK (stock_quantity >= 0),
  weight DECIMAL(10,2),
  status TEXT CHECK (status IN ('draft', 'pending', 'approved', 'rejected')) DEFAULT 'draft',
  rating DECIMAL(3,2) DEFAULT 0.00,
  total_reviews INTEGER DEFAULT 0,
  total_sales INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Indexes:**
- `idx_products_seller_id` on seller_id
- `idx_products_category_id` on category_id
- `idx_products_status` on status
- `idx_products_slug` on slug

**RLS Policies:**
- Public read for approved products
- Seller can CRUD their own products
- Admin can read/update all products

---

### 5. product_images
Image gallery for products.

```sql
CREATE TABLE product_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  alt_text TEXT,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Indexes:**
- `idx_product_images_product_id` on product_id

**RLS Policies:**
- Public read for images of approved products
- Seller can manage images for their products

---

### 6. carts
Shopping carts for customers.

```sql
CREATE TABLE carts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**RLS Policies:**
- User can only access their own cart

---

### 7. cart_items
Items in shopping carts.

```sql
CREATE TABLE cart_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cart_id UUID REFERENCES carts(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  price_at_addition DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(cart_id, product_id)
);
```

**Indexes:**
- `idx_cart_items_cart_id` on cart_id
- `idx_cart_items_product_id` on product_id

**RLS Policies:**
- User can manage items in their own cart

---

### 8. orders
Customer orders.

```sql
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number TEXT UNIQUE NOT NULL,
  customer_id UUID REFERENCES profiles(id) ON DELETE RESTRICT,
  subtotal DECIMAL(10,2) NOT NULL,
  tax DECIMAL(10,2) DEFAULT 0,
  shipping_cost DECIMAL(10,2) DEFAULT 0,
  discount DECIMAL(10,2) DEFAULT 0,
  total DECIMAL(10,2) NOT NULL,
  status TEXT CHECK (status IN (
    'pending', 'processing', 'shipped', 'delivered', 
    'cancelled', 'refunded', 'failed'
  )) DEFAULT 'pending',
  shipping_full_name TEXT NOT NULL,
  shipping_phone TEXT NOT NULL,
  shipping_address TEXT NOT NULL,
  shipping_city TEXT NOT NULL,
  shipping_state TEXT NOT NULL,
  shipping_postal_code TEXT NOT NULL,
  shipping_country TEXT NOT NULL,
  billing_same_as_shipping BOOLEAN DEFAULT TRUE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Indexes:**
- `idx_orders_customer_id` on customer_id
- `idx_orders_status` on status
- `idx_orders_order_number` on order_number

**RLS Policies:**
- Customer can read their own orders
- Seller can read orders containing their products
- Admin can read all orders

---

### 9. order_items
Line items in orders with commission tracking.

```sql
CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE RESTRICT,
  seller_id UUID REFERENCES seller_profiles(id) ON DELETE RESTRICT,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  price DECIMAL(10,2) NOT NULL,
  subtotal DECIMAL(10,2) NOT NULL,
  commission_rate DECIMAL(5,2) NOT NULL,
  commission_amount DECIMAL(10,2) NOT NULL,
  seller_earnings DECIMAL(10,2) NOT NULL,
  product_title TEXT NOT NULL,
  product_image TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Indexes:**
- `idx_order_items_order_id` on order_id
- `idx_order_items_seller_id` on seller_id
- `idx_order_items_product_id` on product_id

**RLS Policies:**
- Customer can read items in their orders
- Seller can read items in orders for their products
- Admin can read all order items

---

### 10. payments
Payment records.

```sql
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  payment_method TEXT NOT NULL,
  transaction_id TEXT,
  status TEXT CHECK (status IN ('pending', 'completed', 'failed', 'refunded')) DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Indexes:**
- `idx_payments_order_id` on order_id
- `idx_payments_transaction_id` on transaction_id

**RLS Policies:**
- Customer can read payments for their orders
- Admin can read all payments

---

### 11. reviews
Product reviews from customers.

```sql
CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  verified_purchase BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(product_id, user_id, order_id)
);
```

**Indexes:**
- `idx_reviews_product_id` on product_id
- `idx_reviews_user_id` on user_id

**RLS Policies:**
- Public read for all reviews
- User can create review for purchased products
- User can update/delete their own reviews

---

### 12. wishlists
Saved products for customers.

```sql
CREATE TABLE wishlists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, product_id)
);
```

**RLS Policies:**
- User can manage their own wishlist

---

### 13. withdrawal_requests
Seller payout requests.

```sql
CREATE TABLE withdrawal_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID REFERENCES seller_profiles(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
  status TEXT CHECK (status IN ('pending', 'completed', 'rejected')) DEFAULT 'pending',
  notes TEXT,
  admin_notes TEXT,
  completed_at TIMESTAMPTZ,
  rejected_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Indexes:**
- `idx_withdrawal_requests_seller_id` on seller_id
- `idx_withdrawal_requests_status` on status

**RLS Policies:**
- Seller can create requests and view their own
- Admin can read/update all requests

---

### 14. seller_earnings
Earnings tracking for sellers (aggregated from order_items).

```sql
CREATE TABLE seller_earnings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID REFERENCES seller_profiles(id) ON DELETE CASCADE,
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  commission_amount DECIMAL(10,2) NOT NULL,
  net_amount DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Indexes:**
- `idx_seller_earnings_seller_id` on seller_id

**RLS Policies:**
- Seller can read their own earnings
- Admin can read all earnings

---

### 15. support_tickets
Customer support system.

```sql
CREATE TABLE support_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')) DEFAULT 'open',
  priority TEXT CHECK (priority IN ('low', 'medium', 'high', 'urgent')) DEFAULT 'medium',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**RLS Policies:**
- User can create and read their own tickets
- Admin can read/update all tickets

---

### 16. coupons
Discount codes.

```sql
CREATE TABLE coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  description TEXT,
  discount_type TEXT CHECK (discount_type IN ('percentage', 'fixed')) NOT NULL,
  discount_value DECIMAL(10,2) NOT NULL,
  min_purchase_amount DECIMAL(10,2) DEFAULT 0,
  max_uses INTEGER,
  times_used INTEGER DEFAULT 0,
  valid_from TIMESTAMPTZ DEFAULT NOW(),
  valid_until TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**RLS Policies:**
- Public read for active coupons
- Admin-only write access

---

### 17. banners
Homepage promotional banners.

```sql
CREATE TABLE banners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  image_url TEXT NOT NULL,
  link_url TEXT,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  valid_from TIMESTAMPTZ DEFAULT NOW(),
  valid_until TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**RLS Policies:**
- Public read for active banners
- Admin-only write access

---

### 18. system_settings
Platform configuration.

```sql
CREATE TABLE system_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  description TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Default Settings:**
- `commission_rate`: 10.00 (global commission percentage)
- `tax_rate`: 0.00 (default tax rate)
- `shipping_rate`: 0.00 (default shipping rate)

**RLS Policies:**
- Admin-only access

---

## Database Triggers

### 1. update_updated_at_column
Automatically updates `updated_at` timestamp on record modification.

```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

Applied to: profiles, products, orders, seller_profiles

---

### 2. update_product_rating
Recalculates product rating when reviews are added/updated.

```sql
CREATE OR REPLACE FUNCTION update_product_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE products
  SET rating = (
    SELECT COALESCE(AVG(rating), 0)
    FROM reviews
    WHERE product_id = NEW.product_id
  ),
  total_reviews = (
    SELECT COUNT(*)
    FROM reviews
    WHERE product_id = NEW.product_id
  )
  WHERE id = NEW.product_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

---

### 3. update_seller_rating
Recalculates seller rating based on product reviews.

```sql
CREATE OR REPLACE FUNCTION update_seller_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE seller_profiles
  SET rating = (
    SELECT COALESCE(AVG(r.rating), 0)
    FROM reviews r
    JOIN products p ON r.product_id = p.id
    WHERE p.seller_id = (
      SELECT seller_id FROM products WHERE id = NEW.product_id
    )
  ),
  total_reviews = (
    SELECT COUNT(*)
    FROM reviews r
    JOIN products p ON r.product_id = p.id
    WHERE p.seller_id = (
      SELECT seller_id FROM products WHERE id = NEW.product_id
    )
  )
  WHERE id = (SELECT seller_id FROM products WHERE id = NEW.product_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

---

## Performance Optimization

### Indexes Summary
- Foreign key columns indexed for join performance
- Status columns indexed for filtering
- Unique constraints on email, slug, order_number
- Composite indexes on frequently queried combinations

### Query Optimization
- Use `SELECT` with specific columns instead of `SELECT *`
- Implement pagination with `LIMIT` and `OFFSET`
- Use `JOIN` instead of nested queries when possible
- Leverage RLS policies for automatic filtering

### Caching Strategy
- Redis caching for frequently accessed data (future)
- Product catalog caching
- Category tree caching
- User session caching