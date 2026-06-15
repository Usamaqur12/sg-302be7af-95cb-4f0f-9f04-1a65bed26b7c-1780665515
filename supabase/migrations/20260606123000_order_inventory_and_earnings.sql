-- Keep inventory changes atomic with order item creation.
CREATE OR REPLACE FUNCTION public.reserve_product_inventory()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.products
  SET
    stock_quantity = COALESCE(stock_quantity, 0) - NEW.quantity,
    sales_count = COALESCE(sales_count, 0) + NEW.quantity
  WHERE id = NEW.product_id
    AND status = 'approved'
    AND COALESCE(stock_quantity, 0) >= NEW.quantity;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Product is unavailable or has insufficient stock';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS reserve_product_inventory_trigger ON public.order_items;
CREATE TRIGGER reserve_product_inventory_trigger
  BEFORE INSERT ON public.order_items
  FOR EACH ROW
  EXECUTE FUNCTION public.reserve_product_inventory();

-- Restore stock when an order is cancelled before fulfillment.
CREATE OR REPLACE FUNCTION public.restore_cancelled_order_inventory()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'cancelled'
    AND OLD.status IS DISTINCT FROM 'cancelled'
    AND OLD.status NOT IN ('delivered', 'refunded')
  THEN
    UPDATE public.products AS product
    SET
      stock_quantity = COALESCE(product.stock_quantity, 0) + item.quantity,
      sales_count = GREATEST(COALESCE(product.sales_count, 0) - item.quantity, 0)
    FROM public.order_items AS item
    WHERE item.order_id = NEW.id
      AND product.id = item.product_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS restore_cancelled_order_inventory_trigger ON public.orders;
CREATE TRIGGER restore_cancelled_order_inventory_trigger
  AFTER UPDATE OF status ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.restore_cancelled_order_inventory();

-- Credit seller balances once, when an order first reaches delivered.
CREATE OR REPLACE FUNCTION public.credit_delivered_order_earnings()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'delivered' AND OLD.status IS DISTINCT FROM 'delivered' THEN
    UPDATE public.seller_profiles AS seller
    SET
      total_sales = COALESCE(seller.total_sales, 0) + totals.gross_sales,
      total_earnings = COALESCE(seller.total_earnings, 0) + totals.earnings,
      available_balance = COALESCE(seller.available_balance, 0) + totals.earnings
    FROM (
      SELECT
        seller_id,
        SUM(subtotal) AS gross_sales,
        SUM(seller_earnings) AS earnings
      FROM public.order_items
      WHERE order_id = NEW.id
      GROUP BY seller_id
    ) AS totals
    WHERE seller.id = totals.seller_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS credit_delivered_order_earnings_trigger ON public.orders;
CREATE TRIGGER credit_delivered_order_earnings_trigger
  AFTER UPDATE OF status ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.credit_delivered_order_earnings();

-- Set order milestone timestamps in one place.
CREATE OR REPLACE FUNCTION public.set_order_status_timestamps()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'shipped' AND OLD.status IS DISTINCT FROM 'shipped' THEN
    NEW.shipped_at = COALESCE(NEW.shipped_at, NOW());
  ELSIF NEW.status = 'delivered' AND OLD.status IS DISTINCT FROM 'delivered' THEN
    NEW.delivered_at = COALESCE(NEW.delivered_at, NOW());
  ELSIF NEW.status = 'cancelled' AND OLD.status IS DISTINCT FROM 'cancelled' THEN
    NEW.cancelled_at = COALESCE(NEW.cancelled_at, NOW());
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

DROP TRIGGER IF EXISTS set_order_status_timestamps_trigger ON public.orders;
CREATE TRIGGER set_order_status_timestamps_trigger
  BEFORE UPDATE OF status ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.set_order_status_timestamps();

-- Sellers and admins can move related orders through fulfillment statuses.
DROP POLICY IF EXISTS "orders_update_customer_admin" ON public.orders;
CREATE POLICY "orders_update_seller_admin"
ON public.orders
FOR UPDATE
USING (
  EXISTS (
    SELECT 1
    FROM public.order_items AS item
    JOIN public.seller_profiles AS seller ON seller.id = item.seller_id
    WHERE item.order_id = orders.id
      AND seller.user_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = auth.uid()
      AND role = 'admin'
  )
);

-- Reserve available balance as soon as a withdrawal is requested.
CREATE OR REPLACE FUNCTION public.reserve_withdrawal_balance()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.seller_profiles
  SET available_balance = COALESCE(available_balance, 0) - NEW.amount
  WHERE id = NEW.seller_id
    AND NEW.amount > 0
    AND COALESCE(available_balance, 0) >= NEW.amount;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Insufficient available balance';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS reserve_withdrawal_balance_trigger ON public.withdrawal_requests;
CREATE TRIGGER reserve_withdrawal_balance_trigger
  BEFORE INSERT ON public.withdrawal_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.reserve_withdrawal_balance();

-- Return reserved funds when an admin rejects a withdrawal.
CREATE OR REPLACE FUNCTION public.restore_rejected_withdrawal_balance()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'rejected' AND OLD.status IS DISTINCT FROM 'rejected' THEN
    UPDATE public.seller_profiles
    SET available_balance = COALESCE(available_balance, 0) + NEW.amount
    WHERE id = NEW.seller_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS restore_rejected_withdrawal_balance_trigger ON public.withdrawal_requests;
CREATE TRIGGER restore_rejected_withdrawal_balance_trigger
  AFTER UPDATE OF status ON public.withdrawal_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.restore_rejected_withdrawal_balance();
