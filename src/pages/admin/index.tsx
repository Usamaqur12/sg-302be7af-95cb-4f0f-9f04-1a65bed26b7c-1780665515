import { AdminLayout } from "@/components/AdminLayout";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { Users, Store, Package, ShoppingCart, DollarSign, TrendingUp } from "lucide-react";

interface Stats {
  totalUsers: number;
  totalSellers: number;
  totalProducts: number;
  totalOrders: number;
  totalRevenue: number;
  pendingWithdrawals: number;
}

export default function AdminDashboard() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<Stats>({
    totalUsers: 0,
    totalSellers: 0,
    totalProducts: 0,
    totalOrders: 0,
    totalRevenue: 0,
    pendingWithdrawals: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/");
      return;
    }

    if (user) {
      fetchStats();
    }
  }, [user, authLoading, router]);

  const fetchStats = async () => {
    const { count: usersCount } = await supabase
      .from("profiles")
      .select("*", { count: "exact", head: true });

    const { count: sellersCount } = await supabase
      .from("seller_profiles")
      .select("*", { count: "exact", head: true });

    const { count: productsCount } = await supabase
      .from("products")
      .select("*", { count: "exact", head: true });

    const { count: ordersCount } = await supabase
      .from("orders")
      .select("*", { count: "exact", head: true });

    const { data: ordersData } = await supabase
      .from("orders")
      .select("total");

    const totalRevenue = ordersData?.reduce((sum, order) => sum + order.total, 0) || 0;

    const { count: pendingWithdrawals } = await supabase
      .from("withdrawal_requests")
      .select("*", { count: "exact", head: true })
      .eq("status", "pending");

    setStats({
      totalUsers: usersCount || 0,
      totalSellers: sellersCount || 0,
      totalProducts: productsCount || 0,
      totalOrders: ordersCount || 0,
      totalRevenue,
      pendingWithdrawals: pendingWithdrawals || 0,
    });

    setLoading(false);
  };

  if (authLoading || loading) {
    return (
      <AdminLayout>
        <div className="text-center py-16">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </AdminLayout>
    );
  }

  const statCards = [
    {
      title: "Total Users",
      value: stats.totalUsers,
      icon: Users,
      color: "text-blue-500",
    },
    {
      title: "Total Sellers",
      value: stats.totalSellers,
      icon: Store,
      color: "text-purple-500",
    },
    {
      title: "Total Products",
      value: stats.totalProducts,
      icon: Package,
      color: "text-green-500",
    },
    {
      title: "Total Orders",
      value: stats.totalOrders,
      icon: ShoppingCart,
      color: "text-accent",
    },
    {
      title: "Total Revenue",
      value: `$${stats.totalRevenue.toFixed(2)}`,
      icon: DollarSign,
      color: "text-green-600",
    },
    {
      title: "Pending Withdrawals",
      value: stats.pendingWithdrawals,
      icon: TrendingUp,
      color: "text-warning",
    },
  ];

  return (
    <AdminLayout>
      <div>
        <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
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
            <h2 className="text-xl font-semibold mb-4">Recent Activity</h2>
            <p className="text-muted-foreground">Activity feed coming soon</p>
          </Card>

          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
            <div className="space-y-3">
              <button className="w-full p-4 border border-border rounded-lg hover:border-accent transition-colors text-left">
                <p className="font-medium">Approve Pending Sellers</p>
                <p className="text-sm text-muted-foreground">Review seller verifications</p>
              </button>
              <button className="w-full p-4 border border-border rounded-lg hover:border-accent transition-colors text-left">
                <p className="font-medium">Moderate Products</p>
                <p className="text-sm text-muted-foreground">Approve or reject product listings</p>
              </button>
            </div>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}