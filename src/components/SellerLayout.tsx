"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import {
  BadgePercent,
  BarChart3,
  Boxes,
  Clock,
  DollarSign,
  GraduationCap,
  Headphones,
  LayoutDashboard,
  Megaphone,
  Package,
  Settings,
  ShieldCheck,
  ShoppingCart,
  Store,
} from "lucide-react";
import { PortalShell, type PortalNavItem } from "@/components/PortalShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAuthContext } from "@/contexts/AuthContext";
import { useMarketplaceSettings } from "@/contexts/MarketplaceSettingsContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import {
  sellerCenterRowsWithSellerOverride,
  sellerCenterSettingKeys,
  visibleSellerCenterModules,
} from "@/lib/seller-center";

const homeNavItem: PortalNavItem = { href: "/seller", label: "Home", icon: LayoutDashboard };

const moduleIcons: Record<string, PortalNavItem["icon"]> = {
  "/seller/products": Package,
  "/seller/assortment-growth": Boxes,
  "/seller/orders": ShoppingCart,
  "/seller/account-health": ShieldCheck,
  "/seller/marketing": BadgePercent,
  "/seller/marketing-solutions": Megaphone,
  "/seller/analytics": BarChart3,
  "/seller/learn": GraduationCap,
  "/seller/store": Store,
  "/seller/earnings": DollarSign,
  "/seller/support": Headphones,
  "/seller/settings": Settings,
};

interface SellerCenterSetting {
  key: string;
  value: unknown;
}

export function SellerLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { signOut, user } = useAuthContext();
  const { siteName } = useMarketplaceSettings();
  const { toast } = useToast();
  const [sellerStatus, setSellerStatus] = useState<string | null>(null);
  const [sellerEnabledOptions, setSellerEnabledOptions] = useState<string | null>(null);
  const [settings, setSettings] = useState<SellerCenterSetting[]>([]);
  const [checkingStatus, setCheckingStatus] = useState(true);

  useEffect(() => {
    let active = true;

    if (!user || user.role !== "seller") {
      setCheckingStatus(false);
      return;
    }

    async function loadSellerStatus() {
      setCheckingStatus(true);
      try {
        const { data } = await supabase
          .from("seller_profiles")
          .select("status, seller_center_enabled_options")
          .eq("user_id", user.id)
          .maybeSingle();

        if (!active) return;
        setSellerStatus(data?.status ?? "pending");
        setSellerEnabledOptions(String(data?.seller_center_enabled_options ?? ""));
      } finally {
        if (active) setCheckingStatus(false);
      }
    }

    void loadSellerStatus();

    return () => {
      active = false;
    };
  }, [user]);

  useEffect(() => {
    let active = true;

    supabase
      .from("system_settings")
      .select("key, value")
      .in("key", [...sellerCenterSettingKeys])
      .then(({ data }) => {
        if (active) setSettings((data ?? []) as SellerCenterSetting[]);
      });

    return () => {
      active = false;
    };
  }, []);

  const handleSignOut = async () => {
    await signOut();
    toast({ title: "Signed out", description: "Your seller session has ended." });
    await router.push("/seller/login");
  };

  const approvalFreeRoutes = new Set([
    "/seller/pending-approval",
    "/seller/settings",
    "/seller/guidelines",
  ]);
  const needsApproval =
    user?.role === "seller" &&
    !checkingStatus &&
    sellerStatus !== "approved" &&
    !approvalFreeRoutes.has(router.pathname);

  const effectiveSettings = sellerCenterRowsWithSellerOverride(settings, sellerEnabledOptions);

  const visibleNavItems: PortalNavItem[] = [
    homeNavItem,
    ...visibleSellerCenterModules(effectiveSettings).map((module) => ({
      href: module.href,
      label: module.title,
      icon: moduleIcons[module.href] ?? Package,
      children: module.options.map((option) => ({
        href: option.href,
        label: option.title,
      })),
    })),
  ];

  const content = needsApproval ? (
    <div className="flex min-h-[60vh] items-center justify-center">
      <Card className="max-w-2xl">
        <CardContent className="p-10 text-center">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-md bg-amber-100 text-amber-700">
            <Clock className="h-8 w-8" />
          </div>
          <h1 className="text-2xl font-bold">Seller approval required</h1>
          <p className="mt-3 text-muted-foreground">
            Your store is currently <strong>{sellerStatus || "pending"}</strong>. Product listing,
            inventory, orders, earnings, and analytics unlock after account approval.
          </p>
          <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
            <Button asChild>
              <Link href="/seller/pending-approval">View Approval Status</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/seller/settings">Edit Store Details</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  ) : (
    children
  );

  return (
    <PortalShell
      brand={siteName}
      portalLabel="Seller Workspace"
      brandIcon={Store}
      navItems={visibleNavItems}
      userEmail={user?.email}
      onSignOut={handleSignOut}
    >
      {checkingStatus ? (
        <div className="py-16 text-center text-muted-foreground">Checking seller approval...</div>
      ) : (
        content
      )}
    </PortalShell>
  );
}
