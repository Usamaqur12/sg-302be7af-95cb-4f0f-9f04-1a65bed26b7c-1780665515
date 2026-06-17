"use client";

import Link from "next/link";
import { useRouter } from "next/router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Coins,
  Gift,
  History,
  LayoutGrid,
  List,
  Megaphone,
  Send,
  Sparkles,
  Tag,
  Zap,
} from "lucide-react";
import { SellerLayout } from "@/components/SellerLayout";
import { RoleGuard } from "@/components/RoleGuard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useAuthContext } from "@/contexts/AuthContext";
import { useMarketplaceSettings } from "@/contexts/MarketplaceSettingsContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { getErrorMessage } from "@/lib/errors";
import {
  defaultSellerCampaignSlots,
  type SellerCampaignSlotConfig,
} from "@/lib/marketplace-config";
import { cn } from "@/lib/utils";

type MarketingTool = "campaign" | "drzflash" | "promotions" | "coins" | "programs" | "submissions";
type CampaignTab = "campaigns" | "flash" | "submissions";

interface Coupon {
  id: string;
  code: string;
  description: string | null;
  discount_type: string;
  discount_value: number;
  valid_until: string | null;
  is_active: boolean | null;
}

interface SellerProfile {
  id: string;
  business_name: string;
}

interface SellerProduct {
  id: string;
  title: string;
  price: number;
  stock_quantity: number | null;
  status: string | null;
}

interface SupportTicket {
  id: string;
  ticket_number: string | null;
  subject: string;
  status: string | null;
  priority: string | null;
  created_at: string | null;
}

interface PromotionRequest {
  id: string;
  product_id: string | null;
  request_type: string;
  title: string;
  details: string | null;
  status: string | null;
  discount_type: string | null;
  discount_value: number | null;
  min_order_amount: number | null;
  max_discount_amount: number | null;
  budget_amount: number | null;
  start_at: string | null;
  end_at: string | null;
  admin_note: string | null;
  rejection_reason: string | null;
  created_at: string | null;
  product?: { title: string } | null;
}

interface SubmissionHistoryItem {
  id: string;
  title: string;
  type: string;
  status: string | null;
  created_at: string | null;
  meta?: string | null;
}

const toolCopy: Record<MarketingTool, { title: string; description: string; badge: string }> = {
  campaign: {
    title: "Campaign",
    description: "Find marketplace campaign invitations, submit products and track admin approval.",
    badge: "Campaign Center",
  },
  drzflash: {
    title: "DrzFlash",
    description: "Prepare flash sale products with stock, price and discount requests.",
    badge: "Flash Sale",
  },
  promotions: {
    title: "Promotions",
    description: "Request seller vouchers, free shipping and bundle promotions from admin.",
    badge: "Promotion Tools",
  },
  coins: {
    title: "Daraz Coins Discount",
    description: "Create loyalty-style coin discount requests for eligible products.",
    badge: "Coins Discount",
  },
  programs: {
    title: "Daraz Programs",
    description: "Apply for seller programs, growth services and platform benefits.",
    badge: "Programs",
  },
  submissions: {
    title: "Submission History",
    description: "Review campaign, voucher, DrzFlash and program requests submitted to admin.",
    badge: "History",
  },
};

const promotionTools = [
  {
    value: "seller voucher",
    title: "Seller Voucher",
    description: "Discount code controlled from admin after review.",
    icon: Tag,
  },
  {
    value: "free shipping",
    title: "Free Shipping",
    description: "Shipping subsidy request for selected city/order value.",
    icon: Gift,
  },
  {
    value: "bundle deal",
    title: "Bundle Deal",
    description: "Bundle products to raise average order value.",
    icon: Sparkles,
  },
];

