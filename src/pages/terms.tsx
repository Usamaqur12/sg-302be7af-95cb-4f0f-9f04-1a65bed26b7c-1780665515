import { CustomerLayout } from "@/components/CustomerLayout";
import { Card } from "@/components/ui/card";

export default function TermsPage() {
  return (
    <CustomerLayout>
      <div className="container py-12">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold mb-6">Terms of Service</h1>
          <p className="text-muted-foreground mb-8">Last updated: June 2026</p>

          <Card className="p-8 space-y-6">
            <section>
              <h2 className="text-2xl font-bold mb-4">1. Acceptance of Terms</h2>
              <p className="text-muted-foreground leading-relaxed">
                By accessing and using this marketplace platform, you accept and agree to be bound by
                the terms and provision of this agreement. If you do not agree to abide by these terms,
                please do not use this service.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">2. Use of Service</h2>
              <p className="text-muted-foreground leading-relaxed">
                You agree to use the marketplace only for lawful purposes and in a way that does not
                infringe the rights of, restrict, or inhibit anyone else's use and enjoyment of the
                marketplace.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">3. User Accounts</h2>
              <p className="text-muted-foreground leading-relaxed">
                You are responsible for maintaining the confidentiality of your account and password.
                You agree to accept responsibility for all activities that occur under your account.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">4. Product Listings</h2>
              <p className="text-muted-foreground leading-relaxed">
                Sellers are responsible for the accuracy of product descriptions, pricing, and
                availability. The marketplace is not responsible for the quality or condition of
                products sold by third-party sellers.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">5. Payments and Fees</h2>
              <p className="text-muted-foreground leading-relaxed">
                Prices are set by individual sellers. Payment processing is handled securely through
                our platform. The marketplace charges a commission on each sale as outlined in the
                Seller Agreement.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">6. Returns and Refunds</h2>
              <p className="text-muted-foreground leading-relaxed">
                Return policies are set by individual sellers and must comply with local consumer
                protection laws. Buyers have the right to return defective or misrepresented items.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">7. Limitation of Liability</h2>
              <p className="text-muted-foreground leading-relaxed">
                The marketplace shall not be liable for any indirect, incidental, special, or
                consequential damages arising out of or in connection with the use of the service.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">8. Contact Information</h2>
              <p className="text-muted-foreground leading-relaxed">
                For questions about these Terms of Service, contact us at:
                <br />
                Email: legal@marketplace.com
                <br />
                Phone: 1-800-MARKET-PLACE
              </p>
            </section>
          </Card>
        </div>
      </div>
    </CustomerLayout>
  );
}