"use client";

import { useCallback, useEffect, useState } from "react";
import {
  AlertTriangle,
  BookOpen,
  Loader2,
  Save,
  ShieldCheck,
  SlidersHorizontal,
  Store,
  Wrench,
} from "lucide-react";
import { AdminLayout } from "@/components/AdminLayout";
import { RoleGuard } from "@/components/RoleGuard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuthContext } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import {
  allSellerCenterOptionHrefs,
  defaultSellerCenterSettings,
  parseSellerCenterEnabledOptions,
  sellerCenterModules,
  sellerCenterSettingKeys,
  serializeSellerCenterEnabledOptions,
} from "@/lib/seller-center";

interface SellerCenterSeller {
  id: string;
  business_name: string;
  business_email?: string | null;
  status?: string | null;
  holiday_mode?: boolean | number | string | null;
  holiday_message?: string | null;
  order_volume_limit?: number | string | null;
  non_compliance_points?: number | string | null;
  account_health_status?: string | null;
  admin_note?: string | null;
  commission_rate?: number | null;
  total_sales?: number | null;
  seller_center_enabled_options?: string | null;
}

interface SellerCenterSettingsState {
  notification: string;
  learningEnabled: boolean;
  toolkitEnabled: boolean;
  campaignName: string;
  enabledOptions: string[];
}

const DEFAULT_SETTINGS_STATE: SellerCenterSettingsState = {
  notification: defaultSellerCenterSettings.seller_center_important_notification,
  learningEnabled: defaultSellerCenterSettings.seller_center_learning_enabled === "true",
  toolkitEnabled: defaultSellerCenterSettings.seller_center_toolkit_enabled === "true",
  campaignName: defaultSellerCenterSettings.seller_center_campaign_name,
  enabledOptions: allSellerCenterOptionHrefs,
};

function boolValue(value: unknown) {
  return value === true || value === 1 || value === "1" || value === "true";
}

function numberValue(value: unknown, fallback = 0) {
  const next = Number(value);
  return Number.isFinite(next) ? next : fallback;
}

function settingMap(rows: Array<{ key: string; value: unknown }>) {
  return new Map(rows.map((row) => [row.key, String(row.value ?? "")]));
}

function statusClass(status?: string | null) {
  if (status === "approved") return "bg-green-500/10 text-green-700";
  if (status === "suspended" || status === "rejected") return "bg-red-500/10 text-red-700";
  return "bg-amber-500/10 text-amber-700";
}

