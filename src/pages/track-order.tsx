"use client";

import { useState } from "react";
import { CheckCircle2, Package, Search, Truck } from "lucide-react";
import { CustomerLayout } from "@/components/CustomerLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Database } from "@/integrations/supabase/database.types";

type OrderStatus = Database["public"]["Enums"]["order_status"];

interface TrackingResult {
  orderNumber: string;
  status: OrderStatus | null;
  trackingNumber: string | null;
  createdAt: string | null;
  shippedAt: string | null;
  deliveredAt: string | null;
}

export default function TrackOrderPage() {
  const [orderNumber, setOrderNumber] = useState("");
  const [email, setEmail] = useState("");
  const [result, setResult] = useState<TrackingResult | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    setResult(null);

    try {
      const response = await fetch("/api/orders/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderNumber, email }),
      });
      const payload = await response.json() as { order?: TrackingResult; error?: string };

      if (!response.ok || !payload.order) {
        throw new Error(payload.error || "Order not found");
      }

      setResult(payload.order);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Order tracking failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <CustomerLayout>
      <div className="container py-12">
        <div className="mx-auto max-w-2xl space-y-6">
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <Package className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-3xl font-bold">Track Your Order</h1>
            <p className="text-muted-foreground">Use the email entered during checkout.</p>
          </div>

          <Card>
            <CardHeader><CardTitle>Order Tracking</CardTitle></CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="orderNumber">Order Number</Label>
                  <Input
                    id="orderNumber"
                    value={orderNumber}
                    onChange={(event) => setOrderNumber(event.target.value)}
                    placeholder="e.g. ORD-123456"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="you@example.com"
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  <Search className="mr-2 h-4 w-4" />
                  {loading ? "Checking..." : "Track Order"}
                </Button>
              </form>
            </CardContent>
          </Card>

          {error && (
            <Card className="border-destructive">
              <CardContent className="pt-6 text-center text-destructive">{error}</CardContent>
            </Card>
          )}

          {result && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="font-mono">{result.orderNumber}</CardTitle>
                <Badge>{result.status || "pending"}</Badge>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-3">
                  <Package className="mt-0.5 h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Order placed</p>
                    <p className="text-sm text-muted-foreground">
                      {result.createdAt ? new Date(result.createdAt).toLocaleString() : "Date unavailable"}
                    </p>
                  </div>
                </div>
                {result.shippedAt && (
                  <div className="flex items-start gap-3">
                    <Truck className="mt-0.5 h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">Shipped</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(result.shippedAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                )}
                {result.deliveredAt && (
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 text-green-600" />
                    <div>
                      <p className="font-medium">Delivered</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(result.deliveredAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                )}
                <div className="rounded-md bg-muted p-4">
                  <p className="text-sm text-muted-foreground">Carrier tracking number</p>
                  <p className="mt-1 font-mono font-semibold">
                    {result.trackingNumber || "Not assigned yet"}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </CustomerLayout>
  );
}
