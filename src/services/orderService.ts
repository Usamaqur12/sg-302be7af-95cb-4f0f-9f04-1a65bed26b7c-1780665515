import { supabase } from "@/integrations/supabase/client";

export const orderService = {
  /**
   * Create new order
   */
  createOrder: async (orderData: {
    customer_id: string;
    items: Array<{
      product_id: string;
      variant_id?: string;
      quantity: number;
    }>;
    shipping_full_name: string;
    shipping_email: string;
    shipping_phone: string;
    shipping_street: string;
    shipping_city: string;
    shipping_state: string;
    shipping_zip_code: string;
    shipping_country: string;
    payment_method: string;
    customer_notes?: string;
  }) => {
    // Fetch products to calculate prices
    const productIds = orderData.items.map((item) => item.product_id);
    const { data: products, error: productsError } = await supabase
      .from("products")
      .select("*, seller:seller_profiles(id, commission_rate)")
      .in("id", productIds);

    if (productsError) throw productsError;

    // Calculate totals
    let subtotal = 0;
    const orderItems = orderData.items.map((item) => {
      const product = products.find((p) => p.id === item.product_id);
      if (!product) throw new Error(`Product ${item.product_id} not found`);

      const price = product.sale_price || product.price;
      const itemTotal = price * item.quantity;
      subtotal += itemTotal;

      const commissionRate = product.seller.commission_rate || 12;
      const commissionAmount = (itemTotal * commissionRate) / 100;
      const vendorEarning = itemTotal - commissionAmount;

      return {
        product_id: item.product_id,
        vendor_id: product.seller_id,
        variant_id: item.variant_id,
        product_title: product.title,
        product_sku: product.sku,
        quantity: item.quantity,
        unit_price: price,
        total_price: itemTotal,
        commission_rate: commissionRate,
        commission_amount: commissionAmount,
        vendor_earning: vendorEarning,
      };
    });

    const shippingCost = subtotal > 50 ? 0 : 9.99;
    const taxAmount = subtotal * 0.08;
    const totalAmount = subtotal + shippingCost + taxAmount;

    // Generate order number using database function
    const { data: orderNumberData, error: orderNumberError } = await supabase
      .rpc("generate_order_number");

    if (orderNumberError) throw orderNumberError;

    // Create order
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        order_number: orderNumberData,
        customer_id: orderData.customer_id,
        status: "pending",
        total_amount: totalAmount,
        subtotal,
        shipping_cost: shippingCost,
        tax_amount: taxAmount,
        shipping_full_name: orderData.shipping_full_name,
        shipping_email: orderData.shipping_email,
        shipping_phone: orderData.shipping_phone,
        shipping_street: orderData.shipping_street,
        shipping_city: orderData.shipping_city,
        shipping_state: orderData.shipping_state,
        shipping_zip_code: orderData.shipping_zip_code,
        shipping_country: orderData.shipping_country,
        payment_method: orderData.payment_method,
        customer_notes: orderData.customer_notes,
      })
      .select()
      .single();

    if (orderError) throw orderError;

    // Create order items
    const itemsWithOrderId = orderItems.map((item) => ({
      ...item,
      order_id: order.id,
    }));

    const { error: itemsError } = await supabase
      .from("order_items")
      .insert(itemsWithOrderId);

    if (itemsError) throw itemsError;

    // Create commissions
    const commissions = orderItems.map((item) => ({
      vendor_id: item.vendor_id,
      order_id: order.id,
      order_item_id: item.product_id, // Will be updated after order_items insert
      order_amount: item.total_price,
      commission_rate: item.commission_rate,
      commission_amount: item.commission_amount,
      vendor_amount: item.vendor_earning,
      status: "pending",
    }));

    const { error: commissionsError } = await supabase
      .from("commissions")
      .insert(commissions);

    if (commissionsError) throw commissionsError;

    // Create payment record
    const { error: paymentError } = await supabase
      .from("payments")
      .insert({
        order_id: order.id,
        amount: totalAmount,
        payment_method: orderData.payment_method,
        payment_status: "pending",
      });

    if (paymentError) throw paymentError;

    return order;
  },

  /**
   * Get orders for customer
   */
  getCustomerOrders: async (customerId: string) => {
    const { data, error } = await supabase
      .from("orders")
      .select(`
        *,
        items:order_items(
          *,
          product:products(title, images:product_images(url))
        )
      `)
      .eq("customer_id", customerId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data || [];
  },

  /**
   * Get orders for vendor
   */
  getVendorOrders: async (vendorId: string) => {
    const { data, error } = await supabase
      .from("order_items")
      .select(`
        *,
        order:orders(*),
        product:products(title, images:product_images(url))
      `)
      .eq("vendor_id", vendorId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data || [];
  },

  /**
   * Update order status
   */
  updateOrderStatus: async (orderId: string, status: string) => {
    const updates: any = { status };

    if (status === "confirmed") updates.confirmed_at = new Date().toISOString();
    if (status === "dispatched") updates.dispatched_at = new Date().toISOString();
    if (status === "delivered") updates.delivered_at = new Date().toISOString();
    if (status === "cancelled") updates.cancelled_at = new Date().toISOString();

    const { data, error } = await supabase
      .from("orders")
      .update(updates)
      .eq("id", orderId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },
};