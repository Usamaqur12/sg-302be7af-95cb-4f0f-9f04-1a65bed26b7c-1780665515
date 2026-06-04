"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuthContext } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff, Loader2, Store } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export default function SellerLoginPage() {
  const router = useRouter();
  const { signIn } = useAuthContext();
  const { toast } = useToast();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { user } = await signIn(email, password);

      // Fetch user profile to verify role
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      if (profileError) throw profileError;

      // Map 'seller' to 'vendor' for consistency
      const mappedRole = profile.role === "seller" ? "vendor" : profile.role;

      if (mappedRole !== "vendor") {
        await supabase.auth.signOut();
        toast({
          title: "Access Denied",
          description: "This account is not registered as a seller",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Welcome back!",
        description: "You have successfully logged in.",
      });

      router.push("/seller");
    } catch (error: any) {
      toast({
        title: "Login Failed",
        description: error.message || "Invalid email or password",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card>
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <Store className="h-12 w-12 text-primary" />
            </div>
            <CardTitle className="text-2xl font-bold">Seller Login</CardTitle>
            <CardDescription>Log in to your seller dashboard</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="seller@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-sm">
                <Link href="/forgot-password" className="text-primary hover:underline">
                  Forgot password?
                </Link>
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Log In as Seller
              </Button>

              <div className="text-center text-sm text-muted-foreground">
                Don't have a seller account?{" "}
                <Link href="/seller/register" className="text-primary hover:underline font-medium">
                  Register as seller
                </Link>
              </div>

              <div className="text-center text-sm">
                <Link href="/login" className="text-muted-foreground hover:text-foreground">
                  ← Back to customer login
                </Link>
              </div>

              <div className="bg-muted/50 p-4 rounded-lg text-xs space-y-2">
                <p className="font-semibold">Demo Seller Accounts:</p>
                <div>
                  <p className="font-medium">Approved Seller:</p>
                  <p>Email: seller@marketplace.com</p>
                  <p>Password: Seller@123</p>
                </div>
                <div className="mt-2">
                  <p className="font-medium">Pending Seller:</p>
                  <p>Email: pending@marketplace.com</p>
                  <p>Password: Seller@123</p>
                </div>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}