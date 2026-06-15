import { CustomerLayout } from "@/components/CustomerLayout";
import { ProductCard } from "@/components/ProductCard";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { Heart } from "lucide-react";

interface WishlistProduct {
  id: string;
  title: string;
  price: number;
  compare_at_price: number | null;
  deal_expires_at: string | null;
  rating: number;
  total_reviews: number;
  images: { url: string }[];
  seller: { business_name: string };
}

export default function WishlistPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [products, setProducts] = useState<WishlistProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/");
      return;
    }

    if (user) {
      fetchWishlist();
    }
  }, [user, authLoading, router]);

  const fetchWishlist = async () => {
    if (!user) return;

    const { data: wishlistData } = await supabase
      .from("wishlists")
      .select("product_id")
      .eq("user_id", user.id);

    if (wishlistData && wishlistData.length > 0) {
      const productIds = wishlistData.map((item) => item.product_id);

      const { data: productsData } = await supabase
        .from("products")
        .select(
          `
          id,
          title,
          price,
          compare_at_price,
          deal_expires_at,
          rating,
          total_reviews,
          images:product_images(url),
          seller:seller_profiles(business_name)
        `
        )
        .in("id", productIds)
        .eq("status", "approved");

      setProducts((productsData as any) || []);
    }

    setLoading(false);
  };

  if (authLoading || loading) {
    return (
      <CustomerLayout>
        <div className="container py-16 text-center">
          <p className="text-muted-foreground">Loading wishlist...</p>
        </div>
      </CustomerLayout>
    );
  }

  return (
    <CustomerLayout>
      <div className="container py-8">
        <div className="flex items-center gap-3 mb-8">
          <Heart className="h-8 w-8 fill-destructive text-destructive" />
          <h1 className="text-3xl font-bold">My Wishlist</h1>
        </div>

        {products.length === 0 ? (
          <div className="text-center py-16">
            <Heart className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-2xl font-semibold mb-2">Your wishlist is empty</h2>
            <p className="text-muted-foreground mb-6">
              Save products you love and come back to them later
            </p>
          </div>
        ) : (
          <>
            <p className="text-muted-foreground mb-6">
              {products.length} {products.length === 1 ? "item" : "items"} saved
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {products.map((product) => (
                <ProductCard
                  key={product.id}
                  id={product.id}
                  title={product.title}
                  price={product.price}
                  compareAtPrice={product.compare_at_price || undefined}
                  image={product.images[0]?.url || "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&h=600&fit=crop"}
                  rating={product.rating}
                  reviewCount={product.total_reviews}
                  sellerName={product.seller?.business_name || "Unknown"}
                  dealExpiresAt={product.deal_expires_at}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </CustomerLayout>
  );
}
