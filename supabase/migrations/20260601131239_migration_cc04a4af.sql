-- ============================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE seller_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE carts ENABLE ROW LEVEL SECURITY;
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE wishlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE seller_earnings ENABLE ROW LEVEL SECURITY;
ALTER TABLE withdrawal_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE banners ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

-- ============================================
-- PROFILES POLICIES
-- ============================================
CREATE POLICY "profiles_select_own" ON profiles FOR SELECT USING (
  auth.uid() = id OR 
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "profiles_insert_own" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- ============================================
-- SELLER PROFILES POLICIES
-- ============================================
CREATE POLICY "seller_profiles_select_public" ON seller_profiles FOR SELECT USING (
  status = 'approved' OR 
  user_id = auth.uid() OR
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "seller_profiles_insert_own" ON seller_profiles FOR INSERT WITH CHECK (
  user_id = auth.uid()
);

CREATE POLICY "seller_profiles_update_own" ON seller_profiles FOR UPDATE USING (
  user_id = auth.uid() OR
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- ============================================
-- CATEGORIES POLICIES (Public read, admin write)
-- ============================================
CREATE POLICY "categories_select_public" ON categories FOR SELECT USING (true);

CREATE POLICY "categories_insert_admin" ON categories FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "categories_update_admin" ON categories FOR UPDATE USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "categories_delete_admin" ON categories FOR DELETE USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- ============================================
-- PRODUCTS POLICIES
-- ============================================
CREATE POLICY "products_select_public_approved" ON products FOR SELECT USING (
  status = 'approved' OR
  EXISTS (
    SELECT 1 FROM seller_profiles sp 
    WHERE sp.id = products.seller_id AND sp.user_id = auth.uid()
  ) OR
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "products_insert_seller" ON products FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM seller_profiles sp 
    WHERE sp.id = seller_id AND sp.user_id = auth.uid() AND sp.status = 'approved'
  )
);

CREATE POLICY "products_update_seller_or_admin" ON products FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM seller_profiles sp 
    WHERE sp.id = products.seller_id AND sp.user_id = auth.uid()
  ) OR
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "products_delete_seller" ON products FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM seller_profiles sp 
    WHERE sp.id = products.seller_id AND sp.user_id = auth.uid()
  )
);

-- ============================================
-- PRODUCT IMAGES POLICIES
-- ============================================
CREATE POLICY "product_images_select_public" ON product_images FOR SELECT USING (
  EXISTS (SELECT 1 FROM products p WHERE p.id = product_images.product_id AND p.status = 'approved') OR
  EXISTS (
    SELECT 1 FROM products p 
    JOIN seller_profiles sp ON p.seller_id = sp.id 
    WHERE p.id = product_images.product_id AND sp.user_id = auth.uid()
  ) OR
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "product_images_insert_seller" ON product_images FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM products p 
    JOIN seller_profiles sp ON p.seller_id = sp.id 
    WHERE p.id = product_id AND sp.user_id = auth.uid()
  )
);

CREATE POLICY "product_images_delete_seller" ON product_images FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM products p 
    JOIN seller_profiles sp ON p.seller_id = sp.id 
    WHERE p.id = product_images.product_id AND sp.user_id = auth.uid()
  )
);

-- ============================================
-- CART POLICIES
-- ============================================
CREATE POLICY "carts_select_own" ON carts FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "carts_insert_own" ON carts FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "carts_update_own" ON carts FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "carts_delete_own" ON carts FOR DELETE USING (user_id = auth.uid());

-- ============================================
-- CART ITEMS POLICIES
-- ============================================
CREATE POLICY "cart_items_select_own" ON cart_items FOR SELECT USING (
  EXISTS (SELECT 1 FROM carts WHERE carts.id = cart_items.cart_id AND carts.user_id = auth.uid())
);

CREATE POLICY "cart_items_insert_own" ON cart_items FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM carts WHERE carts.id = cart_id AND carts.user_id = auth.uid())
);

CREATE POLICY "cart_items_update_own" ON cart_items FOR UPDATE USING (
  EXISTS (SELECT 1 FROM carts WHERE carts.id = cart_items.cart_id AND carts.user_id = auth.uid())
);

CREATE POLICY "cart_items_delete_own" ON cart_items FOR DELETE USING (
  EXISTS (SELECT 1 FROM carts WHERE carts.id = cart_items.cart_id AND carts.user_id = auth.uid())
);

-- ============================================
-- WISHLIST POLICIES
-- ============================================
CREATE POLICY "wishlists_select_own" ON wishlists FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "wishlists_insert_own" ON wishlists FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "wishlists_delete_own" ON wishlists FOR DELETE USING (user_id = auth.uid());

-- ============================================
-- ORDERS POLICIES
-- ============================================
CREATE POLICY "orders_select_customer_seller_admin" ON orders FOR SELECT USING (
  customer_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM order_items oi
    JOIN seller_profiles sp ON oi.seller_id = sp.id
    WHERE oi.order_id = orders.id AND sp.user_id = auth.uid()
  ) OR
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "orders_insert_customer" ON orders FOR INSERT WITH CHECK (customer_id = auth.uid());

CREATE POLICY "orders_update_customer_admin" ON orders FOR UPDATE USING (
  customer_id = auth.uid() OR
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- ============================================
-- ORDER ITEMS POLICIES
-- ============================================
CREATE POLICY "order_items_select_related" ON order_items FOR SELECT USING (
  EXISTS (SELECT 1 FROM orders WHERE orders.id = order_items.order_id AND orders.customer_id = auth.uid()) OR
  EXISTS (SELECT 1 FROM seller_profiles WHERE seller_profiles.id = order_items.seller_id AND seller_profiles.user_id = auth.uid()) OR
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "order_items_insert_system" ON order_items FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM orders WHERE orders.id = order_id AND orders.customer_id = auth.uid())
);

