"use client";

import Link from "next/link";
import { Search, ShoppingCart, User, Menu, Heart, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useState } from "react";

export function CustomerLayout({ children }: { children: React.ReactNode }) {
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-50 bg-card border-b border-border">
        <div className="container">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-6">
              <Link href="/" className="font-bold text-xl font-serif">
                Marketplace
              </Link>
              
              <nav className="hidden lg:flex items-center gap-1">
                <Link href="/categories" className="px-3 py-2 text-sm font-medium hover:bg-muted rounded-md transition-colors">
                  Categories
                </Link>
                <Link href="/deals" className="px-3 py-2 text-sm font-medium hover:bg-muted rounded-md transition-colors">
                  Deals
                </Link>
                <Link href="/sellers" className="px-3 py-2 text-sm font-medium hover:bg-muted rounded-md transition-colors">
                  Sellers
                </Link>
              </nav>
            </div>

            <div className="hidden md:flex flex-1 max-w-xl mx-8">
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search products..."
                  className="pl-9 pr-4"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setIsSearchOpen(!isSearchOpen)}>
                <Search className="h-5 w-5" />
              </Button>

              <Link href="/wishlist">
                <Button variant="ghost" size="icon" className="hidden sm:flex">
                  <Heart className="h-5 w-5" />
                </Button>
              </Link>

              <Link href="/cart">
                <Button variant="ghost" size="icon" className="relative">
                  <ShoppingCart className="h-5 w-5" />
                  <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-accent text-accent-foreground text-xs flex items-center justify-center font-mono">
                    0
                  </span>
                </Button>
              </Link>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <User className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuItem asChild>
                    <Link href="/account" className="cursor-pointer">
                      <User className="mr-2 h-4 w-4" />
                      My Account
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/orders" className="cursor-pointer">
                      <Package className="mr-2 h-4 w-4" />
                      Orders
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/wishlist" className="cursor-pointer">
                      <Heart className="mr-2 h-4 w-4" />
                      Wishlist
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/auth/login" className="cursor-pointer">
                      Sign In
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/auth/register" className="cursor-pointer">
                      Register
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="lg:hidden">
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left">
                  <nav className="flex flex-col gap-4 mt-8">
                    <Link href="/categories" className="text-lg font-medium hover:text-accent transition-colors">
                      Categories
                    </Link>
                    <Link href="/deals" className="text-lg font-medium hover:text-accent transition-colors">
                      Deals
                    </Link>
                    <Link href="/sellers" className="text-lg font-medium hover:text-accent transition-colors">
                      Sellers
                    </Link>
                  </nav>
                </SheetContent>
              </Sheet>
            </div>
          </div>

          {isSearchOpen && (
            <div className="md:hidden pb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search products..."
                  className="pl-9 pr-4"
                  autoFocus
                />
              </div>
            </div>
          )}
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="bg-primary text-primary-foreground mt-16">
        <div className="container py-12">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div>
              <h3 className="font-bold text-lg mb-4 font-serif">Marketplace</h3>
              <p className="text-sm text-primary-foreground/80">
                Your trusted multi-vendor marketplace. Quality products from verified sellers.
              </p>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Shop</h4>
              <ul className="space-y-2 text-sm text-primary-foreground/80">
                <li><Link href="/categories" className="hover:text-primary-foreground transition-colors">All Categories</Link></li>
                <li><Link href="/deals" className="hover:text-primary-foreground transition-colors">Today's Deals</Link></li>
                <li><Link href="/sellers" className="hover:text-primary-foreground transition-colors">Featured Sellers</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Customer Service</h4>
              <ul className="space-y-2 text-sm text-primary-foreground/80">
                <li><Link href="/help" className="hover:text-primary-foreground transition-colors">Help Center</Link></li>
                <li><Link href="/returns" className="hover:text-primary-foreground transition-colors">Returns & Refunds</Link></li>
                <li><Link href="/shipping" className="hover:text-primary-foreground transition-colors">Shipping Info</Link></li>
                <li><Link href="/contact" className="hover:text-primary-foreground transition-colors">Contact Us</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Become a Seller</h4>
              <ul className="space-y-2 text-sm text-primary-foreground/80">
                <li><Link href="/seller/register" className="hover:text-primary-foreground transition-colors">Start Selling</Link></li>
                <li><Link href="/seller/login" className="hover:text-primary-foreground transition-colors">Seller Login</Link></li>
                <li><Link href="/seller-info" className="hover:text-primary-foreground transition-colors">Seller Information</Link></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-primary-foreground/20 mt-8 pt-8 text-center text-sm text-primary-foreground/80">
            <p>© 2026 Marketplace. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}