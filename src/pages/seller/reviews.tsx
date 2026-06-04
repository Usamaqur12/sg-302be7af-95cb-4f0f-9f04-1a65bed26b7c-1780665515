"use client";

import { useState, useEffect } from "react";
import { SellerLayout } from "@/components/SellerLayout";
import { RoleGuard } from "@/components/RoleGuard";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star, ThumbsUp, MessageCircle, TrendingUp } from "lucide-react";

interface Review {
  id: string;
  customer: string;
  product: string;
  rating: number;
  comment: string;
  date: string;
  helpful?: number;
}

export default function SellerReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    averageRating: 0,
    totalReviews: 0,
    distribution: {
      5: 0,
      4: 0,
      3: 0,
      2: 0,
      1: 0,
    },
  });

  useEffect(() => {
    loadReviews();
  }, []);

  const loadReviews = async () => {
    try {
      // Mock data
      setStats({
        averageRating: 4.5,
        totalReviews: 128,
        distribution: {
          5: 80,
          4: 30,
          3: 10,
          2: 5,
          1: 3,
        },
      });

      setReviews([
        {
          id: "1",
          customer: "John Doe",
          product: "Premium Headphones",
          rating: 5,
          comment: "Excellent product! Very satisfied with the quality.",
          date: "2024-01-15",
        },
        {
          id: "2",
          customer: "Jane Smith",
          product: "Wireless Mouse",
          rating: 4,
          comment: "Good product, fast shipping.",
          date: "2024-01-14",
        },
      ]);
    } catch (error) {
      console.error("Failed to load reviews:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <RoleGuard allowedRoles={["seller"]}>
      <SellerLayout>
        <div className="space-y-8">
          <div>
            <h1 className="text-3xl font-bold font-serif mb-2">Customer Reviews</h1>
            <p className="text-muted-foreground">Manage and respond to customer feedback</p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-muted-foreground">Average Rating</p>
                  <Star className="h-4 w-4 text-amber-500" />
                </div>
                <p className="text-2xl font-bold">{stats.averageRating}</p>
                <div className="flex items-center mt-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`h-4 w-4 ${
                        star <= Math.round(stats.averageRating)
                          ? "fill-amber-500 text-amber-500"
                          : "text-gray-300"
                      }`}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-muted-foreground">Total Reviews</p>
                  <MessageCircle className="h-4 w-4 text-muted-foreground" />
                </div>
                <p className="text-2xl font-bold">{stats.totalReviews}</p>
                <p className="text-xs text-green-600 mt-1">+23 this month</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-muted-foreground">5-Star Reviews</p>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </div>
                <p className="text-2xl font-bold">{stats.distribution[5]}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {((stats.distribution[5] / stats.totalReviews) * 100).toFixed(0)}% of total
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-muted-foreground">Response Rate</p>
                  <MessageCircle className="h-4 w-4 text-muted-foreground" />
                </div>
                <p className="text-2xl font-bold">89%</p>
                <p className="text-xs text-green-600 mt-1">Above average</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardContent className="pt-6">
              <div className="space-y-6">
                {reviews.map((review) => (
                  <div key={review.id} className="border-b pb-6 last:border-0 last:pb-0">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="font-semibold text-sm mb-1">{review.product}</p>
                        <p className="text-sm text-muted-foreground">by {review.customer}</p>
                      </div>
                      <Badge variant="secondary">
                        <Star className="h-3 w-3 mr-1 fill-current" />
                        {review.rating}
                      </Badge>
                    </div>

                    <p className="text-sm mb-3">{review.comment}</p>

                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span>{new Date(review.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
                      <span className="flex items-center gap-1">
                        <ThumbsUp className="h-3 w-3" />
                        {review.helpful} found helpful
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </SellerLayout>
    </RoleGuard>
  );
}