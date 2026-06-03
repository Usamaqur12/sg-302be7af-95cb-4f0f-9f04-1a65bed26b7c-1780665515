import { SellerLayout } from "@/components/SellerLayout";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { Package, ShoppingCart, DollarSign, TrendingUp } from "lucide-react";
import Link from "next/link";

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

        // Simplified approach: get order_items first, then filter by order status
        const { data: orderItemsData } = await supabase
          .from("order_items")
          .select("order_id, seller_earnings")
          .eq("seller_id", sellerProfile.id);

        let activeOrdersCount = 0;
        let totalEarnings = 0;

        if (orderItemsData && orderItemsData.length > 0) {
          const orderIds = [...new Set(orderItemsData.map(item => item.order_id))];
          
          const { data: ordersData } = await supabase
            .from("orders")
            .select("id, status")
            .in("id", orderIds);

          const activeOrderIds = new Set(
            ordersData?.filter(order => 
              ["pending", "processing", "shipped"].includes(order.status)
            ).map(order => order.id) || []
          );

          activeOrdersCount = activeOrderIds.size;
          totalEarnings = orderItemsData.reduce(
            (sum, item) => sum + (item.seller_earnings || 0),
            0
          );
        }

        const { count: withdrawalsCount } = await supabase
          .from("withdrawal_requests")
          .select("*", { count: "exact", head: true })
          .eq("seller_id", sellerProfile.id)
          .eq("status", "pending");

        setStats({
          totalProducts: productsCount || 0,
          activeOrders: activeOrdersCount,
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
              <Link
                href="/seller/products/new"
                className="block p-4 border border-border rounded-lg hover:border-accent transition-colors"
              >
                <p className="font-medium">Add New Product</p>
                <p className="text-sm text-muted-foreground">Create a new product listing</p>
              </Link>
              <Link
                href="/seller/orders"
                className="block p-4 border border-border rounded-lg hover:border-accent transition-colors"
              >
                <p className="font-medium">Manage Orders</p>
                <p className="text-sm text-muted-foreground">Process and fulfill orders</p>
              </Link>
            </div>
          </Card>
        </div>
      </div>
    </SellerLayout>
  );
}