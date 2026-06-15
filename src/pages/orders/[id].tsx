import { CustomerLayout } from "@/components/CustomerLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { useAuthContext } from "@/contexts/AuthContext";
import { useMarketplaceSettings } from "@/contexts/MarketplaceSettingsContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { CheckCircle2, CreditCard, Package, RefreshCw, Truck, Home } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

interface OrderDetail {
  id: string;
  order_number: string;
  total: number;
  subtotal: number;
  tax: number;
  shipping_cost: number;
  status: string;
  created_at: string;
  shipping_full_name: string;
  shipping_address: string;
  shipping_city: string;
  shipping_state: string;
  shipping_postal_code: string;
  shipping_country: string;
  tracking_number: string | null;
  items: {
    id: string;
    product_title: string;
    product_image: string | null;
    quantity: number;
    price: number;
    subtotal: number;
  }[];
}

interface ReturnRequest {
  id: string;
  return_number: string;
  status: string;
  reason: string;
  refund_amount: number | null;
  admin_note: string | null;
  created_at: string | null;
}

interface PaymentSummary {
  id: string;
  amount: number;
  payment_method: string;
  status: string | null;
  transaction_id: string | null;
  payment_proof_url: string | null;
  created_at: string | null;
  paid_at: string | null;
}

const statusSteps = [
  { key: "pending", label: "Order Placed", icon: CheckCircle2 },
  { key: "confirmed", label: "Payment Confirmed", icon: CreditCard },
  { key: "processing", label: "Processing", icon: Package },
  { key: "shipped", label: "Shipped", icon: Truck },
  { key: "delivered", label: "Delivered", icon: Home },
];

