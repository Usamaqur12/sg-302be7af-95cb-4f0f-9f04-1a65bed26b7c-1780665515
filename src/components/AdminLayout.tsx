"use client";

import type { ReactNode } from "react";
import { useRouter } from "next/router";
import {
  BarChart3,
  CreditCard,
  DollarSign,
  Grid3x3,
  LayoutDashboard,
  LayoutTemplate,
  Megaphone,
  MessageSquare,
  Package,
  BadgePercent,
  RefreshCw,
  Settings,
  Shield,
  SlidersHorizontal,
  ShoppingCart,
  Store,
  Users,
} from "lucide-react";
import { PortalShell, type PortalNavItem } from "@/components/PortalShell";
import { useAuthContext } from "@/contexts/AuthContext";
import { useMarketplaceSettings } from "@/contexts/MarketplaceSettingsContext";
import { useToast } from "@/hooks/use-toast";

const navItems: PortalNavItem[] = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/sellers", label: "Sellers", icon: Store },
  { href: "/admin/seller-center", label: "Seller Center", icon: SlidersHorizontal },
  { href: "/admin/marketing", label: "Marketing", icon: Megaphone },
  { href: "/admin/promotions", label: "Promotions", icon: BadgePercent },
  { href: "/admin/products", label: "Products", icon: Package },
  { href: "/admin/categories", label: "Categories", icon: Grid3x3 },
  { href: "/admin/cms", label: "CMS", icon: LayoutTemplate },
  { href: "/admin/orders", label: "Orders", icon: ShoppingCart },
  { href: "/admin/returns", label: "Returns", icon: RefreshCw },
  { href: "/admin/payments", label: "Payments", icon: CreditCard },
  { href: "/admin/payouts", label: "Payouts", icon: DollarSign },
  { href: "/admin/reports", label: "Reports", icon: BarChart3 },
  { href: "/admin/support", label: "Support", icon: MessageSquare },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

const staffNavHrefs = {
  manager: new Set([
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
  ]),
  warehouse: new Set([
    "/admin",
    "/admin/products",
    "/admin/categories",
    "/admin/orders",
    "/admin/returns",
    "/admin/support",
  ]),
};

export function AdminLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { signOut, user } = useAuthContext();
  const { siteName } = useMarketplaceSettings();
  const { toast } = useToast();

  const handleSignOut = async () => {
    await signOut();
    toast({ title: "Signed out", description: "Your admin session has ended." });
    await router.push("/admin/login");
  };

  const visibleNavItems = user?.role === "manager"
    ? navItems.filter((item) => staffNavHrefs.manager.has(item.href))
    : user?.role === "warehouse"
      ? navItems.filter((item) => staffNavHrefs.warehouse.has(item.href))
      : navItems;

  return (
    <PortalShell
      brand={siteName}
      portalLabel="Admin Console"
      brandIcon={Shield}
      navItems={visibleNavItems}
      userEmail={user?.email}
      onSignOut={handleSignOut}
    >
      {children}
    </PortalShell>
  );
}
