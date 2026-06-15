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
  sponsoredProducts: any[];
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
  let query = supabase
    .from("products")
    .select(`
      id,
      title,
      price,
      compare_at_price,
      deal_expires_at,
      rating,
      total_reviews,
      created_at,
      images:product_images(url),
      seller:seller_profiles!seller_id(id, business_name)
    `, { count: "exact" })
    .eq("status", "approved");

  if (filters.query?.trim()) {
    const safeSearch = filters.query.trim().replaceAll(",", " ");
    query = query.or(`title.ilike.%${safeSearch}%,description.ilike.%${safeSearch}%`);
  }

  if (filters.categoryId) {
    query = query.eq("category_id", filters.categoryId);
  }

  if (filters.minPrice !== undefined) {
    query = query.gte("price", filters.minPrice);
  }

  if (filters.maxPrice !== undefined) {
    query = query.lte("price", filters.maxPrice);
  }

  if (filters.minRating !== undefined) {
    query = query.gte("rating", filters.minRating);
  }

  switch (filters.sortBy) {
    case "price_asc":
      query = query.order("price", { ascending: true });
      break;
    case "price_desc":
      query = query.order("price", { ascending: false });
      break;
    case "rating":
      query = query.order("rating", { ascending: false });
      break;
    case "newest":
      query = query.order("created_at", { ascending: false });
      break;
    default:
      query = query.order("created_at", { ascending: false });
  }

  const limit = filters.limit || 20;
  const offset = filters.offset || 0;
  query = query.range(offset, offset + limit - 1);

  const { data, error, count } = await query;

  if (error) {
    console.error("Search error:", error);
    return { products: [], sponsoredProducts: [], total: 0 };
  }

  let sponsoredProducts: any[] = [];
  try {
    const params = new URLSearchParams({
      q: filters.query || "",
      limit: "8",
    });
    const response = await fetch(`/api/marketing/sponsored?${params.toString()}`);
    if (response.ok) {
      const payload = await response.json();
      sponsoredProducts = Array.isArray(payload.products) ? payload.products : [];
    }
  } catch (sponsoredError) {
    console.error("Sponsored products unavailable:", sponsoredError);
  }

  return {
    products: data || [],
    sponsoredProducts,
    total: count || data?.length || 0,
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
