"use client";

import Link from "next/link";
import Image from "next/image";
import { Smartphone, Laptop, Cpu, Camera, Home, Baby, Shirt, Headphones, Gem, Dumbbell } from "lucide-react";

const categories = [
  {
    id: "smartphone-tablet",
    name: "Smartphone & Tablet",
    slug: "smartphone-tablet",
    icon: Smartphone,
    image: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=200&h=200&fit=crop",
  },
  {
    id: "laptop",
    name: "Laptop",
    slug: "laptop",
    icon: Laptop,
    image: "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=200&h=200&fit=crop",
  },
  {
    id: "electronics",
    name: "Electronics",
    slug: "electronics",
    icon: Cpu,
    image: "https://images.unsplash.com/photo-1498049794561-7780e7231661?w=200&h=200&fit=crop",
  },
  {
    id: "camera",
    name: "Camera",
    slug: "camera-photo",
    icon: Camera,
    image: "https://images.unsplash.com/photo-1606510907744-a6ec26c0ecfd?w=200&h=200&fit=crop",
  },
  {
    id: "furniture",
    name: "Furniture",
    slug: "furniture-decor",
    icon: Home,
    image: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=200&h=200&fit=crop",
  },
  {
    id: "toys",
    name: "Toys & Baby",
    slug: "toys-kids-baby",
    icon: Baby,
    image: "https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=200&h=200&fit=crop",
  },
  {
    id: "fashion",
    name: "Fashion",
    slug: "fashion-accessories",
    icon: Shirt,
    image: "https://images.unsplash.com/photo-1445205170230-053b83016050?w=200&h=200&fit=crop",
  },
  {
    id: "headphone",
    name: "Audio",
    slug: "headphone",
    icon: Headphones,
    image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=200&h=200&fit=crop",
  },
  {
    id: "jewellery",
    name: "Jewellery",
    slug: "jewellery",
    icon: Gem,
    image: "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=200&h=200&fit=crop",
  },
  {
    id: "sports",
    name: "Sports",
    slug: "sports-outdoors",
    icon: Dumbbell,
    image: "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=200&h=200&fit=crop",
  },
];

export function CategoryIconRow() {
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