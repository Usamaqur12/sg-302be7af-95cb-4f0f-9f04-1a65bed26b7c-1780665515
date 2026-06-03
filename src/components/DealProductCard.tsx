"use client";

import Link from "next/link";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Star } from "lucide-react";
import { CountdownTimer } from "./CountdownTimer";

interface DealProductCardProps {
  id: string;
  title: string;
  price: number;
  oldPrice: number;
  discount: number;
  image: string;
  rating: number;
  endDate: Date;
}

export function DealProductCard({
  id,
  title,
  price,
  oldPrice,
  discount,
  image,
  rating,
  endDate,
}: DealProductCardProps) {
  return (
    <Link href={`/products/${id}`}>
      <Card className="group hover:shadow-2xl transition-shadow duration-300 bg-card overflow-hidden">
        <CardContent className="p-4">
          {/* Sale Badge */}
          <Badge variant="destructive" className="absolute top-2 left-2 z-10 font-bold">
            -{discount}%
          </Badge>

          {/* Product Image */}
          <div className="relative aspect-square mb-3 rounded-lg overflow-hidden bg-muted">
            <Image
              src={image}
              alt={title}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
            />
          </div>

          {/* Product Title */}
          <h3 className="font-semibold text-sm line-clamp-2 mb-2 min-h-[40px]">{title}</h3>

          {/* Rating */}
          <div className="flex items-center gap-1 mb-2">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={`h-3 w-3 ${
                  i < Math.floor(rating) ? "fill-warning text-warning" : "text-muted"
                }`}
              />
            ))}
            <span className="text-xs text-muted-foreground ml-1">({rating})</span>
          </div>

          {/* Price */}
          <div className="mb-3">
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-bold font-mono text-destructive">
                ${price.toFixed(2)}
              </span>
              <span className="text-sm text-muted-foreground line-through font-mono">
                ${oldPrice.toFixed(2)}
              </span>
            </div>
          </div>

          {/* Countdown Timer */}
          <div className="pt-3 border-t">
            <CountdownTimer endDate={endDate} />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}