"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { CheckCircle2, Clock, PackageCheck, RefreshCw, Search, XCircle } from "lucide-react";
import { AdminLayout } from "@/components/AdminLayout";
import { RoleGuard } from "@/components/RoleGuard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuthContext } from "@/contexts/AuthContext";
import { useMarketplaceSettings } from "@/contexts/MarketplaceSettingsContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { getErrorMessage } from "@/lib/errors";

type ReturnStatus = "requested" | "approved" | "rejected" | "received" | "refunded";

interface ReturnRequest {
  id: string;
  return_number: string;
  order_id: string;
  customer_id: string;
  status: ReturnStatus;
  reason: string;
  details: string | null;
  refund_amount: number | null;
  admin_note: string | null;
  created_at: string | null;
  order: {
    id: string;
    order_number: string;
    total: number;
    status: string | null;
  } | null;
  customer: {
    full_name: string | null;
    email: string | null;
  } | null;
}

const statusStyles: Record<ReturnStatus, string> = {
  requested: "bg-yellow-500/10 text-yellow-700",
  approved: "bg-blue-500/10 text-blue-700",
  rejected: "bg-red-500/10 text-red-700",
  received: "bg-purple-500/10 text-purple-700",
  refunded: "bg-green-500/10 text-green-700",
};

