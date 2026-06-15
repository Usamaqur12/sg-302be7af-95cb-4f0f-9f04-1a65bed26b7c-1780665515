"use client";

import { CustomerLayout } from "@/components/CustomerLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useCart } from "@/contexts/CartContext";
import { useMarketplaceSettings } from "@/contexts/MarketplaceSettingsContext";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useEffect, useMemo, useState, type ChangeEvent } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Banknote, Building2, CheckCircle2, Package, Smartphone, TruckIcon, Upload } from "lucide-react";
import { analytics } from "@/lib/analytics";
import { getErrorMessage } from "@/lib/errors";
import { calculatePromotionSummary, type PromotionSummary } from "@/lib/promotions";
import { uploadFile } from "@/lib/uploads";

type CheckoutStep = "shipping" | "payment" | "confirmation";
type PaymentMethod = "cash_on_delivery" | "bank_transfer" | "jazzcash" | "easypaisa";

const paymentOptions: Array<{
  method: PaymentMethod;
  title: string;
  description: string;
  icon: typeof Banknote;
}> = [
  {
    method: "cash_on_delivery",
    title: "Cash on Delivery",
    description: "Pay when your order arrives.",
    icon: Banknote,
  },
  {
    method: "bank_transfer",
    title: "Bank Transfer",
    description: "Send payment to the marketplace bank account and add reference.",
    icon: Building2,
  },
  {
    method: "jazzcash",
    title: "JazzCash",
    description: "Pay through JazzCash and submit transaction ID.",
    icon: Smartphone,
  },
  {
    method: "easypaisa",
    title: "EasyPaisa",
    description: "Pay through EasyPaisa and submit transaction ID.",
    icon: Smartphone,
  },
];

