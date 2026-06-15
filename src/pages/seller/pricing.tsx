import { CustomerLayout } from "@/components/CustomerLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useMarketplaceSettings } from "@/contexts/MarketplaceSettingsContext";
import { CheckCircle2 } from "lucide-react";
import Link from "next/link";

export default function SellerPricingPage() {
  const { formatPrice } = useMarketplaceSettings();

  return (
    <CustomerLayout>
      <div className="container py-12">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-4">Transparent Pricing for Sellers</h1>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              No hidden fees. Simple commission-based pricing that grows with your success.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mb-12">
            {/* Basic Plan */}
            <Card>
              <CardHeader>
                <Badge className="w-fit mb-2">Most Popular</Badge>
                <CardTitle>Basic Plan</CardTitle>
                <div className="mt-4">
                  <span className="text-4xl font-bold font-mono">12%</span>
                  <span className="text-muted-foreground ml-2">per sale</span>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Perfect for individual sellers and small businesses
                </p>

                <ul className="space-y-3">
                  <li className="flex gap-2">
                    <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-sm">Unlimited product listings</span>
                  </li>
                  <li className="flex gap-2">
                    <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-sm">Basic seller dashboard</span>
                  </li>
                  <li className="flex gap-2">
                    <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-sm">Standard payment processing</span>
                  </li>
                  <li className="flex gap-2">
                    <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-sm">Email support</span>
                  </li>
                  <li className="flex gap-2">
                    <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-sm">Weekly payouts</span>
                  </li>
                </ul>

                <Button asChild className="w-full">
                  <Link href="/seller/register">Get Started</Link>
                </Button>
              </CardContent>
            </Card>

            {/* Professional Plan */}
            <Card className="border-2 border-primary relative">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                <Badge className="bg-primary">Recommended</Badge>
              </div>
              <CardHeader>
                <CardTitle>Professional</CardTitle>
                <div className="mt-4">
                  <span className="text-4xl font-bold font-mono">9%</span>
                  <span className="text-muted-foreground ml-2">per sale</span>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  For growing businesses with higher sales volume
                </p>

                <ul className="space-y-3">
                  <li className="flex gap-2">
                    <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-sm">Everything in Basic</span>
                  </li>
                  <li className="flex gap-2">
                    <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-sm">Advanced analytics dashboard</span>
                  </li>
                  <li className="flex gap-2">
                    <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-sm">Priority listing placement</span>
                  </li>
                  <li className="flex gap-2">
                    <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-sm">Priority support (24/7)</span>
                  </li>
                  <li className="flex gap-2">
                    <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-sm">Daily payouts</span>
                  </li>
                  <li className="flex gap-2">
                    <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-sm">Promotional tools & discounts</span>
                  </li>
                </ul>

                <Button asChild className="w-full">
                  <Link href="/seller/register">Get Started</Link>
                </Button>
              </CardContent>
            </Card>

            {/* Enterprise Plan */}
            <Card>
              <CardHeader>
                <CardTitle>Enterprise</CardTitle>
                <div className="mt-4">
                  <span className="text-4xl font-bold font-mono">6%</span>
                  <span className="text-muted-foreground ml-2">per sale</span>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  For established brands and high-volume sellers
                </p>

                <ul className="space-y-3">
                  <li className="flex gap-2">
                    <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-sm">Everything in Professional</span>
                  </li>
                  <li className="flex gap-2">
                    <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-sm">Dedicated account manager</span>
                  </li>
                  <li className="flex gap-2">
                    <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-sm">Custom API integration</span>
                  </li>
                  <li className="flex gap-2">
                    <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-sm">Featured store placement</span>
                  </li>
                  <li className="flex gap-2">
                    <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-sm">Same-day payouts</span>
                  </li>
                  <li className="flex gap-2">
                    <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-sm">White-label options</span>
                  </li>
                </ul>

                <Button asChild variant="outline" className="w-full">
                  <Link href="/contact">Contact Sales</Link>
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Additional Fees */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Additional Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="font-semibold mb-2">Payment Processing</h3>
                <p className="text-sm text-muted-foreground">
                  Standard payment processing fee of 2.9% + {formatPrice(80)} per transaction applies to all plans.
                  This covers credit card processing, fraud protection, and secure payment handling.
                </p>
              </div>

              <div>
                <h3 className="font-semibold mb-2">No Monthly Fees</h3>
                <p className="text-sm text-muted-foreground">
                  We don't charge any monthly subscription fees. You only pay when you make a sale.
                  No sales = no fees.
                </p>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Refunds & Chargebacks</h3>
                <p className="text-sm text-muted-foreground">
                  In case of refunds, the full commission is refunded. Chargeback fees ({formatPrice(4200)}) apply
                  only if the chargeback is ruled in favor of the buyer.
                </p>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Plan Upgrades</h3>
                <p className="text-sm text-muted-foreground">
                  Plans are automatically upgraded based on your 30-day sales volume. Downgrades
                  can be requested but are subject to approval.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* FAQ */}
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-4">Have Questions?</h2>
            <p className="text-muted-foreground mb-6">
              Check our seller guidelines or contact our sales team for more information.
            </p>
            <div className="flex gap-4 justify-center">
              <Button asChild variant="outline">
                <Link href="/seller/guidelines">View Guidelines</Link>
              </Button>
              <Button asChild>
                <Link href="/contact">Contact Sales</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </CustomerLayout>
  );
}
