"use client";

import { useState, useEffect } from "react";
import { SellerLayout } from "@/components/SellerLayout";
import { RoleGuard } from "@/components/RoleGuard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DollarSign, TrendingUp, Clock, CheckCircle } from "lucide-react";
import Link from "next/link";

interface Payout {
  id: string;
  amount: number;
  status: string;
  date: string;
  method: string;
  reference?: string;
}

export default function SellerPayoutsPage() {
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [loading, setLoading] = useState(true);
  const [availableBalance, setAvailableBalance] = useState(0);

  useEffect(() => {
    loadPayouts();
  }, []);

  const loadPayouts = async () => {
    try {
      // Mock data
      setAvailableBalance(2450.75);
      setPayouts([
        {
          id: "1",
          amount: 1500.0,
          status: "completed",
          date: "2024-01-10",
          method: "Bank Transfer",
        },
        {
          id: "2",
          amount: 850.5,
          status: "pending",
          date: "2024-01-15",
          method: "Bank Transfer",
        },
      ]);
    } catch (error) {
      console.error("Failed to load payouts:", error);
    } finally {
      setLoading(false);
    }
  };

  const stats = {
    availableBalance: 2450.75,
    pendingPayouts: 850.5,
    totalEarnings: 94350,
    nextPayoutDate: "2026-06-07",
  };

  const statusColors: Record<string, string> = {
    completed: "bg-green-500/10 text-green-700",
    processing: "bg-blue-500/10 text-blue-700",
    pending: "bg-yellow-500/10 text-yellow-700",
    failed: "bg-red-500/10 text-red-700",
  };

  return (
    <RoleGuard allowedRoles={["seller"]}>
      <SellerLayout>
        <div className="space-y-8">
          <div>
            <h1 className="text-3xl font-bold font-serif mb-2">Payouts & Earnings</h1>
            <p className="text-muted-foreground">Manage your seller earnings and payouts</p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-muted-foreground">Available Balance</p>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </div>
                <p className="text-2xl font-bold">${stats.availableBalance.toFixed(2)}</p>
                <Button size="sm" className="mt-3 w-full">Request Payout</Button>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-muted-foreground">Pending Payouts</p>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </div>
                <p className="text-2xl font-bold">${stats.pendingPayouts.toFixed(2)}</p>
                <p className="text-xs text-muted-foreground mt-1">Processing</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-muted-foreground">Total Earnings</p>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </div>
                <p className="text-2xl font-bold">${stats.totalEarnings.toLocaleString()}</p>
                <p className="text-xs text-green-600 mt-1">All time</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-muted-foreground">Next Payout</p>
                  <CheckCircle className="h-4 w-4 text-muted-foreground" />
                </div>
                <p className="text-2xl font-bold">{new Date(stats.nextPayoutDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</p>
                <p className="text-xs text-muted-foreground mt-1">Scheduled</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Payout History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {payouts.map((payout) => (
                  <div
                    key={payout.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <p className="font-semibold font-mono">{payout.id}</p>
                        <Badge className={statusColors[payout.status]}>{payout.status}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {payout.method} • {new Date(payout.date).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}
                      </p>
                      {payout.reference !== "-" && (
                        <p className="text-xs text-muted-foreground">Ref: {payout.reference}</p>
                      )}
                    </div>

                    <div className="text-right">
                      <p className="text-lg font-bold">${payout.amount.toFixed(2)}</p>
                      <Button variant="outline" size="sm" className="mt-2">
                        View Details
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <p className="text-sm text-muted-foreground">
                💡 <strong>Note:</strong> Payouts are processed every Monday and Thursday. Allow 2-3 business days for funds to appear in your account. Minimum payout amount is $50.
              </p>
            </CardContent>
          </Card>
        </div>
      </SellerLayout>
    </RoleGuard>
  );
}