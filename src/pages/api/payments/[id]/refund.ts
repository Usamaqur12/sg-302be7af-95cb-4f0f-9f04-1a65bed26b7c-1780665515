import { randomUUID } from "node:crypto";
import type { NextApiRequest, NextApiResponse } from "next";
import type { RowDataPacket, ResultSetHeader } from "mysql2";
import { canUseLocalDevAuthFallback, withTransaction } from "@/lib/server/db";
import { postRefundLedgerReversal } from "@/lib/server/finance";
import { readLocalDatabase, writeLocalDatabase } from "@/lib/server/local-db";
import { readSession } from "@/lib/server/session";
import { getStripe, toStripeAmount } from "@/lib/server/stripe";

interface PaymentRow extends RowDataPacket {
  id: string;
  order_id: string;
  customer_id: string | null;
  payment_method: string;
  provider: string | null;
  provider_payment_intent_id: string | null;
  amount: number;
  currency: string | null;
  refunded_amount: number | null;
  status: string;
}

interface PaymentRefundRow extends RowDataPacket {
  provider_refund_id: string | null;
  amount: number;
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
  if (!session || !["admin", "manager"].includes(session.role)) {
    return res.status(403).json({ error: "Only admin or manager can refund payments" });
  }

  const paymentId = cleanId(req.query.id);
  if (!paymentId) return res.status(400).json({ error: "Payment id is required" });

  const requestedAmount = Number(req.body?.amount);
  const reason = cleanReason(req.body?.reason);
  const returnRequestId = typeof req.body?.return_request_id === "string"
    ? req.body.return_request_id
    : null;
  const notes = typeof req.body?.notes === "string" ? req.body.notes.slice(0, 1000) : null;
  const idempotencyKey =
    String(req.body?.idempotency_key || req.headers["idempotency-key"] || `refund:${paymentId}:${requestedAmount || "full"}`)
      .trim()
      .slice(0, 191);