export default function AdminReturnsPage() {
  const { user, loading: authLoading } = useAuthContext();
  const { formatPrice } = useMarketplaceSettings();
  const { toast } = useToast();
  const [returns, setReturns] = useState<ReturnRequest[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState("");
  const [refundDrafts, setRefundDrafts] = useState<Record<string, string>>({});
  const [noteDrafts, setNoteDrafts] = useState<Record<string, string>>({});

  const loadReturns = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("return_requests")
      .select(`
        *,
        order:orders(id, order_number, total, status),
        customer:profiles(full_name, email)
      `)
      .order("created_at", { ascending: false });

    if (error) {
      toast({
        title: "Returns unavailable",
        description: error.message,
        variant: "destructive",
      });
    } else {
      const nextReturns = (data ?? []) as unknown as ReturnRequest[];
      setReturns(nextReturns);
      setRefundDrafts(
        Object.fromEntries(
          nextReturns.map((request) => [
            request.id,
            String(request.refund_amount ?? request.order?.total ?? ""),
          ])
        )
      );
      setNoteDrafts(
        Object.fromEntries(
          nextReturns.map((request) => [request.id, request.admin_note || ""])
        )
      );
    }
    setLoading(false);
  }, [toast]);

  useEffect(() => {
    if (!authLoading && user) {
      loadReturns();
    }
  }, [authLoading, loadReturns, user]);

  const updateReturnStatus = async (request: ReturnRequest, status: ReturnStatus) => {
    setUpdatingId(request.id);
    try {
      const update: Record<string, unknown> = { status };
      const timestamp = new Date().toISOString();
      const refundAmount = Number(refundDrafts[request.id] || request.refund_amount || request.order?.total || 0);
      const adminNote = noteDrafts[request.id]?.trim() || null;

      if (status === "approved") {
        update.approved_at = timestamp;
        update.refund_amount = Number.isFinite(refundAmount) && refundAmount > 0 ? refundAmount : null;
      }
      if (status === "rejected") update.rejected_at = timestamp;
      if (status === "received") {
        update.refund_amount = Number.isFinite(refundAmount) && refundAmount > 0 ? refundAmount : request.refund_amount;
      }
      if (status === "refunded") {
        update.refunded_at = timestamp;
        update.refund_amount = Number.isFinite(refundAmount) && refundAmount > 0 ? refundAmount : request.refund_amount;
      }
      update.admin_note = adminNote;

      const { error } = await supabase
        .from("return_requests")
        .update(update)
        .eq("id", request.id);

      if (error) throw error;

      if (status === "refunded") {
        await supabase
          .from("orders")
          .update({ status: "refunded", updated_at: timestamp })
          .eq("id", request.order_id);

        await supabase
          .from("payments")
          .update({ status: "refunded" })
          .eq("order_id", request.order_id);

        const { data: orderItems } = await supabase
          .from("order_items")
          .select("id")
          .eq("order_id", request.order_id);

        const orderItemIds = ((orderItems ?? []) as Array<{ id: string }>).map((item) => item.id);
        if (orderItemIds.length) {
          await supabase
            .from("seller_earnings")
            .update({ status: "reversed" })
            .in("order_item_id", orderItemIds);
        }
      }

      setReturns((current) =>
        current.map((item) => item.id === request.id ? { ...item, ...update } as ReturnRequest : item)
      );
      toast({
        title: "Return updated",
        description: `${request.return_number} marked ${status}.`,
      });
    } catch (error) {
      toast({
        title: "Return update failed",
        description: getErrorMessage(error, "Could not update this return."),
        variant: "destructive",
      });
    } finally {
      setUpdatingId("");
    }
  };

  const search = searchQuery.trim().toLowerCase();
  const filteredReturns = returns.filter((request) => {
    const customer = request.customer?.full_name || request.customer?.email || "";
    return (
      !search ||
      request.return_number.toLowerCase().includes(search) ||
      request.reason.toLowerCase().includes(search) ||
      (request.order?.order_number || "").toLowerCase().includes(search) ||
      customer.toLowerCase().includes(search)
    );
  });

  const stats = useMemo(() => ({
    requested: returns.filter((request) => request.status === "requested").length,
    approved: returns.filter((request) => ["approved", "received"].includes(request.status)).length,
    refunded: returns.filter((request) => request.status === "refunded").length,
    refundValue: returns
      .filter((request) => request.status === "refunded")
      .reduce((sum, request) => sum + Number(request.refund_amount || 0), 0),
  }), [returns]);

  return (
    <RoleGuard allowedRoles={["admin", "manager"]}>
      <AdminLayout>
        <div className="space-y-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold">Returns & Refunds</h1>
              <p className="text-muted-foreground">Review customer return requests and approve refunds.</p>
            </div>
            <Button variant="outline" onClick={loadReturns}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground">New Requests</p>
                <p className="mt-2 text-2xl font-bold">{stats.requested}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground">Approved/Received</p>
                <p className="mt-2 text-2xl font-bold">{stats.approved}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground">Refunded</p>
                <p className="mt-2 text-2xl font-bold">{stats.refunded}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground">Refund Value</p>
                <p className="mt-2 text-2xl font-bold font-mono">{formatPrice(stats.refundValue)}</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardContent className="pt-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Search return, order, reason, or customer..."
                  className="pl-10"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Return Requests</CardTitle></CardHeader>
            <CardContent>
              {loading ? (
                <p className="py-12 text-center text-muted-foreground">Loading returns...</p>
              ) : filteredReturns.length === 0 ? (
                <p className="py-12 text-center text-muted-foreground">No return requests found.</p>
              ) : (
                <div className="space-y-4">
                  {filteredReturns.map((request) => {
                    const disabled = updatingId === request.id;
                    return (
                      <div key={request.id} className="rounded-md border p-4">
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                          <div className="space-y-2">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="font-mono text-sm font-semibold">{request.return_number}</p>
                              <Badge className={statusStyles[request.status]}>{request.status}</Badge>
                            </div>
                            <p className="font-medium">{request.reason}</p>
                            {request.details && (
                              <p className="max-w-3xl text-sm text-muted-foreground">{request.details}</p>
                            )}
                            <p className="text-sm text-muted-foreground">
                              {request.order?.order_number || "Order"} -{" "}
                              {request.customer?.full_name || request.customer?.email || "Customer"}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Requested {request.created_at ? new Date(request.created_at).toLocaleString() : "recently"}
                            </p>
                            <div className="grid gap-3 pt-3 md:grid-cols-2">
                              <div>
                                <Label htmlFor={`refund-${request.id}`}>Refund amount</Label>
                                <Input
                                  id={`refund-${request.id}`}
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  value={refundDrafts[request.id] || ""}
                                  onChange={(event) =>
                                    setRefundDrafts((current) => ({
                                      ...current,
                                      [request.id]: event.target.value,
                                    }))
                                  }
                                  disabled={disabled || request.status === "refunded"}
                                />
                              </div>
                              <div>
                                <Label htmlFor={`note-${request.id}`}>Admin note</Label>
                                <Textarea
                                  id={`note-${request.id}`}
                                  value={noteDrafts[request.id] || ""}
                                  onChange={(event) =>
                                    setNoteDrafts((current) => ({
                                      ...current,
                                      [request.id]: event.target.value,
                                    }))
                                  }
                                  rows={2}
                                  placeholder="Reason, inspection note, refund reference..."
                                  disabled={disabled || request.status === "refunded"}
                                />
                              </div>
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-2 lg:justify-end">
                            <Button
                              size="sm"
                              disabled={disabled || request.status !== "requested"}
                              onClick={() => updateReturnStatus(request, "approved")}
                            >
                              <CheckCircle2 className="mr-2 h-4 w-4" />
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={disabled || !["approved", "requested"].includes(request.status)}
                              onClick={() => updateReturnStatus(request, "received")}
                            >
                              <PackageCheck className="mr-2 h-4 w-4" />
                              Received
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={disabled || request.status !== "received"}
                              onClick={() => updateReturnStatus(request, "refunded")}
                            >
                              <Clock className="mr-2 h-4 w-4" />
                              Refund
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              disabled={disabled || ["rejected", "refunded"].includes(request.status)}
                              onClick={() => updateReturnStatus(request, "rejected")}
                            >
                              <XCircle className="mr-2 h-4 w-4" />
                              Reject
                            </Button>
                            {request.order && (
                              <Button size="sm" variant="link" asChild>
                                <Link href={`/orders/${request.order.id}`}>View order</Link>
                              </Button>
                            )}
                          </div>
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
