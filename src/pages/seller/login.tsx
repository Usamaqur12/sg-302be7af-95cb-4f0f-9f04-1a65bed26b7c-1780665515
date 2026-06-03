"use client";

import { CustomerLayout } from "@/components/CustomerLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { Store, ArrowRight } from "lucide-react";

export default function SellerLoginPage() {
  const { toast } = useToast();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // TODO: Integrate with Supabase seller authentication
      await new Promise((resolve) => setTimeout(resolve, 1500));

      toast({
        title: "Welcome back!",
        description: "You have successfully signed in to your seller account.",
      });

      router.push("/seller");
    } catch (error: any) {
      toast({
        title: "Login Failed",
        description: error.message || "Invalid credentials. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <CustomerLayout>
      <div className="container py-16">
        <div className="max-w-md mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Store className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-3xl font-bold mb-2">Seller Login</h1>
            <p className="text-muted-foreground">Access your seller dashboard</p>
          </div>

          {/* Login Card */}
          <Card>
            <CardHeader>
              <CardTitle>Sign In to Your Seller Account</CardTitle>
              <CardDescription>Enter your credentials to continue</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleChange("email", e.target.value)}
                    placeholder="seller@example.com"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => handleChange("password", e.target.value)}
                    placeholder="Enter your password"
                    required
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Link
                    href="/seller/forgot-password"
                    className="text-sm text-accent hover:underline"
                  >
                    Forgot password?
                  </Link>
                </div>

                <Button type="submit" className="w-full" size="lg" disabled={loading}>
                  {loading ? "Signing in..." : "Sign In"}
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>

                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="bg-background px-4 text-muted-foreground">
                      New to selling?
                    </span>
                  </div>
                </div>

                <Link href="/seller/register">
                  <Button type="button" variant="outline" className="w-full" size="lg">
                    Create Seller Account
                  </Button>
                </Link>
              </form>
            </CardContent>
          </Card>

          {/* Customer Login Link */}
          <div className="text-center mt-6">
            <p className="text-sm text-muted-foreground">
              Looking for customer login?{" "}
              <Link href="/auth/login" className="text-accent hover:underline font-medium">
                Sign in as Customer
              </Link>
            </p>
          </div>
        </div>
      </div>
    </CustomerLayout>
  );
}