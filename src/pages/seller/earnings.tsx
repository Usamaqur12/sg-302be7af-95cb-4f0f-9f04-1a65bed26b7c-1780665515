import { SellerLayout } from "@/components/SellerLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { DollarSign, TrendingUp, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface EarningsData {
  totalEarnings: number;
  totalCommission: number;
  availableBalance: number;
  pendingWithdrawals: number;
}

interface WithdrawalRequest {
  id: string;
  amount: number;
  status: string;
  created_at: string;
  processed_at: string | null;
}

export default function SellerEarnings() {
  const { user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [earnings, setEarnings] = useState<EarningsData>({
    totalEarnings: 0,
    totalCommission: 0,
    availableBalance: 0,
    pendingWithdrawals: 0,
  });
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!user) {
      router.push("/");
      return;
    }

    fetchEarnings();
  }, [user, router]);

  const fetchEarnings = async () => {
    if (!user) return;

    const { data: sellerProfile } = await supabase
      .from("seller_profiles")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (!sellerProfile) return;

    const { data: orderItems } = await supabase
      .from("order_items")
      .select("seller_earnings, commission_amount")
      .eq("seller_id", sellerProfile.id);

    const totalEarnings = orderItems?.reduce((sum, item) => sum + (item.seller_earnings || 0), 0) || 0;
    const totalCommission = orderItems?.reduce((sum, item) => sum + (item.commission_amount || 0), 0) || 0;

    const { data: withdrawalRequests } = await supabase
      .from("withdrawal_requests")
      .select("*")
      .eq("seller_id", sellerProfile.id)
      .order("created_at", { ascending: false });

    const pendingWithdrawals = withdrawalRequests?.filter(w => w.status === "pending")
      .reduce((sum, w) => sum + w.amount, 0) || 0;

    const completedWithdrawals = withdrawalRequests?.filter(w => w.status === "completed")
      .reduce((sum, w) => sum + w.amount, 0) || 0;

    setEarnings({
      totalEarnings,
      totalCommission,
      availableBalance: totalEarnings - completedWithdrawals - pendingWithdrawals,
      pendingWithdrawals,
    });

    setWithdrawals((withdrawalRequests as any) || []);
    setLoading(false);
  };

  const requestWithdrawal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const amount = parseFloat(withdrawAmount);

    if (amount <= 0 || amount > earnings.availableBalance) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid amount within your available balance",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);

    try {
      const { data: sellerProfile } = await supabase
        .from("seller_profiles")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (!sellerProfile) return;

      const { error } = await supabase
        .from("withdrawal_requests")
        .insert({
          seller_id: sellerProfile.id,
          amount,
          status: "pending",
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Withdrawal request submitted",
      });

      setWithdrawAmount("");
      fetchEarnings();
    } catch (error) {
      console.error("Error requesting withdrawal:", error);
      toast({
        title: "Error",
        description: "Failed to submit withdrawal request",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <SellerLayout>
        <div className="text-center py-16">
          <p className="text-muted-foreground">Loading earnings...</p>
        </div>
      </SellerLayout>
    );
  }

  return (
    <SellerLayout>
      <div>
        <h1 className="text-3xl font-bold mb-8">Earnings & Payouts</h1>

        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Total Earnings</p>
                <p className="text-2xl font-bold font-mono text-green-600">
                  ${earnings.totalEarnings.toFixed(2)}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-green-500" />
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Available Balance</p>
                <p className="text-2xl font-bold font-mono">
                  ${earnings.availableBalance.toFixed(2)}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-accent" />
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Platform Commission</p>
                <p className="text-2xl font-bold font-mono text-muted-foreground">
                  ${earnings.totalCommission.toFixed(2)}
                </p>
              </div>
              <div className="text-sm text-muted-foreground">-{earnings.totalEarnings > 0 ? ((earnings.totalCommission / (earnings.totalEarnings + earnings.totalCommission)) * 100).toFixed(1) : 0}%</div>
            </div>
          </Card>
        </div>

        <div className="grid lg:grid-cols-2 gap-8 mb-8">
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-6">Request Withdrawal</h2>

            <form onSubmit={requestWithdrawal} className="space-y-4">
              <div>
                <Label htmlFor="amount">Amount</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  placeholder="Enter amount"
                  required
                />
                <p className="text-sm text-muted-foreground mt-2">
                  Available: ${earnings.availableBalance.toFixed(2)}
                </p>
              </div>

              <Button type="submit" disabled={submitting} className="w-full">
                <Download className="h-4 w-4 mr-2" />
                {submitting ? "Submitting..." : "Request Withdrawal"}
              </Button>
            </form>
          </Card>

          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-6">Pending Withdrawals</h2>

            {earnings.pendingWithdrawals > 0 ? (
              <div className="space-y-3">
                <div className="p-4 bg-warning/10 border border-warning rounded-lg">
                  <p className="font-medium">Total Pending</p>
                  <p className="text-2xl font-bold font-mono text-warning">
                    ${earnings.pendingWithdrawals.toFixed(2)}
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Awaiting admin approval
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground">No pending withdrawals</p>
            )}
          </Card>
        </div>

        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-6">Withdrawal History</h2>

          {withdrawals.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No withdrawal history</p>
          ) : (
            <div className="space-y-3">
              {withdrawals.map((withdrawal) => (
                <div key={withdrawal.id} className="flex items-center justify-between p-4 border border-border rounded-lg">
                  <div>
                    <p className="font-medium font-mono">${withdrawal.amount.toFixed(2)}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(withdrawal.created_at).toLocaleDateString()}
                    </p>
                  </div>
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
              ))}
            </div>
          )}
        </Card>
      </div>
    </SellerLayout>
  );
}