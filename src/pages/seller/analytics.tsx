"use client";

import Link from "next/link";
import { useRouter } from "next/router";
import { useCallback, useEffect, useState } from "react";
import { BarChart3, DollarSign, Eye, HelpCircle, PackageCheck, ShoppingCart, TrendingUp, Users } from "lucide-react";
import { SellerLayout } from "@/components/SellerLayout";
import { RoleGuard } from "@/components/RoleGuard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuthContext } from "@/contexts/AuthContext";
import { useMarketplaceSettings } from "@/contexts/MarketplaceSettingsContext";
import { supabase } from "@/integrations/supabase/client";

interface ProductMetric {
  id: string;
  title: string;
  price: number;
  views_count: number | null;
  sales_count: number | null;
  rating: number | null;
}

interface AnalyticsData {
  totalViews: number;
  unitsSold: number;
  revenue: number;
  conversionRate: number;
  averageOrderValue: number;
  products: ProductMetric[];
}

const EMPTY_ANALYTICS: AnalyticsData = {
  totalViews: 0,
  unitsSold: 0,
  revenue: 0,
  conversionRate: 0,
  averageOrderValue: 0,
  products: [],
};

function normalizeView(value: unknown) {
  const view = String(value || "dashboard");
  if (["dashboard", "product", "promotion", "faq"].includes(view)) return view;
  return "dashboard";
}

