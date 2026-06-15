import { SellerLayout } from "@/components/SellerLayout";
import { RoleGuard } from "@/components/RoleGuard";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useAuthContext } from "@/contexts/AuthContext";
import { useMarketplaceSettings } from "@/contexts/MarketplaceSettingsContext";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/database.types";
import { useCallback, useEffect, useState } from "react";
import type { FormEvent } from "react";
import { DollarSign, TrendingUp, Download, FileText, Wallet } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
import { useRouter } from "next/router";

type WithdrawalRequest = Database["public"]["Tables"]["withdrawal_requests"]["Row"];

interface EarningsData {
  totalEarnings: number;
  totalCommission: number;
  availableBalance: number;
  pendingWithdrawals: number;
}

export default function SellerEarnings() {
  const { user, loading: authLoading } = useAuthContext();
  const { formatPrice } = useMarketplaceSettings();
  const { toast } = useToast();
  const router = useRouter();
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
  const [payoutHoldDays, setPayoutHoldDays] = useState(2);
  const activeView = typeof router.query.view === "string" ? router.query.view : "my-income";

  const fetchEarnings = useCallback(async () => {
    if (!user) return;

    const { data: sellerProfile } = await supabase
      .from("seller_profiles")
      .select("id, total_earnings, available_balance")
      .eq("user_id", user.id)
      .single();

    if (!sellerProfile) {
      setWithdrawals([]);
      setLoading(false);
      return;
    }

    const { data: orderItems } = await supabase
      .from("order_items")
      .select("seller_earnings, commission_amount")
      .eq("seller_id", sellerProfile.id);

    const totalCommission = orderItems?.reduce((sum, item) => sum + (item.commission_amount || 0), 0) || 0;

    const [{ data: withdrawalRequests }, { data: payoutSetting }] = await Promise.all([
      supabase
        .from("withdrawal_requests")
        .select("*")
        .eq("seller_id", sellerProfile.id)
        .order("created_at", { ascending: false }),
      supabase
        .from("system_settings")
        .select("value")
        .eq("key", "seller_payout_hold_days")
        .maybeSingle(),
    ]);

    const pendingWithdrawals = withdrawalRequests?.filter(w => w.status === "pending")
      .reduce((sum, w) => sum + w.amount, 0) || 0;

    setEarnings({
      totalEarnings: sellerProfile.total_earnings ?? 0,
      totalCommission,
      availableBalance: sellerProfile.available_balance ?? 0,
      pendingWithdrawals,
    });

    setWithdrawals(withdrawalRequests || []);
    setPayoutHoldDays(Math.max(0, Math.min(30, Number(payoutSetting?.value ?? 2) || 2)));
    setLoading(false);
  }, [user]);

  useEffect(() => {
    if (authLoading || !user) return;

    fetchEarnings();
  }, [authLoading, fetchEarnings, user]);

  const requestWithdrawal = async (e: FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const amount = parseFloat(withdrawAmount);

    if (!Number.isFinite(amount) || amount <= 0 || amount > earnings.availableBalance) {
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

      if (!sellerProfile) {
        toast({
          title: "Seller Profile Missing",
          description: "Please complete your seller registration before requesting a withdrawal",
          variant: "destructive",
        });
        return;
      }

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

  if (authLoading || (user && loading)) {
    return (
      <RoleGuard allowedRoles={["seller"]}>
        <SellerLayout>
          <div className="text-center py-16">
            <p className="text-muted-foreground">Loading earnings...</p>
          </div>
        </SellerLayout>
      </RoleGuard>
    );
  }

  return (
    <RoleGuard allowedRoles={["seller"]}>
      <SellerLayout>
      <div>
        <div className="mb-8">
          <h1 className="text-3xl font-bold">My Income</h1>
          <p className="mt-2 text-muted-foreground">Income overview, release status, seller finance and shared wallet.</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Delivered order earnings move to available balance after a {payoutHoldDays}-day review hold.
          </p>
        </div>

        <div className="mb-8 grid gap-2 md:grid-cols-3">
          {[
            { href: "/seller/earnings", label: "MyIncome", view: "my-income", icon: FileText },
            { href: "/seller/earnings?view=seller-finance", label: "Seller finance", view: "seller-finance", icon: DollarSign },
            { href: "/seller/earnings?view=shared-wallet", label: "Shared Wallet", view: "shared-wallet", icon: Wallet },
          ].map((item) => {
            const Icon = item.icon;
            const active = activeView === item.view || (item.view === "my-income" && !router.query.view);
            return (
              <Button key={item.href} variant={active ? "default" : "outline"} asChild className="justify-start">
                <Link href={item.href}>
                  <Icon className="mr-2 h-4 w-4" />
                  {item.label}
                </Link>
              </Button>
            );
          })}
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Total Earnings</p>
                <p className="text-2xl font-bold font-mono text-green-600">
                  {formatPrice(earnings.totalEarnings)}
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
                  {formatPrice(earnings.availableBalance)}
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
                  {formatPrice(earnings.totalCommission)}
                </p>
              </div>
              <div className="text-sm text-muted-foreground">-{earnings.totalEarnings > 0 ? ((earnings.totalCommission / (earnings.totalEarnings + earnings.totalCommission)) * 100).toFixed(1) : 0}%</div>
            </div>
          </Card>
        </div>

        {activeView === "shared-wallet" && (
          <Card className="p-6 mb-8">
            <h2 className="text-xl font-semibold mb-4">Shared Wallet</h2>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-md border p-4">
                <p className="text-sm text-muted-foreground">Marketing Balance</p>
                <p className="mt-2 text-2xl font-bold">{formatPrice(0)}</p>
              </div>
              <div className="rounded-md border p-4">
                <p className="text-sm text-muted-foreground">Store Earnings</p>
                <p className="mt-2 text-2xl font-bold">{formatPrice(earnings.availableBalance)}</p>
              </div>
              <div className="rounded-md border p-4">
                <p className="text-sm text-muted-foreground">Top-up Status</p>
                <p className="mt-2 text-2xl font-bold">Admin review</p>
              </div>
            </div>
          </Card>
        )}

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
                  Available: {formatPrice(earnings.availableBalance)}
                </p>
              </div>

              <Button type="submit" disabled={submitting} className="w-full">
                <Download className="h-4 w-4 mr-2" />
                {submitting ? "Submitting..." : "Request Payout"}
              </Button>
            </form>
          </Card>

          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-6">Pending Payouts</h2>

            {earnings.pendingWithdrawals > 0 ? (
              <div className="space-y-3">
                <div className="p-4 bg-warning/10 border border-warning rounded-lg">
                  <p className="font-medium">Total Pending</p>
                  <p className="text-2xl font-bold font-mono text-warning">
                    {formatPrice(earnings.pendingWithdrawals)}
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Awaiting payout approval
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground">No pending withdrawals</p>
            )}
          </Card>
        </div>

        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-6">Payout History</h2>

          {withdrawals.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No payout history</p>
          ) : (
            <div className="space-y-3">
              {withdrawals.map((withdrawal) => (
                <div key={withdrawal.id} className="flex items-center justify-between p-4 border border-border rounded-lg">
                  <div>
                    <p className="font-medium font-mono">{formatPrice(withdrawal.amount)}</p>
                    <p className="text-sm text-muted-foreground">
                      {withdrawal.created_at
                        ? new Date(withdrawal.created_at).toLocaleDateString()
                        : "Unknown date"}
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
    </RoleGuard>
  );
}
