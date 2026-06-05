"use client";

import { CustomerLayout } from "@/components/CustomerLayout";
import { CategoryCard } from "@/components/CategoryCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import { Search, Loader2, Package } from "lucide-react";
import Link from "next/link";

export default function CategoriesPage() {
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("categories")
        .select("id, name, slug, image_url")
        .order("name", { ascending: true });

      if (error) {
        setCategories([]);
      } else {
        // Count products for each category
        const categoriesWithCount = await Promise.all(
          (data || []).map(async (cat) => {
            const { count } = await supabase
              .from("products")
              .select("id", { count: "exact", head: true })
              .eq("category_id", cat.id)
              .eq("status", "approved");

            return {
              id: cat.id,
              name: cat.name,
              slug: cat.slug,
              image: cat.image_url || "https://images.unsplash.com/photo-1498049794561-7780e7231661?w=800&h=800&fit=crop",
              productCount: count || 0,
            };
          })
        );

        setCategories(categoriesWithCount);
      }
    } catch (error) {
      setCategories([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredCategories = categories.filter((cat) =>
    cat.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <CustomerLayout>
        <div className="container py-16 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-muted-foreground">Loading categories...</p>
          </div>
        </div>
      </CustomerLayout>
    );
  }

  return (
    <CustomerLayout>
      <div className="container py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-4">All Categories</h1>
          <p className="text-muted-foreground text-lg">
            Browse through our extensive catalog of product categories
          </p>
        </div>

        {categories.length > 0 ? (
          <>
            <div className="mb-8">
              <div className="relative max-w-2xl">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search categories..."
                  className="pl-10 h-12"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            {filteredCategories.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {filteredCategories.map((category) => (
                  <CategoryCard key={category.id} {...category} />
                ))}
              </div>
            ) : (
              <Card className="p-12 text-center">
                <p className="text-lg font-semibold mb-2">No categories found</p>
                <p className="text-muted-foreground mb-4">
                  Try searching with different keywords
                </p>
                <Button onClick={() => setSearchQuery("")}>Clear Search</Button>
              </Card>
            )}
          </>
        ) : (
          <Card className="p-12 text-center">
            <Package className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <p className="text-lg font-semibold mb-2">No categories available</p>
            <p className="text-muted-foreground mb-6">
              Categories will appear here once they are added to the catalog
            </p>
            <Button asChild>
              <Link href="/">Back to Home</Link>
            </Button>
          </Card>
        )}
      </div>
    </CustomerLayout>
  );
}