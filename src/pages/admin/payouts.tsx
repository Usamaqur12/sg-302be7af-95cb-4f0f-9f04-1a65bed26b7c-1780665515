import { AdminLayout } from "@/components/AdminLayout";
import { RoleGuard } from "@/components/RoleGuard";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuthContext } from "@/contexts/AuthContext";
import { useMarketplaceSettings } from "@/contexts/MarketplaceSettingsContext";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/database.types";
import { useCallback, useEffect, useState } from "react";
import { CheckCircle, XCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type WithdrawalStatus = Database["public"]["Enums"]["withdrawal_status"];

interface WithdrawalRequest {
  id: string;
  amount: number;
  status: WithdrawalStatus | null;
  created_at: string | null;
  completed_at: string | null;
  rejected_at: string | null;
  seller: {
    business_name: string;
    business_email: string | null;
  } | null;
}

export default function AdminPayouts() {
  const { user, loading: authLoading } = useAuthContext();
  const { formatPrice } = useMarketplaceSettings();
  const { toast } = useToast();
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchWithdrawals = useCallback(async () => {
    const { data } = await supabase
      .from("withdrawal_requests")
      .select(`
        id,
        amount,
        status,
        created_at,
        completed_at,
        rejected_at,
        seller:seller_profiles(business_name, business_email)
      `)
      .order("created_at", { ascending: false });

    setWithdrawals((data ?? []) as unknown as WithdrawalRequest[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (authLoading || !user) return;

    fetchWithdrawals();
  }, [authLoading, fetchWithdrawals, user]);

  const updateWithdrawalStatus = useCallback(async (withdrawalId: string, status: WithdrawalStatus) => {
    type WithdrawalUpdate = Database["public"]["Tables"]["withdrawal_requests"]["Update"];
    
    const updateData: WithdrawalUpdate = {
      status,
    };

    if (status === "completed") {
      updateData.approved_by = user?.id;
      updateData.approved_at = new Date().toISOString();
      updateData.completed_at = new Date().toISOString();
    } else if (status === "rejected") {
      updateData.approved_by = user?.id;
      updateData.rejected_at = new Date().toISOString();
    }

    const { error } = await supabase
      .from("withdrawal_requests")
      .update(updateData)
      .eq("id", withdrawalId);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to update withdrawal status",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Success",
      description: `Withdrawal ${status}`,
    });

    fetchWithdrawals();
  }, [fetchWithdrawals, toast, user]);

  if (authLoading || (user && loading)) {
    return (
      <RoleGuard allowedRoles={["admin"]}>
        <AdminLayout>
          <div className="text-center py-16">
            <p className="text-muted-foreground">Loading withdrawals...</p>
          </div>
        </AdminLayout>
      </RoleGuard>
    );
  }

  return (
    <RoleGuard allowedRoles={["admin"]}>
      <AdminLayout>
      <div>
        <h1 className="text-3xl font-bold mb-8">Payout Management</h1>

        <div className="space-y-4">
          {withdrawals.map((withdrawal) => (
            <Card key={withdrawal.id} className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-semibold text-lg">{withdrawal.seller?.business_name}</h3>
                    <Badge
                      className={
                        withdrawal.status === "completed"
                          ? "bg-green-500"
                          : withdrawal.status === "pending"
                          ? "bg-warning"
                          : "bg-destructive"
                      }
                    >
                      {withdrawal.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-1">
                    Email: {withdrawal.seller?.business_email || "Not provided"}
                  </p>
                  <p className="text-xl font-bold font-mono text-green-600 mb-1">
                    {formatPrice(withdrawal.amount)}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Requested:{" "}
                    {withdrawal.created_at
                      ? new Date(withdrawal.created_at).toLocaleDateString()
                      : "Unknown"}
                  </p>
                  {withdrawal.completed_at && (
                    <p className="text-sm text-muted-foreground">
                      Completed: {new Date(withdrawal.completed_at).toLocaleDateString()}
                    </p>
                  )}
                  {withdrawal.rejected_at && (
                    <p className="text-sm text-muted-foreground">
                      Rejected: {new Date(withdrawal.rejected_at).toLocaleDateString()}
                    </p>
                  )}
                </div>

                {withdrawal.status === "pending" && (
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => updateWithdrawalStatus(withdrawal.id, "completed")}
                      className="bg-green-500 hover:bg-green-600"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => updateWithdrawalStatus(withdrawal.id, "rejected")}
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Reject
                    </Button>
                  </div>
                )}
              </div>
            </Card>
          ))}

          {withdrawals.length === 0 && (
            <Card className="p-12 text-center">
              <p className="text-muted-foreground">No withdrawal requests</p>
            </Card>
          )}
        </div>
      </div>
      </AdminLayout>
    </RoleGuard>
  );
}
