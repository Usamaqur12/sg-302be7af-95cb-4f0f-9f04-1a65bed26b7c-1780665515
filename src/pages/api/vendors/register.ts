import type { NextApiRequest, NextApiResponse } from "next";
import { successResponse, errorResponse, unauthorizedResponse, validationErrorResponse } from "@/lib/api-response";
import { vendorService } from "@/services/vendorService";
import { validateSchema, createVendorSchema } from "@/lib/validation";
import { supabase } from "@/integrations/supabase/client";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json(errorResponse("Method not allowed"));
  }

  try {
    // Get user from session
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return res.status(401).json(unauthorizedResponse());
    }

    // Validate input
    const validation = validateSchema(createVendorSchema, req.body);
    
    if (!validation.success) {
      return res.status(400).json(validationErrorResponse(validation.errors!));
    }

    // Check if user already has a vendor profile
    const existing = await vendorService.getVendorByUserId(user.id);
    if (existing) {
      return res.status(400).json(errorResponse("Vendor profile already exists"));
    }

    // Register vendor
    const vendorData = await vendorService.registerVendor(user.id, {
      business_name: validation.data!.business_name,
      business_description: validation.data!.description || "",
      business_type: validation.data!.business_type,
      business_address: validation.data!.business_address,
      bank_account_number: validation.data!.bank_account_number,
      bank_name: validation.data!.bank_name,
      bank_routing_number: validation.data!.bank_routing_number,
    });

    return res.status(201).json(successResponse("Vendor registered successfully", vendorData));
  } catch (error: any) {
    console.error("Vendor registration error:", error);
    return res.status(500).json(errorResponse(error.message || "Internal server error"));
  }
}