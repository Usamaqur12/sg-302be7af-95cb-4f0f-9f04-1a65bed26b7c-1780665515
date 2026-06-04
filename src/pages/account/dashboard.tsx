"use client";

import { CustomerLayout } from "@/components/CustomerLayout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useAuthContext } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { Package, MapPin, CreditCard, User, LogOut, Edit2, Eye, Loader2, TrendingUp, DollarSign } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

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

export default function AccountDashboardPage() {
  const { user, profile, signOut } = useAuthContext();
  const { toast } = useToast();
  const router = useRouter();

  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<any[]>([]);
  const [stats, setStats] = useState({ totalOrders: 0, totalSpent: 0 });

  const [profileData, setProfileData] = useState({
    fullName: "",
    email: "",
    phone: "",
  });

  const [shippingAddress, setShippingAddress] = useState({
    street: "",
    city: "",
    state: "",
    zipCode: "",
    country: "",
  });

  useEffect(() => {
    if (user && profile) {
      loadUserData();
    }
  }, [user, profile]);

  const loadUserData = async () => {
    try {
      setLoading(true);

      // Load profile data
      setProfileData({
        fullName: profile?.full_name || "",
        email: user?.email || "",
        phone: profile?.phone || "",
      });

      // Load orders
      const { data: ordersData, error: ordersError } = await supabase
        .from("orders")
        .select("*")
        .eq("customer_id", user?.id)
        .order("created_at", { ascending: false })
        .limit(10);

      if (ordersError) throw ordersError;

      setOrders(ordersData || []);

      // Calculate stats
      const totalSpent = (ordersData || []).reduce((sum: number, order: any) => sum + (order.total_amount || 0), 0);
      setStats({
        totalOrders: ordersData?.length || 0,
        totalSpent,
      });
    } catch (error: any) {
      console.error("Error loading user data:", error);
      toast({
        title: "Error",
        description: "Could not load your account data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!user) return;

    setSaving(true);

    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: profileData.fullName,
          phone: profileData.phone,
        })
        .eq("id", user.id);

      if (error) throw error;

      toast({
        title: "Profile Updated",
        description: "Your account details have been saved successfully.",
      });

      setIsEditing(false);
    } catch (error: any) {
      toast({
        title: "Update Failed",
        description: error.message || "Could not update profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAddress = async () => {
    if (!user) return;

    setSaving(true);

    try {
      const fullAddress = `${shippingAddress.street}, ${shippingAddress.city}, ${shippingAddress.state} ${shippingAddress.zipCode}, ${shippingAddress.country}`;

      const { error } = await supabase
        .from("profiles")
        .update({
          address: fullAddress,
        })
        .eq("id", user.id);

      if (error) throw error;

      toast({
        title: "Address Updated",
        description: "Your shipping address has been saved successfully.",
      });
    } catch (error: any) {
      toast({
        title: "Update Failed",
        description: error.message || "Could not update address. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    toast({
      title: "Signed Out",
      description: "You have been signed out successfully.",
    });
    router.push("/login");
  };

  return (
    <ProtectedRoute>
      <CustomerLayout>
        <div className="container py-12">
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2">My Account</h1>
            <p className="text-muted-foreground">Manage your account details and view your orders</p>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-24">
              <Loader2 className="h-12 w-12 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              {/* Account Stats */}
              <div className="grid md:grid-cols-3 gap-6 mb-8">
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Total Orders</p>
                        <p className="text-2xl font-bold font-mono">{stats.totalOrders}</p>
                      </div>
                      <Package className="h-8 w-8 text-primary" />
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Total Spent</p>
                        <p className="text-2xl font-bold font-mono">${stats.totalSpent.toFixed(2)}</p>
                      </div>
                      <DollarSign className="h-8 w-8 text-green-600" />
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Member Since</p>
                        <p className="text-2xl font-bold font-mono">
                          {new Date(user?.created_at || "").toLocaleDateString("en-US", { month: "short", year: "numeric" })}
                        </p>
                      </div>
                      <TrendingUp className="h-8 w-8 text-accent" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Tabs defaultValue="orders" className="space-y-6">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="orders" className="gap-2">
                    <Package className="h-4 w-4" />
                    Orders
                  </TabsTrigger>
                  <TabsTrigger value="profile" className="gap-2">
                    <User className="h-4 w-4" />
                    Profile
                  </TabsTrigger>
                  <TabsTrigger value="addresses" className="gap-2">
                    <MapPin className="h-4 w-4" />
                    Addresses
                  </TabsTrigger>
                  <TabsTrigger value="payment" className="gap-2">
                    <CreditCard className="h-4 w-4" />
                    Payment
                  </TabsTrigger>
                </TabsList>

                {/* Orders Tab */}
                <TabsContent value="orders">
                  <Card>
                    <CardHeader>
                      <CardTitle>Order History</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {orders.length > 0 ? (
                        <div className="space-y-4">
                          {orders.map((order) => (
                            <div
                              key={order.id}
                              className="flex flex-col md:flex-row md:items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                            >
                              <div className="space-y-1 mb-4 md:mb-0">
                                <div className="flex items-center gap-3">
                                  <p className="font-semibold font-mono">{order.order_number}</p>
                                  <Badge variant="secondary" className={STATUS_COLORS[order.order_status]}>
                                    {order.order_status}
                                  </Badge>
                                </div>
                                <p className="text-sm text-muted-foreground">
                                  Placed on {new Date(order.created_at).toLocaleDateString("en-US", {
                                    year: "numeric",
                                    month: "long",
                                    day: "numeric",
                                  })}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  Total: ${order.total_amount.toFixed(2)}
                                </p>
                              </div>

                              <div className="flex gap-2">
                                <Button variant="outline" size="sm" asChild>
                                  <Link href={`/orders/${order.id}`}>
                                    <Eye className="mr-2 h-4 w-4" />
                                    View Details
                                  </Link>
                                </Button>
                                {order.order_status === "delivered" && (
                                  <Button variant="outline" size="sm">
                                    Leave Review
                                  </Button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-12">
                          <Package className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                          <p className="text-muted-foreground mb-4">No orders yet</p>
                          <Button asChild>
                            <Link href="/">Start Shopping</Link>
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Profile Tab */}
                <TabsContent value="profile">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                      <CardTitle>Personal Information</CardTitle>
                      {!isEditing && (
                        <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                          <Edit2 className="mr-2 h-4 w-4" />
                          Edit
                        </Button>
                      )}
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="fullName">Full Name</Label>
                          <Input
                            id="fullName"
                            value={profileData.fullName}
                            onChange={(e) => setProfileData({ ...profileData, fullName: e.target.value })}
                            disabled={!isEditing}
                          />
                        </div>

                        <div>
                          <Label htmlFor="email">Email Address</Label>
                          <Input
                            id="email"
                            type="email"
                            value={profileData.email}
                            disabled
                            className="bg-muted"
                          />
                          <p className="text-xs text-muted-foreground mt-1">Email cannot be changed</p>
                        </div>

                        <div>
                          <Label htmlFor="phone">Phone Number</Label>
                          <Input
                            id="phone"
                            value={profileData.phone}
                            onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                            disabled={!isEditing}
                          />
                        </div>
                      </div>

                      {isEditing && (
                        <div className="flex gap-3 pt-4">
                          <Button onClick={handleSaveProfile} disabled={saving}>
                            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {saving ? "Saving..." : "Save Changes"}
                          </Button>
                          <Button variant="outline" onClick={() => setIsEditing(false)} disabled={saving}>
                            Cancel
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  <Card className="mt-6">
                    <CardHeader>
                      <CardTitle>Account Security</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <p className="font-medium">Password</p>
                          <p className="text-sm text-muted-foreground">••••••••</p>
                        </div>
                        <Button variant="outline" disabled>
                          Change Password
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Addresses Tab */}
                <TabsContent value="addresses">
                  <Card>
                    <CardHeader>
                      <CardTitle>Shipping Address</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="md:col-span-2">
                          <Label htmlFor="street">Street Address</Label>
                          <Input
                            id="street"
                            value={shippingAddress.street}
                            onChange={(e) => setShippingAddress({ ...shippingAddress, street: e.target.value })}
                          />
                        </div>

                        <div>
                          <Label htmlFor="city">City</Label>
                          <Input
                            id="city"
                            value={shippingAddress.city}
                            onChange={(e) => setShippingAddress({ ...shippingAddress, city: e.target.value })}
                          />
                        </div>

                        <div>
                          <Label htmlFor="state">State / Province</Label>
                          <Input
                            id="state"
                            value={shippingAddress.state}
                            onChange={(e) => setShippingAddress({ ...shippingAddress, state: e.target.value })}
                          />
                        </div>

                        <div>
                          <Label htmlFor="zipCode">ZIP / Postal Code</Label>
                          <Input
                            id="zipCode"
                            value={shippingAddress.zipCode}
                            onChange={(e) => setShippingAddress({ ...shippingAddress, zipCode: e.target.value })}
                          />
                        </div>

                        <div>
                          <Label htmlFor="country">Country</Label>
                          <Input
                            id="country"
                            value={shippingAddress.country}
                            onChange={(e) => setShippingAddress({ ...shippingAddress, country: e.target.value })}
                          />
                        </div>
                      </div>

                      <Button onClick={handleSaveAddress} disabled={saving}>
                        {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {saving ? "Saving..." : "Save Address"}
                      </Button>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Payment Tab */}
                <TabsContent value="payment">
                  <Card>
                    <CardHeader>
                      <CardTitle>Payment Methods</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-center py-12">
                        <CreditCard className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                        <p className="text-muted-foreground mb-4">No saved payment methods</p>
                        <p className="text-sm text-muted-foreground mb-4">
                          Add a payment method to speed up checkout
                        </p>
                        <Button disabled>Add Payment Method</Button>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>

              <Separator className="my-8" />

              <Card className="border-destructive">
                <CardHeader>
                  <CardTitle className="text-destructive">Danger Zone</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Sign Out</p>
                      <p className="text-sm text-muted-foreground">Sign out of your account on this device</p>
                    </div>
                    <Button variant="outline" onClick={handleSignOut}>
                      <LogOut className="mr-2 h-4 w-4" />
                      Sign Out
                    </Button>
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Delete Account</p>
                      <p className="text-sm text-muted-foreground">
                        Permanently delete your account and all data
                      </p>
                    </div>
                    <Button variant="destructive" disabled>
                      Delete Account
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </CustomerLayout>
    </ProtectedRoute>
  );
}