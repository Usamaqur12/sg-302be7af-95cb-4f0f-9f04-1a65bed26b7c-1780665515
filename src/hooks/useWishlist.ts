import { useState, useEffect } from "react";
import { useAuth } from "./useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "./use-toast";
import { analytics } from "@/lib/analytics";

export function useWishlist() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [wishlistItems, setWishlistItems] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchWishlist();
    } else {
      setWishlistItems(new Set());
      setLoading(false);
    }
  }, [user]);

  const fetchWishlist = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from("wishlists")
      .select("product_id")
      .eq("user_id", user.id);

    if (!error && data) {
      setWishlistItems(new Set(data.map((item) => item.product_id)));
    }
    setLoading(false);
  };

  const isInWishlist = (productId: string) => {
    return wishlistItems.has(productId);
  };

  const addToWishlist = async (productId: string, productName?: string, price?: number) => {
    if (!user) {
      toast({
        title: "Login Required",
        description: "Please log in to add items to your wishlist",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from("wishlists")
        .insert({
          user_id: user.id,
          product_id: productId,
        });

      if (error) throw error;

      setWishlistItems((prev) => new Set([...prev, productId]));

      // Track analytics
      if (productName && price) {
        analytics.addToWishlist({
          id: productId,
          name: productName,
          price,
        });
      }

      toast({
        title: "Added to Wishlist",
        description: "Product saved to your wishlist",
      });
    } catch (error: any) {
      if (error.code === "23505") {
        toast({
          title: "Already in Wishlist",
          description: "This product is already in your wishlist",
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to add to wishlist",
          variant: "destructive",
        });
      }
    }
  };

  const removeFromWishlist = async (productId: string, productName?: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from("wishlists")
        .delete()
        .eq("user_id", user.id)
        .eq("product_id", productId);

      if (error) throw error;

      setWishlistItems((prev) => {
        const newSet = new Set(prev);
        newSet.delete(productId);
        return newSet;
      });

      // Track analytics
      if (productName) {
        analytics.removeFromWishlist({
          id: productId,
          name: productName,
        });
      }

      toast({
        title: "Removed from Wishlist",
        description: "Product removed from your wishlist",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to remove from wishlist",
        variant: "destructive",
      });
    }
  };

  const toggleWishlist = async (
    productId: string,
    productName?: string,
    price?: number
  ) => {
    if (isInWishlist(productId)) {
      await removeFromWishlist(productId, productName);
    } else {
      await addToWishlist(productId, productName, price);
    }
  };

  return {
    wishlistItems,
    loading,
    isInWishlist,
    addToWishlist,
    removeFromWishlist,
    toggleWishlist,
  };
}