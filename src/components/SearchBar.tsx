"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/router";
import { useEffect, useRef, useState } from "react";
import { Loader2, Package, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useMarketplaceSettings } from "@/contexts/MarketplaceSettingsContext";
import { supabase } from "@/integrations/supabase/client";
import { amazonStyleCategories } from "@/lib/marketplace-config";

interface SearchProduct {
  id: string;
  title: string;
  price: number;
  category: { name: string } | null;
  images: { url: string }[];
}

interface SearchBarProps {
  onClose?: () => void;
  compact?: boolean;
}

const searchDepartments = [
  { label: "All", value: "all" },
  { label: "Deals", value: "deals" },
  ...amazonStyleCategories.slice(0, 8).map((category) => ({
    label: category.name,
    value: category.slug,
  })),
];

export function SearchBar({ onClose, compact = false }: SearchBarProps) {
  const router = useRouter();
  const { siteName, formatPrice } = useMarketplaceSettings();
  const searchRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState("");
  const [department, setDepartment] = useState("all");
  const [results, setResults] = useState<SearchProduct[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const search = query.trim();
    if (search.length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }

    let active = true;
    const timer = window.setTimeout(async () => {
      setLoading(true);
      const safeSearch = search.replaceAll(",", " ");
      const { data } = await supabase
        .from("products")
        .select(`
          id,
          title,
          price,
          category:categories(name),
          images:product_images(url)
        `)
        .eq("status", "approved")
        .or(`title.ilike.%${safeSearch}%,description.ilike.%${safeSearch}%`)
        .limit(6);

      if (active) {
        setResults((data ?? []) as unknown as SearchProduct[]);
        setLoading(false);
      }
    }, 250);

    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [query]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const closeSearch = () => {
    setShowResults(false);
    setQuery("");
    onClose?.();
  };

  const handleSearch = (event: React.FormEvent) => {
    event.preventDefault();
    const search = query.trim();
    if (!search) return;

    router.push(`/search?q=${encodeURIComponent(search)}`);
    closeSearch();
  };

  return (
    <div ref={searchRef} className="relative w-full">
      <form
        onSubmit={handleSearch}
        className={`relative flex ${compact ? "h-10" : "h-11"} overflow-hidden rounded-md border-2 border-transparent bg-background shadow-sm transition focus-within:border-accent`}
      >
        <label className="sr-only" htmlFor="marketplace-department">
          Search department
        </label>
        <select
          id="marketplace-department"
          value={department}
          onChange={(event) => setDepartment(event.target.value)}
          className="hidden w-28 shrink-0 border-r bg-muted px-3 text-xs font-medium text-foreground outline-none md:block"
        >
          {searchDepartments.map((item) => (
            <option key={item.value} value={item.value}>
              {item.label}
            </option>
          ))}
        </select>
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground md:left-32" />
        <Input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onFocus={() => setShowResults(true)}
          placeholder={`Search ${siteName}`}
          className="h-full flex-1 rounded-none border-0 bg-background pl-10 pr-20 shadow-none focus-visible:ring-0 md:pl-10"
        />
        {query && (
          <button
            type="button"
            aria-label="Clear search"
            onClick={() => setQuery("")}
            className="absolute right-14 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        )}
        <Button
          type="submit"
          size="sm"
          className="h-full w-12 shrink-0 rounded-none bg-accent text-accent-foreground hover:bg-accent/90"
        >
          <Search className="h-4 w-4" />
          <span className="sr-only">Search</span>
        </Button>
      </form>

      {showResults && query.trim().length >= 2 && (
        <div className="absolute left-0 right-0 top-full z-50 mt-2 max-h-[460px] overflow-y-auto rounded-md border bg-card shadow-xl">
          {loading ? (
            <div className="flex items-center justify-center gap-2 p-8 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Searching...
            </div>
          ) : results.length === 0 ? (
            <p className="p-8 text-center text-sm text-muted-foreground">No products found.</p>
          ) : (
            <div className="p-2">
              {results.map((product) => (
                <Link
                  key={product.id}
                  href={`/products/${product.id}`}
                  onClick={closeSearch}
                  className="flex items-center gap-3 rounded-md p-2 hover:bg-muted"
                >
                  <div className="relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-md border bg-muted">
                    {product.images[0]?.url ? (
                      <Image
                        src={product.images[0].url}
                        alt=""
                        fill
                        unoptimized
                        className="object-cover"
                      />
                    ) : (
                      <Package className="h-5 w-5 text-muted-foreground" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{product.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {product.category?.name || "Marketplace"}
                    </p>
                  </div>
                  <span className="font-mono text-sm font-bold">{formatPrice(product.price)}</span>
                </Link>
              ))}
              <Link
                href={`/search?q=${encodeURIComponent(query.trim())}`}
                onClick={closeSearch}
                className="block border-t py-3 text-center text-sm font-medium text-primary hover:underline"
              >
                View all results
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
