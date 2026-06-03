import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/database.types";

type UserRole = "customer" | "seller" | "admin";
type SellerProfileInsert = Database["public"]["Tables"]["seller_profiles"]["Insert"];

export const authService = {
  async signUp(email: string, password: string, role: UserRole = "customer") {
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (authError) throw authError;

    if (authData.user) {
      const { error: profileError } = await supabase
        .from("profiles")
        .update({ role })
        .eq("id", authData.user.id);

      if (profileError) throw profileError;

      if (role === "seller") {
        const sellerProfile: SellerProfileInsert = {
          user_id: authData.user.id,
          business_name: "New Seller",
        };

        const { error: sellerError } = await supabase
          .from("seller_profiles")
          .insert(sellerProfile);

        if (sellerError) throw sellerError;
      }
    }

    return authData;
  },

  async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;
    return data;
  },

  async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  async getCurrentUser() {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) return null;

    const { data: profile } = await supabase
      .from("profiles")
      .select("*, seller:seller_profiles(*)")
      .eq("id", user.id)
      .single();

    return { ...user, profile };
  },

  async updateProfile(userId: string, updates: any) {
    const { error } = await supabase
      .from("profiles")
      .update(updates)
      .eq("id", userId);

    if (error) throw error;
  },

  async updateSellerProfile(userId: string, updates: any) {
    const { error } = await supabase
      .from("seller_profiles")
      .update(updates)
      .eq("user_id", userId);

    if (error) throw error;
  },
};