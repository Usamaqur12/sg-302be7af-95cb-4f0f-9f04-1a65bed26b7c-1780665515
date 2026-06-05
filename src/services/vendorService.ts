import { supabase } from "@/integrations/supabase/client";

export const vendorService = {
  /**
   * Register new vendor
   */
  registerVendor: async (
    userId: string,
    vendorData: {
      business_name: string;
      business_description: string;
      business_type: "individual" | "company" | "partnership";
      business_address: string;
      bank_account_number: string;
      bank_name: string;
      bank_routing_number?: string;
    }
  ) => {
    const { data, error } = await supabase
      .from("seller_profiles")
      .insert({
        user_id: userId,
        business_name: vendorData.business_name,
        business_description: vendorData.business_description,
        business_type: vendorData.business_type as const,
        business_address: vendorData.business_address,
        bank_account_number: vendorData.bank_account_number,
        bank_name: vendorData.bank_name,
        bank_routing_number: vendorData.bank_routing_number || null,
        status: "pending" as const,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Get vendor profile
   */
  getVendorProfile: async (vendorId: string) => {
    const { data, error } = await supabase
      .from("seller_profiles")
      .select("*")
      .eq("id", vendorId)
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Get vendor by user ID
   */
  getVendorByUserId: async (userId: string) => {
    const { data, error } = await supabase
      .from("seller_profiles")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  /**
   * Update vendor profile
   */
  updateVendorProfile: async (
    vendorId: string,
    updates: Partial<{
      business_name: string;
      business_description: string;
      logo_url: string;
      banner_url: string;
      business_address: string;
    }>
  ) => {
    const { data, error } = await supabase
      .from("seller_profiles")
      .update(updates)
      .eq("id", vendorId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Get vendor products
   */
  getVendorProducts: async (vendorId: string) => {
    const { data, error } = await supabase
      .from("products")
      .select(`
        id,
        title,
        price,
        compare_at_price,
        stock_quantity,
        status,
        rating,
        total_reviews,
        images:product_images(url)
      `)
      .eq("seller_id", vendorId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data || [];
  },
};