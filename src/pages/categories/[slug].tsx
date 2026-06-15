"use client";

import { CustomerLayout } from "@/components/CustomerLayout";
import { ProductCard } from "@/components/ProductCard";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { Filter, Loader2 } from "lucide-react";

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  image_url: string;
  product_count: number;
}

export default function CategoryDetailPage() {
  const router = useRouter();
  const { slug } = router.query;

  const [category, setCategory] = useState<Category | null>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState("popular");

  useEffect(() => {
    if (!slug || typeof slug !== 'string') return;
    fetchCategory();
  }, [slug]);

  async function fetchCategory() {
    if (!slug || typeof slug !== 'string') return;

    setLoading(true);
    try {
      // Fetch category by slug
      const { data: categoryData, error: categoryError } = await supabase
        .from("categories")
        .select("*")
        .eq("slug", slug as string)
        .single();

      if (categoryError || !categoryData) {
        setCategory(null);
        setProducts([]);
        setLoading(false);
        return;
      }

      setCategory({
        id: categoryData.id,
        name: categoryData.name,
        slug: categoryData.slug,
        description: categoryData.description || `Discover the latest in ${categoryData.name}.`,
        image_url: categoryData.image_url || "https://images.unsplash.com/photo-1498049794561-7780e7231661?w=1200",
        product_count: 0,
      });

      // Fetch products in this category (approved only)
      const { data: productsData, error: productsError } = await supabase
        .from("products")
        .select(`
          id,
          title,
          price,
          compare_at_price,
          deal_expires_at,
          rating,
          total_reviews,
          images:product_images(url),
          seller:seller_profiles!seller_id(id, business_name)
        `)
        .eq("category_id", categoryData.id)
        .eq("status", "approved")
        .limit(48);

      if (productsError) {
        setProducts([]);
      } else {
        const formattedProducts = (productsData || []).map((p: any) => ({
          id: p.id,
          title: p.title,
          price: p.price,
          compare_at_price: p.compare_at_price,
          deal_expires_at: p.deal_expires_at,
          rating: p.rating || 4.5,
          total_reviews: p.total_reviews || 0,
          images: p.images || [],
          seller: p.seller,
        }));

        setProducts(formattedProducts);
        
        // Update category product count
        setCategory(prev => prev ? { ...prev, product_count: formattedProducts.length } : null);
      }
    } catch (error) {
      setCategory(null);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }

  const handleSortChange = (value: string) => {
    setSortBy(value);
    const sorted = [...products];
    switch (value) {
      case "price_asc":
        sorted.sort((a, b) => a.price - b.price);
        break;
      case "price_desc":
        sorted.sort((a, b) => b.price - a.price);
        break;
      case "rating":
        sorted.sort((a, b) => b.rating - a.rating);
        break;
      case "newest":
        break;
      default:
        sorted.sort((a, b) => b.total_reviews - a.total_reviews);
    }
    setProducts(sorted);
  };

  if (loading) {
    return (
      <CustomerLayout>
        <div className="container py-16 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-muted-foreground">Loading category...</p>
          </div>
        </div>
      </CustomerLayout>
    );
  }

  if (!category) {
    return (
      <CustomerLayout>
        <div className="container py-16 text-center">
          <h1 className="text-2xl font-bold mb-4">Category Not Found</h1>
          <p className="text-muted-foreground mb-6">The category you're looking for doesn't exist.</p>
          <Button onClick={() => router.push("/categories")}>Browse All Categories</Button>
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
            <BreadcrumbPage>{category.name}</BreadcrumbPage>
          </BreadcrumbList>
        </Breadcrumb>

        {/* Category Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-3">{category.name}</h1>
          <p className="text-muted-foreground text-lg mb-4">{category.description}</p>
          <Badge variant="secondary">{products.length} Products</Badge>
        </div>

        {/* Sort and Filter */}
        <div className="flex items-center justify-between mb-6">
          <p className="text-sm text-muted-foreground">
            Showing {products.length} products
          </p>

          <div className="flex items-center gap-4">
            <Button variant="outline" size="sm" className="gap-2">
              <Filter className="h-4 w-4" />
              Filters
            </Button>

            <Select value={sortBy} onValueChange={handleSortChange}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="popular">Most Popular</SelectItem>
                <SelectItem value="newest">Newest</SelectItem>
                <SelectItem value="price_asc">Price: Low to High</SelectItem>
                <SelectItem value="price_desc">Price: High to Low</SelectItem>
                <SelectItem value="rating">Highest Rated</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Products Grid */}
        {products.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {products.map((product) => (
              <ProductCard
                key={product.id}
                id={product.id}
                title={product.title}
                price={product.price}
                compareAtPrice={product.compare_at_price}
                dealExpiresAt={product.deal_expires_at}
                image={product.images?.[0]?.url || "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&h=600&fit=crop"}
                rating={product.rating}
                reviewCount={product.total_reviews}
                sellerName={product.seller?.business_name || "Unknown Seller"}
                sellerId={product.seller?.id}
              />
            ))}
          </div>
        ) : (
          <Card className="p-12 text-center">
            <p className="text-lg font-semibold mb-2">No products found</p>
            <p className="text-muted-foreground mb-4">This category doesn't have any products yet.</p>
            <Button onClick={() => router.push("/categories")}>Browse Other Categories</Button>
          </Card>
        )}
      </div>
    </CustomerLayout>
  );
}
