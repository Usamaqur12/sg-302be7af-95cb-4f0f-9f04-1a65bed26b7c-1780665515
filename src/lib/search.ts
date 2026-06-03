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
  id: string;
  title: string;
  slug: string;
  description: string;
  price: number;
  compare_at_price: number | null;
  rating: number;
  total_reviews: number;
  images: { url: string }[];
  seller: { business_name: string };
}

export const searchService = {
  /**
   * Search products with full-text search and filters
   */
  async searchProducts(filters: SearchFilters): Promise<{
    products: SearchResult[];
    total: number;
  }> {
    const {
      query,
      categoryId,
      minPrice,
      maxPrice,
      minRating,
      sortBy = "relevance",
      limit = 20,
      offset = 0,
    } = filters;

    // Build query
    let dbQuery = supabase
      .from("products")
      .select(
        `
        id,
        title,
        slug,
        description,
        price,
        compare_at_price,
        rating,
        total_reviews,
        images:product_images(url),
        seller:seller_profiles(business_name)
      `,
        { count: "exact" }
      )
      .eq("status", "approved");

    // Apply full-text search if query provided
    if (query && query.trim()) {
      // Use PostgreSQL full-text search
      dbQuery = dbQuery.textSearch("search_vector", query, {
        type: "websearch",
        config: "english",
      });
    }

    // Apply filters
    if (categoryId) {
      dbQuery = dbQuery.eq("category_id", categoryId);
    }

    if (minPrice !== undefined) {
      dbQuery = dbQuery.gte("price", minPrice);
    }

    if (maxPrice !== undefined) {
      dbQuery = dbQuery.lte("price", maxPrice);
    }

    if (minRating !== undefined) {
      dbQuery = dbQuery.gte("rating", minRating);
    }

    // Apply sorting
    switch (sortBy) {
      case "price_asc":
        dbQuery = dbQuery.order("price", { ascending: true });
        break;
      case "price_desc":
        dbQuery = dbQuery.order("price", { ascending: false });
        break;
      case "rating":
        dbQuery = dbQuery.order("rating", { ascending: false });
        break;
      case "newest":
        dbQuery = dbQuery.order("created_at", { ascending: false });
        break;
      case "relevance":
      default:
        // Relevance is handled by text search ranking
        if (query && query.trim()) {
          // For text search, results are already sorted by relevance
          dbQuery = dbQuery.order("rating", { ascending: false });
        } else {
          // No search query, sort by rating + reviews
          dbQuery = dbQuery.order("rating", { ascending: false });
        }
        break;
    }

    // Apply pagination
    dbQuery = dbQuery.range(offset, offset + limit - 1);

    const { data, count, error } = await dbQuery;

    if (error) {
      console.error("Search error:", error);
      throw error;
    }

    return {
      products: (data as any) || [],
      total: count || 0,
    };
  },

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