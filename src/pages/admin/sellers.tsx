import { AdminLayout } from "@/components/AdminLayout";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/database.types";
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { Search, CheckCircle, XCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Seller {
  id: string;
  business_name: string;
  email: string | null;
  phone: string | null;
  verification_status: string;
  created_at: string;
  rating: number;
  total_reviews: number;
  user: {
    email: string;
  };
}

export default function AdminSellers() {
  const { user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (!user) {
      router.push("/");
      return;
    }

    fetchSellers();
  }, [user, router]);

  const fetchSellers = async () => {
    const { data } = await supabase
      .from("seller_profiles")
      .select(`
        id,
        business_name,
        email,
        phone,
        verification_status,
        created_at,
        rating,
        total_reviews,
        user:profiles!seller_profiles_user_id_fkey(email)
      `)
      .order("created_at", { ascending: false });

    setSellers((data as any) || []);
    setLoading(false);
  };

  const updateVerificationStatus = async (sellerId: string, status: string) => {
    type SellerUpdate = Database["public"]["Tables"]["seller_profiles"]["Update"];
    
    const updateData: SellerUpdate = {
      verification_status: status as any,
    };

    const { error } = await supabase
      .from("seller_profiles")
      .update(updateData)
      .eq("id", sellerId);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to update verification status",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Success",
      description: `Seller ${status}`,
    });

    fetchSellers();
  };

  const filteredSellers = sellers.filter((seller) =>
    seller.business_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    seller.user?.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <AdminLayout>
        <div className="text-center py-16">
          <p className="text-muted-foreground">Loading sellers...</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div>
        <h1 className="text-3xl font-bold mb-8">Seller Management</h1>

        <Card className="p-4 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search sellers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </Card>

        <div className="space-y-4">
          {filteredSellers.map((seller) => (
            <Card key={seller.id} className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-semibold text-lg">{seller.business_name}</h3>
                    <Badge
                      className={
                        seller.verification_status === "approved"
                          ? "bg-green-500"
                          : seller.verification_status === "pending"
                          ? "bg-warning"
                          : "bg-destructive"
                      }
                    >
                      {seller.verification_status}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-1">
                    Email: {seller.user?.email}
                  </p>
                  {seller.phone && (
                    <p className="text-sm text-muted-foreground mb-1">
                      Phone: {seller.phone}
                    </p>
                  )}
                  <p className="text-sm text-muted-foreground">
                    Rating: {seller.rating.toFixed(1)} ({seller.total_reviews} reviews)
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Joined: {new Date(seller.created_at).toLocaleDateString()}
                  </p>
                </div>

                {seller.verification_status === "pending" && (
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => updateVerificationStatus(seller.id, "approved")}
                      className="bg-green-500 hover:bg-green-600"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => updateVerificationStatus(seller.id, "rejected")}
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Reject
                    </Button>
                  </div>
                )}
              </div>
            </Card>
          ))}

          {filteredSellers.length === 0 && (
            <Card className="p-12 text-center">
              <p className="text-muted-foreground">No sellers found</p>
            </Card>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}