export default function SellerAnalyticsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuthContext();
  const { formatPrice } = useMarketplaceSettings();
  const [analytics, setAnalytics] = useState(EMPTY_ANALYTICS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const view = normalizeView(router.query.view);

  const loadAnalytics = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    setError("");

    const { data: seller, error: sellerError } = await supabase
      .from("seller_profiles")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (sellerError || !seller) {
      setError("Seller profile could not be loaded.");
      setLoading(false);
      return;
    }

    const { data, error: productsError } = await supabase
      .from("products")
      .select("id, title, price, views_count, sales_count, rating")
      .eq("seller_id", seller.id)
      .order("sales_count", { ascending: false });

    if (productsError) {
      setError("Analytics could not be loaded.");
      setLoading(false);
      return;
    }

    const products = (data ?? []) as ProductMetric[];
    const totalViews = products.reduce((sum, product) => sum + (product.views_count ?? 0), 0);
    const unitsSold = products.reduce((sum, product) => sum + (product.sales_count ?? 0), 0);
    const revenue = products.reduce((sum, product) => sum + product.price * (product.sales_count ?? 0), 0);

    setAnalytics({
      totalViews,
      unitsSold,
      revenue,
      conversionRate: totalViews > 0 ? (unitsSold / totalViews) * 100 : 0,
      averageOrderValue: unitsSold > 0 ? revenue / unitsSold : 0,
      products: products.slice(0, 12),
    });
    setLoading(false);
  }, [user]);

  useEffect(() => {
    if (!authLoading && user) loadAnalytics();
  }, [authLoading, loadAnalytics, user]);

  const cards = [
    { label: "Revenue", value: formatPrice(analytics.revenue), icon: DollarSign },
    { label: "Visitors", value: analytics.totalViews.toLocaleString(), icon: Users },
    { label: "Orders", value: analytics.unitsSold.toLocaleString(), icon: ShoppingCart },
    { label: "Conversion Rate", value: `${analytics.conversionRate.toFixed(1)}%`, icon: TrendingUp },
  ];

  const nav = [
    { href: "/seller/analytics?view=dashboard", label: "Dashboard", value: "dashboard", icon: BarChart3 },
    { href: "/seller/analytics?view=product", label: "Product", value: "product", icon: PackageCheck },
    { href: "/seller/analytics?view=promotion", label: "Promotion", value: "promotion", icon: TrendingUp },
    { href: "/seller/analytics?view=faq", label: "FAQ", value: "faq", icon: HelpCircle },
  ];

  return (
    <RoleGuard allowedRoles={["seller"]}>
      <SellerLayout>
        <div className="space-y-8">
          <div>
            <Badge className="mb-3 bg-accent text-accent-foreground">Data Insight</Badge>
            <h1 className="text-3xl font-bold">Business Advisor</h1>
            <p className="mt-2 text-muted-foreground">Realtime performance, key metrics and product ranking.</p>
          </div>

          <div className="grid gap-2 md:grid-cols-4">
            {nav.map((item) => {
              const Icon = item.icon;
              return (
                <Button key={item.value} variant={view === item.value ? "default" : "outline"} asChild className="justify-start">
                  <Link href={item.href}>
                    <Icon className="mr-2 h-4 w-4" />
                    {item.label}
                  </Link>
                </Button>
              );
            })}
          </div>

          {loading ? (
            <p className="py-16 text-center text-muted-foreground">Loading business advisor...</p>
          ) : error ? (
            <Card className="border-destructive">
              <CardContent className="pt-6 text-destructive">{error}</CardContent>
            </Card>
          ) : (
            <>
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {cards.map(({ label, value, icon: Icon }) => (
                  <Card key={label}>
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-muted-foreground">{label}</p>
                        <Icon className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <p className="mt-2 font-mono text-2xl font-bold">{value}</p>
                      <p className="mt-1 text-xs text-muted-foreground">vs previous day -</p>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {view === "dashboard" && (
                <div className="grid gap-6 lg:grid-cols-2">
                  <Card>
                    <CardHeader><CardTitle>Realtime Ranking by Visitors</CardTitle></CardHeader>
                    <CardContent className="space-y-3">
                      {analytics.products.length ? analytics.products.map((product, index) => (
                        <div key={product.id} className="flex items-center justify-between rounded-md border p-3">
                          <span className="min-w-0 truncate">#{index + 1} {product.title}</span>
                          <span className="font-mono text-sm">{product.views_count ?? 0}</span>
                        </div>
                      )) : <p className="py-8 text-center text-muted-foreground">No Data</p>}
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader><CardTitle>Realtime Ranking by Revenue</CardTitle></CardHeader>
                    <CardContent className="space-y-3">
                      {analytics.products.length ? analytics.products.map((product, index) => (
                        <div key={product.id} className="flex items-center justify-between rounded-md border p-3">
                          <span className="min-w-0 truncate">#{index + 1} {product.title}</span>
                          <span className="font-mono text-sm">{formatPrice(product.price * (product.sales_count ?? 0))}</span>
                        </div>
                      )) : <p className="py-8 text-center text-muted-foreground">No Data</p>}
                    </CardContent>
                  </Card>
                </div>
              )}

              {view === "product" && (
                <Card>
                  <CardHeader><CardTitle>Product Performance</CardTitle></CardHeader>
                  <CardContent className="space-y-3">
                    {analytics.products.map((product) => {
                      const views = product.views_count ?? 0;
                      const sales = product.sales_count ?? 0;
                      const conversion = views > 0 ? (sales / views) * 100 : 0;
                      return (
                        <div key={product.id} className="grid gap-3 rounded-md border p-4 md:grid-cols-[1fr_100px_100px_100px]">
                          <p className="truncate font-medium">{product.title}</p>
                          <p className="text-sm text-muted-foreground">{views} visitors</p>
                          <p className="text-sm text-muted-foreground">{sales} sold</p>
                          <p className="font-mono text-sm">{conversion.toFixed(1)}%</p>
                        </div>
                      );
                    })}
                    {analytics.products.length === 0 && <p className="py-8 text-center text-muted-foreground">No product data yet.</p>}
                  </CardContent>
                </Card>
              )}

              {view === "promotion" && (
                <Card>
                  <CardHeader><CardTitle>Promotion Insight</CardTitle></CardHeader>
                  <CardContent className="grid gap-4 md:grid-cols-3">
                    <div className="rounded-md border p-4"><p className="text-sm text-muted-foreground">Promotion Revenue</p><p className="mt-2 text-xl font-bold">{formatPrice(analytics.revenue)}</p></div>
                    <div className="rounded-md border p-4"><p className="text-sm text-muted-foreground">Average Order Value</p><p className="mt-2 text-xl font-bold">{formatPrice(analytics.averageOrderValue)}</p></div>
                    <div className="rounded-md border p-4"><p className="text-sm text-muted-foreground">Wishlist Users</p><p className="mt-2 text-xl font-bold">-</p></div>
                  </CardContent>
                </Card>
              )}

              {view === "faq" && (
                <Card>
                  <CardHeader><CardTitle>FAQ</CardTitle></CardHeader>
                  <CardContent className="space-y-4">
                    {[
                      ["Revenue", "Total product value generated from your seller products."],
                      ["Visitors", "Product view count used as seller traffic signal."],
                      ["Conversion Rate", "Units sold divided by product visitors."],
                      ["Realtime Ranking", "Products sorted by strongest views or revenue signals."],
                    ].map(([title, body]) => (
                      <div key={title} className="rounded-md border p-4">
                        <p className="font-semibold">{title}</p>
                        <p className="mt-1 text-sm text-muted-foreground">{body}</p>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </div>
      </SellerLayout>
    </RoleGuard>
  );
}
