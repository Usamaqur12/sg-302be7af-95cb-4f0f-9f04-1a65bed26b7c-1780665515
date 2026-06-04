"use client";

import { useState, useEffect } from "react";
import { CustomerLayout } from "@/components/CustomerLayout";
import { ProductCard } from "@/components/ProductCard";
import { CategoryCard } from "@/components/CategoryCard";
import { TrendingStrip } from "@/components/TrendingStrip";
import { CategoryIconRow } from "@/components/CategoryIconRow";
import { ShockingDealsSection } from "@/components/ShockingDealsSection";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { 
  ArrowRight, 
  TrendingUp, 
  Award, 
  ShieldCheck, 
  TruckIcon, 
  RefreshCw,
  Star,
  Users,
  DollarSign,
  Zap,
  ShoppingBag,
  Shield,
  Headphones,
  Search
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { supabase } from "@/integrations/supabase/client";

export default function HomePage() {
  const [featuredCategories, setFeaturedCategories] = useState<any[]>([]);
  const [bestSellers, setBestSellers] = useState<any[]>([]);
  const [flashDeals, setFlashDeals] = useState<any[]>([]);
  const [newArrivals, setNewArrivals] = useState<any[]>([]);
  const [featuredVendors, setFeaturedVendors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHomepageData();
  }, []);

  const fetchHomepageData = async () => {
    try {
      // Fetch featured categories
      const { data: categoriesData } = await supabase
        .from("categories")
        .select("id, name, slug, image_url")
        .limit(6);

      if (categoriesData) {
        setFeaturedCategories(categoriesData.map(cat => ({
          id: cat.id,
          name: cat.name,
          slug: cat.slug,
          image: cat.image_url || "https://images.unsplash.com/photo-1498049794561-7780e7231661?w=800&h=800&fit=crop",
          productCount: 0,
        })));
      }

      // Fetch best sellers (by rating and total_reviews)
      const { data: bestSellersData } = await supabase
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
        .eq("status", "approved")
        .order("total_reviews", { ascending: false })
        .limit(4);

      if (bestSellersData) {
        setBestSellers(bestSellersData.map(p => ({
          id: p.id,
          title: p.title,
          price: p.price,
          compareAtPrice: p.compare_at_price,
          image: (p.images as any)?.[0]?.url || "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&h=600&fit=crop",
          rating: p.rating,
          reviewCount: p.total_reviews,
          sellerName: (p.seller as any)?.business_name || "Unknown Seller",
          sellerId: (p.seller as any)?.id,
        })));
      }

      // Fetch flash deals (is_deal=true and deal not expired)
      const { data: flashDealsData } = await supabase
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
        .eq("status", "approved")
        .eq("is_deal", true)
        .gte("deal_expires_at", new Date().toISOString())
        .limit(4);

      if (flashDealsData) {
        setFlashDeals(flashDealsData.map(p => ({
          id: p.id,
          title: p.title,
          price: p.price,
          compareAtPrice: p.compare_at_price,
          image: (p.images as any)?.[0]?.url || "https://images.unsplash.com/photo-1580480055273-228ff5388ef8?w=600&h=600&fit=crop",
          rating: p.rating,
          reviewCount: p.total_reviews,
          sellerName: (p.seller as any)?.business_name || "Unknown Seller",
          sellerId: (p.seller as any)?.id,
        })));
      }

      // Fetch new arrivals (recent products)
      const { data: newArrivalsData } = await supabase
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
        .eq("status", "approved")
        .order("created_at", { ascending: false })
        .limit(4);

      if (newArrivalsData) {
        setNewArrivals(newArrivalsData.map(p => ({
          id: p.id,
          title: p.title,
          price: p.price,
          compareAtPrice: p.compare_at_price,
          image: (p.images as any)?.[0]?.url || "https://images.unsplash.com/photo-1627123424574-724758594e93?w=600&h=600&fit=crop",
          rating: p.rating,
          reviewCount: p.total_reviews,
          sellerName: (p.seller as any)?.business_name || "Unknown Seller",
          sellerId: (p.seller as any)?.id,
        })));
      }

      // Fetch featured vendors (verified sellers)
      const { data: vendorsData } = await supabase
        .from("seller_profiles")
        .select("id, business_name, logo_url, average_rating")
        .eq("status", "approved")
        .not("verified_at", "is", null)
        .limit(4);

      if (vendorsData) {
        setFeaturedVendors(vendorsData.map(v => ({
          id: v.id,
          name: v.business_name,
          logo: v.logo_url || "https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?w=200&h=200&fit=crop",
          rating: v.average_rating || 4.5,
          products: 0,
          verified: true,
        })));
      }
    } catch (error) {
      console.error("Error fetching homepage data:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <CustomerLayout>
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary via-primary/95 to-primary/90 text-primary-foreground overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDE0YzAtMS4xLjktMiAyLTJzMiAuOSAyIDItLjkgMi0yIDItMi0uOS0yLTJ6bS04IDBjMC0xLjEuOS0yIDItMnMyIC45IDIgMi0uOSAyLTIgMi0yLS45LTItMnptLTggMGMwLTEuMS45LTIgMi0yczIgLjkgMiAyLS45IDItMiAyLTItLjktMi0yem0wIDhjMC0xLjEuOS0yIDItMnMyIC45IDIgMi0uOSAyLTIgMi0yLS45LTItMnptOCAwYzAtMS4xLjktMiAyLTJzMiAuOSAyIDItLjkgMi0yIDItMi0uOS0yLTJ6bTggMGMwLTEuMS45LTIgMi0yczIgLjkgMiAyLS45IDItMiAyLTItLjktMi0yem0wIDhjMC0xLjEuOS0yIDItMnMyIC45IDIgMi0uOSAyLTIgMi0yLS45LTItMnptLTggMGMwLTEuMS45LTIgMi0yczIgLjkgMiAyLS45IDItMiAyLTItLjktMi0yem0tOCAwYzAtMS4xLjktMiAyLTJzMiAuOSAyIDItLjkgMi0yIDItMi0uOS0yLTJ6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-20" />
        
        <div className="container relative py-16 md:py-24">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <Badge className="mb-4 bg-accent text-accent-foreground">
                <TrendingUp className="h-3 w-3 mr-1" />
                Trending Now
              </Badge>
              
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
                Shop Smarter, Not Harder
              </h1>
              
              <p className="text-lg md:text-xl text-primary-foreground/90 mb-8 max-w-xl">
                Thousands of trusted sellers. Millions of quality products. Competitive prices and fast, free shipping.
              </p>
              
              <div className="flex flex-wrap gap-4">
                <Link href="/categories">
                  <Button size="lg" className="bg-accent hover:bg-accent/90 text-accent-foreground font-semibold">
                    Shop Now
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Link href="/seller/register">
                  <Button size="lg" variant="outline" className="bg-transparent border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/10">
                    Start Selling
                  </Button>
                </Link>
              </div>
              
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-12">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-accent" />
                  <span className="text-sm">Buyer Protection</span>
                </div>
                <div className="flex items-center gap-2">
                  <Award className="h-5 w-5 text-accent" />
                  <span className="text-sm">Verified Sellers</span>
                </div>
                <div className="flex items-center gap-2">
                  <TruckIcon className="h-5 w-5 text-accent" />
                  <span className="text-sm">Fast Shipping</span>
                </div>
                <div className="flex items-center gap-2">
                  <RefreshCw className="h-5 w-5 text-accent" />
                  <span className="text-sm">Easy Returns</span>
                </div>
              </div>
            </div>

            <div className="hidden md:block">
              <div className="relative">
                <div className="absolute -inset-4 bg-gradient-to-r from-accent/20 to-accent/5 blur-3xl rounded-full"></div>
                <Image
                  src="https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=800&h=800&fit=crop"
                  alt="Shopping"
                  width={600}
                  height={600}
                  className="relative rounded-2xl shadow-2xl"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* NEW: Trending Products Strip */}
      <TrendingStrip />

      {/* NEW: Category Icon Row */}
      <CategoryIconRow />

      {/* NEW: Shocking Deals Section */}
      <ShockingDealsSection />

      {/* Featured Categories */}
      <section className="py-12 md:py-16 bg-background">
        <div className="container">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold mb-2">Shop by Category</h2>
              <p className="text-muted-foreground">Explore our wide range of product categories</p>
            </div>
            <Link href="/categories">
              <Button variant="ghost" className="hidden sm:flex">
                View All
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {featuredCategories.map((category) => (
              <CategoryCard key={category.id} {...category} />
            ))}
          </div>
        </div>
      </section>

      {/* Flash Deals */}
      <section className="py-16 bg-warning/5">
        <div className="container">
          <div className="flex items-center justify-between mb-8">
            <div>
              <Badge className="mb-2 bg-warning text-warning-foreground">
                <Zap className="h-3 w-3 mr-1" />
                Limited Time
              </Badge>
              <h2 className="text-3xl font-bold mb-2">Flash Deals</h2>
              <p className="text-muted-foreground">Hurry! These deals won't last long</p>
            </div>
            <Link href="/deals">
              <Button variant="ghost" className="hidden sm:flex">
                View All Deals
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {flashDeals.map((product) => (
              <ProductCard key={product.id} {...product} />
            ))}
          </div>
        </div>
      </section>

      {/* Best Sellers */}
      <section className="py-16">
        <div className="container">
          <div className="flex items-center justify-between mb-8">
            <div>
              <Badge className="mb-2">
                <TrendingUp className="h-3 w-3 mr-1" />
                Hot Picks
              </Badge>
              <h2 className="text-3xl font-bold mb-2">Best Selling Products</h2>
              <p className="text-muted-foreground">Top rated items customers are loving</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {bestSellers.map((product) => (
              <ProductCard key={product.id} {...product} />
            ))}
          </div>
        </div>
      </section>

      {/* Featured Vendors */}
      <section className="py-16 bg-muted/30">
        <div className="container">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold mb-2">Featured Sellers</h2>
              <p className="text-muted-foreground">Shop from top-rated verified vendors</p>
            </div>
            <Link href="/sellers">
              <Button variant="ghost" className="hidden sm:flex">
                View All Sellers
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredVendors.map((vendor) => (
              <Card key={vendor.id} className="group overflow-hidden hover:shadow-lg transition-shadow">
                <div className="p-6">
                  <div className="relative aspect-square rounded-lg overflow-hidden bg-muted mb-4">
                    <Image
                      src={vendor.logo}
                      alt={vendor.name}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform"
                    />
                  </div>
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold text-lg">{vendor.name}</h3>
                    {vendor.verified && (
                      <Award className="h-5 w-5 text-accent flex-shrink-0" />
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 fill-warning text-warning" />
                      <span className="font-mono">{vendor.rating}</span>
                    </div>
                    <span>•</span>
                    <span>{vendor.products} products</span>
                  </div>
                  <Link href={`/sellers/${vendor.id}`}>
                    <Button variant="outline" size="sm" className="w-full">
                      Visit Store
                    </Button>
                  </Link>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* New Arrivals */}
      <section className="py-16">
        <div className="container">
          <div className="flex items-center justify-between mb-8">
            <div>
              <Badge className="mb-2 bg-green-500 text-white">
                New
              </Badge>
              <h2 className="text-3xl font-bold mb-2">Just Arrived</h2>
              <p className="text-muted-foreground">Check out the latest additions to our catalog</p>
            </div>
            <Link href="/new-arrivals">
              <Button variant="ghost" className="hidden sm:flex">
                View All
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {newArrivals.map((product) => (
              <ProductCard key={product.id} {...product} />
            ))}
          </div>
        </div>
      </section>

      {/* Customer Protection */}
      <section className="py-16 bg-gradient-to-br from-accent/10 via-accent/5 to-transparent">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Shop with Confidence</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Your satisfaction is our priority. We've got you covered every step of the way.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="p-6 text-center hover:shadow-lg transition-shadow">
              <div className="h-16 w-16 rounded-full bg-accent/10 mx-auto mb-4 flex items-center justify-center">
                <ShieldCheck className="h-8 w-8 text-accent" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Buyer Protection</h3>
              <p className="text-sm text-muted-foreground">
                Your money is safe with our secure payment system and money-back guarantee.
              </p>
            </Card>

            <Card className="p-6 text-center hover:shadow-lg transition-shadow">
              <div className="h-16 w-16 rounded-full bg-accent/10 mx-auto mb-4 flex items-center justify-center">
                <Award className="h-8 w-8 text-accent" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Verified Sellers</h3>
              <p className="text-sm text-muted-foreground">
                Every seller is thoroughly vetted and verified before joining our marketplace.
              </p>
            </Card>

            <Card className="p-6 text-center hover:shadow-lg transition-shadow">
              <div className="h-16 w-16 rounded-full bg-accent/10 mx-auto mb-4 flex items-center justify-center">
                <TruckIcon className="h-8 w-8 text-accent" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Fast & Free Shipping</h3>
              <p className="text-sm text-muted-foreground">
                Free delivery on orders over $50. Fast shipping nationwide.
              </p>
            </Card>

            <Card className="p-6 text-center hover:shadow-lg transition-shadow">
              <div className="h-16 w-16 rounded-full bg-accent/10 mx-auto mb-4 flex items-center justify-center">
                <RefreshCw className="h-8 w-8 text-accent" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Easy Returns</h3>
              <p className="text-sm text-muted-foreground">
                Changed your mind? No problem. 30-day hassle-free return policy.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* Why Sell With Us */}
      <section className="py-16 bg-primary text-primary-foreground">
        <div className="container">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold mb-6">
                Start Your Business Today
              </h2>
              <p className="text-lg text-primary-foreground/90 mb-8">
                Join thousands of successful sellers. Reach millions of customers and grow your business on our platform.
              </p>
              
              <div className="grid gap-6 mb-8">
                <div className="flex gap-4">
                  <div className="h-12 w-12 rounded-lg bg-accent flex items-center justify-center flex-shrink-0">
                    <Users className="h-6 w-6 text-accent-foreground" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Millions of Customers</h3>
                    <p className="text-sm text-primary-foreground/80">
                      Get instant access to a massive customer base ready to buy.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="h-12 w-12 rounded-lg bg-accent flex items-center justify-center flex-shrink-0">
                    <DollarSign className="h-6 w-6 text-accent-foreground" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Competitive Fees</h3>
                    <p className="text-sm text-primary-foreground/80">
                      Low commission rates and transparent pricing with no hidden costs.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="h-12 w-12 rounded-lg bg-accent flex items-center justify-center flex-shrink-0">
                    <Zap className="h-6 w-6 text-accent-foreground" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Easy Setup</h3>
                    <p className="text-sm text-primary-foreground/80">
                      Get your store up and running in minutes with our simple onboarding.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-4">
                <Link href="/seller/register">
                  <Button size="lg" className="bg-accent hover:bg-accent/90 text-accent-foreground font-semibold">
                    Register as Seller
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Link href="/seller-info">
                  <Button size="lg" variant="outline" className="bg-transparent border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/10">
                    Learn More
                  </Button>
                </Link>
              </div>
            </div>

            <div className="hidden md:block">
              <Image
                src="https://images.unsplash.com/photo-1556740758-90de374c12ad?w=800&h=800&fit=crop"
                alt="Seller Dashboard"
                width={600}
                height={600}
                className="rounded-2xl shadow-2xl"
              />
            </div>
          </div>
        </div>
      </section>
    </CustomerLayout>
  );
}