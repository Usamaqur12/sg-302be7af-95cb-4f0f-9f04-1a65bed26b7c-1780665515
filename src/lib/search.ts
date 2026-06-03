import { supabase } from "@/integrations/supabase/client";

export interface SearchFilters {
  query?: string;
  categoryId?: string;
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
  sortBy?: "relevance" | "price_asc" | "price_desc" | "rating" | "newest";
  limit?: number;
  offset?: number;
}

export interface SearchResult {
  products: any[];
  total: number;
  facets?: {
    categories: { id: string; name: string; count: number }[];
    priceRanges: { min: number; max: number; count: number }[];
  };
}

/**
 * Search products with full-text search and filters
 */
export async function searchProducts(filters: SearchFilters): Promise<SearchResult> {
  const query = supabase.rpc("search_products", {
    search_query: filters.query || "",
    category_filter: filters.categoryId,
    min_price: filters.minPrice,
    max_price: filters.maxPrice,
    min_rating: filters.minRating,
    result_limit: filters.limit || 20,
    result_offset: filters.offset || 0,
  });

  const { data, error } = await query;

  if (error) {
    console.error("Search error:", error);
    return { products: [], total: 0 };
  }

  return {
    products: data || [],
    total: data?.length || 0,
  };
}

export const searchService = {
  /**
   * Get search suggestions based on query
   */
  async getSearchSuggestions(query: string, limit: number = 5): Promise<string[]> {
    if (!query || query.trim().length < 2) {
      return [];
    }

    const { data, error } = await supabase
      .from("products")
      .select("title")
      .eq("status", "approved")
      .textSearch("search_vector", query, { type: "websearch", config: "english" })
      .limit(limit);

    if (error) {
      console.error("Suggestion error:", error);
      return [];
    }

    return data?.map((p) => p.title) || [];
  },

  /**
   * Get popular search terms (future: track in analytics table)
   */
  async getPopularSearches(): Promise<string[]> {
    // Placeholder - in production, track searches in analytics table
    return [
      "laptop",
      "headphones",
      "smartphone",
      "camera",
      "watch",
      "keyboard",
      "mouse",
      "monitor",
    ];
  },
};