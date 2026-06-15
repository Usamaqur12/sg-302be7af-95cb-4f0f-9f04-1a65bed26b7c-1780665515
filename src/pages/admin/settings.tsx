"use client";

import { useCallback, useEffect, useState } from "react";
import { Save, Settings as SettingsIcon } from "lucide-react";
import { AdminLayout } from "@/components/AdminLayout";
import { RoleGuard } from "@/components/RoleGuard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuthContext } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { getErrorMessage } from "@/lib/errors";
import { currencyOptions, pakistanMajorCities } from "@/lib/marketplace-config";

interface PlatformSettings {
  siteName: string;
  contactEmail: string;
  defaultCommission: string;
  currencyCode: string;
  currencySymbol: string;
  currencyRate: string;
  defaultDeliveryCity: string;
  sellerPayoutHoldDays: string;
}

const DEFAULT_SETTINGS: PlatformSettings = {
  siteName: "Marketplace",
  contactEmail: "",
  defaultCommission: "15",
  currencyCode: "PKR",
  currencySymbol: "Rs",
  currencyRate: "1",
  defaultDeliveryCity: "Karachi",
  sellerPayoutHoldDays: "2",
};

export default function AdminSettingsPage() {
  const { user, loading: authLoading } = useAuthContext();
  const { toast } = useToast();
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadSettings = useCallback(async () => {
    const { data, error } = await supabase
      .from("system_settings")
      .select("key, value")
      .in("key", [
        "site_name",
        "contact_email",
        "default_commission_rate",
        "site_currency_code",
        "site_currency_symbol",
        "site_currency_rate",
        "default_delivery_city",
        "seller_payout_hold_days",
      ]);

    if (error) {
      toast({
        title: "Settings unavailable",
        description: error.message,
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    const values = new Map((data ?? []).map((setting) => [setting.key, setting.value]));
    setSettings({
      siteName: String(values.get("site_name") ?? DEFAULT_SETTINGS.siteName),
      contactEmail: String(values.get("contact_email") ?? DEFAULT_SETTINGS.contactEmail),
      defaultCommission: String(
        values.get("default_commission_rate") ?? DEFAULT_SETTINGS.defaultCommission
      ),
      currencyCode: String(values.get("site_currency_code") ?? DEFAULT_SETTINGS.currencyCode),
      currencySymbol: String(values.get("site_currency_symbol") ?? DEFAULT_SETTINGS.currencySymbol),
      currencyRate: String(values.get("site_currency_rate") ?? DEFAULT_SETTINGS.currencyRate),
      defaultDeliveryCity: String(
        values.get("default_delivery_city") ?? DEFAULT_SETTINGS.defaultDeliveryCity
      ),
      sellerPayoutHoldDays: String(
        values.get("seller_payout_hold_days") ?? DEFAULT_SETTINGS.sellerPayoutHoldDays
      ),
    });
    setLoading(false);
  }, [toast]);

  useEffect(() => {
    if (!authLoading && user) {
      loadSettings();
    }
  }, [authLoading, loadSettings, user]);

  const handleSave = async () => {
    const commission = Number(settings.defaultCommission);
    if (!Number.isFinite(commission) || commission < 0 || commission > 100) {
      toast({
        title: "Invalid commission",
        description: "Commission must be between 0 and 100 percent.",
        variant: "destructive",
      });
      return;
    }
    const currencyRate = Number(settings.currencyRate);
    if (!Number.isFinite(currencyRate) || currencyRate <= 0) {
      toast({
        title: "Invalid currency rate",
        description: "Currency display rate must be greater than 0.",
        variant: "destructive",
      });
      return;
    }
    const currency = currencyOptions.find((item) => item.code === settings.currencyCode);
    const payoutHoldDays = Number(settings.sellerPayoutHoldDays);
    if (!Number.isFinite(payoutHoldDays) || payoutHoldDays < 0 || payoutHoldDays > 30) {
      toast({
        title: "Invalid payout hold",
        description: "Seller payout hold must be between 0 and 30 days.",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from("system_settings")
        .upsert([
          {
            key: "site_name",
            value: settings.siteName,
            description: "Public marketplace name",
          },
          {
            key: "contact_email",
            value: settings.contactEmail,
            description: "Marketplace support email",
          },
          {
            key: "default_commission_rate",
            value: commission,
            description: "Commission percentage assigned to new sellers",
          },
          {
            key: "site_currency_code",
            value: currency?.code ?? settings.currencyCode,
            description: "Currency code displayed across the marketplace",
          },
          {
            key: "site_currency_symbol",
            value: settings.currencySymbol || currency?.symbol || "Rs",
            description: "Currency symbol displayed before marketplace prices",
          },
          {
            key: "site_currency_rate",
            value: currencyRate,
            description: "Display conversion rate applied to base product prices",
          },
          {
            key: "default_delivery_city",
            value: settings.defaultDeliveryCity,
            description: "Default customer delivery city shown in the header",
          },
          {
            key: "seller_payout_hold_days",
            value: Math.floor(payoutHoldDays),
            description: "Days after delivery before seller earnings become available",
          },
        ], { onConflict: "key" });

      if (error) throw error;

      toast({
        title: "Settings saved",
        description: "Platform settings were updated successfully.",
      });
      window.dispatchEvent(new Event("marketplace-settings-updated"));
    } catch (error) {
      toast({
        title: "Save failed",
        description: getErrorMessage(error, "Could not save platform settings."),
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <RoleGuard allowedRoles={["admin"]}>
      <AdminLayout>
        <div className="space-y-8">
          <div>
            <h1 className="text-3xl font-bold">Platform Settings</h1>
            <p className="text-muted-foreground">Manage operational marketplace defaults.</p>
          </div>

          {loading ? (
            <p className="py-16 text-center text-muted-foreground">Loading settings...</p>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <SettingsIcon className="h-5 w-5" /> General Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                <div>
                  <Label htmlFor="siteName">Marketplace Name</Label>
                  <Input
                    id="siteName"
                    value={settings.siteName}
                    onChange={(event) => setSettings((current) => ({
                      ...current,
                      siteName: event.target.value,
                    }))}
                  />
                </div>
                <div>
                  <Label htmlFor="contactEmail">Contact Email</Label>
                  <Input
                    id="contactEmail"
                    type="email"
                    value={settings.contactEmail}
                    onChange={(event) => setSettings((current) => ({
                      ...current,
                      contactEmail: event.target.value,
                    }))}
                  />
                </div>
                <div>
                  <Label htmlFor="defaultCommission">New Seller Commission (%)</Label>
                  <Input
                    id="defaultCommission"
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    value={settings.defaultCommission}
                    onChange={(event) => setSettings((current) => ({
                      ...current,
                      defaultCommission: event.target.value,
                    }))}
                  />
                </div>
                <div>
                  <Label htmlFor="sellerPayoutHoldDays">Seller Payout Hold After Delivery (days)</Label>
                  <Input
                    id="sellerPayoutHoldDays"
                    type="number"
                    min="0"
                    max="30"
                    step="1"
                    value={settings.sellerPayoutHoldDays}
                    onChange={(event) => setSettings((current) => ({
                      ...current,
                      sellerPayoutHoldDays: event.target.value,
                    }))}
                  />
                  <p className="mt-1 text-xs text-muted-foreground">
                    Delivered order earnings become withdrawable after this review window.
                  </p>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label htmlFor="currencyCode">Site Currency</Label>
                    <select
                      id="currencyCode"
                      value={settings.currencyCode}
                      onChange={(event) => {
                        const next = currencyOptions.find((item) => item.code === event.target.value);
                        setSettings((current) => ({
                          ...current,
                          currencyCode: event.target.value,
                          currencySymbol: next?.symbol ?? current.currencySymbol,
                        }));
                      }}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none ring-offset-background focus-visible:ring-1 focus-visible:ring-ring"
                    >
                      {currencyOptions.map((currency) => (
                        <option key={currency.code} value={currency.code}>
                          {currency.code} - {currency.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <Label htmlFor="currencySymbol">Currency Symbol / Prefix</Label>
                    <Input
                      id="currencySymbol"
                      value={settings.currencySymbol}
                      onChange={(event) => setSettings((current) => ({
                        ...current,
                        currencySymbol: event.target.value,
                      }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="currencyRate">Display Rate</Label>
                    <Input
                      id="currencyRate"
                      type="number"
                      min="0.0001"
                      step="0.0001"
                      value={settings.currencyRate}
                      onChange={(event) => setSettings((current) => ({
                        ...current,
                        currencyRate: event.target.value,
                      }))}
                    />
                    <p className="mt-1 text-xs text-muted-foreground">
                      1 base price unit x this rate = displayed customer price.
                    </p>
                  </div>
                  <div>
                    <Label htmlFor="defaultDeliveryCity">Default Delivery City</Label>
                    <select
                      id="defaultDeliveryCity"
                      value={settings.defaultDeliveryCity}
                      onChange={(event) => setSettings((current) => ({
                        ...current,
                        defaultDeliveryCity: event.target.value,
                      }))}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none ring-offset-background focus-visible:ring-1 focus-visible:ring-ring"
                    >
                      {pakistanMajorCities.map((city) => (
                        <option key={city} value={city}>
                          {city}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <Button onClick={handleSave} disabled={saving}>
                  <Save className="mr-2 h-4 w-4" />
                  {saving ? "Saving..." : "Save Settings"}
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </AdminLayout>
    </RoleGuard>
  );
}
