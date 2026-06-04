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
  sellerId?: string;
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
  sellerId,
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

  return (
    <Card className="group relative h-full hover:shadow-xl transition-all duration-300 overflow-hidden">
      <CardContent className="p-4 flex flex-col h-full">
        {/* Wishlist Heart */}
        <button
          onClick={(e) => {
            e.preventDefault();
            toggleWishlist(id);
          }}
          className="absolute top-2 right-2 z-10 w-8 h-8 rounded-full bg-white/90 hover:bg-white shadow-md flex items-center justify-center transition-all hover:scale-110"
        >
          <Heart
            className={`h-4 w-4 transition-colors ${
              isInWishlist(id) ? "fill-destructive text-destructive" : "text-muted-foreground"
            }`}
          />
        </button>

        {/* Discount Badge */}
        {discount > 0 && (
          <Badge
            variant="destructive"
            className="absolute top-2 left-2 z-10 font-bold text-xs"
          >
            -{discount}%
          </Badge>
        )}

        {/* Product Image */}
        <Link href={`/products/${id}`} className="block mb-3">
          <div className="relative aspect-square rounded-lg overflow-hidden bg-muted">
            <Image
              src={image}
              alt={title}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
            />
          </div>
        </Link>

        {/* Product Info */}
        <div className="flex-1 flex flex-col">
          <Link href={`/products/${id}`}>
            <h3 className="font-medium text-sm line-clamp-2 mb-1 hover:text-primary transition-colors min-h-[40px]">
              {title}
            </h3>
          </Link>

          {/* Seller Name - Clickable */}
          {sellerId ? (
            <Link href={`/sellers/${sellerId}`} onClick={(e) => e.stopPropagation()}>
              <p className="text-xs text-muted-foreground mb-2 hover:text-primary transition-colors hover:underline">
                {sellerName}
              </p>
            </Link>
          ) : (
            <p className="text-xs text-muted-foreground mb-2">{sellerName}</p>
          )}

          {/* Rating */}
          <div className="flex items-center gap-1 mb-2">
            <div className="flex">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`h-3 w-3 ${
                    i < Math.floor(rating)
                      ? "fill-amber-400 text-amber-400"
                      : "text-muted-foreground/30"
                  }`}
                />
              ))}
            </div>
            <span className="text-xs text-muted-foreground">({reviewCount})</span>
          </div>

          {/* Price */}
          <div className="mt-auto">
            <div className="flex items-baseline gap-2 mb-3">
              <span className="text-lg font-bold text-primary">${price.toFixed(2)}</span>
              {compareAtPrice && (
                <span className="text-xs text-muted-foreground line-through">
                  ${compareAtPrice.toFixed(2)}
                </span>
              )}
            </div>

            {/* Add to Cart Button */}
            <Button
              size="sm"
              className="w-full opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={handleAddToCart}
            >
              <ShoppingCart className="mr-2 h-4 w-4" />
              Add to Cart
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}