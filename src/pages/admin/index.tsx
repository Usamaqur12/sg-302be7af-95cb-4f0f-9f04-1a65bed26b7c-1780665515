"use client";

import { AdminLayout } from "@/components/AdminLayout";
import { RoleGuard } from "@/components/RoleGuard";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuthContext } from "@/contexts/AuthContext";
import { useMarketplaceSettings } from "@/contexts/MarketplaceSettingsContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/database.types";
import {
  AlertCircle,
  CheckCircle,
  DollarSign,
  Loader2,
  Package,
  RefreshCw,
  ShoppingCart,
  Store,
  TrendingUp,
  Users,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

type OrderStatus = Database["public"]["Enums"]["order_status"];

interface DashboardStats {
  totalUsers: number;
  totalSellers: number;
  totalProducts: number;
  totalOrders: number;
  totalRevenue: number;
  pendingWithdrawals: number;
  pendingSellers: number;
  pendingProducts: number;
}

interface RecentOrder {
  id: string;
  order_number: string;
  total: number;
  status: OrderStatus | null;
  created_at: string | null;
}

const initialStats: DashboardStats = {
  totalUsers: 0,
  totalSellers: 0,
  totalProducts: 0,
  totalOrders: 0,
  totalRevenue: 0,
  pendingWithdrawals: 0,
  pendingSellers: 0,
  pendingProducts: 0,
};

export default function AdminDashboardPage() {
  const { user, loading: authLoading } = useAuthContext();
  const { formatPrice } = useMarketplaceSettings();
  const { toast } = useToast();
  const [stats, setStats] = useState(initialStats);
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [loading, setLoading] = useState(true);

  const loadDashboard = useCallback(async () => {
    setLoading(true);

    try {
      const [
        usersResult,
        sellersResult,
        productsResult,
        ordersResult,
        withdrawalsResult,
        pendingSellersResult,
        pendingProductsResult,
        recentOrdersResult,
      ] = await Promise.all([
        supabase.from("profiles").select("*", { count: "exact", head: true }),
        supabase.from("seller_profiles").select("*", { count: "exact", head: true }),
        supabase.from("products").select("*", { count: "exact", head: true }),
        supabase.from("orders").select("total"),
        supabase
          .from("withdrawal_requests")
          .select("*", { count: "exact", head: true })
          .eq("status", "pending"),
        supabase
          .from("seller_profiles")
          .select("*", { count: "exact", head: true })
          .eq("status", "pending"),
        supabase
          .from("products")
          .select("*", { count: "exact", head: true })
          .eq("status", "pending"),
        supabase
          .from("orders")
          .select("id, order_number, total, status, created_at")
          .order("created_at", { ascending: false })
          .limit(5),
      ]);

      const firstError = [
        usersResult.error,
        sellersResult.error,
        productsResult.error,
        ordersResult.error,
        withdrawalsResult.error,
        pendingSellersResult.error,
        pendingProductsResult.error,
        recentOrdersResult.error,
      ].find(Boolean);

      if (firstError) throw firstError;

      const totalRevenue = (ordersResult.data ?? []).reduce(
        (sum, order) => sum + order.total,
        0
      );

      setStats({
        totalUsers: usersResult.count ?? 0,
        totalSellers: sellersResult.count ?? 0,
        totalProducts: productsResult.count ?? 0,
        totalOrders: ordersResult.data?.length ?? 0,
        totalRevenue,
        pendingWithdrawals: withdrawalsResult.count ?? 0,
        pendingSellers: pendingSellersResult.count ?? 0,
        pendingProducts: pendingProductsResult.count ?? 0,
      });
      setRecentOrders(recentOrdersResult.data ?? []);
    } catch {
      toast({
        title: "Dashboard Error",
        description: "Could not load the latest marketplace statistics",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    if (authLoading || !user) return;
    loadDashboard();
  }, [authLoading, loadDashboard, user]);

  const statCards = [
    { title: "Total Users", value: stats.totalUsers, icon: Users, color: "text-blue-500" },
    { title: "Total Sellers", value: stats.totalSellers, icon: Store, color: "text-purple-500" },
    { title: "Total Products", value: stats.totalProducts, icon: Package, color: "text-green-500" },
    { title: "Total Orders", value: stats.totalOrders, icon: ShoppingCart, color: "text-accent" },
    {
      title: "Total Revenue",
      value: formatPrice(stats.totalRevenue),
      icon: DollarSign,
      color: "text-green-600",
    },
    {
      title: "Pending Withdrawals",
      value: stats.pendingWithdrawals,
      icon: TrendingUp,
      color: "text-amber-500",
    },
  ];

  return (
    <RoleGuard allowedRoles={["admin"]}>
      <AdminLayout>
        <div className="space-y-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold font-serif mb-2">Admin Dashboard</h1>
              <p className="text-muted-foreground">Live marketplace overview</p>
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={loadDashboard}
              disabled={loading}
              title="Refresh dashboard"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
            </Button>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {statCards.map((stat) => {
              const Icon = stat.icon;
              return (
                <Card key={stat.title} className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">{stat.title}</p>
                      <p className="text-2xl font-bold font-mono">
                        {loading ? "..." : stat.value}
                      </p>
                    </div>
                    <Icon className={`h-8 w-8 ${stat.color}`} />
                  </div>
                </Card>
              );
            })}
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-amber-500" />
                Pending Actions
              </h2>
              <div className="space-y-3">
                <PendingAction
                  label="Pending Seller Approvals"
                  count={stats.pendingSellers}
                  href="/admin/sellers"
                  action="Review Sellers"
                />
                <PendingAction
                  label="Product Moderation"
                  count={stats.pendingProducts}
                  href="/admin/products"
                  action="Review Products"
                />
                <PendingAction
                  label="Withdrawal Requests"
                  count={stats.pendingWithdrawals}
                  href="/admin/payouts"
                  action="Process Payouts"
                />
              </div>
            </Card>

            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                Quick Actions
              </h2>
              <div className="space-y-3">
                {[
                  { href: "/admin/users", label: "Manage Users", icon: Users },
                  { href: "/admin/sellers", label: "Manage Sellers", icon: Store },
                  { href: "/admin/products", label: "Manage Products", icon: Package },
                  { href: "/admin/orders", label: "View All Orders", icon: ShoppingCart },
                ].map((item) => {
                  const Icon = item.icon;
                  return (
                    <Button
                      key={item.href}
                      variant="outline"
                      className="w-full justify-start"
                      asChild
                    >
                      <Link href={item.href}>
                        <Icon className="h-4 w-4 mr-2" />
                        {item.label}
                      </Link>
                    </Button>
                  );
                })}
              </div>
            </Card>
          </div>

          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Recent Orders</h2>
            {recentOrders.length === 0 ? (
              <p className="text-sm text-muted-foreground">No orders have been placed yet.</p>
            ) : (
              <div className="space-y-3">
                {recentOrders.map((order) => (
                  <div
                    key={order.id}
                    className="flex items-center justify-between gap-4 border-b pb-3 last:border-0 last:pb-0"
                  >
                    <div>
                      <Link
                        href={`/orders/${order.id}`}
                        className="font-medium hover:underline"
                      >
                        {order.order_number}
                      </Link>
                      <p className="text-sm text-muted-foreground">
                        {order.created_at
                          ? new Date(order.created_at).toLocaleString()
                          : "Unknown date"}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-mono font-semibold">{formatPrice(order.total)}</p>
                      <Badge variant="secondary">{order.status ?? "pending"}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </AdminLayout>
    </RoleGuard>
  );
}

function PendingAction({
  label,
  count,
  href,
  action,
}: {
  label: string;
  count: number;
  href: string;
  action: string;
}) {
  return (
    <div className="p-4 border rounded-lg hover:bg-muted/50 transition">
      <div className="flex items-center justify-between mb-2 gap-4">
        <p className="font-medium">{label}</p>
        <span className="text-sm text-muted-foreground">{count} pending</span>
      </div>
      <Button size="sm" asChild>
        <Link href={href}>{action}</Link>
      </Button>
    </div>
  );
}
