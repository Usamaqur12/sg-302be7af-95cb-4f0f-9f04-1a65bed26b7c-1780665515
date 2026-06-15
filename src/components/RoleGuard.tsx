"use client";

import { useAuthContext } from "@/contexts/AuthContext";
import { AlertCircle, Lock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useRouter } from "next/router";

type MarketplaceRole = "customer" | "seller" | "admin" | "manager" | "warehouse";

interface RoleGuardProps {
  children: React.ReactNode;
  allowedRoles: MarketplaceRole[];
}

const staffAllowedRoutes: Record<"manager" | "warehouse", string[]> = {
  manager: [
    "/admin",
    "/admin/users",
    "/admin/sellers",
    "/admin/marketing",
    "/admin/promotions",
    "/admin/products",
    "/admin/categories",
    "/admin/orders",
    "/admin/returns",
    "/admin/payments",
    "/admin/payouts",
    "/admin/reports",
    "/admin/support",
  ],
  warehouse: [
    "/admin",
    "/admin/products",
    "/admin/categories",
    "/admin/orders",
    "/admin/returns",
    "/admin/support",
  ],
};

function staffCanAccess(role: MarketplaceRole | null | undefined, pathname: string) {
  if (role !== "manager" && role !== "warehouse") return false;
  return staffAllowedRoutes[role].some((route) => pathname === route || pathname.startsWith(`${route}/`));
}

export function RoleGuard({ children, allowedRoles }: RoleGuardProps) {
  const { user, profile, loading } = useAuthContext();
  const router = useRouter();

  // Show loading spinner during auth check
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Show login required if not authenticated - NEVER return null, NEVER redirect
  if (!user) {
    const loginPath = allowedRoles.includes("admin") 
      ? "/admin/login" 
      : allowedRoles.includes("seller") 
      ? "/seller/login" 
      : "/login";

    const roleLabel = allowedRoles.includes("admin") 
      ? "Admin" 
      : allowedRoles.includes("seller") 
      ? "Seller" 
      : "Customer";

    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-background">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center">
            <Lock className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Authentication Required</h2>
            <p className="text-muted-foreground mb-6">
              You must be logged in as a {roleLabel.toLowerCase()} to access this page.
            </p>
            <div className="flex flex-col gap-2">
              <Button asChild size="lg">
                <Link href={loginPath}>Go to {roleLabel} Login</Link>
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

  if (!profile || (!allowedRoles.includes(profile.role) && !staffCanAccess(profile.role, router.pathname))) {
    const correctPath = profile?.role === "seller" 
      ? "/seller" 
      : profile?.role === "admin" || profile?.role === "manager" || profile?.role === "warehouse"
      ? "/admin" 
      : "/";

    const correctLabel = profile?.role === "seller" 
      ? "Seller Dashboard" 
      : profile?.role === "admin" || profile?.role === "manager" || profile?.role === "warehouse"
      ? "Admin Console" 
      : "Homepage";

    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-background">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center">
            <AlertCircle className="h-16 w-16 text-destructive mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
            <p className="text-muted-foreground mb-6">
              {profile
                ? <>You do not have permission to access this page. Your current role is <strong>{profile.role}</strong>.</>
                : "Your marketplace profile could not be loaded. Please sign in again."}
            </p>
            <div className="flex flex-col gap-2">
              <Button asChild size="lg">
                <Link href={correctPath}>Go to {correctLabel}</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}
