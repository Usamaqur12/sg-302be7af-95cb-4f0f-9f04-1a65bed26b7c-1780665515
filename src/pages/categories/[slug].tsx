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
import { Filter } from "lucide-react";

// Mock categories and products
const MOCK_CATEGORIES: Record<string, any> = {
  electronics: {
    id: "electronics",
    name: "Electronics",
    slug: "electronics",
    description: "Discover the latest in consumer electronics, from smartphones to smart home devices.",
    image_url: "https://images.unsplash.com/photo-1498049794561-7780e7231661?w=1200",
    product_count: 1248,
  },
  fashion: {
    id: "fashion",
    name: "Fashion",
    slug: "fashion",
    description: "Stay stylish with our curated collection of clothing, shoes, and accessories.",
    image_url: "https://images.unsplash.com/photo-1445205170230-053b83016050?w=1200",
    product_count: 3421,
  },
  "home-garden": {
    id: "home-garden",
    name: "Home & Garden",
    slug: "home-garden",
    description: "Transform your living space with furniture, decor, and garden essentials.",
    image_url: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=1200",
    product_count: 892,
  },
};

const MOCK_PRODUCTS = [
  {
    id: "prod-1",
    title: "Wireless Noise-Cancelling Headphones",
    price: 199.99,
    compare_at_price: 299.99,
    rating: 4.8,
    total_reviews: 1247,
    images: [{ url: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400" }],
    seller: { business_name: "TechWorld Store" },
  },
  {
    id: "prod-2",
    title: "4K Smart TV 55 inch",
    price: 599.99,
    compare_at_price: 799.99,
    rating: 4.6,
    total_reviews: 892,
    images: [{ url: "https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=400" }],
    seller: { business_name: "ElectroHub" },
  },
  {
    id: "prod-3",
    title: "Wireless Gaming Mouse",
    price: 79.99,
    rating: 4.7,
    total_reviews: 634,
    images: [{ url: "https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=400" }],
    seller: { business_name: "GamerGear" },
  },
  {
    id: "prod-4",
    title: "Portable Bluetooth Speaker",
    price: 49.99,
    compare_at_price: 69.99,
    rating: 4.5,
    total_reviews: 423,
    images: [{ url: "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=400" }],
    seller: { business_name: "AudioMax" },
  },
  {
    id: "prod-5",
    title: "Smart Watch Pro",
    price: 299.99,
    compare_at_price: 399.99,
    rating: 4.9,
    total_reviews: 1834,
    images: [{ url: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400" }],
    seller: { business_name: "WearTech" },
  },
  {
    id: "prod-6",
    title: "Mechanical Keyboard RGB",
    price: 129.99,
    rating: 4.6,
    total_reviews: 567,
    images: [{ url: "https://images.unsplash.com/photo-1595225476474-87563907a212?w=400" }],
    seller: { business_name: "KeyMasters" },
  },
  {
    id: "prod-7",
    title: "Wireless Earbuds Pro",
    price: 149.99,
    compare_at_price: 199.99,
    rating: 4.7,
    total_reviews: 1034,
    images: [{ url: "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=400" }],
    seller: { business_name: "AudioMax" },
  },
  {
    id: "prod-8",
    title: "USB-C Hub 7-in-1",
    price: 39.99,
    rating: 4.4,
    total_reviews: 289,
    images: [{ url: "https://images.unsplash.com/photo-1625948515291-69613efd103f?w=400" }],
    seller: { business_name: "TechAccessories" },
  },
];

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

    async function fetchCategory() {
      setLoading(true);
      try {
        // Fetch category by slug
        const { data: categoryData, error: categoryError } = await supabase
          .from("categories")
          .select("*")
          .eq("slug", slug as string)
          .single();

        if (categoryError || !categoryData) {
          console.error("Category not found:", categoryError);
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
            rating,
            total_reviews,
            images:product_images(url),
            seller:seller_profiles!seller_id(id, business_name)
          `)
          .eq("category_id", categoryData.id)
          .eq("status", "approved")
          .limit(24);

        if (productsError) {
          console.error("Error fetching products:", productsError);
        }

        const formattedProducts = (productsData || []).map((p: any) => ({
          id: p.id,
          title: p.title,
          price: p.price,
          compare_at_price: p.compare_at_price,
          rating: p.rating || 4.5,
          total_reviews: p.total_reviews || 0,
          images: p.images || [],
          seller: p.seller,
        }));

        setProducts(formattedProducts);
        
        // Update category product count
        setCategory(prev => prev ? { ...prev, product_count: formattedProducts.length } : null);
      } catch (error) {
        console.error("Error fetching category:", error);
        setCategory(null);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    }

    fetchCategory();
  }, [slug]);

  const handleSortChange = (value: string) => {
    setSortBy(value);
    // Sort logic here
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
        // Already in order
        break;
      default:
        // popular - by total_reviews
        sorted.sort((a, b) => b.total_reviews - a.total_reviews);
    }
    setProducts(sorted);
  };

  if (loading) {
    return (
      <CustomerLayout>
        <div className="container py-16 text-center">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded w-1/3 mx-auto"></div>
            <div className="h-4 bg-muted rounded w-1/2 mx-auto"></div>
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
          <Badge variant="secondary">{category.product_count || products.length} Products</Badge>
        </div>

        {/* Sort and Filter */}
        <div className="flex items-center justify-between mb-6">
          <p className="text-sm text-muted-foreground">
            Showing {products.length} of {category.product_count || products.length} products
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
            <p className="text-muted-foreground mb-4">No products found in this category.</p>
            <Button onClick={() => router.push("/categories")}>Browse Other Categories</Button>
          </Card>
        )}
      </div>
    </CustomerLayout>
  );
}