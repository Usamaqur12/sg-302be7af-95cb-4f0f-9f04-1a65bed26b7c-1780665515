"use client";

import Link from "next/link";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";

interface CategoryCardProps {
  id: string;
  name: string;
  slug: string;
  image: string;
  productCount: number;
}

export function CategoryCard({ id, name, slug, image, productCount }: CategoryCardProps) {
  return (
    <Link href={`/categories/${slug}`}>
      <Card className="group overflow-hidden hover:shadow-lg transition-all duration-300 h-full">
        <CardContent className="p-0">
          <div className="relative aspect-square overflow-hidden bg-muted">
            <Image
              src={image}
              alt={name}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
              <h3 className="font-semibold text-lg mb-1">{name}</h3>
              <p className="text-sm text-white/90 font-mono">{productCount} products</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}