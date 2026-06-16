import { randomUUID } from "node:crypto";
import type { NextApiRequest, NextApiResponse } from "next";
import type { RowDataPacket, ResultSetHeader } from "mysql2";
import { canUseLocalDevAuthFallback, withTransaction } from "@/lib/server/db";
import { readLocalDatabase, writeLocalDatabase } from "@/lib/server/local-db";
import { readSession } from "@/lib/server/session";
import { getStripe, toStripeAmount } from "@/lib/server/stripe";

interface PaymentRow extends RowDataPacket {
  id: string;
  order_id: string;
  provider: string | null;
  provider_payment_intent_id: string | null;
  amount: number;
  refunded_amount: number | null;
  status: string;
}

function cleanId(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function cleanReason(value: unknown) {
  const reason = String(value || "requested_by_customer").trim();
  return reason.slice(0, 191) || "requested_by_customer";
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const session = await readSession(req);
  if (session?.role !== "admin") {
    return res.status(403).json({ error: "Only admin can refund payments" });
  }

  const paymentId = cleanId(req.query.id);
  if (!paymentId) return res.status(400).json({ error: "Payment id is required" });

  const requestedAmount = Number(req.body?.amount);
  const reason = cleanReason(req.body?.reason);
  const idempotencyKey =
    String(req.body?.idempotency_key || req.headers["idempotency-key"] || `refund:${paymentId}:${requestedAmount || "full"}`)
      .trim()
      .slice(0, 191);

  try {
    if (canUseLocalDevAuthFallback()) {
      const db = await readLocalDatabase();
      const payment = db.payments.find((row) => row.id === paymentId);
      if (!payment) return res.status(404).json({ error: "Payment not found" });

      const amount = Number.isFinite(requestedAmount) && requestedAmount > 0
        ? requestedAmount
        : Number(payment.amount || 0);
      payment.status = "refunded";
      payment.refunded_amount = amount;
      payment.refunded_at = new Date().toISOString();
      payment.updated_at = payment.refunded_at;

      const order = db.orders.find((row) => row.id === payment.order_id);
      if (order) {
        order.status = "refunded";
        order.updated_at = payment.refunded_at;
      }

      await writeLocalDatabase(db);
      return res.status(200).json({ refund: { amount, status: "succeeded" } });
    }

    const result = await withTransaction(async (connection) => {
      const [payments] = await connection.execute<PaymentRow[]>(
        `SELECT id, order_id, provider, provider_payment_intent_id, amount, refunded_amount, status
         FROM payments
         WHERE id = ?
         FOR UPDATE`,
        [paymentId]
      );
      const payment = payments[0];
      if (!payment) throw new Error("Payment not found");
      if (payment.provider !== "stripe" || !payment.provider_payment_intent_id) {
        throw new Error("This payment is not linked to Stripe");
      }
      if (!["completed", "refunded"].includes(payment.status)) {
        throw new Error("Only completed Stripe payments can be refunded");
      }

      const alreadyRefunded = Number(payment.refunded_amount || 0);
      const remainingAmount = Number(payment.amount) - alreadyRefunded;
      const refundAmount = Number.isFinite(requestedAmount) && requestedAmount > 0
        ? Math.min(requestedAmount, remainingAmount)
        : remainingAmount;

      if (refundAmount <= 0) {
        throw new Error("Payment has no refundable balance");
      }

      const stripeRefund = await getStripe().refunds.create(
        {
          payment_intent: payment.provider_payment_intent_id,
          amount: toStripeAmount(refundAmount),
          metadata: {
            payment_id: payment.id,
            order_id: payment.order_id,
            created_by: session.id,
          },
          reason: "requested_by_customer",
        },
        { idempotencyKey }
      );

      const newRefundedAmount = Number((alreadyRefunded + refundAmount).toFixed(2));
      const fullyRefunded = newRefundedAmount >= Number(payment.amount);

      await connection.execute<ResultSetHeader>(
        `INSERT INTO payment_refunds
         (id, payment_id, order_id, provider, provider_refund_id, amount, reason, status, idempotency_key, created_by)
         VALUES (?, ?, ?, 'stripe', ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE status = VALUES(status), amount = VALUES(amount), updated_at = NOW()`,
        [
          randomUUID(),
          payment.id,
          payment.order_id,
          stripeRefund.id,
          refundAmount,
          reason,
          stripeRefund.status || "pending",
          idempotencyKey,
          session.id,
        ]
      );

      await connection.execute<ResultSetHeader>(
        `UPDATE payments
         SET status = ?,
             provider_refund_id = ?,
             refunded_amount = ?,
             refunded_at = COALESCE(refunded_at, NOW())
         WHERE id = ?`,
        [fullyRefunded ? "refunded" : "completed", stripeRefund.id, newRefundedAmount, payment.id]
      );

      await connection.execute<ResultSetHeader>(
        `INSERT INTO payment_status_events
         (id, payment_id, order_id, status, source, provider_object_id, message)
         VALUES (?, ?, ?, ?, 'admin_refund', ?, ?)`,
        [
          randomUUID(),
          payment.id,
          payment.order_id,
          fullyRefunded ? "refunded" : "partially_refunded",
          stripeRefund.id,
          `Stripe refund created for ${refundAmount}.`,
        ]
      );

      if (fullyRefunded) {
        await connection.execute<ResultSetHeader>(
          `UPDATE orders
           SET status = 'refunded', updated_at = NOW()
           WHERE id = ?`,
          [payment.order_id]
        );
      }

      return {
        id: stripeRefund.id,
        amount: refundAmount,
        status: stripeRefund.status,
        fullyRefunded,
      };
    });

    return res.status(200).json({ refund: result });
  } catch (error) {
    return res.status(400).json({
      error: error instanceof Error ? error.message : "Could not refund payment",
    });
  }
}
