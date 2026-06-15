"use client";

import { AdminLayout } from "@/components/AdminLayout";
import { RoleGuard } from "@/components/RoleGuard";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuthContext } from "@/contexts/AuthContext";
import { useMarketplaceSettings } from "@/contexts/MarketplaceSettingsContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/database.types";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Eye, Loader2, Package, Search, Truck } from "lucide-react";
import Link from "next/link";

type Order = Database["public"]["Tables"]["orders"]["Row"];
type OrderStatus = Database["public"]["Enums"]["order_status"];

const ORDER_STATUSES: OrderStatus[] = [
  "pending",
  "confirmed",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
  "refunded",
];

const STATUS_COLORS: Record<OrderStatus, string> = {
  pending: "bg-yellow-500/10 text-yellow-700",
  confirmed: "bg-blue-500/10 text-blue-700",
  processing: "bg-cyan-500/10 text-cyan-700",
  shipped: "bg-purple-500/10 text-purple-700",
  delivered: "bg-green-500/10 text-green-700",
  cancelled: "bg-red-500/10 text-red-700",
  refunded: "bg-orange-500/10 text-orange-700",
};

export default function AdminOrdersPage() {
  const { user, loading: authLoading } = useAuthContext();
  const { formatPrice } = useMarketplaceSettings();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<OrderStatus | "all">("all");
  const [trackingDrafts, setTrackingDrafts] = useState<Record<string, string>>({});

  const loadOrders = useCallback(async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);

      if (error) throw error;
      const nextOrders = data || [];
      setOrders(nextOrders);
      setTrackingDrafts(
        Object.fromEntries(
          nextOrders.map((order) => [order.id, order.tracking_number || ""])
        )
      );
    } catch {
      toast({
        title: "Error",
        description: "Could not load orders",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    if (authLoading || !user) return;
    loadOrders();
  }, [authLoading, loadOrders, user]);

  const updateOrderStatus = async (order: Order, status: OrderStatus) => {
    if (order.status === status) return;

    const trackingNumber = trackingDrafts[order.id]?.trim() || "";
    if (status === "shipped" && !trackingNumber) {
      toast({
        title: "Tracking required",
        description: "Add courier tracking number before marking this order shipped.",
        variant: "destructive",
      });
      return;
    }

    setUpdatingOrderId(order.id);

    const timestamp = new Date().toISOString();
    const update: Database["public"]["Tables"]["orders"]["Update"] = {
      status,
      updated_at: timestamp,
    };

    if (status === "shipped") {
      update.tracking_number = trackingNumber;
      update.shipped_at = timestamp;
    }
    if (status === "delivered") {
      update.delivered_at = timestamp;
      if (!order.shipped_at) update.shipped_at = timestamp;
    }
    if (status === "cancelled") update.cancelled_at = timestamp;

    const { error } = await supabase.from("orders").update(update).eq("id", order.id);

    if (error) {
      toast({
        title: "Update Failed",
        description: "Could not update the order status",
        variant: "destructive",
      });
    } else {
      setOrders((current) =>
        current.map((item) =>
          item.id === order.id ? { ...item, ...update } : item
        )
      );
      toast({
        title: "Order Updated",
        description: `${order.order_number} is now ${status}`,
      });
    }

    setUpdatingOrderId(null);
  };

  const normalizedSearch = searchQuery.trim().toLowerCase();
  const filteredOrders = orders.filter((order) => {
    const matchesStatus =
      statusFilter === "all" || (order.status ?? "pending") === statusFilter;
    const matchesSearch =
      !normalizedSearch ||
      order.order_number.toLowerCase().includes(normalizedSearch) ||
      order.shipping_full_name.toLowerCase().includes(normalizedSearch) ||
      order.shipping_city.toLowerCase().includes(normalizedSearch) ||
      (order.tracking_number || "").toLowerCase().includes(normalizedSearch);

    return matchesStatus && matchesSearch;
  });

  const stats = useMemo(() => ({
    pending: orders.filter((order) => ["pending", "confirmed"].includes(order.status || "pending")).length,
    processing: orders.filter((order) => order.status === "processing").length,
    shipped: orders.filter((order) => order.status === "shipped").length,
    delivered: orders.filter((order) => order.status === "delivered").length,
  }), [orders]);

  return (
    <RoleGuard allowedRoles={["admin", "manager", "warehouse"]}>
      <AdminLayout>
        <div className="space-y-8">
          <div>
            <h1 className="text-3xl font-bold font-serif mb-2">Order Management</h1>
            <p className="text-muted-foreground">
              View and update all marketplace orders
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground">To Confirm</p>
                <p className="mt-2 text-2xl font-bold">{stats.pending}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground">Processing</p>
                <p className="mt-2 text-2xl font-bold">{stats.processing}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground">In Transit</p>
                <p className="mt-2 text-2xl font-bold">{stats.shipped}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground">Delivered</p>
                <p className="mt-2 text-2xl font-bold">{stats.delivered}</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row gap-4 mb-6">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search order, customer, or city..."
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select
                  value={statusFilter}
                  onValueChange={(value) =>
                    setStatusFilter(value as OrderStatus | "all")
                  }
                >
                  <SelectTrigger className="w-full md:w-52">
                    <SelectValue placeholder="Filter status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All statuses</SelectItem>
                    {ORDER_STATUSES.map((status) => (
                      <SelectItem key={status} value={status}>
                        {status}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {loading ? (
                <div className="flex items-center justify-center py-24">
                  <Loader2 className="h-12 w-12 animate-spin text-muted-foreground" />
                </div>
              ) : filteredOrders.length > 0 ? (
                <div className="space-y-4">
                  {filteredOrders.map((order) => {
                    const status = order.status ?? "pending";

                    return (
                      <div
                        key={order.id}
                        className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-4 border rounded-lg hover:bg-muted/50 transition"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-1">
                            <p className="font-semibold font-mono">
                              {order.order_number}
                            </p>
                            <Badge className={STATUS_COLORS[status]}>{status}</Badge>
                          </div>
                          <p className="text-sm">
                            {order.shipping_full_name} - {order.shipping_city}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {formatPrice(order.total)} -{" "}
                            {order.created_at
                              ? new Date(order.created_at).toLocaleDateString()
                              : "Unknown date"}
                          </p>
                          <div className="mt-3 max-w-sm">
                            <p className="mb-1 text-xs font-medium text-muted-foreground">
                              Courier Tracking
                            </p>
                            <Input
                              value={trackingDrafts[order.id] || ""}
                              onChange={(event) =>
                                setTrackingDrafts((current) => ({
                                  ...current,
                                  [order.id]: event.target.value,
                                }))
                              }
                              placeholder="Tracking number"
                              disabled={["delivered", "cancelled", "refunded"].includes(status)}
                            />
                          </div>
                        </div>

                        <div className="flex flex-col sm:flex-row sm:flex-wrap gap-2 lg:justify-end">
                          <Select
                            value={status}
                            onValueChange={(value) =>
                              updateOrderStatus(order, value as OrderStatus)
                            }
                            disabled={updatingOrderId === order.id}
                          >
                            <SelectTrigger className="w-full sm:w-44">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {ORDER_STATUSES.map((option) => (
                                <SelectItem key={option} value={option}>
                                  {option}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Button variant="outline" size="sm" asChild>
                            <Link href={`/orders/${order.id}`}>
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </Link>
                          </Button>
                          {["pending", "confirmed"].includes(status) && (
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={updatingOrderId === order.id}
                              onClick={() => updateOrderStatus(order, "processing")}
                            >
                              <Package className="h-4 w-4 mr-2" />
                              Process
                            </Button>
                          )}
                          {["pending", "confirmed", "processing"].includes(status) && (
                            <Button
                              size="sm"
                              disabled={updatingOrderId === order.id}
                              onClick={() => updateOrderStatus(order, "shipped")}
                            >
                              <Truck className="h-4 w-4 mr-2" />
                              Ship
                            </Button>
                          )}
                          {status === "shipped" && (
                            <Button
                              size="sm"
                              disabled={updatingOrderId === order.id}
                              onClick={() => updateOrderStatus(order, "delivered")}
                            >
                              Deliver
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Package className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">No orders found</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </AdminLayout>
    </RoleGuard>
  );
}
