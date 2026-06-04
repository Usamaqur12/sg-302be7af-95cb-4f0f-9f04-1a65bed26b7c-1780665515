"use client";

import { useState, useEffect } from "react";
import { SellerLayout } from "@/components/SellerLayout";
import { RoleGuard } from "@/components/RoleGuard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DollarSign, Package, ShoppingCart, TrendingUp, Eye, Clock, ArrowUpRight, ArrowDownRight, ShoppingBag, Star } from "lucide-react";
import { useAuthContext } from "@/contexts/AuthContext";
import Link from "next/link";

// Mock seller dashboard data
const MOCK_DASHBOARD_DATA = {
  stats: {
    totalSales: 45280.50,
    salesGrowth: 12.5,
    totalOrders: 324,
    ordersGrowth: 8.3,
    totalProducts: 48,
    productsGrowth: 0,
    pendingEarnings: 8450.25,
    earningsGrowth: 15.2,
  },
  recentOrders: [
    {
      id: "ORD-20260603-0012",
      customer: "John Smith",
      products: 2,
      total: 149.98,
      status: "pending",
      date: "2026-06-03",
    },
    {
      id: "ORD-20260602-0089",
      customer: "Emma Wilson",
      products: 1,
      total: 299.99,
      status: "processing",
      date: "2026-06-02",
    },
    {
      id: "ORD-20260602-0067",
      customer: "Michael Brown",
      products: 3,
      total: 425.50,
      status: "shipped",
      date: "2026-06-02",
    },
    {
      id: "ORD-20260601-0134",
      customer: "Sarah Davis",
      products: 1,
      total: 89.99,
      status: "delivered",
      date: "2026-06-01",
    },
    {
      id: "ORD-20260601-0098",
      customer: "David Lee",
      products: 2,
      total: 215.00,
      status: "completed",
      date: "2026-06-01",
    },
  ],
  topProducts: [
    {
      id: "1",
      name: "Premium Wireless Headphones",
      sales: 89,
      revenue: 22225.00,
      views: 1247,
      rating: 4.8,
    },
    {
      id: "2",
      name: "Smart Watch Series X",
      sales: 67,
      revenue: 23433.00,
      views: 1089,
      rating: 4.6,
    },
    {
      id: "3",
      name: "Portable Bluetooth Speaker",
      sales: 54,
      revenue: 8091.00,
      views: 892,
      rating: 4.7,
    },
  ],
};

export default function SellerDashboardPage() {
  const { user } = useAuthContext();
  const [stats, setStats] = useState<SellerStats | null>(null);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      // Mock data for now
      setStats({
        totalRevenue: 45230.5,
        totalOrders: 156,
        totalProducts: 24,
        pendingOrders: 8,
        revenueChange: 12.5,
        ordersChange: 8.3,
      });

      setRecentOrders([
        {
          id: "1",
          orderNumber: "ORD-2024-001",
          customer: "John Doe",
          total: 299.99,
          status: "pending",
          date: "2024-01-15",
        },
        {
          id: "2",
          orderNumber: "ORD-2024-002",
          customer: "Jane Smith",
          total: 149.5,
          status: "processing",
          date: "2024-01-14",
        },
      ]);
    } catch (error) {
      console.error("Failed to load dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; label: string }> = {
      pending: { variant: "secondary", label: "Pending" },
      processing: { variant: "default", label: "Processing" },
      shipped: { variant: "outline", label: "Shipped" },
      delivered: { variant: "outline", label: "Delivered" },
      completed: { variant: "default", label: "Completed" },
    };

    const config = variants[status] || variants.pending;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  return (
    <RoleGuard allowedRoles={["seller"]}>
      <SellerLayout>
        <div className="space-y-8">
          {/* Header */}
          <div>
            <h1 className="text-3xl font-bold font-serif mb-2">Dashboard</h1>
            <p className="text-muted-foreground">
              Welcome back, {user?.email || "Seller"}! Here's your store overview.
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold font-mono">${stats.totalSales.toFixed(2)}</div>
                <div className="flex items-center text-xs text-muted-foreground mt-1">
                  {stats.salesGrowth >= 0 ? (
                    <>
                      <ArrowUpRight className="h-3 w-3 text-green-600 mr-1" />
                      <span className="text-green-600">+{stats.salesGrowth}%</span>
                    </>
                  ) : (
                    <>
                      <ArrowDownRight className="h-3 w-3 text-destructive mr-1" />
                      <span className="text-destructive">{stats.salesGrowth}%</span>
                    </>
                  )}
                  <span className="ml-1">from last month</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
                <ShoppingBag className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold font-mono">{stats.totalOrders}</div>
                <div className="flex items-center text-xs text-muted-foreground mt-1">
                  <ArrowUpRight className="h-3 w-3 text-green-600 mr-1" />
                  <span className="text-green-600">+{stats.ordersGrowth}%</span>
                  <span className="ml-1">from last month</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Products</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold font-mono">{stats.totalProducts}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Active listings
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending Earnings</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold font-mono">${stats.pendingEarnings.toFixed(2)}</div>
                <div className="flex items-center text-xs text-muted-foreground mt-1">
                  <ArrowUpRight className="h-3 w-3 text-green-600 mr-1" />
                  <span className="text-green-600">+{stats.earningsGrowth}%</span>
                  <span className="ml-1">from last month</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Orders */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Recent Orders</CardTitle>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/seller/orders">View All</Link>
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentOrders.map((order) => (
                  <div key={order.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <span className="font-semibold font-mono text-sm">{order.id}</span>
                        {getStatusBadge(order.status)}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {order.customer} • {order.products} item{order.products > 1 ? "s" : ""} • {order.date}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold font-mono">${order.total.toFixed(2)}</p>
                      <Button variant="link" size="sm" className="h-auto p-0" asChild>
                        <Link href={`/orders/${order.id}`}>View Details</Link>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Top Products */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Top Performing Products</CardTitle>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/seller/products">View All Products</Link>
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {topProducts.map((product, idx) => (
                  <div key={product.id} className="flex items-center gap-4 p-4 border rounded-lg">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold">
                      {idx + 1}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold mb-1">{product.name}</h4>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <ShoppingBag className="h-3.5 w-3.5" />
                          {product.sales} sales
                        </span>
                        <span className="flex items-center gap-1">
                          <Eye className="h-3.5 w-3.5" />
                          {product.views} views
                        </span>
                        <span className="flex items-center gap-1">
                          <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                          {product.rating}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold font-mono text-lg">${product.revenue.toFixed(2)}</p>
                      <p className="text-sm text-muted-foreground">Revenue</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <div className="grid sm:grid-cols-3 gap-4">
            <Button size="lg" asChild>
              <Link href="/seller/products/new">Add New Product</Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/seller/orders">Manage Orders</Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/seller/earnings">View Earnings</Link>
            </Button>
          </div>
        </div>
      </SellerLayout>
    </RoleGuard>
  );
}