"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Smartphone, Laptop, Cpu, Camera, Home, Baby, Shirt, Headphones, Gem, Dumbbell, Package } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const iconMap: Record<string, any> = {
  smartphone: Smartphone,
  laptop: Laptop,
  electronics: Cpu,
  camera: Camera,
  furniture: Home,
  toys: Baby,
  fashion: Shirt,
  audio: Headphones,
  jewellery: Gem,
  sports: Dumbbell,
};

export function CategoryIconRow() {
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const { data } = await supabase
        .from("categories")
        .select("id, name, slug, image_url")
        .limit(10);

      if (data && data.length > 0) {
        setCategories(data.map(cat => ({
          id: cat.id,
          name: cat.name,
          slug: cat.slug,
          image: cat.image_url || "https://images.unsplash.com/photo-1498049794561-7780e7231661?w=200&h=200&fit=crop",
          icon: iconMap[cat.slug.toLowerCase()] || Package,
        })));
      }
    } catch (error) {
      // Silent error handling
    } finally {
      setLoading(false);
    }
  };

  if (loading || categories.length === 0) {
    return null; // Don't show section if loading or no categories
  }

  return (
    <section className="py-8 bg-background">
      <div className="container max-w-7xl">
        <h2 className="text-2xl md:text-3xl font-bold mb-6">Shop by Category</h2>
        
        {/* Desktop: Grid Layout */}
        <div className="hidden md:grid grid-cols-5 lg:grid-cols-10 gap-6">
          {categories.map((category) => {
            const Icon = category.icon;
            return (
              <Link
                key={category.id}
                href={`/categories/${category.slug}`}
                className="group flex flex-col items-center"
              >
                <div className="relative w-[90px] h-[90px] rounded-full overflow-hidden border-2 border-muted hover:border-accent transition-all duration-300 hover:shadow-lg hover:scale-105 bg-background">
                  <Image
                    src={category.image}
                    alt={category.name}
                    fill
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Icon className="h-8 w-8 text-white" />
                  </div>
                </div>
                <p className="text-sm font-medium text-center mt-3 max-w-[90px] leading-tight line-clamp-2">
                  {category.name}
                </p>
              </Link>
            );
          })}
        </div>

        {/* Mobile: Horizontal Scroll */}
        <div className="md:hidden relative">
          <div className="flex gap-6 overflow-x-auto pb-2 scrollbar-hide snap-x snap-mandatory">
            {categories.map((category) => {
              const Icon = category.icon;
              return (
                <Link
                  key={category.id}
                  href={`/categories/${category.slug}`}
                  className="flex-shrink-0 group snap-center"
                >
                  <div className="flex flex-col items-center">
                    <div className="relative w-[70px] h-[70px] rounded-full overflow-hidden border-2 border-muted active:border-accent transition-all duration-300 active:shadow-lg active:scale-105 bg-background">
                      <Image
                        src={category.image}
                        alt={category.name}
                        fill
                        className="object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-active:opacity-100 transition-opacity flex items-center justify-center">
                        <Icon className="h-6 w-6 text-white" />
                      </div>
                    </div>
                    <p className="text-xs font-medium text-center mt-2 max-w-[70px] leading-tight line-clamp-2">
                      {category.name}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}