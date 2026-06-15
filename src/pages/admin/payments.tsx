"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { CheckCircle, Clock, DollarSign, Search, XCircle } from "lucide-react";
import { AdminLayout } from "@/components/AdminLayout";
import { RoleGuard } from "@/components/RoleGuard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useAuthContext } from "@/contexts/AuthContext";
import { useMarketplaceSettings } from "@/contexts/MarketplaceSettingsContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/database.types";
import { getErrorMessage } from "@/lib/errors";

type PaymentStatus = Database["public"]["Enums"]["payment_status"];

interface Payment {
  id: string;
  amount: number;
  payment_method: string;
  status: PaymentStatus | null;
  transaction_id: string | null;
  payment_proof_url: string | null;
  paid_at: string | null;
  created_at: string | null;
  order: {
    id: string;
    order_number: string;
    customer: { full_name: string | null; email: string | null } | null;
  } | null;
}

const statusColors: Record<PaymentStatus, string> = {
  completed: "bg-green-500/10 text-green-700",
  pending: "bg-yellow-500/10 text-yellow-700",
  failed: "bg-red-500/10 text-red-700",
  refunded: "bg-orange-500/10 text-orange-700",
};

export default function AdminPaymentsPage() {
  const { user, loading: authLoading } = useAuthContext();
  const { formatPrice } = useMarketplaceSettings();
  const { toast } = useToast();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadPayments = useCallback(async () => {
    setLoading(true);
    setError("");

    const { data, error: paymentError } = await supabase
      .from("payments")
      .select(`
        id,
        amount,
        payment_method,
        status,
        transaction_id,
        payment_proof_url,
        paid_at,
        created_at,
        order:orders(
          id,
          order_number,
          customer:profiles(full_name, email)
        )
      `)
      .order("created_at", { ascending: false });

    if (paymentError) {
      setError("Payments could not be loaded.");
      setLoading(false);
      return;
    }

    setPayments((data ?? []) as unknown as Payment[]);
    setLoading(false);
  }, []);

  const updatePaymentStatus = useCallback(async (payment: Payment, status: PaymentStatus) => {
    const timestamp = new Date().toISOString();
    const update: Database["public"]["Tables"]["payments"]["Update"] = {
      status,
      paid_at: status === "completed" ? timestamp : payment.paid_at,
    };

    const { error } = await supabase
      .from("payments")
      .update(update)
      .eq("id", payment.id);

    if (error) {
      toast({
        title: "Payment update failed",
        description: getErrorMessage(error, "Could not update this payment."),
        variant: "destructive",
      });
      return;
    }

    if (payment.order?.id && status === "completed") {
      await supabase
        .from("orders")
        .update({ status: "confirmed", updated_at: timestamp })
        .eq("id", payment.order.id)
        .in("status", ["pending"]);
    }

    if (payment.order?.id && status === "failed") {
      await supabase
        .from("orders")
        .update({ status: "cancelled", cancelled_at: timestamp, updated_at: timestamp })
        .eq("id", payment.order.id)
        .in("status", ["pending", "confirmed"]);
    }

    if (payment.order?.id && status === "refunded") {
      await supabase
        .from("orders")
        .update({ status: "refunded", updated_at: timestamp })
        .eq("id", payment.order.id);
    }

    setPayments((current) =>
      current.map((item) => item.id === payment.id ? { ...item, ...update } : item)
    );
    toast({
      title: "Payment updated",
      description: `${payment.transaction_id || payment.id} marked ${status} and synced with the order.`,
    });
  }, [toast]);

  useEffect(() => {
    if (!authLoading && user) {
      loadPayments();
    }
  }, [authLoading, loadPayments, user]);

  const stats = useMemo(() => {
    const today = new Date().toDateString();
    return {
      revenue: payments
        .filter((payment) => payment.status === "completed")
        .reduce((sum, payment) => sum + payment.amount, 0),
      pending: payments.filter((payment) => payment.status === "pending").length,
      completedToday: payments.filter((payment) => {
        const date = payment.paid_at || payment.created_at;
        return payment.status === "completed" && date && new Date(date).toDateString() === today;
      }).length,
      failed: payments.filter((payment) => payment.status === "failed").length,
    };
  }, [payments]);

  const filteredPayments = payments.filter((payment) => {
    const search = searchQuery.toLowerCase();
    const customer = payment.order?.customer?.full_name || payment.order?.customer?.email || "";
    return (
      payment.id.toLowerCase().includes(search) ||
      (payment.transaction_id ?? "").toLowerCase().includes(search) ||
      (payment.order?.order_number ?? "").toLowerCase().includes(search) ||
      customer.toLowerCase().includes(search)
    );
  });

  const cards = [
    { label: "Completed Revenue", value: formatPrice(stats.revenue), icon: DollarSign },
    { label: "Pending Payments", value: stats.pending.toLocaleString(), icon: Clock },
    { label: "Completed Today", value: stats.completedToday.toLocaleString(), icon: CheckCircle },
    { label: "Failed Payments", value: stats.failed.toLocaleString(), icon: XCircle },
  ];

  return (
    <RoleGuard allowedRoles={["admin"]}>
      <AdminLayout>
        <div className="space-y-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold">Payment Management</h1>
              <p className="text-muted-foreground">Live payment records linked to customer orders.</p>
            </div>
            <Button variant="outline" onClick={loadPayments}>Refresh</Button>
          </div>

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
            <CardHeader><CardTitle>Payments</CardTitle></CardHeader>
            <CardContent>
              <div className="relative mb-6">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Search payment, transaction, order, or customer..."
                  className="pl-10"
                />
              </div>

              {loading ? (
                <p className="py-10 text-center text-muted-foreground">Loading payments...</p>
              ) : error ? (
                <p className="py-10 text-center text-destructive">{error}</p>
              ) : filteredPayments.length === 0 ? (
                <p className="py-10 text-center text-muted-foreground">No payments found.</p>
              ) : (
                <div className="space-y-3">
                  {filteredPayments.map((payment) => {
                    const customer = payment.order?.customer?.full_name
                      || payment.order?.customer?.email
                      || "Customer";
                    const paymentDate = payment.paid_at || payment.created_at;

                    return (
                      <div key={payment.id} className="flex flex-wrap items-center justify-between gap-4 border-b pb-4 last:border-0">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-mono text-sm font-semibold">{payment.transaction_id || payment.id}</p>
                            {payment.status && (
                              <Badge className={statusColors[payment.status]}>{payment.status}</Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {payment.order?.order_number || "No order"} - {customer}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {payment.payment_method}
                            {paymentDate ? ` - ${new Date(paymentDate).toLocaleDateString()}` : ""}
                          </p>
                          {payment.payment_proof_url && (
                            <a
                              href={payment.payment_proof_url}
                              target="_blank"
                              rel="noreferrer"
                              className="text-xs font-medium text-primary hover:underline"
                            >
                              View payment proof
                            </a>
                          )}
                        </div>
                        <div className="flex flex-col items-end gap-2 text-right">
                          <p className="font-mono text-lg font-bold">{formatPrice(payment.amount)}</p>
                          <div className="flex flex-wrap justify-end gap-2">
                            {payment.status !== "completed" && (
                              <Button size="sm" onClick={() => updatePaymentStatus(payment, "completed")}>
                                Verify
                              </Button>
                            )}
                            {payment.status !== "failed" && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => updatePaymentStatus(payment, "failed")}
                              >
                                Mark Failed
                              </Button>
                            )}
                            {payment.status === "completed" && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => updatePaymentStatus(payment, "refunded")}
                              >
                                Refund
                              </Button>
                            )}
                          </div>
                          {payment.order && (
                            <Button variant="link" size="sm" className="h-auto p-0" asChild>
                              <Link href={`/orders/${payment.order.id}`}>View order</Link>
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </AdminLayout>
    </RoleGuard>
  );
}
