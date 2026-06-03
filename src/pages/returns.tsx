"use client";

import { CustomerLayout } from "@/components/CustomerLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RefreshCw, Package, DollarSign, Clock, CheckCircle2, XCircle } from "lucide-react";
import Link from "next/link";

export default function ReturnsPage() {
  return (
    <CustomerLayout>
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-primary/5 via-background to-accent/5 py-16">
        <div className="container">
          <div className="max-w-3xl mx-auto text-center">
            <RefreshCw className="h-16 w-16 mx-auto mb-4 text-primary" />
            <h1 className="text-4xl font-bold mb-4">Returns & Refunds</h1>
            <p className="text-muted-foreground text-lg">
              We want you to be completely satisfied with your purchase. Our hassle-free
              return policy makes it easy.
            </p>
          </div>
        </div>
      </div>

      <div className="container py-16">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-16">
          <Card>
            <CardContent className="pt-6 text-center">
              <Clock className="h-8 w-8 mx-auto mb-2 text-accent" />
              <div className="text-2xl font-bold mb-1">30 Days</div>
              <p className="text-sm text-muted-foreground">Return Window</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <Package className="h-8 w-8 mx-auto mb-2 text-accent" />
              <div className="text-2xl font-bold mb-1">Free</div>
              <p className="text-sm text-muted-foreground">Return Shipping</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <DollarSign className="h-8 w-8 mx-auto mb-2 text-accent" />
              <div className="text-2xl font-bold mb-1">3-5 Days</div>
              <p className="text-sm text-muted-foreground">Refund Processing</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <RefreshCw className="h-8 w-8 mx-auto mb-2 text-accent" />
              <div className="text-2xl font-bold mb-1">Easy</div>
              <p className="text-sm text-muted-foreground">Online Returns</p>
            </CardContent>
          </Card>
        </div>

        {/* Return Policy */}
        <div className="max-w-4xl mx-auto space-y-12">
          <section>
            <h2 className="text-2xl font-bold mb-6">Return Policy</h2>
            <Card>
              <CardContent className="pt-6 space-y-6">
                <div>
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                    Eligible Items
                  </h3>
                  <ul className="space-y-2 text-muted-foreground ml-7">
                    <li>• Most items can be returned within 30 days of delivery</li>
                    <li>• Items must be in original condition with tags attached</li>
                    <li>• Original packaging should be intact</li>
                    <li>• Electronics must include all accessories and manuals</li>
                    <li>• Clothing items must be unworn and unwashed</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <XCircle className="h-5 w-5 text-red-600" />
                    Non-Returnable Items
                  </h3>
                  <ul className="space-y-2 text-muted-foreground ml-7">
                    <li>• Customized or personalized products</li>
                    <li>• Perishable goods (food, flowers, plants)</li>
                    <li>• Health and personal care items (cosmetics, intimate wear)</li>
                    <li>• Digital downloads and software</li>
                    <li>• Gift cards and vouchers</li>
                    <li>• Final sale or clearance items</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* How to Return */}
          <section>
            <h2 className="text-2xl font-bold mb-6">How to Return an Item</h2>
            <div className="grid gap-4">
              {[
                {
                  step: "1",
                  title: "Log Into Your Account",
                  description:
                    "Go to your Orders page and find the item you want to return.",
                },
                {
                  step: "2",
                  title: "Request a Return",
                  description:
                    "Click 'Request Return' and select the reason for your return.",
                },
                {
                  step: "3",
                  title: "Print Return Label",
                  description:
                    "You'll receive a prepaid return shipping label via email within 24 hours.",
                },
                {
                  step: "4",
                  title: "Ship Your Return",
                  description:
                    "Pack the item securely, attach the label, and drop it off at any carrier location.",
                },
                {
                  step: "5",
                  title: "Receive Your Refund",
                  description:
                    "Once we receive and inspect your return, your refund will be processed within 3-5 business days.",
                },
              ].map((item) => (
                <Card key={item.step}>
                  <CardContent className="pt-6">
                    <div className="flex gap-4">
                      <div className="h-12 w-12 rounded-full bg-accent/10 flex items-center justify-center shrink-0">
                        <span className="text-xl font-bold text-accent">{item.step}</span>
                      </div>
                      <div>
                        <h3 className="font-semibold mb-1">{item.title}</h3>
                        <p className="text-muted-foreground">{item.description}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          {/* Refund Information */}
          <section>
            <h2 className="text-2xl font-bold mb-6">Refund Information</h2>
            <Card>
              <CardContent className="pt-6 space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">Refund Method</h3>
                  <p className="text-muted-foreground">
                    Refunds are issued to your original payment method. If you paid with a
                    credit card, it will be credited to that card. For wallet payments, the
                    amount will be instantly added to your marketplace wallet.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Refund Timeline</h3>
                  <p className="text-muted-foreground">
                    After we receive and inspect your return, refunds are processed within
                    3-5 business days. Depending on your bank or card issuer, it may take an
                    additional 5-10 business days for the refund to appear on your statement.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Partial Refunds</h3>
                  <p className="text-muted-foreground">
                    In some cases, partial refunds may be granted for items returned in
                    non-original condition, missing parts, or damaged due to customer misuse.
                    We'll notify you if this applies to your return.
                  </p>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Exchange Policy */}
          <section>
            <h2 className="text-2xl font-bold mb-6">Exchange Policy</h2>
            <Card>
              <CardContent className="pt-6">
                <p className="text-muted-foreground mb-4">
                  We currently don't offer direct exchanges. If you need a different size,
                  color, or variant, please return the original item for a refund and place a
                  new order for the item you want.
                </p>
                <p className="text-muted-foreground">
                  This ensures faster processing and guarantees availability of the item you
                  want. If you need assistance, our customer support team is happy to help.
                </p>
              </CardContent>
            </Card>
          </section>

          {/* CTA Section */}
          <Card className="bg-gradient-to-br from-primary/5 to-accent/5 border-none">
            <CardContent className="pt-8">
              <div className="text-center">
                <h2 className="text-2xl font-bold mb-4">Need Help with a Return?</h2>
                <p className="text-muted-foreground mb-6">
                  Our customer support team is ready to assist you
                </p>
                <div className="flex flex-wrap gap-4 justify-center">
                  <Link href="/account/dashboard">
                    <Button size="lg">View My Orders</Button>
                  </Link>
                  <Link href="/contact">
                    <Button size="lg" variant="outline">
                      Contact Support
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </CustomerLayout>
  );
}