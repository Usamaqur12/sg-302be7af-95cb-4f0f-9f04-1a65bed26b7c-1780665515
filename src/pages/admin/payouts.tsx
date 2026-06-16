import { AdminLayout } from "@/components/AdminLayout";
import { RoleGuard } from "@/components/RoleGuard";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuthContext } from "@/contexts/AuthContext";
import { useMarketplaceSettings } from "@/contexts/MarketplaceSettingsContext";
import { csrfHeaders } from "@/lib/csrf";
import { useCallback, useEffect, useState } from "react";
import { CheckCircle, Download, XCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type WithdrawalStatus = "pending" | "approved" | "rejected" | "completed";

interface WithdrawalRequest {
  id: string;
  amount: number;
  status: WithdrawalStatus;
  created_at: string | null;
  requested_at?: string | null;
  approved_at?: string | null;
  completed_at: string | null;
  rejected_at: string | null;
  ledger_available_balance: number;
  has_bank_details: boolean;
  seller: {
    business_name: string;
    business_email: string | null;
    bank_account_name?: string | null;
    bank_account_number?: string | null;
    bank_name?: string | null;
  } | null;
  payout_batch: {
    batch_number: string;
    status: string;
    approved_at: string | null;
  } | null;
}

interface PayoutBatch {
  id: string;
  batch_number: string;
  status: string;
  total_amount: number;
  item_count: number;
  approved_at: string | null;
}

export default function AdminPayouts() {
  const { user, loading: authLoading } = useAuthContext();
  const { formatPrice } = useMarketplaceSettings();
  const { toast } = useToast();
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [batches, setBatches] = useState<PayoutBatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchWithdrawals = useCallback(async () => {
    try {
      const response = await fetch("/api/admin/payouts", { credentials: "include" });
      const payload = await response.json().catch(() => ({ data: null, error: { message: "Request failed" } }));
      if (!response.ok || payload.error) throw new Error(payload.error?.message || "Failed to load payouts");

      setWithdrawals((payload.data?.withdrawals ?? []) as WithdrawalRequest[]);
      setBatches((payload.data?.batches ?? []) as PayoutBatch[]);
    } catch (error) {
      toast({
        title: "Payouts unavailable",
        description: error instanceof Error ? error.message : "Failed to load payouts",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    if (authLoading || !user) return;

    fetchWithdrawals();
  }, [authLoading, fetchWithdrawals, user]);

  const updateWithdrawalStatus = useCallback(async (withdrawalId: string, action: "approve" | "reject") => {
    setUpdatingId(withdrawalId);
    try {
      const response = await fetch("/api/admin/payouts", {
        method: "POST",
        headers: csrfHeaders({ "Content-Type": "application/json" }),
        credentials: "include",
        body: JSON.stringify({ withdrawalId, action }),
      });
      const payload = await response.json().catch(() => ({ error: { message: "Request failed" } }));
      if (!response.ok || payload.error) throw new Error(payload.error?.message || "Failed to update payout");

      toast({
        title: action === "approve" ? "Payout approved" : "Payout rejected",
        description: action === "approve"
          ? "A payout batch was created and is ready for manual export."
          : "The withdrawal request was rejected.",
      });
      fetchWithdrawals();
    } catch (error) {
      toast({
        title: "Payout update failed",
        description: error instanceof Error ? error.message : "Failed to update payout",
        variant: "destructive",
      });
    } finally {
      setUpdatingId(null);
    }
  }, [fetchWithdrawals, toast]);

  const exportPayouts = useCallback(() => {
    window.location.href = "/api/admin/payouts?export=csv";
  }, []);

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
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold">Payout Management</h1>
            <p className="mt-2 text-muted-foreground">
              Approvals are checked against ledger-derived balances and grouped into manual export batches.
            </p>
          </div>
          <Button onClick={exportPayouts} disabled={!batches.some((batch) => ["approved", "processing"].includes(batch.status))}>
            <Download className="h-4 w-4 mr-2" />
            Export approved CSV
          </Button>
        </div>

        <div className="space-y-4">
          {withdrawals.map((withdrawal) => (
            <Card key={withdrawal.id} className="p-6">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-semibold text-lg">{withdrawal.seller?.business_name}</h3>
                    <Badge
                      className={
                        withdrawal.status === "completed" || withdrawal.status === "approved"
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
                  <p className="text-sm text-muted-foreground mb-1">
                    Bank: {withdrawal.has_bank_details ? `${withdrawal.seller?.bank_name} / ${withdrawal.seller?.bank_account_name}` : "Missing bank details"}
                  </p>
                  <p className="text-xl font-bold font-mono text-green-600 mb-1">
                    {formatPrice(withdrawal.amount)}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Ledger available before this request: {formatPrice(withdrawal.ledger_available_balance || 0)}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Requested:{" "}
                    {withdrawal.created_at || withdrawal.requested_at
                      ? new Date(withdrawal.created_at || withdrawal.requested_at || "").toLocaleDateString()
                      : "Unknown"}
                  </p>
                  {withdrawal.approved_at && (
                    <p className="text-sm text-muted-foreground">
                      Approved: {new Date(withdrawal.approved_at).toLocaleDateString()}
                    </p>
                  )}
                  {withdrawal.payout_batch && (
                    <p className="text-sm text-muted-foreground">
                      Batch: {withdrawal.payout_batch.batch_number} ({withdrawal.payout_batch.status})
                    </p>
                  )}
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
                      onClick={() => updateWithdrawalStatus(withdrawal.id, "approve")}
                      className="bg-green-500 hover:bg-green-600"
                      disabled={updatingId === withdrawal.id}
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => updateWithdrawalStatus(withdrawal.id, "reject")}
                      disabled={updatingId === withdrawal.id}
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
