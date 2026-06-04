"use client";

import { useRouter } from "next/router";
import { useEffect } from "react";
import { useAuthContext } from "@/contexts/AuthContext";
import { AlertCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface RoleGuardProps {
  children: React.ReactNode;
  allowedRoles: Array<"customer" | "vendor" | "admin">;
  redirectTo?: string;
}

export function RoleGuard({ children, allowedRoles, redirectTo }: RoleGuardProps) {
  const { user, profile, loading } = useAuthContext();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    if (!user) {
      // Determine redirect based on required role
      if (allowedRoles.includes("admin")) {
        router.push("/admin/login");
      } else if (allowedRoles.includes("vendor")) {
        router.push("/seller/login");
      } else {
        router.push("/login");
      }
      return;
    }

    if (profile && !allowedRoles.includes(profile.role)) {
      if (redirectTo) {
        router.push(redirectTo);
      }
    }
  }, [user, profile, loading, allowedRoles, redirectTo, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  if (profile && !allowedRoles.includes(profile.role)) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-6 text-center">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
            <p className="text-muted-foreground mb-6">
              You don't have permission to access this page.
            </p>
            <div className="flex flex-col gap-2">
              <Button asChild>
                <Link href="/">Go to Homepage</Link>
              </Button>
              {profile.role === "vendor" && (
                <Button variant="outline" asChild>
                  <Link href="/seller">Go to Seller Dashboard</Link>
                </Button>
              )}
              {profile.role === "admin" && (
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