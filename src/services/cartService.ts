import { supabase } from "@/integrations/supabase/client";

export const cartService = {
  /**
   * Get user's cart
   */
  getCart: async (userId: string) => {
    const { data, error } = await supabase
      .from("carts")
      .select(`
        *,
        product:products(
          *,
          images:product_images(url),
          seller:seller_profiles(business_name)
        ),
        variant:product_variants(*)
      `)
      .eq("user_id", userId);

    if (error) throw error;
    return data || [];
  },

  /**
   * Add item to cart
   */
  addToCart: async (userId: string, productId: string, quantity: number, variantId?: string) => {
    // Check if item already exists
    const { data: existing } = await supabase
      .from("carts")
      .select("*")
      .eq("user_id", userId)
      .eq("product_id", productId)
      .eq("variant_id", variantId || null)
      .maybeSingle();

    if (existing) {
      // Update quantity
      const { data, error } = await supabase
        .from("carts")
        .update({ quantity: existing.quantity + quantity })
        .eq("id", existing.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } else {
      // Insert new item
      const { data, error } = await supabase
        .from("carts")
        .insert({
          user_id: userId,
          product_id: productId,
          variant_id: variantId,
          quantity,
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
      .from("carts")
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
      .from("carts")
      .delete()
      .eq("id", cartItemId);

    if (error) throw error;
  },

  /**
   * Clear entire cart
   */
  clearCart: async (userId: string) => {
    const { error } = await supabase
      .from("carts")
      .delete()
      .eq("user_id", userId);

    if (error) throw error;
  },
};