"use client";

import { CustomerLayout } from "@/components/CustomerLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import { Loader2, Store, Star, CheckCircle2, Search } from "lucide-react";
import Link from "next/link";

export default function SellersPage() {
  const [sellers, setSellers] = useState<any[]>([]);
  const [filteredSellers, setFilteredSellers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchSellers();
  }, []);

  useEffect(() => {
    if (searchQuery.trim()) {
      const filtered = sellers.filter((seller) =>
        seller.business_name.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredSellers(filtered);
    } else {
      setFilteredSellers(sellers);
    }
  }, [searchQuery, sellers]);

  const fetchSellers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("seller_profiles")
        .select(`
          id,
          business_name,
          business_description,
          logo_url,
          rating,
          total_reviews,
          verified_at
        `)
        .eq("status", "approved")
        .order("total_reviews", { ascending: false });

      if (error) throw error;

      setSellers(data || []);
      setFilteredSellers(data || []);
    } catch (error) {
      setSellers([]);
      setFilteredSellers([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <CustomerLayout>
        <div className="container py-16 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-muted-foreground">Loading sellers...</p>
          </div>
        </div>
      </CustomerLayout>
    );
  }

  return (
    <CustomerLayout>
      <div className="container py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <Store className="h-8 w-8 text-accent" />
            <h1 className="text-4xl font-bold">Our Sellers</h1>
          </div>
          <p className="text-lg text-muted-foreground">Discover trusted sellers on our marketplace</p>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search sellers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Sellers Grid */}
        {filteredSellers.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredSellers.map((seller) => (
              <Card key={seller.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4 mb-4">
                    <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center overflow-hidden flex-shrink-0">
                      {seller.logo_url ? (
                        <img src={seller.logo_url} alt={seller.business_name} className="h-full w-full object-cover" />
                      ) : (
                        <Store className="h-8 w-8 text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold truncate">{seller.business_name}</h3>
                        {seller.verified_at && (
                          <CheckCircle2 className="h-4 w-4 text-accent flex-shrink-0" />
                        )}
                      </div>
                      <div className="flex items-center gap-1 text-sm">
                        <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                        <span className="font-medium">{seller.rating || 4.5}</span>
                        <span className="text-muted-foreground">({seller.total_reviews || 0})</span>
                      </div>
                    </div>
                  </div>

                  <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                    {seller.business_description || "Quality products from a trusted seller"}
                  </p>

                  <Link href={`/sellers/${seller.id}`}>
                    <Button className="w-full" variant="outline">
                      Visit Store
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="p-12 text-center">
            <Store className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-xl font-semibold mb-2">No Sellers Found</h3>
            <p className="text-muted-foreground mb-6">
              {searchQuery ? "Try a different search term" : "No sellers are currently available"}
            </p>
            {searchQuery && (
              <Button onClick={() => setSearchQuery("")}>Clear Search</Button>
            )}
          </Card>
        )}

        {/* Become a Seller CTA */}
        <Card className="mt-12 bg-gradient-to-br from-accent/10 to-accent/5 border-accent/20">
          <CardContent className="py-8 text-center">
            <Store className="h-12 w-12 mx-auto mb-4 text-accent" />
            <h2 className="text-2xl font-bold mb-2">Become a Seller</h2>
            <p className="text-muted-foreground mb-6">Start your journey as a seller and reach millions of customers</p>
            <Link href="/seller/register">
              <Button size="lg">
                Register as Seller
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </CustomerLayout>
  );
}