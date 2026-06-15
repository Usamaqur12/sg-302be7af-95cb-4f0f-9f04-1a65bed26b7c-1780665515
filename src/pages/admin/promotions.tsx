"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { BadgePercent, CheckCircle2, Gift, Search, ShieldCheck, Tag, XCircle, Zap } from "lucide-react";
import { AdminLayout } from "@/components/AdminLayout";
import { RoleGuard } from "@/components/RoleGuard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useAuthContext } from "@/contexts/AuthContext";
import { useMarketplaceSettings } from "@/contexts/MarketplaceSettingsContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { getErrorMessage } from "@/lib/errors";
import { scorePromotionRequest } from "@/lib/promotions";

type PromotionStatus = "pending" | "approved" | "active" | "rejected" | "ended";
type PromotionFilter =
  | "all"
  | "campaign"
  | "drzflash"
  | "seller_voucher"
  | "free_shipping"
  | "bundle_deal"
  | "coins_discount"
  | "seller_program";

interface PromotionRequest {
  id: string;
  seller_id: string;
  product_id: string | null;
  request_type: string;
  title: string;
  details: string | null;
  discount_type: string | null;
  discount_value: number | null;
  min_order_amount: number | null;
  max_discount_amount: number | null;
  budget_amount: number | null;
  start_at: string | null;
  end_at: string | null;
  status: PromotionStatus | null;
  approved_by: string | null;
  approved_at: string | null;
  rejected_at: string | null;
  rejection_reason: string | null;
  admin_note: string | null;
  created_at: string | null;
  seller?: {
    business_name: string;
    status: string | null;
    account_health_status?: string | null;
  } | null;
  product?: {
    title: string;
    status: string | null;
    stock_quantity: number | null;
    price?: number | null;
  } | null;
}

interface PromotionForm {
  status: PromotionStatus;
  discount_type: string;
  discount_value: string;
  min_order_amount: string;
  max_discount_amount: string;
  budget_amount: string;
  start_at: string;
  end_at: string;
  admin_note: string;
  rejection_reason: string;
}

const filterOptions: Array<{ value: PromotionFilter; label: string }> = [
  { value: "all", label: "All Requests" },
  { value: "campaign", label: "Campaign" },
  { value: "drzflash", label: "DrzFlash" },
  { value: "seller_voucher", label: "Seller Voucher" },
  { value: "free_shipping", label: "Free Shipping" },
  { value: "bundle_deal", label: "Bundle Deal" },
  { value: "coins_discount", label: "Coins Discount" },
  { value: "seller_program", label: "Seller Program" },
];

function requestLabel(value: string) {
  if (value === "drzflash") return "DrzFlash";
  return value.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function statusBadge(status: PromotionStatus | null | undefined) {
  if (status === "active" || status === "approved") return "bg-green-500/10 text-green-700";
  if (status === "pending") return "bg-amber-500/10 text-amber-700";
  if (status === "rejected") return "bg-destructive/10 text-destructive";
  return "bg-muted text-muted-foreground";
}

function inputDateTime(value: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 16);
}

function isoOrNull(value: string) {
  return value ? new Date(value).toISOString() : null;
}

function scoreTone(score: number) {
  if (score >= 80) return "Strong";
  if (score >= 60) return "Review";
  return "Risk";
}

