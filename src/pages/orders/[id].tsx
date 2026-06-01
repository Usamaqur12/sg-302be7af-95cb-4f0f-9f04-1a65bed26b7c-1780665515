import { CustomerLayout } from "@/components/CustomerLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { CheckCircle2, Package, Truck, Home } from "lucide-react";
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
  items: {
    id: string;
    product_title: string;
    product_image: string | null;
    quantity: number;
    price: number;
    subtotal: number;
  }[];
}

const statusSteps = [
  { key: "pending", label: "Order Placed", icon: CheckCircle2 },
  { key: "processing", label: "Processing", icon: Package },
  { key: "shipped", label: "Shipped", icon: Truck },
  { key: "delivered", label: "Delivered", icon: Home },
];

export default function OrderDetailPage() {
  const router = useRouter();
  const { id } = router.query;
  const [order, setOrder] = useState<OrderDetail | null>(null);
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
        setOrder(orderData as any);
      }
      setLoading(false);
    }

    fetchOrder();
  }, [id]);

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
                      <p className="font-mono">${item.price.toFixed(2)}</p>
                      <p className="text-sm text-muted-foreground font-mono">
                        Total: ${item.subtotal.toFixed(2)}
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
                  <span className="font-mono">${order.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Shipping</span>
                  <span className="font-mono">${order.shipping_cost.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tax</span>
                  <span className="font-mono">${order.tax.toFixed(2)}</span>
                </div>
              </div>

              <Separator className="my-4" />

              <div className="flex justify-between text-lg font-bold">
                <span>Total</span>
                <span className="font-mono">${order.total.toFixed(2)}</span>
              </div>
            </Card>

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