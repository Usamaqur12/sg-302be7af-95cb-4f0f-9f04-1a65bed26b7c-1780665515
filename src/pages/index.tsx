"use client";

import { CustomerLayout } from "@/components/CustomerLayout";
import { ProductCard } from "@/components/ProductCard";
import { CategoryCard } from "@/components/CategoryCard";
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
  Zap
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";

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
  {
    id: "5",
    name: "Books & Media",
    slug: "books-media",
    image: "https://images.unsplash.com/photo-1495446815901-a7297e633e8d?w=800&h=800&fit=crop",
    productCount: 923,
  },
  {
    id: "6",
    name: "Toys & Kids",
    slug: "toys-kids",
    image: "https://images.unsplash.com/photo-1560582861-45078880e48e?w=800&h=800&fit=crop",
    productCount: 445,
  },
];

const bestSellers = [
  {
    id: "1",
    title: "Wireless Noise Cancelling Headphones",
    price: 199.99,
    compareAtPrice: 299.99,
    image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&h=600&fit=crop",
    rating: 4.8,
    reviewCount: 1234,
    sellerName: "TechPro Store",
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

const flashDeals = [
  {
    id: "5",
    title: "Ergonomic Office Chair",
    price: 299.99,
    compareAtPrice: 499.99,
    image: "https://images.unsplash.com/photo-1580480055273-228ff5388ef8?w=600&h=600&fit=crop",
    rating: 4.5,
    reviewCount: 321,
    sellerName: "Office Plus",
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
  },
];

const newArrivals = [
  {
    id: "9",
    title: "Premium Leather Wallet",
    price: 89.99,
    image: "https://images.unsplash.com/photo-1627123424574-724758594e93?w=600&h=600&fit=crop",
    rating: 4.7,
    reviewCount: 89,
    sellerName: "Leather Crafts",
  },
  {
    id: "10",
    title: "Stainless Steel Water Bottle",
    price: 29.99,
    image: "https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=600&h=600&fit=crop",
    rating: 4.8,
    reviewCount: 234,
    sellerName: "EcoLife",
  },
  {
    id: "11",
    title: "Wireless Charging Pad",
    price: 39.99,
    image: "https://images.unsplash.com/photo-1591290619762-92b9ad6d1ca6?w=600&h=600&fit=crop",
    rating: 4.5,
    reviewCount: 156,
    sellerName: "TechPro Store",
  },
  {
    id: "12",
    title: "Designer Sunglasses",
    price: 149.99,
    image: "https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=600&h=600&fit=crop",
    rating: 4.6,
    reviewCount: 78,
    sellerName: "Fashion Hub",
  },
];

const featuredVendors = [
  {
    id: "1",
    name: "TechPro Store",
    logo: "https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?w=200&h=200&fit=crop",
    rating: 4.9,
    products: 342,
    verified: true,
  },
  {
    id: "2",
    name: "Fashion Hub",
    logo: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=200&h=200&fit=crop",
    rating: 4.8,
    products: 567,
    verified: true,
  },
  {
    id: "3",
    name: "Home Essentials",
    logo: "https://images.unsplash.com/photo-1484101403633-562f891dc89a?w=200&h=200&fit=crop",
    rating: 4.7,
    products: 289,
    verified: true,
  },
  {
    id: "4",
    name: "Gaming Gear",
    logo: "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=200&h=200&fit=crop",
    rating: 4.9,
    products: 421,
    verified: true,
  },
];

export default function HomePage() {
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

      {/* Featured Categories */}
      <section className="py-16 bg-background">
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