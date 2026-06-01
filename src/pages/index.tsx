"use client";

import { CustomerLayout } from "@/components/CustomerLayout";
import { ProductCard } from "@/components/ProductCard";
import { CategoryCard } from "@/components/CategoryCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, TrendingUp, Award, ShieldCheck } from "lucide-react";
import Link from "next/link";

const featuredCategories = [
  {
    id: "1",
    name: "Electronics",
    slug: "electronics",
    image: "https://images.unsplash.com/photo-1498049794561-7780e7231661?w=800&h=800&fit=crop",
    productCount: 1243,
  },
  {
    id: "2",
    name: "Fashion",
    slug: "fashion",
    image: "https://images.unsplash.com/photo-1445205170230-053b83016050?w=800&h=800&fit=crop",
    productCount: 2156,
  },
  {
    id: "3",
    name: "Home & Garden",
    slug: "home-garden",
    image: "https://images.unsplash.com/photo-1556912173-46c336c7fd55?w=800&h=800&fit=crop",
    productCount: 876,
  },
  {
    id: "4",
    name: "Sports & Outdoors",
    slug: "sports-outdoors",
    image: "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=800&h=800&fit=crop",
    productCount: 654,
  },
];

const trendingProducts = [
  {
    id: "1",
    title: "Wireless Noise Cancelling Headphones",
    price: 199.99,
    compareAtPrice: 299.99,
    image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&h=600&fit=crop",
    rating: 4.8,
    reviewCount: 1234,
    sellerName: "TechPro Store",
    isDeal: true,
  },
  {
    id: "2",
    title: "Smart Watch Series 7",
    price: 349.99,
    image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&h=600&fit=crop",
    rating: 4.6,
    reviewCount: 892,
    sellerName: "Wearable Tech",
  },
  {
    id: "3",
    title: "Professional DSLR Camera",
    price: 1299.99,
    compareAtPrice: 1599.99,
    image: "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=600&h=600&fit=crop",
    rating: 4.9,
    reviewCount: 567,
    sellerName: "Photo Masters",
    isDeal: true,
  },
  {
    id: "4",
    title: "Gaming Laptop RTX 4070",
    price: 1899.99,
    image: "https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=600&h=600&fit=crop",
    rating: 4.7,
    reviewCount: 432,
    sellerName: "Gaming Gear",
  },
];

const deals = [
  {
    id: "5",
    title: "Ergonomic Office Chair",
    price: 299.99,
    compareAtPrice: 499.99,
    image: "https://images.unsplash.com/photo-1580480055273-228ff5388ef8?w=600&h=600&fit=crop",
    rating: 4.5,
    reviewCount: 321,
    sellerName: "Office Plus",
    isDeal: true,
  },
  {
    id: "6",
    title: "4K Ultra HD Smart TV 55\"",
    price: 599.99,
    compareAtPrice: 899.99,
    image: "https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=600&h=600&fit=crop",
    rating: 4.7,
    reviewCount: 789,
    sellerName: "Home Electronics",
    isDeal: true,
  },
  {
    id: "7",
    title: "Bluetooth Speaker Waterproof",
    price: 79.99,
    compareAtPrice: 129.99,
    image: "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=600&h=600&fit=crop",
    rating: 4.4,
    reviewCount: 1456,
    sellerName: "Sound Solutions",
    isDeal: true,
  },
  {
    id: "8",
    title: "Mechanical Gaming Keyboard RGB",
    price: 149.99,
    compareAtPrice: 229.99,
    image: "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=600&h=600&fit=crop",
    rating: 4.8,
    reviewCount: 654,
    sellerName: "Gaming Gear",
    isDeal: true,
  },
];

