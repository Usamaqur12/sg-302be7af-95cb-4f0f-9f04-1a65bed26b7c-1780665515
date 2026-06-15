"use client";

import { useCallback, useEffect, useState } from "react";
import { BarChart3, DollarSign, Download, Package, Users } from "lucide-react";
import { AdminLayout } from "@/components/AdminLayout";
import { RoleGuard } from "@/components/RoleGuard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuthContext } from "@/contexts/AuthContext";
import { useMarketplaceSettings } from "@/contexts/MarketplaceSettingsContext";
import { supabase } from "@/integrations/supabase/client";

interface ProductReport {
  id: string;
  title: string;
  price: number;
  sales_count: number | null;
}

interface SellerReport {
  id: string;
  business_name: string;
  total_sales: number | null;
  total_earnings: number | null;
}

interface ReportData {
  completedSales: number;
  users: number;
  activeProducts: number;
  platformCommission: number;
  topProducts: ProductReport[];
  topSellers: SellerReport[];
}

const EMPTY_REPORT: ReportData = {
  completedSales: 0,
  users: 0,
  activeProducts: 0,
  platformCommission: 0,
  topProducts: [],
  topSellers: [],
};

export default function AdminReportsPage() {
  const { user, loading: authLoading } = useAuthContext();
  const { formatPrice } = useMarketplaceSettings();
  const [report, setReport] = useState(EMPTY_REPORT);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadReport = useCallback(async () => {
    setLoading(true);
    setError("");

    const [usersResult, productsResult, sellersResult, paymentsResult, itemsResult] = await Promise.all([
      supabase.from("profiles").select("*", { count: "exact", head: true }),
      supabase
        .from("products")
        .select("id, title, price, sales_count", { count: "exact" })
        .eq("status", "approved")
        .order("sales_count", { ascending: false }),
      supabase
        .from("seller_profiles")
        .select("id, business_name, total_sales, total_earnings")
        .eq("status", "approved")
        .order("total_sales", { ascending: false }),
      supabase.from("payments").select("amount, status").eq("status", "completed"),
      supabase.from("order_items").select("commission_amount"),
    ]);

    const firstError = usersResult.error
      || productsResult.error
      || sellersResult.error
      || paymentsResult.error
      || itemsResult.error;

    if (firstError) {
      setError(firstError.message);
      setLoading(false);
      return;
    }

    setReport({
      completedSales: (paymentsResult.data ?? []).reduce((sum, payment) => sum + payment.amount, 0),
      users: usersResult.count ?? 0,
      activeProducts: productsResult.count ?? 0,
      platformCommission: (itemsResult.data ?? []).reduce(
        (sum, item) => sum + item.commission_amount,
        0
      ),
      topProducts: (productsResult.data ?? []).slice(0, 5),
      topSellers: (sellersResult.data ?? []).slice(0, 5),
    });
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!authLoading && user) {
      loadReport();
    }
  }, [authLoading, loadReport, user]);

  const exportReport = () => {
    const rows = [
      ["Metric", "Value"],
      ["Completed Sales", report.completedSales.toFixed(2)],
      ["Users", report.users.toString()],
      ["Approved Products", report.activeProducts.toString()],
      ["Platform Commission", report.platformCommission.toFixed(2)],
      [],
      ["Top Product", "Units Sold", "Estimated Revenue"],
      ...report.topProducts.map((product) => [
        product.title,
        String(product.sales_count ?? 0),
        (product.price * (product.sales_count ?? 0)).toFixed(2),
      ]),
    ];

    const csv = rows
      .map((row) => row.map((cell) => `"${String(cell ?? "").replaceAll('"', '""')}"`).join(","))
      .join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `marketplace-report-${new Date().toISOString().slice(0, 10)}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const cards = [
    { label: "Completed Sales", value: formatPrice(report.completedSales), icon: BarChart3 },
    { label: "Registered Users", value: report.users.toLocaleString(), icon: Users },
    { label: "Approved Products", value: report.activeProducts.toLocaleString(), icon: Package },
    { label: "Platform Commission", value: formatPrice(report.platformCommission), icon: DollarSign },
  ];

  return (
    <RoleGuard allowedRoles={["admin"]}>
      <AdminLayout>
        <div className="space-y-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold">Reports & Analytics</h1>
              <p className="text-muted-foreground">Live platform performance and CSV export.</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={loadReport}>Refresh</Button>
              <Button onClick={exportReport} disabled={loading || Boolean(error)}>
                <Download className="mr-2 h-4 w-4" /> Export CSV
              </Button>
            </div>
          </div>

          {loading ? (
            <p className="py-16 text-center text-muted-foreground">Loading reports...</p>
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
                      <p className="mt-2 text-2xl font-bold font-mono">{value}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <div className="grid gap-6 lg:grid-cols-2">
                <Card>
                  <CardHeader><CardTitle>Top Products</CardTitle></CardHeader>
                  <CardContent className="space-y-3">
                    {report.topProducts.length === 0 ? (
                      <p className="py-8 text-center text-muted-foreground">No product sales yet.</p>
                    ) : report.topProducts.map((product) => (
                      <div key={product.id} className="flex items-center justify-between gap-4 border-b pb-3 last:border-0">
                        <div className="min-w-0">
                          <p className="truncate font-medium">{product.title}</p>
                          <p className="text-sm text-muted-foreground">{product.sales_count ?? 0} units sold</p>
                        </div>
                        <p className="font-mono font-semibold">
                          {formatPrice(product.price * (product.sales_count ?? 0))}
                        </p>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader><CardTitle>Top Sellers</CardTitle></CardHeader>
                  <CardContent className="space-y-3">
                    {report.topSellers.length === 0 ? (
                      <p className="py-8 text-center text-muted-foreground">No approved sellers yet.</p>
                    ) : report.topSellers.map((seller) => (
                      <div key={seller.id} className="flex items-center justify-between gap-4 border-b pb-3 last:border-0">
                        <div>
                          <p className="font-medium">{seller.business_name}</p>
                          <p className="text-sm text-muted-foreground">
                            {formatPrice(seller.total_sales ?? 0)} gross sales
                          </p>
                        </div>
                        <p className="font-mono font-semibold">
                          {formatPrice(seller.total_earnings ?? 0)}
                        </p>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </div>
      </AdminLayout>
    </RoleGuard>
  );
}
