import { supabase } from "@/integrations/supabase/client";

export const productService = {
  /**
   * Get all products with filters
   */
  getProducts: async (filters?: {
    category_id?: string;
    seller_id?: string;
    search?: string;
    min_price?: number;
    max_price?: number;
    status?: "draft" | "pending" | "approved" | "rejected" | "inactive";
    limit?: number;
    offset?: number;
  }) => {
    let query = supabase
      .from("products")
      .select(`
        id,
        title,
        slug,
        description,
        price,
        compare_at_price,
        rating,
        total_reviews,
        stock_quantity,
        status,
        images:product_images(id, url, display_order),
        category:categories(id, name, slug),
        seller:seller_profiles!seller_id(id, business_name)
      `, { count: "exact" })
      .order("created_at", { ascending: false });

    if (filters?.category_id) {
      query = query.eq("category_id", filters.category_id);
    }

    if (filters?.seller_id) {
      query = query.eq("seller_id", filters.seller_id);
    }

    if (filters?.search) {
      query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
    }

    if (filters?.min_price !== undefined) {
      query = query.gte("price", filters.min_price);
    }

    if (filters?.max_price !== undefined) {
      query = query.lte("price", filters.max_price);
    }

    if (filters?.status) {
      query = query.eq("status", filters.status);
    } else {
      query = query.eq("status", "approved");
    }

    if (filters?.limit) {
      query = query.limit(filters.limit);
    }

    if (filters?.offset) {
      query = query.range(filters.offset, filters.offset + (filters.limit || 10) - 1);
    }

    const { data, error, count } = await query;

    if (error) throw error;

    return { products: data || [], total: count || 0 };
  },

  /**
   * Get single product by ID
   */
  getProductById: async (id: string) => {
    const { data, error } = await supabase
      .from("products")
      .select(`
        *,
        images:product_images(id, url, display_order),
        category:categories(id, name, slug),
        seller:seller_profiles!seller_id(id, business_name, logo_url)
      `)
      .eq("id", id)
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Create new product
   */
  createProduct: async (productData: {
    title: string;
    description: string;
    category_id: string;
    seller_id: string;
    price: number;
    compare_at_price?: number;
    stock_quantity: number;
    sku: string;
    images: string[];
  }) => {
    // Generate slug from title
    const slug = productData.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

    const { data: product, error: productError } = await supabase
      .from("products")
      .insert({
        title: productData.title,
        slug: slug,
        description: productData.description,
        category_id: productData.category_id,
        seller_id: productData.seller_id,
        price: productData.price,
        compare_at_price: productData.compare_at_price,
        stock_quantity: productData.stock_quantity,
        sku: productData.sku,
        status: "pending" as const,
      })
      .select()
      .single();

    if (productError) throw productError;

    // Add images
    if (productData.images.length > 0) {
      const imageInserts = productData.images.map((url, index) => ({
        product_id: product.id,
        url,
        display_order: index,
      }));

      const { error: imagesError } = await supabase
        .from("product_images")
        .insert(imageInserts);

      if (imagesError) throw imagesError;
    }

    return product;
  },

  /**
   * Update product
   */
  updateProduct: async (
    id: string,
    updates: Partial<{
      title: string;
      description: string;
      category_id: string;
      price: number;
      compare_at_price: number;
      stock_quantity: number;
      status: "draft" | "pending" | "approved" | "rejected" | "inactive";
    }>
  ) => {
    const { data, error } = await supabase
      .from("products")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Delete product
   */
  deleteProduct: async (id: string) => {
    const { error } = await supabase
      .from("products")
      .delete()
      .eq("id", id);

    if (error) throw error;
  },
};