"use client";

import { useEffect } from "react";
import { useRouter } from "next/router";
import { Loader2 } from "lucide-react";

export default function AccountOrdersPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to /orders
    router.replace("/orders");
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-primary" />
        <p className="text-muted-foreground">Redirecting...</p>
      </div>
    </div>
  );
}