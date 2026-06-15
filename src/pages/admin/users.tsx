"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Eye, Loader2, Mail, Plus, Search, ShieldCheck, UserRound } from "lucide-react";
import { AdminLayout } from "@/components/AdminLayout";
import { DocumentPreviewTile } from "@/components/DocumentPreviewTile";
import { RoleGuard } from "@/components/RoleGuard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuthContext } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/database.types";
import { getErrorMessage } from "@/lib/errors";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];
type SellerProfile = Database["public"]["Tables"]["seller_profiles"]["Row"];
type UserRole = NonNullable<Profile["role"]>;
type UserFilter = UserRole | "all";

interface UserForm {
  full_name: string;
  email: string;
  phone: string;
  password: string;
  role: Exclude<UserRole, "admin">;
  business_name: string;
  cnic_number: string;
  kyc_document_url: string;
}

const EMPTY_FORM: UserForm = {
  full_name: "",
  email: "",
  phone: "",
  password: "",
  role: "customer",
  business_name: "",
  cnic_number: "",
  kyc_document_url: "",
};

const roleColors: Record<UserRole, string> = {
  admin: "bg-red-500/10 text-red-700",
  manager: "bg-amber-500/10 text-amber-700",
  warehouse: "bg-emerald-500/10 text-emerald-700",
  seller: "bg-purple-500/10 text-purple-700",
  customer: "bg-blue-500/10 text-blue-700",
};

function kycLinks(user: Profile, seller?: SellerProfile | null) {
  const links = [
    { label: "Profile CNIC front", href: user.cnic_front_url },
    { label: "Profile CNIC back", href: user.cnic_back_url },
    { label: "Profile KYC document", href: user.kyc_document_url },
    { label: "Seller CNIC front", href: seller?.cnic_front_url },
    { label: "Seller CNIC back", href: seller?.cnic_back_url },
    { label: "Seller KYC document", href: seller?.kyc_document_url },
    { label: "Business registration", href: seller?.business_registration_url },
    { label: "Tax certificate", href: seller?.tax_certificate_url },
    { label: "Bank proof", href: seller?.bank_statement_url },
    { label: "Brand authorization", href: seller?.brand_authorization_url },
  ];
  const seen = new Set<string>();
  return links.filter((item): item is { label: string; href: string } => {
    if (!item.href || seen.has(item.href)) return false;
    seen.add(item.href);
    return true;
  });
}

