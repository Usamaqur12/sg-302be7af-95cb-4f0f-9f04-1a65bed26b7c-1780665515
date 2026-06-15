"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/router";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { ChangeEvent } from "react";
import {
  Eye,
  ImageUp,
  LayoutTemplate,
  Moon,
  Paintbrush,
  Save,
  Settings,
  ShoppingBag,
  Store,
} from "lucide-react";
import { RoleGuard } from "@/components/RoleGuard";
import { SellerLayout } from "@/components/SellerLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useAuthContext } from "@/contexts/AuthContext";
import { useMarketplaceSettings } from "@/contexts/MarketplaceSettingsContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { getErrorMessage } from "@/lib/errors";
import { uploadFile, type UploadScope } from "@/lib/uploads";
import { cn } from "@/lib/utils";

type StoreView = "profile" | "decoration" | "builder" | "holiday-mode";

interface StorefrontConfig {
  layout: "classic" | "campaign" | "brand";
  accentColor: string;
  heroTitle: string;
  heroSubtitle: string;
  announcement: string;
  featuredSectionTitle: string;
  newArrivalsTitle: string;
  featuredProductIds: string[];
}

interface SellerStoreProfile {
  id: string;
  business_name: string;
  business_description: string | null;
  business_address: string | null;
  business_email: string | null;
  business_phone: string | null;
  logo_url: string | null;
  banner_url: string | null;
  status: string | null;
  rating: number | null;
  total_reviews: number | null;
  holiday_mode?: boolean | number | string | null;
  holiday_message?: string | null;
  storefront_config?: string | null;
}

interface SellerProduct {
  id: string;
  title: string;
  price: number;
  stock_quantity: number | null;
  status: string | null;
}

const DEFAULT_CONFIG: StorefrontConfig = {
  layout: "classic",
  accentColor: "#f97316",
  heroTitle: "Welcome to our official store",
  heroSubtitle: "Explore curated deals, trusted products and fast seller support.",
  announcement: "New deals are updated every week.",
  featuredSectionTitle: "Featured Picks",
  newArrivalsTitle: "New Arrivals",
  featuredProductIds: [],
};

const viewLabels: Record<StoreView, string> = {
  profile: "Store Profile",
  decoration: "Store Decoration",
  builder: "Store Builder",
  "holiday-mode": "Holiday Mode",
};

const accentSwatches = ["#f97316", "#0f766e", "#2563eb", "#be123c", "#7c3aed", "#111827"];

function normalizeView(value: unknown): StoreView {
  const view = String(value || "profile");
  if (["profile", "decoration", "builder", "holiday-mode"].includes(view)) return view as StoreView;
  return "profile";
}

function boolValue(value: unknown) {
  return value === true || value === 1 || value === "1" || value === "true";
}

function parseStorefrontConfig(value: unknown): StorefrontConfig {
  if (!value) return DEFAULT_CONFIG;
  try {
    const parsed = typeof value === "string" ? JSON.parse(value) : value;
    return {
      ...DEFAULT_CONFIG,
      ...(parsed && typeof parsed === "object" ? parsed : {}),
      featuredProductIds: Array.isArray((parsed as StorefrontConfig)?.featuredProductIds)
        ? (parsed as StorefrontConfig).featuredProductIds
        : [],
    };
  } catch {
    return DEFAULT_CONFIG;
  }
}

