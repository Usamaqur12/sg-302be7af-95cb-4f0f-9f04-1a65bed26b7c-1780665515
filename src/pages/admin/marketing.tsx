"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  BadgeDollarSign,
  BarChart3,
  Ban,
  CheckCircle2,
  MousePointerClick,
  PauseCircle,
  PlayCircle,
  Search,
  ShieldCheck,
  XCircle,
} from "lucide-react";
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
import { campaignCpc, campaignCtr, campaignRoas, type MarketingCampaignStatus } from "@/lib/marketing";
import { getErrorMessage } from "@/lib/errors";
import { supabase } from "@/integrations/supabase/client";

interface MarketingCampaign {
  id: string;
  seller_id: string;
  product_id: string | null;
  campaign_type: string;
  name: string;
  objective: string;
  placement: string;
  status: MarketingCampaignStatus;
  daily_budget: number | null;
  total_budget: number | null;
  bid_amount: number | null;
  spent_amount: number | null;
  impressions: number | null;
  clicks: number | null;
  conversions: number | null;
  revenue: number | null;
  target_keywords: string | null;
  admin_score: number | null;
  quality_score: number | null;
  seller_health_score: number | null;
  start_at: string | null;
  end_at: string | null;
  approved_by: string | null;
  approved_at: string | null;
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
    rating: number | null;
    total_reviews: number | null;
  } | null;
}

interface CampaignForm {
  status: MarketingCampaignStatus;
  daily_budget: string;
  total_budget: string;
  bid_amount: string;
  admin_score: string;
  quality_score: string;
  seller_health_score: string;
  start_at: string;
  end_at: string;
  admin_note: string;
  rejection_reason: string;
}

const statusOptions: MarketingCampaignStatus[] = ["pending", "approved", "active", "paused", "rejected", "ended"];

function inputDateTime(value: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 16);
}

function isoOrNull(value: string) {
  return value ? new Date(value).toISOString() : null;
}

function statusBadge(status: MarketingCampaignStatus) {
  if (status === "active") return "bg-green-500/10 text-green-700";
  if (status === "approved") return "bg-blue-500/10 text-blue-700";
  if (status === "pending") return "bg-amber-500/10 text-amber-700";
  if (status === "rejected") return "bg-destructive/10 text-destructive";
  return "bg-muted text-muted-foreground";
}

function isAdCampaignType(value: string) {
  return ["product_ads", "sponsored_products", "wallet_topup"].includes(value);
}

