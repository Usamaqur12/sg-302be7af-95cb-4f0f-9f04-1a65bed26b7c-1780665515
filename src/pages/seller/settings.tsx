"use client";

import { SellerLayout } from "@/components/SellerLayout";
import { RoleGuard } from "@/components/RoleGuard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { Save, Store, Bell, CreditCard } from "lucide-react";

export default function SellerSettingsPage() {
  const { toast } = useToast();
  const [settings, setSettings] = useState({
    shopName: "TechGear Store",
    shopDescription: "Premium electronics and gadgets",
    businessEmail: "contact@techgear.com",
    businessPhone: "+1-555-0001",
    notifyNewOrder: true,
    notifyLowStock: true,
    notifyReview: true,
    autoApproveReturns: false,
  });

  const handleSave = () => {
    toast({
      title: "Settings Saved",
      description: "Your store settings have been updated successfully",
    });
  };

  return (
    <RoleGuard allowedRoles={["vendor"]}>
      <SellerLayout>
        <div className="space-y-8">
          <div>
            <h1 className="text-3xl font-bold font-serif mb-2">Store Settings</h1>
            <p className="text-muted-foreground">Manage your store configuration and preferences</p>
          </div>

          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Store className="h-5 w-5" />
                  Store Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="shopName">Store Name</Label>
                  <Input
                    id="shopName"
                    value={settings.shopName}
                    onChange={(e) => setSettings({ ...settings, shopName: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="shopDescription">Store Description</Label>
                  <Textarea
                    id="shopDescription"
                    value={settings.shopDescription}
                    onChange={(e) => setSettings({ ...settings, shopDescription: e.target.value })}
                    rows={3}
                  />
                </div>
                <div>
                  <Label htmlFor="businessEmail">Business Email</Label>
                  <Input
                    id="businessEmail"
                    type="email"
                    value={settings.businessEmail}
                    onChange={(e) => setSettings({ ...settings, businessEmail: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="businessPhone">Business Phone</Label>
                  <Input
                    id="businessPhone"
                    type="tel"
                    value={settings.businessPhone}
                    onChange={(e) => setSettings({ ...settings, businessPhone: e.target.value })}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  Notifications
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>New Order Notifications</Label>
                    <p className="text-sm text-muted-foreground">Receive alerts for new orders</p>
                  </div>
                  <Switch
                    checked={settings.notifyNewOrder}
                    onCheckedChange={(checked) => setSettings({ ...settings, notifyNewOrder: checked })}
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Low Stock Alerts</Label>
                    <p className="text-sm text-muted-foreground">Get notified when inventory is low</p>
                  </div>
                  <Switch
                    checked={settings.notifyLowStock}
                    onCheckedChange={(checked) => setSettings({ ...settings, notifyLowStock: checked })}
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Review Notifications</Label>
                    <p className="text-sm text-muted-foreground">Be notified of new customer reviews</p>
                  </div>
                  <Switch
                    checked={settings.notifyReview}
                    onCheckedChange={(checked) => setSettings({ ...settings, notifyReview: checked })}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Return Policy
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Auto-Approve Returns</Label>
                    <p className="text-sm text-muted-foreground">
                      Automatically approve return requests without manual review
                    </p>
                  </div>
                  <Switch
                    checked={settings.autoApproveReturns}
                    onCheckedChange={(checked) => setSettings({ ...settings, autoApproveReturns: checked })}
                  />
                </div>
              </CardContent>
            </Card>

            <Button onClick={handleSave} size="lg">
              <Save className="mr-2 h-4 w-4" />
              Save Settings
            </Button>
          </div>
        </div>
      </SellerLayout>
    </RoleGuard>
  );
}