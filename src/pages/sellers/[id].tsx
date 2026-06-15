"use client";

import { CustomerLayout } from "@/components/CustomerLayout";
import { ProductCard } from "@/components/ProductCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { Store, MapPin, Star, Phone, Mail, Package, TrendingUp, Shield, Loader2 } from "lucide-react";
import Image from "next/image";

interface SellerProfile {
  id: string;
  business_name: string;
  business_description: string;
  business_email: string;
  business_phone: string;
  logo_url: string | null;
  banner_url: string | null;
  rating: number;
  total_reviews: number;
  total_sales: number;
  verified_at: string | null;
}

interface Product {
  id: string;
  title: string;
  price: number;
  compare_at_price: number | null;
  deal_expires_at: string | null;
  rating: number;
  total_reviews: number;
  images: { url: string }[];
  seller: { business_name: string };
}

export default function SellerStorePage() {
  const router = useRouter();
  const { id } = router.query;
  const [seller, setSeller] = useState<SellerProfile | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");

  useEffect(() => {
    if (!id || typeof id !== "string") return;
    fetchSellerData(id);
  }, [id]);

  const fetchSellerData = async (sellerId: string) => {
    try {
      setLoading(true);

      // Fetch seller profile
      const { data: sellerData, error: sellerError } = await supabase
        .from("seller_profiles")
        .select("*")
        .eq("id", sellerId)
        .single();

      if (sellerError) throw sellerError;

      setSeller(sellerData);

      // Fetch seller products
      const { data: productsData, error: productsError } = await supabase
        .from("products")
        .select(`
          id,
          title,
          price,
          compare_at_price,
          deal_expires_at,
          rating,
          total_reviews,
          images:product_images(url),
          seller:seller_profiles(business_name)
        `)
        .eq("seller_id", sellerId)
        .eq("status", "approved")
        .order("created_at", { ascending: false });

      if (productsError) throw productsError;

      setProducts((productsData as any) || []);
    } catch (error) {
      console.error("Error fetching seller data:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <CustomerLayout>
        <div className="container py-16 text-center">
          <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">Loading seller store...</p>
        </div>
      </CustomerLayout>
    );
  }

  if (!seller) {
    return (
      <CustomerLayout>
        <div className="container py-16 text-center">
          <Store className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
          <h1 className="text-2xl font-bold mb-4">Seller not found</h1>
          <Button onClick={() => router.push("/sellers")}>Browse All Sellers</Button>
        </div>
      </CustomerLayout>
    );
  }

  const filteredProducts = activeTab === "all" 
    ? products 
    : activeTab === "best-sellers"
    ? products.slice(0, 8).sort((a, b) => b.total_reviews - a.total_reviews)
    : activeTab === "new-arrivals"
    ? products.slice(0, 12)
    : products.filter(p => (p.compare_at_price || 0) > p.price);

  return (
    <CustomerLayout>
      <div className="bg-background">
        {/* Seller Banner */}
        <div className="relative h-48 md:h-64 bg-gradient-to-r from-primary/10 via-accent/10 to-primary/10">
          {seller.banner_url && (
            <Image
              src={seller.banner_url}
              alt={`${seller.business_name} banner`}
              fill
              className="object-cover"
              priority
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
        </div>

        {/* Seller Info Card */}
        <div className="container -mt-20 relative z-10 pb-8">
          <Card className="p-6 md:p-8">
            <div className="flex flex-col md:flex-row gap-6">
              {/* Seller Logo */}
              <div className="relative h-32 w-32 rounded-xl bg-white shadow-lg flex-shrink-0 border-4 border-background overflow-hidden mx-auto md:mx-0">
                {seller.logo_url ? (
                  <Image
                    src={seller.logo_url}
                    alt={seller.business_name}
                    fill
                    className="object-contain p-2"
                  />
                ) : (
                  <div className="h-full w-full flex items-center justify-center bg-muted">
                    <Store className="h-16 w-16 text-muted-foreground" />
                  </div>
                )}
              </div>

              {/* Seller Details */}
              <div className="flex-1 text-center md:text-left">
                <div className="flex flex-col md:flex-row md:items-center gap-3 mb-3">
                  <h1 className="text-3xl font-bold">{seller.business_name}</h1>
                  {seller.verified_at && (
                    <Badge variant="secondary" className="bg-primary/10 text-primary w-fit mx-auto md:mx-0">
                      <Shield className="h-3.5 w-3.5 mr-1" />
                      Verified Seller
                    </Badge>
                  )}
                </div>

                <p className="text-muted-foreground mb-4 max-w-3xl">
                  {seller.business_description || "Premium quality products from a trusted seller."}
                </p>

                {/* Seller Stats */}
                <div className="flex flex-wrap gap-6 justify-center md:justify-start text-sm">
                  <div className="flex items-center gap-2">
                    <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                    <span className="font-semibold">{seller.rating.toFixed(1)}</span>
                    <span className="text-muted-foreground">({seller.total_reviews} reviews)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4 text-primary" />
                    <span className="font-semibold">{products.length}</span>
                    <span className="text-muted-foreground">Products</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-green-600" />
                    <span className="font-semibold">{seller.total_sales.toLocaleString()}</span>
                    <span className="text-muted-foreground">Sales</span>
                  </div>
                </div>
              </div>

              {/* Contact Button */}
              <div className="flex flex-col gap-2 md:items-end justify-center">
                <Button variant="outline" className="w-full md:w-auto">
                  <Mail className="mr-2 h-4 w-4" />
                  Contact Seller
                </Button>
                <div className="text-xs text-muted-foreground text-center md:text-right">
                  <p className="flex items-center justify-center md:justify-end gap-1">
                    <Phone className="h-3 w-3" />
                    {seller.business_phone || "Not available"}
                  </p>
                  <p className="flex items-center justify-center md:justify-end gap-1 mt-1">
                    <Mail className="h-3 w-3" />
                    {seller.business_email || "Not available"}
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Products Section */}
        <div className="container pb-16">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="w-full md:w-auto mb-8">
              <TabsTrigger value="all" className="flex-1 md:flex-initial">
                All Products ({products.length})
              </TabsTrigger>
              <TabsTrigger value="best-sellers" className="flex-1 md:flex-initial">
                Best Sellers
              </TabsTrigger>
              <TabsTrigger value="new-arrivals" className="flex-1 md:flex-initial">
                New Arrivals
              </TabsTrigger>
              <TabsTrigger value="on-sale" className="flex-1 md:flex-initial">
                On Sale
              </TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab}>
              {filteredProducts.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                  {filteredProducts.map((product) => (
                    <ProductCard
                      key={product.id}
                      id={product.id}
                      title={product.title}
                      price={product.price}
                      compareAtPrice={product.compare_at_price || undefined}
                      image={product.images[0]?.url || "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&h=600&fit=crop"}
                      rating={product.rating}
                      reviewCount={product.total_reviews}
                      sellerName={seller.business_name}
                      dealExpiresAt={product.deal_expires_at}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-16">
                  <Package className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">No products found in this category</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </CustomerLayout>
  );
}
