"use client";

import { CustomerLayout } from "@/components/CustomerLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Check, TrendingUp, Users, DollarSign, Package, Zap, Shield, Headphones, ArrowRight, Info } from "lucide-react";
import Link from "next/link";

const pricingTiers = [
  {
    name: "Starter",
    commission: "12%",
    price: "Free",
    features: [
      "Up to 100 products",
      "Basic analytics",
      "Email support",
      "Standard payment processing",
      "30-day payout cycle",
    ],
  },
  {
    name: "Professional",
    commission: "9%",
    price: "$29/month",
    popular: true,
    features: [
      "Unlimited products",
      "Advanced analytics",
      "Priority support",
      "Faster payment processing",
      "15-day payout cycle",
      "Featured seller badge",
      "Promotional tools",
    ],
  },
  {
    name: "Enterprise",
    commission: "6%",
    price: "$99/month",
    features: [
      "Everything in Professional",
      "Dedicated account manager",
      "7-day payout cycle",
      "Custom storefront design",
      "API access",
      "Bulk product upload",
      "Marketing assistance",
    ],
  },
];

const benefits = [
  {
    icon: Users,
    title: "Millions of Customers",
    description: "Get instant access to a massive customer base actively looking to buy.",
  },
  {
    icon: TrendingUp,
    title: "Easy Growth",
    description: "Our platform tools help you scale your business and increase sales.",
  },
  {
    icon: Shield,
    title: "Secure Payments",
    description: "Fast, secure payments processed directly to your bank account.",
  },
  {
    icon: Headphones,
    title: "24/7 Support",
    description: "Dedicated seller support team ready to help you succeed.",
  },
  {
    icon: Package,
    title: "Simple Fulfillment",
    description: "Integrated shipping tools make order fulfillment hassle-free.",
  },
  {
    icon: Zap,
    title: "Quick Setup",
    description: "Get your store live in minutes with our easy onboarding process.",
  },
];

export default function SellerInfoPage() {
  return (
    <CustomerLayout>
      {/* Hero */}
      <section className="bg-gradient-to-br from-primary via-primary/95 to-accent py-16 md:py-24 text-primary-foreground">
        <div className="container text-center">
          <Badge className="mb-4 bg-accent text-accent-foreground">
            Start Selling Today
          </Badge>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
            Turn Your Products into Profits
          </h1>
          <p className="text-xl text-primary-foreground/90 mb-8 max-w-3xl mx-auto">
            Join thousands of successful sellers on our platform. Low fees, millions of customers, and all the tools you need to grow your business.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link href="/seller/register">
              <Button size="lg" className="bg-accent hover:bg-accent/90 text-accent-foreground font-semibold">
                Start Selling Now
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/seller/pricing">
              <Button size="lg" variant="outline" className="bg-transparent border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/10">
                View Pricing
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-12 bg-muted/30">
        <div className="container">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center">
              <p className="text-4xl md:text-5xl font-bold font-mono text-primary mb-2">12M+</p>
              <p className="text-muted-foreground">Active Buyers</p>
            </div>
            <div className="text-center">
              <p className="text-4xl md:text-5xl font-bold font-mono text-primary mb-2">45K+</p>
              <p className="text-muted-foreground">Sellers</p>
            </div>
            <div className="text-center">
              <p className="text-4xl md:text-5xl font-bold font-mono text-primary mb-2">6%</p>
              <p className="text-muted-foreground">Lowest Fee</p>
            </div>
            <div className="text-center">
              <p className="text-4xl md:text-5xl font-bold font-mono text-primary mb-2">99.9%</p>
              <p className="text-muted-foreground">Uptime</p>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-16">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Why Sell With Us?</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Everything you need to start, run, and grow your online business.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {benefits.map((benefit) => (
              <Card key={benefit.title} className="p-6 hover:shadow-lg transition-shadow">
                <div className="h-12 w-12 rounded-lg bg-accent/10 mb-4 flex items-center justify-center">
                  <benefit.icon className="h-6 w-6 text-accent" />
                </div>
                <h3 className="font-semibold text-lg mb-2">{benefit.title}</h3>
                <p className="text-muted-foreground">{benefit.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-16 bg-muted/30">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Transparent Pricing</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Choose the plan that's right for your business. No hidden fees.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {pricingTiers.map((tier) => (
              <Card key={tier.name} className={`relative ${tier.popular ? "ring-2 ring-accent shadow-lg scale-105" : ""}`}>
                {tier.popular && (
                  <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-accent">
                    Most Popular
                  </Badge>
                )}
                <CardHeader>
                  <CardTitle className="text-center">
                    <p className="text-xl mb-2">{tier.name}</p>
                    <p className="text-4xl font-bold font-mono">{tier.price}</p>
                    <p className="text-sm text-muted-foreground mt-2">
                      {tier.commission} commission per sale
                    </p>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3 mb-6">
                    {tier.features.map((feature, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <Check className="h-5 w-5 text-accent flex-shrink-0 mt-0.5" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Link href="/seller/register">
                    <Button className="w-full" variant={tier.popular ? "default" : "outline"}>
                      Get Started
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="mt-12 text-center">
            <Card className="p-6 max-w-3xl mx-auto bg-accent/5">
              <div className="flex items-start gap-3">
                <Info className="h-5 w-5 text-accent flex-shrink-0 mt-0.5" />
                <div className="text-left">
                  <p className="font-semibold mb-2">How Commission Works</p>
                  <p className="text-sm text-muted-foreground">
                    Commission is only charged on successful sales. No upfront fees, listing fees, or hidden charges. You keep the rest of the sale price after commission and payment processing fees (2.9% + $0.30).
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">How It Works</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Start selling in 4 simple steps
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-8">
            {[
              { step: "1", title: "Register", description: "Create your seller account and complete verification" },
              { step: "2", title: "Add Products", description: "List your products with photos and descriptions" },
              { step: "3", title: "Get Orders", description: "Customers discover and purchase your products" },
              { step: "4", title: "Ship & Earn", description: "Fulfill orders and receive payments to your bank" },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="h-16 w-16 rounded-full bg-accent text-accent-foreground font-bold text-2xl flex items-center justify-center mx-auto mb-4">
                  {item.step}
                </div>
                <h3 className="font-semibold text-lg mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-gradient-to-br from-primary via-primary/95 to-accent text-primary-foreground">
        <div className="container text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to Start Selling?</h2>
          <p className="text-xl text-primary-foreground/90 mb-8 max-w-2xl mx-auto">
            Join our marketplace today and reach millions of customers.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link href="/seller/register">
              <Button size="lg" className="bg-accent hover:bg-accent/90 text-accent-foreground font-semibold">
                Register Now
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/seller/guidelines">
              <Button size="lg" variant="outline" className="bg-transparent border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/10">
                Seller Guidelines
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </CustomerLayout>
  );
}