export default function CheckoutPage() {
  const { user } = useAuth();
  const { items, total: cartTotal, itemCount, clearCart } = useCart();
  const { deliveryCity, formatPrice } = useMarketplaceSettings();
  const { toast } = useToast();
  const router = useRouter();

  const [currentStep, setCurrentStep] = useState<CheckoutStep>("shipping");
  const [processing, setProcessing] = useState(false);
  const [uploadingPaymentProof, setUploadingPaymentProof] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);

  // Shipping form
  const [shippingData, setShippingData] = useState({
    fullName: "",
    email: "",
    phone: "",
    street: "",
    city: deliveryCity,
    state: "",
    zipCode: "",
    country: "Pakistan",
  });

  // Payment form
  const [paymentData, setPaymentData] = useState({
    method: "cash_on_delivery" as PaymentMethod,
    reference: "",
    proofUrl: "",
  });

  const promotionItems = useMemo(
    () =>
      items.map((item) => ({
        product_id: item.product_id,
        seller_id: item.product.seller?.id,
        price: item.product.price,
        quantity: item.quantity,
        title: item.product.title,
      })),
    [items]
  );
  const fallbackSummary = useMemo(() => calculatePromotionSummary(promotionItems, []), [promotionItems]);
  const [promotionSummary, setPromotionSummary] = useState<PromotionSummary>(fallbackSummary);

  useEffect(() => {
    let cancelled = false;
    setPromotionSummary(fallbackSummary);
    if (!items.length) return;

    fetch("/api/promotions/cart-summary", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ items: promotionItems }),
    })
      .then((response) => response.json())
      .then((payload) => {
        if (!cancelled && payload.summary) setPromotionSummary(payload.summary);
      })
      .catch(() => {
        if (!cancelled) setPromotionSummary(fallbackSummary);
      });

    return () => {
      cancelled = true;
    };
  }, [fallbackSummary, items.length, promotionItems]);

  const subtotal = promotionSummary.subtotal || cartTotal;
  const shipping = promotionSummary.shipping;
  const tax = promotionSummary.tax;
  const total = promotionSummary.total;

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
      const manualPayment = paymentData.method !== "cash_on_delivery";
      if (manualPayment && !paymentData.reference.trim()) {
        toast({
          title: "Payment reference required",
          description: "Enter your bank/mobile wallet transaction ID before placing the order.",
          variant: "destructive",
        });
        setProcessing(false);
        return;
      }

      const response = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          items: items.map((item) => ({
            product_id: item.product_id,
            quantity: item.quantity,
          })),
          shipping_full_name: shippingData.fullName,
          shipping_email: shippingData.email,
          shipping_phone: shippingData.phone,
          shipping_street: shippingData.street,
          shipping_city: shippingData.city,
          shipping_state: shippingData.state,
          shipping_zip_code: shippingData.zipCode,
          shipping_country: shippingData.country,
          payment_method: paymentData.method,
          payment_reference: paymentData.reference.trim() || undefined,
          payment_proof_url: paymentData.proofUrl || undefined,
        }),
      });
      const payload = await response.json() as {
        order?: { id: string; orderNumber: string; total: number };
        error?: string;
      };

      if (!response.ok || !payload.order) {
        throw new Error(payload.error || "Could not place order");
      }

      // Track purchase analytics
      analytics.purchaseCompleted(
        payload.order.orderNumber,
        payload.order.total,
        items.map((item) => ({
          id: item.product.id,
          name: item.product.title,
          price: item.product.price,
          quantity: item.quantity,
        }))
      );

      // Clear cart
      await clearCart();

      // Set order ID and move to confirmation
      setOrderId(payload.order.id);
      setCurrentStep("confirmation");
      window.scrollTo({ top: 0, behavior: "smooth" });

      toast({
        title: "Order Placed Successfully!",
        description: `Your order ${payload.order.orderNumber} has been confirmed.`,
      });
    } catch (error: unknown) {
      console.error("Order creation error:", error);
      toast({
        title: "Order Failed",
        description: getErrorMessage(error, "Could not process your order. Please try again."),
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  const handlePaymentProofUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadingPaymentProof(true);
    try {
      const url = await uploadFile(file, "payment-proof");
      setPaymentData((current) => ({ ...current, proofUrl: url }));
      toast({
        title: "Payment proof uploaded",
        description: "Admin can now verify this payment from the payment panel.",
      });
    } catch (error) {
      toast({
        title: "Upload failed",
        description: getErrorMessage(error, "Could not upload payment proof."),
        variant: "destructive",
      });
    } finally {
      setUploadingPaymentProof(false);
      event.target.value = "";
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
                    <Banknote className="h-5 w-5" />
                    Payment Method
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid gap-3 sm:grid-cols-2">
                    {paymentOptions.map((option) => {
                      const Icon = option.icon;
                      const active = paymentData.method === option.method;
                      return (
                        <button
                          key={option.method}
                          type="button"
                          onClick={() => setPaymentData((current) => ({
                            ...current,
                            method: option.method,
                          }))}
                          className={`rounded-md border p-4 text-left transition ${
                            active ? "border-primary bg-primary/5" : "hover:border-primary/60"
                          }`}
                        >
                          <div className="mb-2 flex items-center gap-2 font-medium">
                            <Icon className="h-5 w-5 text-primary" />
                            {option.title}
                          </div>
                          <p className="text-sm text-muted-foreground">{option.description}</p>
                        </button>
                      );
                    })}
                  </div>

                  {paymentData.method !== "cash_on_delivery" && (
                    <div className="rounded-md border p-4">
                      <p className="font-medium">Manual Payment Verification</p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Transfer the exact order total, then submit the transaction ID. Admin will approve the payment before fulfillment.
                      </p>
                      <div className="mt-4 grid gap-4 md:grid-cols-2">
                        <div>
                          <Label htmlFor="payment_reference">Transaction / Reference ID *</Label>
                          <Input
                            id="payment_reference"
                            value={paymentData.reference}
                            onChange={(event) => setPaymentData((current) => ({
                              ...current,
                              reference: event.target.value,
                            }))}
                            placeholder="e.g. TXN123456789"
                          />
                        </div>
                        <div>
                          <Label htmlFor="payment_proof">Payment Proof</Label>
                          <Input
                            id="payment_proof"
                            type="file"
                            accept="image/*"
                            disabled={uploadingPaymentProof}
                            onChange={handlePaymentProofUpload}
                          />
                          {paymentData.proofUrl && (
                            <a
                              href={paymentData.proofUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="mt-2 inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
                            >
                              <Upload className="h-4 w-4" />
                              View uploaded proof
                            </a>
                          )}
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
                      disabled={processing || uploadingPaymentProof}
                      className="flex-1"
                      size="lg"
                    >
                      {processing ? "Processing..." : `Place Order - ${formatPrice(total)}`}
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
                            {formatPrice(item.product.price * item.quantity)}
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
                      <span className="font-mono">{formatPrice(subtotal)}</span>
                    </div>
                    {promotionSummary.productDiscount > 0 && (
                      <div className="flex justify-between text-sm text-green-700">
                        <span>Promotion discount</span>
                        <span className="font-mono">-{formatPrice(promotionSummary.productDiscount)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Shipping</span>
                      <span className="font-mono">
                        {shipping === 0 ? "FREE" : formatPrice(shipping)}
                      </span>
                    </div>
                    {promotionSummary.shippingDiscount > 0 && (
                      <div className="flex justify-between text-sm text-green-700">
                        <span>Shipping offer</span>
                        <span className="font-mono">-{formatPrice(promotionSummary.shippingDiscount)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Tax (8%)</span>
                      <span className="font-mono">{formatPrice(tax)}</span>
                    </div>

                    {promotionSummary.appliedPromotions.length > 0 && (
                      <div className="flex flex-wrap gap-2 pt-1">
                        {promotionSummary.appliedPromotions.map((promotion) => (
                          <Badge key={promotion.id} className="bg-green-500/10 text-green-700">
                            {promotion.title}
                          </Badge>
                        ))}
                      </div>
                    )}

                    <Separator />

                    <div className="flex justify-between font-bold text-lg">
                      <span>Total</span>
                      <span className="font-mono">{formatPrice(total)}</span>
                    </div>
                  </div>

                  {shipping === 0 && (
                    <Badge variant="secondary" className="w-full justify-center">
                      {promotionSummary.shippingDiscount > 0
                        ? "Free shipping offer applied"
                        : `Free shipping on orders over ${formatPrice(50)}!`}
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
