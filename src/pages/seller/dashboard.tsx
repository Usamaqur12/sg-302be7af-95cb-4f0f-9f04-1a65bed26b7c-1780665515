"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  BookOpen,
  DollarSign,
  Eye,
  Loader2,
  Megaphone,
  Package,
  RefreshCw,
  ShieldCheck,
  ShoppingBag,
  Star,
  Store,
  TrendingUp,
} from "lucide-react";
import { SellerLayout } from "@/components/SellerLayout";
import { RoleGuard } from "@/components/RoleGuard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuthContext } from "@/contexts/AuthContext";
import { useMarketplaceSettings } from "@/contexts/MarketplaceSettingsContext";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/database.types";
import {
  sellerCenterOptionEnabled,
  sellerCenterSettingKeys,
  sellerLearningResources,
  sellerToolkitLinks,
  settingEnabled,
  settingValue,
  visibleSellerCenterModules,
} from "@/lib/seller-center";

type OrderStatus = Database["public"]["Enums"]["order_status"];

interface RecentOrderItem {
  id: string;
  order_id: string;
  product_title: string;
  quantity: number;
  seller_earnings: number;
  order: {
    id: string;
    order_number: string;
    status: OrderStatus | null;
    created_at: string | null;
    shipping_full_name: string;
  } | null;
}

interface TopProduct {
  id: string;
  title: string;
  price: number;
  sales_count: number | null;
  views_count: number | null;
  rating: number | null;
  status?: string | null;
}

interface SellerCenterProfile {
  id: string;
  business_name: string;
  status: string | null;
  available_balance: number | null;
  holiday_mode?: boolean | number | string | null;
  holiday_message?: string | null;
  order_volume_limit?: number | null;
  non_compliance_points?: number | null;
  account_health_status?: string | null;
  admin_note?: string | null;
}

interface SellerCenterSetting {
  key: string;
  value: unknown;
}

interface DashboardData {
  seller: SellerCenterProfile | null;
  totalSales: number;
  totalOrders: number;
  totalProducts: number;
  pendingOrders: number;
  pendingReviews: number;
  availableBalance: number;
  recentOrders: RecentOrderItem[];
  topProducts: TopProduct[];
  settings: SellerCenterSetting[];
}

const EMPTY_DASHBOARD: DashboardData = {
  seller: null,
  totalSales: 0,
  totalOrders: 0,
  totalProducts: 0,
  pendingOrders: 0,
  pendingReviews: 0,
  availableBalance: 0,
  recentOrders: [],
  topProducts: [],
  settings: [],
};

const statusStyles: Record<OrderStatus, string> = {
  pending: "bg-yellow-500/10 text-yellow-700",
  confirmed: "bg-blue-500/10 text-blue-700",
  processing: "bg-purple-500/10 text-purple-700",
  shipped: "bg-indigo-500/10 text-indigo-700",
  delivered: "bg-green-500/10 text-green-700",
  cancelled: "bg-red-500/10 text-red-700",
  refunded: "bg-gray-500/10 text-gray-700",
};

function boolValue(value: unknown) {
  return value === true || value === 1 || value === "1" || value === "true";
}

function accountHealthLabel(status?: string | null) {
  if (status === "at_risk") return "At Risk";
  if (status === "warning") return "Warning";
  if (status === "good") return "Good";
  return "Excellent";
}

function accountHealthClass(status?: string | null) {
  if (status === "at_risk") return "bg-red-500/10 text-red-700";
  if (status === "warning") return "bg-amber-500/10 text-amber-700";
  if (status === "good") return "bg-blue-500/10 text-blue-700";
  return "bg-green-500/10 text-green-700";
}

