"use client";

import { AdminLayout } from "@/components/AdminLayout";
import { RoleGuard } from "@/components/RoleGuard";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Search, Eye, Package } from "lucide-react";
import Link from "next/link";

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-500/10 text-yellow-700",
  confirmed: "bg-blue-500/10 text-blue-700",
  processing: "bg-blue-500/10 text-blue-700",
  dispatched: "bg-purple-500/10 text-purple-700",
  in_transit: "bg-purple-500/10 text-purple-700",
  delivered: "bg-green-500/10 text-green-700",
  completed: "bg-green-500/10 text-green-700",
  cancelled: "bg-red-500/10 text-red-700",
  returned: "bg-orange-500/10 text-orange-700",
  refunded: "bg-orange-500/10 text-orange-700",
};

export default function AdminOrdersPage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);

      if (error) throw error;

      setOrders(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Could not load orders",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredOrders = orders.filter((order) =>
    order.order_number?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <RoleGuard allowedRoles={["admin"]}>
      <AdminLayout>
        <div className="space-y-8">
          <div>
            <h1 className="text-3xl font-bold font-serif mb-2">Order Management</h1>
            <p className="text-muted-foreground">View and manage all marketplace orders</p>
          </div>

          <Card>
            <CardContent className="pt-6">
              <div className="flex gap-4 mb-6">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by order number..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {loading ? (
                <div className="flex items-center justify-center py-24">
                  <Loader2 className="h-12 w-12 animate-spin text-muted-foreground" />
                </div>
              ) : filteredOrders.length > 0 ? (
                <div className="space-y-4">
                  {filteredOrders.map((order) => (
                    <div
                      key={order.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-1">
                          <p className="font-semibold font-mono">{order.order_number}</p>
                          <Badge className={STATUS_COLORS[order.order_status]}>
                            {order.order_status}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          ${order.total_amount?.toFixed(2)} • {new Date(order.created_at).toLocaleDateString()}
                        </p>
                      </div>

                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/orders/${order.id}`}>
                          <Eye className="h-4 w-4 mr-2" />
                          View Details
                        </Link>
                      </Button>
                    </div>
                  ))}
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