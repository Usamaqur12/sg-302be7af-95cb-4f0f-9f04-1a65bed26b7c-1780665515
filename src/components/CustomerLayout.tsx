"use client";

import { ReactNode, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  ShoppingCart,
  User,
  Heart,
  Menu,
  Package,
  LogOut,
  LayoutDashboard,
  Store
} from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { useAuthContext } from "@/contexts/AuthContext";
import { SearchBar } from "@/components/SearchBar";
import { CartDrawer } from "@/components/CartDrawer";

interface CustomerLayoutProps {
  children: ReactNode;
}

export function CustomerLayout({ children }: CustomerLayoutProps) {
  const router = useRouter();
  const { items } = useCart();
  const { user, profile, signOut } = useAuthContext();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [cartDrawerOpen, setCartDrawerOpen] = useState(false);

  const handleLogout = async () => {
    await signOut();
    router.push("/login");
  };

  const cartItemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="min-h-screen flex flex-col">
      {/* Top Header */}
      <div className="border-b bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-10 text-sm">
            <div className="flex items-center gap-6">
              <Link href="/help" className="text-muted-foreground hover:text-foreground transition-colors">
                Help
              </Link>
              <Link href="/track-order" className="text-muted-foreground hover:text-foreground transition-colors">
                Track Order
              </Link>
            </div>
            <div className="flex items-center gap-6">
              {user ? (
                <>
                  <span className="text-muted-foreground hidden sm:inline">
                    Hi, {profile?.full_name || user.email}
                  </span>
                  <button
                    onClick={handleLogout}
                    className="text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
                  >
                    <LogOut className="h-3.5 w-3.5" />
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link href="/login" className="text-muted-foreground hover:text-foreground transition-colors">
                    Login
                  </Link>
                  <Link href="/register" className="text-muted-foreground hover:text-foreground transition-colors">
                    Register
                  </Link>
                </>
              )}
              <Link href="/seller-info" className="text-muted-foreground hover:text-accent transition-colors font-medium">
                Become a Seller
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Main Header */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-4 h-16">
            {/* Mobile Menu */}
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild className="lg:hidden">
                <Button variant="ghost" size="icon">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left">
                <nav className="flex flex-col gap-4 mt-8">
                  <Link
                    href="/"
                    className="text-lg font-medium hover:text-accent transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Home
                  </Link>
                  <Link
                    href="/categories"
                    className="text-lg font-medium hover:text-accent transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Categories
                  </Link>
                  <Link
                    href="/deals"
                    className="text-lg font-medium hover:text-accent transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Deals
                  </Link>
                  <Link
                    href="/sellers"
                    className="text-lg font-medium hover:text-accent transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Sellers
                  </Link>
                  <Link
                    href="/new-arrivals"
                    className="text-lg font-medium hover:text-accent transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    New Arrivals
                  </Link>
                </nav>
              </SheetContent>
            </Sheet>

            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 font-bold text-xl">
              <Store className="h-6 w-6 text-accent" />
              <span className="hidden sm:inline">Marketplace</span>
            </Link>

            {/* Search Bar - Desktop & Tablet */}
            <div className="hidden md:flex flex-1 max-w-2xl mx-4">
              <SearchBar />
            </div>

            {/* Right Actions */}
            <div className="flex items-center gap-2 ml-auto">
              {user ? (
                <>
                  {profile?.role === "admin" && (
                    <Button variant="ghost" size="sm" asChild className="hidden lg:flex">
                      <Link href="/admin">
                        <LayoutDashboard className="mr-2 h-4 w-4" />
                        Admin
                      </Link>
                    </Button>
                  )}
                  {profile?.role === "seller" && (
                    <Button variant="ghost" size="sm" asChild className="hidden lg:flex">
                      <Link href="/seller">
                        <Package className="mr-2 h-4 w-4" />
                        Dashboard
                      </Link>
                    </Button>
                  )}
                  <Button variant="ghost" size="sm" asChild className="hidden lg:flex">
                    <Link href="/account/dashboard">
                      <User className="mr-2 h-4 w-4" />
                      Account
                    </Link>
                  </Button>
                  <Button variant="ghost" size="icon" asChild className="lg:hidden">
                    <Link href="/account/dashboard">
                      <User className="h-5 w-5" />
                    </Link>
                  </Button>
                </>
              ) : (
                <Button variant="ghost" size="icon" asChild className="lg:hidden">
                  <Link href="/login">
                    <User className="h-5 w-5" />
                  </Link>
                </Button>
              )}

              <Button variant="ghost" size="icon" asChild>
                <Link href="/wishlist">
                  <Heart className="h-5 w-5" />
                </Link>
              </Button>

              <Button 
                variant="ghost" 
                size="icon" 
                className="relative"
                onClick={() => setCartDrawerOpen(true)}
              >
                <ShoppingCart className="h-5 w-5" />
                {cartItemCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-accent text-accent-foreground text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                    {cartItemCount}
                  </span>
                )}
              </Button>
            </div>
          </div>

          {/* Mobile Search - Below Header */}
          <div className="md:hidden pb-3">
            <SearchBar />
          </div>
        </div>

        {/* Desktop Navigation */}
        <div className="hidden lg:block border-t">
          <div className="container mx-auto px-4">
            <nav className="flex items-center gap-8 h-12">
              <Link
                href="/categories"
                className="text-sm font-medium hover:text-accent transition-colors"
              >
                Categories
              </Link>
              <Link
                href="/deals"
                className="text-sm font-medium hover:text-accent transition-colors"
              >
                Deals
              </Link>
              <Link
                href="/sellers"
                className="text-sm font-medium hover:text-accent transition-colors"
              >
                Sellers
              </Link>
              <Link
                href="/new-arrivals"
                className="text-sm font-medium hover:text-accent transition-colors"
              >
                New Arrivals
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Cart Drawer */}
      <CartDrawer open={cartDrawerOpen} onClose={() => setCartDrawerOpen(false)} />

      {/* Main Content */}
      <main className="flex-1">{children}</main>

      {/* Footer */}
      <footer className="border-t bg-muted/30 mt-auto">
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div>
              <h3 className="font-semibold mb-4">Shop</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link href="/categories" className="text-muted-foreground hover:text-foreground transition-colors">
                    All Categories
                  </Link>
                </li>
                <li>
                  <Link href="/deals" className="text-muted-foreground hover:text-foreground transition-colors">
                    Today's Deals
                  </Link>
                </li>
                <li>
                  <Link href="/new-arrivals" className="text-muted-foreground hover:text-foreground transition-colors">
                    New Arrivals
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Help</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link href="/help" className="text-muted-foreground hover:text-foreground transition-colors">
                    Help Center
                  </Link>
                </li>
                <li>
                  <Link href="/track-order" className="text-muted-foreground hover:text-foreground transition-colors">
                    Track Order
                  </Link>
                </li>
                <li>
                  <Link href="/returns" className="text-muted-foreground hover:text-foreground transition-colors">
                    Returns
                  </Link>
                </li>
                <li>
                  <Link href="/shipping" className="text-muted-foreground hover:text-foreground transition-colors">
                    Shipping Info
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Sell</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link href="/seller-info" className="text-muted-foreground hover:text-foreground transition-colors">
                    Become a Seller
                  </Link>
                </li>
                <li>
                  <Link href="/seller-fees" className="text-muted-foreground hover:text-foreground transition-colors">
                    Seller Fees
                  </Link>
                </li>
                <li>
                  <Link href="/seller/guidelines" className="text-muted-foreground hover:text-foreground transition-colors">
                    Seller Guidelines
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Company</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link href="/contact" className="text-muted-foreground hover:text-foreground transition-colors">
                    Contact Us
                  </Link>
                </li>
                <li>
                  <Link href="/privacy" className="text-muted-foreground hover:text-foreground transition-colors">
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link href="/terms" className="text-muted-foreground hover:text-foreground transition-colors">
                    Terms of Service
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t mt-8 pt-8 text-center text-sm text-muted-foreground">
            <p>&copy; 2026 Marketplace. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}