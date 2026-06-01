import { CustomerLayout } from "@/components/CustomerLayout";
import { CategoryCard } from "@/components/CategoryCard";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  image_url: string;
  product_count?: number;
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCategories() {
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .is("parent_id", null)
        .order("name");

      if (data && !error) {
        const categoriesWithCount = await Promise.all(
          data.map(async (cat) => {
            const { count } = await supabase
              .from("products")
              .select("*", { count: "exact", head: true })
              .eq("category_id", cat.id)
              .eq("status", "approved");

            return { ...cat, product_count: count || 0 };
          })
        );
        setCategories(categoriesWithCount);
      }
      setLoading(false);
    }

    fetchCategories();
  }, []);

  return (
    <CustomerLayout>
      <div className="container py-8">
        <Breadcrumb className="mb-6">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/">Home</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Categories</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-3">All Categories</h1>
          <p className="text-muted-foreground text-lg">
            Browse products by category
          </p>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="aspect-square bg-muted animate-pulse rounded-lg" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {categories.map((category) => (
              <CategoryCard
                key={category.id}
                id={category.id}
                name={category.name}
                slug={category.slug}
                image={category.image_url}
                productCount={category.product_count || 0}
              />
            ))}
          </div>
        )}

        {!loading && categories.length === 0 && (
          <div className="text-center py-16">
            <p className="text-muted-foreground text-lg">No categories available yet.</p>
          </div>
        )}
      </div>
    </CustomerLayout>
  );
}