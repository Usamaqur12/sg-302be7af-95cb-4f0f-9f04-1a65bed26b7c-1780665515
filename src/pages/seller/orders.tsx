import { SellerLayout } from "@/components/SellerLayout";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { Package, Clock, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

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
    status: string;
    created_at: string;
    total: number;
    shipping_full_name: string;
    shipping_address: string;
    shipping_city: string;
    shipping_state: string;
    shipping_postal_code: string;
  };
}

export default function SellerOrders() {
  const { user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    if (!user) {
      router.push("/");
      return;
    }

    fetchOrders();
  }, [user, router]);

  const fetchOrders = async () => {
    if (!user) return;

    const { data: sellerProfile } = await supabase
      .from("seller_profiles")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (!sellerProfile) return;

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
          shipping_full_name,
          shipping_address,
          shipping_city,
          shipping_state,
          shipping_postal_code
        )
      `)
      .eq("seller_id", sellerProfile.id)
      .order("created_at", { ascending: false });

    setOrders((orderItems as any) || []);
    setLoading(false);
  };

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    const { error } = await supabase
      .from("orders")
      .update({ status: newStatus as any })
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
  };

  const filteredOrders = orders.filter((item) =>
    statusFilter === "all" ? true : item.order.status === statusFilter
  );

  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      pending: "bg-warning text-warning-foreground",
      processing: "bg-blue-500",
      shipped: "bg-purple-500",
      delivered: "bg-green-500",
      cancelled: "bg-destructive",
    };

    return <Badge className={variants[status] || ""}>{status}</Badge>;
  };

  if (loading) {
    return (
      <SellerLayout>
        <div className="text-center py-16">
          <p className="text-muted-foreground">Loading orders...</p>
        </div>
      </SellerLayout>
    );
  }

  return (
    <SellerLayout>
      <div>
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">Orders</h1>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Orders</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="processing">Processing</SelectItem>
              <SelectItem value="shipped">Shipped</SelectItem>
              <SelectItem value="delivered">Delivered</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
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
                      {new Date(item.order.created_at).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="text-sm text-muted-foreground mb-1">Your Earnings</p>
                    <p className="text-xl font-bold font-mono text-green-600">
                      ${item.seller_earnings.toFixed(2)}
                    </p>
                  </div>
                </div>

                <div className="flex gap-4 mb-4 pb-4 border-b border-border">
                  {item.product_image && (
                    <img
                      src={item.product_image}
                      alt={item.product_title}
                      className="w-20 h-20 rounded-lg object-cover bg-muted"
                    />
                  )}
                  <div className="flex-1">
                    <p className="font-medium mb-1">{item.product_title}</p>
                    <p className="text-sm text-muted-foreground">
                      Quantity: {item.quantity} × ${item.price.toFixed(2)}
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

                {item.order.status === "pending" && (
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
  );
}