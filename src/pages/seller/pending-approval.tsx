"use client";

import { SellerLayout } from "@/components/SellerLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RoleGuard } from "@/components/RoleGuard";
import { Clock, Mail, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function PendingApprovalPage() {
  return (
    <RoleGuard allowedRoles={["seller"]}>
      <SellerLayout>
        <div className="container max-w-3xl mx-auto py-12">
          <Card>
            <CardContent className="p-12 text-center">
              <div className="mb-6">
                <div className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-amber-500/10 mb-4">
                  <Clock className="h-10 w-10 text-amber-600" />
                </div>
                <h1 className="text-3xl font-bold mb-2">Application Under Review</h1>
                <p className="text-lg text-muted-foreground">
                  Your seller account is pending admin approval
                </p>
              </div>

              <div className="max-w-md mx-auto space-y-4 text-left mb-8">
                <div className="p-4 bg-muted/50 rounded-lg">
                  <h3 className="font-semibold mb-2">What happens next?</h3>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>• Our team will review your application within 24-48 hours</li>
                    <li>• We'll verify your business information and documents</li>
                    <li>• You'll receive an email notification once approved</li>
                    <li>• After approval, you can start listing products immediately</li>
                  </ul>
                </div>

                <div className="p-4 bg-muted/50 rounded-lg">
                  <h3 className="font-semibold mb-2">While you wait:</h3>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>• Review our seller guidelines and policies</li>
                    <li>• Prepare product photos and descriptions</li>
                    <li>• Familiarize yourself with the dashboard</li>
                  </ul>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 justify-center mb-6">
                <Button variant="outline" asChild>
                  <Link href="/seller/guidelines">
                    <HelpCircle className="mr-2 h-4 w-4" />
                    View Guidelines
                  </Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link href="/contact">
                    <Mail className="mr-2 h-4 w-4" />
                    Contact Support
                  </Link>
                </Button>
              </div>

              <div className="text-sm text-muted-foreground">
                <p>Need immediate assistance?</p>
                <p className="flex items-center justify-center gap-2 mt-1">
                  <Phone className="h-4 w-4" />
                  <span>Call us at 1-800-MARKETPLACE</span>
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </SellerLayout>
    </RoleGuard>
  );
}