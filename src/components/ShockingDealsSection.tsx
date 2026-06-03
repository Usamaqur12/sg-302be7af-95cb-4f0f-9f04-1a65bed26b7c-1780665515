"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DealProductCard } from "./DealProductCard";
import { Zap } from "lucide-react";

interface DealProduct {
  id: string;
  title: string;
  price: number;
  oldPrice: number;
  discount: number;
  image: string;
  rating: number;
  category: string;
}

const dealProducts: DealProduct[] = [
  {
    id: "deal-1",
    title: "iPhone 15 Pro Max 256GB",
    price: 999.99,
    oldPrice: 1199.99,
    discount: 17,
    image: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400",
    rating: 4.9,
    category: "smartphone",
  },
  {
    id: "deal-2",
    title: "Samsung Galaxy S24 Ultra",
    price: 899.99,
    oldPrice: 1099.99,
    discount: 18,
    image: "https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=400",
    rating: 4.8,
    category: "smartphone",
  },
  {
    id: "deal-3",
    title: "iPad Pro 12.9-inch M2",
    price: 799.99,
    oldPrice: 1099.99,
    discount: 27,
    image: "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=400",
    rating: 4.9,
    category: "smartphone",
  },
  {
    id: "deal-4",
    title: "Apple Watch Series 9",
    price: 349.99,
    oldPrice: 499.99,
    discount: 30,
    image: "https://images.unsplash.com/photo-1579586337278-3befd40fd17a?w=400",
    rating: 4.7,
    category: "smartphone",
  },
  {
    id: "deal-5",
    title: "MacBook Pro 14-inch M3",
    price: 1599.99,
    oldPrice: 1999.99,
    discount: 20,
    image: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400",
    rating: 4.9,
    category: "laptop",
  },
  {
    id: "deal-6",
    title: "Dell XPS 15 Ultra Thin",
    price: 1299.99,
    oldPrice: 1699.99,
    discount: 24,
    image: "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=400",
    rating: 4.8,
    category: "laptop",
  },
  {
    id: "deal-7",
    title: "ASUS ROG Gaming Laptop",
    price: 1199.99,
    oldPrice: 1599.99,
    discount: 25,
    image: "https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=400",
    rating: 4.8,
    category: "laptop",
  },
  {
    id: "deal-8",
    title: "Lenovo ThinkPad X1 Carbon",
    price: 1099.99,
    oldPrice: 1499.99,
    discount: 27,
    image: "https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=400",
    rating: 4.7,
    category: "laptop",
  },
  {
    id: "deal-9",
    title: "Sony WH-1000XM5 Headphones",
    price: 299.99,
    oldPrice: 399.99,
    discount: 25,
    image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400",
    rating: 4.9,
    category: "electronics",
  },
  {
    id: "deal-10",
    title: "Canon EOS R6 Mark II",
    price: 1999.99,
    oldPrice: 2499.99,
    discount: 20,
    image: "https://images.unsplash.com/photo-1606510907744-a6ec26c0ecfd?w=400",
    rating: 4.8,
    category: "electronics",
  },
  {
    id: "deal-11",
    title: "DJI Mavic 3 Pro Drone",
    price: 1699.99,
    oldPrice: 2199.99,
    discount: 23,
    image: "https://images.unsplash.com/photo-1473968512647-3e447244af8f?w=400",
    rating: 4.9,
    category: "electronics",
  },
  {
    id: "deal-12",
    title: "Bose SoundLink Revolve+",
    price: 249.99,
    oldPrice: 329.99,
    discount: 24,
    image: "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=400",
    rating: 4.7,
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
    <div className="container py-12">
      <Card className="overflow-hidden">
        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full justify-start rounded-none border-b bg-muted/30 h-auto p-0">
            <TabsTrigger
              value="smartphone"
              className="rounded-none data-[state=active]:bg-destructive data-[state=active]:text-destructive-foreground px-8 py-4 font-semibold"
            >
              Smartphone & Tablet
            </TabsTrigger>
            <TabsTrigger
              value="laptop"
              className="rounded-none data-[state=active]:bg-destructive data-[state=active]:text-destructive-foreground px-8 py-4 font-semibold"
            >
              Laptop
            </TabsTrigger>
            <TabsTrigger
              value="electronics"
              className="rounded-none data-[state=active]:bg-destructive data-[state=active]:text-destructive-foreground px-8 py-4 font-semibold"
            >
              Electronics
            </TabsTrigger>
          </TabsList>

          {/* Deals Content */}
          <div className="grid md:grid-cols-12 gap-6 p-6 bg-gradient-to-br from-destructive via-destructive/90 to-accent">
            {/* Left Banner */}
            <div className="md:col-span-4 flex flex-col justify-center items-center text-center space-y-4 p-8 relative">
              <div className="absolute inset-0 opacity-10">
                <Zap className="absolute top-4 left-4 h-16 w-16 text-white" />
                <Zap className="absolute bottom-4 right-4 h-20 w-20 text-white rotate-180" />
              </div>
              
              <div className="relative z-10 space-y-4">
                <h2 className="text-5xl font-black text-white leading-tight drop-shadow-lg">
                  SHOCKING
                  <br />
                  DEALS!!!
                </h2>
                <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4 border-2 border-white/30">
                  <p className="text-2xl font-bold text-white mb-1">BLACK FRIDAY</p>
                  <p className="text-xl font-semibold text-white/90">SALE</p>
                </div>
                <p className="text-6xl font-black text-white drop-shadow-lg">
                  UP TO
                  <br />
                  <span className="text-7xl">70%</span>
                </p>
                <div className="flex gap-4 justify-center mt-6">
                  <div className="relative w-16 h-16 opacity-20">
                    <div className="absolute inset-0 bg-white rounded-lg rotate-12"></div>
                  </div>
                  <div className="relative w-20 h-20 opacity-30">
                    <div className="absolute inset-0 bg-white rounded-lg -rotate-6"></div>
                  </div>
                  <div className="relative w-16 h-16 opacity-20">
                    <div className="absolute inset-0 bg-white rounded-lg rotate-12"></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Product Cards */}
            <div className="md:col-span-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
                  endDate={dealEndDate}
                />
              ))}
            </div>
          </div>
        </Tabs>
      </Card>
    </div>
  );
}