"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";

interface TrendingProduct {
  id: string;
  title: string;
  price: number;
  image: string;
}

export function TrendingStrip() {
  const [trendingProducts, setTrendingProducts] = useState<TrendingProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTrendingProducts();
  }, []);

  const fetchTrendingProducts = async () => {
    try {
      const { data } = await supabase
        .from("products")
        .select(`
          id,
          title,
          price,
          images:product_images(url)
        `)
        .eq("status", "approved")
        .order("total_reviews", { ascending: false })
        .limit(5);

      if (data && data.length > 0) {
        setTrendingProducts(data.map(p => ({
          id: p.id,
          title: p.title,
          price: p.price,
          image: (p.images as any)?.[0]?.url || "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=100",
        })));
      }
    } catch (error) {
      // Silent error handling
    } finally {
      setLoading(false);
    }
  };

  if (loading || trendingProducts.length === 0) {
    return null; // Don't show section if loading or no products
  }

  return (
    <div className="bg-card border-y">
      <div className="container py-4">
        <div className="flex items-center gap-6 overflow-x-auto">
          <Badge variant="destructive" className="flex-shrink-0 font-semibold px-4 py-2">
            THIS MONTH TRENDING
          </Badge>

          {trendingProducts.map((product, index) => (
            <div key={product.id} className="flex items-center gap-6 flex-shrink-0">
              <Link
                href={`/products/${product.id}`}
                className="flex items-center gap-3 hover:opacity-80 transition-opacity"
              >
                <div className="relative w-12 h-12 rounded overflow-hidden bg-muted">
                  <Image src={product.image} alt={product.title} fill className="object-cover" />
                </div>
                <div>
                  <p className="text-sm font-medium line-clamp-1">{product.title}</p>
                  <p className="text-sm font-mono font-bold text-destructive">
                    ${product.price.toFixed(2)}
                  </p>
                </div>
              </Link>
              {index < trendingProducts.length - 1 && (
                <Separator orientation="vertical" className="h-12" />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}