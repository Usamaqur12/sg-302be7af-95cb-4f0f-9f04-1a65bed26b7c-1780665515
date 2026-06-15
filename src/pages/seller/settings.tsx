"use client";

import { useCallback, useEffect, useState } from "react";
import type { ChangeEvent } from "react";
import Image from "next/image";
import { CreditCard, ImageUp, Save, Store } from "lucide-react";
import { DocumentPreviewTile } from "@/components/DocumentPreviewTile";
import { SellerLayout } from "@/components/SellerLayout";
import { RoleGuard } from "@/components/RoleGuard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuthContext } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { getErrorMessage } from "@/lib/errors";
import { uploadFile, type UploadScope } from "@/lib/uploads";

interface SellerSettings {
  business_name: string;
  business_description: string;
  business_address: string;
  business_email: string;
  business_phone: string;
  logo_url: string;
  banner_url: string;
  kyc_document_url: string;
  kyc_document_type: string;
  tax_id: string;
  owner_full_name: string;
  owner_cnic: string;
  cnic_front_url: string;
  cnic_back_url: string;
  business_registration_url: string;
  tax_certificate_url: string;
  bank_statement_url: string;
  brand_authorization_url: string;
  pickup_address: string;
  return_address: string;
  bank_account_name: string;
  bank_account_number: string;
  bank_name: string;
}

const EMPTY_SETTINGS: SellerSettings = {
  business_name: "",
  business_description: "",
  business_address: "",
  business_email: "",
  business_phone: "",
  logo_url: "",
  banner_url: "",
  kyc_document_url: "",
  kyc_document_type: "",
  tax_id: "",
  owner_full_name: "",
  owner_cnic: "",
  cnic_front_url: "",
  cnic_back_url: "",
  business_registration_url: "",
  tax_certificate_url: "",
  bank_statement_url: "",
  brand_authorization_url: "",
  pickup_address: "",
  return_address: "",
  bank_account_name: "",
  bank_account_number: "",
  bank_name: "",
};

