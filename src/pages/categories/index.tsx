import { CustomerLayout } from "@/components/CustomerLayout";
import { CategoryCard } from "@/components/CategoryCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

const allCategories = [
  {
    id: "1",
    name: "Electronics",
    slug: "electronics",
    image: "https://images.unsplash.com/photo-1498049794561-7780e7231661?w=800&h=800&fit=crop",
    productCount: 1243,
  },
  {
    id: "2",
    name: "Fashion",
    slug: "fashion",
    image: "https://images.unsplash.com/photo-1445205170230-053b83016050?w=800&h=800&fit=crop",
    productCount: 2156,
  },
  {
    id: "3",
    name: "Home & Garden",
    slug: "home-garden",
    image: "https://images.unsplash.com/photo-1556912173-46c336c7fd55?w=800&h=800&fit=crop",
    productCount: 876,
  },
  {
    id: "4",
    name: "Sports & Outdoors",
    slug: "sports-outdoors",
    image: "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=800&h=800&fit=crop",
    productCount: 654,
  },
  {
    id: "5",
    name: "Books & Media",
    slug: "books-media",
    image: "https://images.unsplash.com/photo-1495446815901-a7297e633e8d?w=800&h=800&fit=crop",
    productCount: 923,
  },
  {
    id: "6",
    name: "Toys & Kids",
    slug: "toys-kids",
    image: "https://images.unsplash.com/photo-1560582861-45078880e48e?w=800&h=800&fit=crop",
    productCount: 445,
  },
  {
    id: "7",
    name: "Beauty & Health",
    slug: "beauty-health",
    image: "https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=800&h=800&fit=crop",
    productCount: 789,
  },
  {
    id: "8",
    name: "Automotive",
    slug: "automotive",
    image: "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=800&h=800&fit=crop",
    productCount: 534,
  },
  {
    id: "9",
    name: "Pet Supplies",
    slug: "pet-supplies",
    image: "https://images.unsplash.com/photo-1450778869180-41d0601e046e?w=800&h=800&fit=crop",
    productCount: 412,
  },
  {
    id: "10",
    name: "Office Supplies",
    slug: "office-supplies",
    image: "https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?w=800&h=800&fit=crop",
    productCount: 321,
  },
  {
    id: "11",
    name: "Food & Grocery",
    slug: "food-grocery",
    image: "https://images.unsplash.com/photo-1542838132-92c53300491e?w=800&h=800&fit=crop",
    productCount: 1567,
  },
  {
    id: "12",
    name: "Arts & Crafts",
    slug: "arts-crafts",
    image: "https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=800&h=800&fit=crop",
    productCount: 678,
  },
];

export default function CategoriesPage() {
  return (
    <CustomerLayout>
      <div className="container py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-4">All Categories</h1>
          <p className="text-muted-foreground text-lg">
            Browse through our extensive catalog of product categories
          </p>
        </div>

        <div className="mb-8">
          <div className="relative max-w-2xl">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search categories..."
              className="pl-10 h-12"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {allCategories.map((category) => (
            <CategoryCard key={category.id} {...category} />
          ))}
        </div>
      </div>
    </CustomerLayout>
  );
}