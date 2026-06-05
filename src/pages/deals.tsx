"use client";

import { CustomerLayout } from "@/components/CustomerLayout";
import { ProductCard } from "@/components/ProductCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Zap, Clock, TrendingDown, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";

export default function DealsPage() {
  const [deals, setDeals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    maxDiscount: 0,
    activeDeals: 0,
    totalSavings: 0,
  });

  useEffect(() => {
    fetchDeals();
  }, []);

  const fetchDeals = async () => {
    setLoading(true);
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
          seller:seller_profiles!seller_id(id, business_name)
        `)
        .eq("status", "approved")
        .eq("is_deal", true)
        .gte("deal_expires_at", new Date().toISOString())
        .limit(20);

      if (error) {
        setDeals([]);
        return;
      }

      const formattedDeals = (data || []).map((p: any) => ({
        id: p.id,
        title: p.title,
        price: p.price,
        compareAtPrice: p.compare_at_price || p.price * 1.3,
        image: p.images?.[0]?.url || "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&h=600&fit=crop",
        rating: p.rating || 4.5,
        reviewCount: p.total_reviews || 0,
        sellerName: p.seller?.business_name || "Unknown Seller",
        sellerId: p.seller?.id,
      }));

      setDeals(formattedDeals);

      // Calculate stats
      let maxDisc = 0;
      let totalSav = 0;
      formattedDeals.forEach((deal) => {
        if (deal.compareAtPrice > deal.price) {
          const disc = Math.round(((deal.compareAtPrice - deal.price) / deal.compareAtPrice) * 100);
          if (disc > maxDisc) maxDisc = disc;
          totalSav += deal.compareAtPrice - deal.price;
        }
      });

      setStats({
        maxDiscount: maxDisc,
        activeDeals: formattedDeals.length,
        totalSavings: totalSav,
      });
    } catch (error) {
      setDeals([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <CustomerLayout>
      {/* Hero Banner */}
      <div className="bg-gradient-to-r from-warning/20 via-warning/10 to-transparent border-b">
        <div className="container py-12">
          <div className="flex items-center gap-4 mb-4">
            <Zap className="h-12 w-12 text-warning" />
            <div>
              <h1 className="text-4xl font-bold mb-2">Today's Flash Deals</h1>
              <p className="text-lg text-muted-foreground">
                Limited time offers — up to {stats.maxDiscount}% off on selected products
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-4 text-sm">
            <Badge className="bg-destructive text-destructive-foreground">
              <Clock className="h-3 w-3 mr-1" />
              Limited Time
            </Badge>
            <span className="text-muted-foreground">
              Deals updated regularly
            </span>
          </div>
        </div>
      </div>

      {/* Deal Stats */}
      <div className="border-b bg-muted/30">
        <div className="container py-6">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <Card className="p-4 text-center">
              <TrendingDown className="h-8 w-8 text-accent mx-auto mb-2" />
              <p className="text-2xl font-bold font-mono">{stats.maxDiscount}%</p>
              <p className="text-sm text-muted-foreground">Max Discount</p>
            </Card>
            <Card className="p-4 text-center">
              <Zap className="h-8 w-8 text-warning mx-auto mb-2" />
              <p className="text-2xl font-bold font-mono">{stats.activeDeals}</p>
              <p className="text-sm text-muted-foreground">Active Deals</p>
            </Card>
            <Card className="p-4 text-center">
              <div className="h-8 w-8 bg-primary rounded-full mx-auto mb-2 flex items-center justify-center text-primary-foreground font-bold">
                $
              </div>
              <p className="text-2xl font-bold font-mono">${stats.totalSavings.toFixed(0)}</p>
              <p className="text-sm text-muted-foreground">Total Savings</p>
            </Card>
          </div>
        </div>
      </div>

      {/* Flash Deals Grid */}
      <div className="container py-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">Lightning Deals</h2>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="text-center">
              <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-primary" />
              <p className="text-muted-foreground">Loading deals...</p>
            </div>
          </div>
        ) : deals.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {deals.map((product) => (
              <ProductCard key={product.id} {...product} />
            ))}
          </div>
        ) : (
          <Card className="p-12 text-center">
            <Zap className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <p className="text-lg font-semibold mb-2">No active deals right now</p>
            <p className="text-muted-foreground mb-6">
              Check back soon for new deals!
            </p>
            <Button onClick={() => window.location.href = "/products"}>
              Browse All Products
            </Button>
          </Card>
        )}
      </div>
    </CustomerLayout>
  );
}