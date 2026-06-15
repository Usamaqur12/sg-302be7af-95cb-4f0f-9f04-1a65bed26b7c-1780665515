import type { NextApiRequest, NextApiResponse } from "next";
import type { RowDataPacket } from "mysql2/promise";
import { canUseLocalDevAuthFallback, queryRows } from "@/lib/server/db";
import { readLocalDatabase } from "@/lib/server/local-db";

interface ActivePromotion {
  id: string;
  request_type: string;
  title: string;
  discount_type: string | null;
  discount_value: number;
  min_order_amount: number;
  max_discount_amount: number;
}

function sameId(left: unknown, right: unknown) {
  return String(left || "") === String(right || "");
}

function isLivePromotion(row: Record<string, unknown>, nowMs = Date.now()) {
  const status = String(row.status || "");
  if (!["approved", "active"].includes(status)) return false;
  const startAt = row.start_at ? new Date(String(row.start_at)).getTime() : 0;
  const endAt = row.end_at ? new Date(String(row.end_at)).getTime() : Number.POSITIVE_INFINITY;
  return (Number.isNaN(startAt) || startAt <= nowMs) && (Number.isNaN(endAt) || endAt >= nowMs);
}

function cleanPromotion(row: Record<string, unknown>): ActivePromotion {
  return {
    id: String(row.id),
    request_type: String(row.request_type || "promotion"),
    title: String(row.title || "Seller promotion"),
    discount_type: row.discount_type ? String(row.discount_type) : null,
    discount_value: Number(row.discount_value || 0),
    min_order_amount: Number(row.min_order_amount || 0),
    max_discount_amount: Number(row.max_discount_amount || 0),
  };
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<{ promotions: ActivePromotion[]; error?: string }>
) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ promotions: [], error: "Method not allowed" });
  }

  const productId = String(req.query.productId || "");
  const sellerId = String(req.query.sellerId || "");
  if (!productId || !sellerId) {
    return res.status(400).json({ promotions: [], error: "productId and sellerId are required" });
  }

  try {
    if (canUseLocalDevAuthFallback()) {
      const db = await readLocalDatabase();
      const promotions = db.promotion_requests
        .filter((row) =>
          sameId(row.seller_id, sellerId) &&
          (!row.product_id || sameId(row.product_id, productId)) &&
          isLivePromotion(row)
        )
        .map(cleanPromotion)
        .slice(0, 4);

      return res.status(200).json({ promotions });
    }

    const rows = await queryRows<Array<RowDataPacket & ActivePromotion>>(
      `SELECT id, request_type, title, discount_type, discount_value, min_order_amount, max_discount_amount
       FROM promotion_requests
       WHERE seller_id = ?
         AND (product_id IS NULL OR product_id = ?)
         AND status IN ('approved', 'active')
         AND (start_at IS NULL OR start_at <= NOW())
         AND (end_at IS NULL OR end_at >= NOW())
       ORDER BY
         CASE WHEN product_id = ? THEN 0 ELSE 1 END,
         created_at DESC
       LIMIT 4`,
      [sellerId, productId, productId]
    );

    return res.status(200).json({ promotions: rows.map((row) => cleanPromotion(row as unknown as Record<string, unknown>)) });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not load promotions";
    return res.status(500).json({ promotions: [], error: message });
  }
}
