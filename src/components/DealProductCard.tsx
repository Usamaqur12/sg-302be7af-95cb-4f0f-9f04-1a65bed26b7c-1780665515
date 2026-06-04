"use client";

import Link from "next/link";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Star, Heart, ShoppingCart } from "lucide-react";
import { CountdownTimer } from "./CountdownTimer";
import { useState } from "react";
import { useCart } from "@/contexts/CartContext";
import { useToast } from "@/hooks/use-toast";

interface DealProductCardProps {
  id: string;
  title: string;
  price: number;
  oldPrice: number;
  discount: number;
  image: string;
  rating: number;
  reviews: number;
  seller: string;
  endDate: Date;
  onAddToCart?: () => void;
}

export function DealProductCard({
  id,
  title,
  price,
  oldPrice,
  discount,
  image,
  rating,
  reviews,
  seller,
  endDate,
  onAddToCart,
}: DealProductCardProps) {
  const [isWishlisted, setIsWishlisted] = useState(false);
  const { addToCart } = useCart();
  const { toast } = useToast();

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    await addToCart(id, 1);
    toast({
      title: "Added to Cart",
      description: `${title} has been added to your cart`,
    });
    onAddToCart?.();
  };

  return (
    <Card className="group relative h-full bg-white hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 rounded-2xl overflow-hidden flex flex-col">
      <CardContent className="p-3 lg:p-4 flex flex-col h-full">
        {/* Sale Badge */}
        <Badge 
          variant="destructive" 
          className="absolute top-2 left-2 z-10 font-bold text-xs px-2 py-1 shadow-lg"
        >
          -{discount}%
        </Badge>

        {/* Wishlist Heart */}
        <button
          onClick={(e) => {
            e.preventDefault();
            setIsWishlisted(!isWishlisted);
          }}
          className="absolute top-2 right-2 z-10 w-8 h-8 rounded-full bg-white/90 hover:bg-white shadow-md flex items-center justify-center transition-all hover:scale-110"
        >
          <Heart 
            className={`h-4 w-4 transition-colors ${isWishlisted ? 'fill-accent text-accent' : 'text-muted-foreground'}`} 
          />
        </button>

        {/* Product Image */}
        <Link href={`/products/${id}`} className="block">
          <div className="relative aspect-square mb-3 rounded-xl overflow-hidden bg-muted/30">
            <Image
              src={image}
              alt={title}
              fill
              className="object-contain p-2 group-hover:scale-105 transition-transform duration-300"
            />
          </div>
        </Link>

        {/* Product Info - Flex Grow */}
        <div className="flex-grow flex flex-col">
          <Link href={`/products/${id}`}>
            {/* Product Title */}
            <h3 className="font-semibold text-sm leading-tight line-clamp-2 mb-2 min-h-[40px] hover:text-accent transition-colors">
              {title}
            </h3>
          </Link>

          {/* Seller */}
          <p className="text-xs text-muted-foreground mb-2">{seller}</p>

          {/* Rating */}
          <div className="flex items-center gap-1 mb-3">
            <div className="flex items-center">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`h-3 w-3 ${
                    i < Math.floor(rating) ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30"
                  }`}
                />
              ))}
            </div>
            <span className="text-xs text-muted-foreground">({reviews})</span>
          </div>

          {/* Price */}
          <div className="mb-3">
            <div className="flex items-baseline gap-2 flex-wrap">
              <span className="text-lg lg:text-xl font-bold font-mono text-accent">
                ${price.toFixed(2)}
              </span>
              <span className="text-xs text-muted-foreground line-through font-mono">
                ${oldPrice.toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        {/* Bottom Section - Fixed */}
        <div className="mt-auto space-y-3">
          {/* Countdown Timer */}
          <div className="pt-3 border-t border-muted">
            <CountdownTimer endDate={endDate} />
          </div>

          {/* Add to Cart Button - Visible on Hover */}
          <Button 
            size="sm" 
            className="w-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-accent hover:bg-accent/90 text-white font-semibold gap-2"
            onClick={handleAddToCart}
          >
            <ShoppingCart className="h-4 w-4" />
            Add to Cart
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}