"use client";

import Link from "next/link";
import { useRouter } from "next/router";
import { useState } from "react";
import type { FormEvent } from "react";
import {
  ArrowLeft,
  Eye,
  EyeOff,
  Loader2,
  LockKeyhole,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuthContext } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { getErrorMessage } from "@/lib/errors";

export default function AdminLoginPage() {
  const router = useRouter();
  const { signIn, signOut } = useAuthContext();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();

    setLoading(true);
    try {
      const result = await signIn(email.trim().toLowerCase(), password);
      if (result.error) throw result.error;

      if (result.profile?.role !== "admin") {
        await signOut();
        toast({
          title: "Admin access required",
          description: "This account is not authorized for the admin console.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Welcome back",
        description: "Your administrator session is ready.",
      });
      await router.replace("/admin");
    } catch (error) {
      toast({
        title: "Sign-in failed",
        description: getErrorMessage(error, "Check your email and password."),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#f3f4f6] p-4 sm:p-6 lg:p-10">
      <div className="mx-auto grid min-h-[calc(100vh-2rem)] max-w-5xl overflow-hidden rounded-lg border bg-white shadow-xl sm:min-h-[calc(100vh-3rem)] lg:grid-cols-[1.05fr_0.95fr]">
        <section className="relative hidden flex-col justify-between bg-[#111827] p-10 text-white lg:flex">
          <div>
            <Link href="/" className="inline-flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-md bg-accent text-accent-foreground">
                <ShieldCheck className="h-6 w-6" />
              </span>
              <div>
                <p className="text-xl font-bold">Mercato</p>
                <p className="text-sm text-slate-400">Marketplace Operations</p>
              </div>
            </Link>
          </div>

          <div className="max-w-md">
            <p className="text-sm font-semibold uppercase text-amber-400">Admin Console</p>
            <h1 className="mt-4 text-4xl font-bold leading-tight">
              Run marketplace operations with clarity.
            </h1>
            <p className="mt-4 text-base leading-7 text-slate-300">
              Secure access for seller approvals, catalog moderation, orders, payments, and support.
            </p>
          </div>

          <div className="flex items-center gap-3 border-t border-white/10 pt-6 text-sm text-slate-400">
            <LockKeyhole className="h-4 w-4" />
            Role-verified administrator access
          </div>
        </section>

        <section className="flex items-center p-6 sm:p-10 lg:p-12">
          <div className="mx-auto w-full max-w-sm">
            <Link
              href="/"
              className="mb-10 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to storefront
            </Link>

            <div className="mb-8">
              <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-md bg-primary text-primary-foreground lg:hidden">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <h2 className="text-3xl font-bold">Administrator sign in</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Use an account assigned the admin role.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email">Email address</Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="username"
                  placeholder="admin@yourdomain.com"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  disabled={loading}
                  required
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  <Link href="/forgot-password" className="text-sm font-medium text-primary hover:underline">
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    disabled={loading}
                    className="pr-10"
                    required
                  />
                  <button
                    type="button"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    onClick={() => setShowPassword((current) => !current)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full"
                size="lg"
                disabled={loading}
              >
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Sign in to console
              </Button>
            </form>

            <p className="mt-8 text-center text-xs leading-5 text-muted-foreground">
              Access is logged and restricted by marketplace role policies.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