export default function SellerStorePage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuthContext();
  const { formatPrice } = useMarketplaceSettings();
  const { toast } = useToast();
  const activeView = normalizeView(router.query.view);
  const [seller, setSeller] = useState<SellerStoreProfile | null>(null);
  const [products, setProducts] = useState<SellerProduct[]>([]);
  const [config, setConfig] = useState<StorefrontConfig>(DEFAULT_CONFIG);
  const [holidayMode, setHolidayMode] = useState(false);
  const [holidayMessage, setHolidayMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingField, setUploadingField] = useState<"logo_url" | "banner_url" | null>(null);

  const featuredProducts = useMemo(
    () => products.filter((product) => config.featuredProductIds.includes(product.id)).slice(0, 6),
    [config.featuredProductIds, products]
  );

  const loadStore = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    const { data, error } = await supabase
      .from("seller_profiles")
      .select(`
        id,
        business_name,
        business_description,
        business_address,
        business_email,
        business_phone,
        logo_url,
        banner_url,
        status,
        rating,
        total_reviews,
        holiday_mode,
        holiday_message,
        storefront_config
      `)
      .eq("user_id", user.id)
      .maybeSingle();

    if (error || !data) {
      toast({
        title: "Store profile unavailable",
        description: error?.message || "Complete seller registration first.",
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    const profile = data as unknown as SellerStoreProfile;
    setSeller(profile);
    setConfig(parseStorefrontConfig(profile.storefront_config));
    setHolidayMode(boolValue(profile.holiday_mode));
    setHolidayMessage(profile.holiday_message || "");

    const { data: productRows } = await supabase
      .from("products")
      .select("id, title, price, stock_quantity, status")
      .eq("seller_id", profile.id)
      .order("created_at", { ascending: false })
      .limit(60);

    setProducts((productRows ?? []) as unknown as SellerProduct[]);
    setLoading(false);
  }, [toast, user]);

  useEffect(() => {
    if (!authLoading && user) {
      loadStore();
    }
  }, [authLoading, loadStore, user]);

  const updateSellerField = (field: keyof SellerStoreProfile, value: string) => {
    setSeller((current) => (current ? { ...current, [field]: value } : current));
  };

  const updateConfig = <K extends keyof StorefrontConfig>(field: K, value: StorefrontConfig[K]) => {
    setConfig((current) => ({ ...current, [field]: value }));
  };

  const toggleFeaturedProduct = (productId: string, checked: boolean) => {
    setConfig((current) => {
      const nextIds = checked
        ? Array.from(new Set([...current.featuredProductIds, productId])).slice(0, 8)
        : current.featuredProductIds.filter((id) => id !== productId);
      return { ...current, featuredProductIds: nextIds };
    });
  };

  const handleUpload = async (
    event: ChangeEvent<HTMLInputElement>,
    field: "logo_url" | "banner_url",
    scope: UploadScope
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadingField(field);
    try {
      const url = await uploadFile(file, scope);
      updateSellerField(field, url);
      toast({
        title: "Upload complete",
        description: "Store asset is ready for preview and save.",
      });
    } catch (error) {
      toast({
        title: "Upload failed",
        description: getErrorMessage(error, "Could not upload this file."),
        variant: "destructive",
      });
    } finally {
      setUploadingField(null);
      event.target.value = "";
    }
  };

  const saveStore = async () => {
    if (!seller?.id) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from("seller_profiles")
        .update({
          business_name: seller.business_name,
          business_description: seller.business_description,
          business_address: seller.business_address,
          business_email: seller.business_email,
          business_phone: seller.business_phone,
          logo_url: seller.logo_url,
          banner_url: seller.banner_url,
          holiday_mode: holidayMode ? 1 : 0,
          holiday_message: holidayMessage,
          storefront_config: JSON.stringify(config),
        })
        .eq("id", seller.id);

      if (error) throw error;
      toast({
        title: "Store saved",
        description: "Decoration, builder settings and holiday mode have been updated.",
      });
      await loadStore();
    } catch (error) {
      toast({
        title: "Save failed",
        description: getErrorMessage(error, "Could not save store builder changes."),
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const openView = (view: StoreView) => {
    router.push(view === "profile" ? "/seller/store" : `/seller/store?view=${view}`);
  };

  const renderStorePreview = () => (
    <div className="overflow-hidden rounded-md border bg-background">
      <div className="relative min-h-56 bg-muted">
        {seller?.banner_url ? (
          <Image src={seller.banner_url} alt="Store banner preview" fill className="object-cover" unoptimized />
        ) : (
          <div className="absolute inset-0" style={{ backgroundColor: config.accentColor }} />
        )}
        <div className="absolute inset-0 bg-black/35" />
        <div className="relative z-10 flex min-h-56 flex-col justify-end p-6 text-white">
          <div className="mb-4 flex items-center gap-3">
            <div className="relative h-14 w-14 overflow-hidden rounded-md border bg-white">
              {seller?.logo_url ? (
                <Image src={seller.logo_url} alt="Store logo preview" fill className="object-cover" unoptimized />
              ) : (
                <Store className="m-4 h-6 w-6 text-muted-foreground" />
              )}
            </div>
            <div>
              <p className="text-xl font-bold">{seller?.business_name || "Store Name"}</p>
              <p className="text-sm text-white/80">{seller?.rating ?? 0} rating - {seller?.total_reviews ?? 0} reviews</p>
            </div>
          </div>
          <h2 className="text-2xl font-bold">{config.heroTitle}</h2>
          <p className="mt-2 max-w-xl text-sm text-white/85">{config.heroSubtitle}</p>
        </div>
      </div>
      <div className="border-b px-5 py-3 text-sm font-medium" style={{ color: config.accentColor }}>
        {config.announcement}
      </div>
      <div className="grid gap-4 p-5 sm:grid-cols-2 lg:grid-cols-3">
        {(featuredProducts.length ? featuredProducts : products.slice(0, 3)).map((product) => (
          <div key={product.id} className="rounded-md border p-4">
            <p className="line-clamp-2 font-semibold">{product.title}</p>
            <p className="mt-2 font-mono text-sm">{formatPrice(product.price)}</p>
            <Badge variant="outline" className="mt-3">{product.status || "draft"}</Badge>
          </div>
        ))}
        {products.length === 0 && (
          <div className="col-span-full rounded-md border border-dashed p-8 text-center text-muted-foreground">
            Products you approve and feature will appear in this store preview.
          </div>
        )}
      </div>
    </div>
  );

  return (
    <RoleGuard allowedRoles={["seller"]}>
      <SellerLayout>
        <div className="space-y-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <Badge className="mb-3 bg-accent text-accent-foreground">Store</Badge>
              <h1 className="text-3xl font-bold">{viewLabels[activeView]}</h1>
              <p className="mt-2 max-w-3xl text-muted-foreground">
                Manage seller profile, storefront decoration, layout sections and holiday availability.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Select value={activeView} onValueChange={(value) => openView(value as StoreView)}>
                <SelectTrigger className="w-52">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="profile">Store Profile</SelectItem>
                  <SelectItem value="decoration">Store Decoration</SelectItem>
                  <SelectItem value="builder">Store Builder</SelectItem>
                  <SelectItem value="holiday-mode">Holiday Mode</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={saveStore} disabled={saving || loading || !seller?.id}>
                <Save className="mr-2 h-4 w-4" />
                {saving ? "Saving..." : "Save Store"}
              </Button>
            </div>
          </div>

          <div className="grid gap-2 sm:grid-cols-4">
            {(Object.keys(viewLabels) as StoreView[]).map((view) => {
              const icons = {
                profile: Store,
                decoration: Paintbrush,
                builder: LayoutTemplate,
                "holiday-mode": Moon,
              };
              const Icon = icons[view];
              return (
                <button
                  key={view}
                  type="button"
                  onClick={() => openView(view)}
                  className={cn(
                    "flex items-center gap-2 rounded-md border px-4 py-3 text-left text-sm font-medium transition",
                    activeView === view ? "border-accent bg-accent/10 text-accent" : "hover:border-accent hover:bg-muted"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {viewLabels[view]}
                </button>
              );
            })}
          </div>

          {loading ? (
            <p className="py-16 text-center text-muted-foreground">Loading store builder...</p>
          ) : (
            <>
              {activeView === "profile" && seller && (
                <div className="grid gap-6 lg:grid-cols-[1fr_0.8fr]">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Settings className="h-5 w-5 text-accent" />
                        Store Profile
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="grid gap-4 md:grid-cols-2">
                      <div className="md:col-span-2">
                        <Label htmlFor="business_name">Store Name</Label>
                        <Input
                          id="business_name"
                          value={seller.business_name}
                          onChange={(event) => updateSellerField("business_name", event.target.value)}
                        />
                      </div>
                      <div className="md:col-span-2">
                        <Label htmlFor="business_description">Store Description</Label>
                        <Textarea
                          id="business_description"
                          value={seller.business_description || ""}
                          onChange={(event) => updateSellerField("business_description", event.target.value)}
                          rows={4}
                        />
                      </div>
                      <div>
                        <Label htmlFor="business_email">Business Email</Label>
                        <Input
                          id="business_email"
                          value={seller.business_email || ""}
                          onChange={(event) => updateSellerField("business_email", event.target.value)}
                        />
                      </div>
                      <div>
                        <Label htmlFor="business_phone">Business Phone</Label>
                        <Input
                          id="business_phone"
                          value={seller.business_phone || ""}
                          onChange={(event) => updateSellerField("business_phone", event.target.value)}
                        />
                      </div>
                      <div className="md:col-span-2">
                        <Label htmlFor="business_address">Business Address</Label>
                        <Textarea
                          id="business_address"
                          value={seller.business_address || ""}
                          onChange={(event) => updateSellerField("business_address", event.target.value)}
                          rows={3}
                        />
                      </div>
                    </CardContent>
                  </Card>

                  <div className="space-y-6">
                    <Card>
                      <CardContent className="grid gap-4 p-5 sm:grid-cols-2">
                        <div>
                          <p className="text-sm text-muted-foreground">Store Status</p>
                          <p className="mt-1 text-2xl font-bold">{seller.status || "pending"}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Products</p>
                          <p className="mt-1 text-2xl font-bold">{products.length}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Rating</p>
                          <p className="mt-1 text-2xl font-bold">{seller.rating ?? 0}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Reviews</p>
                          <p className="mt-1 text-2xl font-bold">{seller.total_reviews ?? 0}</p>
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Eye className="h-5 w-5 text-accent" />
                          Live Preview
                        </CardTitle>
                      </CardHeader>
                      <CardContent>{renderStorePreview()}</CardContent>
                    </Card>
                  </div>
                </div>
              )}

              {activeView === "decoration" && seller && (
                <div className="grid gap-6 lg:grid-cols-[0.85fr_1fr]">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <ImageUp className="h-5 w-5 text-accent" />
                        Store Decoration
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-5">
                      <div>
                        <Label htmlFor="logo_upload">Seller Logo</Label>
                        <Input
                          id="logo_upload"
                          type="file"
                          accept="image/*"
                          disabled={uploadingField === "logo_url"}
                          onChange={(event) => handleUpload(event, "logo_url", "seller-logo")}
                        />
                      </div>
                      <div>
                        <Label htmlFor="banner_upload">Store Banner</Label>
                        <Input
                          id="banner_upload"
                          type="file"
                          accept="image/*"
                          disabled={uploadingField === "banner_url"}
                          onChange={(event) => handleUpload(event, "banner_url", "seller-banner")}
                        />
                      </div>
                      <div>
                        <Label>Store Theme</Label>
                        <Select value={config.layout} onValueChange={(value) => updateConfig("layout", value as StorefrontConfig["layout"])}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="classic">Classic Marketplace</SelectItem>
                            <SelectItem value="campaign">Campaign Focused</SelectItem>
                            <SelectItem value="brand">Brand Store</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Accent Color</Label>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {accentSwatches.map((color) => (
                            <button
                              key={color}
                              type="button"
                              onClick={() => updateConfig("accentColor", color)}
                              className={cn(
                                "h-9 w-9 rounded-md border-2",
                                config.accentColor === color ? "border-foreground" : "border-transparent"
                              )}
                              style={{ backgroundColor: color }}
                              title={color}
                            />
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Decoration Preview</CardTitle>
                    </CardHeader>
                    <CardContent>{renderStorePreview()}</CardContent>
                  </Card>
                </div>
              )}

              {activeView === "builder" && seller && (
                <div className="grid gap-6 lg:grid-cols-[0.9fr_1fr]">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <LayoutTemplate className="h-5 w-5 text-accent" />
                        Store Builder
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label htmlFor="hero_title">Hero Title</Label>
                        <Input
                          id="hero_title"
                          value={config.heroTitle}
                          onChange={(event) => updateConfig("heroTitle", event.target.value)}
                        />
                      </div>
                      <div>
                        <Label htmlFor="hero_subtitle">Hero Subtitle</Label>
                        <Textarea
                          id="hero_subtitle"
                          value={config.heroSubtitle}
                          onChange={(event) => updateConfig("heroSubtitle", event.target.value)}
                          rows={3}
                        />
                      </div>
                      <div>
                        <Label htmlFor="announcement">Announcement Strip</Label>
                        <Input
                          id="announcement"
                          value={config.announcement}
                          onChange={(event) => updateConfig("announcement", event.target.value)}
                        />
                      </div>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                          <Label htmlFor="featured_title">Featured Section</Label>
                          <Input
                            id="featured_title"
                            value={config.featuredSectionTitle}
                            onChange={(event) => updateConfig("featuredSectionTitle", event.target.value)}
                          />
                        </div>
                        <div>
                          <Label htmlFor="arrivals_title">New Arrivals Section</Label>
                          <Input
                            id="arrivals_title"
                            value={config.newArrivalsTitle}
                            onChange={(event) => updateConfig("newArrivalsTitle", event.target.value)}
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <ShoppingBag className="h-5 w-5 text-accent" />
                        Featured Products
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {products.length === 0 ? (
                        <div className="rounded-md border border-dashed p-8 text-center">
                          <p className="font-semibold">No products yet</p>
                          <p className="mt-2 text-sm text-muted-foreground">Create products first, then feature them in your store.</p>
                          <Button asChild className="mt-4">
                            <Link href="/seller/products/new">Add Product</Link>
                          </Button>
                        </div>
                      ) : (
                        products.map((product) => (
                          <label key={product.id} className="flex items-center gap-3 rounded-md border p-3">
                            <Checkbox
                              checked={config.featuredProductIds.includes(product.id)}
                              onCheckedChange={(checked) => toggleFeaturedProduct(product.id, checked === true)}
                            />
                            <span className="min-w-0 flex-1">
                              <span className="block truncate font-medium">{product.title}</span>
                              <span className="text-sm text-muted-foreground">
                                {formatPrice(product.price)} - {product.stock_quantity ?? 0} stock - {product.status || "draft"}
                              </span>
                            </span>
                          </label>
                        ))
                      )}
                    </CardContent>
                  </Card>

                  <Card className="lg:col-span-2">
                    <CardHeader>
                      <CardTitle>Builder Preview</CardTitle>
                    </CardHeader>
                    <CardContent>{renderStorePreview()}</CardContent>
                  </Card>
                </div>
              )}

              {activeView === "holiday-mode" && seller && (
                <div className="grid gap-6 lg:grid-cols-[0.8fr_1fr]">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Moon className="h-5 w-5 text-accent" />
                        Holiday Mode
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-5">
                      <div className="flex items-center justify-between gap-4 rounded-md border p-4">
                        <div>
                          <p className="font-semibold">Pause new checkout orders</p>
                          <p className="mt-1 text-sm text-muted-foreground">
                            Customers can browse, but cart/order APIs block checkout while holiday mode is on.
                          </p>
                        </div>
                        <Switch checked={holidayMode} onCheckedChange={setHolidayMode} />
                      </div>
                      <div>
                        <Label htmlFor="holiday_message">Customer Message</Label>
                        <Textarea
                          id="holiday_message"
                          value={holidayMessage}
                          onChange={(event) => setHolidayMessage(event.target.value)}
                          rows={4}
                          placeholder="We are away and will resume processing orders soon."
                        />
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Holiday Preview</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="rounded-md border p-6">
                        <Badge className={holidayMode ? "bg-amber-500/10 text-amber-700" : "bg-green-500/10 text-green-700"}>
                          {holidayMode ? "Holiday mode active" : "Store accepting orders"}
                        </Badge>
                        <h2 className="mt-4 text-2xl font-bold">{seller.business_name}</h2>
                        <p className="mt-2 text-muted-foreground">
                          {holidayMode
                            ? holidayMessage || "This store is temporarily not accepting new orders."
                            : "Customers can place orders from approved active products."}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </>
          )}
        </div>
      </SellerLayout>
    </RoleGuard>
  );
}
