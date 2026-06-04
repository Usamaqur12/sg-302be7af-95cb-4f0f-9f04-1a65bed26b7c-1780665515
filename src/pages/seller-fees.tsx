"use client";

import { CustomerLayout } from "@/components/CustomerLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import Link from "next/link";
import { Check, DollarSign, TrendingUp, Zap, Crown } from "lucide-react";

export default function SellerFeesPage() {
  return (
    <CustomerLayout>
      <div className="container py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <Badge className="mb-4">Transparent Pricing</Badge>
          <h1 className="text-4xl md:text-5xl font-bold font-serif mb-4">
            Seller Fees & Pricing
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Simple, transparent pricing with no hidden fees. Choose the plan that works best for your business.
          </p>
        </div>

        {/* Commission Plans */}
        <div className="grid md:grid-cols-3 gap-6 mb-16">
          {/* Basic Plan */}
          <Card className="relative">
            <CardHeader>
              <div className="flex items-center gap-2 mb-2">
                <Zap className="h-5 w-5 text-primary" />
                <CardTitle>Basic</CardTitle>
              </div>
              <p className="text-sm text-muted-foreground">
                Perfect for new sellers getting started
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <div className="flex items-baseline gap-1 mb-2">
                  <span className="text-5xl font-bold font-mono">12</span>
                  <span className="text-2xl font-semibold">%</span>
                </div>
                <p className="text-sm text-muted-foreground">Commission per sale</p>
              </div>

              <ul className="space-y-3">
                <li className="flex items-start gap-2 text-sm">
                  <Check className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                  <span>List unlimited products</span>
                </li>
                <li className="flex items-start gap-2 text-sm">
                  <Check className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                  <span>Basic analytics dashboard</span>
                </li>
                <li className="flex items-start gap-2 text-sm">
                  <Check className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                  <span>Standard product placement</span>
                </li>
                <li className="flex items-start gap-2 text-sm">
                  <Check className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                  <span>Email support (48h response)</span>
                </li>
                <li className="flex items-start gap-2 text-sm">
                  <Check className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                  <span>Monthly payouts</span>
                </li>
              </ul>

              <Button className="w-full" asChild>
                <Link href="/seller/register">Get Started</Link>
              </Button>
            </CardContent>
          </Card>

          {/* Professional Plan */}
          <Card className="relative border-primary shadow-lg">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
              <Badge className="bg-primary">Most Popular</Badge>
            </div>
            <CardHeader>
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                <CardTitle>Professional</CardTitle>
              </div>
              <p className="text-sm text-muted-foreground">
                Best value for growing businesses
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <div className="flex items-baseline gap-1 mb-2">
                  <span className="text-5xl font-bold font-mono">9</span>
                  <span className="text-2xl font-semibold">%</span>
                </div>
                <p className="text-sm text-muted-foreground">Commission per sale</p>
              </div>

              <ul className="space-y-3">
                <li className="flex items-start gap-2 text-sm">
                  <Check className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                  <span className="font-medium">Everything in Basic, plus:</span>
                </li>
                <li className="flex items-start gap-2 text-sm">
                  <Check className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                  <span>Advanced analytics & insights</span>
                </li>
                <li className="flex items-start gap-2 text-sm">
                  <Check className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                  <span>Priority product placement</span>
                </li>
                <li className="flex items-start gap-2 text-sm">
                  <Check className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                  <span>Priority email support (24h)</span>
                </li>
                <li className="flex items-start gap-2 text-sm">
                  <Check className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                  <span>Weekly payouts</span>
                </li>
                <li className="flex items-start gap-2 text-sm">
                  <Check className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                  <span>Promotional tools & coupons</span>
                </li>
              </ul>

              <Button className="w-full" asChild>
                <Link href="/seller/register">Get Started</Link>
              </Button>
            </CardContent>
          </Card>

          {/* Enterprise Plan */}
          <Card className="relative">
            <CardHeader>
              <div className="flex items-center gap-2 mb-2">
                <Crown className="h-5 w-5 text-primary" />
                <CardTitle>Enterprise</CardTitle>
              </div>
              <p className="text-sm text-muted-foreground">
                For high-volume established sellers
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <div className="flex items-baseline gap-1 mb-2">
                  <span className="text-5xl font-bold font-mono">6</span>
                  <span className="text-2xl font-semibold">%</span>
                </div>
                <p className="text-sm text-muted-foreground">Commission per sale</p>
              </div>

              <ul className="space-y-3">
                <li className="flex items-start gap-2 text-sm">
                  <Check className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                  <span className="font-medium">Everything in Professional, plus:</span>
                </li>
                <li className="flex items-start gap-2 text-sm">
                  <Check className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                  <span>Dedicated account manager</span>
                </li>
                <li className="flex items-start gap-2 text-sm">
                  <Check className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                  <span>Featured seller badge</span>
                </li>
                <li className="flex items-start gap-2 text-sm">
                  <Check className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                  <span>24/7 priority phone support</span>
                </li>
                <li className="flex items-start gap-2 text-sm">
                  <Check className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                  <span>Daily payouts</span>
                </li>
                <li className="flex items-start gap-2 text-sm">
                  <Check className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                  <span>Custom API integration</span>
                </li>
              </ul>

              <Button className="w-full" variant="outline" asChild>
                <Link href="/contact">Contact Sales</Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Other Fees */}
        <Card className="mb-16">
          <CardHeader>
            <CardTitle>Additional Fees</CardTitle>
            <p className="text-sm text-muted-foreground">
              Transparent breakdown of all platform fees
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between py-3 border-b">
                <div>
                  <p className="font-medium">Payment Processing</p>
                  <p className="text-sm text-muted-foreground">Per transaction</p>
                </div>
                <span className="font-bold font-mono">2.9% + $0.30</span>
              </div>

              <div className="flex items-center justify-between py-3 border-b">
                <div>
                  <p className="font-medium">Payout Fee</p>
                  <p className="text-sm text-muted-foreground">Standard bank transfer</p>
                </div>
                <Badge variant="secondary">FREE</Badge>
              </div>

              <div className="flex items-center justify-between py-3 border-b">
                <div>
                  <p className="font-medium">Refund Processing</p>
                  <p className="text-sm text-muted-foreground">When customer requests refund</p>
                </div>
                <Badge variant="secondary">FREE</Badge>
              </div>

              <div className="flex items-center justify-between py-3 border-b">
                <div>
                  <p className="font-medium">Subscription Fee</p>
                  <p className="text-sm text-muted-foreground">Monthly platform access</p>
                </div>
                <Badge variant="secondary">FREE</Badge>
              </div>

              <div className="flex items-center justify-between py-3">
                <div>
                  <p className="font-medium">Listing Fee</p>
                  <p className="text-sm text-muted-foreground">Per product listing</p>
                </div>
                <Badge variant="secondary">FREE</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Example Earnings */}
        <Card className="mb-16">
          <CardHeader>
            <CardTitle>Example Earnings</CardTitle>
            <p className="text-sm text-muted-foreground">
              See how much you'll earn with different commission rates
            </p>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-medium">Sale Amount</th>
                    <th className="text-right py-3 px-4 font-medium">Basic (12%)</th>
                    <th className="text-right py-3 px-4 font-medium">Professional (9%)</th>
                    <th className="text-right py-3 px-4 font-medium">Enterprise (6%)</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { sale: 100, basic: 88, pro: 91, ent: 94 },
                    { sale: 500, basic: 440, pro: 455, ent: 470 },
                    { sale: 1000, basic: 880, pro: 910, ent: 940 },
                    { sale: 5000, basic: 4400, pro: 4550, ent: 4700 },
                  ].map((row) => (
                    <tr key={row.sale} className="border-b">
                      <td className="py-3 px-4 font-mono">${row.sale.toFixed(2)}</td>
                      <td className="text-right py-3 px-4 font-mono text-green-600">${row.basic.toFixed(2)}</td>
                      <td className="text-right py-3 px-4 font-mono text-green-600">${row.pro.toFixed(2)}</td>
                      <td className="text-right py-3 px-4 font-mono text-green-600">${row.ent.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-sm text-muted-foreground mt-4">
              * Earnings shown after commission and payment processing fees (2.9% + $0.30)
            </p>
          </CardContent>
        </Card>

        {/* FAQ */}
        <Card>
          <CardHeader>
            <CardTitle>Frequently Asked Questions</CardTitle>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="item-1">
                <AccordionTrigger>How does the commission structure work?</AccordionTrigger>
                <AccordionContent>
                  Our commission is calculated as a percentage of each sale. For example, with a 12% commission rate, 
                  if you sell a product for $100, you'll receive $88 after commission (minus payment processing fees).
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-2">
                <AccordionTrigger>When do I get paid?</AccordionTrigger>
                <AccordionContent>
                  Payout frequency depends on your plan: Basic (Monthly), Professional (Weekly), Enterprise (Daily). 
                  All payouts are processed automatically via bank transfer at no additional cost.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-3">
                <AccordionTrigger>Are there any hidden fees?</AccordionTrigger>
                <AccordionContent>
                  No hidden fees! The only costs are the commission rate for your plan and standard payment processing fees 
                  (2.9% + $0.30 per transaction). No listing fees, no monthly subscriptions, no surprise charges.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-4">
                <AccordionTrigger>Can I upgrade or downgrade my plan?</AccordionTrigger>
                <AccordionContent>
                  Yes! You can upgrade to a higher plan at any time to enjoy lower commission rates. Plan changes take effect 
                  immediately, and your new commission rate applies to all future sales.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-5">
                <AccordionTrigger>What payment methods do you support?</AccordionTrigger>
                <AccordionContent>
                  We support all major credit cards, PayPal, and bank transfers for customer payments. Seller payouts are 
                  processed via direct bank transfer (ACH/Wire) to your registered bank account.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-6">
                <AccordionTrigger>Who pays for refunds?</AccordionTrigger>
                <AccordionContent>
                  When a refund is issued, the full sale amount is returned to the customer, and the commission is also refunded 
                  to you. This means you're not penalized for legitimate returns or customer-initiated refunds.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </CardContent>
        </Card>

        {/* CTA Section */}
        <div className="text-center mt-16 p-12 bg-gradient-to-br from-primary/10 via-background to-accent/10 rounded-2xl border">
          <h2 className="text-3xl font-bold font-serif mb-4">Ready to Start Selling?</h2>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            Join thousands of successful sellers on our platform. No setup fees, no monthly charges—just pay when you sell.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" asChild>
              <Link href="/seller/register">
                <DollarSign className="h-5 w-5 mr-2" />
                Start Selling Today
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/contact">Contact Sales Team</Link>
            </Button>
          </div>
        </div>
      </div>
    </CustomerLayout>
  );
}