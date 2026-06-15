"use client";

import Link from "next/link";
import { useRouter } from "next/router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { BarChart3, CreditCard, Megaphone, MousePointerClick, Send, Settings, Target, Wallet } from "lucide-react";
import { RoleGuard } from "@/components/RoleGuard";
import { SellerLayout } from "@/components/SellerLayout";
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

interface ProductRow {
  id: string;
  title: string;
  price: number;
  views_count: number | null;
  sales_count: number | null;
  status: string | null;
}

interface MarketingCampaign {
  id: string;
  name: string;
  campaign_type: string;
  status: string | null;
  product_id: string | null;
  daily_budget: number | null;
  total_budget: number | null;
  bid_amount: number | null;
  spent_amount: number | null;
  impressions: number | null;
  clicks: number | null;
  conversions: number | null;
  revenue: number | null;
  rejection_reason: string | null;
  admin_note: string | null;
  created_at: string | null;
  product?: { title: string } | null;
}

function normalizeTool(value: unknown) {
  const tool = String(value || "overview");
  if (["overview", "product-ads", "ad-performance", "account-settings"].includes(tool)) return tool;
  if (tool === "sponsored-products") return "overview";
  if (tool === "reports") return "ad-performance";
  if (tool === "budget") return "account-settings";
  return "overview";
}

function isAdCampaignType(value: string) {
  return ["product_ads", "sponsored_products", "wallet_topup"].includes(value);
}

