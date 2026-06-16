"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { BarChart3, Banknote, Download, Package, RefreshCw, Save, TrendingUp, Users } from "lucide-react";
import { AdminLayout } from "@/components/AdminLayout";
import { RoleGuard } from "@/components/RoleGuard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useAuthContext } from "@/contexts/AuthContext";
import { useMarketplaceSettings } from "@/contexts/MarketplaceSettingsContext";
import { useToast } from "@/hooks/use-toast";
import { csrfHeaders } from "@/lib/csrf";
import { getErrorMessage } from "@/lib/errors";

type CodStatus =
  | "awaiting_collection"
  | "collected"
  | "partially_remitted"
  | "reconciled"
  | "short_paid"
  | "over_paid"
  | "disputed"
  | "written_off";

interface CodReconciliation {
  id: string;
  order_id: string;
  payment_id: string | null;
  order_number: string | null;
  customer_name: string | null;
  courier_name: string | null;
  courier_reference: string | null;
  expected_amount: number;
  collected_amount: number;
  remitted_amount: number;
  courier_fee: number;
  discrepancy_amount: number;
  currency: string;
  status: CodStatus;
  collected_at: string | null;
  remitted_at: string | null;
  reconciled_at: string | null;
  notes: string | null;
  created_at: string | null;
}

interface ReportData {
  completedSales: number;
  users: number;
  activeProducts: number;
  platformCommission: number;
  collectedCash: number;
  unreconciledCod: number;
  codVariance: number;
  refundExposure: number;
  sellerPayable: number;
  payoutPaid: number;
  paymentFees: number;
  contributionMargin: number;
  codReconciliations: CodReconciliation[];
  topProducts: Array<{ id: string; title: string; sales_count: number; estimated_revenue: number }>;
  topSellers: Array<{ id: string; business_name: string; total_sales: number; total_earnings: number }>;
}

type CodForm = {
  courier_name: string;
  courier_reference: string;
  collected_amount: string;
  remitted_amount: string;
  courier_fee: string;
  notes: string;
};

const EMPTY_REPORT: ReportData = {
  completedSales: 0,
  users: 0,
  activeProducts: 0,
  platformCommission: 0,
  collectedCash: 0,
  unreconciledCod: 0,
  codVariance: 0,
  refundExposure: 0,
  sellerPayable: 0,
  payoutPaid: 0,
  paymentFees: 0,
  contributionMargin: 0,
  codReconciliations: [],
  topProducts: [],
  topSellers: [],
};

const statusStyles: Record<CodStatus, string> = {
  awaiting_collection: "bg-yellow-500/10 text-yellow-700",
  collected: "bg-blue-500/10 text-blue-700",
  partially_remitted: "bg-orange-500/10 text-orange-700",
  reconciled: "bg-green-500/10 text-green-700",
  short_paid: "bg-red-500/10 text-red-700",
  over_paid: "bg-purple-500/10 text-purple-700",
  disputed: "bg-red-500/10 text-red-700",
  written_off: "bg-muted text-muted-foreground",
};

function formFromCod(row: CodReconciliation): CodForm {
  return {
    courier_name: row.courier_name || "",
    courier_reference: row.courier_reference || "",
    collected_amount: String(row.collected_amount || ""),
    remitted_amount: String(row.remitted_amount || ""),
    courier_fee: String(row.courier_fee || ""),
    notes: row.notes || "",
  };
}