export default function OrderDetailPage() {
  const router = useRouter();
  const { id } = router.query;
  const { user } = useAuthContext();
  const { formatPrice } = useMarketplaceSettings();
  const { toast } = useToast();
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [payment, setPayment] = useState<PaymentSummary | null>(null);
  const [returnRequests, setReturnRequests] = useState<ReturnRequest[]>([]);
  const [returnReason, setReturnReason] = useState("");
  const [returnDetails, setReturnDetails] = useState("");
  const [submittingReturn, setSubmittingReturn] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id || typeof id !== 'string') return;

    async function fetchOrder() {
      const { data: orderData } = await supabase
        .from("orders")
        .select(`
          *,
          items:order_items(
            id,
            product_title,
            product_image,
            quantity,
            price,
            subtotal
          )
        `)
        .eq("id", id as string)
        .single();

      if (orderData) {
        setOrder(orderData as unknown as OrderDetail);
      }

      const { data: paymentData } = await supabase
        .from("payments")
        .select("id, amount, payment_method, status, transaction_id, payment_proof_url, created_at, paid_at")
        .eq("order_id", id as string)
        .order("created_at", { ascending: false })
        .limit(1);
      setPayment(((paymentData ?? []) as unknown as PaymentSummary[])[0] ?? null);

      if (user) {
        const { data: returnsData } = await supabase
          .from("return_requests")
          .select("id, return_number, status, reason, refund_amount, admin_note, created_at")
          .eq("order_id", id as string)
          .order("created_at", { ascending: false });
        setReturnRequests((returnsData ?? []) as unknown as ReturnRequest[]);
      }
      setLoading(false);
    }

    fetchOrder();
  }, [id, user]);

  const submitReturnRequest = async () => {
    if (!order || !user) {
      toast({
        title: "Login required",
        description: "Please log in to request a return.",
        variant: "destructive",
      });
      return;
    }

    if (!returnReason.trim()) {
      toast({
        title: "Reason required",
        description: "Please enter a return reason.",
        variant: "destructive",
      });
      return;
    }

    setSubmittingReturn(true);
    const { data, error } = await supabase
      .from("return_requests")
      .insert({
        order_id: order.id,
        reason: returnReason.trim(),
        details: returnDetails.trim() || null,
      })
      .select("id, return_number, status, reason, refund_amount, admin_note, created_at")
      .single();

    if (error) {
      toast({
        title: "Return request failed",
        description: error.message,
        variant: "destructive",
      });
    } else if (data) {
      setReturnRequests((current) => [data as unknown as ReturnRequest, ...current]);
      setReturnReason("");
      setReturnDetails("");
      toast({
        title: "Return requested",
        description: "Admin will review your return and refund request.",
      });
    }
    setSubmittingReturn(false);
  };

  if (loading) {
    return (
      <CustomerLayout>
        <div className="container py-16 text-center">
          <p className="text-muted-foreground">Loading order details...</p>
        </div>
      </CustomerLayout>
    );
  }

  if (!order) {
    return (
      <CustomerLayout>
        <div className="container py-16 text-center">
          <h1 className="text-2xl font-bold mb-4">Order not found</h1>
          <Button onClick={() => router.push("/")}>Return to Homepage</Button>
        </div>
      </CustomerLayout>
    );
  }

  const currentStepIndex = statusSteps.findIndex((step) => step.key === order.status);
  const canRequestReturn = ["shipped", "delivered"].includes(order.status);
  const hasActiveReturn = returnRequests.some((request) => !["rejected"].includes(request.status));

  return (
    <CustomerLayout>
      <div className="container py-8">
        <Card className="p-8 mb-8 text-center bg-accent/5 border-accent">
          <CheckCircle2 className="h-16 w-16 mx-auto mb-4 text-accent" />
          <h1 className="text-3xl font-bold mb-2">Order Confirmed!</h1>
          <p className="text-muted-foreground mb-4">
            Thank you for your purchase. Your order has been received.
          </p>
          <p className="text-lg font-mono mb-1">
            Order Number: <span className="font-bold text-accent">{order.order_number}</span>
          </p>
          <p className="text-sm text-muted-foreground">
            {new Date(order.created_at).toLocaleDateString()} at{" "}
            {new Date(order.created_at).toLocaleTimeString()}
          </p>
        </Card>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-6">Order Status</h2>

              <div className="flex justify-between mb-8">
                {statusSteps.map((step, index) => {
                  const Icon = step.icon;
                  const isActive = index <= currentStepIndex;
                  const isCurrent = index === currentStepIndex;

                  return (
                    <div key={step.key} className="flex-1 relative">
                      <div className="flex flex-col items-center">
                        <div
                          className={`w-12 h-12 rounded-full flex items-center justify-center border-2 transition-colors ${
                            isActive
                              ? "bg-accent border-accent text-white"
                              : "bg-muted border-border text-muted-foreground"
                          }`}
                        >
                          <Icon className="h-6 w-6" />
                        </div>
                        <span
                          className={`text-xs mt-2 text-center font-medium ${
                            isCurrent ? "text-accent" : isActive ? "text-foreground" : "text-muted-foreground"
                          }`}
                        >
                          {step.label}
                        </span>
                      </div>
                      {index < statusSteps.length - 1 && (
                        <div
                          className={`absolute top-6 left-1/2 w-full h-0.5 -z-10 ${
                            index < currentStepIndex ? "bg-accent" : "bg-border"
                          }`}
                        />
                      )}
                    </div>
                  );
                })}
              </div>

              <Badge
                className={
                  order.status === "delivered"
                    ? "bg-green-500"
                    : order.status === "cancelled"
                    ? "bg-destructive"
                    : "bg-accent"
                }
              >
                {order.status.toUpperCase()}
              </Badge>
              {order.tracking_number && (
                <p className="mt-3 text-sm text-muted-foreground">
                  Tracking number: <span className="font-mono font-semibold">{order.tracking_number}</span>
                </p>
              )}
            </Card>

            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-6">Order Items</h2>

              <div className="space-y-4">
                {order.items.map((item) => (
                  <div key={item.id} className="flex gap-4">
                    <div className="relative w-20 h-20 rounded bg-muted flex-shrink-0">
                      <Image
                        src={item.product_image || "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=100&h=100&fit=crop"}
                        alt={item.product_title}
                        fill
                        className="object-cover rounded"
                      />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium mb-1">{item.product_title}</h3>
                      <p className="text-sm text-muted-foreground">Quantity: {item.quantity}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-mono">{formatPrice(item.price)}</p>
                      <p className="text-sm text-muted-foreground font-mono">
                        Total: {formatPrice(item.subtotal)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          <div className="lg:col-span-1 space-y-6">
            <Card className="p-6">
              <h3 className="font-semibold text-lg mb-4">Order Summary</h3>

              <div className="space-y-2 text-sm mb-4">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-mono">{formatPrice(order.subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Shipping</span>
                  <span className="font-mono">{formatPrice(order.shipping_cost)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tax</span>
                  <span className="font-mono">{formatPrice(order.tax)}</span>
                </div>
              </div>

              <Separator className="my-4" />

              <div className="flex justify-between text-lg font-bold">
                <span>Total</span>
                <span className="font-mono">{formatPrice(order.total)}</span>
              </div>
            </Card>

            {payment && (
              <Card className="p-6">
                <h3 className="mb-4 flex items-center gap-2 font-semibold text-lg">
                  <CreditCard className="h-5 w-5 text-accent" />
                  Payment
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-muted-foreground">Status</span>
                    <Badge variant="outline">{payment.status || "pending"}</Badge>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-muted-foreground">Method</span>
                    <span className="font-medium">{payment.payment_method}</span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-muted-foreground">Amount</span>
                    <span className="font-mono font-semibold">{formatPrice(payment.amount)}</span>
                  </div>
                  {payment.transaction_id && (
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-muted-foreground">Reference</span>
                      <span className="font-mono text-xs">{payment.transaction_id}</span>
                    </div>
                  )}
                  {payment.payment_proof_url && (
                    <a
                      href={payment.payment_proof_url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex text-sm font-medium text-primary hover:underline"
                    >
                      View payment proof
                    </a>
                  )}
                </div>
              </Card>
            )}

            <Card className="p-6">
              <h3 className="font-semibold text-lg mb-4">Shipping Address</h3>
              <div className="text-sm space-y-1">
                <p className="font-medium">{order.shipping_full_name}</p>
                <p className="text-muted-foreground">{order.shipping_address}</p>
                <p className="text-muted-foreground">
                  {order.shipping_city}, {order.shipping_state} {order.shipping_postal_code}
                </p>
                <p className="text-muted-foreground">{order.shipping_country}</p>
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="mb-4 flex items-center gap-2 font-semibold text-lg">
                <RefreshCw className="h-5 w-5 text-accent" />
                Return & Refund
              </h3>
              {returnRequests.length > 0 && (
                <div className="mb-4 space-y-2">
                  {returnRequests.map((request) => (
                    <div key={request.id} className="rounded-md border p-3 text-sm">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-mono font-semibold">{request.return_number}</span>
                        <Badge variant="outline">{request.status}</Badge>
                      </div>
                      <p className="mt-1 text-muted-foreground">{request.reason}</p>
                      {request.refund_amount ? (
                        <p className="mt-1 font-mono text-xs">
                          Refund: {formatPrice(request.refund_amount)}
                        </p>
                      ) : null}
                      {request.admin_note && (
                        <p className="mt-1 text-xs text-muted-foreground">{request.admin_note}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
              {canRequestReturn && !hasActiveReturn ? (
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="return_reason">Return reason</Label>
                    <Input
                      id="return_reason"
                      value={returnReason}
                      onChange={(event) => setReturnReason(event.target.value)}
                      placeholder="Damaged item, wrong size, not as described..."
                    />
                  </div>
                  <div>
                    <Label htmlFor="return_details">Details</Label>
                    <Textarea
                      id="return_details"
                      value={returnDetails}
                      onChange={(event) => setReturnDetails(event.target.value)}
                      rows={3}
                      placeholder="Add details for admin review."
                    />
                  </div>
                  <Button
                    className="w-full"
                    onClick={submitReturnRequest}
                    disabled={submittingReturn}
                  >
                    {submittingReturn ? "Submitting..." : "Request Return"}
                  </Button>
                </div>
              ) : hasActiveReturn ? (
                <p className="text-sm text-muted-foreground">
                  Your return request is already in review. Updates will appear here.
                </p>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Returns become available after the seller ships the order.
                </p>
              )}
            </Card>

            <div className="space-y-3">
              <Button variant="outline" className="w-full" asChild>
                <Link href="/account/orders">View All Orders</Link>
              </Button>
              <Button variant="outline" className="w-full" asChild>
                <Link href="/">Continue Shopping</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </CustomerLayout>
  );
}
