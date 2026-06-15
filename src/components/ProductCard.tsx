"use client";

import Link from "next/link";
import Image from "next/image";
import { Heart, ShoppingCart, Star, Timer } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useCart } from "@/contexts/CartContext";
import { useMarketplaceSettings } from "@/contexts/MarketplaceSettingsContext";
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
  dealExpiresAt?: string | null;
  sponsored?: boolean;
  sponsoredCampaignId?: string;
  onAddToCart?: () => void;
}

interface ActivePromotion {
  id: string;
  request_type: string;
  title: string;
  discount_type: string | null;
  discount_value: number;
  min_order_amount: number;
  max_discount_amount: number;
}

function promotionLabel(promotion: ActivePromotion) {
  const type = promotion.request_type.toLowerCase().replaceAll("_", " ");
  const value = Number(promotion.discount_value || 0);
  const discount = promotion.discount_type === "percentage"
    ? `${value}% off`
    : value > 0
      ? `Rs ${value.toLocaleString()} off`
      : "";

  if (type.includes("free shipping")) return "Free shipping";
  if (type.includes("bundle")) return discount ? `Bundle ${discount}` : "Bundle deal";
  if (type.includes("coin")) return discount ? `Coins ${discount}` : "Coins discount";
  if (type.includes("flash") || type.includes("drz")) return discount ? `Flash ${discount}` : "Flash deal";
  if (type.includes("program")) return promotion.title || "Seller program";
  if (type.includes("voucher")) return discount || promotion.title || "Seller voucher";
  return discount || promotion.title || "Seller offer";
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
  dealExpiresAt,
  sponsored = false,
  sponsoredCampaignId,
  onAddToCart,
}: ProductCardProps) {
  const { addToCart } = useCart();
  const { formatPrice } = useMarketplaceSettings();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const { toast } = useToast();
  const [promotions, setPromotions] = useState<ActivePromotion[]>([]);

  const discount = compareAtPrice
    ? Math.round(((compareAtPrice - price) / compareAtPrice) * 100)
    : 0;
  const [now, setNow] = useState(() => Date.now());
  const impressionSent = useRef(false);
  const dealEndTime = dealExpiresAt ? new Date(dealExpiresAt).getTime() : 0;
  const dealRemaining = dealEndTime - now;
  const showCountdown = Number.isFinite(dealEndTime) && dealRemaining > 0;

  const trackSponsoredEvent = useCallback((eventType: "impression" | "click") => {
    if (!sponsored || !sponsoredCampaignId || typeof window === "undefined") return;

    const body = JSON.stringify({
      campaignId: sponsoredCampaignId,
      productId: id,
      eventType,
    });

    if (navigator.sendBeacon) {
      navigator.sendBeacon("/api/marketing/track", new Blob([body], { type: "application/json" }));
      return;
    }

    fetch("/api/marketing/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      keepalive: true,
    }).catch(() => undefined);
  }, [id, sponsored, sponsoredCampaignId]);

  useEffect(() => {
    if (!dealExpiresAt) return;
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [dealExpiresAt]);

  useEffect(() => {
    if (!sellerId) {
      setPromotions([]);
      return;
    }

    let active = true;
    const params = new URLSearchParams({ productId: id, sellerId });
    fetch(`/api/promotions/active?${params.toString()}`)
      .then((response) => response.ok ? response.json() : { promotions: [] })
      .then((payload) => {
        if (active) setPromotions(Array.isArray(payload.promotions) ? payload.promotions : []);
      })
      .catch(() => {
        if (active) setPromotions([]);
      });

    return () => {
      active = false;
    };
  }, [id, sellerId]);

  useEffect(() => {
    if (!sponsored || !sponsoredCampaignId || impressionSent.current) return;
    impressionSent.current = true;
    trackSponsoredEvent("impression");
  }, [sponsored, sponsoredCampaignId, trackSponsoredEvent]);

  const countdownLabel = (() => {
    if (!showCountdown) return "";
    const totalSeconds = Math.max(0, Math.floor(dealRemaining / 1000));
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    if (days > 0) return `${days}d ${hours}h ${minutes}m`;
    return `${hours}h ${minutes}m ${seconds}s`;
  })();

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    trackSponsoredEvent("click");
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
        {sponsored ? (
          <Badge className="absolute top-2 left-2 z-10 bg-accent text-accent-foreground text-xs font-bold">
            Sponsored
          </Badge>
        ) : discount > 0 && (
          <Badge
            variant="destructive"
            className="absolute top-2 left-2 z-10 font-bold text-xs"
          >
            -{discount}%
          </Badge>
        )}

        {/* Product Image */}
        <Link href={`/products/${id}`} className="block mb-3" onClick={() => trackSponsoredEvent("click")}>
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
          <Link href={`/products/${id}`} onClick={() => trackSponsoredEvent("click")}>
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

          {promotions.length > 0 && (
            <div className="mb-2 flex flex-wrap gap-1.5">
              {promotions.map((promotion) => (
                <Badge
                  key={promotion.id}
                  variant="outline"
                  className="border-amber-300 bg-amber-50 px-1.5 py-0 text-[10px] font-semibold text-amber-800"
                >
                  {promotionLabel(promotion)}
                </Badge>
              ))}
            </div>
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
            <div className="mb-3 flex flex-wrap items-baseline gap-x-2 gap-y-1">
              <span className="break-words text-lg font-bold text-primary">{formatPrice(price)}</span>
              {compareAtPrice && (
                <span className="text-xs text-muted-foreground line-through">
                  {formatPrice(compareAtPrice)}
                </span>
              )}
            </div>
            {showCountdown && (
              <div className="mb-3 flex items-center gap-2 rounded-md border border-destructive/20 bg-destructive/10 px-2 py-1.5 text-xs font-semibold text-destructive">
                <Timer className="h-3.5 w-3.5" />
                <span className="min-w-0 break-words">Sale ends {countdownLabel}</span>
              </div>
            )}

            {/* Add to Cart Button */}
            <Button
              size="sm"
              className="w-full transition-opacity md:opacity-0 md:group-hover:opacity-100"
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