export default function SellerSettingsPage() {
  const { user, loading: authLoading } = useAuthContext();
  const { toast } = useToast();
  const [settings, setSettings] = useState(EMPTY_SETTINGS);
  const [sellerId, setSellerId] = useState("");
  const [status, setStatus] = useState("pending");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingField, setUploadingField] = useState<keyof SellerSettings | null>(null);

  const loadSettings = useCallback(async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from("seller_profiles")
      .select(`
        id,
        status,
        business_name,
        business_description,
        business_address,
        business_email,
        business_phone,
        logo_url,
        banner_url,
        kyc_document_url,
        kyc_document_type,
        tax_id,
        owner_full_name,
        owner_cnic,
        cnic_front_url,
        cnic_back_url,
        business_registration_url,
        tax_certificate_url,
        bank_statement_url,
        brand_authorization_url,
        pickup_address,
        return_address,
        bank_account_name,
        bank_account_number,
        bank_name
      `)
      .eq("user_id", user.id)
      .maybeSingle();

    if (error || !data) {
      toast({
        title: "Seller profile unavailable",
        description: error?.message || "Complete seller registration first.",
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    setSellerId(data.id);
    setStatus(data.status ?? "pending");
    setSettings({
      business_name: data.business_name,
      business_description: data.business_description ?? "",
      business_address: data.business_address ?? "",
      business_email: data.business_email ?? "",
      business_phone: data.business_phone ?? "",
      logo_url: data.logo_url ?? "",
      banner_url: data.banner_url ?? "",
      kyc_document_url: data.kyc_document_url ?? "",
      kyc_document_type: data.kyc_document_type ?? "",
      tax_id: data.tax_id ?? "",
      owner_full_name: data.owner_full_name ?? "",
      owner_cnic: data.owner_cnic ?? "",
      cnic_front_url: data.cnic_front_url ?? "",
      cnic_back_url: data.cnic_back_url ?? "",
      business_registration_url: data.business_registration_url ?? "",
      tax_certificate_url: data.tax_certificate_url ?? "",
      bank_statement_url: data.bank_statement_url ?? "",
      brand_authorization_url: data.brand_authorization_url ?? "",
      pickup_address: data.pickup_address ?? "",
      return_address: data.return_address ?? "",
      bank_account_name: data.bank_account_name ?? "",
      bank_account_number: data.bank_account_number ?? "",
      bank_name: data.bank_name ?? "",
    });
    setLoading(false);
  }, [toast, user]);

  useEffect(() => {
    if (!authLoading && user) {
      loadSettings();
    }
  }, [authLoading, loadSettings, user]);

  const updateField = (field: keyof SellerSettings, value: string) => {
    setSettings((current) => ({ ...current, [field]: value }));
  };

  const handleUpload = async (
    event: ChangeEvent<HTMLInputElement>,
    field: keyof SellerSettings,
    scope: UploadScope
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadingField(field);
    try {
      const url = await uploadFile(file, scope);
      setSettings((current) => ({
        ...current,
        [field]: url,
        ...(field === "kyc_document_url" ? { kyc_document_type: file.type || "document" } : {}),
      }));
      toast({
        title: "Upload complete",
        description: "The file has been saved to your seller profile.",
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

  const handleSave = async () => {
    if (!sellerId || !settings.business_name.trim()) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from("seller_profiles")
        .update(settings)
        .eq("id", sellerId);

      if (error) throw error;

      toast({
        title: "Settings saved",
        description: "Your store and payout information has been updated.",
      });
    } catch (error) {
      toast({
        title: "Save failed",
        description: getErrorMessage(error, "Could not save seller settings."),
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <RoleGuard allowedRoles={["seller"]}>
      <SellerLayout>
        <div className="space-y-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-3xl font-bold">Store Settings</h1>
              <p className="text-muted-foreground">Manage public store and payout details.</p>
            </div>
            <Badge variant={status === "approved" ? "default" : "secondary"}>
              {status}
            </Badge>
          </div>

          {loading ? (
            <p className="py-16 text-center text-muted-foreground">Loading settings...</p>
          ) : (
            <>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Store className="h-5 w-5" /> Store Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4 md:grid-cols-2">
                  <div className="md:col-span-2">
                    <Label htmlFor="business_name">Business Name</Label>
                    <Input
                      id="business_name"
                      value={settings.business_name}
                      onChange={(event) => updateField("business_name", event.target.value)}
                      required
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Label htmlFor="business_description">Description</Label>
                    <Textarea
                      id="business_description"
                      value={settings.business_description}
                      onChange={(event) => updateField("business_description", event.target.value)}
                      rows={4}
                    />
                  </div>
                  <div>
                    <Label htmlFor="business_email">Business Email</Label>
                    <Input
                      id="business_email"
                      type="email"
                      value={settings.business_email}
                      onChange={(event) => updateField("business_email", event.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="business_phone">Business Phone</Label>
                    <Input
                      id="business_phone"
                      value={settings.business_phone}
                      onChange={(event) => updateField("business_phone", event.target.value)}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Label htmlFor="business_address">Business Address</Label>
                    <Textarea
                      id="business_address"
                      value={settings.business_address}
                      onChange={(event) => updateField("business_address", event.target.value)}
                      rows={3}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ImageUp className="h-5 w-5" /> Store Assets & KYC
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid gap-5 md:grid-cols-2">
                  <div>
                    <Label htmlFor="logo_upload">Seller Logo</Label>
                    <Input
                      id="logo_upload"
                      type="file"
                      accept="image/*"
                      disabled={uploadingField === "logo_url"}
                      onChange={(event) => handleUpload(event, "logo_url", "seller-logo")}
                    />
                    {settings.logo_url && (
                      <div className="relative mt-3 h-24 w-24 overflow-hidden rounded-md border bg-muted">
                        <Image src={settings.logo_url} alt="Seller logo" fill className="object-cover" unoptimized />
                      </div>
                    )}
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
                    {settings.banner_url && (
                      <div className="relative mt-3 aspect-[5/2] overflow-hidden rounded-md border bg-muted">
                        <Image src={settings.banner_url} alt="Store banner" fill className="object-cover" unoptimized />
                      </div>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="tax_id">Tax ID / NTN</Label>
                    <Input
                      id="tax_id"
                      value={settings.tax_id}
                      onChange={(event) => updateField("tax_id", event.target.value)}
                    />
                  </div>

                  <div>
                    <Label htmlFor="owner_full_name">Owner / Authorized Person Name</Label>
                    <Input
                      id="owner_full_name"
                      value={settings.owner_full_name}
                      onChange={(event) => updateField("owner_full_name", event.target.value)}
                    />
                  </div>

                  <div>
                    <Label htmlFor="owner_cnic">CNIC / Passport Number</Label>
                    <Input
                      id="owner_cnic"
                      value={settings.owner_cnic}
                      onChange={(event) => updateField("owner_cnic", event.target.value)}
                    />
                  </div>

                  <div className="md:col-span-2">
                    <Label htmlFor="pickup_address">Pickup Address</Label>
                    <Textarea
                      id="pickup_address"
                      value={settings.pickup_address}
                      onChange={(event) => updateField("pickup_address", event.target.value)}
                      rows={3}
                    />
                  </div>

                  <div className="md:col-span-2">
                    <Label htmlFor="return_address">Return Address</Label>
                    <Textarea
                      id="return_address"
                      value={settings.return_address}
                      onChange={(event) => updateField("return_address", event.target.value)}
                      rows={3}
                    />
                  </div>

                  <div>
                    <Label htmlFor="cnic_front_upload">CNIC Front</Label>
                    <Input
                      id="cnic_front_upload"
                      type="file"
                      accept="image/*,application/pdf"
                      disabled={uploadingField === "cnic_front_url"}
                      onChange={(event) => handleUpload(event, "cnic_front_url", "kyc")}
                    />
                    {settings.cnic_front_url && (
                      <DocumentPreviewTile url={settings.cnic_front_url} label="CNIC front" className="mt-3" />
                    )}
                  </div>

                  <div>
                    <Label htmlFor="cnic_back_upload">CNIC Back</Label>
                    <Input
                      id="cnic_back_upload"
                      type="file"
                      accept="image/*,application/pdf"
                      disabled={uploadingField === "cnic_back_url"}
                      onChange={(event) => handleUpload(event, "cnic_back_url", "kyc")}
                    />
                    {settings.cnic_back_url && (
                      <DocumentPreviewTile url={settings.cnic_back_url} label="CNIC back" className="mt-3" />
                    )}
                  </div>

                  <div>
                    <Label htmlFor="business_registration_upload">Business Registration / Trade License</Label>
                    <Input
                      id="business_registration_upload"
                      type="file"
                      accept="image/*,application/pdf"
                      disabled={uploadingField === "business_registration_url"}
                      onChange={(event) => handleUpload(event, "business_registration_url", "kyc")}
                    />
                    {settings.business_registration_url && (
                      <DocumentPreviewTile
                        url={settings.business_registration_url}
                        label="Business registration"
                        className="mt-3"
                      />
                    )}
                  </div>

                  <div>
                    <Label htmlFor="tax_certificate_upload">NTN / Tax Certificate</Label>
                    <Input
                      id="tax_certificate_upload"
                      type="file"
                      accept="image/*,application/pdf"
                      disabled={uploadingField === "tax_certificate_url"}
                      onChange={(event) => handleUpload(event, "tax_certificate_url", "kyc")}
                    />
                    {settings.tax_certificate_url && (
                      <DocumentPreviewTile
                        url={settings.tax_certificate_url}
                        label="Tax certificate"
                        className="mt-3"
                      />
                    )}
                  </div>

                  <div>
                    <Label htmlFor="bank_statement_upload">Bank Statement / Account Proof</Label>
                    <Input
                      id="bank_statement_upload"
                      type="file"
                      accept="image/*,application/pdf"
                      disabled={uploadingField === "bank_statement_url"}
                      onChange={(event) => handleUpload(event, "bank_statement_url", "kyc")}
                    />
                    {settings.bank_statement_url && (
                      <DocumentPreviewTile
                        url={settings.bank_statement_url}
                        label="Bank proof"
                        className="mt-3"
                      />
                    )}
                  </div>

                  <div>
                    <Label htmlFor="brand_authorization_upload">Brand Authorization / Letterhead</Label>
                    <Input
                      id="brand_authorization_upload"
                      type="file"
                      accept="image/*,application/pdf"
                      disabled={uploadingField === "brand_authorization_url"}
                      onChange={(event) => handleUpload(event, "brand_authorization_url", "kyc")}
                    />
                    {settings.brand_authorization_url && (
                      <DocumentPreviewTile
                        url={settings.brand_authorization_url}
                        label="Authorization document"
                        className="mt-3"
                      />
                    )}
                  </div>

                  <div className="md:col-span-2">
                    <Label htmlFor="kyc_upload">Extra KYC Document</Label>
                    <Input
                      id="kyc_upload"
                      type="file"
                      accept="image/*,application/pdf"
                      disabled={uploadingField === "kyc_document_url"}
                      onChange={(event) => handleUpload(event, "kyc_document_url", "kyc")}
                    />
                    {settings.kyc_document_url && (
                      <DocumentPreviewTile
                        url={settings.kyc_document_url}
                        label="Uploaded KYC document"
                        className="mt-3"
                      />
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5" /> Payout Account
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label htmlFor="bank_account_name">Account Holder</Label>
                    <Input
                      id="bank_account_name"
                      value={settings.bank_account_name}
                      onChange={(event) => updateField("bank_account_name", event.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="bank_name">Bank Name</Label>
                    <Input
                      id="bank_name"
                      value={settings.bank_name}
                      onChange={(event) => updateField("bank_name", event.target.value)}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Label htmlFor="bank_account_number">Account Number</Label>
                    <Input
                      id="bank_account_number"
                      value={settings.bank_account_number}
                      onChange={(event) => updateField("bank_account_number", event.target.value)}
                    />
                  </div>
                </CardContent>
              </Card>

              <Button onClick={handleSave} size="lg" disabled={saving || !sellerId}>
                <Save className="mr-2 h-4 w-4" />
                {saving ? "Saving..." : "Save Settings"}
              </Button>
            </>
          )}
        </div>
      </SellerLayout>
    </RoleGuard>
  );
}
