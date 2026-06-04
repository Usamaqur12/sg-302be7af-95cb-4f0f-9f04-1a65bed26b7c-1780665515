-- =====================================================
-- CREATE DEMO ACCOUNTS FOR TESTING
-- =====================================================
-- This migration creates 4 demo accounts:
-- 1. Admin (admin@marketplace.com)
-- 2. Approved Seller (seller@marketplace.com)
-- 3. Pending Seller (pending@marketplace.com)
-- 4. Customer (customer@marketplace.com)

-- Note: In production, these should be created through the signup flow
-- For development/testing, we're creating them directly

-- 1. ADMIN ACCOUNT
-- Email: admin@marketplace.com
-- Password: Admin@123
-- Insert into auth.users and profiles
DO $$
DECLARE
  admin_user_id UUID;
BEGIN
  -- Check if admin already exists
  SELECT id INTO admin_user_id FROM auth.users WHERE email = 'admin@marketplace.com';
  
  IF admin_user_id IS NULL THEN
    -- Create admin user
    INSERT INTO auth.users (
      id,
      email,
      encrypted_password,
      email_confirmed_at,
      created_at,
      updated_at,
      raw_app_meta_data,
      raw_user_meta_data
    ) VALUES (
      gen_random_uuid(),
      'admin@marketplace.com',
      crypt('Admin@123', gen_salt('bf')),
      NOW(),
      NOW(),
      NOW(),
      '{"provider":"email","providers":["email"]}',
      '{"full_name":"Admin User","role":"admin"}'
    )
    RETURNING id INTO admin_user_id;

    -- Create profile
    INSERT INTO profiles (id, email, full_name, role)
    VALUES (admin_user_id, 'admin@marketplace.com', 'Admin User', 'admin');
  END IF;
END $$;

-- 2. APPROVED SELLER ACCOUNT
-- Email: seller@marketplace.com
-- Password: Seller@123
DO $$
DECLARE
  seller_user_id UUID;
BEGIN
  SELECT id INTO seller_user_id FROM auth.users WHERE email = 'seller@marketplace.com';
  
  IF seller_user_id IS NULL THEN
    INSERT INTO auth.users (
      id,
      email,
      encrypted_password,
      email_confirmed_at,
      created_at,
      updated_at,
      raw_app_meta_data,
      raw_user_meta_data
    ) VALUES (
      gen_random_uuid(),
      'seller@marketplace.com',
      crypt('Seller@123', gen_salt('bf')),
      NOW(),
      NOW(),
      NOW(),
      '{"provider":"email","providers":["email"]}',
      '{"full_name":"Approved Seller","role":"vendor"}'
    )
    RETURNING id INTO seller_user_id;

    INSERT INTO profiles (id, email, full_name, role, phone)
    VALUES (seller_user_id, 'seller@marketplace.com', 'Approved Seller', 'vendor', '+1-555-0001');

    -- Create approved seller profile
    INSERT INTO seller_profiles (
      user_id,
      business_name,
      business_description,
      business_type,
      business_address,
      commission_rate,
      bank_account_number,
      bank_name,
      bank_routing_number
    ) VALUES (
      seller_user_id,
      'TechGear Store',
      'Premium electronics and gadgets',
      'company',
      '123 Market St, San Francisco, CA 94103, USA',
      12,
      '****1234',
      'Chase Bank',
      '021000021'
    );
  END IF;
END $$;

-- 3. PENDING SELLER ACCOUNT
-- Email: pending@marketplace.com
-- Password: Seller@123
DO $$
DECLARE
  pending_user_id UUID;
BEGIN
  SELECT id INTO pending_user_id FROM auth.users WHERE email = 'pending@marketplace.com';
  
  IF pending_user_id IS NULL THEN
    INSERT INTO auth.users (
      id,
      email,
      encrypted_password,
      email_confirmed_at,
      created_at,
      updated_at,
      raw_app_meta_data,
      raw_user_meta_data
    ) VALUES (
      gen_random_uuid(),
      'pending@marketplace.com',
      crypt('Seller@123', gen_salt('bf')),
      NOW(),
      NOW(),
      NOW(),
      '{"provider":"email","providers":["email"]}',
      '{"full_name":"Pending Seller","role":"vendor"}'
    )
    RETURNING id INTO pending_user_id;

    INSERT INTO profiles (id, email, full_name, role, phone)
    VALUES (pending_user_id, 'pending@marketplace.com', 'Pending Seller', 'vendor', '+1-555-0002');

    INSERT INTO seller_profiles (
      user_id,
      business_name,
      business_description,
      business_type,
      business_address,
      commission_rate,
      bank_account_number,
      bank_name
    ) VALUES (
      pending_user_id,
      'Gadget Paradise',
      'Your one-stop shop for latest tech',
      'individual',
      '456 Tech Ave, Austin, TX 78701, USA',
      12,
      '****5678',
      'Bank of America'
    );
  END IF;
END $$;

-- 4. CUSTOMER ACCOUNT
-- Email: customer@marketplace.com
-- Password: Customer@123
DO $$
DECLARE
  customer_user_id UUID;
BEGIN
  SELECT id INTO customer_user_id FROM auth.users WHERE email = 'customer@marketplace.com';
  
  IF customer_user_id IS NULL THEN
    INSERT INTO auth.users (
      id,
      email,
      encrypted_password,
      email_confirmed_at,
      created_at,
      updated_at,
      raw_app_meta_data,
      raw_user_meta_data
    ) VALUES (
      gen_random_uuid(),
      'customer@marketplace.com',
      crypt('Customer@123', gen_salt('bf')),
      NOW(),
      NOW(),
      NOW(),
      '{"provider":"email","providers":["email"]}',
      '{"full_name":"John Customer","role":"customer"}'
    )
    RETURNING id INTO customer_user_id;

    INSERT INTO profiles (id, email, full_name, role, phone)
    VALUES (customer_user_id, 'customer@marketplace.com', 'John Customer', 'customer', '+1-555-0003');
  END IF;
END $$;

-- =====================================================
-- DEMO ACCOUNTS CREATED
-- =====================================================
-- Login credentials:
-- Admin: admin@marketplace.com / Admin@123
-- Seller (Approved): seller@marketplace.com / Seller@123
-- Seller (Pending): pending@marketplace.com / Seller@123
-- Customer: customer@marketplace.com / Customer@123