export default function AdminSellerCenterPage() {
  const { user, loading: authLoading } = useAuthContext();
  const { toast } = useToast();
  const [settings, setSettings] = useState(DEFAULT_SETTINGS_STATE);
  const [sellers, setSellers] = useState<SellerCenterSeller[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingSettings, setSavingSettings] = useState(false);
  const [savingSellerId, setSavingSellerId] = useState<string | null>(null);

  const loadSellerCenter = useCallback(async () => {
    setLoading(true);

    const [settingsResult, sellersResult] = await Promise.all([
      supabase
        .from("system_settings")
        .select("key, value")
        .in("key", [...sellerCenterSettingKeys]),
      supabase
        .from("seller_profiles")
        .select(`
          id,
          business_name,
          business_email,
          status,
          holiday_mode,
          holiday_message,
          order_volume_limit,
          non_compliance_points,
          account_health_status,
          admin_note,
          commission_rate,
          total_sales,
          seller_center_enabled_options
        `)
        .order("created_at", { ascending: false }),
    ]);

    if (settingsResult.error || sellersResult.error) {
      toast({
        title: "Seller Center unavailable",
        description: "Could not load Seller Center controls.",
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    const values = settingMap((settingsResult.data ?? []) as Array<{ key: string; value: unknown }>);
    setSettings({
      notification:
        values.get("seller_center_important_notification") ??
        DEFAULT_SETTINGS_STATE.notification,
      learningEnabled:
        (values.get("seller_center_learning_enabled") ?? "true").toLowerCase() !== "false",
      toolkitEnabled:
        (values.get("seller_center_toolkit_enabled") ?? "true").toLowerCase() !== "false",
      campaignName:
        values.get("seller_center_campaign_name") ??
        DEFAULT_SETTINGS_STATE.campaignName,
      enabledOptions: parseSellerCenterEnabledOptions(
        values.get("seller_center_enabled_options") ??
          defaultSellerCenterSettings.seller_center_enabled_options
      ),
    });
    setSellers((sellersResult.data ?? []) as unknown as SellerCenterSeller[]);
    setLoading(false);
  }, [toast]);

  useEffect(() => {
    if (!authLoading && user) {
      loadSellerCenter();
    }
  }, [authLoading, loadSellerCenter, user]);

  const saveGlobalSettings = async () => {
    setSavingSettings(true);
    const { error } = await supabase
      .from("system_settings")
      .upsert([
        {
          key: "seller_center_important_notification",
          value: settings.notification,
          description: "Seller Center dashboard notification controlled by admin",
        },
        {
          key: "seller_center_learning_enabled",
          value: String(settings.learningEnabled),
          description: "Show Learn and Grow recommendations in seller dashboard",
        },
        {
          key: "seller_center_toolkit_enabled",
          value: String(settings.toolkitEnabled),
          description: "Show popular seller toolkit actions",
        },
        {
          key: "seller_center_campaign_name",
          value: settings.campaignName,
          description: "Featured seller education campaign",
        },
        {
          key: "seller_center_enabled_options",
          value: serializeSellerCenterEnabledOptions(settings.enabledOptions),
          description: "Enabled Seller Center workflow options",
        },
      ], { onConflict: "key" });

    setSavingSettings(false);
    if (error) {
      toast({
        title: "Save failed",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Seller Center updated",
      description: "Global seller dashboard controls were saved.",
    });
  };

  const toggleSellerOption = (href: string, checked: boolean) => {
    setSettings((current) => {
      const next = checked
        ? Array.from(new Set([...current.enabledOptions, href]))
        : current.enabledOptions.filter((item) => item !== href);

      return { ...current, enabledOptions: next };
    });
  };

  const toggleAllSellerOptions = (checked: boolean) => {
    setSettings((current) => ({
      ...current,
      enabledOptions: checked ? allSellerCenterOptionHrefs : [],
    }));
  };

  const updateSeller = (sellerId: string, patch: Partial<SellerCenterSeller>) => {
    setSellers((current) =>
      current.map((seller) => seller.id === sellerId ? { ...seller, ...patch } : seller)
    );
  };

  const sellerOptionSet = (seller: SellerCenterSeller) => {
    const override = String(seller.seller_center_enabled_options ?? "").trim();
    return new Set(override ? parseSellerCenterEnabledOptions(override) : settings.enabledOptions);
  };

  const toggleSellerSpecificOption = (
    seller: SellerCenterSeller,
    href: string,
    checked: boolean
  ) => {
    const currentOptions = Array.from(sellerOptionSet(seller));
    const next = checked
      ? Array.from(new Set([...currentOptions, href]))
      : currentOptions.filter((item) => item !== href);
    updateSeller(seller.id, {
      seller_center_enabled_options: serializeSellerCenterEnabledOptions(next),
    });
  };

  const setSellerOptionMode = (
    seller: SellerCenterSeller,
    mode: "global" | "all" | "none"
  ) => {
    updateSeller(seller.id, {
      seller_center_enabled_options:
        mode === "global"
          ? null
          : mode === "all"
            ? "all"
            : "none",
    });
  };

  const enabledOptionSet = new Set(settings.enabledOptions);
  const allOptionsEnabled = settings.enabledOptions.length === allSellerCenterOptionHrefs.length;

  const saveSeller = async (seller: SellerCenterSeller) => {
    const orderVolumeLimit = Math.max(0, Math.round(numberValue(seller.order_volume_limit, 50)));
    const nonCompliancePoints = Math.max(0, Math.round(numberValue(seller.non_compliance_points, 0)));

    setSavingSellerId(seller.id);
    const { error } = await supabase
      .from("seller_profiles")
      .update({
        holiday_mode: boolValue(seller.holiday_mode) ? 1 : 0,
        holiday_message: seller.holiday_message || null,
        order_volume_limit: orderVolumeLimit,
        non_compliance_points: nonCompliancePoints,
        account_health_status: seller.account_health_status || "excellent",
        admin_note: seller.admin_note || null,
        seller_center_enabled_options: seller.seller_center_enabled_options || null,
      })
      .eq("id", seller.id);

    setSavingSellerId(null);
    if (error) {
      toast({
        title: "Seller update failed",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    updateSeller(seller.id, {
      order_volume_limit: orderVolumeLimit,
      non_compliance_points: nonCompliancePoints,
    });
    toast({
      title: "Seller controls saved",
      description: `${seller.business_name} Seller Center controls were updated.`,
    });
  };

  return (
    <RoleGuard allowedRoles={["admin"]}>
      <AdminLayout>
        <div className="space-y-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <Badge className="mb-3 bg-accent text-accent-foreground">Daraz-style controls</Badge>
              <h1 className="text-3xl font-bold">Seller Center Control</h1>
              <p className="mt-2 max-w-3xl text-muted-foreground">
                Admin access for seller homepage notification, learning/toolkit visibility,
                holiday mode, OVL, non-compliance points and account health.
              </p>
            </div>
            <Button variant="outline" onClick={loadSellerCenter} disabled={loading}>
              <SlidersHorizontal className="mr-2 h-4 w-4" />
              Refresh
            </Button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center gap-2 py-20 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
              Loading Seller Center controls...
            </div>
          ) : (
            <>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Wrench className="h-5 w-5 text-accent" />
                    Global Seller Center Settings
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div>
                    <Label htmlFor="notification">Important Notification</Label>
                    <Textarea
                      id="notification"
                      value={settings.notification}
                      onChange={(event) =>
                        setSettings((current) => ({
                          ...current,
                          notification: event.target.value,
                        }))
                      }
                    />
                  </div>

                  <div className="grid gap-4 md:grid-cols-3">
                    <div>
                      <Label htmlFor="campaignName">Featured Campaign</Label>
                      <Input
                        id="campaignName"
                        value={settings.campaignName}
                        onChange={(event) =>
                          setSettings((current) => ({
                            ...current,
                            campaignName: event.target.value,
                          }))
                        }
                      />
                    </div>
                    <label className="flex items-center gap-3 rounded-md border p-4">
                      <Checkbox
                        checked={settings.learningEnabled}
                        onCheckedChange={(checked) =>
                          setSettings((current) => ({
                            ...current,
                            learningEnabled: checked === true,
                          }))
                        }
                      />
                      <span>
                        <span className="block font-medium">Learn and Grow</span>
                        <span className="text-sm text-muted-foreground">Show education cards</span>
                      </span>
                    </label>
                    <label className="flex items-center gap-3 rounded-md border p-4">
                      <Checkbox
                        checked={settings.toolkitEnabled}
                        onCheckedChange={(checked) =>
                          setSettings((current) => ({
                            ...current,
                            toolkitEnabled: checked === true,
                          }))
                        }
                      />
                      <span>
                        <span className="block font-medium">Popular Toolkit</span>
                        <span className="text-sm text-muted-foreground">Show seller tool shortcuts</span>
                      </span>
                    </label>
                  </div>

                  <Button onClick={saveGlobalSettings} disabled={savingSettings}>
                    <Save className="mr-2 h-4 w-4" />
                    {savingSettings ? "Saving..." : "Save Global Settings"}
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <CardTitle className="flex items-center gap-2">
                      <BookOpen className="h-5 w-5 text-accent" />
                      Seller Center Options
                    </CardTitle>
                    <label className="flex items-center gap-2 text-sm">
                      <Checkbox
                        checked={allOptionsEnabled}
                        onCheckedChange={(checked) => toggleAllSellerOptions(checked === true)}
                      />
                      <span>Enable all options</span>
                    </label>
                  </div>
                </CardHeader>
                <CardContent className="space-y-5">
                  {sellerCenterModules.map((module) => (
                    <div key={module.href} className="rounded-md border p-4">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="font-semibold">{module.title}</p>
                          <p className="mt-1 text-sm text-muted-foreground">{module.description}</p>
                        </div>
                        <Badge variant="secondary">
                          {module.options.filter((option) => enabledOptionSet.has(option.href)).length}/{module.options.length}
                        </Badge>
                      </div>
                      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                        {module.options.map((option) => (
                          <label key={option.href} className="flex items-start gap-3 rounded-md bg-muted/50 p-3">
                            <Checkbox
                              checked={enabledOptionSet.has(option.href)}
                              onCheckedChange={(checked) => toggleSellerOption(option.href, checked === true)}
                            />
                            <span>
                              <span className="block text-sm font-medium">{option.title}</span>
                              <span className="mt-1 block text-xs text-muted-foreground">{option.description}</span>
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <div className="space-y-5">
                <div>
                  <h2 className="text-2xl font-bold">Per-seller Controls</h2>
                  <p className="text-muted-foreground">
                    Everything below is admin-owned and appears on the seller dashboard.
                  </p>
                </div>

                {sellers.length === 0 ? (
                  <Card>
                    <CardContent className="py-12 text-center text-muted-foreground">
                      No sellers found.
                    </CardContent>
                  </Card>
                ) : sellers.map((seller) => {
                  const sellerEnabledSet = sellerOptionSet(seller);
                  const usesGlobalOptions = !String(seller.seller_center_enabled_options ?? "").trim();

                  return (
                  <Card key={seller.id}>
                    <CardContent className="space-y-5 p-6">
                      <div className="flex flex-wrap items-start justify-between gap-4">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <Store className="h-5 w-5 text-accent" />
                            <h3 className="text-xl font-semibold">{seller.business_name}</h3>
                            <Badge className={statusClass(seller.status)}>{seller.status || "pending"}</Badge>
                          </div>
                          <p className="mt-1 text-sm text-muted-foreground">
                            {seller.business_email || "No seller email"} · Commission {seller.commission_rate ?? 15}%
                          </p>
                        </div>
                        <Button onClick={() => saveSeller(seller)} disabled={savingSellerId === seller.id}>
                          <Save className="mr-2 h-4 w-4" />
                          {savingSellerId === seller.id ? "Saving..." : "Save Seller"}
                        </Button>
                      </div>

                      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                        <label className="flex items-center gap-3 rounded-md border p-4">
                          <Checkbox
                            checked={boolValue(seller.holiday_mode)}
                            onCheckedChange={(checked) =>
                              updateSeller(seller.id, { holiday_mode: checked === true ? 1 : 0 })
                            }
                          />
                          <span>
                            <span className="block font-medium">Holiday Mode</span>
                            <span className="text-sm text-muted-foreground">Pause public purchases</span>
                          </span>
                        </label>

                        <div>
                          <Label htmlFor={`ovl-${seller.id}`}>Order Volume Limit / Day</Label>
                          <Input
                            id={`ovl-${seller.id}`}
                            type="number"
                            min="0"
                            value={String(seller.order_volume_limit ?? 50)}
                            onChange={(event) =>
                              updateSeller(seller.id, { order_volume_limit: event.target.value })
                            }
                          />
                        </div>

                        <div>
                          <Label htmlFor={`ncp-${seller.id}`}>Non-compliance Points</Label>
                          <Input
                            id={`ncp-${seller.id}`}
                            type="number"
                            min="0"
                            value={String(seller.non_compliance_points ?? 0)}
                            onChange={(event) =>
                              updateSeller(seller.id, { non_compliance_points: event.target.value })
                            }
                          />
                        </div>

                        <div>
                          <Label htmlFor={`health-${seller.id}`}>Account Health</Label>
                          <select
                            id={`health-${seller.id}`}
                            value={seller.account_health_status || "excellent"}
                            onChange={(event) =>
                              updateSeller(seller.id, { account_health_status: event.target.value })
                            }
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none ring-offset-background focus-visible:ring-1 focus-visible:ring-ring"
                          >
                            <option value="excellent">Excellent</option>
                            <option value="good">Good</option>
                            <option value="warning">Warning</option>
                            <option value="at_risk">At Risk</option>
                          </select>
                        </div>
                      </div>

                      <div className="rounded-md border p-4">
                        <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <p className="font-semibold">Seller Option Access</p>
                            <p className="mt-1 text-sm text-muted-foreground">
                              Allow or hide Seller Center modules for this seller only.
                            </p>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <Button
                              type="button"
                              size="sm"
                              variant={usesGlobalOptions ? "default" : "outline"}
                              onClick={() => setSellerOptionMode(seller, "global")}
                            >
                              Use global
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={() => setSellerOptionMode(seller, "all")}
                            >
                              Allow all
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={() => setSellerOptionMode(seller, "none")}
                            >
                              Disable all
                            </Button>
                          </div>
                        </div>

                        <div className="max-h-[420px] space-y-3 overflow-y-auto pr-2">
                          {sellerCenterModules.map((module) => (
                            <div key={`${seller.id}-${module.href}`} className="rounded-md bg-muted/40 p-3">
                              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                                <p className="text-sm font-semibold">{module.title}</p>
                                <Badge variant="secondary">
                                  {module.options.filter((option) => sellerEnabledSet.has(option.href)).length}/{module.options.length}
                                </Badge>
                              </div>
                              <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
                                {module.options.map((option) => (
                                  <label
                                    key={`${seller.id}-${option.href}`}
                                    className="flex items-start gap-2 rounded-md bg-background p-2 text-sm"
                                  >
                                    <Checkbox
                                      checked={sellerEnabledSet.has(option.href)}
                                      onCheckedChange={(checked) =>
                                        toggleSellerSpecificOption(seller, option.href, checked === true)
                                      }
                                    />
                                    <span className="leading-tight">
                                      <span className="block font-medium">{option.title}</span>
                                      <span className="mt-1 block text-xs text-muted-foreground">
                                        {option.href}
                                      </span>
                                    </span>
                                  </label>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="grid gap-4 md:grid-cols-2">
                        <div>
                          <Label htmlFor={`holiday-${seller.id}`}>Holiday Message</Label>
                          <Textarea
                            id={`holiday-${seller.id}`}
                            value={seller.holiday_message || ""}
                            onChange={(event) =>
                              updateSeller(seller.id, { holiday_message: event.target.value })
                            }
                            placeholder="Message shown to seller while holiday mode is active"
                          />
                        </div>
                        <div>
                          <Label htmlFor={`note-${seller.id}`}>Admin Note</Label>
                          <Textarea
                            id={`note-${seller.id}`}
                            value={seller.admin_note || ""}
                            onChange={(event) =>
                              updateSeller(seller.id, { admin_note: event.target.value })
                            }
                            placeholder="Internal/admin-controlled seller dashboard note"
                          />
                        </div>
                      </div>

                      {boolValue(seller.holiday_mode) && (
                        <div className="flex gap-2 rounded-md border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
                          <AlertTriangle className="h-4 w-4 shrink-0" />
                          Holiday mode is enabled; customers should not be able to purchase this seller's products.
                        </div>
                      )}

                      <div className="flex gap-2 rounded-md border bg-muted/30 p-4 text-sm text-muted-foreground">
                        <ShieldCheck className="h-4 w-4 shrink-0 text-accent" />
                        Seller dashboard reads these values directly from the same local/cPanel database.
                      </div>
                    </CardContent>
                  </Card>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </AdminLayout>
    </RoleGuard>
  );
}
