import type { NextApiRequest, NextApiResponse } from "next";
import { successResponse, errorResponse, notFoundResponse } from "@/lib/api-response";
import { productService } from "@/services/productService";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;

  try {
    if (req.method === "GET") {
      // Get single product
      const product = await productService.getProductById(id as string);
      
      if (!product || product.status !== "approved") {
        return res.status(404).json(notFoundResponse("Product"));
      }

      return res.status(200).json(successResponse("Product retrieved successfully", product));
    }

    if (req.method === "PUT" || req.method === "DELETE") {
      return res
        .status(403)
        .json(errorResponse("Manage products from the admin or seller portal so ownership rules are enforced"));
    }

    return res.status(405).json(errorResponse("Method not allowed"));
  } catch (error: unknown) {
    console.error("Product API error:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return res.status(500).json(errorResponse(message));
  }
}