export default function SellerMarketingSolutionsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuthContext();
  const { formatPrice } = useMarketplaceSettings();
  const { toast } = useToast();
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [sellerId, setSellerId] = useState("");
  const [campaigns, setCampaigns] = useState<MarketingCampaign[]>([]);
  const [availableBalance, setAvailableBalance] = useState(0);
  const [budget, setBudget] = useState("");
  const [campaignName, setCampaignName] = useState("");
  const [dailyBudget, setDailyBudget] = useState("500");
  const [totalBudget, setTotalBudget] = useState("5000");
  const [bidAmount, setBidAmount] = useState("15");
  const [targetKeywords, setTargetKeywords] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const tool = normalizeTool(router.query.tool);

  const loadData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data: seller } = await supabase
      .from("seller_profiles")
      .select("id, available_balance")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!seller) {
      setProducts([]);
      setSellerId("");
      setCampaigns([]);
      setAvailableBalance(0);
      setLoading(false);
      return;
    }

    setSellerId(String(seller.id));
    setAvailableBalance(Number(seller.available_balance ?? 0));
    const [{ data }, campaignResult] = await Promise.all([
      supabase
        .from("products")
        .select("id, title, price, views_count, sales_count, status")
        .eq("seller_id", seller.id)
        .order("views_count", { ascending: false })
        .limit(25),
      supabase
        .from("marketing_campaigns")
        .select("*, product:products!product_id(title)")
        .eq("seller_id", seller.id)
        .order("created_at", { ascending: false })
        .limit(30),
    ]);
    setProducts((data ?? []) as ProductRow[]);
    setCampaigns(((campaignResult.data ?? []) as unknown as MarketingCampaign[]).filter((campaign) =>
      isAdCampaignType(campaign.campaign_type)
    ));
    setLoading(false);
  }, [user]);

  useEffect(() => {
    if (!authLoading && user) loadData();
  }, [authLoading, loadData, user]);

  const adReadyProducts = useMemo(
    () => products.filter((product) => product.status === "approved"),
    [products]
  );

  const totalViews = products.reduce((sum, product) => sum + Number(product.views_count ?? 0), 0);

  const submitAdRequest = async (kind: string, product?: ProductRow) => {
    const isWalletTopUp = kind.toLowerCase().includes("top up");
    const nextDailyBudget = isWalletTopUp ? Number(budget) || 0 : Number(dailyBudget);
    const nextTotalBudget = isWalletTopUp ? Number(budget) || 0 : Number(totalBudget);
    const nextBidAmount = isWalletTopUp ? 0 : Number(bidAmount);

    if (isWalletTopUp) {
      if (!Number.isFinite(nextTotalBudget) || nextTotalBudget <= 0) {
        toast({ title: "Top-up amount required", description: "Enter a top-up amount greater than zero.", variant: "destructive" });
        return;
      }
    } else {
      if (!Number.isFinite(nextDailyBudget) || nextDailyBudget <= 0) {
        toast({ title: "Daily budget required", description: "Enter a daily budget greater than zero.", variant: "destructive" });
        return;
      }
      if (!Number.isFinite(nextTotalBudget) || nextTotalBudget < nextDailyBudget) {
        toast({ title: "Total budget required", description: "Total budget must be greater than or equal to daily budget.", variant: "destructive" });
        return;
      }
      if (!Number.isFinite(nextBidAmount) || nextBidAmount <= 0) {
        toast({ title: "Bid required", description: "Enter a CPC bid greater than zero.", variant: "destructive" });
        return;
      }
    }

    setSubmitting(true);
    try {
      const { error } = await supabase.from("marketing_campaigns").insert({
        seller_id: sellerId,
        product_id: product?.id || null,
        campaign_type: product ? "product_ads" : isWalletTopUp ? "wallet_topup" : "sponsored_products",
        name: campaignName || (product ? `Product Ads - ${product.title}` : kind),
        objective: product ? "sales" : "traffic",
        placement: product ? "search_results" : "seller_marketing",
        daily_budget: nextDailyBudget,
        total_budget: nextTotalBudget,
        bid_amount: nextBidAmount,
        target_keywords: targetKeywords.trim() || (product ? product.title : campaignName || kind),
        start_at: new Date().toISOString(),
      });
      if (error) throw error;
      setBudget("");
      setCampaignName("");
      if (!isWalletTopUp) {
        setTargetKeywords("");
      }
      await loadData();
      toast({ title: "Ads request sent", description: "Admin can review and approve it from Marketing Control." });
    } catch (error) {
      toast({ title: "Request failed", description: getErrorMessage(error, "Could not submit ads request."), variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const nav = [
    { value: "overview", label: "Overview", icon: Target },
    { value: "product-ads", label: "Product Ads", icon: Megaphone },
    { value: "ad-performance", label: "Ad Performance", icon: BarChart3 },
    { value: "account-settings", label: "Account Settings", icon: Settings },
  ];

  return (
    <RoleGuard allowedRoles={["seller"]}>
      <SellerLayout>
        <div className="space-y-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <Badge className="mb-3 bg-accent text-accent-foreground">Marketing Solutions</Badge>
              <h1 className="text-3xl font-bold">Sponsored Products & Discovery</h1>
              <p className="mt-2 max-w-3xl text-muted-foreground">
                Promote products, manage product ads and track ad performance like a seller center campaign workspace.
              </p>
            </div>
            <Button onClick={() => router.push("/seller/marketing-solutions?tool=product-ads")} disabled={submitting}>
              <Send className="mr-2 h-4 w-4" />
              Create
            </Button>
          </div>

          <div className="space-y-3">
            <p className="text-sm font-semibold">Available Options</p>
            <div className="grid gap-2 md:grid-cols-4">
            {nav.map((item) => {
              const Icon = item.icon;
              const active = tool === item.value;
              return (
                <Button key={item.value} variant={active ? "default" : "outline"} asChild className="justify-start">
                  <Link href={`/seller/marketing-solutions?tool=${item.value}`}>
                    <Icon className="mr-2 h-4 w-4" />
                    {item.label}
                  </Link>
                </Button>
              );
            })}
            </div>
          </div>

          {loading ? (
            <p className="py-16 text-center text-muted-foreground">Loading marketing solutions...</p>
          ) : (
            <>
              <div className="grid gap-4 md:grid-cols-4">
                <Card><CardContent className="p-5"><p className="text-sm text-muted-foreground">Ad-ready Products</p><p className="mt-2 text-2xl font-bold">{adReadyProducts.length}</p></CardContent></Card>
                <Card><CardContent className="p-5"><p className="text-sm text-muted-foreground">Account Balance</p><p className="mt-2 text-2xl font-bold">{formatPrice(availableBalance)}</p></CardContent></Card>
                <Card><CardContent className="p-5"><p className="text-sm text-muted-foreground">Clicks/Views</p><p className="mt-2 text-2xl font-bold">{totalViews.toLocaleString()}</p></CardContent></Card>
                <Card><CardContent className="p-5"><p className="text-sm text-muted-foreground">Campaign Requests</p><p className="mt-2 text-2xl font-bold">{campaigns.length}</p></CardContent></Card>
              </div>

              {tool === "overview" && (
                <div className="grid gap-6 lg:grid-cols-[1fr_0.75fr]">
                  <Card>
                    <CardHeader><CardTitle>What is Sponsored Products?</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                      <p className="text-muted-foreground">
                        Show products to relevant shoppers. Seller submits ad campaign and admin controls activation/top-up.
                      </p>
                      <div className="grid gap-3 md:grid-cols-3">
                        {["Drive traffic & sales", "Quick setup", "Auto campaign request"].map((item) => (
                          <div key={item} className="rounded-md border p-4 font-medium">{item}</div>
                        ))}
                      </div>
                      <Button onClick={() => router.push("/seller/marketing-solutions?tool=product-ads")} disabled={submitting}>
                        Create Product Ad
                      </Button>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader><CardTitle className="flex items-center gap-2"><Wallet className="h-5 w-5 text-accent" /> Account Balance</CardTitle></CardHeader>
                    <CardContent>
                      <p className="text-3xl font-bold">{formatPrice(availableBalance)}</p>
                      <p className="mt-2 text-sm text-muted-foreground">Top-up and sponsored campaign activation are reviewed by admin.</p>
                      <Button variant="outline" className="mt-5" asChild>
                        <Link href="/seller/marketing-solutions?tool=account-settings">Top Up</Link>
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              )}

              {tool === "product-ads" && (
                <Card>
                  <CardHeader><CardTitle>Product Ads</CardTitle></CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid gap-4 rounded-md border bg-muted/30 p-4 md:grid-cols-2 lg:grid-cols-5">
                      <div className="lg:col-span-2">
                        <Label htmlFor="product_ad_name">Campaign Name</Label>
                        <Input
                          id="product_ad_name"
                          value={campaignName}
                          onChange={(event) => setCampaignName(event.target.value)}
                          placeholder="Ramzan product boost"
                        />
                      </div>
                      <div>
                        <Label htmlFor="daily_budget">Daily Budget</Label>
                        <Input
                          id="daily_budget"
                          type="number"
                          min="1"
                          value={dailyBudget}
                          onChange={(event) => setDailyBudget(event.target.value)}
                          placeholder="PKR"
                        />
                      </div>
                      <div>
                        <Label htmlFor="total_budget">Total Budget</Label>
                        <Input
                          id="total_budget"
                          type="number"
                          min="1"
                          value={totalBudget}
                          onChange={(event) => setTotalBudget(event.target.value)}
                          placeholder="PKR"
                        />
                      </div>
                      <div>
                        <Label htmlFor="bid_amount">CPC Bid</Label>
                        <Input
                          id="bid_amount"
                          type="number"
                          min="1"
                          value={bidAmount}
                          onChange={(event) => setBidAmount(event.target.value)}
                          placeholder="PKR"
                        />
                      </div>
                      <div className="lg:col-span-5">
                        <Label htmlFor="target_keywords">Target Keywords</Label>
                        <Textarea
                          id="target_keywords"
                          rows={2}
                          value={targetKeywords}
                          onChange={(event) => setTargetKeywords(event.target.value)}
                          placeholder="mobile phone, wireless headphones, summer fashion"
                        />
                        <p className="mt-2 text-xs text-muted-foreground">
                          These values are sent to admin with each product ad request for approval and scoring.
                        </p>
                      </div>
                    </div>
                    {adReadyProducts.length ? adReadyProducts.map((product) => (
                      <div key={product.id} className="flex flex-wrap items-center justify-between gap-3 rounded-md border p-4">
                        <div>
                          <p className="font-semibold">{product.title}</p>
                          <p className="text-sm text-muted-foreground">
                            {formatPrice(product.price)} - {product.views_count ?? 0} views - Bid {formatPrice(Number(bidAmount) || 0)}
                          </p>
                        </div>
                        <Button size="sm" onClick={() => submitAdRequest(`Product Ads - ${product.title}`, product)} disabled={submitting}>
                          Promote
                        </Button>
                      </div>
                    )) : (
                      <div className="rounded-md border border-dashed p-8 text-center">
                        <p className="font-semibold">No approved products ready for ads.</p>
                        <Button asChild className="mt-4"><Link href="/seller/products/new">Add Product</Link></Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {tool === "ad-performance" && (
                <Card>
                  <CardHeader><CardTitle className="flex items-center gap-2"><MousePointerClick className="h-5 w-5 text-accent" /> Ad Performance</CardTitle></CardHeader>
                  <CardContent className="space-y-3">
                    {campaigns.map((campaign) => {
                      const impressions = Number(campaign.impressions ?? 0);
                      const clicks = Number(campaign.clicks ?? 0);
                      const conversions = Number(campaign.conversions ?? 0);
                      return (
                        <div key={campaign.id} className="grid gap-3 rounded-md border p-4 md:grid-cols-[1fr_100px_100px_100px_100px]">
                          <div>
                            <p className="font-medium">{campaign.name}</p>
                            <p className="text-xs text-muted-foreground">{campaign.product?.title || "Account campaign"} - {campaign.status || "pending"}</p>
                          </div>
                          <p className="text-sm text-muted-foreground">{impressions} impressions</p>
                          <p className="text-sm text-muted-foreground">{clicks} clicks</p>
                          <p className="text-sm text-muted-foreground">{conversions} sales</p>
                          <p className="font-mono text-sm">{impressions ? ((clicks / impressions) * 100).toFixed(1) : "0.0"}%</p>
                        </div>
                      );
                    })}
                    {campaigns.length === 0 && <p className="py-8 text-center text-muted-foreground">No ad campaign data yet.</p>}
                  </CardContent>
                </Card>
              )}

              {tool === "account-settings" && (
                <Card>
                  <CardHeader><CardTitle className="flex items-center gap-2"><CreditCard className="h-5 w-5 text-accent" /> Account Settings</CardTitle></CardHeader>
                  <CardContent className="grid gap-4 md:grid-cols-2">
                    <div>
                      <Label htmlFor="campaign_name">Campaign Name</Label>
                      <Input id="campaign_name" value={campaignName} onChange={(event) => setCampaignName(event.target.value)} placeholder="Automated Campaign" />
                    </div>
                    <div>
                      <Label htmlFor="budget">Top-Up Amount</Label>
                      <Input id="budget" value={budget} onChange={(event) => setBudget(event.target.value)} placeholder="PKR amount" />
                    </div>
                    <div className="md:col-span-2">
                      <Label htmlFor="notes">Account Notes</Label>
                      <Textarea id="notes" rows={4} value={`Store Earnings: ${formatPrice(availableBalance)}\nFinal payment includes platform tax if configured.`} readOnly />
                    </div>
                    <div className="md:col-span-2">
                      <Button onClick={() => submitAdRequest("Top Up Credit")} disabled={submitting}>
                        Top Up
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </div>
      </SellerLayout>
    </RoleGuard>
  );
}