export default function AdminMarketingPage() {
  const { user, loading: authLoading } = useAuthContext();
  const { formatPrice } = useMarketplaceSettings();
  const { toast } = useToast();
  const [campaigns, setCampaigns] = useState<MarketingCampaign[]>([]);
  const [selectedCampaignId, setSelectedCampaignId] = useState("");
  const [statusFilter, setStatusFilter] = useState<MarketingCampaignStatus | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<CampaignForm>({
    status: "pending",
    daily_budget: "0",
    total_budget: "0",
    bid_amount: "0",
    admin_score: "50",
    quality_score: "50",
    seller_health_score: "50",
    start_at: "",
    end_at: "",
    admin_note: "",
    rejection_reason: "",
  });

  const loadCampaigns = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("marketing_campaigns")
      .select(`
        *,
        seller:seller_profiles!seller_id(business_name, status, account_health_status),
        product:products!product_id(title, status, stock_quantity, rating, total_reviews)
      `)
      .order("created_at", { ascending: false });

    if (error) {
      toast({ title: "Marketing unavailable", description: error.message, variant: "destructive" });
      setLoading(false);
      return;
    }

    const nextCampaigns = ((data ?? []) as unknown as MarketingCampaign[]).filter((campaign) =>
      isAdCampaignType(campaign.campaign_type)
    );
    setCampaigns(nextCampaigns);
    setSelectedCampaignId((current) => current || nextCampaigns[0]?.id || "");
    setLoading(false);
  }, [toast]);

  useEffect(() => {
    if (!authLoading && user) loadCampaigns();
  }, [authLoading, loadCampaigns, user]);

  const selectedCampaign = useMemo(
    () => campaigns.find((campaign) => campaign.id === selectedCampaignId) ?? null,
    [campaigns, selectedCampaignId]
  );

  useEffect(() => {
    if (!selectedCampaign) return;
    setForm({
      status: selectedCampaign.status,
      daily_budget: String(selectedCampaign.daily_budget ?? 0),
      total_budget: String(selectedCampaign.total_budget ?? 0),
      bid_amount: String(selectedCampaign.bid_amount ?? 0),
      admin_score: String(selectedCampaign.admin_score ?? 50),
      quality_score: String(selectedCampaign.quality_score ?? 50),
      seller_health_score: String(selectedCampaign.seller_health_score ?? 50),
      start_at: inputDateTime(selectedCampaign.start_at),
      end_at: inputDateTime(selectedCampaign.end_at),
      admin_note: selectedCampaign.admin_note || "",
      rejection_reason: selectedCampaign.rejection_reason || "",
    });
  }, [selectedCampaign]);

  const filteredCampaigns = campaigns.filter((campaign) => {
    const search = searchQuery.toLowerCase();
    const haystack = [
      campaign.name,
      campaign.seller?.business_name,
      campaign.product?.title,
      campaign.campaign_type,
      campaign.target_keywords,
    ].join(" ").toLowerCase();
    return (statusFilter === "all" || campaign.status === statusFilter) && (!search || haystack.includes(search));
  });

  const totals = campaigns.reduce(
    (sum, campaign) => ({
      spend: sum.spend + Number(campaign.spent_amount || 0),
      impressions: sum.impressions + Number(campaign.impressions || 0),
      clicks: sum.clicks + Number(campaign.clicks || 0),
      revenue: sum.revenue + Number(campaign.revenue || 0),
    }),
    { spend: 0, impressions: 0, clicks: 0, revenue: 0 }
  );

  const saveCampaign = async (statusOverride?: MarketingCampaignStatus) => {
    if (!selectedCampaign || !user) return;
    setSaving(true);
    try {
      const nextStatus = statusOverride || form.status;
      const now = new Date().toISOString();
      const payload = {
        status: nextStatus,
        daily_budget: Number(form.daily_budget) || 0,
        total_budget: Number(form.total_budget) || 0,
        bid_amount: Number(form.bid_amount) || 0,
        admin_score: Number(form.admin_score) || 50,
        quality_score: Number(form.quality_score) || 50,
        seller_health_score: Number(form.seller_health_score) || 50,
        start_at: isoOrNull(form.start_at) || (nextStatus === "active" ? now : null),
        end_at: nextStatus === "ended" ? now : isoOrNull(form.end_at),
        admin_note: form.admin_note.trim() || null,
        rejection_reason: nextStatus === "rejected" ? form.rejection_reason.trim() || "Rejected by admin" : null,
        approved_by: ["approved", "active"].includes(nextStatus) ? user.id : selectedCampaign.approved_by,
        approved_at: ["approved", "active"].includes(nextStatus) ? selectedCampaign.approved_at || now : selectedCampaign.approved_at,
        rejected_at: nextStatus === "rejected" ? now : null,
      };

      const { error } = await supabase
        .from("marketing_campaigns")
        .update(payload)
        .eq("id", selectedCampaign.id);

      if (error) throw error;
      await loadCampaigns();
      toast({ title: "Campaign updated", description: `${selectedCampaign.name} is now ${nextStatus}.` });
    } catch (error) {
      toast({
        title: "Campaign update failed",
        description: getErrorMessage(error, "Could not update campaign."),
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
              <h1 className="text-3xl font-bold">Marketing Control</h1>
              <p className="text-muted-foreground">
                Approve seller ads, control budgets, scoring and sponsored product visibility.
              </p>
            </div>
            <Button variant="outline" onClick={loadCampaigns}>Refresh</Button>
          </div>

          <div className="grid gap-4 md:grid-cols-4">
            <Card><CardContent className="p-5"><p className="text-sm text-muted-foreground">Campaigns</p><p className="mt-2 text-2xl font-bold">{campaigns.length}</p></CardContent></Card>
            <Card><CardContent className="p-5"><p className="text-sm text-muted-foreground">Ad Spend</p><p className="mt-2 text-2xl font-bold">{formatPrice(totals.spend)}</p></CardContent></Card>
            <Card><CardContent className="p-5"><p className="text-sm text-muted-foreground">CTR</p><p className="mt-2 text-2xl font-bold">{campaignCtr(totals.clicks, totals.impressions).toFixed(1)}%</p></CardContent></Card>
            <Card><CardContent className="p-5"><p className="text-sm text-muted-foreground">ROAS</p><p className="mt-2 text-2xl font-bold">{campaignRoas(totals.revenue, totals.spend).toFixed(2)}x</p></CardContent></Card>
          </div>

          <Card>
            <CardContent className="grid gap-3 p-4 md:grid-cols-[1fr_220px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Search campaign, seller, product or keyword..."
                  className="pl-9"
                />
              </div>
              <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as MarketingCampaignStatus | "all")}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All status</SelectItem>
                  {statusOptions.map((status) => (
                    <SelectItem key={status} value={status}>{status}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {loading ? (
            <p className="py-16 text-center text-muted-foreground">Loading marketing campaigns...</p>
          ) : (
            <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
              <Card>
                <CardHeader><CardTitle>Seller Campaigns ({filteredCampaigns.length})</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  {filteredCampaigns.map((campaign) => (
                    <button
                      key={campaign.id}
                      type="button"
                      onClick={() => setSelectedCampaignId(campaign.id)}
                      className={`w-full rounded-md border p-4 text-left transition hover:border-accent hover:bg-muted/50 ${
                        selectedCampaignId === campaign.id ? "border-accent bg-accent/10" : ""
                      }`}
                    >
                      <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="font-semibold">{campaign.name}</p>
                          <p className="mt-1 text-sm text-muted-foreground">
                            {campaign.seller?.business_name || "Seller"} - {campaign.product?.title || "Account campaign"}
                          </p>
                        </div>
                        <Badge className={statusBadge(campaign.status)}>{campaign.status}</Badge>
                      </div>
                      <div className="grid gap-2 text-xs text-muted-foreground sm:grid-cols-4">
                        <span>Bid {formatPrice(campaign.bid_amount || 0)}</span>
                        <span>Budget {formatPrice(campaign.total_budget || 0)}</span>
                        <span>{Number(campaign.impressions || 0).toLocaleString()} impressions</span>
                        <span>{Number(campaign.clicks || 0).toLocaleString()} clicks</span>
                      </div>
                    </button>
                  ))}
                  {filteredCampaigns.length === 0 && (
                    <p className="rounded-md border border-dashed p-8 text-center text-muted-foreground">
                      No campaign requests yet. Seller requests will appear here.
                    </p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ShieldCheck className="h-5 w-5 text-accent" />
                    Admin Ad Controls
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {!selectedCampaign ? (
                    <p className="py-16 text-center text-muted-foreground">Select a campaign to review.</p>
                  ) : (
                    <div className="space-y-5">
                      <div className="rounded-md bg-muted p-4">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <p className="font-semibold">{selectedCampaign.name}</p>
                            <p className="mt-1 text-sm text-muted-foreground">
                              {selectedCampaign.product?.title || "No product selected"} - {selectedCampaign.placement}
                            </p>
                          </div>
                          <Badge className={statusBadge(selectedCampaign.status)}>{selectedCampaign.status}</Badge>
                        </div>
                        <div className="mt-4 grid gap-3 text-sm sm:grid-cols-3">
                          <div className="rounded-md border bg-background p-3">
                            <MousePointerClick className="mb-2 h-4 w-4 text-accent" />
                            <p className="font-semibold">{campaignCtr(selectedCampaign.clicks, selectedCampaign.impressions).toFixed(1)}% CTR</p>
                          </div>
                          <div className="rounded-md border bg-background p-3">
                            <BadgeDollarSign className="mb-2 h-4 w-4 text-accent" />
                            <p className="font-semibold">{formatPrice(campaignCpc(selectedCampaign.spent_amount, selectedCampaign.clicks))} CPC</p>
                          </div>
                          <div className="rounded-md border bg-background p-3">
                            <BarChart3 className="mb-2 h-4 w-4 text-accent" />
                            <p className="font-semibold">{campaignRoas(selectedCampaign.revenue, selectedCampaign.spent_amount).toFixed(2)}x ROAS</p>
                          </div>
                        </div>
                      </div>

                      <div className="grid gap-4 md:grid-cols-2">
                        <div>
                          <Label>Status</Label>
                          <Select value={form.status} onValueChange={(value) => setForm((current) => ({ ...current, status: value as MarketingCampaignStatus }))}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {statusOptions.map((status) => <SelectItem key={status} value={status}>{status}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label>Bid Amount</Label>
                          <Input type="number" value={form.bid_amount} onChange={(event) => setForm((current) => ({ ...current, bid_amount: event.target.value }))} />
                        </div>
                        <div>
                          <Label>Daily Budget</Label>
                          <Input type="number" value={form.daily_budget} onChange={(event) => setForm((current) => ({ ...current, daily_budget: event.target.value }))} />
                        </div>
                        <div>
                          <Label>Total Budget</Label>
                          <Input type="number" value={form.total_budget} onChange={(event) => setForm((current) => ({ ...current, total_budget: event.target.value }))} />
                        </div>
                        <div>
                          <Label>Admin Score</Label>
                          <Input type="number" min="0" max="100" value={form.admin_score} onChange={(event) => setForm((current) => ({ ...current, admin_score: event.target.value }))} />
                        </div>
                        <div>
                          <Label>Quality Score</Label>
                          <Input type="number" min="0" max="100" value={form.quality_score} onChange={(event) => setForm((current) => ({ ...current, quality_score: event.target.value }))} />
                        </div>
                        <div>
                          <Label>Seller Health Score</Label>
                          <Input type="number" min="0" max="100" value={form.seller_health_score} onChange={(event) => setForm((current) => ({ ...current, seller_health_score: event.target.value }))} />
                        </div>
                        <div>
                          <Label>Start At</Label>
                          <Input type="datetime-local" value={form.start_at} onChange={(event) => setForm((current) => ({ ...current, start_at: event.target.value }))} />
                        </div>
                        <div>
                          <Label>End At</Label>
                          <Input type="datetime-local" value={form.end_at} onChange={(event) => setForm((current) => ({ ...current, end_at: event.target.value }))} />
                        </div>
                        <div className="md:col-span-2">
                          <Label>Admin Note</Label>
                          <Textarea rows={3} value={form.admin_note} onChange={(event) => setForm((current) => ({ ...current, admin_note: event.target.value }))} />
                        </div>
                        <div className="md:col-span-2">
                          <Label>Rejection Reason</Label>
                          <Textarea rows={3} value={form.rejection_reason} onChange={(event) => setForm((current) => ({ ...current, rejection_reason: event.target.value }))} />
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <Button onClick={() => saveCampaign()} disabled={saving}>
                          <CheckCircle2 className="mr-2 h-4 w-4" />
                          Save Controls
                        </Button>
                        <Button variant="secondary" onClick={() => saveCampaign("active")} disabled={saving}>
                          <PlayCircle className="mr-2 h-4 w-4" />
                          Approve & Activate
                        </Button>
                        <Button variant="outline" onClick={() => saveCampaign("paused")} disabled={saving}>
                          <PauseCircle className="mr-2 h-4 w-4" />
                          Pause
                        </Button>
                        <Button variant="outline" onClick={() => saveCampaign("ended")} disabled={saving}>
                          <Ban className="mr-2 h-4 w-4" />
                          Stop / End
                        </Button>
                        <Button variant="destructive" onClick={() => saveCampaign("rejected")} disabled={saving}>
                          <XCircle className="mr-2 h-4 w-4" />
                          Reject
                        </Button>
                      </div>

                      <div className="rounded-md border p-4 text-sm text-muted-foreground">
                        Ad score logic: relevance + bid + remaining budget + product quality + seller health + admin score.
                        Active campaigns with approved products and ready stock can appear in Sponsored Products.
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </AdminLayout>
    </RoleGuard>
  );
}