function parseSellerCampaignSlots(value: unknown): SellerCampaignSlotConfig[] {
  try {
    const parsed = typeof value === "string" ? JSON.parse(value) : value;
    if (!Array.isArray(parsed)) return defaultSellerCampaignSlots;
    const slots: SellerCampaignSlotConfig[] = parsed
      .map((slot) => ({
        title: String(slot?.title ?? "").trim(),
        window: String(slot?.window ?? "").trim(),
        eligibility: String(slot?.eligibility ?? "").trim(),
        discount: String(slot?.discount ?? "").trim(),
        channel: String(slot?.channel ?? "").trim(),
        type: (slot?.type === "drzflash" ? "drzflash" : "campaign") as SellerCampaignSlotConfig["type"],
        status: slot?.status === "draft" || slot?.status === "ended"
          ? slot.status as SellerCampaignSlotConfig["status"]
          : "active",
      }))
      .filter((slot) => slot.title && slot.window && slot.eligibility && slot.discount && slot.channel);
    return slots.length ? slots : defaultSellerCampaignSlots;
  } catch {
    return defaultSellerCampaignSlots;
  }
}

const programCards = [
  "Fulfillment readiness",
  "Seller growth boost",
  "Priority support",
  "Official store verification",
];

function normalizeTool(value: unknown): MarketingTool {
  const tool = String(value || "campaign").toLowerCase();
  if (tool === "campaigns") return "campaign";
  if (tool === "flash-sale") return "drzflash";
  if (["voucher", "free-shipping", "bundles"].includes(tool)) return "promotions";
  if (["campaign", "drzflash", "promotions", "coins", "programs", "submissions"].includes(tool)) {
    return tool as MarketingTool;
  }
  return "campaign";
}

function statusClass(status?: string | null) {
  if (["approved", "active", "resolved", "closed"].includes(String(status))) return "bg-green-500/10 text-green-700";
  if (["pending", "open"].includes(String(status))) return "bg-amber-500/10 text-amber-700";
  if (status === "rejected") return "bg-destructive/10 text-destructive";
  return "bg-blue-500/10 text-blue-700";
}

