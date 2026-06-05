import { supabase } from "@/integrations/supabase/client";

export const cartService = {
  /**
   * Get user's cart with items
   */
  getCart: async (userId: string) => {
    // First get the user's cart
    const { data: cart, error: cartError } = await supabase
      .from("carts")
      .select("id")
      .eq("user_id", userId)
      .maybeSingle();

    if (cartError) throw cartError;
    
    if (!cart) {
      return [];
    }

    // Then get cart items with product details
    const { data: items, error: itemsError } = await supabase
      .from("cart_items")
      .select(`
        id,
        cart_id,
        product_id,
        quantity,
        price_at_addition,
        product:products(
          id,
          title,
          price,
          compare_at_price,
          stock_quantity,
          images:product_images(url),
          seller:seller_profiles!seller_id(business_name)
        )
      `)
      .eq("cart_id", cart.id);

    if (itemsError) throw itemsError;
    return items || [];
  },

  /**
   * Add item to cart
   */
  addToCart: async (userId: string, productId: string, quantity: number) => {
    // Get or create cart
    const { data: cartData, error: cartError } = await supabase
      .from("carts")
      .select("id")
      .eq("user_id", userId)
      .maybeSingle();

    if (cartError) throw cartError;

    let cart = cartData;

    if (!cart) {
      const { data: newCart, error: createError } = await supabase
        .from("carts")
        .insert({ user_id: userId })
        .select("id")
        .single();

      if (createError) throw createError;
      cart = newCart;
    }

    // Get product price
    const { data: product, error: productError } = await supabase
      .from("products")
      .select("price")
      .eq("id", productId)
      .single();

    if (productError) throw productError;

    // Check if item already exists
    const { data: existing, error: existingError } = await supabase
      .from("cart_items")
      .select("id, quantity")
      .eq("cart_id", cart.id)
      .eq("product_id", productId)
      .maybeSingle();

    if (existingError) throw existingError;

    if (existing) {
      // Update quantity
      const { data, error } = await supabase
        .from("cart_items")
        .update({ quantity: existing.quantity + quantity })
        .eq("id", existing.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } else {
      // Insert new item
      const { data, error } = await supabase
        .from("cart_items")
        .insert({
          cart_id: cart.id,
          product_id: productId,
          quantity,
          price_at_addition: product.price,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    }
  },

  /**
   * Update cart item quantity
   */
  updateCartItem: async (cartItemId: string, quantity: number) => {
    const { data, error } = await supabase
      .from("cart_items")
      .update({ quantity })
      .eq("id", cartItemId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Remove item from cart
   */
  removeFromCart: async (cartItemId: string) => {
    const { error } = await supabase
      .from("cart_items")
      .delete()
      .eq("id", cartItemId);

    if (error) throw error;
  },

  /**
   * Clear entire cart
   */
  clearCart: async (userId: string) => {
    const { data: cart } = await supabase
      .from("carts")
      .select("id")
      .eq("user_id", userId)
      .maybeSingle();

    if (!cart) return;

    const { error } = await supabase
      .from("cart_items")
      .delete()
      .eq("cart_id", cart.id);

    if (error) throw error;
  },
};