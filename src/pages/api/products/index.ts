import type { NextApiRequest, NextApiResponse } from "next";
import { successResponse, errorResponse } from "@/lib/api-response";
import { productService } from "@/services/productService";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method === "GET") {
      // Get products with filters
      const { category_id, seller_id, search, min_price, max_price, limit, offset } = req.query;

      const { products, total } = await productService.getProducts({
        category_id: category_id as string,
        seller_id: seller_id as string,
        search: search as string,
        min_price: min_price ? parseFloat(min_price as string) : undefined,
        max_price: max_price ? parseFloat(max_price as string) : undefined,
        limit: limit ? parseInt(limit as string) : 20,
        offset: offset ? parseInt(offset as string) : 0,
      });

      return res.status(200).json(
        successResponse("Products retrieved successfully", products, {
          total,
          page: offset ? Math.floor(parseInt(offset as string) / 20) + 1 : 1,
          limit: limit ? parseInt(limit as string) : 20,
        })
      );
    }

    if (req.method === "POST") {
      return res
        .status(403)
        .json(errorResponse("Create products from the seller portal so approval and ownership rules are enforced"));
    }

    return res.status(405).json(errorResponse("Method not allowed"));
  } catch (error: unknown) {
    console.error("Products API error:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return res.status(500).json(errorResponse(message));
  }
}
