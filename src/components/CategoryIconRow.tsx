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
    image: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=200",
  },
  {
    id: "laptop",
    name: "Laptop",
    slug: "laptop",
    icon: Laptop,
    image: "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=200",
  },
  {
    id: "electronics",
    name: "Electronics",
    slug: "electronics",
    icon: Cpu,
    image: "https://images.unsplash.com/photo-1498049794561-7780e7231661?w=200",
  },
  {
    id: "camera",
    name: "Camera & Photo",
    slug: "camera-photo",
    icon: Camera,
    image: "https://images.unsplash.com/photo-1606510907744-a6ec26c0ecfd?w=200",
  },
  {
    id: "furniture",
    name: "Furniture & Decor",
    slug: "furniture-decor",
    icon: Home,
    image: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=200",
  },
  {
    id: "toys",
    name: "Toys, Kids & Baby",
    slug: "toys-kids-baby",
    icon: Baby,
    image: "https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=200",
  },
  {
    id: "fashion",
    name: "Fashion & Accessories",
    slug: "fashion-accessories",
    icon: Shirt,
    image: "https://images.unsplash.com/photo-1445205170230-053b83016050?w=200",
  },
  {
    id: "headphone",
    name: "Headphone",
    slug: "headphone",
    icon: Headphones,
    image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=200",
  },
  {
    id: "jewellery",
    name: "Jewellery",
    slug: "jewellery",
    icon: Gem,
    image: "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=200",
  },
  {
    id: "sports",
    name: "Sports & Outdoors",
    slug: "sports-outdoors",
    icon: Dumbbell,
    image: "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=200",
  },
];

export function CategoryIconRow() {
  return (
    <div className="container py-12">
      <div className="flex gap-6 overflow-x-auto pb-4 scrollbar-hide">
        {categories.map((category) => {
          const Icon = category.icon;
          return (
            <Link
              key={category.id}
              href={`/categories/${category.slug}`}
              className="flex-shrink-0 group"
            >
              <div className="flex flex-col items-center gap-3">
                <div className="relative w-24 h-24 rounded-full bg-muted overflow-hidden border-2 border-transparent group-hover:border-accent transition-colors">
                  <div className="absolute inset-0 flex items-center justify-center bg-muted/50">
                    <Icon className="h-10 w-10 text-muted-foreground/50" />
                  </div>
                  <Image
                    src={category.image}
                    alt={category.name}
                    fill
                    className="object-cover opacity-70 group-hover:opacity-90 transition-opacity"
                  />
                </div>
                <p className="text-sm font-medium text-center max-w-[100px] leading-tight">
                  {category.name}
                </p>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}