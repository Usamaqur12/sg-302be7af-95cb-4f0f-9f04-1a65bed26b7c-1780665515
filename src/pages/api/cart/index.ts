import type { NextApiRequest, NextApiResponse } from "next";
import { successResponse, errorResponse, unauthorizedResponse } from "@/lib/api-response";
import { cartService } from "@/services/cartService";
import { supabase } from "@/integrations/supabase/client";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Get user from session
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return res.status(401).json(unauthorizedResponse());
    }

    if (req.method === "GET") {
      // Get user's cart
      const cart = await cartService.getCart(user.id);
      return res.status(200).json(successResponse("Cart retrieved successfully", cart));
    }

    if (req.method === "POST") {
      // Add item to cart
      const { product_id, quantity, variant_id } = req.body;
      const cartItem = await cartService.addToCart(user.id, product_id, quantity, variant_id);
      return res.status(201).json(successResponse("Item added to cart", cartItem));
    }

    return res.status(405).json(errorResponse("Method not allowed"));
  } catch (error: any) {
    console.error("Cart API error:", error);
    return res.status(500).json(errorResponse(error.message || "Internal server error"));
  }
}