export default function AdminUsersPage() {
  const { user: currentUser } = useAuthContext();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [users, setUsers] = useState<Profile[]>([]);
  const [sellerProfilesByUser, setSellerProfilesByUser] = useState<Map<string, SellerProfile>>(new Map());
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState<UserFilter>("all");
  const [form, setForm] = useState<UserForm>(EMPTY_FORM);

  const loadUsers = useCallback(async () => {
    try {
      setLoading(true);
      const [profilesResult, sellersResult] = await Promise.all([
        supabase
          .from("profiles")
          .select("*")
          .order("created_at", { ascending: false }),
        supabase
          .from("seller_profiles")
          .select(`
            id,
            user_id,
            business_name,
            status,
            owner_cnic,
            cnic_front_url,
            cnic_back_url,
            kyc_document_url,
            business_registration_url,
            tax_certificate_url,
            bank_statement_url,
            brand_authorization_url
          `),
      ]);

      if (profilesResult.error) throw profilesResult.error;
      if (sellersResult.error) throw sellersResult.error;

      setUsers(profilesResult.data || []);
      setSellerProfilesByUser(
        new Map(((sellersResult.data || []) as unknown as SellerProfile[]).map((seller) => [seller.user_id, seller]))
      );
    } catch {
      toast({
        title: "Error",
        description: "Could not load users",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const counts = useMemo(() => ({
    all: users.length,
    customer: users.filter((item) => item.role === "customer").length,
    seller: users.filter((item) => item.role === "seller").length,
    manager: users.filter((item) => item.role === "manager").length,
    warehouse: users.filter((item) => item.role === "warehouse").length,
    admin: users.filter((item) => item.role === "admin").length,
  }), [users]);

  const kycCounts = useMemo(() => {
    let withDocs = 0;
    let missingDocs = 0;
    for (const profile of users) {
      const seller = sellerProfilesByUser.get(profile.id);
      if (kycLinks(profile, seller).length > 0) withDocs += 1;
      else missingDocs += 1;
    }
    return { withDocs, missingDocs };
  }, [sellerProfilesByUser, users]);

  const filteredUsers = users.filter((profile) => {
    const normalizedSearch = searchQuery.trim().toLowerCase();
    const matchesRole = filter === "all" || profile.role === filter;
    const seller = sellerProfilesByUser.get(profile.id);
    const matchesSearch =
      !normalizedSearch ||
      profile.full_name?.toLowerCase().includes(normalizedSearch) ||
      profile.email?.toLowerCase().includes(normalizedSearch) ||
      profile.phone?.toLowerCase().includes(normalizedSearch) ||
      profile.cnic_number?.toLowerCase().includes(normalizedSearch) ||
      seller?.business_name?.toLowerCase().includes(normalizedSearch) ||
      seller?.owner_cnic?.toLowerCase().includes(normalizedSearch);
    return matchesRole && matchesSearch;
  });

  const createUser = async () => {
    setCreating(true);
    try {
      const response = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(form),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || "Could not create user");
      setForm(EMPTY_FORM);
      await loadUsers();
      toast({
        title: "User created",
        description: `${form.full_name} can now sign in as ${form.role}.`,
      });
    } catch (error) {
      toast({
        title: "Create failed",
        description: getErrorMessage(error, "Could not create user."),
        variant: "destructive",
      });
    } finally {
      setCreating(false);
    }
  };

  return (
    <RoleGuard allowedRoles={["admin"]}>
      <AdminLayout>
        <div className="space-y-8">
          <div>
            <h1 className="mb-2 text-3xl font-bold">User Management</h1>
            <p className="text-muted-foreground">
              Separate customers, sellers, managers and warehouse staff with KYC visibility.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardContent className="p-5">
                <p className="text-sm text-muted-foreground">Customers</p>
                <p className="mt-2 text-2xl font-bold">{counts.customer}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-5">
                <p className="text-sm text-muted-foreground">Sellers</p>
                <p className="mt-2 text-2xl font-bold">{counts.seller}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-5">
                <p className="text-sm text-muted-foreground">Users With KYC</p>
                <p className="mt-2 text-2xl font-bold">{kycCounts.withDocs}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-5">
                <p className="text-sm text-muted-foreground">KYC Missing</p>
                <p className="mt-2 text-2xl font-bold">{kycCounts.missingDocs}</p>
              </CardContent>
            </Card>
          </div>

          {currentUser?.role === "admin" && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="h-5 w-5 text-accent" />
                  Add User
                </CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <div>
                  <Label htmlFor="full_name">Full Name</Label>
                  <Input
                    id="full_name"
                    value={form.full_name}
                    onChange={(event) => setForm((current) => ({ ...current, full_name: event.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={form.email}
                    onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={form.phone}
                    onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="password">Temporary Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={form.password}
                    onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
                  />
                </div>
                <div>
                  <Label>Role</Label>
                  <Select value={form.role} onValueChange={(value) => setForm((current) => ({ ...current, role: value as UserForm["role"] }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="customer">Customer</SelectItem>
                      <SelectItem value="seller">Seller</SelectItem>
                      <SelectItem value="manager">Manager</SelectItem>
                      <SelectItem value="warehouse">Warehouse</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="business_name">Seller Business Name</Label>
                  <Input
                    id="business_name"
                    value={form.business_name}
                    disabled={form.role !== "seller"}
                    onChange={(event) => setForm((current) => ({ ...current, business_name: event.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="cnic_number">CNIC / ID Number</Label>
                  <Input
                    id="cnic_number"
                    value={form.cnic_number}
                    onChange={(event) => setForm((current) => ({ ...current, cnic_number: event.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="kyc_document_url">KYC Document URL</Label>
                  <Input
                    id="kyc_document_url"
                    value={form.kyc_document_url}
                    onChange={(event) => setForm((current) => ({ ...current, kyc_document_url: event.target.value }))}
                  />
                </div>
                <div className="md:col-span-2 xl:col-span-4">
                  <Button onClick={createUser} disabled={creating}>
                    <Plus className="mr-2 h-4 w-4" />
                    {creating ? "Creating..." : "Create User"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardContent className="pt-6">
              <div className="mb-6 flex flex-col gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search by name, email, phone, or CNIC..."
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                    className="pl-10"
                  />
                </div>
                <Tabs value={filter} onValueChange={(value) => setFilter(value as UserFilter)}>
                  <TabsList className="h-auto flex-wrap justify-start">
                    <TabsTrigger value="all">All ({counts.all})</TabsTrigger>
                    <TabsTrigger value="customer">Customers ({counts.customer})</TabsTrigger>
                    <TabsTrigger value="seller">Sellers ({counts.seller})</TabsTrigger>
                    <TabsTrigger value="manager">Managers ({counts.manager})</TabsTrigger>
                    <TabsTrigger value="warehouse">Warehouse ({counts.warehouse})</TabsTrigger>
                    <TabsTrigger value="admin">Admins ({counts.admin})</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>

              {loading ? (
                <div className="flex items-center justify-center py-24">
                  <Loader2 className="h-12 w-12 animate-spin text-muted-foreground" />
                </div>
              ) : filteredUsers.length > 0 ? (
                <div className="space-y-4">
                  {filteredUsers.map((profile) => {
                    const sellerProfile = sellerProfilesByUser.get(profile.id);
                    const links = kycLinks(profile, sellerProfile);
                    const displayCnic = profile.cnic_number || sellerProfile?.owner_cnic || "";
                    return (
                      <div key={profile.id} className="rounded-md border p-4 transition hover:bg-muted/50">
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                          <div className="min-w-0 flex-1">
                            <div className="mb-1 flex flex-wrap items-center gap-3">
                              <p className="font-semibold">{profile.full_name || "No name"}</p>
                              <Badge className={roleColors[profile.role ?? "customer"]}>
                                {profile.role ?? "customer"}
                              </Badge>
                              <Badge variant={profile.is_active ? "outline" : "secondary"}>
                                {profile.is_active ? "active" : "disabled"}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">{profile.email}</p>
                            {profile.phone && <p className="text-sm text-muted-foreground">{profile.phone}</p>}
                            {sellerProfile && (
                              <p className="mt-1 text-sm text-muted-foreground">
                                Seller profile: {sellerProfile.business_name} - {sellerProfile.status || "pending"}
                              </p>
                            )}
                            <div className="mt-3 grid gap-3 text-sm md:grid-cols-3">
                              <div className="rounded-md bg-muted p-3">
                                <p className="text-muted-foreground">CNIC / ID</p>
                                <p className="font-medium">{displayCnic || "Not provided"}</p>
                              </div>
                              <div className="rounded-md bg-muted p-3">
                                <p className="text-muted-foreground">Joined</p>
                                <p className="font-medium">
                                  {profile.created_at ? new Date(profile.created_at).toLocaleDateString() : "Unknown"}
                                </p>
                              </div>
                              <div className="rounded-md bg-muted p-3">
                                <p className="text-muted-foreground">KYC Documents</p>
                                <p className="font-medium">{links.length ? `${links.length} file(s)` : "Not uploaded"}</p>
                              </div>
                            </div>
                            {links.length > 0 && (
                              <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                                {links.map((item) => (
                                  <DocumentPreviewTile
                                    key={item.label}
                                    url={String(item.href)}
                                    label={item.label}
                                  />
                                ))}
                              </div>
                            )}
                          </div>

                          <div className="flex flex-wrap gap-2">
                            <Button variant="outline" size="sm" asChild>
                              <Link href={profile.role === "seller" ? "/admin/sellers" : `/admin/users?user=${profile.id}`}>
                                <Eye className="mr-2 h-4 w-4" />
                                View
                              </Link>
                            </Button>
                            {profile.email && (
                              <Button variant="outline" size="sm" asChild>
                                <a href={`mailto:${profile.email}`}>
                                  <Mail className="mr-2 h-4 w-4" />
                                  Email
                                </a>
                              </Button>
                            )}
                            {(profile.role === "manager" || profile.role === "warehouse") && (
                              <Badge variant="outline" className="gap-1 px-3 py-1.5">
                                <ShieldCheck className="h-4 w-4" />
                                Staff access
                              </Badge>
                            )}
                            {profile.role === "customer" && (
                              <Badge variant="outline" className="gap-1 px-3 py-1.5">
                                <UserRound className="h-4 w-4" />
                                Buyer
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="py-12 text-center text-muted-foreground">No users found</p>
              )}
            </CardContent>
          </Card>
        </div>
      </AdminLayout>
    </RoleGuard>
  );
}
