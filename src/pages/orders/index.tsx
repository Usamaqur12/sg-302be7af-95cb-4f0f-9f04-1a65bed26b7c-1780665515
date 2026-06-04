"use client";

import { CustomerLayout } from "@/components/CustomerLayout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuthContext } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { Loader2, Package, Clock, CheckCircle, XCircle, TruckIcon } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";

const STATUS_ICONS = {
  pending: Clock,
  confirmed: CheckCircle,
  processing: Package,
  shipped: TruckIcon,
  delivered: CheckCircle,
  cancelled: XCircle,
  refunded: XCircle,
};

const STATUS_COLORS = {
  pending: "bg-yellow-500/10 text-yellow-700",
  confirmed: "bg-blue-500/10 text-blue-700",
  processing: "bg-purple-500/10 text-purple-700",
  shipped: "bg-indigo-500/10 text-indigo-700",
  delivered: "bg-green-500/10 text-green-700",
  cancelled: "bg-red-500/10 text-red-700",
  refunded: "bg-gray-500/10 text-gray-700",
};

export default function OrdersPage() {
  const router = useRouter();
  const { user } = useAuthContext();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchOrders();
    }
  }, [user]);

  const fetchOrders = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("orders")
        .select(`
          id,
          order_number,
          status,
          total,
          created_at,
          items:order_items(
            id,
            product_title,
            product_image,
            quantity,
            price
          )
        `)
        .eq("customer_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching orders:", error);
        setOrders([]);
      } else {
        setOrders(data || []);
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <ProtectedRoute requireAuth requiredRole="customer">
        <CustomerLayout>
          <div className="container py-16 flex items-center justify-center">
            <div className="text-center">
              <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-primary" />
              <p className="text-muted-foreground">Loading your orders...</p>
            </div>
          </div>
        </CustomerLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute requireAuth requiredRole="customer">
      <CustomerLayout>
        <div className="container py-8">
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-3">My Orders</h1>
            <p className="text-muted-foreground text-lg">
              Track and manage your orders
            </p>
          </div>

          {orders.length > 0 ? (
            <div className="space-y-4">
              {orders.map((order) => {
                const StatusIcon = STATUS_ICONS[order.status as keyof typeof STATUS_ICONS] || Package;
                const statusColor = STATUS_COLORS[order.status as keyof typeof STATUS_COLORS] || "bg-gray-500/10 text-gray-700";

                return (
                  <Card key={order.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-4">
                      <div className="space-y-1">
                        <CardTitle className="text-lg font-semibold">
                          Order {order.order_number}
                        </CardTitle>
                        <p className="text-sm text-muted-foreground">
                          Placed on {format(new Date(order.created_at), "MMM dd, yyyy")}
                        </p>
                      </div>
                      <Badge className={statusColor}>
                        <StatusIcon className="h-3 w-3 mr-1" />
                        {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                      </Badge>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {/* Order Items Preview */}
                        <div className="space-y-2">
                          {order.items?.slice(0, 2).map((item: any) => (
                            <div key={item.id} className="flex items-center gap-3 text-sm">
                              <div className="h-12 w-12 rounded bg-muted flex-shrink-0">
                                {item.product_image && (
                                  <img
                                    src={item.product_image}
                                    alt={item.product_title}
                                    className="h-full w-full object-cover rounded"
                                  />
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-medium truncate">{item.product_title}</p>
                                <p className="text-muted-foreground">
                                  Qty: {item.quantity} × ${item.price}
                                </p>
                              </div>
                            </div>
                          ))}
                          {order.items && order.items.length > 2 && (
                            <p className="text-sm text-muted-foreground">
                              +{order.items.length - 2} more item(s)
                            </p>
                          )}
                        </div>

                        {/* Order Total and Actions */}
                        <div className="flex items-center justify-between pt-4 border-t">
                          <div>
                            <p className="text-sm text-muted-foreground">Total</p>
                            <p className="text-2xl font-bold">${order.total.toFixed(2)}</p>
                          </div>
                          <Button asChild>
                            <Link href={`/orders/${order.id}`}>
                              View Details
                            </Link>
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <Card className="p-12 text-center">
              <Package className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
              <p className="text-lg font-semibold mb-2">No orders yet</p>
              <p className="text-muted-foreground mb-6">
                Start shopping to see your orders here
              </p>
              <Button asChild>
                <Link href="/products">Browse Products</Link>
              </Button>
            </Card>
          )}
        </div>
      </CustomerLayout>
    </ProtectedRoute>
  );
}