"use client";

import { CustomerLayout } from "@/components/CustomerLayout";
import { Card, CardContent } from "@/components/ui/card";
import { TruckIcon, Package, MapPin, Clock, DollarSign } from "lucide-react";

export default function ShippingPage() {
  return (
    <CustomerLayout>
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-primary/5 via-background to-accent/5 py-16">
        <div className="container">
          <div className="max-w-3xl mx-auto text-center">
            <TruckIcon className="h-16 w-16 mx-auto mb-4 text-primary" />
            <h1 className="text-4xl font-bold mb-4">Shipping Information</h1>
            <p className="text-muted-foreground text-lg">
              Fast, reliable delivery to your doorstep. Learn about our shipping options
              and policies.
            </p>
          </div>
        </div>
      </div>

      <div className="container py-16">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-16">
          <Card>
            <CardContent className="pt-6 text-center">
              <Package className="h-8 w-8 mx-auto mb-2 text-accent" />
              <div className="text-2xl font-bold mb-1">Free</div>
              <p className="text-sm text-muted-foreground">On orders $50+</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <Clock className="h-8 w-8 mx-auto mb-2 text-accent" />
              <div className="text-2xl font-bold mb-1">3-7 Days</div>
              <p className="text-sm text-muted-foreground">Standard Delivery</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <TruckIcon className="h-8 w-8 mx-auto mb-2 text-accent" />
              <div className="text-2xl font-bold mb-1">1-2 Days</div>
              <p className="text-sm text-muted-foreground">Express Shipping</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <MapPin className="h-8 w-8 mx-auto mb-2 text-accent" />
              <div className="text-2xl font-bold mb-1">Nationwide</div>
              <p className="text-sm text-muted-foreground">All 50 States</p>
            </CardContent>
          </Card>
        </div>

        {/* Shipping Methods */}
        <div className="max-w-4xl mx-auto space-y-12">
          <section>
            <h2 className="text-2xl font-bold mb-6">Shipping Methods</h2>
            <div className="space-y-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    <div className="h-12 w-12 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
                      <Package className="h-6 w-6 text-accent" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold">Standard Shipping</h3>
                        <span className="font-mono font-medium">$5.99 or FREE</span>
                      </div>
                      <p className="text-muted-foreground mb-2">
                        Delivery in 3-7 business days
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Free on all orders over $50. Most economical option for non-urgent
                        deliveries.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    <div className="h-12 w-12 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
                      <TruckIcon className="h-6 w-6 text-accent" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold">Express Shipping</h3>
                        <span className="font-mono font-medium">$14.99</span>
                      </div>
                      <p className="text-muted-foreground mb-2">
                        Delivery in 1-2 business days
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Priority handling for faster delivery. Available for most products and
                        locations.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    <div className="h-12 w-12 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
                      <Clock className="h-6 w-6 text-accent" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold">Next-Day Delivery</h3>
                        <span className="font-mono font-medium">$24.99</span>
                      </div>
                      <p className="text-muted-foreground mb-2">
                        Delivery next business day
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Order before 2 PM for next-day delivery. Available in select metro
                        areas only.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </section>

          {/* Order Processing */}
          <section>
            <h2 className="text-2xl font-bold mb-6">Order Processing</h2>
            <Card>
              <CardContent className="pt-6 space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">Processing Time</h3>
                  <p className="text-muted-foreground">
                    Most orders are processed and shipped within 1-2 business days. During
                    peak seasons (holidays, sales events), processing may take up to 3
                    business days. You'll receive a shipping confirmation email with tracking
                    information once your order ships.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Order Cutoff Times</h3>
                  <p className="text-muted-foreground">
                    Orders placed before 2 PM EST Monday-Friday are typically processed the
                    same day. Orders placed after 2 PM or on weekends will be processed the
                    next business day.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Multiple Sellers</h3>
                  <p className="text-muted-foreground">
                    If your order contains items from multiple sellers, each seller will ship
                    their items separately. You may receive multiple shipments with different
                    tracking numbers.
                  </p>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Tracking Your Order */}
          <section>
            <h2 className="text-2xl font-bold mb-6">Tracking Your Order</h2>
            <Card>
              <CardContent className="pt-6 space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">Tracking Information</h3>
                  <p className="text-muted-foreground">
                    Once your order ships, you'll receive an email with a tracking number.
                    You can also view tracking information by logging into your account and
                    visiting the Orders page.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Real-Time Updates</h3>
                  <p className="text-muted-foreground">
                    Track your package in real-time through our website or mobile app. You'll
                    receive notifications when your package is out for delivery and when it's
                    been delivered.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Delivery Issues</h3>
                  <p className="text-muted-foreground">
                    If your tracking shows "Delivered" but you haven't received your package,
                    please check with neighbors or your building's management office. If you
                    still can't locate it, contact us within 48 hours for assistance.
                  </p>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* International Shipping */}
          <section>
            <h2 className="text-2xl font-bold mb-6">International Shipping</h2>
            <Card>
              <CardContent className="pt-6 space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">Countries We Ship To</h3>
                  <p className="text-muted-foreground">
                    We currently ship to select international destinations. Shipping costs and
                    delivery times vary by location. International orders may be subject to
                    customs duties and taxes, which are the responsibility of the recipient.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Customs & Import Fees</h3>
                  <p className="text-muted-foreground">
                    Import taxes, duties, and customs fees are not included in the item price
                    or shipping cost. These charges are collected by the carrier at delivery
                    and are the buyer's responsibility.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Delivery Times</h3>
                  <p className="text-muted-foreground">
                    International shipments typically take 7-21 business days, depending on
                    the destination country and customs clearance times.
                  </p>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Shipping Restrictions */}
          <section>
            <h2 className="text-2xl font-bold mb-6">Shipping Restrictions</h2>
            <Card>
              <CardContent className="pt-6">
                <p className="text-muted-foreground mb-4">
                  Some items cannot be shipped to certain locations due to legal restrictions,
                  carrier limitations, or seller preferences. These restrictions include:
                </p>
                <ul className="space-y-2 text-muted-foreground">
                  <li>• Hazardous materials (batteries, aerosols, flammable liquids)</li>
                  <li>• Oversized or overweight items to remote areas</li>
                  <li>• Restricted products (electronics, supplements) to certain countries</li>
                  <li>• Items requiring special licenses or permits</li>
                </ul>
                <p className="text-muted-foreground mt-4">
                  You'll be notified at checkout if any items in your cart cannot be shipped
                  to your address.
                </p>
              </CardContent>
            </Card>
          </section>
        </div>
      </div>
    </CustomerLayout>
  );
}