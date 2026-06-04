"use client";

import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, X, TrendingUp } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/router";

// Mock products for search
const MOCK_PRODUCTS = [
  {
    id: "deal-1",
    title: "iPhone 15 Pro Max 256GB",
    price: 999.99,
    image: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=100&h=100&fit=crop",
    category: "Smartphone",
  },
  {
    id: "deal-2",
    title: "Samsung Galaxy S24 Ultra",
    price: 899.99,
    image: "https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=100&h=100&fit=crop",
    category: "Smartphone",
  },
  {
    id: "deal-3",
    title: "iPad Pro 12.9-inch M2",
    price: 799.99,
    image: "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=100&h=100&fit=crop",
    category: "Tablet",
  },
  {
    id: "deal-5",
    title: "MacBook Pro 14-inch M3",
    price: 1599.99,
    image: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=100&h=100&fit=crop",
    category: "Laptop",
  },
  {
    id: "deal-6",
    title: "Dell XPS 15 Ultra Thin",
    price: 1299.99,
    image: "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=100&h=100&fit=crop",
    category: "Laptop",
  },
  {
    id: "deal-9",
    title: "Sony WH-1000XM5 Headphones",
    price: 299.99,
    image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=100&h=100&fit=crop",
    category: "Audio",
  },
  {
    id: "1",
    title: "Premium Wireless Headphones",
    price: 249.99,
    image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=100&h=100&fit=crop",
    category: "Audio",
  },
  {
    id: "2",
    title: "Smart Watch Series X",
    price: 349.99,
    image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=100&h=100&fit=crop",
    category: "Wearables",
  },
];

const TRENDING_SEARCHES = [
  "iPhone 15",
  "MacBook Pro",
  "Wireless Headphones",
  "Smart Watch",
  "iPad",
];

interface SearchBarProps {
  onClose?: () => void;
}

export function SearchBar({ onClose }: SearchBarProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<typeof MOCK_PRODUCTS>([]);
  const [showResults, setShowResults] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Real-time search filtering
  useEffect(() => {
    if (query.trim().length === 0) {
      setResults([]);
      return;
    }

    const searchTerm = query.toLowerCase();
    const filtered = MOCK_PRODUCTS.filter(
      (product) =>
        product.title.toLowerCase().includes(searchTerm) ||
        product.category.toLowerCase().includes(searchTerm)
    ).slice(0, 6); // Limit to 6 results

    setResults(filtered);
  }, [query]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false);
        setIsFocused(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query)}`);
      setShowResults(false);
      setQuery("");
      onClose?.();
    }
  };

  const handleTrendingClick = (term: string) => {
    setQuery(term);
    router.push(`/search?q=${encodeURIComponent(term)}`);
    setShowResults(false);
    onClose?.();
  };

  const handleProductClick = () => {
    setShowResults(false);
    setQuery("");
    onClose?.();
  };

  return (
    <div ref={searchRef} className="relative w-full">
      <form onSubmit={handleSearch} className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <Input
          type="search"
          placeholder="Search for products, brands, and more..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => {
            setIsFocused(true);
            setShowResults(true);
          }}
          className="pl-10 pr-20"
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery("")}
            className="absolute right-12 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        )}
        <Button
          type="submit"
          size="sm"
          className="absolute right-0 top-0 h-full rounded-l-none"
        >
          <Search className="h-4 w-4" />
        </Button>
      </form>

      {/* Search Results Dropdown */}
      {showResults && (isFocused || results.length > 0) && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-card border rounded-lg shadow-xl z-50 max-h-[500px] overflow-hidden">
          {results.length > 0 ? (
            <div className="p-2">
              <div className="text-xs font-semibold text-muted-foreground px-3 py-2">
                Products
              </div>
              <div className="space-y-1">
                {results.map((product) => (
                  <Link
                    key={product.id}
                    href={`/products/${product.id}`}
                    onClick={handleProductClick}
                    className="flex items-center gap-3 p-2 rounded-md hover:bg-muted transition-colors"
                  >
                    <div className="relative w-12 h-12 flex-shrink-0 rounded-md overflow-hidden bg-muted border">
                      <Image
                        src={product.image}
                        alt={product.title}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium leading-tight line-clamp-1">
                        {product.title}
                      </p>
                      <p className="text-xs text-muted-foreground">{product.category}</p>
                    </div>
                    <span className="text-sm font-bold font-mono">${product.price}</span>
                  </Link>
                ))}
              </div>
              {results.length >= 6 && (
                <Link
                  href={`/search?q=${encodeURIComponent(query)}`}
                  onClick={handleProductClick}
                  className="block text-center text-sm text-accent hover:underline py-3"
                >
                  View all results for "{query}"
                </Link>
              )}
            </div>
          ) : query.trim().length > 0 ? (
            <div className="p-8 text-center">
              <p className="text-sm text-muted-foreground">No products found for "{query}"</p>
            </div>
          ) : (
            <div className="p-4">
              <div className="text-xs font-semibold text-muted-foreground px-2 py-2 flex items-center gap-2">
                <TrendingUp className="h-3.5 w-3.5" />
                Trending Searches
              </div>
              <div className="space-y-1">
                {TRENDING_SEARCHES.map((term) => (
                  <button
                    key={term}
                    onClick={() => handleTrendingClick(term)}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-muted rounded-md transition-colors"
                  >
                    {term}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}