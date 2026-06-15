import type { NextApiRequest, NextApiResponse } from "next";
import type { RowDataPacket } from "mysql2/promise";
import {
  calculatePromotionSummary,
  type PromotionCartItem,
  type PromotionLike,
  type PromotionSummary,
} from "@/lib/promotions";
import { canUseLocalDevAuthFallback, queryRows } from "@/lib/server/db";
import { readLocalDatabase } from "@/lib/server/local-db";
import { readSession } from "@/lib/server/session";

interface PromotionRow extends RowDataPacket, PromotionLike {}

function unique(values: Array<string | null | undefined>) {
  return [...new Set(values.filter(Boolean).map(String))];
}

function normalizeItems(value: unknown): PromotionCartItem[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      const row = item as Record<string, unknown>;
      return {
        product_id: String(row.product_id || ""),
        seller_id: row.seller_id ? String(row.seller_id) : null,
        price: Number(row.price || 0),
        quantity: Number(row.quantity || 0),
        title: row.title ? String(row.title) : undefined,
      };
    })
    .filter((item) => item.product_id && item.price > 0 && item.quantity > 0);
}

function sameId(left: unknown, right: unknown) {
  return String(left || "") === String(right || "");
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<{ summary?: PromotionSummary; error?: string }>
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const session = await readSession(req);
  if (!session) {
    return res.status(401).json({ error: "Authentication required" });
  }

  const items = normalizeItems(req.body?.items);
  if (!items.length) {
    return res.status(200).json({ summary: calculatePromotionSummary([], []) });
  }

  const sellerIds = unique(items.map((item) => item.seller_id));
  const productIds = unique(items.map((item) => item.product_id));

  try {
    if (canUseLocalDevAuthFallback()) {
      const db = await readLocalDatabase();
      const promotions = db.promotion_requests.filter((promotion) => {
        const sellerMatch = sellerIds.some((sellerId) => sameId(promotion.seller_id, sellerId));
        const productMatch = !promotion.product_id || productIds.some((productId) => sameId(promotion.product_id, productId));
        return sellerMatch && productMatch;
      }) as unknown as PromotionLike[];

      return res.status(200).json({ summary: calculatePromotionSummary(items, promotions) });
    }

    if (!sellerIds.length || !productIds.length) {
      return res.status(200).json({ summary: calculatePromotionSummary(items, []) });
    }

    const sellerPlaceholders = sellerIds.map(() => "?").join(", ");
    const productPlaceholders = productIds.map(() => "?").join(", ");
    const promotions = await queryRows<PromotionRow[]>(
      `SELECT
         id, seller_id, product_id, request_type, title, discount_type,
         discount_value, min_order_amount, max_discount_amount, budget_amount,
         start_at, end_at, status
       FROM promotion_requests
       WHERE seller_id IN (${sellerPlaceholders})
         AND (product_id IS NULL OR product_id IN (${productPlaceholders}))
         AND status IN ('approved', 'active')
         AND (start_at IS NULL OR start_at <= NOW())
         AND (end_at IS NULL OR end_at >= NOW())`,
      [...sellerIds, ...productIds]
    );

    return res.status(200).json({ summary: calculatePromotionSummary(items, promotions) });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not calculate promotions";
    return res.status(500).json({ error: message });
  }
}
