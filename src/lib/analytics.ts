import posthog from "posthog-js";

// Initialize PostHog
export const initAnalytics = () => {
  if (typeof window !== "undefined" && process.env.NEXT_PUBLIC_POSTHOG_KEY) {
    posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
      api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://app.posthog.com",
      loaded: (posthog) => {
        if (process.env.NODE_ENV === "development") {
          posthog.opt_out_capturing();
        }
      },
      capture_pageview: false, // We'll manually capture pageviews
      capture_pageleave: true,
    });
  }
};

export const analytics = {
  // Page views
  pageView: (pageName: string, properties?: Record<string, any>) => {
    if (typeof window !== "undefined" && posthog) {
      posthog.capture("$pageview", {
        page: pageName,
        ...properties,
      });
    }
  },

  // User identification
  /**
   * Identify a user
   */
  identify: (userId: string, properties?: Record<string, any>) => {
    if (typeof window !== "undefined" && posthog) {
      posthog.identify(userId, properties);
    }
  },

  // User properties
  setUserProperties: (properties: Record<string, any>) => {
    if (typeof window !== "undefined" && posthog) {
      posthog.people.set(properties);
    }
  },

  // E-commerce events
  productViewed: (product: {
    id: string;
    name: string;
    price: number;
    category?: string;
    seller?: string;
  }) => {
    if (typeof window !== "undefined" && posthog) {
      posthog.capture("product_viewed", {
        product_id: product.id,
        product_name: product.name,
        price: product.price,
        category: product.category,
        seller: product.seller,
      });
    }
  },

  addToCart: (product: {
    id: string;
    name: string;
    price: number;
    quantity: number;
  }) => {
    if (typeof window !== "undefined" && posthog) {
      posthog.capture("add_to_cart", {
        product_id: product.id,
        product_name: product.name,
        price: product.price,
        quantity: product.quantity,
        value: product.price * product.quantity,
      });
    }
  },

  removeFromCart: (product: {
    id: string;
    name: string;
    price: number;
  }) => {
    if (typeof window !== "undefined" && posthog) {
      posthog.capture("remove_from_cart", {
        product_id: product.id,
        product_name: product.name,
        price: product.price,
      });
    }
  },

  checkoutStarted: (cart: {
    items: number;
    total: number;
  }) => {
    if (typeof window !== "undefined" && posthog) {
      posthog.capture("checkout_started", {
        items_count: cart.items,
        cart_total: cart.total,
      });
    }
  },

  orderCompleted: (order: {
    id: string;
    total: number;
    itemsCount: number;
  }) => {
    if (typeof window !== "undefined" && posthog) {
      posthog.capture("order_completed", {
        order_id: order.id,
        revenue: order.total,
        items_count: order.itemsCount,
      });
    }
  },

  // Wishlist events
  addToWishlist: (product: {
    id: string;
    name: string;
    price: number;
  }) => {
    if (typeof window !== "undefined" && posthog) {
      posthog.capture("add_to_wishlist", {
        product_id: product.id,
        product_name: product.name,
        price: product.price,
      });
    }
  },

  removeFromWishlist: (product: {
    id: string;
    name: string;
  }) => {
    if (typeof window !== "undefined" && posthog) {
      posthog.capture("remove_from_wishlist", {
        product_id: product.id,
        product_name: product.name,
      });
    }
  },

  // Search events
  search: (query: string, resultsCount: number) => {
    if (typeof window !== "undefined" && posthog) {
      posthog.capture("search", {
        search_query: query,
        results_count: resultsCount,
      });
    }
  },

  /**
   * Track purchase completed
   */
  purchaseCompleted: (orderId: string, total: number, items: Array<{ id: string; name: string; price: number; quantity: number }>) => {
    if (typeof window !== "undefined" && posthog) {
      posthog.capture("purchase_completed", {
        order_id: orderId,
        total,
        items,
        revenue: total,
      });
    }
  },

  /**
   * Track search performed
   */
  searchPerformed: (query: string, resultCount: number) => {
    if (typeof window !== "undefined" && posthog) {
      posthog.capture("search_performed", {
        query,
        result_count: resultCount,
      });
    }
  },

  // Review events
  reviewSubmitted: (review: {
    productId: string;
    rating: number;
  }) => {
    if (typeof window !== "undefined" && posthog) {
      posthog.capture("review_submitted", {
        product_id: review.productId,
        rating: review.rating,
      });
    }
  },

  // Seller events
  sellerRegistered: (sellerId: string) => {
    if (typeof window !== "undefined" && posthog) {
      posthog.capture("seller_registered", {
        seller_id: sellerId,
      });
    }
  },

  productListed: (product: {
    id: string;
    sellerId: string;
    category: string;
  }) => {
    if (typeof window !== "undefined" && posthog) {
      posthog.capture("product_listed", {
        product_id: product.id,
        seller_id: product.sellerId,
        category: product.category,
      });
    }
  },

  // Generic event tracking
  track: (eventName: string, properties?: Record<string, any>) => {
    if (typeof window !== "undefined" && posthog) {
      posthog.capture(eventName, properties);
    }
  },

  // Reset on logout
  reset: () => {
    if (typeof window !== "undefined" && posthog) {
      posthog.reset();
    }
  },
};

export default analytics;