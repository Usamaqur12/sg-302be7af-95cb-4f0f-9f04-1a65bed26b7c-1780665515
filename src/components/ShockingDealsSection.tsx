"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DealProductCard } from "./DealProductCard";
import { Zap, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

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

export function ShockingDealsSection() {
  const [activeTab, setActiveTab] = useState("all");
  const [dealProducts, setDealProducts] = useState<DealProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDealProducts();
  }, []);

  const fetchDealProducts = async () => {
    try {
      const { data, error } = await supabase
        .from("products")
        .select(`
          id,
          title,
          price,
          compare_at_price,
          rating,
          total_reviews,
          images:product_images(url),
          seller:seller_profiles!seller_id(business_name),
          category:categories(name)
        `)
        .eq("status", "approved")
        .eq("is_deal", true)
        .gte("deal_expires_at", new Date().toISOString())
        .limit(12);

      if (error) {
        setDealProducts([]);
        setLoading(false);
        return;
      }

      if (data) {
        const formattedDeals = data.map((p: any) => {
          const comparePrice = p.compare_at_price || p.price * 1.3;
          const discount = Math.round(((comparePrice - p.price) / comparePrice) * 100);
          
          return {
            id: p.id,
            title: p.title,
            price: p.price,
            oldPrice: comparePrice,
            discount: discount,
            image: p.images?.[0]?.url || "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400&h=400&fit=crop",
            rating: p.rating || 4.5,
            reviews: p.total_reviews || 0,
            seller: p.seller?.business_name || "Unknown Seller",
            category: p.category?.name?.toLowerCase() || "all",
          };
        });

        setDealProducts(formattedDeals);
        
        // Set first available category as active tab
        if (formattedDeals.length > 0) {
          const firstCategory = formattedDeals[0].category;
          setActiveTab(firstCategory);
        }
      }
    } catch (error) {
      setDealProducts([]);
    } finally {
      setLoading(false);
    }
  };

  // Calculate end date (3 days from now)
  const dealEndDate = new Date();
  dealEndDate.setDate(dealEndDate.getDate() + 3);
  dealEndDate.setHours(23, 59, 59);

  const filteredProducts = activeTab === "all" 
    ? dealProducts 
    : dealProducts.filter((product) => product.category === activeTab);

  // Get unique categories for tabs
  const categories = Array.from(new Set(dealProducts.map(p => p.category)));
  const availableTabs = ["all", ...categories.slice(0, 3)];

  if (loading) {
    return (
      <section className="py-12 bg-background">
        <div className="container max-w-7xl">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded w-1/3"></div>
            <div className="h-64 bg-muted rounded"></div>
          </div>
        </div>
      </section>
    );
  }

  if (dealProducts.length === 0) {
    return null; // Don't show section if no deals
  }

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
              {availableTabs.map((tab) => (
                <TabsTrigger
                  key={tab}
                  value={tab}
                  className="rounded-t-lg rounded-b-none data-[state=active]:bg-gradient-to-br data-[state=active]:from-accent data-[state=active]:to-accent/90 data-[state=active]:text-white data-[state=inactive]:bg-muted/50 px-6 py-3 font-semibold text-sm md:text-base transition-all whitespace-nowrap capitalize"
                >
                  {tab === "all" ? "All Deals" : tab}
                </TabsTrigger>
              ))}
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
                      asChild
                    >
                      <a href="/deals">
                        Shop Deals
                        <ArrowRight className="ml-2 h-5 w-5" />
                      </a>
                    </Button>
                  </div>
                </div>

                {/* Right Product Cards - 70% */}
                <div className="lg:col-span-8 xl:col-span-9 p-4 lg:p-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                    {filteredProducts.slice(0, 4).map((product) => (
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