"use client";

import { AdminLayout } from "@/components/AdminLayout";
import { RoleGuard } from "@/components/RoleGuard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { Settings as SettingsIcon, Save } from "lucide-react";

export default function AdminSettingsPage() {
  const { toast } = useToast();
  const [settings, setSettings] = useState({
    siteName: "Marketplace",
    siteEmail: "admin@marketplace.com",
    defaultCommission: "12",
    maintenanceMode: false,
    allowNewVendors: true,
    requireVendorApproval: true,
    autoApproveProducts: false,
  });

  const handleSave = () => {
    toast({
      title: "Settings Saved",
      description: "Platform settings have been updated successfully",
    });
  };

  return (
    <RoleGuard allowedRoles={["admin"]}>
      <AdminLayout>
        <div className="space-y-8">
          <div>
            <h1 className="text-3xl font-bold font-serif mb-2">Platform Settings</h1>
            <p className="text-muted-foreground">Configure marketplace platform settings</p>
          </div>

          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle>General Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="siteName">Site Name</Label>
                  <Input
                    id="siteName"
                    value={settings.siteName}
                    onChange={(e) => setSettings({ ...settings, siteName: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="siteEmail">Contact Email</Label>
                  <Input
                    id="siteEmail"
                    type="email"
                    value={settings.siteEmail}
                    onChange={(e) => setSettings({ ...settings, siteEmail: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="defaultCommission">Default Commission Rate (%)</Label>
                  <Input
                    id="defaultCommission"
                    type="number"
                    value={settings.defaultCommission}
                    onChange={(e) => setSettings({ ...settings, defaultCommission: e.target.value })}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Vendor Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Allow New Vendor Registration</Label>
                    <p className="text-sm text-muted-foreground">Enable or disable new vendor signups</p>
                  </div>
                  <Switch
                    checked={settings.allowNewVendors}
                    onCheckedChange={(checked) => setSettings({ ...settings, allowNewVendors: checked })}
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Require Vendor Approval</Label>
                    <p className="text-sm text-muted-foreground">New vendors need admin approval before selling</p>
                  </div>
                  <Switch
                    checked={settings.requireVendorApproval}
                    onCheckedChange={(checked) => setSettings({ ...settings, requireVendorApproval: checked })}
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Auto-Approve Products</Label>
                    <p className="text-sm text-muted-foreground">Products go live immediately without moderation</p>
                  </div>
                  <Switch
                    checked={settings.autoApproveProducts}
                    onCheckedChange={(checked) => setSettings({ ...settings, autoApproveProducts: checked })}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Maintenance Mode</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Enable Maintenance Mode</Label>
                    <p className="text-sm text-muted-foreground">
                      Site will be unavailable to customers during maintenance
                    </p>
                  </div>
                  <Switch
                    checked={settings.maintenanceMode}
                    onCheckedChange={(checked) => setSettings({ ...settings, maintenanceMode: checked })}
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
      </AdminLayout>
    </RoleGuard>
  );
}