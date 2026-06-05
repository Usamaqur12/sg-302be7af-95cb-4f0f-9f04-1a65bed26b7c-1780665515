"use client";

import { useRouter } from "next/router";
import { useEffect } from "react";
import { useAuthContext } from "@/contexts/AuthContext";
import { Lock, AlertCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  requiredRole?: "customer" | "seller" | "admin";
  redirectTo?: string;
}

export function ProtectedRoute({
  children,
  requireAuth = true,
  requiredRole,
  redirectTo = "/login",
}: ProtectedRouteProps) {
  const { user, profile, loading } = useAuthContext();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    // Not authenticated
    if (requireAuth && !user) {
      router.push(redirectTo);
      return;
    }

    // Check role
    if (requiredRole && profile?.role !== requiredRole) {
      if (profile?.role === "seller") {
        router.push("/seller");
      } else if (profile?.role === "admin") {
        router.push("/admin");
      } else {
        router.push("/");
      }
    }
  }, [user, profile, loading, requireAuth, requiredRole, redirectTo, router]);

  // Show loading spinner during auth check
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Show login required if not authenticated - NEVER return null
  if (requireAuth && !user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-background">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center">
            <Lock className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Login Required</h2>
            <p className="text-muted-foreground mb-6">
              You must be logged in to access this page.
            </p>
            <div className="flex flex-col gap-2">
              <Button asChild size="lg">
                <Link href={redirectTo}>Go to Login</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/">Go to Homepage</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show access denied if wrong role - NEVER return null
  if (requiredRole && profile?.role !== requiredRole) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-background">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center">
            <AlertCircle className="h-16 w-16 text-destructive mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
            <p className="text-muted-foreground mb-6">
              You don't have permission to access this page.
              {profile && ` Your role: ${profile.role}`}
            </p>
            <div className="flex flex-col gap-2">
              <Button asChild size="lg">
                <Link href="/">Go to Homepage</Link>
              </Button>
              {profile?.role === "seller" && (
                <Button variant="outline" asChild>
                  <Link href="/seller">Go to Seller Dashboard</Link>
                </Button>
              )}
              {profile?.role === "admin" && (
                <Button variant="outline" asChild>
                  <Link href="/admin">Go to Admin Dashboard</Link>
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}