"use client";

import { ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { Button } from "@/components/ui/button";
import { 
  LayoutDashboard, 
  Users, 
  Store, 
  Package, 
  ShoppingCart, 
  Tag, 
  CreditCard, 
  DollarSign, 
  BarChart3, 
  Settings,
  LogOut,
  Menu,
  X,
  Shield,
  Grid3x3,
  MessageSquare
} from "lucide-react";
import { useState } from "react";
import { useAuthContext } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

interface AdminLayoutProps {
  children: ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const router = useRouter();
  const { signOut, user } = useAuthContext();
  const { toast } = useToast();

  const handleLogout = async () => {
    await signOut();
    toast({
      title: "Logged out",
      description: "You have been successfully logged out.",
    });
    router.push("/admin/login");
  };

  const navItems = [
    { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
    { href: "/admin/users", label: "Users", icon: Users },
    { href: "/admin/sellers", label: "Sellers", icon: Store },
    { href: "/admin/products", label: "Products", icon: Package },
    { href: "/admin/categories", label: "Categories", icon: Grid3x3 },
    { href: "/admin/orders", label: "Orders", icon: ShoppingCart },
    { href: "/admin/payouts", label: "Payouts", icon: DollarSign },
    { href: "/admin/support", label: "Support", icon: MessageSquare },
    { href: "/admin/settings", label: "Settings", icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b border-border bg-card">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/admin" className="flex items-center gap-2">
              <Shield className="h-6 w-6 text-accent" />
              <span className="font-bold text-lg">Admin Panel</span>
            </Link>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">{user?.email}</span>
            <Button variant="outline" size="sm" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <div className="flex">
        <aside className="w-64 border-r border-border bg-card min-h-[calc(100vh-4rem)] sticky top-16">
          <nav className="p-4 space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = router.pathname === item.href;

              return (
                <Link key={item.href} href={item.href}>
                  <Button
                    variant={isActive ? "secondary" : "ghost"}
                    className="w-full justify-start"
                  >
                    <Icon className="h-4 w-4 mr-3" />
                    {item.label}
                  </Button>
                </Link>
              );
            })}
          </nav>
        </aside>

        <main className="flex-1 p-8">{children}</main>
      </div>
    </div>
  );
}