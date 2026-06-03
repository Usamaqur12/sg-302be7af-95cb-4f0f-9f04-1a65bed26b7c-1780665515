"use client";

import Link from "next/link";
import { Search, ShoppingCart, User, Menu, Heart, Package, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useState } from "react";
import { useCart } from "@/contexts/CartContext";

const categories = [
  { name: "Electronics", slug: "electronics", subcategories: ["Phones", "Laptops", "Audio", "Cameras"] },
  { name: "Fashion", slug: "fashion", subcategories: ["Men's Clothing", "Women's Clothing", "Shoes", "Accessories"] },
  { name: "Home & Garden", slug: "home-garden", subcategories: ["Furniture", "Kitchen", "Decor", "Garden Tools"] },
  { name: "Sports & Outdoors", slug: "sports-outdoors", subcategories: ["Fitness", "Camping", "Sports Equipment", "Outdoor Gear"] },
  { name: "Books & Media", slug: "books-media", subcategories: ["Books", "Movies", "Music", "Games"] },
  { name: "Toys & Kids", slug: "toys-kids", subcategories: ["Toys", "Baby Products", "Kids Fashion", "School Supplies"] },
];

export function CustomerLayout({ children }: { children: React.ReactNode }) {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const { items } = useCart();

  return (
    <div className="min-h-screen flex flex-col">
      {/* Top Banner */}
      <div className="bg-primary text-primary-foreground text-center py-2 text-sm">
        <div className="container">
          <span>Free shipping on orders over $50 • 30-day money-back guarantee</span>
        </div>
      </div>

      {/* Main Header */}
      <header className="sticky top-0 z-50 bg-card border-b border-border shadow-sm">
        <div className="container">
          <div className="flex items-center justify-between h-16 gap-4">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2">
              <div className="h-10 w-10 bg-accent rounded-lg flex items-center justify-center">
                <span className="text-accent-foreground font-bold text-xl">M</span>
              </div>
              <div className="hidden sm:block">
                <span className="font-bold text-xl font-serif">Marketplace</span>
                <p className="text-xs text-muted-foreground">Multi-Vendor Hub</p>
              </div>
            </Link>

            {/* Search Bar - Desktop */}
            <div className="hidden lg:flex flex-1 max-w-2xl">
              <div className="relative w-full flex">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="rounded-r-none border-r-0 min-w-[120px]">
                      <span className="text-sm">All</span>
                      <ChevronDown className="ml-2 h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-48">
                    {categories.map((cat) => (
                      <DropdownMenuItem key={cat.slug} asChild>
                        <Link href={`/categories/${cat.slug}`} className="cursor-pointer">
                          {cat.name}
                        </Link>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
                <div className="relative flex-1">
                  <Input
                    type="search"
                    placeholder="Search for products, brands, and more..."
                    className="rounded-l-none pr-12"
                  />
                  <Button size="sm" className="absolute right-0 top-0 h-full rounded-l-none bg-accent hover:bg-accent/90">
                    <Search className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Right Section */}
            <div className="flex items-center gap-2">
              {/* Become a Seller - Desktop */}
              <Link href="/seller/register" className="hidden xl:block">
                <Button variant="outline" size="sm" className="border-accent text-accent hover:bg-accent hover:text-accent-foreground">
                  Become a Seller
                </Button>
              </Link>

              {/* Search Icon - Mobile */}
              <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setIsSearchOpen(!isSearchOpen)}>
                <Search className="h-5 w-5" />
              </Button>

              {/* Wishlist */}
              <Link href="/wishlist">
                <Button variant="ghost" size="icon" className="hidden sm:flex">
                  <Heart className="h-5 w-5" />
                </Button>
              </Link>

              {/* Cart */}
              <Link href="/cart">
                <Button variant="ghost" size="icon" className="relative">
                  <ShoppingCart className="h-5 w-5" />
                  {items.length > 0 && (
                    <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-accent text-accent-foreground text-xs flex items-center justify-center font-mono font-semibold">
                      {items.length}
                    </span>
                  )}
                </Button>
              </Link>

              {/* User Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <User className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuItem asChild>
                    <Link href="/account/dashboard" className="cursor-pointer">
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
                      Create Account
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Mobile Menu */}
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="lg:hidden">
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-80">
                  <nav className="flex flex-col gap-6 mt-8">
                    <Link href="/seller/register" className="text-lg font-semibold text-accent">
                      Become a Seller
                    </Link>
                    <div>
                      <h3 className="font-semibold mb-3">Categories</h3>
                      <div className="space-y-2">
                        {categories.map((cat) => (
                          <Link
                            key={cat.slug}
                            href={`/categories/${cat.slug}`}
                            className="block text-sm hover:text-accent transition-colors py-1"
                          >
                            {cat.name}
                          </Link>
                        ))}
                      </div>
                    </div>
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

          {/* Mobile Search */}
          {isSearchOpen && (
            <div className="lg:hidden pb-4">
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

        {/* Category Navigation - Desktop */}
        <div className="hidden lg:block border-t border-border bg-muted/30">
          <div className="container">
            <NavigationMenu>
              <NavigationMenuList className="space-x-1">
                {categories.map((category) => (
                  <NavigationMenuItem key={category.slug}>
                    <NavigationMenuTrigger className="h-10 text-sm">
                      {category.name}
                    </NavigationMenuTrigger>
                    <NavigationMenuContent>
                      <div className="grid w-[400px] gap-3 p-4">
                        <Link
                          href={`/categories/${category.slug}`}
                          className="font-semibold text-accent hover:underline"
                        >
                          Shop All {category.name}
                        </Link>
                        <div className="grid grid-cols-2 gap-2">
                          {category.subcategories.map((sub) => (
                            <NavigationMenuLink key={sub} asChild>
                              <Link
                                href={`/categories/${category.slug}/${sub.toLowerCase().replace(/\s+/g, '-')}`}
                                className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground text-sm"
                              >
                                {sub}
                              </Link>
                            </NavigationMenuLink>
                          ))}
                        </div>
                      </div>
                    </NavigationMenuContent>
                  </NavigationMenuItem>
                ))}
                <NavigationMenuItem>
                  <Link href="/deals" className="inline-flex h-10 w-max items-center justify-center rounded-md bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground">
                    Today's Deals
                  </Link>
                </NavigationMenuItem>
              </NavigationMenuList>
            </NavigationMenu>
          </div>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      {/* Footer */}
      <footer className="bg-primary text-primary-foreground mt-16">
        <div className="container py-12">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="h-10 w-10 bg-accent rounded-lg flex items-center justify-center">
                  <span className="text-accent-foreground font-bold text-xl">M</span>
                </div>
                <span className="font-bold text-xl font-serif">Marketplace</span>
              </div>
              <p className="text-sm text-primary-foreground/80 mb-4">
                Your trusted multi-vendor marketplace. Quality products from verified sellers worldwide.
              </p>
              <div className="flex gap-2">
                <a href="#" className="h-9 w-9 rounded-full bg-primary-foreground/10 hover:bg-primary-foreground/20 flex items-center justify-center transition-colors">
                  <span className="sr-only">Facebook</span>
                  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                </a>
                <a href="#" className="h-9 w-9 rounded-full bg-primary-foreground/10 hover:bg-primary-foreground/20 flex items-center justify-center transition-colors">
                  <span className="sr-only">Twitter</span>
                  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/></svg>
                </a>
                <a href="#" className="h-9 w-9 rounded-full bg-primary-foreground/10 hover:bg-primary-foreground/20 flex items-center justify-center transition-colors">
                  <span className="sr-only">Instagram</span>
                  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0C8.74 0 8.333.015 7.053.072 5.775.132 4.905.333 4.14.63c-.789.306-1.459.717-2.126 1.384S.935 3.35.63 4.14C.333 4.905.131 5.775.072 7.053.012 8.333 0 8.74 0 12s.015 3.667.072 4.947c.06 1.277.261 2.148.558 2.913.306.788.717 1.459 1.384 2.126.667.666 1.336 1.079 2.126 1.384.766.296 1.636.499 2.913.558C8.333 23.988 8.74 24 12 24s3.667-.015 4.947-.072c1.277-.06 2.148-.262 2.913-.558.788-.306 1.459-.718 2.126-1.384.666-.667 1.079-1.335 1.384-2.126.296-.765.499-1.636.558-2.913.06-1.28.072-1.687.072-4.947s-.015-3.667-.072-4.947c-.06-1.277-.262-2.149-.558-2.913-.306-.789-.718-1.459-1.384-2.126C21.319 1.347 20.651.935 19.86.63c-.765-.297-1.636-.499-2.913-.558C15.667.012 15.26 0 12 0zm0 2.16c3.203 0 3.585.016 4.85.071 1.17.055 1.805.249 2.227.415.562.217.96.477 1.382.896.419.42.679.819.896 1.381.164.422.36 1.057.413 2.227.057 1.266.07 1.646.07 4.85s-.015 3.585-.074 4.85c-.061 1.17-.256 1.805-.421 2.227-.224.562-.479.96-.899 1.382-.419.419-.824.679-1.38.896-.42.164-1.065.36-2.235.413-1.274.057-1.649.07-4.859.07-3.211 0-3.586-.015-4.859-.074-1.171-.061-1.816-.256-2.236-.421-.569-.224-.96-.479-1.379-.899-.421-.419-.69-.824-.9-1.38-.165-.42-.359-1.065-.42-2.235-.045-1.26-.061-1.649-.061-4.844 0-3.196.016-3.586.061-4.861.061-1.17.255-1.814.42-2.234.21-.57.479-.96.9-1.381.419-.419.81-.689 1.379-.898.42-.166 1.051-.361 2.221-.421 1.275-.045 1.65-.06 4.859-.06l.045.03zm0 3.678c-3.405 0-6.162 2.76-6.162 6.162 0 3.405 2.76 6.162 6.162 6.162 3.405 0 6.162-2.76 6.162-6.162 0-3.405-2.76-6.162-6.162-6.162zM12 16c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4zm7.846-10.405c0 .795-.646 1.44-1.44 1.44-.795 0-1.44-.646-1.44-1.44 0-.794.646-1.439 1.44-1.439.793-.001 1.44.645 1.44 1.439z"/></svg>
                </a>
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Shop</h4>
              <ul className="space-y-2 text-sm text-primary-foreground/80">
                <li><Link href="/categories" className="hover:text-primary-foreground transition-colors">All Categories</Link></li>
                <li><Link href="/deals" className="hover:text-primary-foreground transition-colors">Today's Deals</Link></li>
                <li><Link href="/sellers" className="hover:text-primary-foreground transition-colors">Featured Sellers</Link></li>
                <li><Link href="/new-arrivals" className="hover:text-primary-foreground transition-colors">New Arrivals</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Customer Service</h4>
              <ul className="space-y-2 text-sm text-primary-foreground/80">
                <li><Link href="/help" className="hover:text-primary-foreground transition-colors">Help Center</Link></li>
                <li><Link href="/returns" className="hover:text-primary-foreground transition-colors">Returns & Refunds</Link></li>
                <li><Link href="/shipping" className="hover:text-primary-foreground transition-colors">Shipping Info</Link></li>
                <li><Link href="/track-order" className="hover:text-primary-foreground transition-colors">Track Order</Link></li>
                <li><Link href="/contact" className="hover:text-primary-foreground transition-colors">Contact Us</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Sell With Us</h4>
              <ul className="space-y-2 text-sm text-primary-foreground/80">
                <li><Link href="/seller/register" className="hover:text-primary-foreground transition-colors">Start Selling</Link></li>
                <li><Link href="/seller" className="hover:text-primary-foreground transition-colors">Seller Dashboard</Link></li>
                <li><Link href="/seller-info" className="hover:text-primary-foreground transition-colors">Seller Guidelines</Link></li>
                <li><Link href="/seller-fees" className="hover:text-primary-foreground transition-colors">Fees & Pricing</Link></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-primary-foreground/20 pt-8">
            <div className="grid md:grid-cols-2 gap-4 text-sm text-primary-foreground/80">
              <div>
                <p>© 2026 Marketplace. All rights reserved.</p>
              </div>
              <div className="md:text-right">
                <Link href="/privacy" className="hover:text-primary-foreground transition-colors mr-4">
                  Privacy Policy
                </Link>
                <Link href="/terms" className="hover:text-primary-foreground transition-colors mr-4">
                  Terms of Service
                </Link>
                <Link href="/cookies" className="hover:text-primary-foreground transition-colors">
                  Cookie Policy
                </Link>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}