"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DealProductCard } from "./DealProductCard";
import { Zap, ArrowRight } from "lucide-react";

interface DealProduct {
  id: string;
  title: string;
  price: number;
  oldPrice: number;
  discount: number;
  image: string;
  rating: number;
  reviews: number;
  seller: string;
  category: string;
}

const dealProducts: DealProduct[] = [
  {
    id: "deal-1",
    title: "iPhone 15 Pro Max 256GB",
    price: 999.99,
    oldPrice: 1199.99,
    discount: 17,
    image: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400&h=400&fit=crop",
    rating: 4.9,
    reviews: 2847,
    seller: "TechPro Store",
    category: "smartphone",
  },
  {
    id: "deal-2",
    title: "Samsung Galaxy S24 Ultra",
    price: 899.99,
    oldPrice: 1099.99,
    discount: 18,
    image: "https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=400&h=400&fit=crop",
    rating: 4.8,
    reviews: 1923,
    seller: "Mobile Masters",
    category: "smartphone",
  },
  {
    id: "deal-3",
    title: "iPad Pro 12.9-inch M2",
    price: 799.99,
    oldPrice: 1099.99,
    discount: 27,
    image: "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=400&h=400&fit=crop",
    rating: 4.9,
    reviews: 3124,
    seller: "Apple Zone",
    category: "smartphone",
  },
  {
    id: "deal-4",
    title: "Apple Watch Series 9",
    price: 349.99,
    oldPrice: 499.99,
    discount: 30,
    image: "https://images.unsplash.com/photo-1579586337278-3befd40fd17a?w=400&h=400&fit=crop",
    rating: 4.7,
    reviews: 1567,
    seller: "Wearable Tech",
    category: "smartphone",
  },
  {
    id: "deal-5",
    title: "MacBook Pro 14-inch M3",
    price: 1599.99,
    oldPrice: 1999.99,
    discount: 20,
    image: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400&h=400&fit=crop",
    rating: 4.9,
    reviews: 4532,
    seller: "Laptop Hub",
    category: "laptop",
  },
  {
    id: "deal-6",
    title: "Dell XPS 15 Ultra Thin",
    price: 1299.99,
    oldPrice: 1699.99,
    discount: 24,
    image: "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=400&h=400&fit=crop",
    rating: 4.8,
    reviews: 2198,
    seller: "PC World",
    category: "laptop",
  },
  {
    id: "deal-7",
    title: "ASUS ROG Gaming Laptop",
    price: 1199.99,
    oldPrice: 1599.99,
    discount: 25,
    image: "https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=400&h=400&fit=crop",
    rating: 4.8,
    reviews: 3421,
    seller: "Gaming Gear",
    category: "laptop",
  },
  {
    id: "deal-8",
    title: "Lenovo ThinkPad X1 Carbon",
    price: 1099.99,
    oldPrice: 1499.99,
    discount: 27,
    image: "https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=400&h=400&fit=crop",
    rating: 4.7,
    reviews: 1876,
    seller: "Business Tech",
    category: "laptop",
  },
  {
    id: "deal-9",
    title: "Sony WH-1000XM5 Headphones",
    price: 299.99,
    oldPrice: 399.99,
    discount: 25,
    image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=400&fit=crop",
    rating: 4.9,
    reviews: 5621,
    seller: "Audio Pro",
    category: "electronics",
  },
  {
    id: "deal-10",
    title: "Canon EOS R6 Mark II",
    price: 1999.99,
    oldPrice: 2499.99,
    discount: 20,
    image: "https://images.unsplash.com/photo-1606510907744-a6ec26c0ecfd?w=400&h=400&fit=crop",
    rating: 4.8,
    reviews: 892,
    seller: "Photo Masters",
    category: "electronics",
  },
  {
    id: "deal-11",
    title: "DJI Mavic 3 Pro Drone",
    price: 1699.99,
    oldPrice: 2199.99,
    discount: 23,
    image: "https://images.unsplash.com/photo-1473968512647-3e447244af8f?w=400&h=400&fit=crop",
    rating: 4.9,
    reviews: 1234,
    seller: "Sky Tech",
    category: "electronics",
  },
  {
    id: "deal-12",
    title: "Bose SoundLink Revolve+",
    price: 249.99,
    oldPrice: 329.99,
    discount: 24,
    image: "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=400&h=400&fit=crop",
    rating: 4.7,
    reviews: 3456,
    seller: "Sound Solutions",
    category: "electronics",
  },
];