export default function HomePage() {
  return (
    <CustomerLayout>
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary via-primary/95 to-primary/90 text-primary-foreground overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDE0YzAtMS4xLjktMiAyLTJzMiAuOSAyIDItLjkgMi0yIDItMi0uOS0yLTJ6bS04IDBjMC0xLjEuOS0yIDItMnMyIC45IDIgMi0uOSAyLTIgMi0yLS45LTItMnptLTggMGMwLTEuMS45LTIgMi0yczIgLjkgMiAyLS45IDItMiAyLTItLjktMi0yem0wIDhjMC0xLjEuOS0yIDItMnMyIC45IDIgMi0uOSAyLTIgMi0yLS45LTItMnptOCAwYzAtMS4xLjktMiAyLTJzMiAuOSAyIDItLjkgMi0yIDItMi0uOS0yLTJ6bTggMGMwLTEuMS45LTIgMi0yczIgLjkgMiAyLS45IDItMiAyLTItLjktMi0yem0wIDhjMC0xLjEuOS0yIDItMnMyIC45IDIgMi0uOSAyLTIgMi0yLS45LTItMnptLTggMGMwLTEuMS45LTIgMi0yczIgLjkgMiAyLS45IDItMiAyLTItLjktMi0yem0tOCAwYzAtMS4xLjktMiAyLTJzMiAuOSAyIDItLjkgMi0yIDItMi0uOS0yLTJ6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-20" />
        
        <div className="container relative py-20 md:py-32">
          <div className="max-w-3xl">
            <Badge className="mb-6 bg-accent text-accent-foreground">
              <TrendingUp className="h-3 w-3 mr-1" />
              Trending Now
            </Badge>
            
            <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
              Discover Quality Products from Verified Sellers
            </h1>
            
            <p className="text-lg md:text-xl text-primary-foreground/90 mb-8 max-w-2xl">
              Shop from thousands of trusted sellers. Competitive prices, fast shipping, and quality guaranteed.
            </p>
            
            <div className="flex flex-wrap gap-4">
              <Link href="/categories">
                <Button size="lg" className="bg-accent hover:bg-accent/90 text-accent-foreground font-semibold">
                  Browse Categories
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href="/deals">
                <Button size="lg" variant="outline" className="bg-transparent border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/10">
                  Today's Deals
                </Button>
              </Link>
            </div>
            
            <div className="flex items-center gap-8 mt-12 text-sm">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5" />
                <span>Buyer Protection</span>
              </div>
              <div className="flex items-center gap-2">
                <Award className="h-5 w-5" />
                <span>Verified Sellers</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Categories */}
      <section className="py-16">
        <div className="container">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold mb-2">Shop by Category</h2>
              <p className="text-muted-foreground">Explore our wide range of product categories</p>
            </div>
            <Link href="/categories">
              <Button variant="ghost">
                View All
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {featuredCategories.map((category) => (
              <CategoryCard key={category.id} {...category} />
            ))}
          </div>
        </div>
      </section>

      {/* Today's Deals */}
      <section className="py-16 bg-warning/5">
        <div className="container">
          <div className="flex items-center justify-between mb-8">
            <div>
              <Badge className="mb-2 bg-warning text-warning-foreground">Limited Time</Badge>
              <h2 className="text-3xl font-bold mb-2">Today's Best Deals</h2>
              <p className="text-muted-foreground">Don't miss out on these amazing offers</p>
            </div>
            <Link href="/deals">
              <Button variant="ghost">
                View All Deals
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {deals.map((product) => (
              <ProductCard key={product.id} {...product} />
            ))}
          </div>
        </div>
      </section>

      {/* Trending Products */}
      <section className="py-16">
        <div className="container">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold mb-2">Trending Products</h2>
              <p className="text-muted-foreground">Popular items customers are loving</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {trendingProducts.map((product) => (
              <ProductCard key={product.id} {...product} />
            ))}
          </div>
        </div>
      </section>

      {/* Seller CTA */}
      <section className="py-16 bg-gradient-to-r from-accent/10 via-accent/5 to-transparent">
        <div className="container">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Start Selling Today</h2>
            <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
              Join thousands of successful sellers. Reach millions of customers and grow your business on our platform.
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Link href="/seller/register">
                <Button size="lg" className="bg-accent hover:bg-accent/90 font-semibold">
                  Register as Seller
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href="/seller-info">
                <Button size="lg" variant="outline">
                  Learn More
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </CustomerLayout>
  );
}