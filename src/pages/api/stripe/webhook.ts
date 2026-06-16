import { randomUUID } from "node:crypto";
import type { NextApiRequest, NextApiResponse } from "next";
import { buffer } from "micro";
import type Stripe from "stripe";
import type { ResultSetHeader } from "mysql2";
import { withTransaction } from "@/lib/server/db";
import { getStripe } from "@/lib/server/stripe";

export const config = {
  api: {
    bodyParser: false,
  },
};

function stripeObjectId(value: string | Stripe.PaymentIntent | Stripe.Charge | null | undefined) {
  if (!value) return null;
  return typeof value === "string" ? value : value.id;
}

async function markPaymentCompleted(paymentIntent: Stripe.PaymentIntent, providerEventId: string) {
  const paymentIntentId = paymentIntent.id;
  const chargeId = stripeObjectId(paymentIntent.latest_charge as string | Stripe.Charge | null);

  await withTransaction(async (connection) => {
    await connection.execute<ResultSetHeader>(
      `UPDATE payments
       SET status = 'completed',
           provider_charge_id = COALESCE(?, provider_charge_id),
           transaction_id = COALESCE(transaction_id, ?),
           paid_at = COALESCE(paid_at, NOW()),
           failure_message = NULL
       WHERE provider = 'stripe'
         AND provider_payment_intent_id = ?`,
      [chargeId, paymentIntentId, paymentIntentId]
    );

    await connection.execute<ResultSetHeader>(
      `UPDATE orders o
       INNER JOIN payments p ON p.order_id = o.id
       SET o.status = 'confirmed',
           o.updated_at = NOW()
       WHERE p.provider = 'stripe'
         AND p.provider_payment_intent_id = ?
         AND o.status = 'pending'`,
      [paymentIntentId]
    );

    await connection.execute<ResultSetHeader>(
      `INSERT INTO payment_status_events
       (id, payment_id, order_id, status, source, provider_event_id, provider_object_id, message)
       SELECT ?, p.id, p.order_id, 'completed', 'stripe_webhook', ?, ?, NULL
       FROM payments p
       WHERE p.provider = 'stripe'
         AND p.provider_payment_intent_id = ?`,
      [randomUUID(), providerEventId, paymentIntentId, paymentIntentId]
    );
  });
}

async function markPaymentFailed(paymentIntent: Stripe.PaymentIntent, providerEventId: string, status = "failed") {
  const failureMessage = paymentIntent.last_payment_error?.message || `Payment ${status}`;
  await withTransaction(async (connection) => {
    await connection.execute<ResultSetHeader>(
      `UPDATE payments
       SET status = 'failed',
           failure_message = ?
       WHERE provider = 'stripe'
         AND provider_payment_intent_id = ?`,
      [failureMessage, paymentIntent.id]
    );

    const [orderUpdate] = await connection.execute<ResultSetHeader>(
      `UPDATE orders o
       INNER JOIN payments p ON p.order_id = o.id
       SET o.status = 'cancelled',
           o.cancelled_at = COALESCE(o.cancelled_at, NOW()),
           o.updated_at = NOW()
       WHERE p.provider = 'stripe'
         AND p.provider_payment_intent_id = ?
         AND o.status = 'pending'`,
      [paymentIntent.id]
    );

    if (orderUpdate.affectedRows > 0) {
      await connection.execute<ResultSetHeader>(
        `UPDATE products p
         INNER JOIN order_items oi ON oi.product_id = p.id
         INNER JOIN payments pay ON pay.order_id = oi.order_id
         SET p.stock_quantity = p.stock_quantity + oi.quantity,
             p.sales_count = GREATEST(p.sales_count - oi.quantity, 0)
         WHERE pay.provider = 'stripe'
           AND pay.provider_payment_intent_id = ?`,
        [paymentIntent.id]
      );

      await connection.execute<ResultSetHeader>(
        `UPDATE seller_earnings se
         INNER JOIN order_items oi ON oi.id = se.order_item_id
         INNER JOIN payments pay ON pay.order_id = oi.order_id
         SET se.status = 'cancelled'
         WHERE pay.provider = 'stripe'
           AND pay.provider_payment_intent_id = ?
           AND se.status = 'pending'`,
        [paymentIntent.id]
      );
    }

    await connection.execute<ResultSetHeader>(
      `INSERT INTO payment_status_events
       (id, payment_id, order_id, status, source, provider_event_id, provider_object_id, message)
       SELECT ?, p.id, p.order_id, 'failed', 'stripe_webhook', ?, ?, ?
       FROM payments p
       WHERE p.provider = 'stripe'
         AND p.provider_payment_intent_id = ?`,
      [randomUUID(), providerEventId, paymentIntent.id, failureMessage, paymentIntent.id]
    );
  });
}

