"use client";

import { useEffect } from "react";
import { useRouter } from "next/router";

export default function ForgotPasswordRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/auth/forgot-password");
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
    </div>
  );
}