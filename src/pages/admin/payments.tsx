"use client";

import { AdminLayout } from "@/components/AdminLayout";
import { RoleGuard } from "@/components/RoleGuard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CreditCard, DollarSign, TrendingUp, CheckCircle, Clock, Search } from "lucide-react";
import { useState } from "react";

export default function AdminPaymentsPage() {
  const [searchQuery, setSearchQuery] = useState("");

  // Mock payment data
  const payments = [
    {
      id: "PAY-001",
      orderId: "ORD-2345",
      customer: "John Smith",
      amount: 299.99,
      method: "Credit Card",
      status: "completed",
      date: "2026-06-04",
    },
    {
      id: "PAY-002",
      orderId: "ORD-2346",
      customer: "Sarah Jones",
      amount: 149.50,
      method: "PayPal",
      status: "completed",
      date: "2026-06-03",
    },
    {
      id: "PAY-003",
      orderId: "ORD-2347",
      customer: "Mike Wilson",
      amount: 599.00,
      method: "Credit Card",
      status: "pending",
      date: "2026-06-03",
    },
    {
      id: "PAY-004",
      orderId: "ORD-2348",
      customer: "Emma Davis",
      amount: 89.99,
      method: "Cash on Delivery",
      status: "pending",
      date: "2026-06-02",
    },
  ];

  const stats = {
    totalRevenue: 125840,
    pendingPayments: 12,
    completedToday: 42,
    processingFees: 3775,
  };

  const statusColors: Record<string, string> = {
    completed: "bg-green-500/10 text-green-700",
    pending: "bg-yellow-500/10 text-yellow-700",
    failed: "bg-red-500/10 text-red-700",
    refunded: "bg-orange-500/10 text-orange-700",
  };

  const filteredPayments = payments.filter(
    (payment) =>
      payment.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      payment.orderId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      payment.customer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <RoleGuard allowedRoles={["admin"]}>
      <AdminLayout>
        <div className="space-y-8">
          <div>
            <h1 className="text-3xl font-bold font-serif mb-2">Payment Management</h1>
            <p className="text-muted-foreground">Track and manage platform payments</p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-muted-foreground">Total Revenue</p>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </div>
                <p className="text-2xl font-bold">${stats.totalRevenue.toLocaleString()}</p>
                <p className="text-xs text-green-600 mt-1">+12% from last month</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-muted-foreground">Pending Payments</p>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </div>
                <p className="text-2xl font-bold">{stats.pendingPayments}</p>
                <p className="text-xs text-muted-foreground mt-1">Awaiting confirmation</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-muted-foreground">Completed Today</p>
                  <CheckCircle className="h-4 w-4 text-muted-foreground" />
                </div>
                <p className="text-2xl font-bold">{stats.completedToday}</p>
                <p className="text-xs text-green-600 mt-1">+5 from yesterday</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-muted-foreground">Processing Fees</p>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </div>
                <p className="text-2xl font-bold">${stats.processingFees.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground mt-1">3% avg fee</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Recent Payments</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-6">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by payment ID, order ID, or customer..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="space-y-4">
                {filteredPayments.map((payment) => (
                  <div
                    key={payment.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <p className="font-semibold font-mono">{payment.id}</p>
                        <Badge className={statusColors[payment.status]}>{payment.status}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Order: {payment.orderId} • {payment.customer}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {payment.method} • {new Date(payment.date).toLocaleDateString()}
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="text-lg font-bold">${payment.amount.toFixed(2)}</p>
                      <Button variant="outline" size="sm" className="mt-2">
                        View Details
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </AdminLayout>
    </RoleGuard>
  );
}