async function markChargeRefunded(charge: Stripe.Charge, providerEventId: string) {
  const paymentIntentId = stripeObjectId(charge.payment_intent as string | Stripe.PaymentIntent | null);
  if (!paymentIntentId) return;

  const refundedAmount = Number((charge.amount_refunded / 100).toFixed(2));
  const latestRefund = charge.refunds?.data?.[0];
  const status = charge.refunded ? "refunded" : "completed";

  await withTransaction(async (connection) => {
    await connection.execute<ResultSetHeader>(
      `UPDATE payments
       SET status = ?,
           provider_charge_id = COALESCE(provider_charge_id, ?),
           provider_refund_id = COALESCE(?, provider_refund_id),
           refunded_amount = ?,
           refunded_at = CASE WHEN ? = 'refunded' THEN COALESCE(refunded_at, NOW()) ELSE refunded_at END
       WHERE provider = 'stripe'
         AND provider_payment_intent_id = ?`,
      [status, charge.id, latestRefund?.id || null, refundedAmount, status, paymentIntentId]
    );

    if (latestRefund) {
      await connection.execute<ResultSetHeader>(
        `INSERT INTO payment_refunds
         (id, payment_id, order_id, provider, provider_refund_id, amount, reason, status)
         SELECT ?, p.id, p.order_id, 'stripe', ?, ?, ?, ?
         FROM payments p
         WHERE p.provider_payment_intent_id = ?
         ON DUPLICATE KEY UPDATE status = VALUES(status), amount = VALUES(amount), updated_at = NOW()`,
        [
          randomUUID(),
          latestRefund.id,
          Number((latestRefund.amount / 100).toFixed(2)),
          latestRefund.reason || null,
          latestRefund.status || "succeeded",
          paymentIntentId,
        ]
      );
    }

    if (charge.refunded) {
      await connection.execute<ResultSetHeader>(
        `UPDATE orders o
         INNER JOIN payments p ON p.order_id = o.id
         SET o.status = 'refunded',
             o.updated_at = NOW()
         WHERE p.provider = 'stripe'
           AND p.provider_payment_intent_id = ?`,
        [paymentIntentId]
      );
    }

    await connection.execute<ResultSetHeader>(
      `INSERT INTO payment_status_events
       (id, payment_id, order_id, status, source, provider_event_id, provider_object_id, message)
       SELECT ?, p.id, p.order_id, ?, 'stripe_webhook', ?, ?, ?
       FROM payments p
       WHERE p.provider = 'stripe'
         AND p.provider_payment_intent_id = ?`,
      [
        randomUUID(),
        status,
        providerEventId,
        latestRefund?.id || charge.id,
        charge.refunded ? "Charge fully refunded." : "Charge partially refunded.",
        paymentIntentId,
      ]
    );
  });
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    return res.status(500).json({ error: "STRIPE_WEBHOOK_SECRET is not configured" });
  }

  const signature = req.headers["stripe-signature"];
  if (!signature || Array.isArray(signature)) {
    return res.status(400).json({ error: "Missing Stripe signature" });
  }

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(await buffer(req), signature, webhookSecret);
  } catch (error) {
    return res.status(400).json({ error: error instanceof Error ? error.message : "Invalid webhook" });
  }

  const paymentIntentId =
    event.data.object.object === "payment_intent"
      ? (event.data.object as Stripe.PaymentIntent).id
      : event.data.object.object === "charge"
        ? stripeObjectId((event.data.object as Stripe.Charge).payment_intent as string | Stripe.PaymentIntent | null)
        : null;

  try {
    const inserted = await withTransaction(async (connection) => {
      const [result] = await connection.execute<ResultSetHeader>(
        `INSERT IGNORE INTO stripe_webhook_events
         (id, provider_event_id, event_type, payment_intent_id)
         VALUES (?, ?, ?, ?)`,
        [randomUUID(), event.id, event.type, paymentIntentId]
      );
      return result.affectedRows === 1;
    });

    if (!inserted) {
      return res.status(200).json({ received: true, duplicate: true });
    }

    if (event.type === "payment_intent.succeeded") {
      await markPaymentCompleted(event.data.object as Stripe.PaymentIntent, event.id);
    }

    if (event.type === "payment_intent.payment_failed") {
      await markPaymentFailed(event.data.object as Stripe.PaymentIntent, event.id);
    }

    if (event.type === "payment_intent.canceled") {
      await markPaymentFailed(event.data.object as Stripe.PaymentIntent, event.id, "cancelled");
    }

    if (event.type === "charge.refunded") {
      await markChargeRefunded(event.data.object as Stripe.Charge, event.id);
    }

    return res.status(200).json({ received: true });
  } catch (error) {
    return res.status(500).json({
      error: error instanceof Error ? error.message : "Could not process Stripe webhook",
    });
  }
}
