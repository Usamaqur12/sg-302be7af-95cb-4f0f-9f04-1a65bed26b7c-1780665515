"use client";

import { AdminLayout } from "@/components/AdminLayout";
import { DocumentPreviewTile } from "@/components/DocumentPreviewTile";
import { RoleGuard } from "@/components/RoleGuard";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuthContext } from "@/contexts/AuthContext";
import { useMarketplaceSettings } from "@/contexts/MarketplaceSettingsContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/database.types";
import {
  Ban,
  CheckCircle,
  Clock,
  Eye,
  Loader2,
  Mail,
  Search,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

type SellerProfile = Database["public"]["Tables"]["seller_profiles"]["Row"];
type SellerStatus = Database["public"]["Enums"]["seller_status"];
type SellerFilter = SellerStatus | "all";

interface SellerWithProfile extends SellerProfile {
  profiles: {
    email: string | null;
    full_name: string | null;
  } | null;
}

function sellerDocuments(seller: SellerWithProfile) {
  return [
    { label: "KYC Document", href: seller.kyc_document_url },
    { label: "CNIC Front", href: seller.cnic_front_url },
    { label: "CNIC Back", href: seller.cnic_back_url },
    { label: "Business Registration", href: seller.business_registration_url },
    { label: "Tax Certificate", href: seller.tax_certificate_url },
    { label: "Bank Proof", href: seller.bank_statement_url },
    { label: "Brand Authorization", href: seller.brand_authorization_url },
  ].filter((item): item is { label: string; href: string } => Boolean(item.href));
}

function sellerKycStatus(seller: SellerWithProfile) {
  const required = [
    { label: "Owner name", ok: Boolean(seller.owner_full_name || seller.profiles?.full_name) },
    { label: "CNIC / Passport number", ok: Boolean(seller.owner_cnic) },
    { label: "CNIC front", ok: Boolean(seller.cnic_front_url) },
    { label: "CNIC back", ok: Boolean(seller.cnic_back_url) },
    { label: "Pickup address", ok: Boolean(seller.pickup_address || seller.business_address) },
    { label: "Return address", ok: Boolean(seller.return_address || seller.business_address) },
    { label: "Bank name", ok: Boolean(seller.bank_name) },
    { label: "Bank account", ok: Boolean(seller.bank_account_number) },
  ];
  const missing = required.filter((item) => !item.ok).map((item) => item.label);
  const completeCount = required.length - missing.length;
  return { completeCount, total: required.length, missing };
}

export default function AdminSellersPage() {
  const { user, loading: authLoading } = useAuthContext();
  const { formatPrice } = useMarketplaceSettings();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [updatingSellerId, setUpdatingSellerId] = useState<string | null>(null);
  const [sellers, setSellers] = useState<SellerWithProfile[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState<SellerFilter>("all");

  const loadSellers = useCallback(async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from("seller_profiles")
        .select(`
          *,
          profiles:user_id (
            email,
            full_name
          )
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setSellers((data ?? []) as unknown as SellerWithProfile[]);
    } catch {
      toast({
        title: "Error",
        description: "Could not load sellers",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    if (authLoading || !user) return;
    loadSellers();
  }, [authLoading, loadSellers, user]);

  const updateSellerStatus = async (
    seller: SellerWithProfile,
    status: SellerStatus
  ) => {
    setUpdatingSellerId(seller.id);

    const update: Database["public"]["Tables"]["seller_profiles"]["Update"] = {
      status,
      verified_at: status === "approved" ? new Date().toISOString() : null,
    };

    const { error } = await supabase
      .from("seller_profiles")
      .update(update)
      .eq("id", seller.id);

    if (error) {
      toast({
        title: "Action Failed",
        description: `Could not mark ${seller.business_name} as ${status}`,
        variant: "destructive",
      });
    } else {
      setSellers((current) =>
        current.map((item) =>
          item.id === seller.id ? { ...item, ...update } : item
        )
      );
      toast({
        title: "Seller Updated",
        description: `${seller.business_name} is now ${status}`,
      });
    }

    setUpdatingSellerId(null);
  };

  const normalizedSearch = searchQuery.trim().toLowerCase();
  const filteredSellers = sellers.filter((seller) => {
    const status = seller.status ?? "pending";
    const matchesSearch =
      !normalizedSearch ||
      seller.business_name.toLowerCase().includes(normalizedSearch) ||
      seller.business_email?.toLowerCase().includes(normalizedSearch) ||
      seller.profiles?.email?.toLowerCase().includes(normalizedSearch);
    const matchesFilter = filter === "all" || status === filter;

    return matchesSearch && matchesFilter;
  });

  const statusCounts = {
    all: sellers.length,
    pending: sellers.filter((seller) => (seller.status ?? "pending") === "pending")
      .length,
    approved: sellers.filter((seller) => seller.status === "approved").length,
    rejected: sellers.filter((seller) => seller.status === "rejected").length,
    suspended: sellers.filter((seller) => seller.status === "suspended").length,
  };

  return (
    <RoleGuard allowedRoles={["admin"]}>
      <AdminLayout>
        <div className="space-y-8">
          <div>
            <h1 className="text-3xl font-bold font-serif mb-2">Seller Management</h1>
            <p className="text-muted-foreground">
              Approve, reject, or suspend seller accounts
            </p>
          </div>

          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by business name or email..."
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                    className="pl-10"
                  />
                </div>

                <Tabs
                  value={filter}
                  onValueChange={(value) => setFilter(value as SellerFilter)}
                >
                  <TabsList className="h-auto flex-wrap justify-start">
                    <TabsTrigger value="all">All ({statusCounts.all})</TabsTrigger>
                    <TabsTrigger value="pending">
                      Pending ({statusCounts.pending})
                    </TabsTrigger>
                    <TabsTrigger value="approved">
                      Approved ({statusCounts.approved})
                    </TabsTrigger>
                    <TabsTrigger value="rejected">
                      Rejected ({statusCounts.rejected})
                    </TabsTrigger>
                    <TabsTrigger value="suspended">
                      Suspended ({statusCounts.suspended})
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
            </CardContent>
          </Card>

          {loading ? (
            <div className="flex items-center justify-center py-24">
              <Loader2 className="h-12 w-12 animate-spin text-muted-foreground" />
            </div>
          ) : filteredSellers.length > 0 ? (
            <div className="grid gap-6">
              {filteredSellers.map((seller) => {
                const status = seller.status ?? "pending";
                const email = seller.business_email || seller.profiles?.email;
                const disabled = updatingSellerId === seller.id;
                const kycStatus = sellerKycStatus(seller);
                const docs = sellerDocuments(seller);

                return (
                  <Card key={seller.id}>
                    <CardContent className="p-6">
                      <div className="flex flex-col md:flex-row md:items-start gap-6">
                        <div className="flex-1 space-y-4">
                          <div>
                            <h3 className="text-xl font-semibold mb-1">
                              {seller.business_name}
                            </h3>
                            <p className="text-sm text-muted-foreground">
                              {email || "No email"} -{" "}
                              {seller.profiles?.full_name || "No owner name"}
                            </p>
                          </div>

                          <SellerStatusBadge status={status} />
                          <Badge
                            variant={kycStatus.missing.length ? "secondary" : "outline"}
                            className="w-fit"
                          >
                            KYC {kycStatus.completeCount}/{kycStatus.total}
                          </Badge>

                          <div className="grid md:grid-cols-3 gap-4 text-sm">
                            <div>
                              <p className="text-muted-foreground">Commission Rate</p>
                              <p className="font-medium">
                                {seller.commission_rate ?? 15}%
                              </p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Total Sales</p>
                              <p className="font-medium font-mono">
                                {formatPrice(seller.total_sales ?? 0)}
                              </p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Registered</p>
                              <p className="font-medium">
                                {seller.created_at
                                  ? new Date(seller.created_at).toLocaleDateString()
                                  : "Unknown"}
                              </p>
                            </div>
                          </div>

                          <div>
                            <p className="text-sm text-muted-foreground mb-1">
                              Description
                            </p>
                            <p className="text-sm">
                              {seller.business_description || "No description provided"}
                            </p>
                          </div>

                          <div>
                            <p className="text-sm text-muted-foreground mb-1">
                              Business Address
                            </p>
                            <p className="text-sm">
                              {seller.business_address || "No address provided"}
                            </p>
                          </div>

                          <div className="grid gap-4 rounded-md border bg-muted/30 p-4 text-sm md:grid-cols-2 xl:grid-cols-3">
                            <div>
                              <p className="text-muted-foreground">Owner / Authorized Person</p>
                              <p className="font-medium">{seller.owner_full_name || "Not provided"}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">CNIC / Passport</p>
                              <p className="font-medium">{seller.owner_cnic || "Not provided"}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Business Phone</p>
                              <p className="font-medium">{seller.business_phone || "Not provided"}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Bank</p>
                              <p className="font-medium">{seller.bank_name || "Not provided"}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Account Holder</p>
                              <p className="font-medium">{seller.bank_account_name || "Not provided"}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Account Number</p>
                              <p className="font-medium">{seller.bank_account_number || "Not provided"}</p>
                            </div>
                            <div className="xl:col-span-3">
                              <p className="text-muted-foreground">Pickup Address</p>
                              <p className="font-medium">{seller.pickup_address || "Not provided"}</p>
                            </div>
                            <div className="xl:col-span-3">
                              <p className="text-muted-foreground">Return Address</p>
                              <p className="font-medium">{seller.return_address || "Not provided"}</p>
                            </div>
                          </div>

                          <div className="rounded-md border p-4">
                            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                              <div>
                                <p className="font-semibold">KYC Documents</p>
                                <p className="text-sm text-muted-foreground">
                                  CNIC, business, tax and bank proof visible to admin.
                                </p>
                              </div>
                              {seller.tax_id && (
                                <Badge variant="outline">Tax ID: {seller.tax_id}</Badge>
                              )}
                            </div>
                            <div className="mb-4 rounded-md bg-muted p-3 text-sm">
                              {kycStatus.missing.length === 0 ? (
                                <p className="font-medium text-green-700">Required KYC is complete.</p>
                              ) : (
                                <>
                                  <p className="font-medium">Missing before strong approval:</p>
                                  <p className="mt-1 text-muted-foreground">{kycStatus.missing.join(", ")}</p>
                                </>
                              )}
                            </div>

                            {docs.length > 0 ? (
                              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                                {docs.map((document) => (
                                  <DocumentPreviewTile
                                    key={document.label}
                                    url={document.href}
                                    label={document.label}
                                  />
                                ))}
                              </div>
                            ) : (
                              <p className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
                                No KYC files uploaded yet.
                              </p>
                            )}

                            {(seller.logo_url || seller.banner_url) && (
                              <div className="mt-4 flex flex-wrap gap-2 text-sm">
                                {seller.logo_url && (
                                  <a
                                    href={seller.logo_url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="font-medium text-primary hover:underline"
                                  >
                                    View logo
                                  </a>
                                )}
                                {seller.banner_url && (
                                  <a
                                    href={seller.banner_url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="font-medium text-primary hover:underline"
                                  >
                                    View banner
                                  </a>
                                )}
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex flex-col gap-2 min-w-40">
                          {status === "pending" && (
                            <>
                              <Button
                                onClick={() => updateSellerStatus(seller, "approved")}
                                disabled={disabled}
                              >
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Approve
                              </Button>
                              <Button
                                variant="destructive"
                                onClick={() => updateSellerStatus(seller, "rejected")}
                                disabled={disabled}
                              >
                                <XCircle className="h-4 w-4 mr-2" />
                                Reject
                              </Button>
                            </>
                          )}

                          {status === "approved" && (
                            <Button
                              variant="destructive"
                              onClick={() => updateSellerStatus(seller, "suspended")}
                              disabled={disabled}
                            >
                              <Ban className="h-4 w-4 mr-2" />
                              Suspend
                            </Button>
                          )}

                          {(status === "rejected" || status === "suspended") && (
                            <Button
                              onClick={() => updateSellerStatus(seller, "approved")}
                              disabled={disabled}
                            >
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Activate
                            </Button>
                          )}

                          <Button variant="outline" asChild>
                            <Link href={`/sellers/${seller.id}`}>
                              <Eye className="h-4 w-4 mr-2" />
                              View Store
                            </Link>
                          </Button>

                          {email && (
                            <Button variant="outline" asChild>
                              <a href={`mailto:${email}`}>
                                <Mail className="h-4 w-4 mr-2" />
                                Contact
                              </a>
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <Card>
              <CardContent className="text-center py-12">
                <p className="text-muted-foreground">No sellers found</p>
              </CardContent>
            </Card>
          )}
        </div>
      </AdminLayout>
    </RoleGuard>
  );
}

function SellerStatusBadge({ status }: { status: SellerStatus }) {
  if (status === "approved") {
    return (
      <Badge className="bg-green-500/10 text-green-700">
        <CheckCircle className="h-3 w-3 mr-1" />
        Approved
      </Badge>
    );
  }

  if (status === "rejected") {
    return (
      <Badge variant="destructive">
        <XCircle className="h-3 w-3 mr-1" />
        Rejected
      </Badge>
    );
  }

  if (status === "suspended") {
    return (
      <Badge variant="destructive">
        <Ban className="h-3 w-3 mr-1" />
        Suspended
      </Badge>
    );
  }

  return (
    <Badge variant="secondary">
      <Clock className="h-3 w-3 mr-1" />
      Pending Approval
    </Badge>
  );
}
