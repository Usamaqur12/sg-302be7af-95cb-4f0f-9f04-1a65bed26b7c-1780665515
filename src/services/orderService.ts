import { supabase } from "@/integrations/supabase/client";

export const orderService = {
  /**
   * Create new order
   */
  createOrder: async (orderData: {
    customer_id: string;
    items: Array<{
      product_id: string;
      quantity: number;
    }>;
    shipping_full_name: string;
    shipping_phone: string;
    shipping_address: string;
    shipping_city: string;
    shipping_state: string;
    shipping_postal_code: string;
    shipping_country: string;
  }) => {
    // Fetch products to calculate prices
    const productIds = orderData.items.map((item) => item.product_id);
    const { data: products, error: productsError } = await supabase
      .from("products")
      .select("id, title, price, seller_id, seller:seller_profiles!seller_id(commission_rate), images:product_images(url)")
      .in("id", productIds);

    if (productsError) throw productsError;
    if (!products || products.length === 0) throw new Error("Products not found");

    // Calculate totals
    let subtotal = 0;
    const orderItems = orderData.items.map((item) => {
      const product = products.find((p) => p.id === item.product_id);
      if (!product) throw new Error(`Product ${item.product_id} not found`);

      const price = product.price;
      const itemSubtotal = price * item.quantity;
      subtotal += itemSubtotal;

      const commissionRate = (product.seller as any)?.commission_rate || 15;
      const commissionAmount = (itemSubtotal * commissionRate) / 100;
      const sellerEarnings = itemSubtotal - commissionAmount;

      return {
        product_id: item.product_id,
        product_title: product.title,
        product_image: (product.images as any)?.[0]?.url || null,
        quantity: item.quantity,
        price: price,
        subtotal: itemSubtotal,
        seller_id: product.seller_id,
        commission_rate: commissionRate,
        commission_amount: commissionAmount,
        seller_earnings: sellerEarnings,
      };
    });

    const shippingCost = subtotal > 50 ? 0 : 9.99;
    const tax = subtotal * 0.08;
    const total = subtotal + shippingCost + tax;

    // Generate order number
    const orderNumber = `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    // Create order
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        order_number: orderNumber,
        customer_id: orderData.customer_id,
        status: "pending" as const,
        total: total,
        subtotal: subtotal,
        shipping_cost: shippingCost,
        tax: tax,
        shipping_full_name: orderData.shipping_full_name,
        shipping_phone: orderData.shipping_phone,
        shipping_address: orderData.shipping_address,
        shipping_city: orderData.shipping_city,
        shipping_state: orderData.shipping_state,
        shipping_postal_code: orderData.shipping_postal_code,
        shipping_country: orderData.shipping_country,
      } as any)
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

    return order;
  },

  /**
   * Get orders for customer
   */
  getCustomerOrders: async (customerId: string) => {
    const { data, error } = await supabase
      .from("orders")
      .select(`
        id,
        order_number,
        status,
        total,
        created_at,
        items:order_items(
          id,
          product_title,
          product_image,
          quantity,
          price
        )
      `)
      .eq("customer_id", customerId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data || [];
  },

  /**
   * Get single order
   */
  getOrderById: async (orderId: string) => {
    const { data, error } = await supabase
      .from("orders")
      .select(`
        *,
        items:order_items(
          id,
          product_id,
          product_title,
          product_image,
          quantity,
          price,
          subtotal
        )
      `)
      .eq("id", orderId)
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Update order status
   */
  updateOrderStatus: async (orderId: string, status: string) => {
    const { data, error } = await supabase
      .from("orders")
      .update({ status })
      .eq("id", orderId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },
};