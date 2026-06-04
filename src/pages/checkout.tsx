"use client";

import { CustomerLayout } from "@/components/CustomerLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, CheckCircle2, CreditCard, Package, TruckIcon } from "lucide-react";
import { analytics } from "@/lib/analytics";
import { supabase } from "@/integrations/supabase/client";

type CheckoutStep = "shipping" | "payment" | "confirmation";

export default function CheckoutPage() {
  const { user } = useAuth();
  const { items, total: cartTotal, itemCount, clearCart } = useCart();
  const { toast } = useToast();
  const router = useRouter();

  const [currentStep, setCurrentStep] = useState<CheckoutStep>("shipping");
  const [processing, setProcessing] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);

  // Shipping form
  const [shippingData, setShippingData] = useState({
    fullName: "",
    email: "",
    phone: "",
    street: "",
    city: "",
    state: "",
    zipCode: "",
    country: "United States",
  });

  // Payment form
  const [paymentMethod, setPaymentMethod] = useState("card");
  const [cardData, setCardData] = useState({
    cardNumber: "",
    cardName: "",
    expiryDate: "",
    cvv: "",
  });

  const subtotal = cartTotal;
  const shipping = subtotal > 50 ? 0 : 9.99;
  const tax = subtotal * 0.08; // 8% tax
  const total = subtotal + shipping + tax;

  const validateShippingForm = () => {
    const required = ["fullName", "email", "phone", "street", "city", "state", "zipCode"];
    for (const field of required) {
      if (!shippingData[field as keyof typeof shippingData]) {
        toast({
          title: "Incomplete Form",
          description: "Please fill in all shipping details.",
          variant: "destructive",
        });
        return false;
      }
    }

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(shippingData.email)) {
      toast({
        title: "Invalid Email",
        description: "Please enter a valid email address.",
        variant: "destructive",
      });
      return false;
    }

    return true;
  };

  const validatePaymentForm = () => {
    if (paymentMethod === "card") {
      if (!cardData.cardNumber || !cardData.cardName || !cardData.expiryDate || !cardData.cvv) {
        toast({
          title: "Incomplete Card Details",
          description: "Please fill in all card information.",
          variant: "destructive",
        });
        return false;
      }

      // Basic card number validation (16 digits)
      const cardNumber = cardData.cardNumber.replace(/\s/g, "");
      if (cardNumber.length !== 16 || !/^\d+$/.test(cardNumber)) {
        toast({
          title: "Invalid Card Number",
          description: "Please enter a valid 16-digit card number.",
          variant: "destructive",
        });
        return false;
      }

      // Expiry date validation (MM/YY)
      if (!/^\d{2}\/\d{2}$/.test(cardData.expiryDate)) {
        toast({
          title: "Invalid Expiry Date",
          description: "Please enter expiry in MM/YY format.",
          variant: "destructive",
        });
        return false;
      }

      // CVV validation (3-4 digits)
      if (!/^\d{3,4}$/.test(cardData.cvv)) {
        toast({
          title: "Invalid CVV",
          description: "Please enter a valid 3 or 4 digit CVV.",
          variant: "destructive",
        });
        return false;
      }
    }

    return true;
  };

  const handleProceedToPayment = () => {
    if (!user) {
      toast({
        title: "Login Required",
        description: "Please log in to continue with checkout.",
      });
      router.push("/auth/login");
      return;
    }

    if (validateShippingForm()) {
      setCurrentStep("payment");
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handlePlaceOrder = async () => {
    if (!validatePaymentForm()) return;
    if (!user) {
      toast({
        title: "Login Required",
        description: "Please log in to place an order.",
      });
      router.push("/login");
      return;
    }

    setProcessing(true);

    try {
      // Generate order number
      const orderNumber = `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

      // Create order in Supabase
      const { data: orderData, error: orderError } = await supabase
        .from("orders")
        .insert({
          customer_id: user.id,
          order_number: orderNumber,
          status: "pending",
          shipping_cost: shipping,
          tax_amount: tax,
          total_amount: total,
          shipping_full_name: shippingData.fullName,
          shipping_email: shippingData.email,
          shipping_phone: shippingData.phone,
          shipping_street: shippingData.street,
          shipping_city: shippingData.city,
          shipping_state: shippingData.state,
          shipping_postal_code: shippingData.zipCode,
          shipping_country: shippingData.country,
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Create order items
      const orderItems = items.map((item) => ({
        order_id: orderData.id,
        product_id: item.product.id,
        product_title: item.product.title,
        product_image: item.product.images?.[0]?.url || null,
        quantity: item.quantity,
        price: item.product.price,
        subtotal: item.product.price * item.quantity,
        seller_id: (item.product as any).seller_id || "00000000-0000-0000-0000-000000000000",
        commission_rate: 0.15,
        commission_amount: (item.product.price * item.quantity) * 0.15,
        seller_earnings: (item.product.price * item.quantity) * 0.85,
      }));

      const { error: itemsError } = await supabase
        .from("order_items")
        .insert(orderItems);

      if (itemsError) throw itemsError;

      // Track purchase analytics
      analytics.purchaseCompleted(
        orderNumber,
        total,
        items.map((item) => ({
          id: item.product.id,
          name: item.product.title,
          price: item.product.price,
          quantity: item.quantity,
        }))
      );

      // Clear cart
      clearCart();

      // Set order ID and move to confirmation
      setOrderId(orderData.id);
      setCurrentStep("confirmation");
      window.scrollTo({ top: 0, behavior: "smooth" });

      toast({
        title: "Order Placed Successfully!",
        description: `Your order ${orderNumber} has been confirmed.`,
      });
    } catch (error: any) {
      console.error("Order creation error:", error);
      toast({
        title: "Order Failed",
        description: error.message || "Could not process your order. Please try again.",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  // Empty cart check
  if (items.length === 0 && currentStep !== "confirmation") {
    return (
      <CustomerLayout>
        <div className="container py-16 text-center">
          <Package className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
          <h1 className="text-2xl font-bold mb-4">Your Cart is Empty</h1>
          <p className="text-muted-foreground mb-6">
            Add some products to your cart before proceeding to checkout.
          </p>
          <Button asChild>
            <Link href="/">Continue Shopping</Link>
          </Button>
        </div>
      </CustomerLayout>
    );
  }

  return (
    <CustomerLayout>
      <div className="container py-12">
        {currentStep !== "confirmation" && (
          <Button variant="ghost" className="mb-6" onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        )}

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-center gap-4 mb-6">
            <div className="flex items-center gap-2">
              <div
                className={`h-10 w-10 rounded-full flex items-center justify-center font-semibold ${
                  currentStep === "shipping"
                    ? "bg-primary text-primary-foreground"
                    : "bg-primary/20 text-primary"
                }`}
              >
                {currentStep !== "shipping" ? <CheckCircle2 className="h-6 w-6" /> : "1"}
              </div>
              <span className="font-medium">Shipping</span>
            </div>

            <div className="h-0.5 w-16 bg-muted"></div>

            <div className="flex items-center gap-2">
              <div
                className={`h-10 w-10 rounded-full flex items-center justify-center font-semibold ${
                  currentStep === "payment"
                    ? "bg-primary text-primary-foreground"
                    : currentStep === "confirmation"
                    ? "bg-primary/20 text-primary"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {currentStep === "confirmation" ? <CheckCircle2 className="h-6 w-6" /> : "2"}
              </div>
              <span className={`font-medium ${currentStep === "shipping" ? "text-muted-foreground" : ""}`}>
                Payment
              </span>
            </div>

            <div className="h-0.5 w-16 bg-muted"></div>

            <div className="flex items-center gap-2">
              <div
                className={`h-10 w-10 rounded-full flex items-center justify-center font-semibold ${
                  currentStep === "confirmation"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                3
              </div>
              <span
                className={`font-medium ${currentStep !== "confirmation" ? "text-muted-foreground" : ""}`}
              >
                Confirmation
              </span>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            {/* Shipping Step */}
            {currentStep === "shipping" && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TruckIcon className="h-5 w-5" />
                    Shipping Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="fullName">Full Name *</Label>
                      <Input
                        id="fullName"
                        value={shippingData.fullName}
                        onChange={(e) =>
                          setShippingData({ ...shippingData, fullName: e.target.value })
                        }
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="email">Email Address *</Label>
                      <Input
                        id="email"
                        type="email"
                        value={shippingData.email}
                        onChange={(e) =>
                          setShippingData({ ...shippingData, email: e.target.value })
                        }
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="phone">Phone Number *</Label>
                      <Input
                        id="phone"
                        value={shippingData.phone}
                        onChange={(e) =>
                          setShippingData({ ...shippingData, phone: e.target.value })
                        }
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="country">Country *</Label>
                      <Input
                        id="country"
                        value={shippingData.country}
                        onChange={(e) =>
                          setShippingData({ ...shippingData, country: e.target.value })
                        }
                        required
                      />
                    </div>

                    <div className="md:col-span-2">
                      <Label htmlFor="street">Street Address *</Label>
                      <Input
                        id="street"
                        value={shippingData.street}
                        onChange={(e) =>
                          setShippingData({ ...shippingData, street: e.target.value })
                        }
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="city">City *</Label>
                      <Input
                        id="city"
                        value={shippingData.city}
                        onChange={(e) =>
                          setShippingData({ ...shippingData, city: e.target.value })
                        }
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="state">State / Province *</Label>
                      <Input
                        id="state"
                        value={shippingData.state}
                        onChange={(e) =>
                          setShippingData({ ...shippingData, state: e.target.value })
                        }
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="zipCode">ZIP / Postal Code *</Label>
                      <Input
                        id="zipCode"
                        value={shippingData.zipCode}
                        onChange={(e) =>
                          setShippingData({ ...shippingData, zipCode: e.target.value })
                        }
                        required
                      />
                    </div>
                  </div>

                  <Button onClick={handleProceedToPayment} className="w-full" size="lg">
                    Continue to Payment
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Payment Step */}
            {currentStep === "payment" && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    Payment Method
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
                    <div className="flex items-center space-x-2 p-4 border rounded-lg">
                      <RadioGroupItem value="card" id="card" />
                      <Label htmlFor="card" className="flex-1 cursor-pointer">
                        Credit / Debit Card
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2 p-4 border rounded-lg">
                      <RadioGroupItem value="paypal" id="paypal" />
                      <Label htmlFor="paypal" className="flex-1 cursor-pointer">
                        PayPal
                      </Label>
                    </div>
                  </RadioGroup>

                  {paymentMethod === "card" && (
                    <div className="space-y-4 pt-4">
                      <div>
                        <Label htmlFor="cardNumber">Card Number *</Label>
                        <Input
                          id="cardNumber"
                          placeholder="1234 5678 9012 3456"
                          value={cardData.cardNumber}
                          onChange={(e) =>
                            setCardData({ ...cardData, cardNumber: e.target.value })
                          }
                          maxLength={19}
                          required
                        />
                      </div>

                      <div>
                        <Label htmlFor="cardName">Name on Card *</Label>
                        <Input
                          id="cardName"
                          placeholder="John Doe"
                          value={cardData.cardName}
                          onChange={(e) =>
                            setCardData({ ...cardData, cardName: e.target.value })
                          }
                          required
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="expiryDate">Expiry Date *</Label>
                          <Input
                            id="expiryDate"
                            placeholder="MM/YY"
                            value={cardData.expiryDate}
                            onChange={(e) =>
                              setCardData({ ...cardData, expiryDate: e.target.value })
                            }
                            maxLength={5}
                            required
                          />
                        </div>

                        <div>
                          <Label htmlFor="cvv">CVV *</Label>
                          <Input
                            id="cvv"
                            placeholder="123"
                            value={cardData.cvv}
                            onChange={(e) =>
                              setCardData({ ...cardData, cvv: e.target.value })
                            }
                            maxLength={4}
                            required
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex gap-4 pt-4">
                    <Button
                      variant="outline"
                      onClick={() => setCurrentStep("shipping")}
                      className="flex-1"
                    >
                      Back to Shipping
                    </Button>
                    <Button
                      onClick={handlePlaceOrder}
                      disabled={processing}
                      className="flex-1"
                      size="lg"
                    >
                      {processing ? "Processing..." : `Place Order - $${total.toFixed(2)}`}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Confirmation Step */}
            {currentStep === "confirmation" && (
              <Card>
                <CardContent className="pt-12 pb-12 text-center">
                  <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
                    <CheckCircle2 className="h-10 w-10 text-primary" />
                  </div>

                  <h2 className="text-3xl font-bold mb-4">Order Confirmed!</h2>
                  <p className="text-muted-foreground mb-2">
                    Thank you for your order. Your order has been successfully placed.
                  </p>
                  <p className="text-sm text-muted-foreground mb-6">
                    Order ID: <span className="font-mono font-semibold">{orderId}</span>
                  </p>

                  <div className="bg-muted p-6 rounded-lg mb-6 text-left max-w-md mx-auto">
                    <p className="font-semibold mb-2">Order Details:</p>
                    <p className="text-sm text-muted-foreground">
                      A confirmation email has been sent to <strong>{shippingData.email}</strong>
                    </p>
                    <p className="text-sm text-muted-foreground mt-2">
                      Estimated delivery: 3-5 business days
                    </p>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Button asChild variant="outline">
                      <Link href={`/orders/${orderId}`}>View Order Details</Link>
                    </Button>
                    <Button asChild>
                      <Link href="/">Continue Shopping</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Order Summary */}
          {currentStep !== "confirmation" && (
            <div>
              <Card className="sticky top-4">
                <CardHeader>
                  <CardTitle>Order Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Cart Items */}
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {items.map((item) => (
                      <div key={item.id} className="flex gap-3">
                        <div className="relative w-16 h-16 rounded overflow-hidden bg-muted flex-shrink-0">
                          <Image
                            src={item.product.images?.[0]?.url || "/placeholder.png"}
                            alt={item.product.title}
                            fill
                            className="object-cover"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{item.product.title}</p>
                          <p className="text-sm text-muted-foreground">Qty: {item.quantity}</p>
                          <p className="text-sm font-semibold font-mono">
                            ${(item.product.price * item.quantity).toFixed(2)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <Separator />

                  {/* Price Breakdown */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">
                        Subtotal ({itemCount} items)
                      </span>
                      <span className="font-mono">${subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Shipping</span>
                      <span className="font-mono">
                        {shipping === 0 ? "FREE" : `$${shipping.toFixed(2)}`}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Tax (8%)</span>
                      <span className="font-mono">${tax.toFixed(2)}</span>
                    </div>

                    <Separator />

                    <div className="flex justify-between font-bold text-lg">
                      <span>Total</span>
                      <span className="font-mono">${total.toFixed(2)}</span>
                    </div>
                  </div>

                  {shipping === 0 && (
                    <Badge variant="secondary" className="w-full justify-center">
                      Free shipping on orders over $50!
                    </Badge>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </CustomerLayout>
  );
}