import type { NextApiRequest, NextApiResponse } from "next";
import type { RowDataPacket } from "mysql2";
import { canUseLocalDevAuthFallback, queryRows } from "@/lib/server/db";
import { findLocalOrderTracking } from "@/lib/server/local-db";

interface TrackingRow extends RowDataPacket {
  order_number: string;
  status: "pending" | "confirmed" | "processing" | "shipped" | "delivered" | "cancelled" | "refunded";
  tracking_number: string | null;
  created_at: string | null;
  shipped_at: string | null;
  delivered_at: string | null;
}

interface TrackingResponse {
  order?: {
    orderNumber: string;
    status: TrackingRow["status"];
    trackingNumber: string | null;
    createdAt: string | null;
    shippedAt: string | null;
    deliveredAt: string | null;
  };
  error?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<TrackingResponse>
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const orderNumber = typeof req.body?.orderNumber === "string"
    ? req.body.orderNumber.trim()
    : "";
  const email = typeof req.body?.email === "string"
    ? req.body.email.trim().toLowerCase()
    : "";

  if (!orderNumber || !email) {
    return res.status(400).json({ error: "Order number and email are required" });
  }

  try {
    if (canUseLocalDevAuthFallback()) {
      const order = await findLocalOrderTracking(orderNumber, email);
      if (!order) {
        return res.status(404).json({ error: "Order not found" });
      }

      return res.status(200).json({ order });
    }

    const rows = await queryRows<TrackingRow[]>(
      `SELECT o.order_number, o.status, o.tracking_number, o.created_at, o.shipped_at, o.delivered_at
       FROM orders o
       INNER JOIN profiles p ON p.id = o.customer_id
       WHERE LOWER(p.email) = ?
         AND LOWER(o.order_number) = LOWER(?)
       LIMIT 1`,
      [email, orderNumber]
    );
    const order = rows[0];

    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    return res.status(200).json({
      order: {
        orderNumber: order.order_number,
        status: order.status,
        trackingNumber: order.tracking_number,
        createdAt: order.created_at,
        shippedAt: order.shipped_at,
        deliveredAt: order.delivered_at,
      },
    });
  } catch {
    return res.status(500).json({ error: "Order tracking is not configured" });
  }
}
