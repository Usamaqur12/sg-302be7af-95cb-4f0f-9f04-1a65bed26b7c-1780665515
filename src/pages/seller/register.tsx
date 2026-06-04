"use client";

import { CustomerLayout } from "@/components/CustomerLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { Store, Upload, Shield, CheckCircle2, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export default function SellerRegisterPage() {
  const { toast } = useToast();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  const [formData, setFormData] = useState({
    // Personal Information
    fullName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",

    // Business Information  
    shopName: "",
    shopDescription: "",
    businessType: "individual" as const,

    // Address
    address: "",
    city: "",
    state: "",
    zipCode: "",
    country: "United States",

    // Bank Details
    bankAccountNumber: "",
    bankName: "",
    bankRoutingNumber: "",

    // Terms
    agreeToTerms: false,
  });

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!acceptedTerms) {
      toast({
        title: "Terms Required",
        description: "Please accept the seller terms and conditions.",
        variant: "destructive",
      });
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast({
        title: "Password Mismatch",
        description: "Passwords do not match.",
        variant: "destructive",
      });
      return;
    }

    if (formData.password.length < 6) {
      toast({
        title: "Weak Password",
        description: "Password must be at least 6 characters long.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      // 1. Create auth user with vendor role
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.fullName,
            role: "vendor",
          },
        },
      });

      if (authError) throw authError;

      if (!authData.user) {
        throw new Error("User creation failed");
      }

      // 2. Create seller profile with pending status
      // Note: verification_status column will be available after Phase 2 migration
      const { error: profileError } = await supabase.from("seller_profiles").insert({
        user_id: authData.user.id,
        business_name: formData.shopName,
        business_description: formData.shopDescription,
        business_type: formData.businessType,
        business_address: `${formData.address}, ${formData.city}, ${formData.state} ${formData.zipCode}, ${formData.country}`,
        commission_rate: 12, // Default commission rate
        bank_account_number: formData.bankAccountNumber,
        bank_name: formData.bankName,
        bank_routing_number: formData.bankRoutingNumber,
      });

      if (profileError) throw profileError;

      // Note: Admin notifications will be enabled after Phase 2 migration adds notifications table

      toast({
        title: "Application Submitted!",
        description: "Your seller application has been created. Please wait for admin approval.",
      });

      // Sign out the new user and redirect to login
      await supabase.auth.signOut();
      router.push("/seller/login");
    } catch (error: any) {
      toast({
        title: "Registration Failed",
        description: error.message || "Could not submit application. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <CustomerLayout>
      <div className="container py-12">
        {/* Header */}
        <div className="max-w-4xl mx-auto mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Store className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Become a Seller</h1>
              <p className="text-muted-foreground">Start selling to millions of customers</p>
            </div>
          </div>

          {/* Benefits */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <Card>
              <CardContent className="pt-6">
                <CheckCircle2 className="h-8 w-8 text-accent mb-3" />
                <h3 className="font-semibold mb-1">Low Commission</h3>
                <p className="text-sm text-muted-foreground">Starting at 12%</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <CheckCircle2 className="h-8 w-8 text-accent mb-3" />
                <h3 className="font-semibold mb-1">Fast Payouts</h3>
                <p className="text-sm text-muted-foreground">Weekly settlements</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <CheckCircle2 className="h-8 w-8 text-accent mb-3" />
                <h3 className="font-semibold mb-1">Seller Support</h3>
                <p className="text-sm text-muted-foreground">24/7 assistance</p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Registration Form */}
        <Card className="max-w-4xl mx-auto">
          <CardHeader>
            <CardTitle>Seller Registration Form</CardTitle>
            <CardDescription>Fill in your details to get started</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Personal Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Personal Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="fullName">Full Name *</Label>
                    <Input
                      id="fullName"
                      value={formData.fullName}
                      onChange={(e) => handleChange("fullName", e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email Address *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleChange("email", e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone Number *</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => handleChange("phone", e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="password">Password *</Label>
                    <Input
                      id="password"
                      type="password"
                      value={formData.password}
                      onChange={(e) => handleChange("password", e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="confirmPassword">Confirm Password *</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={formData.confirmPassword}
                      onChange={(e) => handleChange("confirmPassword", e.target.value)}
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Business Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Business Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="shopName">Shop Name *</Label>
                    <Input
                      id="shopName"
                      value={formData.shopName}
                      onChange={(e) => handleChange("shopName", e.target.value)}
                      placeholder="e.g., Tech Gadgets Store"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="businessType">Business Type *</Label>
                    <Select value={formData.businessType} onValueChange={(value) => handleChange("businessType", value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select business type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="individual">Individual</SelectItem>
                        <SelectItem value="company">Company</SelectItem>
                        <SelectItem value="partnership">Partnership</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="md:col-span-2">
                    <Label htmlFor="shopDescription">Shop Description *</Label>
                    <Textarea
                      id="shopDescription"
                      value={formData.shopDescription}
                      onChange={(e) => handleChange("shopDescription", e.target.value)}
                      placeholder="Describe what you sell..."
                      rows={4}
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Address Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Business Address</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <Label htmlFor="address">Street Address *</Label>
                    <Input
                      id="address"
                      value={formData.address}
                      onChange={(e) => handleChange("address", e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="city">City *</Label>
                    <Input id="city" value={formData.city} onChange={(e) => handleChange("city", e.target.value)} required />
                  </div>
                  <div>
                    <Label htmlFor="state">State/Province *</Label>
                    <Input id="state" value={formData.state} onChange={(e) => handleChange("state", e.target.value)} required />
                  </div>
                  <div>
                    <Label htmlFor="zipCode">ZIP/Postal Code *</Label>
                    <Input
                      id="zipCode"
                      value={formData.zipCode}
                      onChange={(e) => handleChange("zipCode", e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="country">Country *</Label>
                    <Input
                      id="country"
                      value={formData.country}
                      onChange={(e) => handleChange("country", e.target.value)}
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Bank Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Bank Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="bankName">Bank Name *</Label>
                    <Input
                      id="bankName"
                      value={formData.bankName}
                      onChange={(e) => handleChange("bankName", e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="bankAccountNumber">Account Number *</Label>
                    <Input
                      id="bankAccountNumber"
                      value={formData.bankAccountNumber}
                      onChange={(e) => handleChange("bankAccountNumber", e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="bankRoutingNumber">Routing Number (Optional)</Label>
                    <Input
                      id="bankRoutingNumber"
                      value={formData.bankRoutingNumber}
                      onChange={(e) => handleChange("bankRoutingNumber", e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Terms and Conditions */}
              <div className="flex items-start gap-2">
                <Checkbox
                  id="terms"
                  checked={acceptedTerms}
                  onCheckedChange={(checked) => setAcceptedTerms(checked as boolean)}
                />
                <Label htmlFor="terms" className="text-sm leading-relaxed cursor-pointer">
                  I agree to the{" "}
                  <Link href="/seller-terms" className="text-accent hover:underline">
                    Seller Terms & Conditions
                  </Link>{" "}
                  and{" "}
                  <Link href="/privacy" className="text-accent hover:underline">
                    Privacy Policy
                  </Link>
                </Label>
              </div>

              {/* Submit Button */}
              <div className="flex gap-4">
                <Button type="submit" size="lg" className="flex-1" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Submitting Application...
                    </>
                  ) : (
                    <>
                      <Shield className="mr-2 h-5 w-5" />
                      Submit Application
                    </>
                  )}
                </Button>
              </div>

              {/* Login Link */}
              <div className="text-center pt-4 border-t">
                <p className="text-sm text-muted-foreground">
                  Already have a seller account?{" "}
                  <Link href="/seller/login" className="text-accent hover:underline font-medium">
                    Sign In
                  </Link>
                </p>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </CustomerLayout>
  );
}