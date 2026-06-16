import { randomUUID } from "node:crypto";
import type { NextApiRequest, NextApiResponse } from "next";
import type { ResultSetHeader, RowDataPacket } from "mysql2";
import { postManualPaymentLedger } from "@/lib/server/finance";
import { canUseLocalDevAuthFallback, withTransaction } from "@/lib/server/db";
import { readLocalDatabase, writeLocalDatabase } from "@/lib/server/local-db";
import { readSession } from "@/lib/server/session";

type ManualPaymentStatus = "completed" | "failed";

interface PaymentRow extends RowDataPacket {
  id: string;
  order_id: string;
  amount: number;
  currency: string | null;
  payment_method: string;
  provider: string | null;
  transaction_id: string | null;
  status: string;
  customer_id: string;
}

function cleanId(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function cleanStatus(value: unknown): ManualPaymentStatus | null {
  return value === "completed" || value === "failed" ? value : null;
}

function cleanText(value: unknown, fallback = "") {
  return String(value || fallback).trim().slice(0, 191);
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const session = await readSession(req);
  if (session?.role !== "admin") {
    return res.status(403).json({ error: "Only admin can verify payments" });
  }

  const paymentId = cleanId(req.query.id);
  if (!paymentId) return res.status(400).json({ error: "Payment id is required" });

  const status = cleanStatus(req.body?.status);
  if (!status) return res.status(400).json({ error: "Status must be completed or failed" });

  const note = cleanText(req.body?.note, status === "completed" ? "Manual payment verified." : "Manual payment failed.");
  const idempotencyKey = cleanText(
    req.body?.idempotency_key || req.headers["idempotency-key"],
    `manual-payment:${paymentId}:${status}`
  );

  try {
    if (canUseLocalDevAuthFallback()) {
      const db = await readLocalDatabase();
      const payment = db.payments.find((row) => row.id === paymentId);
      if (!payment) return res.status(404).json({ error: "Payment not found" });
      if (payment.provider === "stripe" && status === "completed") {
        return res.status(400).json({ error: "Stripe payments must be completed by webhook confirmation." });
      }

      const timestamp = new Date().toISOString();
      payment.status = status;
      payment.updated_at = timestamp;
      if (status === "completed") {
        payment.paid_at = payment.paid_at || timestamp;
      }
      if (status === "failed") {
        payment.failure_message = note;
      }

      const order = db.orders.find((row) => row.id === payment.order_id);
      if (order) {
        order.status = status === "completed" ? "confirmed" : "cancelled";
        order.updated_at = timestamp;
        if (status === "failed") order.cancelled_at = order.cancelled_at || timestamp;
      }

      db.payment_events ||= [];
      db.finance_ledger_entries ||= [];
      db.payment_status_events ||= [];
      if (!db.payment_events.some((row) => row.provider === payment.payment_method && row.provider_event_id === idempotencyKey)) {
        const eventId = randomUUID();
        db.payment_events.push({
          id: eventId,
          payment_id: payment.id,
          order_id: payment.order_id,
          provider: payment.payment_method || "manual",
          event_type: status === "completed" ? "manual_payment.verified" : "manual_payment.failed",
          event_status: status === "completed" ? "processed" : "failed",
          provider_event_id: idempotencyKey,
          provider_payment_id: payment.transaction_id || payment.id,
          amount: payment.amount,
          currency: payment.currency || "PKR",
          payload: { source: "admin_payment_verification", status, note },
          received_at: timestamp,
          processed_at: timestamp,
          created_at: timestamp,
        });
      }

      db.payment_status_events.push({
        id: randomUUID(),
        payment_id: payment.id,
        order_id: payment.order_id,
        status,
        source: "admin_manual_verification",
        provider_event_id: idempotencyKey,
        provider_object_id: payment.transaction_id || payment.id,
        message: note,
        created_at: timestamp,
      });

      await writeLocalDatabase(db);
      return res.status(200).json({ payment: { id: payment.id, status, paid_at: payment.paid_at || null } });
    }

    const result = await withTransaction(async (connection) => {
      const [payments] = await connection.execute<PaymentRow[]>(
        `SELECT
           p.id, p.order_id, p.amount, p.currency, p.payment_method,
           p.provider, p.transaction_id, p.status, o.customer_id
         FROM payments p
         INNER JOIN orders o ON o.id = p.order_id
         WHERE p.id = ?
         FOR UPDATE`,
        [paymentId]
      );
      const payment = payments[0];
      if (!payment) throw new Error("Payment not found");
      if (payment.provider === "stripe" && status === "completed") {
        throw new Error("Stripe payments must be completed by webhook confirmation.");
      }

      await connection.execute<ResultSetHeader>(
        `UPDATE payments
         SET status = ?,
             paid_at = CASE WHEN ? = 'completed' THEN COALESCE(paid_at, NOW()) ELSE paid_at END,
             failure_message = CASE WHEN ? = 'failed' THEN ? ELSE NULL END,
             updated_at = NOW()
         WHERE id = ?`,
        [status, status, status, note, payment.id]
      );

      if (status === "completed") {
        await connection.execute<ResultSetHeader>(
          `UPDATE orders
           SET status = 'confirmed', updated_at = NOW()
           WHERE id = ? AND status = 'pending'`,
          [payment.order_id]
        );
      } else {
        const [orderUpdate] = await connection.execute<ResultSetHeader>(
          `UPDATE orders
           SET status = 'cancelled',
               cancelled_at = COALESCE(cancelled_at, NOW()),
               updated_at = NOW()
           WHERE id = ? AND status IN ('pending', 'confirmed')`,
          [payment.order_id]
        );

        if (orderUpdate.affectedRows > 0) {
          await connection.execute<ResultSetHeader>(
            `UPDATE products p
             INNER JOIN order_items oi ON oi.product_id = p.id
             SET p.stock_quantity = p.stock_quantity + oi.quantity,
                 p.sales_count = GREATEST(p.sales_count - oi.quantity, 0)
             WHERE oi.order_id = ?`,
            [payment.order_id]
          );

          await connection.execute<ResultSetHeader>(
            `UPDATE seller_earnings se
             INNER JOIN order_items oi ON oi.id = se.order_item_id
             SET se.status = 'cancelled'
             WHERE oi.order_id = ?
               AND se.status = 'pending'`,
            [payment.order_id]
          );
        }
      }

      const paymentEventId = await postManualPaymentLedger(connection, {
        paymentId: payment.id,
        orderId: payment.order_id,
        customerId: payment.customer_id,
        paymentMethod: payment.payment_method,
        amount: payment.amount,
        currency: payment.currency || "PKR",
        status,
        idempotencyKey,
        createdBy: session.id,
        transactionId: payment.transaction_id,
        note,
      });

      await connection.execute<ResultSetHeader>(
        `INSERT INTO payment_status_events
         (id, payment_id, order_id, status, source, provider_event_id, provider_object_id, message)
         VALUES (?, ?, ?, ?, 'admin_manual_verification', ?, ?, ?)`,
        [
          randomUUID(),
          payment.id,
          payment.order_id,
          status,
          idempotencyKey,
          payment.transaction_id || payment.id,
          note,
        ]
      );

      return {
        id: payment.id,
        status,
        paymentEventId,
      };
    });

    return res.status(200).json({ payment: result });
  } catch (error) {
    return res.status(400).json({
      error: error instanceof Error ? error.message : "Could not update payment status",
    });
  }
}
