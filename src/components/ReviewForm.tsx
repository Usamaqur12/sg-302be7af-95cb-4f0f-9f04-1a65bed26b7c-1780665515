"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Star } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { analytics } from "@/lib/analytics";

interface ReviewFormProps {
  productId: string;
  productTitle: string;
  onReviewSubmitted?: () => void;
}

export function ReviewForm({ productId, productTitle, onReviewSubmitted }: ReviewFormProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to submit a review",
        variant: "destructive",
      });
      return;
    }

    if (rating === 0) {
      toast({
        title: "Rating Required",
        description: "Please select a star rating",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.from("reviews").insert({
        product_id: productId,
        user_id: user.id,
        rating,
        comment: comment.trim() || null,
      });

      if (error) throw error;

      // Track review submission
      analytics.reviewSubmitted({
        productId,
        rating,
      });

      toast({
        title: "Review Submitted",
        description: "Thank you for your feedback!",
      });

      // Reset form
      setRating(0);
      setComment("");

      // Notify parent component
      if (onReviewSubmitted) {
        onReviewSubmitted();
      }
    } catch (error: any) {
      console.error("Review submission error:", error);
      
      if (error.code === "23505") {
        toast({
          title: "Duplicate Review",
          description: "You've already reviewed this product",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to submit review. Please try again.",
          variant: "destructive",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="p-6 border border-border rounded-lg bg-muted/30 text-center">
        <p className="text-muted-foreground mb-4">Please log in to write a review</p>
        <Button variant="outline">Log In</Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="p-6 border border-border rounded-lg bg-card">
      <h3 className="text-xl font-semibold mb-4">Write a Review</h3>

      <div className="mb-6">
        <label className="block text-sm font-medium mb-2">Your Rating</label>
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              onMouseEnter={() => setHoveredRating(star)}
              onMouseLeave={() => setHoveredRating(0)}
              className="transition-transform hover:scale-110"
            >
              <Star
                className={`h-8 w-8 ${
                  star <= (hoveredRating || rating)
                    ? "fill-warning text-warning"
                    : "text-muted-foreground"
                }`}
              />
            </button>
          ))}
        </div>
        {rating > 0 && (
          <p className="text-sm text-muted-foreground mt-2">
            {rating === 5 && "Excellent!"}
            {rating === 4 && "Very Good"}
            {rating === 3 && "Good"}
            {rating === 2 && "Fair"}
            {rating === 1 && "Poor"}
          </p>
        )}
      </div>

      <div className="mb-6">
        <label htmlFor="comment" className="block text-sm font-medium mb-2">
          Your Review (Optional)
        </label>
        <Textarea
          id="comment"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder={`Share your experience with ${productTitle}...`}
          rows={4}
          maxLength={1000}
        />
        <p className="text-sm text-muted-foreground mt-1">
          {comment.length}/1000 characters
        </p>
      </div>

      <Button type="submit" disabled={loading || rating === 0} className="w-full">
        {loading ? "Submitting..." : "Submit Review"}
      </Button>
    </form>
  );
}