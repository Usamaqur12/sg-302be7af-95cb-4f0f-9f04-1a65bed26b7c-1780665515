import { CustomerLayout } from "@/components/CustomerLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { Package, Heart, User, Settings } from "lucide-react";
import Link from "next/link";

interface Order {
  id: string;
  order_number: string;
  total: number;
  status: string;
  created_at: string;
  items: { id: string; product_title: string }[];
}

export default function AccountDashboard() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/");
      return;
    }

    if (user) {
      async function fetchOrders() {
        const { data: ordersData } = await supabase
          .from("orders")
          .select(`
            id,
            order_number,
            total,
            status,
            created_at,
            items:order_items(id, product_title)
          `)
          .eq("customer_id", user.id)
          .order("created_at", { ascending: false });

        setOrders((ordersData as any) || []);
        setLoading(false);
      }

      fetchOrders();
    }
  }, [user, authLoading, router]);

  if (authLoading || loading) {
    return (
      <CustomerLayout>
        <div className="container py-16 text-center">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </CustomerLayout>
    );
  }

  return (
    <CustomerLayout>
      <div className="container py-8">
        <h1 className="text-3xl font-bold mb-8">My Account</h1>

        <Tabs defaultValue="orders" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="orders">
              <Package className="h-4 w-4 mr-2" />
              Orders
            </TabsTrigger>
            <TabsTrigger value="wishlist">
              <Heart className="h-4 w-4 mr-2" />
              Wishlist
            </TabsTrigger>
            <TabsTrigger value="profile">
              <User className="h-4 w-4 mr-2" />
              Profile
            </TabsTrigger>
            <TabsTrigger value="settings">
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="orders" className="space-y-4">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-semibold">Order History</h2>
              <p className="text-muted-foreground">{orders.length} orders</p>
            </div>

            {orders.length === 0 ? (
              <Card className="p-12 text-center">
                <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground mb-4">No orders yet</p>
                <Button asChild>
                  <Link href="/">Start Shopping</Link>
                </Button>
              </Card>
            ) : (
              <div className="space-y-4">
                {orders.map((order) => (
                  <Card key={order.id} className="p-6 hover:border-accent transition-colors">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <Link href={`/orders/${order.id}`}>
                          <h3 className="font-semibold hover:text-accent transition-colors">
                            {order.order_number}
                          </h3>
                        </Link>
                        <p className="text-sm text-muted-foreground">
                          {new Date(order.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold font-mono">${order.total.toFixed(2)}</p>
                        <Badge
                          className={
                            order.status === "delivered"
                              ? "bg-green-500"
                              : order.status === "cancelled"
                              ? "bg-destructive"
                              : "bg-accent"
                          }
                        >
                          {order.status}
                        </Badge>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground mb-4">
                      {order.items.length} {order.items.length === 1 ? "item" : "items"}
                    </p>
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/orders/${order.id}`}>View Details</Link>
                    </Button>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="wishlist">
            <Card className="p-12 text-center">
              <Heart className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground mb-4">Wishlist feature coming soon</p>
              <Button asChild>
                <Link href="/">Browse Products</Link>
              </Button>
            </Card>
          </TabsContent>

          <TabsContent value="profile">
            <Card className="p-6">
              <h3 className="text-xl font-semibold mb-6">Profile Information</h3>
              <div className="space-y-4 mb-6">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Email</label>
                  <p className="text-lg">{user?.email}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Member Since</label>
                  <p className="text-lg">
                    {user?.created_at ? new Date(user.created_at).toLocaleDateString() : "N/A"}
                  </p>
                </div>
              </div>
              <Button variant="outline">Edit Profile</Button>
            </Card>
          </TabsContent>

          <TabsContent value="settings">
            <Card className="p-6">
              <h3 className="text-xl font-semibold mb-6">Account Settings</h3>
              <div className="space-y-4">
                <Button variant="outline" className="w-full justify-start">
                  Change Password
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  Manage Addresses
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  Notification Preferences
                </Button>
                <Button variant="destructive" className="w-full justify-start">
                  Delete Account
                </Button>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </CustomerLayout>
  );
}