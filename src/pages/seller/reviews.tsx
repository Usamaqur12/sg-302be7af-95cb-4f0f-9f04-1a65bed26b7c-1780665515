"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { CheckCircle2, MessageCircle, Star, ThumbsUp } from "lucide-react";
import { SellerLayout } from "@/components/SellerLayout";
import { RoleGuard } from "@/components/RoleGuard";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useAuthContext } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

interface SellerReview {
  id: string;
  rating: number;
  title: string | null;
  comment: string | null;
  helpful_count: number | null;
  is_verified_purchase: boolean | null;
  created_at: string | null;
  product: { title: string } | null;
  customer: { full_name: string | null; email: string | null } | null;
}

export default function SellerReviewsPage() {
  const { user, loading: authLoading } = useAuthContext();
  const [reviews, setReviews] = useState<SellerReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadReviews = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    setError("");

    const { data: seller } = await supabase
      .from("seller_profiles")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!seller) {
      setError("Seller profile could not be loaded.");
      setLoading(false);
      return;
    }

    const { data: products } = await supabase
      .from("products")
      .select("id")
      .eq("seller_id", seller.id);
    const productIds = (products ?? []).map((product) => product.id);

    if (!productIds.length) {
      setReviews([]);
      setLoading(false);
      return;
    }

    const { data, error: reviewsError } = await supabase
      .from("reviews")
      .select(`
        id,
        rating,
        title,
        comment,
        helpful_count,
        is_verified_purchase,
        created_at,
        product:products!inner(title, seller_id),
        customer:profiles(full_name, email)
      `)
      .in("product_id", productIds)
      .order("created_at", { ascending: false });

    if (reviewsError) {
      setError("Reviews could not be loaded.");
      setLoading(false);
      return;
    }

    setReviews((data ?? []) as unknown as SellerReview[]);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    if (!authLoading && user) {
      loadReviews();
    }
  }, [authLoading, loadReviews, user]);

  const stats = useMemo(() => {
    const total = reviews.length;
    const average = total > 0
      ? reviews.reduce((sum, review) => sum + review.rating, 0) / total
      : 0;
    const fiveStar = reviews.filter((review) => review.rating === 5).length;
    const verified = reviews.filter((review) => review.is_verified_purchase).length;

    return { total, average, fiveStar, verified };
  }, [reviews]);

  const statCards = [
    { label: "Average Rating", value: stats.average.toFixed(1), icon: Star },
    { label: "Total Reviews", value: stats.total.toLocaleString(), icon: MessageCircle },
    { label: "Five-Star Reviews", value: stats.fiveStar.toLocaleString(), icon: Star },
    { label: "Verified Purchases", value: stats.verified.toLocaleString(), icon: CheckCircle2 },
  ];

  return (
    <RoleGuard allowedRoles={["seller"]}>
      <SellerLayout>
        <div className="space-y-8">
          <div>
            <h1 className="text-3xl font-bold">Customer Reviews</h1>
            <p className="text-muted-foreground">Feedback submitted for your products.</p>
          </div>

          {loading ? (
            <p className="py-16 text-center text-muted-foreground">Loading reviews...</p>
          ) : error ? (
            <Card className="border-destructive">
              <CardContent className="pt-6 text-destructive">{error}</CardContent>
            </Card>
          ) : (
            <>
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {statCards.map(({ label, value, icon: Icon }) => (
                  <Card key={label}>
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-muted-foreground">{label}</p>
                        <Icon className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <p className="mt-2 text-2xl font-bold font-mono">{value}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <Card>
                <CardContent className="pt-6">
                  {reviews.length === 0 ? (
                    <p className="py-10 text-center text-muted-foreground">No reviews yet.</p>
                  ) : (
                    <div className="space-y-6">
                      {reviews.map((review) => (
                        <div key={review.id} className="border-b pb-6 last:border-0">
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div>
                              <p className="font-semibold">{review.product?.title ?? "Product"}</p>
                              <p className="text-sm text-muted-foreground">
                                {review.customer?.full_name || review.customer?.email || "Customer"}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              {review.is_verified_purchase && (
                                <Badge variant="outline">Verified</Badge>
                              )}
                              <Badge variant="secondary">
                                <Star className="mr-1 h-3 w-3 fill-current" />
                                {review.rating}
                              </Badge>
                            </div>
                          </div>
                          {review.title && <p className="mt-3 font-medium">{review.title}</p>}
                          <p className="mt-1 text-sm">{review.comment || "No written comment."}</p>
                          <div className="mt-3 flex gap-4 text-xs text-muted-foreground">
                            <span>
                              {review.created_at
                                ? new Date(review.created_at).toLocaleDateString()
                                : "Unknown date"}
                            </span>
                            <span className="flex items-center gap-1">
                              <ThumbsUp className="h-3 w-3" />
                              {review.helpful_count ?? 0} helpful
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </SellerLayout>
    </RoleGuard>
  );
}
