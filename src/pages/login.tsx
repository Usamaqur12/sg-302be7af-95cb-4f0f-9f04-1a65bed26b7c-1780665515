"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { CustomerLayout } from "@/components/CustomerLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuthContext } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff, Loader2, ShoppingBag } from "lucide-react";

export default function LoginPage() {
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
      const response = await signIn(email, password);

      if (!response?.success || !response?.user) {
        throw new Error(response?.message || "Login failed");
      }

      const user = response.user;

      toast({
        title: "Welcome back!",
        description: "You have successfully logged in.",
      });

      // Redirect based on role with timeout to ensure state updates
      setTimeout(() => {
        if (user.role === "admin") {
          router.push("/admin");
        } else if (user.role === "vendor") {
          if (user.status === "pending") {
            router.push("/seller/pending-approval");
          } else {
            router.push("/seller");
          }
        } else {
          router.push("/account/dashboard");
        }
      }, 100);
    } catch (error: any) {
      console.error("Login error:", error);
      toast({
        title: "Login Failed",
        description: error?.message || "Invalid email or password",
        variant: "destructive",
      });
      setLoading(false);
    }
  };

  return (
    <CustomerLayout>
      <div className="container max-w-md py-16">
        <Card>
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <ShoppingBag className="h-12 w-12 text-primary" />
            </div>
            <CardTitle className="text-2xl font-bold">Welcome Back</CardTitle>
            <CardDescription>Log in to your customer account</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="customer@example.com"
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
                Log In
              </Button>

              <div className="text-center text-sm text-muted-foreground">
                Don't have an account?{" "}
                <Link href="/register" className="text-primary hover:underline font-medium">
                  Sign up
                </Link>
              </div>

              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">
                    Other Login Options
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <Link href="/seller/login">
                  <Button variant="outline" type="button" className="w-full">
                    Seller Login
                  </Button>
                </Link>
                <Link href="/admin/login">
                  <Button variant="outline" type="button" className="w-full">
                    Admin Login
                  </Button>
                </Link>
              </div>

              <div className="bg-muted/50 p-4 rounded-lg text-xs space-y-2">
                <p className="font-semibold">Demo Customer Account:</p>
                <p>Email: customer@marketplace.com</p>
                <p>Password: Customer@123</p>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </CustomerLayout>
  );
}