import { CustomerLayout } from "@/components/CustomerLayout";
import { Card } from "@/components/ui/card";

export default function PrivacyPage() {
  return (
    <CustomerLayout>
      <div className="container py-12">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold mb-6">Privacy Policy</h1>
          <p className="text-muted-foreground mb-8">Last updated: June 2026</p>

          <Card className="p-8 space-y-6">
            <section>
              <h2 className="text-2xl font-bold mb-4">1. Information We Collect</h2>
              <p className="text-muted-foreground leading-relaxed">
                We collect information you provide directly to us, such as when you create an account,
                make a purchase, or contact customer support. This may include your name, email address,
                phone number, shipping address, and payment information.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">2. How We Use Your Information</h2>
              <p className="text-muted-foreground leading-relaxed">
                We use the information we collect to process your orders, provide customer support,
                send you updates about your orders, and improve our services. We may also use your
                information for marketing purposes with your consent.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">3. Information Sharing</h2>
              <p className="text-muted-foreground leading-relaxed">
                We share your information with sellers to fulfill your orders, with payment processors
                to process payments, and with shipping carriers to deliver your orders. We do not sell
                your personal information to third parties.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">4. Data Security</h2>
              <p className="text-muted-foreground leading-relaxed">
                We implement appropriate technical and organizational measures to protect your personal
                information against unauthorized access, alteration, disclosure, or destruction.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">5. Your Rights</h2>
              <p className="text-muted-foreground leading-relaxed">
                You have the right to access, correct, or delete your personal information. You may
                also object to or restrict certain processing of your information. To exercise these
                rights, please contact us at privacy@marketplace.com.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">6. Contact Us</h2>
              <p className="text-muted-foreground leading-relaxed">
                If you have questions about this Privacy Policy, please contact us at:
                <br />
                Email: privacy@marketplace.com
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