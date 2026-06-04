"use client";

import { SellerLayout } from "@/components/SellerLayout";
import { RoleGuard } from "@/components/RoleGuard";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star, ThumbsUp, MessageCircle, TrendingUp } from "lucide-react";

export default function SellerReviewsPage() {
  // Mock review data
  const reviews = [
    {
      id: 1,
      product: "Premium Wireless Headphones",
      customer: "Sarah Johnson",
      rating: 5,
      comment: "Absolutely amazing quality! Sound is crystal clear and battery lasts forever.",
      date: "2026-06-03",
      helpful: 12,
    },
    {
      id: 2,
      product: "Smart Watch Pro",
      customer: "Mike Chen",
      rating: 4,
      comment: "Great product, works well. Only minor issue is the strap could be better quality.",
      date: "2026-06-02",
      helpful: 8,
    },
    {
      id: 3,
      product: "Laptop Stand Aluminum",
      customer: "Emma Davis",
      rating: 5,
      comment: "Perfect height and very sturdy. My back pain is gone after using this!",
      date: "2026-06-01",
      helpful: 15,
    },
  ];

  const stats = {
    averageRating: 4.7,
    totalReviews: 342,
    fiveStars: 245,
    fourStars: 67,
    threeStars: 18,
    twoStars: 8,
    oneStars: 4,
  };

  return (
    <RoleGuard allowedRoles={["vendor"]}>
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
                <p className="text-2xl font-bold">{stats.fiveStars}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {((stats.fiveStars / stats.totalReviews) * 100).toFixed(0)}% of total
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