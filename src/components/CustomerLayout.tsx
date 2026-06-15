"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  ChevronDown,
  Heart,
  Headphones,
  LayoutDashboard,
  LogOut,
  MapPin,
  Menu,
  Package,
  ShieldCheck,
  ShoppingCart,
  Store,
  Tag,
  Truck,
  User,
} from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { useAuthContext } from "@/contexts/AuthContext";
import { useMarketplaceSettings } from "@/contexts/MarketplaceSettingsContext";
import { SearchBar } from "@/components/SearchBar";
import { CartDrawer } from "@/components/CartDrawer";
import { amazonStyleCategories, pakistanMajorCities } from "@/lib/marketplace-config";

interface CustomerLayoutProps {
  children: ReactNode;
}

const departmentLinks = amazonStyleCategories.map((category) => ({
  title: category.name,
  description: (category.children ?? []).slice(0, 4).map((child) => child.name).join(", "),
  href: `/categories/${category.slug}`,
}));

export function CustomerLayout({ children }: CustomerLayoutProps) {
  const router = useRouter();
  const { items } = useCart();
  const { user, profile, signOut } = useAuthContext();
  const { siteName, deliveryCity, setDeliveryCity, footerAboutText, footerSections } = useMarketplaceSettings();
  const [menuOpen, setMenuOpen] = useState(false);
  const [cartDrawerOpen, setCartDrawerOpen] = useState(false);
  const secondaryLinks = [
    { label: "Today's Deals", href: "/deals" },
    { label: "New Arrivals", href: "/new-arrivals" },
    { label: "Best Sellers", href: "/best-sellers" },
    { label: "Customer Service", href: "/help" },
    { label: `Sell on ${siteName}`, href: "/seller-info" },
    { label: "Track Order", href: "/track-order" },
  ];

  const handleLogout = async () => {
    await signOut();
    router.push("/login");
  };

  const closeMenu = () => setMenuOpen(false);
  const cartItemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const greeting = profile?.full_name || user?.email || "Sign in";

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
        <header className="sticky top-0 z-50 shadow-sm">
          <div className="bg-[#131921] text-white">
            <div className="container mx-auto px-3">
              <div className="flex min-h-[72px] items-center gap-3 py-3 lg:min-h-[66px] lg:py-0">
                <div className="flex items-center gap-2 lg:hidden">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label="Open menu"
                    aria-expanded={menuOpen}
                    aria-haspopup="dialog"
                    onClick={() => setMenuOpen(true)}
                    className="text-white hover:bg-white/10 hover:text-white"
                  >
                    <Menu className="h-5 w-5" />
                    <span className="sr-only">Open menu</span>
                  </Button>
                </div>

                <Link
                  href="/"
                  className="flex h-12 shrink-0 items-center gap-2 rounded-sm px-2 text-xl font-bold tracking-normal outline-none transition hover:ring-1 hover:ring-white/70"
                >
                  <Store className="h-7 w-7 text-accent" />
                  <span className="hidden sm:inline">{siteName}</span>
                </Link>

                <div className="hidden h-12 shrink-0 items-center gap-2 rounded-sm px-2 text-sm outline-none transition hover:ring-1 hover:ring-white/70 xl:flex">
                  <MapPin className="h-5 w-5 text-white/85" />
                  <label htmlFor="delivery-city-header" className="leading-tight">
                    <span className="block text-xs text-white/70">Deliver to</span>
                    <span className="relative block">
                      <select
                        id="delivery-city-header"
                        value={deliveryCity}
                        onChange={(event) => setDeliveryCity(event.target.value)}
                        className="max-w-28 appearance-none bg-transparent pr-4 font-semibold text-white outline-none"
                      >
                        {pakistanMajorCities.map((city) => (
                          <option key={city} value={city} className="text-foreground">
                            {city}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="pointer-events-none absolute right-0 top-1/2 h-3 w-3 -translate-y-1/2 text-white/80" />
                    </span>
                  </label>
                </div>

                <div className="hidden flex-1 md:block">
                  <SearchBar />
                </div>

                <div className="ml-auto flex shrink-0 items-center gap-1">
                  {user ? (
                    <>
                      <Button
                        variant="ghost"
                        size="sm"
                        asChild
                        className="hidden h-12 rounded-sm px-2 text-white hover:bg-white/10 hover:text-white lg:flex"
                      >
                        <Link href="/account/dashboard" className="flex flex-col items-start leading-tight">
                          <span className="max-w-32 truncate text-xs text-white/75">
                            Hello, {greeting}
                          </span>
                          <span className="flex items-center gap-1 text-sm font-semibold">
                            Account <ChevronDown className="h-3.5 w-3.5" />
                          </span>
                        </Link>
                      </Button>

                      {profile?.role === "admin" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          asChild
                          className="hidden h-12 rounded-sm px-2 text-white hover:bg-white/10 hover:text-white lg:flex"
                        >
                          <Link href="/admin" className="flex flex-col items-start leading-tight">
                            <span className="text-xs text-white/75">Control</span>
                            <span className="flex items-center gap-1 text-sm font-semibold">
                              <LayoutDashboard className="h-4 w-4" /> Admin
                            </span>
                          </Link>
                        </Button>
                      )}

                      {profile?.role === "seller" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          asChild
                          className="hidden h-12 rounded-sm px-2 text-white hover:bg-white/10 hover:text-white lg:flex"
                        >
                          <Link href="/seller" className="flex flex-col items-start leading-tight">
                            <span className="text-xs text-white/75">Seller</span>
                            <span className="flex items-center gap-1 text-sm font-semibold">
                              <Package className="h-4 w-4" /> Dashboard
                            </span>
                          </Link>
                        </Button>
                      )}
                    </>
                  ) : (
                    <Button
                      variant="ghost"
                      size="sm"
                      asChild
                      className="hidden h-12 rounded-sm px-2 text-white hover:bg-white/10 hover:text-white lg:flex"
                    >
                      <Link href="/login" className="flex flex-col items-start leading-tight">
                        <span className="text-xs text-white/75">Hello, sign in</span>
                        <span className="flex items-center gap-1 text-sm font-semibold">
                          Account <ChevronDown className="h-3.5 w-3.5" />
                        </span>
                      </Link>
                    </Button>
                  )}

                  <Button
                    variant="ghost"
                    size="sm"
                    asChild
                    className="hidden h-12 rounded-sm px-2 text-white hover:bg-white/10 hover:text-white lg:flex"
                  >
                    <Link href="/account/orders" className="flex flex-col items-start leading-tight">
                      <span className="text-xs text-white/75">Returns</span>
                      <span className="text-sm font-semibold">& Orders</span>
                    </Link>
                  </Button>

                  <Button
                    variant="ghost"
                    size="icon"
                    asChild
                    className="h-11 text-white hover:bg-white/10 hover:text-white lg:hidden"
                  >
                    <Link href={user ? "/account/dashboard" : "/login"}>
                      <User className="h-5 w-5" />
                      <span className="sr-only">Account</span>
                    </Link>
                  </Button>

                  <Button
                    variant="ghost"
                    size="icon"
                    asChild
                    className="hidden h-11 text-white hover:bg-white/10 hover:text-white sm:inline-flex"
                  >
                    <Link href="/wishlist">
                      <Heart className="h-5 w-5" />
                      <span className="sr-only">Wishlist</span>
                    </Link>
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    className="relative h-12 rounded-sm px-2 text-white hover:bg-white/10 hover:text-white"
                    onClick={() => setCartDrawerOpen(true)}
                  >
                    <ShoppingCart className="h-6 w-6" />
                    {cartItemCount > 0 && (
                      <span className="absolute right-6 top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1 text-xs font-bold text-accent-foreground">
                        {cartItemCount}
                      </span>
                    )}
                    <span className="hidden pl-1 pt-4 text-sm font-semibold sm:inline">Cart</span>
                  </Button>
                </div>
              </div>

              <div className="pb-3 md:hidden">
                <SearchBar compact />
              </div>
            </div>
          </div>

          <div className="border-t border-white/10 bg-[#232f3e] text-white">
            <div className="container mx-auto px-3">
              <nav className="flex h-11 items-center gap-1 overflow-x-auto text-sm">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  aria-label="All departments"
                  aria-expanded={menuOpen}
                  aria-haspopup="dialog"
                  onClick={() => setMenuOpen(true)}
                  className="h-9 shrink-0 gap-2 rounded-sm px-2 font-semibold text-white hover:bg-white/10 hover:text-white"
                >
                  <Menu className="h-4 w-4" />
                  All
                </Button>
                {secondaryLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="flex h-9 shrink-0 items-center rounded-sm px-3 transition hover:ring-1 hover:ring-white/70"
                  >
                    {link.label}
                  </Link>
                ))}
              </nav>
            </div>
          </div>
        </header>

        <SheetContent side="left" className="w-[88vw] overflow-y-auto p-0 sm:max-w-md">
          <div className="bg-[#131921] px-6 py-5 text-white">
            <SheetHeader className="text-left">
              <SheetTitle className="text-white">
                {user ? `Hello, ${greeting}` : "Hello, sign in"}
              </SheetTitle>
              <SheetDescription className="text-white/70">
                Browse departments, orders and seller tools.
              </SheetDescription>
            </SheetHeader>
          </div>

          <div className="space-y-6 p-6">
            <div className="rounded-md border bg-muted/40 p-3">
              <label htmlFor="delivery-city-mobile" className="flex items-center gap-3 text-sm">
                <MapPin className="h-4 w-4 text-accent" />
                <span className="min-w-0 flex-1">
                  <span className="block text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Deliver to
                  </span>
                  <select
                    id="delivery-city-mobile"
                    value={deliveryCity}
                    onChange={(event) => setDeliveryCity(event.target.value)}
                    className="mt-1 h-9 w-full rounded-md border border-input bg-background px-2 text-sm font-semibold outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  >
                    {pakistanMajorCities.map((city) => (
                      <option key={city} value={city}>
                        {city}
                      </option>
                    ))}
                  </select>
                </span>
              </label>
            </div>

            <div>
              <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                Shop by department
              </h3>
              <div className="grid gap-2">
                {departmentLinks.map((department) => (
                  <Link
                    key={department.href}
                    href={department.href}
                    onClick={closeMenu}
                    className="rounded-md border p-3 transition hover:border-accent hover:bg-muted"
                  >
                    <span className="block font-semibold">{department.title}</span>
                    <span className="mt-1 block text-sm text-muted-foreground">
                      {department.description}
                    </span>
                  </Link>
                ))}
              </div>
            </div>

            <div>
              <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                Marketplace
              </h3>
              <div className="grid gap-2 text-sm">
                <Link href="/deals" onClick={closeMenu} className="flex items-center gap-3 rounded-md p-2 hover:bg-muted">
                  <Tag className="h-4 w-4 text-accent" /> Today's Deals
                </Link>
                <Link href="/track-order" onClick={closeMenu} className="flex items-center gap-3 rounded-md p-2 hover:bg-muted">
                  <Truck className="h-4 w-4 text-accent" /> Track Order
                </Link>
                <Link href="/help" onClick={closeMenu} className="flex items-center gap-3 rounded-md p-2 hover:bg-muted">
                  <Headphones className="h-4 w-4 text-accent" /> Customer Service
                </Link>
                <Link href="/seller-info" onClick={closeMenu} className="flex items-center gap-3 rounded-md p-2 hover:bg-muted">
                  <Store className="h-4 w-4 text-accent" /> Sell on {siteName}
                </Link>
                <Link href="/returns" onClick={closeMenu} className="flex items-center gap-3 rounded-md p-2 hover:bg-muted">
                  <ShieldCheck className="h-4 w-4 text-accent" /> Returns & Protection
                </Link>
              </div>
            </div>

            <div className="border-t pt-5">
              {user ? (
                <div className="grid gap-2 text-sm">
                  <Link href="/account/dashboard" onClick={closeMenu} className="rounded-md p-2 hover:bg-muted">
                    Your Account
                  </Link>
                  <Link href="/account/orders" onClick={closeMenu} className="rounded-md p-2 hover:bg-muted">
                    Your Orders
                  </Link>
                  {profile?.role === "admin" && (
                    <Link href="/admin" onClick={closeMenu} className="rounded-md p-2 hover:bg-muted">
                      Admin Panel
                    </Link>
                  )}
                  {profile?.role === "seller" && (
                    <Link href="/seller" onClick={closeMenu} className="rounded-md p-2 hover:bg-muted">
                      Seller Dashboard
                    </Link>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      closeMenu();
                      handleLogout();
                    }}
                    className="flex items-center gap-2 rounded-md p-2 text-left hover:bg-muted"
                  >
                    <LogOut className="h-4 w-4" /> Logout
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <Button asChild className="bg-accent text-accent-foreground hover:bg-accent/90">
                    <Link href="/login" onClick={closeMenu}>
                      Login
                    </Link>
                  </Button>
                  <Button asChild variant="outline">
                    <Link href="/register" onClick={closeMenu}>
                      Register
                    </Link>
                  </Button>
                </div>
              )}
            </div>
          </div>
        </SheetContent>
      </Sheet>

      <CartDrawer open={cartDrawerOpen} onClose={() => setCartDrawerOpen(false)} />

      <main className="flex-1">{children}</main>

      <footer className="mt-auto bg-[#131921] text-white">
        <button
          type="button"
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="block w-full bg-[#37475a] px-4 py-3 text-center text-sm font-medium text-white transition hover:bg-[#42556d]"
        >
          Back to top
        </button>

        <div className="bg-[#232f3e]">
          <div className="container mx-auto px-4 py-10">
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
              {footerSections.map((section) => (
                <div key={section.title}>
                  <h3 className="mb-4 font-semibold">{section.title}</h3>
                  <ul className="space-y-2 text-sm">
                    {section.links.map((link) => (
                      <li key={`${section.title}-${link.href}-${link.label}`}>
                        <Link
                          href={link.href}
                          className="text-white/75 transition-colors hover:text-white hover:underline"
                        >
                          {link.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="border-t border-white/10">
          <div className="container mx-auto px-4 py-8">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <Link href="/" className="flex items-center gap-2 text-xl font-bold">
                <Store className="h-7 w-7 text-accent" />
                {siteName}
              </Link>
              <p className="max-w-2xl text-sm text-white/70">{footerAboutText}</p>
            </div>
            <div className="mt-6 flex flex-wrap gap-4 border-t border-white/10 pt-5 text-xs text-white/60">
              <Link href="/privacy" className="hover:text-white">Privacy Notice</Link>
              <Link href="/terms" className="hover:text-white">Conditions of Use</Link>
              <Link href="/help" className="hover:text-white">Help</Link>
              <span>&copy; 2026 {siteName}. All rights reserved.</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
