import { SellerLayout } from "@/components/SellerLayout";
import { RoleGuard } from "@/components/RoleGuard";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuthContext } from "@/contexts/AuthContext";
import { useMarketplaceSettings } from "@/contexts/MarketplaceSettingsContext";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/database.types";
import { useCallback, useEffect, useState } from "react";
import { Package, Clock, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Image from "next/image";
import { useRouter } from "next/router";

type OrderStatus = Database["public"]["Enums"]["order_status"];

interface OrderItem {
  id: string;
  quantity: number;
  price: number;
  subtotal: number;
  seller_earnings: number;
  product_title: string;
  product_image: string | null;
  order: {
    id: string;
    order_number: string;
    status: OrderStatus | null;
    created_at: string | null;
    total: number;
    tracking_number: string | null;
    shipping_full_name: string;
    shipping_address: string;
    shipping_city: string;
    shipping_state: string;
    shipping_postal_code: string;
  };
}

export default function SellerOrders() {
  const { user, loading: authLoading } = useAuthContext();
  const { formatPrice } = useMarketplaceSettings();
  const { toast } = useToast();
  const router = useRouter();
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<OrderStatus | "all">("all");
  const [trackingDrafts, setTrackingDrafts] = useState<Record<string, string>>({});

  const fetchOrders = useCallback(async () => {
    if (!user) return;

    const { data: sellerProfile } = await supabase
      .from("seller_profiles")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (!sellerProfile) {
      setOrders([]);
      setLoading(false);
      return;
    }

    const { data: orderItems } = await supabase
      .from("order_items")
      .select(`
        id,
        quantity,
        price,
        subtotal,
        seller_earnings,
        product_title,
        product_image,
        order:orders(
          id,
          order_number,
          status,
          created_at,
          total,
          tracking_number,
          shipping_full_name,
          shipping_address,
          shipping_city,
          shipping_state,
          shipping_postal_code
        )
      `)
      .eq("seller_id", sellerProfile.id)
      .order("created_at", { ascending: false });

    const nextOrders = (orderItems ?? []) as unknown as OrderItem[];
    setOrders(nextOrders);
    setTrackingDrafts(
      Object.fromEntries(
        nextOrders.map((item) => [item.order.id, item.order.tracking_number || ""])
      )
    );
    setLoading(false);
  }, [user]);

  useEffect(() => {
    if (authLoading || !user) return;

    fetchOrders();
  }, [authLoading, fetchOrders, user]);

  useEffect(() => {
    if (!router.isReady) return;

    const status = Array.isArray(router.query.status) ? router.query.status[0] : router.query.status;
    if (["pending", "confirmed", "processing", "shipped", "delivered", "cancelled", "refunded"].includes(String(status))) {
      setStatusFilter(status as OrderStatus);
    } else {
      setStatusFilter("all");
    }
  }, [router.isReady, router.query.status]);

  const setOrderStatusFilter = (status: OrderStatus | "all") => {
    setStatusFilter(status);
    void router.replace(
      {
        pathname: "/seller/orders",
        query: status === "all" ? {} : { status },
      },
      undefined,
      { shallow: true }
    );
  };

  const updateOrderStatus = useCallback(async (orderId: string, newStatus: OrderStatus) => {
    const timestamp = new Date().toISOString();
    const update: Record<string, unknown> = { status: newStatus };
    if (newStatus === "shipped") {
      const trackingNumber = trackingDrafts[orderId]?.trim() || "";
      if (!trackingNumber) {
        toast({
          title: "Tracking required",
          description: "Enter the courier tracking number before shipping this order.",
          variant: "destructive",
        });
        return;
      }
      update.tracking_number = trackingNumber;
      update.shipped_at = timestamp;
    }
    if (newStatus === "delivered") {
      update.delivered_at = timestamp;
    }

    const { error } = await supabase
      .from("orders")
      .update(update)
      .eq("id", orderId);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to update order status",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Success",
      description: "Order status updated",
    });

    fetchOrders();
  }, [fetchOrders, toast, trackingDrafts]);

  const filteredOrders = orders.filter((item) =>
    statusFilter === "all" ? true : item.order.status === statusFilter
  );

  const getStatusBadge = (status: OrderStatus | null) => {
    const variants: Record<string, string> = {
      pending: "bg-warning text-warning-foreground",
      confirmed: "bg-blue-500",
      processing: "bg-blue-500",
      shipped: "bg-purple-500",
      delivered: "bg-green-500",
      cancelled: "bg-destructive",
      refunded: "bg-muted text-muted-foreground",
    };

    return <Badge className={variants[status] || ""}>{status}</Badge>;
  };

  if (authLoading || (user && loading)) {
    return (
      <RoleGuard allowedRoles={["seller"]}>
        <SellerLayout>
          <div className="text-center py-16">
            <p className="text-muted-foreground">Loading orders...</p>
          </div>
        </SellerLayout>
      </RoleGuard>
    );
  }

  return (
    <RoleGuard allowedRoles={["seller"]}>
      <SellerLayout>
      <div>
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">Orders</h1>

          <Select
            value={statusFilter}
            onValueChange={(value) => setOrderStatusFilter(value as OrderStatus | "all")}
          >
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Orders</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="confirmed">Confirmed</SelectItem>
              <SelectItem value="processing">Processing</SelectItem>
              <SelectItem value="shipped">Shipped</SelectItem>
              <SelectItem value="delivered">Delivered</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
              <SelectItem value="refunded">Refunded</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {filteredOrders.length === 0 ? (
          <Card className="p-12 text-center">
            <Package className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">No orders found</p>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredOrders.map((item) => (
              <Card key={item.id} className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-lg">#{item.order.order_number}</h3>
                      {getStatusBadge(item.order.status)}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {item.order.created_at
                        ? new Date(item.order.created_at).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })
                        : "Unknown date"}
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="text-sm text-muted-foreground mb-1">Your Earnings</p>
                    <p className="text-xl font-bold font-mono text-green-600">
                      {formatPrice(item.seller_earnings)}
                    </p>
                  </div>
                </div>

                <div className="flex gap-4 mb-4 pb-4 border-b border-border">
                  {item.product_image && (
                    <Image
                      src={item.product_image}
                      alt={item.product_title}
                      width={80}
                      height={80}
                      className="w-20 h-20 rounded-lg object-cover bg-muted"
                      unoptimized
                    />
                  )}
                  <div className="flex-1">
                    <p className="font-medium mb-1">{item.product_title}</p>
                    <p className="text-sm text-muted-foreground">
                      Quantity: {item.quantity} x {formatPrice(item.price)}
                    </p>
                  </div>
                </div>

                <div className="mb-4">
                  <p className="text-sm font-medium mb-2">Shipping Address:</p>
                  <p className="text-sm text-muted-foreground">
                    {item.order.shipping_full_name}<br />
                    {item.order.shipping_address}<br />
                    {item.order.shipping_city}, {item.order.shipping_state} {item.order.shipping_postal_code}
                  </p>
                </div>

                {["pending", "confirmed", "processing"].includes(String(item.order.status)) && (
                  <div className="mb-4 max-w-sm">
                    <p className="mb-2 text-sm font-medium">Tracking Number</p>
                    <Input
                      value={trackingDrafts[item.order.id] || ""}
                      onChange={(event) => setTrackingDrafts((current) => ({
                        ...current,
                        [item.order.id]: event.target.value,
                      }))}
                      placeholder="Courier tracking number"
                    />
                  </div>
                )}

                {item.order.tracking_number && (
                  <p className="mb-4 text-sm text-muted-foreground">
                    Tracking: <span className="font-mono font-semibold">{item.order.tracking_number}</span>
                  </p>
                )}

                {["pending", "confirmed"].includes(String(item.order.status)) && (
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => updateOrderStatus(item.order.id, "processing")}
                    >
                      <Clock className="h-4 w-4 mr-2" />
                      Mark Processing
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => updateOrderStatus(item.order.id, "shipped")}
                    >
                      <Package className="h-4 w-4 mr-2" />
                      Mark Shipped
                    </Button>
                  </div>
                )}

                {item.order.status === "processing" && (
                  <Button
                    size="sm"
                    onClick={() => updateOrderStatus(item.order.id, "shipped")}
                  >
                    <Package className="h-4 w-4 mr-2" />
                    Mark Shipped
                  </Button>
                )}

                {item.order.status === "shipped" && (
                  <Button
                    size="sm"
                    onClick={() => updateOrderStatus(item.order.id, "delivered")}
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Mark Delivered
                  </Button>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>
      </SellerLayout>
    </RoleGuard>
  );
}
