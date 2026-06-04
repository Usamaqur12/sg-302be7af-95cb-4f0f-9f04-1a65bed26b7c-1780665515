"use client";

import { AdminLayout } from "@/components/AdminLayout";
import { RoleGuard } from "@/components/RoleGuard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Search, CheckCircle, XCircle, Clock, Ban, Eye, Mail } from "lucide-react";

export default function AdminSellersPage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [sellers, setSellers] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "pending" | "approved" | "rejected">("all");

  useEffect(() => {
    loadSellers();
  }, []);

  const loadSellers = async () => {
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

      setSellers(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Could not load sellers",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApproveSeller = async (sellerId: string, sellerName: string) => {
    try {
      const { error } = await supabase
        .from("seller_profiles")
        .update({ 
          status: "approved", 
          verified_at: new Date().toISOString() 
        })
        .eq("id", sellerId);

      if (error) throw error;

      toast({
        title: "Seller Approved",
        description: `${sellerName} has been approved and can now access their dashboard.`,
      });

      // Reload sellers list
      await loadSellers();
    } catch (error: any) {
      console.error("Approve error:", error);
      toast({
        title: "Action Failed",
        description: error.message || "Could not approve seller",
        variant: "destructive",
      });
    }
  };

  const handleRejectSeller = async (sellerId: string, sellerName: string) => {
    try {
      const { error } = await supabase
        .from("seller_profiles")
        .update({ 
          status: "rejected",
          verified_at: null
        })
        .eq("id", sellerId);

      if (error) throw error;

      toast({
        title: "Seller Rejected",
        description: `${sellerName} has been rejected.`,
        variant: "destructive",
      });

      // Reload sellers list
      await loadSellers();
    } catch (error: any) {
      console.error("Reject error:", error);
      toast({
        title: "Action Failed",
        description: error.message || "Could not reject seller",
        variant: "destructive",
      });
    }
  };

  const handleSuspendSeller = async (sellerId: string, sellerName: string) => {
    try {
      const { error } = await supabase
        .from("seller_profiles")
        .update({ 
          status: "suspended" 
        })
        .eq("id", sellerId);

      if (error) throw error;

      toast({
        title: "Seller Suspended",
        description: `${sellerName} has been suspended.`,
        variant: "destructive",
      });

      // Reload sellers list
      await loadSellers();
    } catch (error: any) {
      console.error("Suspend error:", error);
      toast({
        title: "Action Failed",
        description: error.message || "Could not suspend seller",
        variant: "destructive",
      });
    }
  };

  const handleActivateSeller = async (sellerId: string, sellerName: string) => {
    try {
      const { error } = await supabase
        .from("seller_profiles")
        .update({ 
          status: "approved",
          verified_at: new Date().toISOString()
        })
        .eq("id", sellerId);

      if (error) throw error;

      toast({
        title: "Seller Activated",
        description: `${sellerName} has been activated.`,
      });

      // Reload sellers list
      await loadSellers();
    } catch (error: any) {
      console.error("Activate error:", error);
      toast({
        title: "Action Failed",
        description: error.message || "Could not activate seller",
        variant: "destructive",
      });
    }
  };

  const filteredSellers = sellers.filter((seller) => {
    const matchesSearch =
      seller.business_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      seller.profiles?.email?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesFilter = filter === "all" || seller.status === filter;

    return matchesSearch && matchesFilter;
  });

  const statusCounts = {
    all: sellers.length,
    pending: sellers.filter((s) => s.status === "pending" || !s.status).length,
    approved: sellers.filter((s) => s.status === "approved").length,
    rejected: sellers.filter((s) => s.status === "rejected").length,
  };

  return (
    <RoleGuard allowedRoles={["admin"]}>
      <AdminLayout>
        <div className="space-y-8">
          <div>
            <h1 className="text-3xl font-bold font-serif mb-2">Seller Management</h1>
            <p className="text-muted-foreground">Approve, reject, or suspend seller accounts</p>
          </div>

          {/* Search and Filters */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by business name or email..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>

                <Tabs value={filter} onValueChange={(value: any) => setFilter(value)}>
                  <TabsList>
                    <TabsTrigger value="all">All ({statusCounts.all})</TabsTrigger>
                    <TabsTrigger value="pending">Pending ({statusCounts.pending})</TabsTrigger>
                    <TabsTrigger value="approved">Approved ({statusCounts.approved})</TabsTrigger>
                    <TabsTrigger value="rejected">Rejected ({statusCounts.rejected})</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
            </CardContent>
          </Card>

          {/* Sellers List */}
          {loading ? (
            <div className="flex items-center justify-center py-24">
              <Loader2 className="h-12 w-12 animate-spin text-muted-foreground" />
            </div>
          ) : filteredSellers.length > 0 ? (
            <div className="grid gap-6">
              {filteredSellers.map((seller) => (
                <Card key={seller.id}>
                  <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row md:items-start gap-6">
                      <div className="flex-1 space-y-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="text-xl font-semibold mb-1">{seller.business_name}</h3>
                            <p className="text-sm text-muted-foreground mb-2">
                              {seller.profiles?.email} • {seller.profiles?.full_name}
                            </p>
                            <div className="flex items-center gap-2 mb-2">
                              {seller.status === "approved" && seller.verified_at && (
                                <Badge variant="default" className="bg-green-500/10 text-green-700">
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  Approved
                                </Badge>
                              )}
                              {seller.status === "rejected" && (
                                <Badge variant="destructive">
                                  <XCircle className="h-3 w-3 mr-1" />
                                  Rejected
                                </Badge>
                              )}
                              {seller.status === "suspended" && (
                                <Badge variant="destructive">
                                  <Ban className="h-3 w-3 mr-1" />
                                  Suspended
                                </Badge>
                              )}
                              {(!seller.status || seller.status === "pending") && (
                                <Badge variant="secondary">
                                  <Clock className="h-3 w-3 mr-1" />
                                  Pending Approval
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="grid md:grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-muted-foreground">Business Type</p>
                            <p className="font-medium capitalize">{seller.business_type || "Not specified"}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Commission Rate</p>
                            <p className="font-medium">{seller.commission_rate || 12}%</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Registered</p>
                            <p className="font-medium">
                              {new Date(seller.created_at).toLocaleDateString("en-US", {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                              })}
                            </p>
                          </div>
                        </div>

                        <div>
                          <p className="text-sm text-muted-foreground mb-1">Description</p>
                          <p className="text-sm">{seller.business_description || seller.description || "No description provided"}</p>
                        </div>

                        <div>
                          <p className="text-sm text-muted-foreground mb-1">Business Address</p>
                          <p className="text-sm">{seller.business_address || "No address provided"}</p>
                        </div>
                      </div>

                      <div className="flex flex-col gap-2">
                        {(!seller.status || seller.status === "pending") && (
                          <>
                            <Button
                              onClick={() => handleApproveSeller(seller.id, seller.business_name)}
                              className="gap-2"
                              variant="default"
                            >
                              <CheckCircle className="h-4 w-4" />
                              Approve
                            </Button>
                            <Button
                              variant="destructive"
                              onClick={() => handleRejectSeller(seller.id, seller.business_name)}
                              className="gap-2"
                            >
                              <XCircle className="h-4 w-4" />
                              Reject
                            </Button>
                          </>
                        )}

                        {seller.status === "approved" && (
                          <Button
                            variant="destructive"
                            onClick={() => handleSuspendSeller(seller.id, seller.business_name)}
                            className="gap-2"
                          >
                            <Ban className="h-4 w-4" />
                            Suspend
                          </Button>
                        )}

                        {(seller.status === "rejected" || seller.status === "suspended") && (
                          <Button
                            onClick={() => handleActivateSeller(seller.id, seller.business_name)}
                            className="gap-2"
                            variant="default"
                          >
                            <CheckCircle className="h-4 w-4" />
                            Activate
                          </Button>
                        )}

                        <Button variant="outline" className="gap-2">
                          <Eye className="h-4 w-4" />
                          View Details
                        </Button>

                        <Button variant="outline" className="gap-2">
                          <Mail className="h-4 w-4" />
                          Contact
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
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