export default function AdminPromotionsPage() {
  const { user, loading: authLoading } = useAuthContext();
  const { formatPrice } = useMarketplaceSettings();
  const { toast } = useToast();
  const [requests, setRequests] = useState<PromotionRequest[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [typeFilter, setTypeFilter] = useState<PromotionFilter>("all");
  const [statusFilter, setStatusFilter] = useState<PromotionStatus | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<PromotionForm>({
    status: "pending",
    discount_type: "percentage",
    discount_value: "0",
    min_order_amount: "0",
    max_discount_amount: "0",
    budget_amount: "0",
    start_at: "",
    end_at: "",
    admin_note: "",
    rejection_reason: "",
  });

  const loadRequests = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("promotion_requests")
      .select(`
        *,
        seller:seller_profiles!seller_id(business_name, status, account_health_status),
        product:products!product_id(title, status, stock_quantity, price)
      `)
      .order("created_at", { ascending: false });

    if (error) {
      toast({ title: "Promotion approvals unavailable", description: error.message, variant: "destructive" });
      setLoading(false);
      return;
    }

    const nextRequests = (data ?? []) as unknown as PromotionRequest[];
    setRequests(nextRequests);
    setSelectedId((current) => current || nextRequests[0]?.id || "");
    setLoading(false);
  }, [toast]);

  useEffect(() => {
    if (!authLoading && user) loadRequests();
  }, [authLoading, loadRequests, user]);

  const selectedRequest = useMemo(
    () => requests.find((request) => request.id === selectedId) ?? null,
    [requests, selectedId]
  );

  useEffect(() => {
    if (!selectedRequest) return;
    setForm({
      status: selectedRequest.status || "pending",
      discount_type: selectedRequest.discount_type || "percentage",
      discount_value: String(selectedRequest.discount_value ?? 0),
      min_order_amount: String(selectedRequest.min_order_amount ?? 0),
      max_discount_amount: String(selectedRequest.max_discount_amount ?? 0),
      budget_amount: String(selectedRequest.budget_amount ?? 0),
      start_at: inputDateTime(selectedRequest.start_at),
      end_at: inputDateTime(selectedRequest.end_at),
      admin_note: selectedRequest.admin_note || "",
      rejection_reason: selectedRequest.rejection_reason || "",
    });
  }, [selectedRequest]);

  const filteredRequests = requests.filter((request) => {
    const search = searchQuery.toLowerCase();
    const haystack = [
      request.title,
      request.details,
      request.request_type,
      request.seller?.business_name,
      request.product?.title,
    ].join(" ").toLowerCase();
    return (
      (typeFilter === "all" || request.request_type === typeFilter) &&
      (statusFilter === "all" || request.status === statusFilter) &&
      (!search || haystack.includes(search))
    );
  });

  const stats = requests.reduce(
    (sum, request) => ({
      pending: sum.pending + (request.status === "pending" ? 1 : 0),
      approved: sum.approved + (request.status === "approved" || request.status === "active" ? 1 : 0),
      active: sum.active + (request.status === "active" ? 1 : 0),
      rejected: sum.rejected + (request.status === "rejected" ? 1 : 0),
      budget: sum.budget + Number(request.budget_amount || 0),
      score: sum.score + scorePromotionRequest(request),
    }),
    { pending: 0, approved: 0, active: 0, rejected: 0, budget: 0, score: 0 }
  );
  const averageScore = requests.length ? Math.round(stats.score / requests.length) : 0;
  const selectedScore = selectedRequest ? scorePromotionRequest(selectedRequest) : 0;

  const saveRequest = async (statusOverride?: PromotionStatus) => {
    if (!selectedRequest || !user) return;
    setSaving(true);
    try {
      const nextStatus = statusOverride || form.status;
      const now = new Date().toISOString();
      const payload = {
        status: nextStatus,
        discount_type: form.discount_type || null,
        discount_value: Number(form.discount_value) || 0,
        min_order_amount: Number(form.min_order_amount) || 0,
        max_discount_amount: Number(form.max_discount_amount) || 0,
        budget_amount: Number(form.budget_amount) || 0,
        start_at: isoOrNull(form.start_at) || (nextStatus === "active" ? now : null),
        end_at: nextStatus === "ended" ? now : isoOrNull(form.end_at),
        admin_note: form.admin_note.trim() || null,
        rejection_reason: nextStatus === "rejected" ? form.rejection_reason.trim() || "Rejected by admin" : null,
        approved_by: ["approved", "active"].includes(nextStatus) ? user.id : selectedRequest.approved_by,
        approved_at: ["approved", "active"].includes(nextStatus) ? selectedRequest.approved_at || now : selectedRequest.approved_at,
        rejected_at: nextStatus === "rejected" ? now : null,
      };

      const { error } = await supabase
        .from("promotion_requests")
        .update(payload)
        .eq("id", selectedRequest.id);

      if (error) throw error;
      await loadRequests();
      toast({ title: "Promotion request updated", description: `${selectedRequest.title} is now ${nextStatus}.` });
    } catch (error) {
      toast({
        title: "Promotion update failed",
        description: getErrorMessage(error, "Could not update this request."),
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <RoleGuard allowedRoles={["admin"]}>
      <AdminLayout>
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold">Promotion Approvals</h1>
              <p className="text-muted-foreground">
                Review seller vouchers, free shipping, bundle deals, coin discounts, programs, campaigns and DrzFlash separately from ads.
              </p>
            </div>
            <Button variant="outline" onClick={loadRequests}>Refresh</Button>
          </div>

          <div className="grid gap-4 md:grid-cols-6">
            <Card><CardContent className="p-5"><p className="text-sm text-muted-foreground">Pending</p><p className="mt-2 text-2xl font-bold">{stats.pending}</p></CardContent></Card>
            <Card><CardContent className="p-5"><p className="text-sm text-muted-foreground">Approved/Active</p><p className="mt-2 text-2xl font-bold">{stats.approved}</p></CardContent></Card>
            <Card><CardContent className="p-5"><p className="text-sm text-muted-foreground">Live Now</p><p className="mt-2 text-2xl font-bold">{stats.active}</p></CardContent></Card>
            <Card><CardContent className="p-5"><p className="text-sm text-muted-foreground">Rejected</p><p className="mt-2 text-2xl font-bold">{stats.rejected}</p></CardContent></Card>
            <Card><CardContent className="p-5"><p className="text-sm text-muted-foreground">Budget</p><p className="mt-2 text-2xl font-bold">{formatPrice(stats.budget)}</p></CardContent></Card>
            <Card><CardContent className="p-5"><p className="text-sm text-muted-foreground">Avg Score</p><p className="mt-2 text-2xl font-bold">{averageScore}%</p></CardContent></Card>
          </div>

          <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BadgePercent className="h-5 w-5 text-accent" />
                  Seller Requests
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="mb-4 grid gap-3 md:grid-cols-3">
                  <div className="relative md:col-span-3">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      value={searchQuery}
                      onChange={(event) => setSearchQuery(event.target.value)}
                      placeholder="Search request, seller, product..."
                      className="pl-10"
                    />
                  </div>
                  <Select value={typeFilter} onValueChange={(value) => setTypeFilter(value as PromotionFilter)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {filterOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as PromotionStatus | "all")}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="approved">Approved</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                      <SelectItem value="ended">Ended</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button variant="outline" onClick={() => { setTypeFilter("all"); setStatusFilter("all"); setSearchQuery(""); }}>
                    Clear
                  </Button>
                </div>

                {loading ? (
                  <p className="py-16 text-center text-muted-foreground">Loading promotion requests...</p>
                ) : filteredRequests.length === 0 ? (
                  <p className="rounded-md border border-dashed py-16 text-center text-muted-foreground">
                    No promotion requests yet.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {filteredRequests.map((request) => (
                      <button
                        key={request.id}
                        type="button"
                        onClick={() => setSelectedId(request.id)}
                        className={`w-full rounded-md border p-4 text-left transition hover:border-accent hover:bg-muted/50 ${
                          selectedId === request.id ? "border-accent bg-accent/10" : ""
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-semibold">{request.title}</p>
                            <p className="mt-1 text-sm text-muted-foreground">
                              {request.seller?.business_name || "Seller"} - {request.product?.title || "Store request"}
                            </p>
                          </div>
                          <Badge className={statusBadge(request.status)}>{request.status || "pending"}</Badge>
                        </div>
                        <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted-foreground">
                          <span>{requestLabel(request.request_type)}</span>
                          <span>{formatPrice(request.budget_amount || 0)} budget</span>
                          <span>{request.created_at ? new Date(request.created_at).toLocaleDateString() : "No date"}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-accent" />
                  Approval Details
                </CardTitle>
              </CardHeader>
              <CardContent>
                {!selectedRequest ? (
                  <p className="py-16 text-center text-muted-foreground">Select a request to review.</p>
                ) : (
                  <div className="space-y-6">
                    <div className="rounded-md border bg-muted/40 p-4">
                      <div className="flex flex-wrap items-center gap-2">
                        {selectedRequest.request_type.includes("voucher") && <Tag className="h-4 w-4 text-accent" />}
                        {selectedRequest.request_type.includes("shipping") && <Gift className="h-4 w-4 text-accent" />}
                        {selectedRequest.request_type.includes("flash") && <Zap className="h-4 w-4 text-accent" />}
                        <Badge variant="outline">{requestLabel(selectedRequest.request_type)}</Badge>
                        <Badge className={statusBadge(selectedRequest.status)}>{selectedRequest.status || "pending"}</Badge>
                      </div>
                      <h2 className="mt-3 text-xl font-semibold">{selectedRequest.title}</h2>
                      <p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">
                        {selectedRequest.details || "No seller details provided."}
                      </p>
                    </div>

                    <div className="grid gap-3 md:grid-cols-3">
                      <div className="rounded-md border p-4">
                        <p className="text-sm text-muted-foreground">Approval Score</p>
                        <p className="mt-2 text-2xl font-bold">{selectedScore}%</p>
                        <div className="mt-3 h-2 rounded-full bg-muted">
                          <div
                            className="h-2 rounded-full bg-accent"
                            style={{ width: `${selectedScore}%` }}
                          />
                        </div>
                        <Badge className="mt-3" variant="outline">{scoreTone(selectedScore)}</Badge>
                      </div>
                      <div className="rounded-md border p-4">
                        <p className="text-sm text-muted-foreground">Seller Health</p>
                        <p className="mt-2 font-semibold">{selectedRequest.seller?.business_name || "Seller"}</p>
                        <Badge className="mt-3" variant="outline">
                          {selectedRequest.seller?.account_health_status || selectedRequest.seller?.status || "unknown"}
                        </Badge>
                      </div>
                      <div className="rounded-md border p-4">
                        <p className="text-sm text-muted-foreground">Product Readiness</p>
                        <p className="mt-2 font-semibold">{selectedRequest.product?.title || "Storewide"}</p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          Stock {selectedRequest.product?.stock_quantity ?? "all"} - {selectedRequest.product?.status || "store"}
                        </p>
                      </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <Label>Status</Label>
                        <Select value={form.status} onValueChange={(value) => setForm((current) => ({ ...current, status: value as PromotionStatus }))}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="approved">Approved</SelectItem>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="rejected">Rejected</SelectItem>
                            <SelectItem value="ended">Ended</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Discount Type</Label>
                        <Select value={form.discount_type} onValueChange={(value) => setForm((current) => ({ ...current, discount_type: value }))}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="percentage">Percentage</SelectItem>
                            <SelectItem value="fixed">Fixed</SelectItem>
                            <SelectItem value="free_shipping">Free Shipping</SelectItem>
                            <SelectItem value="program">Program</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Discount Value</Label>
                        <Input value={form.discount_value} onChange={(event) => setForm((current) => ({ ...current, discount_value: event.target.value }))} />
                      </div>
                      <div>
                        <Label>Min Order</Label>
                        <Input value={form.min_order_amount} onChange={(event) => setForm((current) => ({ ...current, min_order_amount: event.target.value }))} />
                      </div>
                      <div>
                        <Label>Max Discount</Label>
                        <Input value={form.max_discount_amount} onChange={(event) => setForm((current) => ({ ...current, max_discount_amount: event.target.value }))} />
                      </div>
                      <div>
                        <Label>Budget</Label>
                        <Input value={form.budget_amount} onChange={(event) => setForm((current) => ({ ...current, budget_amount: event.target.value }))} />
                      </div>
                      <div>
                        <Label>Start</Label>
                        <Input type="datetime-local" value={form.start_at} onChange={(event) => setForm((current) => ({ ...current, start_at: event.target.value }))} />
                      </div>
                      <div>
                        <Label>End</Label>
                        <Input type="datetime-local" value={form.end_at} onChange={(event) => setForm((current) => ({ ...current, end_at: event.target.value }))} />
                      </div>
                    </div>

                    <div>
                      <Label>Admin Note</Label>
                      <Textarea value={form.admin_note} onChange={(event) => setForm((current) => ({ ...current, admin_note: event.target.value }))} rows={3} />
                    </div>
                    <div>
                      <Label>Rejection Reason</Label>
                      <Textarea value={form.rejection_reason} onChange={(event) => setForm((current) => ({ ...current, rejection_reason: event.target.value }))} rows={3} />
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <Button onClick={() => saveRequest()} disabled={saving}>Save Controls</Button>
                      <Button onClick={() => saveRequest("approved")} disabled={saving} variant="outline">
                        <CheckCircle2 className="mr-2 h-4 w-4" />
                        Approve
                      </Button>
                      <Button onClick={() => saveRequest("active")} disabled={saving} variant="outline">
                        Activate
                      </Button>
                      <Button onClick={() => saveRequest("ended")} disabled={saving} variant="outline">
                        End / Stop
                      </Button>
                      <Button onClick={() => saveRequest("rejected")} disabled={saving} variant="destructive">
                        <XCircle className="mr-2 h-4 w-4" />
                        Reject
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </AdminLayout>
    </RoleGuard>
  );
}
