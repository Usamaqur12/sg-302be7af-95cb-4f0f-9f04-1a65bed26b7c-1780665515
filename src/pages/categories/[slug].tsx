"use client";

import { CustomerLayout } from "@/components/CustomerLayout";
import { ProductCard } from "@/components/ProductCard";
import { CategoryCard } from "@/components/CategoryCard";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ChevronRight } from "lucide-react";
import { useRouter } from "next/router";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import Link from "next/link";

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
}

interface Product {
  id: string;
  title: string;
  price: number;
  compare_at_price: number | null;
  rating: number;
  total_reviews: number;
  images: { url: string }[];
  seller: { business_name: string };
}

interface Subcategory {
  id: string;
  name: string;
  slug: string;
  product_count: number;
}

export default function CategoryPage() {
  const router = useRouter();
  const { slug } = router.query;

  const [category, setCategory] = useState<Category | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState("popular");
  const [totalProducts, setTotalProducts] = useState(0);

  useEffect(() => {
    if (!slug || typeof slug !== "string") return;
    fetchCategoryData();
  }, [slug, sortBy]);

  const fetchCategoryData = async () => {
    if (!slug || typeof slug !== "string") return;
    
    setLoading(true);

    // Fetch category details
    const { data: categoryData } = await supabase
      .from("categories")
      .select("id, name, slug, description, image_url")
      .eq("slug", slug)
      .maybeSingle();

    if (!categoryData) {
      setLoading(false);
      return;
    }

    setCategory(categoryData);

    // Fetch subcategories (children of this category)
    const { data: subcatsData } = await supabase
      .from("categories")
      .select("id, name, slug")
      .eq("parent_id", categoryData.id)
      .order("name");

    if (subcatsData) {
      // Get product counts for each subcategory
      const subcatsWithCounts = await Promise.all(
        subcatsData.map(async (subcat) => {
          const { count } = await supabase
            .from("products")
            .select("*", { count: "exact", head: true })
            .eq("category_id", subcat.id)
            .eq("status", "approved");
          
          return {
            ...subcat,
            product_count: count || 0,
          };
        })
      );
      setSubcategories(subcatsWithCounts);
    }

    // Fetch products in this category
    let query = supabase
      .from("products")
      .select(`
        id,
        title,
        price,
        compare_at_price,
        rating,
        total_reviews,
        images:product_images(url),
        seller:seller_profiles(business_name)
      `)
      .eq("category_id", categoryData.id)
      .eq("status", "approved");

    // Apply sorting
    if (sortBy === "price_asc") {
      query = query.order("price", { ascending: true });
    } else if (sortBy === "price_desc") {
      query = query.order("price", { ascending: false });
    } else if (sortBy === "rating") {
      query = query.order("rating", { ascending: false });
    } else if (sortBy === "newest") {
      query = query.order("created_at", { ascending: false });
    } else {
      query = query.order("total_reviews", { ascending: false });
    }

    query = query.limit(24);

    const { data: productsData, count } = await supabase
      .from("products")
      .select("*", { count: "exact", head: true })
      .eq("category_id", categoryData.id)
      .eq("status", "approved");

    setTotalProducts(count || 0);

    const { data: products } = await query;
    setProducts((products as any[]) || []);
    setLoading(false);
  };

  if (loading) {
    return (
      <CustomerLayout>
        <div className="container py-16 text-center">
          <p className="text-muted-foreground">Loading category...</p>
        </div>
      </CustomerLayout>
    );
  }

  if (!category) {
    return (
      <CustomerLayout>
        <div className="container py-16 text-center">
          <h1 className="text-2xl font-bold mb-4">Category Not Found</h1>
          <p className="text-muted-foreground mb-6">
            The category you're looking for doesn't exist.
          </p>
          <Link href="/categories">
            <Button>Browse All Categories</Button>
          </Link>
        </div>
      </CustomerLayout>
    );
  }

  return (
    <CustomerLayout>
      <div className="container py-8">
        {/* Breadcrumb */}
        <Breadcrumb className="mb-6">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/">Home</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href="/categories">Categories</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{category.name}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* Category Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">{category.name}</h1>
          {category.description && (
            <p className="text-lg text-muted-foreground">{category.description}</p>
          )}
          <p className="text-sm text-muted-foreground mt-2">
            {totalProducts} products available
          </p>
        </div>

        {/* Subcategories */}
        {subcategories.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Shop by Subcategory</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {subcategories.map((subcat) => (
                <Link key={subcat.id} href={`/categories/${subcat.slug}`}>
                  <Card className="p-4 hover:shadow-lg transition-shadow cursor-pointer">
                    <h3 className="font-medium text-sm mb-1">{subcat.name}</h3>
                    <p className="text-xs text-muted-foreground">
                      {subcat.product_count} items
                    </p>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Sort and Filter Bar */}
        <div className="flex items-center justify-between mb-6 pb-4 border-b">
          <p className="text-sm text-muted-foreground">
            Showing {products.length} of {totalProducts} products
          </p>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="popular">Most Popular</SelectItem>
              <SelectItem value="price_asc">Price: Low to High</SelectItem>
              <SelectItem value="price_desc">Price: High to Low</SelectItem>
              <SelectItem value="rating">Highest Rated</SelectItem>
              <SelectItem value="newest">Newest First</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Products Grid */}
        {products.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map((product) => (
              <ProductCard
                key={product.id}
                id={product.id}
                title={product.title}
                price={product.price}
                compareAtPrice={product.compare_at_price || undefined}
                image={product.images[0]?.url || "/placeholder.png"}
                rating={product.rating}
                reviewCount={product.total_reviews}
                sellerName={product.seller.business_name}
              />
            ))}
          </div>
        ) : (
          <Card className="p-12 text-center">
            <h3 className="text-xl font-semibold mb-2">No products found</h3>
            <p className="text-muted-foreground mb-6">
              Check back later for new products in this category.
            </p>
            <Link href="/categories">
              <Button variant="outline">Browse Other Categories</Button>
            </Link>
          </Card>
        )}
      </div>
    </CustomerLayout>
  );
}