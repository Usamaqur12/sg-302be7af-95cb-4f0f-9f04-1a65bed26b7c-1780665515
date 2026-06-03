"use client";

import { useState, useEffect } from "react";
import { Star, ThumbsUp } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";

interface Review {
  id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  helpful_count: number;
  user: {
    full_name: string;
  };
}

interface ReviewListProps {
  productId: string;
  refreshTrigger?: number;
}

export function ReviewList({ productId, refreshTrigger }: ReviewListProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<"recent" | "helpful" | "rating">("recent");

  useEffect(() => {
    fetchReviews();
  }, [productId, sortBy, refreshTrigger]);

  const fetchReviews = async () => {
    setLoading(true);

    let query = supabase
      .from("reviews")
      .select(
        `
        id,
        rating,
        comment,
        created_at,
        helpful_count,
        user:profiles(full_name)
      `
      )
      .eq("product_id", productId);

    // Apply sorting
    if (sortBy === "recent") {
      query = query.order("created_at", { ascending: false });
    } else if (sortBy === "helpful") {
      query = query.order("helpful_count", { ascending: false });
    } else if (sortBy === "rating") {
      query = query.order("rating", { ascending: false });
    }

    const { data, error } = await query;

    if (!error && data) {
      setReviews(data as any);
    }

    setLoading(false);
  };

  const handleHelpful = async (reviewId: string) => {
    // Increment helpful count
    const review = reviews.find((r) => r.id === reviewId);
    if (!review) return;

    const { error } = await supabase
      .from("reviews")
      .update({ helpful_count: review.helpful_count + 1 })
      .eq("id", reviewId);

    if (!error) {
      setReviews((prev) =>
        prev.map((r) =>
          r.id === reviewId ? { ...r, helpful_count: r.helpful_count + 1 } : r
        )
      );
    }
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Loading reviews...</p>
      </div>
    );
  }

  if (reviews.length === 0) {
    return (
      <div className="text-center py-12 bg-muted/30 rounded-lg">
        <Star className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
        <p className="text-lg font-medium mb-2">No Reviews Yet</p>
        <p className="text-muted-foreground">Be the first to review this product!</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold">Customer Reviews ({reviews.length})</h3>
        <div className="flex gap-2">
          <Button
            variant={sortBy === "recent" ? "default" : "outline"}
            size="sm"
            onClick={() => setSortBy("recent")}
          >
            Most Recent
          </Button>
          <Button
            variant={sortBy === "helpful" ? "default" : "outline"}
            size="sm"
            onClick={() => setSortBy("helpful")}
          >
            Most Helpful
          </Button>
          <Button
            variant={sortBy === "rating" ? "default" : "outline"}
            size="sm"
            onClick={() => setSortBy("rating")}
          >
            Highest Rated
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        {reviews.map((review) => (
          <Card key={review.id} className="p-6">
            <div className="flex items-start gap-4">
              <Avatar>
                <AvatarFallback>
                  {review.user?.full_name?.charAt(0).toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="font-medium">{review.user?.full_name || "Anonymous"}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`h-4 w-4 ${
                              star <= review.rating
                                ? "fill-warning text-warning"
                                : "text-muted-foreground"
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {new Date(review.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>

                {review.comment && (
                  <p className="text-muted-foreground mb-3">{review.comment}</p>
                )}

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleHelpful(review.id)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <ThumbsUp className="h-4 w-4 mr-2" />
                  Helpful ({review.helpful_count})
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}