function requestTypeLabel(value: string) {
  return value
    .replace(/^drzflash$/, "DrzFlash")
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export default function SellerMarketingPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuthContext();
  const { formatPrice } = useMarketplaceSettings();
  const { toast } = useToast();
  const activeTool = normalizeTool(router.query.tool);
  const [activeTab, setActiveTab] = useState<CampaignTab>("campaigns");
  const [viewMode, setViewMode] = useState<"list" | "calendar">("list");
  const [seller, setSeller] = useState<SellerProfile | null>(null);
  const [products, setProducts] = useState<SellerProduct[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [promotionRequests, setPromotionRequests] = useState<PromotionRequest[]>([]);
  const [sellerCampaignSlots, setSellerCampaignSlots] =
    useState<SellerCampaignSlotConfig[]>(defaultSellerCampaignSlots);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [requestType, setRequestType] = useState("campaign");
  const [requestProductId, setRequestProductId] = useState("storewide");
  const [requestDiscountType, setRequestDiscountType] = useState("percentage");
  const [requestDiscountValue, setRequestDiscountValue] = useState("10");
  const [requestMinOrderAmount, setRequestMinOrderAmount] = useState("0");
  const [requestMaxDiscountAmount, setRequestMaxDiscountAmount] = useState("0");
  const [requestBudgetAmount, setRequestBudgetAmount] = useState("0");
  const [requestStartAt, setRequestStartAt] = useState("");
  const [requestEndAt, setRequestEndAt] = useState("");
  const [requestTitle, setRequestTitle] = useState("");
  const [requestDetails, setRequestDetails] = useState("");

  const eligibleProducts = useMemo(
    () => products.filter((product) => product.status === "approved" && Number(product.stock_quantity ?? 0) > 0),
    [products]
  );

  const loadMarketingData = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    const sellerResult = await supabase
      .from("seller_profiles")
      .select("id, business_name")
      .eq("user_id", user.id)
      .maybeSingle();

    const sellerProfile = (sellerResult.data ?? null) as SellerProfile | null;
    setSeller(sellerProfile);

    const [couponResult, ticketResult, productResult, promotionResult, campaignSettingResult] = await Promise.all([
      supabase
        .from("coupons")
        .select("id, code, description, discount_type, discount_value, valid_until, is_active")
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(20),
      supabase
        .from("support_tickets")
        .select("id, ticket_number, subject, status, priority, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(30),
      sellerProfile
        ? supabase
            .from("products")
            .select("id, title, price, stock_quantity, status")
            .eq("seller_id", sellerProfile.id)
            .order("created_at", { ascending: false })
            .limit(25)
        : Promise.resolve({ data: [], error: null }),
      sellerProfile
        ? supabase
            .from("promotion_requests")
            .select("*, product:products!product_id(title)")
            .eq("seller_id", sellerProfile.id)
            .order("created_at", { ascending: false })
            .limit(50)
        : Promise.resolve({ data: [], error: null }),
      supabase
        .from("system_settings")
        .select("key, value")
        .eq("key", "seller_campaign_slots_json")
        .maybeSingle(),
    ]);

    setCoupons((couponResult.data ?? []) as unknown as Coupon[]);
    setTickets((ticketResult.data ?? []) as unknown as SupportTicket[]);
    setProducts((productResult.data ?? []) as unknown as SellerProduct[]);
    setPromotionRequests((promotionResult.data ?? []) as unknown as PromotionRequest[]);
    setSellerCampaignSlots(parseSellerCampaignSlots(campaignSettingResult.data?.value));
    setLoading(false);
  }, [user]);

  useEffect(() => {
    if (!authLoading && user) {
      loadMarketingData();
    }
  }, [authLoading, loadMarketingData, user]);

  useEffect(() => {
    if (activeTool === "drzflash") setActiveTab("flash");
    else if (activeTool === "submissions") setActiveTab("submissions");
    else setActiveTab("campaigns");
    if (activeTool === "promotions") {
      setRequestType("seller voucher");
      setRequestDiscountType("percentage");
    } else if (activeTool === "coins") {
      setRequestType("coins discount");
      setRequestDiscountType("percentage");
    } else if (activeTool === "programs") {
      setRequestType("seller program");
      setRequestDiscountType("program");
    } else {
      setRequestType(activeTool);
      setRequestDiscountType("percentage");
    }
  }, [activeTool]);

  const submitMarketingRequest = async (kind?: string, title?: string, details?: string) => {
    const finalKind = kind || requestType;
    const finalTitle = title || requestTitle.trim();
    const finalDetails = details || requestDetails.trim();

    if (!finalTitle || finalDetails.length < 20) {
      toast({
        title: "Request details required",
        description: "Add a title and at least 20 characters of details.",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);
    try {
      const normalizedRequestType = finalKind.toLowerCase().replace(/\s+/g, "_");
      const finalDiscountType = normalizedRequestType.includes("free_shipping") ? "free_shipping" : requestDiscountType;
      const promotionPayload = {
        seller_id: seller?.id || "",
        product_id: requestProductId === "storewide" ? null : requestProductId,
        request_type: normalizedRequestType,
        title: finalTitle,
        details: finalDetails,
        discount_type: finalDiscountType,
        discount_value: finalDiscountType === "free_shipping" || finalDiscountType === "program" ? 0 : Number(requestDiscountValue) || 0,
        min_order_amount: Number(requestMinOrderAmount) || 0,
        max_discount_amount: Number(requestMaxDiscountAmount) || 0,
        budget_amount: Number(requestBudgetAmount) || 0,
        start_at: requestStartAt ? new Date(requestStartAt).toISOString() : new Date().toISOString(),
        end_at: requestEndAt ? new Date(requestEndAt).toISOString() : null,
      };

      const { error: promotionError } = await supabase
        .from("promotion_requests")
        .insert(promotionPayload);

      if (promotionError) throw promotionError;
      setRequestTitle("");
      setRequestDetails("");
      setRequestProductId("storewide");
      toast({
        title: "Submission sent",
        description: "Admin can review it from the separate Promotion Approvals section.",
      });
      await loadMarketingData();
    } catch (error) {
      toast({
        title: "Submission failed",
        description: getErrorMessage(error, "Could not submit this marketing request."),
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const openTool = (tool: MarketingTool) => {
    router.push(`/seller/marketing?tool=${tool}`);
  };

  const submitCampaign = (slotTitle: string, kind = "campaign") => {
    submitMarketingRequest(
      kind,
      slotTitle,
      [
        `Seller: ${seller?.business_name || "Seller"}`,
        `Eligible products: ${eligibleProducts.length}`,
        `Requested slot: ${slotTitle}`,
        "Please review products, discount range and campaign eligibility from admin panel.",
      ].join("\n")
    );
  };

  const copy = toolCopy[activeTool];
  const legacyMarketingTickets = tickets.filter((ticket) =>
    ["campaign", "drzflash", "promotion", "voucher", "coins", "program"].some((keyword) =>
      ticket.subject.toLowerCase().includes(keyword)
    )
  );

  const submissionHistory = useMemo<SubmissionHistoryItem[]>(() => {
    const promotionItems = promotionRequests.map((request) => ({
      id: request.id,
      title: request.title,
      type: requestTypeLabel(request.request_type),
      status: request.status || "pending",
      created_at: request.created_at,
      meta: [
        request.product?.title || "Storewide",
        request.discount_type ? `${request.discount_type} ${request.discount_value || 0}` : "",
        request.budget_amount ? `${formatPrice(request.budget_amount)} budget` : "",
        request.admin_note || request.rejection_reason || "",
      ].filter(Boolean).join(" - "),
    }));
    const legacyItems = legacyMarketingTickets.map((ticket) => ({
      id: ticket.id,
      title: ticket.subject,
      type: "Legacy Support Ticket",
      status: ticket.status || "open",
      created_at: ticket.created_at,
      meta: ticket.ticket_number,
    }));
    return [...promotionItems, ...legacyItems].sort((a, b) =>
      String(b.created_at || "").localeCompare(String(a.created_at || ""))
    );
  }, [formatPrice, legacyMarketingTickets, promotionRequests]);

  const activeCampaignSlots = sellerCampaignSlots.filter((slot) => (slot.status || "active") === "active");

  const renderCampaignCards = (flashOnly = false) => {
    const slots = activeCampaignSlots.filter((slot) =>
      flashOnly ? slot.type === "drzflash" : slot.type !== "drzflash"
    );

    if (slots.length === 0) {
      return (
        <div className="rounded-md border border-dashed p-10 text-center">
          <Megaphone className="mx-auto mb-4 h-10 w-10 text-muted-foreground" />
          <p className="font-semibold">No admin campaigns are open right now.</p>
          <p className="mt-2 text-sm text-muted-foreground">
            New marketplace campaign invitations will appear here when admin publishes them.
          </p>
        </div>
      );
    }

    return (
      <div className={cn("grid gap-4", viewMode === "calendar" ? "lg:grid-cols-3" : "lg:grid-cols-1")}>
      {slots.map((slot) => (
        <Card key={slot.title} className={cn(viewMode === "calendar" && "min-h-72")}>
          <CardContent className="p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <Badge variant="outline">{slot.type === "drzflash" ? "Flash Sale" : slot.channel}</Badge>
                <h3 className="mt-3 text-lg font-semibold">{slot.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{slot.window}</p>
              </div>
              <Badge className="bg-green-500/10 text-green-700">{eligibleProducts.length} eligible</Badge>
            </div>
            <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
              <div className="rounded-md bg-muted p-3">
                <p className="text-muted-foreground">Eligibility</p>
                <p className="mt-1 font-medium">{slot.eligibility}</p>
              </div>
              <div className="rounded-md bg-muted p-3">
                <p className="text-muted-foreground">Discount Range</p>
                <p className="mt-1 font-medium">{slot.discount}</p>
              </div>
            </div>
            <div className="mt-5 flex flex-wrap gap-2">
              <Button onClick={() => submitCampaign(slot.title, slot.type === "drzflash" ? "drzflash" : "campaign")} disabled={submitting}>
                <Send className="mr-2 h-4 w-4" />
                {slot.type === "drzflash" ? "Submit Flash Products" : "Join Campaign"}
              </Button>
              <Button asChild variant="outline">
                <Link href="/seller/products">Review Products</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
    );
  };

  const renderSubmissions = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History className="h-5 w-5 text-accent" />
          Submission History
        </CardTitle>
      </CardHeader>
      <CardContent>
        {submissionHistory.length === 0 ? (
          <div className="rounded-md border border-dashed p-10 text-center">
            <ClipboardList className="mx-auto mb-4 h-10 w-10 text-muted-foreground" />
            <p className="font-semibold">Aw, Snap! No campaign submissions yet.</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Join a campaign or submit a promotion request and it will appear here.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {submissionHistory.map((item) => (
              <div key={item.id} className="flex flex-wrap items-center justify-between gap-3 rounded-md border p-4">
                <div>
                  <p className="font-semibold">{item.title}</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {item.type} {item.meta ? `- ${item.meta}` : ""} {item.created_at ? `- ${new Date(item.created_at).toLocaleDateString()}` : ""}
                  </p>
                </div>
                <Badge className={statusClass(item.status)}>{item.status || "pending"}</Badge>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );

  const renderPromotionWorkspace = () => (
    <div className="grid gap-6 lg:grid-cols-[1fr_0.8fr]">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gift className="h-5 w-5 text-accent" />
            Promotion Tools
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          {promotionTools.map((tool) => {
            const Icon = tool.icon;
            return (
              <button
                key={tool.value}
                type="button"
                onClick={() => {
                  setRequestType(tool.value);
                  setRequestDiscountType(tool.value === "free shipping" ? "free_shipping" : "percentage");
                }}
                className={cn(
                  "rounded-md border p-4 text-left transition hover:border-accent hover:bg-muted",
                  requestType === tool.value && "border-accent bg-accent/10"
                )}
              >
                <Icon className="mb-3 h-6 w-6 text-accent" />
                <p className="font-semibold">{tool.title}</p>
                <p className="mt-2 text-sm text-muted-foreground">{tool.description}</p>
              </button>
            );
          })}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Megaphone className="h-5 w-5 text-accent" />
            Submit Promotion
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Request Type</Label>
            <Select
              value={requestType}
              onValueChange={(value) => {
                setRequestType(value);
                if (value === "free shipping") setRequestDiscountType("free_shipping");
                else if (value === "seller program") setRequestDiscountType("program");
                else setRequestDiscountType("percentage");
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="seller voucher">Seller voucher</SelectItem>
                <SelectItem value="free shipping">Free shipping</SelectItem>
                <SelectItem value="bundle deal">Bundle deal</SelectItem>
                <SelectItem value="coins discount">Coins discount</SelectItem>
                <SelectItem value="seller program">Seller program</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Scope</Label>
            <Select value={requestProductId} onValueChange={setRequestProductId}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="storewide">Storewide request</SelectItem>
                {eligibleProducts.map((product) => (
                  <SelectItem key={product.id} value={product.id}>
                    {product.title} - {formatPrice(product.price)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="request_title">Title</Label>
            <Input
              id="request_title"
              value={requestTitle}
              onChange={(event) => setRequestTitle(event.target.value)}
              placeholder="e.g. Eid electronics voucher"
            />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label>Discount Type</Label>
              <Select value={requestDiscountType} onValueChange={setRequestDiscountType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="percentage">Percentage</SelectItem>
                  <SelectItem value="fixed">Fixed amount</SelectItem>
                  <SelectItem value="free_shipping">Free shipping</SelectItem>
                  <SelectItem value="program">Program only</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="request_discount_value">Discount Value</Label>
              <Input
                id="request_discount_value"
                type="number"
                min="0"
                value={requestDiscountValue}
                onChange={(event) => setRequestDiscountValue(event.target.value)}
                disabled={["free_shipping", "program"].includes(requestDiscountType)}
              />
            </div>
            <div>
              <Label htmlFor="request_min_order">Min Order</Label>
              <Input
                id="request_min_order"
                type="number"
                min="0"
                value={requestMinOrderAmount}
                onChange={(event) => setRequestMinOrderAmount(event.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="request_max_discount">Max Discount Cap</Label>
              <Input
                id="request_max_discount"
                type="number"
                min="0"
                value={requestMaxDiscountAmount}
                onChange={(event) => setRequestMaxDiscountAmount(event.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="request_budget">Budget</Label>
              <Input
                id="request_budget"
                type="number"
                min="0"
                value={requestBudgetAmount}
                onChange={(event) => setRequestBudgetAmount(event.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="request_start">Start</Label>
              <Input
                id="request_start"
                type="datetime-local"
                value={requestStartAt}
                onChange={(event) => setRequestStartAt(event.target.value)}
              />
            </div>
            <div className="md:col-span-2">
              <Label htmlFor="request_end">End</Label>
              <Input
                id="request_end"
                type="datetime-local"
                value={requestEndAt}
                onChange={(event) => setRequestEndAt(event.target.value)}
              />
            </div>
          </div>
          <div>
            <Label htmlFor="request_details">Details</Label>
            <Textarea
              id="request_details"
              value={requestDetails}
              onChange={(event) => setRequestDetails(event.target.value)}
              rows={6}
              placeholder="Describe products, discount, dates, stock, budget and expected goal."
            />
          </div>
          <Button onClick={() => submitMarketingRequest()} disabled={submitting}>
            <Send className="mr-2 h-4 w-4" />
            {submitting ? "Submitting..." : "Submit Request"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <RoleGuard allowedRoles={["seller"]}>
      <SellerLayout>
        <div className="space-y-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <Badge className="mb-3 bg-accent text-accent-foreground">{copy.badge}</Badge>
              <h1 className="text-3xl font-bold">{copy.title}</h1>
              <p className="mt-2 max-w-3xl text-muted-foreground">{copy.description}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Select value={activeTool} onValueChange={(value) => openTool(value as MarketingTool)}>
                <SelectTrigger className="w-52">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="campaign">Campaign</SelectItem>
                  <SelectItem value="drzflash">DrzFlash</SelectItem>
                  <SelectItem value="promotions">Promotions</SelectItem>
                  <SelectItem value="coins">Daraz Coins Discount</SelectItem>
                  <SelectItem value="programs">Daraz Programs</SelectItem>
                  <SelectItem value="submissions">Submission History</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" onClick={() => setActiveTab("submissions")}>
                <History className="mr-2 h-4 w-4" />
                Submission History
              </Button>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardContent className="p-5">
                <p className="text-sm text-muted-foreground">Eligible Products</p>
                <p className="mt-2 text-2xl font-bold">{eligibleProducts.length}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-5">
                <p className="text-sm text-muted-foreground">Active Vouchers</p>
                <p className="mt-2 text-2xl font-bold">{coupons.length}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-5">
                <p className="text-sm text-muted-foreground">Submissions</p>
                <p className="mt-2 text-2xl font-bold">{submissionHistory.length}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-5">
                <p className="text-sm text-muted-foreground">Highest Product Price</p>
                <p className="mt-2 text-2xl font-bold">
                  {formatPrice(Math.max(0, ...products.map((product) => Number(product.price || 0))))}
                </p>
              </CardContent>
            </Card>
          </div>

          {loading ? (
            <p className="py-16 text-center text-muted-foreground">Loading marketing center...</p>
          ) : (
            <>
              {(activeTool === "campaign" || activeTool === "drzflash" || activeTool === "submissions") && (
                <Card>
                  <CardContent className="p-5">
                    <div className="grid gap-5 lg:grid-cols-[1fr_0.8fr]">
                      <div className="rounded-md border bg-orange-50 p-5 text-orange-950">
                        <div className="flex items-center gap-2">
                          <Zap className="h-5 w-5" />
                          <p className="font-semibold">Auto Submission is at your service, kick start today!</p>
                        </div>
                        <p className="mt-2 text-sm text-orange-900/80">
                          Auto-submission can prepare campaign requests for admin review using your eligible products.
                        </p>
                        <Button className="mt-4" onClick={() => submitCampaign("Auto Submission Service")} disabled={submitting}>
                          Start Today!
                        </Button>
                      </div>
                      <div className="rounded-md border p-5">
                        <p className="font-semibold">Campaign Tools</p>
                        <div className="mt-4 grid gap-2 sm:grid-cols-2">
                          <Button variant="outline" onClick={() => openTool("campaign")}>
                            <Megaphone className="mr-2 h-4 w-4" />
                            Campaign
                          </Button>
                          <Button variant="outline" onClick={() => openTool("drzflash")}>
                            <Zap className="mr-2 h-4 w-4" />
                            DrzFlash
                          </Button>
                          <Button variant="outline" onClick={() => openTool("promotions")}>
                            <Gift className="mr-2 h-4 w-4" />
                            Promotions
                          </Button>
                          <Button variant="outline" onClick={() => setActiveTab("submissions")}>
                            <History className="mr-2 h-4 w-4" />
                            Submission History
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {(activeTool === "campaign" || activeTool === "drzflash" || activeTool === "submissions") ? (
                <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as CampaignTab)}>
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <TabsList>
                      <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
                      <TabsTrigger value="flash">Flash Sale</TabsTrigger>
                      <TabsTrigger value="submissions">Submission History</TabsTrigger>
                    </TabsList>
                    <div className="flex gap-2">
                      <Button
                        variant={viewMode === "list" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setViewMode("list")}
                      >
                        <List className="mr-2 h-4 w-4" />
                        List View
                      </Button>
                      <Button
                        variant={viewMode === "calendar" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setViewMode("calendar")}
                      >
                        <CalendarDays className="mr-2 h-4 w-4" />
                        Calendar View
                      </Button>
                    </div>
                  </div>
                  <TabsContent value="campaigns" className="mt-5">
                    {eligibleProducts.length === 0 ? (
                      <div className="rounded-md border border-dashed p-10 text-center">
                        <LayoutGrid className="mx-auto mb-4 h-10 w-10 text-muted-foreground" />
                        <p className="font-semibold">Aw, Snap! No eligible products at the moment.</p>
                        <p className="mt-2 text-sm text-muted-foreground">
                          Add approved products with stock, then submit them into campaign invitations.
                        </p>
                        <Button asChild className="mt-4">
                          <Link href="/seller/products/new">Add Product</Link>
                        </Button>
                      </div>
                    ) : (
                      renderCampaignCards(false)
                    )}
                  </TabsContent>
                  <TabsContent value="flash" className="mt-5">
                    {renderCampaignCards(true)}
                  </TabsContent>
                  <TabsContent value="submissions" className="mt-5">
                    {renderSubmissions()}
                  </TabsContent>
                </Tabs>
              ) : activeTool === "coins" ? (
                <div className="grid gap-6 lg:grid-cols-[0.9fr_1fr]">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Coins className="h-5 w-5 text-accent" />
                        Coins Discount Setup
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <p className="text-sm text-muted-foreground">
                        Seller can request loyalty coin discount. Admin controls approval and public activation.
                      </p>
                      <Button
                        onClick={() =>
                          submitMarketingRequest(
                            "coins discount",
                            "Coins discount request",
                            `Seller requested coins discount review for ${eligibleProducts.length} eligible products.`
                          )
                        }
                        disabled={submitting}
                      >
                        <Coins className="mr-2 h-4 w-4" />
                        Request Coins Discount
                      </Button>
                    </CardContent>
                  </Card>
                  {renderSubmissions()}
                </div>
              ) : activeTool === "programs" ? (
                <div className="grid gap-6 lg:grid-cols-[1fr_0.8fr]">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <CheckCircle2 className="h-5 w-5 text-accent" />
                        Program Center
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="grid gap-3 sm:grid-cols-2">
                      {programCards.map((program) => (
                        <button
                          key={program}
                          type="button"
                          onClick={() =>
                            submitMarketingRequest(
                              "seller program",
                              program,
                              `Seller wants admin review for ${program}. Please check seller health, KYC and fulfillment readiness.`
                            )
                          }
                          className="rounded-md border p-4 text-left transition hover:border-accent hover:bg-muted"
                        >
                          <p className="font-semibold">{program}</p>
                          <p className="mt-2 text-sm text-muted-foreground">Apply and wait for admin approval.</p>
                        </button>
                      ))}
                    </CardContent>
                  </Card>
                  {renderSubmissions()}
                </div>
              ) : (
                renderPromotionWorkspace()
              )}
            </>
          )}
        </div>
      </SellerLayout>
    </RoleGuard>
  );
}