-- ============================================
-- PAYMENTS POLICIES
-- ============================================
CREATE POLICY "payments_select_related" ON payments FOR SELECT USING (
  EXISTS (SELECT 1 FROM orders WHERE orders.id = payments.order_id AND orders.customer_id = auth.uid()) OR
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "payments_insert_system" ON payments FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM orders WHERE orders.id = order_id AND orders.customer_id = auth.uid())
);

-- ============================================
-- SELLER EARNINGS POLICIES
-- ============================================
CREATE POLICY "seller_earnings_select_own_or_admin" ON seller_earnings FOR SELECT USING (
  EXISTS (SELECT 1 FROM seller_profiles WHERE seller_profiles.id = seller_earnings.seller_id AND seller_profiles.user_id = auth.uid()) OR
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- ============================================
-- WITHDRAWAL REQUESTS POLICIES
-- ============================================
CREATE POLICY "withdrawal_requests_select_own_or_admin" ON withdrawal_requests FOR SELECT USING (
  EXISTS (SELECT 1 FROM seller_profiles WHERE seller_profiles.id = withdrawal_requests.seller_id AND seller_profiles.user_id = auth.uid()) OR
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "withdrawal_requests_insert_seller" ON withdrawal_requests FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM seller_profiles WHERE seller_profiles.id = seller_id AND seller_profiles.user_id = auth.uid())
);

CREATE POLICY "withdrawal_requests_update_admin" ON withdrawal_requests FOR UPDATE USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- ============================================
-- REVIEWS POLICIES
-- ============================================
CREATE POLICY "reviews_select_public" ON reviews FOR SELECT USING (true);

CREATE POLICY "reviews_insert_customer" ON reviews FOR INSERT WITH CHECK (
  user_id = auth.uid() AND
  EXISTS (
    SELECT 1 FROM orders o
    JOIN order_items oi ON o.id = oi.order_id
    WHERE o.customer_id = auth.uid() 
    AND oi.product_id = product_id
    AND o.status = 'delivered'
  )
);

CREATE POLICY "reviews_update_own" ON reviews FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "reviews_delete_own_or_admin" ON reviews FOR DELETE USING (
  user_id = auth.uid() OR
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- ============================================
-- COUPONS POLICIES
-- ============================================
CREATE POLICY "coupons_select_public" ON coupons FOR SELECT USING (is_active = true);

CREATE POLICY "coupons_all_admin" ON coupons FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- ============================================
-- BANNERS POLICIES
-- ============================================
CREATE POLICY "banners_select_public" ON banners FOR SELECT USING (is_active = true);

CREATE POLICY "banners_all_admin" ON banners FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- ============================================
-- SUPPORT TICKETS POLICIES
-- ============================================
CREATE POLICY "support_tickets_select_own_or_admin" ON support_tickets FOR SELECT USING (
  user_id = auth.uid() OR
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "support_tickets_insert_auth" ON support_tickets FOR INSERT WITH CHECK (
  user_id = auth.uid()
);

CREATE POLICY "support_tickets_update_own_or_admin" ON support_tickets FOR UPDATE USING (
  user_id = auth.uid() OR
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- ============================================
-- TICKET MESSAGES POLICIES
-- ============================================
CREATE POLICY "ticket_messages_select_related" ON ticket_messages FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM support_tickets 
    WHERE support_tickets.id = ticket_messages.ticket_id 
    AND (support_tickets.user_id = auth.uid() OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'))
  )
);

CREATE POLICY "ticket_messages_insert_related" ON ticket_messages FOR INSERT WITH CHECK (
  user_id = auth.uid() AND
  EXISTS (
    SELECT 1 FROM support_tickets 
    WHERE support_tickets.id = ticket_id 
    AND (support_tickets.user_id = auth.uid() OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'))
  )
);

-- ============================================
-- SYSTEM SETTINGS POLICIES
-- ============================================
CREATE POLICY "system_settings_select_public" ON system_settings FOR SELECT USING (true);

CREATE POLICY "system_settings_all_admin" ON system_settings FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- ============================================
-- TRIGGERS & FUNCTIONS
-- ============================================

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, role)
  VALUES (NEW.id, NEW.email, 'customer');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- Function to update product ratings
CREATE OR REPLACE FUNCTION update_product_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE products
  SET 
    rating = (SELECT COALESCE(AVG(rating), 0) FROM reviews WHERE product_id = NEW.product_id),
    total_reviews = (SELECT COUNT(*) FROM reviews WHERE product_id = NEW.product_id)
  WHERE id = NEW.product_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_product_rating_trigger ON reviews;
CREATE TRIGGER update_product_rating_trigger
  AFTER INSERT OR UPDATE OR DELETE ON reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_product_rating();

-- Function to update seller ratings
CREATE OR REPLACE FUNCTION update_seller_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE seller_profiles
  SET 
    rating = (
      SELECT COALESCE(AVG(r.rating), 0)
      FROM reviews r
      JOIN products p ON r.product_id = p.id
      WHERE p.seller_id = (SELECT seller_id FROM products WHERE id = NEW.product_id)
    ),
    total_reviews = (
      SELECT COUNT(*)
      FROM reviews r
      JOIN products p ON r.product_id = p.id
      WHERE p.seller_id = (SELECT seller_id FROM products WHERE id = NEW.product_id)
    )
  WHERE id = (SELECT seller_id FROM products WHERE id = NEW.product_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_seller_rating_trigger ON reviews;
CREATE TRIGGER update_seller_rating_trigger
  AFTER INSERT OR UPDATE OR DELETE ON reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_seller_rating();