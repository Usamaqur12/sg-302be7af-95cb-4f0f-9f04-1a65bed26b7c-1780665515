import { CustomerLayout } from "@/components/CustomerLayout";
import { ProductCard } from "@/components/ProductCard";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { SlidersHorizontal } from "lucide-react";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface Product {
  id: string;
  title: string;
  price: number;
  compare_at_price: number | null;
  images: { image_url: string }[];
  rating: number;
  total_reviews: number;
  seller: { business_name: string };
}

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
}

export default function CategoryPage() {
  const router = useRouter();
  const { slug } = router.query;
  const [category, setCategory] = useState<Category | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState("popular");
  const [priceRange, setPriceRange] = useState([0, 5000]);

  useEffect(() => {
    if (!slug || typeof slug !== 'string') return;

    async function fetchCategoryAndProducts() {
      const { data: categoryData } = await supabase
        .from("categories")
        .select("*")
        .eq("slug", slug as string)
        .single();

      if (categoryData) {
        setCategory(categoryData);

        let query = supabase
          .from("products")
          .select(`
            id,
            title,
            price,
            compare_at_price,
            rating,
            total_reviews,
            images:product_images(image_url),
            seller:seller_profiles(business_name)
          `)
          .eq("category_id", categoryData.id)
          .eq("status", "approved")
          .gte("price", priceRange[0])
          .lte("price", priceRange[1]);

        if (sortBy === "price_low") {
          query = query.order("price", { ascending: true });
        } else if (sortBy === "price_high") {
          query = query.order("price", { ascending: false });
        } else if (sortBy === "rating") {
          query = query.order("rating", { ascending: false });
        } else {
          query = query.order("created_at", { ascending: false });
        }

        const { data: productsData } = await query;
        setProducts(productsData || []);
      }
      setLoading(false);
    }

    fetchCategoryAndProducts();
  }, [slug, sortBy, priceRange]);

  if (loading) {
    return (
      <CustomerLayout>
        <div className="container py-8">
          <div className="h-8 w-64 bg-muted animate-pulse rounded mb-6" />
          <div className="h-12 w-96 bg-muted animate-pulse rounded mb-8" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="aspect-square bg-muted animate-pulse rounded-lg" />
            ))}
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
          <Button onClick={() => router.push("/categories")}>Browse Categories</Button>
        </div>
      </CustomerLayout>
    );
  }

  return (
    <CustomerLayout>
      <div className="container py-8">
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

        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-3">{category.name}</h1>
          {category.description && (
            <p className="text-muted-foreground text-lg">{category.description}</p>
          )}
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          <aside className="lg:w-64 flex-shrink-0">
            <Card className="p-6 sticky top-20">
              <div className="flex items-center gap-2 mb-6">
                <SlidersHorizontal className="h-5 w-5" />
                <h3 className="font-semibold">Filters</h3>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="text-sm font-medium mb-3 block">Sort By</label>
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="popular">Most Popular</SelectItem>
                      <SelectItem value="rating">Highest Rated</SelectItem>
                      <SelectItem value="price_low">Price: Low to High</SelectItem>
                      <SelectItem value="price_high">Price: High to Low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-3 block">
                    Price Range: ${priceRange[0]} - ${priceRange[1]}
                  </label>
                  <Slider
                    min={0}
                    max={5000}
                    step={50}
                    value={priceRange}
                    onValueChange={setPriceRange}
                    className="mb-2"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>$0</span>
                    <span>$5000+</span>
                  </div>
                </div>
              </div>
            </Card>
          </aside>

          <div className="flex-1">
            <div className="mb-6 text-sm text-muted-foreground">
              {products.length} products found
            </div>

            {products.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {products.map((product) => (
                  <ProductCard
                    key={product.id}
                    id={product.id}
                    title={product.title}
                    price={product.price}
                    compareAtPrice={product.compare_at_price || undefined}
                    image={product.images[0]?.image_url || "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&h=600&fit=crop"}
                    rating={product.rating}
                    reviewCount={product.total_reviews}
                    sellerName={product.seller?.business_name || "Unknown Seller"}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <p className="text-muted-foreground text-lg">No products found in this category.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </CustomerLayout>
  );
}