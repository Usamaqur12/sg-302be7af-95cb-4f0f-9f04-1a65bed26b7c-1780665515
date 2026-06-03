"use client";

import Link from "next/link";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

interface TrendingProduct {
  id: string;
  title: string;
  price: number;
  image: string;
}

const trendingProducts: TrendingProduct[] = [
  {
    id: "1",
    title: "Wireless Earbuds Pro",
    price: 149.99,
    image: "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=100",
  },
  {
    id: "2",
    title: "Smart Watch Series 8",
    price: 399.99,
    image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=100",
  },
  {
    id: "3",
    title: "4K Action Camera",
    price: 279.99,
    image: "https://images.unsplash.com/photo-1606510907744-a6ec26c0ecfd?w=100",
  },
  {
    id: "4",
    title: "Gaming Headset RGB",
    price: 129.99,
    image: "https://images.unsplash.com/photo-1599669454699-248893623440?w=100",
  },
  {
    id: "5",
    title: "Portable SSD 1TB",
    price: 159.99,
    image: "https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?w=100",
  },
];

export function TrendingStrip() {
  return (
    <div className="bg-card border-y">
      <div className="container py-4">
        <div className="flex items-center gap-6 overflow-x-auto">
          <Badge variant="destructive" className="flex-shrink-0 font-semibold px-4 py-2">
            THIS MONTH TRENDING
          </Badge>

          {trendingProducts.map((product, index) => (
            <div key={product.id} className="flex items-center gap-6 flex-shrink-0">
              <Link
                href={`/products/${product.id}`}
                className="flex items-center gap-3 hover:opacity-80 transition-opacity"
              >
                <div className="relative w-12 h-12 rounded overflow-hidden bg-muted">
                  <Image src={product.image} alt={product.title} fill className="object-cover" />
                </div>
                <div>
                  <p className="text-sm font-medium line-clamp-1">{product.title}</p>
                  <p className="text-sm font-mono font-bold text-destructive">
                    ${product.price.toFixed(2)}
                  </p>
                </div>
              </Link>
              {index < trendingProducts.length - 1 && (
                <Separator orientation="vertical" className="h-12" />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}