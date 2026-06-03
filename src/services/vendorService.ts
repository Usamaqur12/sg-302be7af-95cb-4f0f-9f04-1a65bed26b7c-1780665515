import { supabase } from "@/integrations/supabase/client";

export const vendorService = {
  /**
   * Register new vendor
   */
  registerVendor: async (userId: string, vendorData: {
    business_name: string;
    description: string;
    business_type: string;
    business_address: string;
    bank_account_number: string;
    bank_name: string;
    bank_routing_number?: string;
  }) => {
    // Create slug from business name
    const slug = vendorData.business_name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

    const { data, error } = await supabase
      .from("seller_profiles")
      .insert({
        user_id: userId,
        business_name: vendorData.business_name,
        slug,
        description: vendorData.description,
        business_type: vendorData.business_type,
        business_address: vendorData.business_address,
        bank_details: {
          account_number: vendorData.bank_account_number,
          bank_name: vendorData.bank_name,
          routing_number: vendorData.bank_routing_number,
        },
        kyc_status: "pending",
        status: "pending",
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
  updateVendorProfile: async (vendorId: string, updates: Partial<{
    business_name: string;
    description: string;
    logo_url: string;
    banner_url: string;
    business_address: string;
  }>) => {
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
   * Get vendor dashboard stats
   */
  getVendorStats: async (vendorId: string) => {
    // Get earnings summary
    const { data: earnings, error: earningsError } = await supabase
      .from("vendor_earnings_summary")
      .select("*")
      .eq("vendor_id", vendorId)
      .single();

    if (earningsError) throw earningsError;

    // Get recent orders
    const { data: recentOrders, error: ordersError } = await supabase
      .from("order_items")
      .select(`
        *,
        order:orders(order_number, status, created_at)
      `)
      .eq("vendor_id", vendorId)
      .order("created_at", { ascending: false })
      .limit(10);

    if (ordersError) throw ordersError;

    // Get product count
    const { count: productCount, error: productError } = await supabase
      .from("products")
      .select("*", { count: "exact", head: true })
      .eq("seller_id", vendorId);

    if (productError) throw productError;

    return {
      earnings,
      recentOrders: recentOrders || [],
      productCount: productCount || 0,
    };
  },

  /**
   * Request payout
   */
  requestPayout: async (vendorId: string, amount: number, payoutMethod: string) => {
    const { data, error } = await supabase
      .from("payouts")
      .insert({
        vendor_id: vendorId,
        amount,
        payout_method: payoutMethod,
        status: "pending",
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Get vendor payouts
   */
  getVendorPayouts: async (vendorId: string) => {
    const { data, error } = await supabase
      .from("payouts")
      .select("*")
      .eq("vendor_id", vendorId)
      .order("requested_at", { ascending: false });

    if (error) throw error;
    return data || [];
  },
};