  try {
    if (canUseLocalDevAuthFallback()) {
      const db = await readLocalDatabase();
      const payment = db.payments.find((row) => row.id === paymentId);
      if (!payment) return res.status(404).json({ error: "Payment not found" });

      const existingLocalRefund = Array.isArray(db.payment_refunds)
        ? db.payment_refunds.find((row) => row.payment_id === paymentId && row.idempotency_key === idempotencyKey)
        : null;
      if (existingLocalRefund) {
        return res.status(200).json({
          refund: {
            id: existingLocalRefund.provider_refund_id,
            amount: Number(existingLocalRefund.amount || 0),
            status: existingLocalRefund.status || "succeeded",
            fullyRefunded: payment.status === "refunded",
          },
        });
      }
      if (!["completed", "refunded"].includes(String(payment.status || ""))) {
        return res.status(400).json({ error: "Only completed payments can be refunded" });
      }

      const alreadyRefunded = Number(payment.refunded_amount || 0);
      const remainingAmount = Number(payment.amount || 0) - alreadyRefunded;
      const amount = Number.isFinite(requestedAmount) && requestedAmount > 0
        ? Math.min(requestedAmount, remainingAmount)
        : remainingAmount;
      if (amount <= 0) {
        return res.status(400).json({ error: "Payment has no refundable balance" });
      }
      const newRefundedAmount = Number((alreadyRefunded + amount).toFixed(2));
      const fullyRefunded = newRefundedAmount >= Number(payment.amount || 0);
      payment.status = fullyRefunded ? "refunded" : payment.status;
      payment.refunded_amount = newRefundedAmount;
      payment.refunded_at = new Date().toISOString();
      payment.updated_at = payment.refunded_at;
      payment.provider_refund_id = payment.provider_refund_id || `local-refund-${randomUUID()}`;

      const order = db.orders.find((row) => row.id === payment.order_id);
      if (order) {
        if (fullyRefunded) order.status = "refunded";
        order.updated_at = payment.refunded_at;
      }
      const returnRequest = returnRequestId && Array.isArray(db.return_requests)
        ? db.return_requests.find((row) => row.id === returnRequestId)
        : null;
      if (returnRequest) {
        returnRequest.status = "refunded";
        returnRequest.refund_amount = amount;
        returnRequest.admin_note = notes;
        returnRequest.refunded_at = payment.refunded_at;
        returnRequest.updated_at = payment.refunded_at;
      }

      const refundRecordId = randomUUID();
      const paymentEventId = randomUUID();
      const refundProvider = payment.provider || payment.payment_method || "manual";
      if (!Array.isArray(db.payment_refunds)) db.payment_refunds = [];
      if (!Array.isArray(db.refund_records)) db.refund_records = [];
      if (!Array.isArray(db.payment_events)) db.payment_events = [];
      if (!Array.isArray(db.finance_ledger_entries)) db.finance_ledger_entries = [];
      db.payment_refunds.push({
        id: randomUUID(),
        payment_id: payment.id,
        order_id: payment.order_id,
        provider: refundProvider,
        provider_refund_id: payment.provider_refund_id,
        amount,
        reason,
        status: "succeeded",
        idempotency_key: idempotencyKey,
        created_by: session.id,
        created_at: payment.refunded_at,
        updated_at: payment.refunded_at,
      });
      db.refund_records.push({
        id: refundRecordId,
        order_id: payment.order_id,
        payment_id: payment.id,
        return_request_id: returnRequestId,
        requested_by: order?.customer_id || null,
        approved_by: session.id,
        amount,
        currency: payment.currency || "PKR",
        reason,
        status: "completed",
        provider: refundProvider,
        provider_refund_id: payment.provider_refund_id,
        notes,
        requested_at: payment.refunded_at,
        approved_at: payment.refunded_at,
        processed_at: payment.refunded_at,
        completed_at: payment.refunded_at,
        created_at: payment.refunded_at,
        updated_at: payment.refunded_at,
      });
      db.payment_events.push({
        id: paymentEventId,
        payment_id: payment.id,
        order_id: payment.order_id,
        provider: refundProvider,
        event_type: "refund.completed",
        event_status: "processed",
        provider_event_id: idempotencyKey,
        provider_payment_id: payment.provider_payment_intent_id || payment.id,
        amount,
        currency: payment.currency || "PKR",
        payload: { source: "return_workflow", return_request_id: returnRequestId, refund_record_id: refundRecordId },
        received_at: payment.refunded_at,
        processed_at: payment.refunded_at,
        error_message: null,
        created_at: payment.refunded_at,
      });
      db.finance_ledger_entries.push(
        {
          id: randomUUID(),
          entry_number: `FLE-${Date.now()}-${randomUUID().slice(0, 8).toUpperCase()}`,
          entry_type: "refund_customer_reversal",
          direction: "debit",
          status: "posted",
          account_code: "order_refunds",
          seller_id: null,
          customer_id: order?.customer_id || null,
          order_id: payment.order_id,
          order_item_id: null,
          payment_id: payment.id,
          payment_event_id: paymentEventId,
          refund_record_id: refundRecordId,
          amount,
          currency: payment.currency || "PKR",
          memo: "Customer refund posted from return workflow.",
          idempotency_key: `${idempotencyKey}:ledger:refund-debit`,
          posted_at: payment.refunded_at,
          voided_at: null,
          metadata: { source: "return_workflow", return_request_id: returnRequestId },
          created_by: session.id,
          created_at: payment.refunded_at,
          updated_at: payment.refunded_at,
        },
        {
          id: randomUUID(),
          entry_number: `FLE-${Date.now()}-${randomUUID().slice(0, 8).toUpperCase()}`,
          entry_type: "refund_payment_reversal",
          direction: "credit",
          status: "posted",
          account_code: refundProvider === "stripe" ? "stripe_cash_clearing" : "manual_payment_clearing",
          seller_id: null,
          customer_id: order?.customer_id || null,
          order_id: payment.order_id,
          order_item_id: null,
          payment_id: payment.id,
          payment_event_id: paymentEventId,
          refund_record_id: refundRecordId,
          amount,
          currency: payment.currency || "PKR",
          memo: "Payment clearing reduced by customer refund.",
          idempotency_key: `${idempotencyKey}:ledger:refund-credit`,
          posted_at: payment.refunded_at,
          voided_at: null,
          metadata: { source: "return_workflow", return_request_id: returnRequestId },
          created_by: session.id,
          created_at: payment.refunded_at,
          updated_at: payment.refunded_at,
        }
      );

      const orderItems = Array.isArray(db.order_items)
        ? db.order_items.filter((row) => row.order_id === payment.order_id)
        : [];
      const orderItemSubtotal = orderItems.reduce((sum, item) => sum + Number(item.subtotal || 0), 0);
      let allocatedRefund = 0;
      orderItems.forEach((item, index) => {
        const itemSubtotal = Number(item.subtotal || 0);
        if (amount <= 0 || itemSubtotal <= 0 || orderItemSubtotal <= 0) return;

        const isLastItem = index === orderItems.length - 1;
        const rawItemRefund = amount >= orderItemSubtotal
          ? itemSubtotal
          : (amount * itemSubtotal) / orderItemSubtotal;
        const itemRefund = Number((
          isLastItem ? Math.max(0, amount - allocatedRefund) : Math.min(itemSubtotal, rawItemRefund)
        ).toFixed(2));
        allocatedRefund = Number((allocatedRefund + itemRefund).toFixed(2));
        if (itemRefund <= 0) return;

        const ratio = Math.min(1, itemRefund / itemSubtotal);
        const sellerEarningReversal = Number((Number(item.seller_earnings || 0) * ratio).toFixed(2));
        const commissionReversal = Number((Number(item.commission_amount || 0) * ratio).toFixed(2));
        const seller = Array.isArray(db.seller_profiles)
          ? db.seller_profiles.find((row) => row.id === item.seller_id)
          : null;
        const sellerEarning = Array.isArray(db.seller_earnings)
          ? db.seller_earnings.find((row) => row.order_item_id === item.id)
          : null;

        if (sellerEarningReversal > 0) {
          db.finance_ledger_entries.push({
            id: randomUUID(),
            entry_number: `FLE-${Date.now()}-${randomUUID().slice(0, 8).toUpperCase()}`,
            entry_type: "seller_earning_reversal",
            direction: "debit",
            status: "posted",
            account_code: "seller_payable",
            seller_id: item.seller_id,
            customer_id: null,
            order_id: payment.order_id,
            order_item_id: item.id,
            payment_id: payment.id,
            payment_event_id: paymentEventId,
            refund_record_id: refundRecordId,
            amount: sellerEarningReversal,
            currency: payment.currency || "PKR",
            memo: "Seller earning reversed for customer refund.",
            idempotency_key: `${idempotencyKey}:ledger:seller-earning:${item.id}`,
            posted_at: payment.refunded_at,
            voided_at: null,
            metadata: {
              source: "return_workflow",
              return_request_id: returnRequestId,
              allocated_refund_amount: itemRefund,
            },
            created_by: session.id,
            created_at: payment.refunded_at,
            updated_at: payment.refunded_at,
          });
          if (seller) {
            seller.available_balance = Math.max(0, Number(seller.available_balance || 0) - sellerEarningReversal);
            seller.total_earnings = Math.max(0, Number(seller.total_earnings || 0) - sellerEarningReversal);
            seller.updated_at = payment.refunded_at;
          }
        }

        if (commissionReversal > 0) {
          db.finance_ledger_entries.push({
            id: randomUUID(),
            entry_number: `FLE-${Date.now()}-${randomUUID().slice(0, 8).toUpperCase()}`,
            entry_type: "commission_reversal",
            direction: "debit",
            status: "posted",
            account_code: "marketplace_commission_revenue",
            seller_id: item.seller_id,
            customer_id: null,
            order_id: payment.order_id,
            order_item_id: item.id,
            payment_id: payment.id,
            payment_event_id: paymentEventId,
            refund_record_id: refundRecordId,
            amount: commissionReversal,
            currency: payment.currency || "PKR",
            memo: "Marketplace commission reversed for customer refund.",
            idempotency_key: `${idempotencyKey}:ledger:commission:${item.id}`,
            posted_at: payment.refunded_at,
            voided_at: null,
            metadata: {
              source: "return_workflow",
              return_request_id: returnRequestId,
              allocated_refund_amount: itemRefund,
            },
            created_by: session.id,
            created_at: payment.refunded_at,
            updated_at: payment.refunded_at,
          });
        }

        if (sellerEarning) {
          sellerEarning.status = ratio >= 1 ? "reversed" : "partially_reversed";
        }
      });

      await writeLocalDatabase(db);
      return res.status(200).json({ refund: { amount, status: "succeeded", fullyRefunded, refundRecordId } });
    }

    const result = await withTransaction(async (connection) => {
      const [payments] = await connection.execute<PaymentRow[]>(
        `SELECT p.id, p.order_id, o.customer_id, p.payment_method, p.provider,
                p.provider_payment_intent_id, p.amount, p.currency, p.refunded_amount, p.status
         FROM payments p
         INNER JOIN orders o ON o.id = p.order_id
         WHERE p.id = ?
         FOR UPDATE`,
        [paymentId]
      );
      const payment = payments[0];
      if (!payment) throw new Error("Payment not found");

      const [existingRefunds] = await connection.execute<PaymentRefundRow[]>(
        `SELECT provider_refund_id, amount, status
         FROM payment_refunds
         WHERE payment_id = ? AND idempotency_key = ?
         LIMIT 1`,
        [payment.id, idempotencyKey]
      );
      if (existingRefunds[0]) {
        return {
          id: existingRefunds[0].provider_refund_id,
          amount: Number(existingRefunds[0].amount || 0),
          status: existingRefunds[0].status,
          fullyRefunded: payment.status === "refunded",
        };
      }

      if (!["completed", "refunded"].includes(payment.status)) {
        throw new Error("Only completed payments can be refunded");
      }

      const alreadyRefunded = Number(payment.refunded_amount || 0);
      const remainingAmount = Number(payment.amount) - alreadyRefunded;
      const refundAmount = Number.isFinite(requestedAmount) && requestedAmount > 0
        ? Math.min(requestedAmount, remainingAmount)
        : remainingAmount;

      if (refundAmount <= 0) {
        throw new Error("Payment has no refundable balance");
      }

      if (payment.provider === "stripe" && payment.provider_payment_intent_id) {
        const stripeRefund = await getStripe().refunds.create(
          {
            payment_intent: payment.provider_payment_intent_id,
            amount: toStripeAmount(refundAmount),
            metadata: {
              payment_id: payment.id,
              order_id: payment.order_id,
              return_request_id: returnRequestId || "",
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

        if (returnRequestId) {
          await connection.execute<ResultSetHeader>(
            `UPDATE return_requests
             SET status = 'refunded',
                 refund_amount = ?,
                 admin_note = ?,
                 refunded_at = COALESCE(refunded_at, NOW()),
                 updated_at = NOW()
             WHERE id = ? AND order_id = ?`,
            [refundAmount, notes, returnRequestId, payment.order_id]
          );
        }

        const finance = await postRefundLedgerReversal(connection, {
          paymentId: payment.id,
          orderId: payment.order_id,
          customerId: payment.customer_id,
          returnRequestId,
          approvedBy: session.id,
          provider: "stripe",
          providerRefundId: stripeRefund.id,
          providerPaymentId: payment.provider_payment_intent_id,
          amount: refundAmount,
          currency: payment.currency,
          reason,
          notes,
          idempotencyKey,
        });

        return {
          id: stripeRefund.id,
          amount: refundAmount,
          status: stripeRefund.status,
          fullyRefunded,
          refundRecordId: finance.refundRecordId,
        };
      }

      const newRefundedAmount = Number((alreadyRefunded + refundAmount).toFixed(2));
      const fullyRefunded = newRefundedAmount >= Number(payment.amount);
      const internalRefundId = `manual-refund-${randomUUID()}`;

      await connection.execute<ResultSetHeader>(
        `INSERT INTO payment_refunds
         (id, payment_id, order_id, provider, provider_refund_id, amount, reason, status, idempotency_key, created_by)
         VALUES (?, ?, ?, ?, ?, ?, ?, 'succeeded', ?, ?)
         ON DUPLICATE KEY UPDATE status = VALUES(status), amount = VALUES(amount), updated_at = NOW()`,
        [
          randomUUID(),
          payment.id,
          payment.order_id,
          payment.provider || payment.payment_method || "manual",
          internalRefundId,
          refundAmount,
          reason,
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
        [fullyRefunded ? "refunded" : "completed", internalRefundId, newRefundedAmount, payment.id]
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
          internalRefundId,
          `Internal refund recorded for ${refundAmount}.`,
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

      if (returnRequestId) {
        await connection.execute<ResultSetHeader>(
          `UPDATE return_requests
           SET status = 'refunded',
               refund_amount = ?,
               admin_note = ?,
               refunded_at = COALESCE(refunded_at, NOW()),
               updated_at = NOW()
           WHERE id = ? AND order_id = ?`,
          [refundAmount, notes, returnRequestId, payment.order_id]
        );
      }

      const finance = await postRefundLedgerReversal(connection, {
        paymentId: payment.id,
        orderId: payment.order_id,
        customerId: payment.customer_id,
        returnRequestId,
        approvedBy: session.id,
        provider: payment.provider || payment.payment_method || "manual",
        providerRefundId: internalRefundId,
        providerPaymentId: payment.provider_payment_intent_id || payment.id,
        amount: refundAmount,
        currency: payment.currency,
        reason,
        notes,
        idempotencyKey,
      });

      return {
        id: internalRefundId,
        amount: refundAmount,
        status: "succeeded",
        fullyRefunded,
        refundRecordId: finance.refundRecordId,
      };
    });

    return res.status(200).json({ refund: result });
  } catch (error) {
    return res.status(400).json({
      error: error instanceof Error ? error.message : "Could not refund payment",
    });
  }
}
