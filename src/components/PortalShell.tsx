"use client";

import Link from "next/link";
import { useRouter } from "next/router";
import type { LucideIcon } from "lucide-react";
import { ChevronDown, ChevronRight, ExternalLink, LogOut, Menu } from "lucide-react";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

export interface PortalNavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  children?: Array<{
    href: string;
    label: string;
  }>;
}

interface PortalShellProps {
  children: ReactNode;
  brand: string;
  portalLabel: string;
  brandIcon: LucideIcon;
  navItems: PortalNavItem[];
  userEmail?: string;
  onSignOut: () => void;
}

export function PortalShell({
  children,
  brand,
  portalLabel,
  brandIcon: BrandIcon,
  navItems,
  userEmail,
  onSignOut,
}: PortalShellProps) {
  const router = useRouter();
  const currentPath = router.asPath.split("#")[0];
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});

  const childActive = (href: string) => {
    const [path] = href.split("?");
    return currentPath === href || (!href.includes("?") && router.pathname === path);
  };

  const itemActive = (item: PortalNavItem) =>
    item.href === router.pathname ||
    (item.href !== "/admin" && item.href !== "/seller" && router.pathname.startsWith(`${item.href}/`)) ||
    Boolean(item.children?.some((child) => childActive(child.href)));

  const activeItem = navItems.find(itemActive) ?? navItems[0];

  useEffect(() => {
    if (!activeItem?.children?.length) return;
    setOpenGroups((current) => ({ ...current, [activeItem.href]: true }));
  }, [activeItem?.href, activeItem?.children?.length]);

  const navigation = (mobile = false) => (
    <nav className="space-y-1">
      {navItems.map((item) => {
        const Icon = item.icon;
        const active = itemActive(item);
        const hasChildren = Boolean(item.children?.length);
        const groupOpen = openGroups[item.href] ?? active;

        const navigationLink = (
          <Link
            href={item.href}
            title={item.label}
            className={cn(
              "flex h-10 items-center gap-3 rounded-md px-3 text-sm font-medium transition-colors",
              mobile
                ? active
                  ? "bg-primary text-primary-foreground"
                  : "text-foreground hover:bg-muted"
                : active
                  ? "bg-accent text-accent-foreground"
                  : "text-primary-foreground/75 hover:bg-primary-foreground/10 hover:text-primary-foreground"
            )}
          >
            <Icon className="h-4 w-4 shrink-0" />
            <span>{item.label}</span>
          </Link>
        );

        const navigationTrigger = hasChildren ? (
          <CollapsibleTrigger asChild>
            <button
              type="button"
              title={item.label}
              className={cn(
                "flex h-10 w-full items-center gap-3 rounded-md px-3 text-left text-sm font-medium transition-colors",
                mobile
                  ? active
                    ? "bg-primary text-primary-foreground"
                    : "text-foreground hover:bg-muted"
                  : active
                    ? "bg-accent text-accent-foreground"
                    : "text-primary-foreground/75 hover:bg-primary-foreground/10 hover:text-primary-foreground"
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span className="min-w-0 flex-1 truncate">{item.label}</span>
              <ChevronDown className={cn("h-4 w-4 shrink-0 transition-transform", groupOpen && "rotate-180")} />
            </button>
          </CollapsibleTrigger>
        ) : (
          navigationLink
        );

        const childLinks = hasChildren ? (
          <div className={cn("space-y-1 pb-2", mobile ? "pl-7" : "pl-9")}>
            {item.children.map((child) => {
              const activeChild = childActive(child.href);
              const childLink = (
                <Link
                  href={child.href}
                  title={child.label}
                  className={cn(
                    "flex min-h-8 items-center rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                    mobile
                      ? activeChild
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                      : activeChild
                        ? "bg-primary-foreground/15 text-primary-foreground"
                        : "text-primary-foreground/60 hover:bg-primary-foreground/10 hover:text-primary-foreground"
                  )}
                >
                  <span className="truncate">{child.label}</span>
                </Link>
              );

              return mobile ? (
                <SheetClose key={child.href} asChild>{childLink}</SheetClose>
              ) : (
                <span key={child.href}>{childLink}</span>
              );
            })}
          </div>
        ) : null;

        const navGroup = hasChildren ? (
          <Collapsible
            open={groupOpen}
            onOpenChange={(open) => setOpenGroups((current) => ({ ...current, [item.href]: open }))}
          >
            {navigationTrigger}
            <CollapsibleContent>{childLinks}</CollapsibleContent>
          </Collapsible>
        ) : (
          navigationTrigger
        );

        return mobile ? (
          <div key={item.href}>
            {hasChildren ? navGroup : <SheetClose asChild>{navigationLink}</SheetClose>}
          </div>
        ) : (
          <div key={item.href}>{navGroup}</div>
        );
      })}
    </nav>
  );

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 h-16 border-b bg-card/95 backdrop-blur">
        <div className="flex h-full items-center gap-3 px-4 sm:px-6">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden" title="Open navigation">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 p-5">
              <SheetHeader className="mb-6 text-left">
                <SheetTitle className="flex items-center gap-2">
                  <BrandIcon className="h-5 w-5 text-accent" />
                  {brand}
                </SheetTitle>
              </SheetHeader>
              {navigation(true)}
            </SheetContent>
          </Sheet>

          <Link href={navItems[0].href} className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <BrandIcon className="h-5 w-5" />
            </span>
            <div className="hidden sm:block">
              <p className="text-sm font-bold leading-none">{brand}</p>
              <p className="mt-1 text-xs text-muted-foreground">{portalLabel}</p>
            </div>
          </Link>

          <div className="ml-2 hidden items-center gap-1 text-sm text-muted-foreground md:flex">
            <ChevronRight className="h-4 w-4" />
            <span>{activeItem.label}</span>
          </div>

          <div className="ml-auto flex min-w-0 items-center gap-2 sm:gap-3">
            <Button variant="ghost" size="sm" asChild className="hidden md:flex">
              <Link href="/" target="_blank">
                Storefront
                <ExternalLink className="ml-2 h-3.5 w-3.5" />
              </Link>
            </Button>
            <div className="hidden min-w-0 text-right sm:block">
              <p className="max-w-48 truncate text-sm font-medium">{userEmail || "Account"}</p>
              <p className="text-xs text-muted-foreground">{portalLabel}</p>
            </div>
            <Button variant="outline" size="icon" onClick={onSignOut} title="Sign out">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <div className="flex">
        <aside className="sticky top-16 hidden h-[calc(100vh-4rem)] w-72 shrink-0 flex-col bg-primary lg:flex">
          <div className="flex-1 overflow-y-auto p-4">{navigation()}</div>
          <div className="border-t border-primary-foreground/10 p-4">
            <p className="text-xs font-medium text-primary-foreground/80">Workspace tools</p>
            <p className="mt-1 text-xs text-primary-foreground/45">Role-based access</p>
          </div>
        </aside>
        <main className="min-w-0 flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
