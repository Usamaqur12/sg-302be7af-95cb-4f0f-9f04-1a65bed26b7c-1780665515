import { SellerLayout } from "@/components/SellerLayout";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { Package, ShoppingCart, DollarSign, TrendingUp } from "lucide-react";

interface Stats {
  totalProducts: number;
  activeOrders: number;
  totalEarnings: number;
  pendingWithdrawals: number;
}

export default function SellerDashboard() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<Stats>({
    totalProducts: 0,
    activeOrders: 0,
    totalEarnings: 0,
    pendingWithdrawals: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/");
      return;
    }

    if (user) {
      async function fetchStats() {
        const { data: sellerProfile } = await supabase
          .from("seller_profiles")
          .select("id")
          .eq("user_id", user.id)
          .single();

        if (!sellerProfile) {
          router.push("/");
          return;
        }

        const { count: productsCount } = await supabase
          .from("products")
          .select("*", { count: "exact", head: true })
          .eq("seller_id", sellerProfile.id);

        const { count: ordersCount } = await supabase
          .from("order_items")
          .select("*", { count: "exact", head: true })
          .eq("seller_id", sellerProfile.id)
          .in("order:orders!inner(status)", ["pending", "processing", "shipped"]);

        const { data: earningsData } = await supabase
          .from("order_items")
          .select("seller_earnings")
          .eq("seller_id", sellerProfile.id);

        const totalEarnings = earningsData?.reduce(
          (sum, item) => sum + (item.seller_earnings || 0),
          0
        ) || 0;

        const { count: withdrawalsCount } = await supabase
          .from("withdrawal_requests")
          .select("*", { count: "exact", head: true })
          .eq("seller_id", sellerProfile.id)
          .eq("status", "pending");

        setStats({
          totalProducts: productsCount || 0,
          activeOrders: ordersCount || 0,
          totalEarnings,
          pendingWithdrawals: withdrawalsCount || 0,
        });
        setLoading(false);
      }

      fetchStats();
    }
  }, [user, authLoading, router]);

  if (authLoading || loading) {
    return (
      <SellerLayout>
        <div className="text-center py-16">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </SellerLayout>
    );
  }

  const statCards = [
    {
      title: "Total Products",
      value: stats.totalProducts,
      icon: Package,
      color: "text-blue-500",
    },
    {
      title: "Active Orders",
      value: stats.activeOrders,
      icon: ShoppingCart,
      color: "text-accent",
    },
    {
      title: "Total Earnings",
      value: `$${stats.totalEarnings.toFixed(2)}`,
      icon: DollarSign,
      color: "text-green-500",
    },
    {
      title: "Pending Withdrawals",
      value: stats.pendingWithdrawals,
      icon: TrendingUp,
      color: "text-warning",
    },
  ];

  return (
    <SellerLayout>
      <div>
        <h1 className="text-3xl font-bold mb-8">Dashboard</h1>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {statCards.map((stat) => {
            const Icon = stat.icon;
            return (
              <Card key={stat.title} className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">{stat.title}</p>
                    <p className="text-2xl font-bold font-mono">{stat.value}</p>
                  </div>
                  <Icon className={`h-8 w-8 ${stat.color}`} />
                </div>
              </Card>
            );
          })}
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Recent Orders</h2>
            <p className="text-muted-foreground">Order list coming soon</p>
          </Card>

          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
            <div className="space-y-3">
              <a
                href="/seller/products/new"
                className="block p-4 border border-border rounded-lg hover:border-accent transition-colors"
              >
                <p className="font-medium">Add New Product</p>
                <p className="text-sm text-muted-foreground">Create a new product listing</p>
              </a>
              <a
                href="/seller/orders"
                className="block p-4 border border-border rounded-lg hover:border-accent transition-colors"
              >
                <p className="font-medium">Manage Orders</p>
                <p className="text-sm text-muted-foreground">Process and fulfill orders</p>
              </a>
            </div>
          </Card>
        </div>
      </div>
    </SellerLayout>
  );
}