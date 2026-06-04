"use client";

import Link from "next/link";
import Image from "next/image";
import { Heart, ShoppingCart, Star } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useCart } from "@/contexts/CartContext";
import { useWishlist } from "@/hooks/useWishlist";
import { useToast } from "@/hooks/use-toast";

interface ProductCardProps {
  id: string;
  title: string;
  price: number;
  compareAtPrice?: number;
  image: string;
  rating: number;
  reviewCount: number;
  sellerName: string;
  onAddToCart?: () => void;
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
  onAddToCart,
}: ProductCardProps) {
  const { addToCart } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const { toast } = useToast();

  const discount = compareAtPrice
    ? Math.round(((compareAtPrice - price) / compareAtPrice) * 100)
    : 0;

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    await addToCart(id, 1);
    toast({
      title: "Added to Cart",
      description: `${title} has been added to your cart`,
    });
    onAddToCart?.();
  };

  const handleWishlistToggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    await toggleWishlist(id, title, price);
  };

  const inWishlist = isInWishlist(id);

  return (
    <Card className="group overflow-hidden hover:shadow-lg transition-shadow">
      <Link href={`/products/${id}`}>
        <div className="relative aspect-square overflow-hidden bg-muted">
          <Image
            src={image}
            alt={title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
          {discount > 0 && (
            <Badge className="absolute top-3 right-3 bg-destructive text-destructive-foreground">
              -{discount}%
            </Badge>
          )}
          <button
            onClick={handleWishlistToggle}
            className="absolute top-3 left-3 p-2 bg-white/90 hover:bg-white rounded-full transition-colors z-10"
          >
            <Heart
              className={`h-5 w-5 transition-colors ${
                inWishlist ? "fill-destructive text-destructive" : "text-muted-foreground"
              }`}
            />
          </button>
        </div>
      </Link>

      <CardContent className="p-4">
        <Link href={`/products/${id}`}>
          <p className="text-sm text-muted-foreground mb-1">{sellerName}</p>
          <h3 className="font-medium mb-2 line-clamp-2 hover:text-accent transition-colors">
            {title}
          </h3>

          <div className="flex items-center gap-2 mb-3">
            <div className="flex items-center gap-1">
              <Star className="h-4 w-4 fill-warning text-warning" />
              <span className="text-sm font-medium font-mono">{rating.toFixed(1)}</span>
            </div>
            <span className="text-sm text-muted-foreground">({reviewCount})</span>
          </div>

          <div className="flex items-baseline gap-2 mb-3">
            <span className="text-xl font-bold font-mono">${price.toFixed(2)}</span>
            {compareAtPrice && (
              <span className="text-sm text-muted-foreground line-through font-mono">
                ${compareAtPrice.toFixed(2)}
              </span>
            )}
          </div>
        </Link>

        <Button onClick={handleAddToCart} className="w-full" size="sm">
          <ShoppingCart className="mr-2 h-4 w-4" />
          Add to Cart
        </Button>
      </CardContent>
    </Card>
  );
}