export default function AdminReportsPage() {
  const { user, loading: authLoading } = useAuthContext();
  const { formatPrice } = useMarketplaceSettings();
  const { toast } = useToast();
  const [report, setReport] = useState(EMPTY_REPORT);
  const [codForms, setCodForms] = useState<Record<string, CodForm>>({});
  const [savingCodId, setSavingCodId] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadReport = useCallback(async () => {
    setLoading(true);
    setError("");

    const response = await fetch("/api/admin/finance/summary", {
      method: "GET",
      credentials: "include",
    });
    const payload = await response.json().catch(() => ({}));

    if (!response.ok) {
      setError(getErrorMessage(payload?.error, "Finance report could not be loaded."));
      setLoading(false);
      return;
    }

    const nextReport = { ...EMPTY_REPORT, ...(payload.report || {}) } as ReportData;
    setReport(nextReport);
    setCodForms((current) => {
      const next = { ...current };
      for (const row of nextReport.codReconciliations) {
        next[row.id] ||= formFromCod(row);
      }
      return next;
    });
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!authLoading && user) {
      loadReport();
    }
  }, [authLoading, loadReport, user]);

  const updateCodForm = (id: string, key: keyof CodForm, value: string) => {
    setCodForms((current) => ({
      ...current,
      [id]: { ...(current[id] || formFromCod(report.codReconciliations.find((row) => row.id === id)!)), [key]: value },
    }));
  };

  const saveCod = async (row: CodReconciliation) => {
    const form = codForms[row.id] || formFromCod(row);
    setSavingCodId(row.id);
    const response = await fetch(`/api/admin/finance/cod/${row.id}`, {
      method: "POST",
      headers: csrfHeaders({ "Content-Type": "application/json" }),
      credentials: "include",
      body: JSON.stringify({
        ...form,
        collected_amount: Number(form.collected_amount || 0),
        remitted_amount: Number(form.remitted_amount || 0),
        courier_fee: Number(form.courier_fee || 0),
        idempotency_key: `admin-cod:${row.id}:${Date.now()}`,
      }),
    });
    const payload = await response.json().catch(() => ({}));
    setSavingCodId("");

    if (!response.ok) {
      toast({
        title: "COD update failed",
        description: getErrorMessage(payload?.error, "Could not save COD reconciliation."),
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "COD reconciliation saved",
      description: `${row.order_number || row.order_id} is now ${payload.reconciliation?.status || "updated"}.`,
    });
    await loadReport();
  };

  const exportReport = () => {
    const rows = [
      ["Metric", "Value"],
      ["Completed Sales", report.completedSales.toFixed(2)],
      ["Collected COD Cash", report.collectedCash.toFixed(2)],
      ["Unreconciled COD", report.unreconciledCod.toFixed(2)],
      ["COD Variance", report.codVariance.toFixed(2)],
      ["Platform Commission", report.platformCommission.toFixed(2)],
      ["Payment/Courier Fees", report.paymentFees.toFixed(2)],
      ["Refund Exposure", report.refundExposure.toFixed(2)],
      ["Seller Payable", report.sellerPayable.toFixed(2)],
      ["Payout Paid", report.payoutPaid.toFixed(2)],
      ["Contribution Margin", report.contributionMargin.toFixed(2)],
      ["Users", report.users.toString()],
      ["Approved Products", report.activeProducts.toString()],
      [],
      ["COD Order", "Status", "Expected", "Collected", "Remitted", "Fee", "Variance"],
      ...report.codReconciliations.map((row) => [
        row.order_number || row.order_id,
        row.status,
        row.expected_amount.toFixed(2),
        row.collected_amount.toFixed(2),
        row.remitted_amount.toFixed(2),
        row.courier_fee.toFixed(2),
        row.discrepancy_amount.toFixed(2),
      ]),
      [],
      ["Top Product", "Units Sold", "Estimated Revenue"],
      ...report.topProducts.map((product) => [
        product.title,
        String(product.sales_count ?? 0),
        product.estimated_revenue.toFixed(2),
      ]),
    ];

    const csv = rows
      .map((row) => row.map((cell) => `"${String(cell ?? "").replaceAll('"', '""')}"`).join(","))
      .join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `finance-report-${new Date().toISOString().slice(0, 10)}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const cards = [
    { label: "Completed Sales", value: formatPrice(report.completedSales), icon: BarChart3 },
    { label: "Collected COD", value: formatPrice(report.collectedCash), icon: Banknote },
    { label: "Unreconciled COD", value: formatPrice(report.unreconciledCod), icon: RefreshCw },
    { label: "Contribution Margin", value: formatPrice(report.contributionMargin), icon: TrendingUp },
    { label: "Platform Commission", value: formatPrice(report.platformCommission), icon: BarChart3 },
    { label: "Payment Fees", value: formatPrice(report.paymentFees), icon: Banknote },
    { label: "Refund Exposure", value: formatPrice(report.refundExposure), icon: RefreshCw },
    { label: "Seller Payable", value: formatPrice(report.sellerPayable), icon: Users },
    { label: "Registered Users", value: report.users.toLocaleString(), icon: Users },
    { label: "Approved Products", value: report.activeProducts.toLocaleString(), icon: Package },
    { label: "Payout Paid", value: formatPrice(report.payoutPaid), icon: Banknote },
    { label: "COD Variance", value: formatPrice(report.codVariance), icon: TrendingUp },
  ];

  const hasCodRows = useMemo(() => report.codReconciliations.length > 0, [report.codReconciliations.length]);

  return (
    <RoleGuard allowedRoles={["admin"]}>
      <AdminLayout>
        <div className="space-y-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold">Finance Reports</h1>
              <p className="text-muted-foreground">COD reconciliation, payout exposure and unit economics.</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={loadReport} disabled={loading}>
                <RefreshCw className="mr-2 h-4 w-4" /> Refresh
              </Button>
              <Button onClick={exportReport} disabled={loading || Boolean(error)}>
                <Download className="mr-2 h-4 w-4" /> Export CSV
              </Button>
            </div>
          </div>

          {loading ? (
            <p className="py-16 text-center text-muted-foreground">Loading finance report...</p>
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

              <Card>
                <CardHeader><CardTitle>COD Reconciliation</CardTitle></CardHeader>
                <CardContent>
                  {!hasCodRows ? (
                    <p className="py-10 text-center text-muted-foreground">No COD orders awaiting reconciliation.</p>
                  ) : (
                    <div className="space-y-4">
                      {report.codReconciliations.map((row) => {
                        const form = codForms[row.id] || formFromCod(row);
                        return (
                          <div key={row.id} className="grid gap-4 border-b pb-4 last:border-0 xl:grid-cols-[1.4fr_2fr_auto]">
                            <div className="min-w-0 space-y-2">
                              <div className="flex flex-wrap items-center gap-2">
                                <p className="font-mono text-sm font-semibold">{row.order_number || row.order_id}</p>
                                <Badge className={statusStyles[row.status]}>{row.status.replaceAll("_", " ")}</Badge>
                              </div>
                              <p className="text-sm text-muted-foreground">{row.customer_name || "Customer"}</p>
                              <p className="font-mono text-sm">
                                Expected {formatPrice(row.expected_amount)} - variance {formatPrice(row.discrepancy_amount)}
                              </p>
                            </div>

                            <div className="grid gap-3 md:grid-cols-3">
                              <Input
                                value={form.courier_name}
                                onChange={(event) => updateCodForm(row.id, "courier_name", event.target.value)}
                                placeholder="Courier"
                              />
                              <Input
                                value={form.courier_reference}
                                onChange={(event) => updateCodForm(row.id, "courier_reference", event.target.value)}
                                placeholder="Reference"
                              />
                              <Input
                                value={form.notes}
                                onChange={(event) => updateCodForm(row.id, "notes", event.target.value)}
                                placeholder="Finance note"
                              />
                              <Input
                                type="number"
                                min="0"
                                step="0.01"
                                value={form.collected_amount}
                                onChange={(event) => updateCodForm(row.id, "collected_amount", event.target.value)}
                                placeholder="Collected"
                              />
                              <Input
                                type="number"
                                min="0"
                                step="0.01"
                                value={form.remitted_amount}
                                onChange={(event) => updateCodForm(row.id, "remitted_amount", event.target.value)}
                                placeholder="Remitted"
                              />
                              <Input
                                type="number"
                                min="0"
                                step="0.01"
                                value={form.courier_fee}
                                onChange={(event) => updateCodForm(row.id, "courier_fee", event.target.value)}
                                placeholder="Courier fee"
                              />
                            </div>

                            <div className="flex items-start justify-end">
                              <Button onClick={() => saveCod(row)} disabled={savingCodId === row.id}>
                                <Save className="mr-2 h-4 w-4" /> Save
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>

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
                        <p className="font-mono font-semibold">{formatPrice(product.estimated_revenue)}</p>
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
                        <p className="font-mono font-semibold">{formatPrice(seller.total_earnings ?? 0)}</p>
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
