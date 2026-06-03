"use client";

import { CustomerLayout } from "@/components/CustomerLayout";
import { ProductCard } from "@/components/ProductCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { useRouter } from "next/router";
import { useState, useEffect } from "react";
import { searchProducts, type SearchFilters } from "@/lib/search";
import { analytics } from "@/lib/analytics";

interface Product {
  id: string;
  title: string;
  price: number;
  compare_at_price: number | null;
  rating: number;
  total_reviews: number;
  images: { url: string }[];
  seller: { business_name: string };
}

export default function SearchPage() {
  const router = useRouter();
  const { q, category, minPrice, maxPrice, minRating } = router.query;

  const [searchQuery, setSearchQuery] = useState((q as string) || "");
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalResults, setTotalResults] = useState(0);
  const [showFilters, setShowFilters] = useState(false);

  const [filters, setFilters] = useState<SearchFilters>({
    query: (q as string) || "",
    category: category as string,
    minPrice: minPrice ? parseFloat(minPrice as string) : undefined,
    maxPrice: maxPrice ? parseFloat(maxPrice as string) : undefined,
    minRating: minRating ? parseFloat(minRating as string) : undefined,
    sortBy: "relevance",
    limit: 20,
    offset: 0,
  });

  useEffect(() => {
    performSearch();
  }, [router.query]);

  const performSearch = async () => {
    setLoading(true);
    
    const searchFilters: SearchFilters = {
      query: (q as string) || "",
      category: category as string,
      minPrice: minPrice ? parseFloat(minPrice as string) : undefined,
      maxPrice: maxPrice ? parseFloat(maxPrice as string) : undefined,
      minRating: minRating ? parseFloat(minRating as string) : undefined,
      sortBy: filters.sortBy,
      limit: 20,
      offset: filters.offset,
    };

    const results = await searchProducts(searchFilters);
    setProducts(results.products);
    setTotalResults(results.total);
    setLoading(false);

    // Track search
    if (searchFilters.query) {
      analytics.searchPerformed(searchFilters.query, results.total);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const queryParams = new URLSearchParams();
    if (searchQuery) queryParams.set("q", searchQuery);
    if (filters.category) queryParams.set("category", filters.category);
    if (filters.minPrice) queryParams.set("minPrice", filters.minPrice.toString());
    if (filters.maxPrice) queryParams.set("maxPrice", filters.maxPrice.toString());
    if (filters.minRating) queryParams.set("minRating", filters.minRating.toString());
    
    router.push(`/search?${queryParams.toString()}`);
  };

  const handleFilterChange = (key: keyof SearchFilters, value: any) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const applyFilters = () => {
    const queryParams = new URLSearchParams();
    if (searchQuery) queryParams.set("q", searchQuery);
    if (filters.category) queryParams.set("category", filters.category);
    if (filters.minPrice) queryParams.set("minPrice", filters.minPrice.toString());
    if (filters.maxPrice) queryParams.set("maxPrice", filters.maxPrice.toString());
    if (filters.minRating) queryParams.set("minRating", filters.minRating.toString());
    
    router.push(`/search?${queryParams.toString()}`);
  };

  const clearFilters = () => {
    setFilters({
      query: searchQuery,
      sortBy: "relevance",
      limit: 20,
      offset: 0,
    });
    router.push(`/search?q=${searchQuery}`);
  };

  const activeFiltersCount = [
    filters.category,
    filters.minPrice,
    filters.maxPrice,
    filters.minRating,
  ].filter(Boolean).length;

  return (
    <CustomerLayout>
      <div className="container py-8">
        {/* Search Bar */}
        <form onSubmit={handleSearch} className="mb-8">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search for products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-12 text-lg"
              />
            </div>
            <Button type="submit" size="lg" className="px-8">
              Search
            </Button>
            <Button
              type="button"
              variant="outline"
              size="lg"
              onClick={() => setShowFilters(!showFilters)}
              className="relative"
            >
              <SlidersHorizontal className="h-5 w-5" />
              {activeFiltersCount > 0 && (
                <Badge className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center bg-accent text-accent-foreground">
                  {activeFiltersCount}
                </Badge>
              )}
            </Button>
          </div>
        </form>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Filters Sidebar */}
          {showFilters && (
            <aside className="lg:w-64 flex-shrink-0">
              <Card className="p-6 sticky top-24">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="font-semibold text-lg">Filters</h3>
                  {activeFiltersCount > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearFilters}
                      className="text-xs"
                    >
                      Clear All
                    </Button>
                  )}
                </div>

                <div className="space-y-6">
                  {/* Category Filter */}
                  <div>
                    <Label className="mb-2 block">Category</Label>
                    <Select
                      value={filters.category || "all"}
                      onValueChange={(value) =>
                        handleFilterChange("category", value === "all" ? undefined : value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="All Categories" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Categories</SelectItem>
                        <SelectItem value="electronics">Electronics</SelectItem>
                        <SelectItem value="fashion">Fashion</SelectItem>
                        <SelectItem value="home-garden">Home & Garden</SelectItem>
                        <SelectItem value="sports-outdoors">Sports & Outdoors</SelectItem>
                        <SelectItem value="books-media">Books & Media</SelectItem>
                        <SelectItem value="toys-kids">Toys & Kids</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Price Range */}
                  <div>
                    <Label className="mb-2 block">Price Range</Label>
                    <div className="grid grid-cols-2 gap-2">
                      <Input
                        type="number"
                        placeholder="Min"
                        value={filters.minPrice || ""}
                        onChange={(e) =>
                          handleFilterChange("minPrice", e.target.value ? parseFloat(e.target.value) : undefined)
                        }
                        min="0"
                        step="0.01"
                      />
                      <Input
                        type="number"
                        placeholder="Max"
                        value={filters.maxPrice || ""}
                        onChange={(e) =>
                          handleFilterChange("maxPrice", e.target.value ? parseFloat(e.target.value) : undefined)
                        }
                        min="0"
                        step="0.01"
                      />
                    </div>
                  </div>

                  {/* Rating Filter */}
                  <div>
                    <Label className="mb-2 block">Minimum Rating</Label>
                    <Select
                      value={filters.minRating?.toString() || "0"}
                      onValueChange={(value) =>
                        handleFilterChange("minRating", value === "0" ? undefined : parseFloat(value))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Any Rating" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0">Any Rating</SelectItem>
                        <SelectItem value="4">4+ Stars</SelectItem>
                        <SelectItem value="4.5">4.5+ Stars</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Button onClick={applyFilters} className="w-full">
                    Apply Filters
                  </Button>
                </div>
              </Card>
            </aside>
          )}

          {/* Results */}
          <div className="flex-1">
            {/* Results Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                {searchQuery && (
                  <h1 className="text-2xl font-bold mb-1">
                    Search results for "{searchQuery}"
                  </h1>
                )}
                <p className="text-muted-foreground">
                  {loading ? "Searching..." : `${totalResults} results found`}
                </p>
              </div>

              <Select
                value={filters.sortBy}
                onValueChange={(value) => {
                  handleFilterChange("sortBy", value as any);
                  setTimeout(() => performSearch(), 0);
                }}
              >
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="relevance">Most Relevant</SelectItem>
                  <SelectItem value="price_asc">Price: Low to High</SelectItem>
                  <SelectItem value="price_desc">Price: High to Low</SelectItem>
                  <SelectItem value="rating">Highest Rated</SelectItem>
                  <SelectItem value="newest">Newest First</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Active Filters */}
            {activeFiltersCount > 0 && (
              <div className="flex flex-wrap gap-2 mb-6">
                {filters.category && (
                  <Badge variant="secondary" className="gap-2">
                    Category: {filters.category}
                    <X
                      className="h-3 w-3 cursor-pointer"
                      onClick={() => {
                        handleFilterChange("category", undefined);
                        applyFilters();
                      }}
                    />
                  </Badge>
                )}
                {filters.minPrice && (
                  <Badge variant="secondary" className="gap-2">
                    Min: ${filters.minPrice}
                    <X
                      className="h-3 w-3 cursor-pointer"
                      onClick={() => {
                        handleFilterChange("minPrice", undefined);
                        applyFilters();
                      }}
                    />
                  </Badge>
                )}
                {filters.maxPrice && (
                  <Badge variant="secondary" className="gap-2">
                    Max: ${filters.maxPrice}
                    <X
                      className="h-3 w-3 cursor-pointer"
                      onClick={() => {
                        handleFilterChange("maxPrice", undefined);
                        applyFilters();
                      }}
                    />
                  </Badge>
                )}
                {filters.minRating && (
                  <Badge variant="secondary" className="gap-2">
                    {filters.minRating}+ Stars
                    <X
                      className="h-3 w-3 cursor-pointer"
                      onClick={() => {
                        handleFilterChange("minRating", undefined);
                        applyFilters();
                      }}
                    />
                  </Badge>
                )}
              </div>
            )}

            {/* Products Grid */}
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {[...Array(8)].map((_, i) => (
                  <Card key={i} className="h-96 animate-pulse bg-muted" />
                ))}
              </div>
            ) : products.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {products.map((product) => (
                  <ProductCard
                    key={product.id}
                    id={product.id}
                    title={product.title}
                    price={product.price}
                    compareAtPrice={product.compare_at_price || undefined}
                    image={product.images[0]?.url || "/placeholder.png"}
                    rating={product.rating}
                    reviewCount={product.total_reviews}
                    sellerName={product.seller.business_name}
                  />
                ))}
              </div>
            ) : (
              <Card className="p-12 text-center">
                <div className="max-w-md mx-auto">
                  <Search className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">No results found</h3>
                  <p className="text-muted-foreground mb-6">
                    Try adjusting your search or filters to find what you're looking for.
                  </p>
                  <Button onClick={clearFilters} variant="outline">
                    Clear Filters
                  </Button>
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </CustomerLayout>
  );
}