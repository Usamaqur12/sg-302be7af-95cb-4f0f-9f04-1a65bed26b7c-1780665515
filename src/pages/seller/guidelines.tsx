import { CustomerLayout } from "@/components/CustomerLayout";
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { CheckCircle2, AlertCircle } from "lucide-react";
import Link from "next/link";

export default function SellerGuidelinesPage() {
  return (
    <CustomerLayout>
      <div className="container py-12">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold mb-6">Seller Guidelines</h1>
          <p className="text-muted-foreground text-lg mb-8">
            Everything you need to know about selling on our marketplace
          </p>

          <Alert className="mb-8">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Please read these guidelines carefully before listing products. Violations may result in
              account suspension or permanent ban.
            </AlertDescription>
          </Alert>

          <Card className="p-8 space-y-8">
            <section>
              <h2 className="text-2xl font-bold mb-4">Getting Started</h2>
              <div className="space-y-4">
                <div className="flex gap-3">
                  <CheckCircle2 className="h-6 w-6 text-primary flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-semibold mb-1">Complete Your Profile</h3>
                    <p className="text-muted-foreground">
                      Set up your seller profile with business details, contact information, and
                      verification documents.
                    </p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <CheckCircle2 className="h-6 w-6 text-primary flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-semibold mb-1">Verify Your Identity</h3>
                    <p className="text-muted-foreground">
                      Submit required KYC documents to verify your business and enable payments.
                    </p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <CheckCircle2 className="h-6 w-6 text-primary flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-semibold mb-1">List Your Products</h3>
                    <p className="text-muted-foreground">
                      Add products with accurate descriptions, high-quality images, and competitive
                      pricing.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">Product Listing Requirements</h2>
              <ul className="space-y-3 text-muted-foreground">
                <li className="flex gap-2">
                  <span>•</span>
                  <span>
                    <strong>Accurate Descriptions:</strong> Provide detailed, honest product
                    descriptions including materials, dimensions, and condition.
                  </span>
                </li>
                <li className="flex gap-2">
                  <span>•</span>
                  <span>
                    <strong>Quality Images:</strong> Use clear, well-lit photos from multiple angles.
                    Minimum 800x800px resolution.
                  </span>
                </li>
                <li className="flex gap-2">
                  <span>•</span>
                  <span>
                    <strong>Fair Pricing:</strong> Set competitive prices. Misleading or inflated
                    prices will be flagged.
                  </span>
                </li>
                <li className="flex gap-2">
                  <span>•</span>
                  <span>
                    <strong>Correct Categories:</strong> List products in the appropriate category for
                    better visibility.
                  </span>
                </li>
                <li className="flex gap-2">
                  <span>•</span>
                  <span>
                    <strong>Stock Accuracy:</strong> Keep inventory updated to prevent overselling.
                  </span>
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">Prohibited Items</h2>
              <p className="text-muted-foreground mb-4">
                The following items are strictly prohibited on our marketplace:
              </p>
              <ul className="space-y-2 text-muted-foreground">
                <li className="flex gap-2">
                  <span>•</span>
                  <span>Counterfeit or replica products</span>
                </li>
                <li className="flex gap-2">
                  <span>•</span>
                  <span>Illegal drugs, weapons, or hazardous materials</span>
                </li>
                <li className="flex gap-2">
                  <span>•</span>
                  <span>Stolen goods or property</span>
                </li>
                <li className="flex gap-2">
                  <span>•</span>
                  <span>Adult content or services</span>
                </li>
                <li className="flex gap-2">
                  <span>•</span>
                  <span>Items that violate intellectual property rights</span>
                </li>
                <li className="flex gap-2">
                  <span>•</span>
                  <span>Living animals or plants (without proper permits)</span>
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">Order Fulfillment</h2>
              <ul className="space-y-3 text-muted-foreground">
                <li className="flex gap-2">
                  <span>•</span>
                  <span>
                    <strong>Processing Time:</strong> Ship orders within 2 business days of purchase.
                  </span>
                </li>
                <li className="flex gap-2">
                  <span>•</span>
                  <span>
                    <strong>Tracking Information:</strong> Provide tracking numbers for all shipments.
                  </span>
                </li>
                <li className="flex gap-2">
                  <span>•</span>
                  <span>
                    <strong>Packaging:</strong> Use appropriate packaging to prevent damage during
                    shipping.
                  </span>
                </li>
                <li className="flex gap-2">
                  <span>•</span>
                  <span>
                    <strong>Communication:</strong> Respond to customer inquiries within 24 hours.
                  </span>
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">Customer Service Standards</h2>
              <ul className="space-y-3 text-muted-foreground">
                <li className="flex gap-2">
                  <span>•</span>
                  <span>Maintain a professional and courteous tone in all communications</span>
                </li>
                <li className="flex gap-2">
                  <span>•</span>
                  <span>Handle returns and refunds according to stated policies</span>
                </li>
                <li className="flex gap-2">
                  <span>•</span>
                  <span>Resolve disputes fairly and promptly</span>
                </li>
                <li className="flex gap-2">
                  <span>•</span>
                  <span>Never share customer information with third parties</span>
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">Performance Metrics</h2>
              <p className="text-muted-foreground mb-4">
                Your seller account is evaluated on the following metrics:
              </p>
              <ul className="space-y-3 text-muted-foreground">
                <li className="flex gap-2">
                  <span>•</span>
                  <span>
                    <strong>Order Defect Rate:</strong> Should be below 1% (includes cancellations,
                    refunds, and negative feedback)
                  </span>
                </li>
                <li className="flex gap-2">
                  <span>•</span>
                  <span>
                    <strong>Late Shipment Rate:</strong> Should be below 4%
                  </span>
                </li>
                <li className="flex gap-2">
                  <span>•</span>
                  <span>
                    <strong>Customer Response Time:</strong> Average response time under 24 hours
                  </span>
                </li>
                <li className="flex gap-2">
                  <span>•</span>
                  <span>
                    <strong>Customer Satisfaction:</strong> Maintain a rating above 4.0 stars
                  </span>
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">Violations & Penalties</h2>
              <p className="text-muted-foreground mb-4">
                Violations of these guidelines may result in:
              </p>
              <ul className="space-y-2 text-muted-foreground">
                <li className="flex gap-2">
                  <span>•</span>
                  <span>Product listing removal</span>
                </li>
                <li className="flex gap-2">
                  <span>•</span>
                  <span>Temporary account suspension</span>
                </li>
                <li className="flex gap-2">
                  <span>•</span>
                  <span>Withholding of funds</span>
                </li>
                <li className="flex gap-2">
                  <span>•</span>
                  <span>Permanent account ban for serious or repeated violations</span>
                </li>
              </ul>
            </section>
          </Card>

          <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg">
              <Link href="/seller/register">Start Selling Today</Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/seller/pricing">View Pricing</Link>
            </Button>
          </div>
        </div>
      </div>
    </CustomerLayout>
  );
}