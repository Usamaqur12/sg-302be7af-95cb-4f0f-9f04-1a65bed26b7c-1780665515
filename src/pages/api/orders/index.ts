import type { NextApiRequest, NextApiResponse } from "next";
import { successResponse, errorResponse, unauthorizedResponse, validationErrorResponse } from "@/lib/api-response";
import { orderService } from "@/services/orderService";
import { validateSchema, createOrderSchema } from "@/lib/validation";
import { supabase } from "@/integrations/supabase/client";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Get user from session
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return res.status(401).json(unauthorizedResponse());
    }

    if (req.method === "GET") {
      // Get customer's orders
      const orders = await orderService.getCustomerOrders(user.id);
      return res.status(200).json(successResponse("Orders retrieved successfully", orders));
    }

    if (req.method === "POST") {
      // Create new order
      const validation = validateSchema(createOrderSchema, req.body);
      
      if (!validation.success) {
        return res.status(400).json(validationErrorResponse(validation.errors!));
      }

      const orderData = await orderService.createOrder({
        customer_id: user.id,
        items: req.body.items,
        shipping_full_name: req.body.shipping_full_name,
        shipping_phone: req.body.shipping_phone,
        shipping_address: req.body.shipping_address,
        shipping_city: req.body.shipping_city,
        shipping_state: req.body.shipping_state,
        shipping_postal_code: req.body.shipping_postal_code,
        shipping_country: req.body.shipping_country,
      });

      return res.status(201).json(successResponse("Order created successfully", orderData));
    }

    return res.status(405).json(errorResponse("Method not allowed"));
  } catch (error: any) {
    console.error("Orders API error:", error);
    return res.status(500).json(errorResponse(error.message || "Internal server error"));
  }
}