export default function SellerDashboardPage() {
  const { user, loading: authLoading } = useAuthContext();
  const { formatPrice } = useMarketplaceSettings();
  const [dashboard, setDashboard] = useState(EMPTY_DASHBOARD);
  const [loading, setLoading] = useState(true);
  const [sellerProfileMissing, setSellerProfileMissing] = useState(false);
  const [error, setError] = useState("");

  const loadDashboard = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    setError("");

    const { data: seller, error: sellerError } = await supabase
      .from("seller_profiles")
      .select(`
        id,
        business_name,
        status,
        available_balance,
        holiday_mode,
        holiday_message,
        order_volume_limit,
        non_compliance_points,
        account_health_status,
        admin_note
      `)
      .eq("user_id", user.id)
      .maybeSingle();

    if (sellerError) {
      setError("Could not load your seller profile.");
      setLoading(false);
      return;
    }

    if (!seller) {
      setSellerProfileMissing(true);
      setLoading(false);
      return;
    }

    setSellerProfileMissing(false);
    const sellerProfile = seller as unknown as SellerCenterProfile;

    const [settingsResult, productsResult, orderItemsResult] = await Promise.all([
      supabase
        .from("system_settings")
        .select("key, value")
        .in("key", [...sellerCenterSettingKeys]),
      supabase
        .from("products")
        .select("id, title, price, sales_count, views_count, rating, status", { count: "exact" })
        .eq("seller_id", sellerProfile.id)
        .order("sales_count", { ascending: false })
        .limit(5),
      supabase
        .from("order_items")
        .select(`
          id,
          order_id,
          product_title,
          quantity,
          seller_earnings,
          order:orders(
            id,
            order_number,
            status,
            created_at,
            shipping_full_name
          )
        `)
        .eq("seller_id", sellerProfile.id)
        .order("created_at", { ascending: false }),
    ]);

    if (settingsResult.error || productsResult.error || orderItemsResult.error) {
      setError("Could not load seller center data.");
      setLoading(false);
      return;
    }

    const products = (productsResult.data ?? []) as unknown as TopProduct[];
    const productIds = products.map((product) => product.id);
    const reviewsResult = productIds.length
      ? await supabase
          .from("reviews")
          .select("*", { count: "exact", head: true })
          .in("product_id", productIds)
      : { count: 0, error: null };

    const orderItems = (orderItemsResult.data ?? []) as unknown as RecentOrderItem[];
    const uniqueOrders = new Map<string, RecentOrderItem>();

    orderItems.forEach((item) => {
      if (item.order && !uniqueOrders.has(item.order_id)) {
        uniqueOrders.set(item.order_id, item);
      }
    });

    const orders = Array.from(uniqueOrders.values());
    const pendingOrders = orders.filter((item) =>
      ["pending", "confirmed", "processing"].includes(String(item.order?.status || ""))
    ).length;

    setDashboard({
      seller: sellerProfile,
      totalSales: orderItems.reduce((sum, item) => sum + item.seller_earnings, 0),
      totalOrders: uniqueOrders.size,
      totalProducts: productsResult.count ?? 0,
      pendingOrders,
      pendingReviews: reviewsResult.count ?? 0,
      availableBalance: sellerProfile.available_balance ?? 0,
      recentOrders: orders.slice(0, 5),
      topProducts: products,
      settings: (settingsResult.data ?? []) as unknown as SellerCenterSetting[],
    });
    setLoading(false);
  }, [user]);

  useEffect(() => {
    if (!authLoading && user) {
      loadDashboard();
    }
  }, [authLoading, loadDashboard, user]);

  if (authLoading || (user && loading)) {
    return (
      <RoleGuard allowedRoles={["seller"]}>
        <SellerLayout>
          <div className="flex items-center justify-center gap-2 py-16 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            Loading seller center...
          </div>
        </SellerLayout>
      </RoleGuard>
    );
  }

  const seller = dashboard.seller;
  const learningEnabled = settingEnabled(dashboard.settings, "seller_center_learning_enabled");
  const toolkitEnabled = settingEnabled(dashboard.settings, "seller_center_toolkit_enabled");
  const notification = settingValue(dashboard.settings, "seller_center_important_notification");
  const campaignName = settingValue(dashboard.settings, "seller_center_campaign_name");
  const holidayMode = boolValue(seller?.holiday_mode);
  const visibleModules = visibleSellerCenterModules(dashboard.settings);
  const visibleToolkitLinks = sellerToolkitLinks.filter((tool) =>
    sellerCenterOptionEnabled(dashboard.settings, tool.href)
  );

  const stats = [
    { label: "Seller Earnings", value: formatPrice(dashboard.totalSales), icon: DollarSign },
    { label: "Orders", value: dashboard.totalOrders.toLocaleString(), icon: ShoppingBag },
    { label: "Products", value: dashboard.totalProducts.toLocaleString(), icon: Package },
    { label: "Available Balance", value: formatPrice(dashboard.availableBalance), icon: TrendingUp },
  ];

  return (
    <RoleGuard allowedRoles={["seller"]}>
      <SellerLayout>
        <div className="space-y-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <Badge className="mb-3 bg-accent text-accent-foreground">Seller Center</Badge>
              <h1 className="text-3xl font-bold">{seller?.business_name || "Seller Home"}</h1>
              <p className="text-muted-foreground">
                Daraz-style seller workspace with account health, tools, learning and growth workflows.
              </p>
            </div>
            <Button variant="outline" onClick={loadDashboard}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
          </div>

          {error && (
            <Card className="border-destructive">
              <CardContent className="pt-6 text-destructive">{error}</CardContent>
            </Card>
          )}

          {sellerProfileMissing ? (
            <Card>
              <CardContent className="p-8 text-center">
                <h2 className="text-xl font-semibold">Seller profile required</h2>
                <p className="mt-2 text-muted-foreground">
                  Complete seller registration before using the dashboard.
                </p>
                <Button className="mt-4" asChild>
                  <Link href="/seller/register">Complete registration</Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <>
              {(holidayMode || seller?.admin_note) && (
                <Card className="border-amber-300 bg-amber-50">
                  <CardContent className="flex gap-3 p-5 text-amber-900">
                    <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
                    <div>
                      <p className="font-semibold">
                        {holidayMode ? "Your shop is currently in holiday mode." : "Account notice"}
                      </p>
                      <p className="mt-1 text-sm">
                        {seller?.holiday_message ||
                          seller?.admin_note ||
                          "Products cannot be purchased while holiday mode is active."}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}

              <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Important Notification</CardTitle>
                    <Button asChild variant="ghost" size="sm">
                      <Link href="/seller/support">More</Link>
                    </Button>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">{notification}</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Account Health</CardTitle>
                    <Badge className={accountHealthClass(seller?.account_health_status)}>
                      {accountHealthLabel(seller?.account_health_status)}
                    </Badge>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="rounded-md border p-3">
                        <p className="text-sm text-muted-foreground">NCP</p>
                        <p className="font-mono text-2xl font-bold">{seller?.non_compliance_points ?? 0}</p>
                      </div>
                      <div className="rounded-md border p-3">
                        <p className="text-sm text-muted-foreground">OVL / day</p>
                        <p className="font-mono text-2xl font-bold">{seller?.order_volume_limit ?? 50}</p>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Your order volume limit and compliance points are updated from marketplace policy.
                    </p>
                  </CardContent>
                </Card>
              </div>

              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {stats.map(({ label, value, icon: Icon }) => (
                  <Card key={label}>
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-muted-foreground">{label}</p>
                        <Icon className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <p className="mt-2 font-mono text-2xl font-bold">{value}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>My Order</CardTitle>
                  <Button variant="ghost" size="sm" asChild>
                    <Link href="/seller/orders">More</Link>
                  </Button>
                </CardHeader>
                <CardContent className="grid gap-4 md:grid-cols-3">
                  <Link href="/seller/orders" className="rounded-md border p-4 transition hover:border-accent hover:bg-muted">
                    <p className="font-mono text-3xl font-bold">0</p>
                    <p className="text-sm text-muted-foreground">Unpaid Orders</p>
                  </Link>
                  <Link href="/seller/orders" className="rounded-md border p-4 transition hover:border-accent hover:bg-muted">
                    <p className="font-mono text-3xl font-bold">{dashboard.pendingOrders}</p>
                    <p className="text-sm text-muted-foreground">Pending Orders</p>
                  </Link>
                  <Link href="/seller/reviews" className="rounded-md border p-4 transition hover:border-accent hover:bg-muted">
                    <p className="font-mono text-3xl font-bold">{dashboard.pendingReviews}</p>
                    <p className="text-sm text-muted-foreground">To Be Reviewed</p>
                  </Link>
                </CardContent>
              </Card>

              {learningEnabled && (
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <BookOpen className="h-5 w-5 text-accent" />
                      Learn and Grow
                    </CardTitle>
                    <Badge variant="secondary">{campaignName}</Badge>
                  </CardHeader>
                  <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    {sellerLearningResources.map((resource) => (
                      <Link key={resource.title} href={resource.href} className="rounded-md border p-4 transition hover:border-accent hover:bg-muted">
                        <p className="font-semibold">{resource.title}</p>
                        <p className="mt-2 text-sm text-muted-foreground">{resource.description}</p>
                        <p className="mt-4 font-mono text-sm text-muted-foreground">{resource.views}</p>
                      </Link>
                    ))}
                  </CardContent>
                </Card>
              )}

              {toolkitEnabled && visibleToolkitLinks.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Megaphone className="h-5 w-5 text-accent" />
                      Popular Toolkit
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                    {visibleToolkitLinks.map((tool) => (
                      <Button key={tool.title} variant="outline" asChild className="justify-between">
                        <Link href={tool.href}>
                          {tool.title}
                          <ArrowRight className="h-4 w-4" />
                        </Link>
                      </Button>
                    ))}
                  </CardContent>
                </Card>
              )}

              <Card>
                <CardHeader>
                  <CardTitle>Seller Center Modules</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {visibleModules.length ? (
                    visibleModules.map((module) => (
                      <Link key={module.href} href={module.href} className="rounded-md border p-4 transition hover:border-accent hover:bg-muted">
                        <div className="mb-3 flex items-center justify-between gap-3">
                          <p className="font-semibold">{module.title}</p>
                          <ArrowRight className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <p className="text-sm text-muted-foreground">{module.description}</p>
                        <p className="mt-3 text-xs font-medium text-accent">
                          {module.options.length} option{module.options.length === 1 ? "" : "s"} available
                        </p>
                      </Link>
                    ))
                  ) : (
                    <div className="col-span-full rounded-md border p-6 text-center text-muted-foreground">
                      No seller center modules are available right now.
                    </div>
                  )}
                </CardContent>
              </Card>

              <div className="grid gap-6 xl:grid-cols-2">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Recent Orders</CardTitle>
                    <Button variant="ghost" size="sm" asChild>
                      <Link href="/seller/orders">View all</Link>
                    </Button>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {dashboard.recentOrders.length === 0 ? (
                      <p className="py-8 text-center text-muted-foreground">No orders yet.</p>
                    ) : dashboard.recentOrders.map((item) => (
                      <div key={item.order_id} className="flex items-center justify-between gap-4 border-b pb-3 last:border-0">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-mono text-sm font-semibold">
                              {item.order?.order_number}
                            </p>
                            {item.order?.status && (
                              <Badge className={statusStyles[item.order.status]}>
                                {item.order.status}
                              </Badge>
                            )}
                          </div>
                          <p className="truncate text-sm text-muted-foreground">
                            {item.order?.shipping_full_name} - {item.product_title}
                          </p>
                        </div>
                        <p className="font-mono font-semibold">{formatPrice(item.seller_earnings)}</p>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Top Products</CardTitle>
                    <Button variant="ghost" size="sm" asChild>
                      <Link href="/seller/products">View all</Link>
                    </Button>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {dashboard.topProducts.length === 0 ? (
                      <p className="py-8 text-center text-muted-foreground">No products yet.</p>
                    ) : dashboard.topProducts.map((product) => (
                      <div key={product.id} className="flex items-center justify-between gap-4 border-b pb-3 last:border-0">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="truncate font-medium">{product.title}</p>
                            {product.status && <Badge variant="secondary">{product.status}</Badge>}
                          </div>
                          <div className="flex gap-3 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <ShoppingBag className="h-3 w-3" /> {product.sales_count ?? 0}
                            </span>
                            <span className="flex items-center gap-1">
                              <Eye className="h-3 w-3" /> {product.views_count ?? 0}
                            </span>
                            <span className="flex items-center gap-1">
                              <Star className="h-3 w-3" /> {(product.rating ?? 0).toFixed(1)}
                            </span>
                          </div>
                        </div>
                        <p className="font-mono font-semibold">
                          {formatPrice(product.price * (product.sales_count ?? 0))}
                        </p>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <Button asChild>
                  <Link href="/seller/products/new">
                    <Package className="mr-2 h-4 w-4" />
                    Add product
                  </Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link href="/seller/account-health">
                    <ShieldCheck className="mr-2 h-4 w-4" />
                    Account health
                  </Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link href="/seller/store">
                    <Store className="mr-2 h-4 w-4" />
                    Store profile
                  </Link>
                </Button>
              </div>
            </>
          )}
        </div>
      </SellerLayout>
    </RoleGuard>
  );
}
