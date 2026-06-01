"use client";

import Link from "next/link";
import Image from "next/image";
import { Heart, ShoppingCart, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

interface ProductCardProps {
  id: string;
  title: string;
  price: number;
  compareAtPrice?: number;
  image: string;
  rating: number;
  reviewCount: number;
  sellerName: string;
  isDeal?: boolean;
}

export function ProductCard({
  id,
  title,
  price,
  compareAtPrice,
  image,
  rating,
  reviewCount,
  sellerName,
  isDeal,
}: ProductCardProps) {
  const discount = compareAtPrice
    ? Math.round(((compareAtPrice - price) / compareAtPrice) * 100)
    : 0;

  return (
    <Card className="group overflow-hidden hover:shadow-lg transition-shadow duration-300">
      <Link href={`/products/${id}`}>
        <div className="relative aspect-square overflow-hidden bg-muted">
          <Image
            src={image}
            alt={title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
          {isDeal && (
            <Badge className="absolute top-3 left-3 bg-warning text-warning-foreground">
              Deal
            </Badge>
          )}
          {discount > 0 && (
            <Badge className="absolute top-3 right-3 bg-destructive text-destructive-foreground">
              -{discount}%
            </Badge>
          )}
          <Button
            size="icon"
            variant="secondary"
            className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
          >
            <Heart className="h-4 w-4" />
          </Button>
        </div>
      </Link>

      <CardContent className="p-4">
        <Link href={`/products/${id}`}>
          <h3 className="font-medium line-clamp-2 mb-2 group-hover:text-accent transition-colors">
            {title}
          </h3>
        </Link>

        <div className="flex items-center gap-1 mb-2 text-sm">
          <div className="flex items-center">
            <Star className="h-3 w-3 fill-warning text-warning" />
            <span className="ml-1 font-medium font-mono">{rating.toFixed(1)}</span>
          </div>
          <span className="text-muted-foreground">({reviewCount})</span>
        </div>

        <p className="text-xs text-muted-foreground mb-3">{sellerName}</p>

        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-lg font-bold font-mono">${price.toFixed(2)}</span>
              {compareAtPrice && (
                <span className="text-sm text-muted-foreground line-through font-mono">
                  ${compareAtPrice.toFixed(2)}
                </span>
              )}
            </div>
          </div>

          <Button
            size="icon"
            className="bg-accent hover:bg-accent/90"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
          >
            <ShoppingCart className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}