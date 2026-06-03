import type { NextApiRequest, NextApiResponse } from "next";
import { successResponse, errorResponse, notFoundResponse } from "@/lib/api-response";
import { productService } from "@/services/productService";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;

  try {
    if (req.method === "GET") {
      // Get single product
      const product = await productService.getProductById(id as string);
      
      if (!product) {
        return res.status(404).json(notFoundResponse("Product"));
      }

      return res.status(200).json(successResponse("Product retrieved successfully", product));
    }

    if (req.method === "PUT") {
      // Update product
      const updates = req.body;
      const product = await productService.updateProduct(id as string, updates);
      return res.status(200).json(successResponse("Product updated successfully", product));
    }

    if (req.method === "DELETE") {
      // Delete product
      await productService.deleteProduct(id as string);
      return res.status(200).json(successResponse("Product deleted successfully"));
    }

    return res.status(405).json(errorResponse("Method not allowed"));
  } catch (error: any) {
    console.error("Product API error:", error);
    return res.status(500).json(errorResponse(error.message || "Internal server error"));
  }
}