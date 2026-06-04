"use client";

import { useRouter } from "next/router";
import { useEffect } from "react";
import { useAuthContext } from "@/contexts/AuthContext";

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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (requireAuth && !user) {
    return null;
  }

  if (requiredRole && profile?.role !== requiredRole) {
    return null;
  }

  return <>{children}</>;
}