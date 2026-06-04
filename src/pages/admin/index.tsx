"use client";

import { AdminLayout } from "@/components/AdminLayout";
import { RoleGuard } from "@/components/RoleGuard";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, Store, Package, ShoppingCart, DollarSign, TrendingUp, AlertCircle, CheckCircle } from "lucide-react";
import Link from "next/link";

export default function AdminDashboardPage() {
  // Mock admin dashboard data
  const stats = {
    totalUsers: 2847,
    totalSellers: 156,
    totalProducts: 1243,
    totalOrders: 5632,
    totalRevenue: 284750.50,
    pendingWithdrawals: 12,
  };

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
      value: `$${stats.totalRevenue.toLocaleString()}`,
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
          <div>
            <h1 className="text-3xl font-bold font-serif mb-2">Admin Dashboard</h1>
            <p className="text-muted-foreground">Manage your marketplace platform</p>
          </div>

          {/* Stats Grid */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
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

          {/* Quick Actions Grid */}
          <div className="grid lg:grid-cols-2 gap-8">
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-amber-500" />
                Pending Actions
              </h2>
              <div className="space-y-3">
                <div className="p-4 border rounded-lg hover:bg-muted/50 transition">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-medium">Pending Seller Approvals</p>
                    <span className="text-sm text-muted-foreground">8 pending</span>
                  </div>
                  <Button size="sm" asChild>
                    <Link href="/admin/sellers">Review Sellers</Link>
                  </Button>
                </div>
                <div className="p-4 border rounded-lg hover:bg-muted/50 transition">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-medium">Product Moderation</p>
                    <span className="text-sm text-muted-foreground">23 pending</span>
                  </div>
                  <Button size="sm" asChild>
                    <Link href="/admin/products">Review Products</Link>
                  </Button>
                </div>
                <div className="p-4 border rounded-lg hover:bg-muted/50 transition">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-medium">Withdrawal Requests</p>
                    <span className="text-sm text-muted-foreground">{stats.pendingWithdrawals} pending</span>
                  </div>
                  <Button size="sm" asChild>
                    <Link href="/admin/payouts">Process Payouts</Link>
                  </Button>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                Quick Actions
              </h2>
              <div className="space-y-3">
                <Button variant="outline" className="w-full justify-start" asChild>
                  <Link href="/admin/users">
                    <Users className="h-4 w-4 mr-2" />
                    Manage Users
                  </Link>
                </Button>
                <Button variant="outline" className="w-full justify-start" asChild>
                  <Link href="/admin/sellers">
                    <Store className="h-4 w-4 mr-2" />
                    Manage Sellers
                  </Link>
                </Button>
                <Button variant="outline" className="w-full justify-start" asChild>
                  <Link href="/admin/products">
                    <Package className="h-4 w-4 mr-2" />
                    Manage Products
                  </Link>
                </Button>
                <Button variant="outline" className="w-full justify-start" asChild>
                  <Link href="/admin/orders">
                    <ShoppingCart className="h-4 w-4 mr-2" />
                    View All Orders
                  </Link>
                </Button>
              </div>
            </Card>
          </div>

          {/* Recent Activity */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Recent Platform Activity</h2>
            <div className="space-y-3 text-sm text-muted-foreground">
              <p>• New seller "TechGear Store" registered (Pending approval)</p>
              <p>• Product "Wireless Earbuds Pro" approved by moderator</p>
              <p>• Withdrawal request #WD-2026-0045 processed ($1,250.00)</p>
              <p>• 23 new orders placed today</p>
              <p>• Support ticket #T-89234 resolved</p>
            </div>
          </Card>
        </div>
      </AdminLayout>
    </RoleGuard>
  );
}