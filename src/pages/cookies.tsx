import { CustomerLayout } from "@/components/CustomerLayout";
import { Card } from "@/components/ui/card";

export default function CookiesPage() {
  return (
    <CustomerLayout>
      <div className="container py-12">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold mb-6">Cookie Policy</h1>
          <p className="text-muted-foreground mb-8">Last updated: June 2026</p>

          <Card className="p-8 space-y-6">
            <section>
              <h2 className="text-2xl font-bold mb-4">What Are Cookies?</h2>
              <p className="text-muted-foreground leading-relaxed">
                Cookies are small text files stored on your device when you visit our marketplace.
                They help us provide you with a better experience by remembering your preferences
                and understanding how you use our site.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">Types of Cookies We Use</h2>
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">Essential Cookies</h3>
                  <p className="text-muted-foreground">
                    Required for the marketplace to function properly. These include authentication
                    cookies and shopping cart functionality.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Analytics Cookies</h3>
                  <p className="text-muted-foreground">
                    Help us understand how visitors interact with our marketplace, which pages are
                    most popular, and identify any errors.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Marketing Cookies</h3>
                  <p className="text-muted-foreground">
                    Used to deliver relevant advertisements and track campaign effectiveness.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Preference Cookies</h3>
                  <p className="text-muted-foreground">
                    Remember your settings and preferences, such as language and region.
                  </p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">Managing Cookies</h2>
              <p className="text-muted-foreground leading-relaxed">
                You can control and manage cookies through your browser settings. However, disabling
                certain cookies may affect the functionality of the marketplace. Most browsers allow
                you to refuse cookies or delete existing ones.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">Third-Party Cookies</h2>
              <p className="text-muted-foreground leading-relaxed">
                We use third-party services like Google Analytics and payment processors that may
                set their own cookies. These services have their own privacy and cookie policies.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">Contact Us</h2>
              <p className="text-muted-foreground leading-relaxed">
                If you have questions about our use of cookies, please contact us at:
                <br />
                Email: privacy@marketplace.com
              </p>
            </section>
          </Card>
        </div>
      </div>
    </CustomerLayout>
  );
}