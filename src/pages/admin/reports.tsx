"use client";

import { AdminLayout } from "@/components/AdminLayout";
import { RoleGuard } from "@/components/RoleGuard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BarChart3, Download, TrendingUp, Users, Package, DollarSign } from "lucide-react";

export default function AdminReportsPage() {
  // Mock report data
  const reports = {
    sales: {
      total: 125840,
      growth: 12.5,
      trend: "up",
    },
    users: {
      total: 8932,
      growth: 8.3,
      trend: "up",
    },
    products: {
      total: 2456,
      growth: 15.2,
      trend: "up",
    },
    revenue: {
      total: 94350,
      growth: 10.1,
      trend: "up",
    },
  };

  const topProducts = [
    { name: "Premium Wireless Headphones", sales: 2341, revenue: 35115 },
    { name: "Smart Watch Pro", sales: 1876, revenue: 56280 },
    { name: "Laptop Stand Aluminum", sales: 1543, revenue: 7715 },
  ];

  const topVendors = [
    { name: "TechGear Store", sales: 4523, revenue: 67845 },
    { name: "Gadget Paradise", sales: 3876, revenue: 58140 },
    { name: "Electronics Hub", sales: 3124, revenue: 46860 },
  ];

  return (
    <RoleGuard allowedRoles={["admin"]}>
      <AdminLayout>
        <div className="space-y-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold font-serif mb-2">Reports & Analytics</h1>
              <p className="text-muted-foreground">Platform performance insights and trends</p>
            </div>
            <Button>
              <Download className="mr-2 h-4 w-4" />
              Export Report
            </Button>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-muted-foreground">Total Sales</p>
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                </div>
                <p className="text-2xl font-bold">${reports.sales.total.toLocaleString()}</p>
                <p className="text-xs text-green-600 mt-1">↑ {reports.sales.growth}% from last month</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-muted-foreground">Total Users</p>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </div>
                <p className="text-2xl font-bold">{reports.users.total.toLocaleString()}</p>
                <p className="text-xs text-green-600 mt-1">↑ {reports.users.growth}% from last month</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-muted-foreground">Active Products</p>
                  <Package className="h-4 w-4 text-muted-foreground" />
                </div>
                <p className="text-2xl font-bold">{reports.products.total.toLocaleString()}</p>
                <p className="text-xs text-green-600 mt-1">↑ {reports.products.growth}% from last month</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-muted-foreground">Platform Revenue</p>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </div>
                <p className="text-2xl font-bold">${reports.revenue.total.toLocaleString()}</p>
                <p className="text-xs text-green-600 mt-1">↑ {reports.revenue.growth}% from last month</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Top Products</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {topProducts.map((product, index) => (
                    <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <p className="font-medium">{product.name}</p>
                        <p className="text-sm text-muted-foreground">{product.sales} sales</p>
                      </div>
                      <p className="font-bold">${product.revenue.toLocaleString()}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Top Vendors</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {topVendors.map((vendor, index) => (
                    <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <p className="font-medium">{vendor.name}</p>
                        <p className="text-sm text-muted-foreground">{vendor.sales} orders</p>
                      </div>
                      <p className="font-bold">${vendor.revenue.toLocaleString()}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </AdminLayout>
    </RoleGuard>
  );
}