export function ShockingDealsSection() {
  const [activeTab, setActiveTab] = useState("smartphone");

  // Calculate end date (3 days from now)
  const dealEndDate = new Date();
  dealEndDate.setDate(dealEndDate.getDate() + 3);
  dealEndDate.setHours(23, 59, 59);

  const filteredProducts = dealProducts.filter(
    (product) => product.category === activeTab
  );

  return (
    <section className="py-12 bg-background">
      <div className="container max-w-7xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl md:text-3xl font-bold">Trending Categories & Shocking Deals</h2>
        </div>

        <Card className="overflow-hidden shadow-xl">
          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="w-full justify-start rounded-none border-b bg-transparent h-auto p-0 overflow-x-auto flex-nowrap">
              <TabsTrigger
                value="smartphone"
                className="rounded-t-lg rounded-b-none data-[state=active]:bg-gradient-to-br data-[state=active]:from-accent data-[state=active]:to-accent/90 data-[state=active]:text-white data-[state=inactive]:bg-muted/50 px-6 py-3 font-semibold text-sm md:text-base transition-all whitespace-nowrap"
              >
                Smartphone & Tablet
              </TabsTrigger>
              <TabsTrigger
                value="laptop"
                className="rounded-t-lg rounded-b-none data-[state=active]:bg-gradient-to-br data-[state=active]:from-accent data-[state=active]:to-accent/90 data-[state=active]:text-white data-[state=inactive]:bg-muted/50 px-6 py-3 font-semibold text-sm md:text-base transition-all whitespace-nowrap"
              >
                Laptop
              </TabsTrigger>
              <TabsTrigger
                value="electronics"
                className="rounded-t-lg rounded-b-none data-[state=active]:bg-gradient-to-br data-[state=active]:from-accent data-[state=active]:to-accent/90 data-[state=active]:text-white data-[state=inactive]:bg-muted/50 px-6 py-3 font-semibold text-sm md:text-base transition-all whitespace-nowrap"
              >
                Electronics
              </TabsTrigger>
            </TabsList>

            {/* Deals Content */}
            <div className="relative overflow-hidden rounded-b-lg">
              {/* Background Pattern */}
              <div className="absolute inset-0 bg-gradient-to-br from-accent via-accent/95 to-accent/80">
                <div className="absolute inset-0 opacity-10" style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                }}></div>
              </div>

              <div className="relative grid lg:grid-cols-12 gap-0">
                {/* Left Sale Banner - 30% */}
                <div className="lg:col-span-4 xl:col-span-3 flex flex-col justify-center items-center text-center p-6 lg:p-8 border-r border-white/20">
                  <div className="space-y-4 lg:space-y-6">
                    <div className="relative">
                      <Zap className="h-12 w-12 lg:h-16 lg:w-16 text-amber-300 mx-auto animate-pulse" fill="currentColor" />
                    </div>
                    
                    <div>
                      <h3 className="text-3xl lg:text-4xl xl:text-5xl font-black text-white leading-tight drop-shadow-lg mb-2">
                        SHOCKING
                        <br />
                        DEALS
                      </h3>
                    </div>

                    <div className="bg-white/20 backdrop-blur-sm rounded-xl p-3 lg:p-4 border-2 border-white/40">
                      <p className="text-lg lg:text-xl font-bold text-white mb-1">BLACK FRIDAY</p>
                      <p className="text-base lg:text-lg font-semibold text-white/90">SALE</p>
                    </div>

                    <div>
                      <p className="text-xl lg:text-2xl font-bold text-white/90 mb-2">UP TO</p>
                      <p className="text-5xl lg:text-6xl xl:text-7xl font-black text-white drop-shadow-lg">
                        70<span className="text-4xl lg:text-5xl">%</span>
                      </p>
                      <p className="text-xl lg:text-2xl font-bold text-white/90 mt-2">OFF</p>
                    </div>

                    <Button 
                      size="lg" 
                      className="bg-white hover:bg-white/90 text-accent font-bold shadow-xl hover:shadow-2xl transition-all hover:scale-105 mt-4"
                    >
                      Shop Deals
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                  </div>
                </div>

                {/* Right Product Cards - 70% */}
                <div className="lg:col-span-8 xl:col-span-9 p-4 lg:p-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                    {filteredProducts.map((product) => (
                      <DealProductCard
                        key={product.id}
                        id={product.id}
                        title={product.title}
                        price={product.price}
                        oldPrice={product.oldPrice}
                        discount={product.discount}
                        image={product.image}
                        rating={product.rating}
                        reviews={product.reviews}
                        seller={product.seller}
                        endDate={dealEndDate}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </Tabs>
        </Card>
      </div>
    </section>
  );
}