import type { NextApiRequest, NextApiResponse } from "next";
import type { ResultSetHeader, RowDataPacket } from "mysql2";
import { insertLedgerEntry, insertPaymentEvent } from "@/lib/server/finance";
import { canUseLocalDevAuthFallback, withTransaction } from "@/lib/server/db";
import { readLocalDatabase, writeLocalDatabase } from "@/lib/server/local-db";
import { readSession } from "@/lib/server/session";

type CodStatus =
  | "awaiting_collection"
  | "collected"
  | "partially_remitted"
  | "reconciled"
  | "short_paid"
  | "over_paid"
  | "disputed"
  | "written_off";

interface CodRow extends RowDataPacket {
  id: string;
  order_id: string;
  payment_id: string | null;
  expected_amount: number;
  collected_amount: number;
  remitted_amount: number;
  courier_fee: number;
  currency: string;
}

function cleanId(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function cleanText(value: unknown, max = 191) {
  const text = String(value || "").trim();
  return text ? text.slice(0, max) : null;
}

function cleanMoney(value: unknown, fallback = 0) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || numeric < 0) return fallback;
  return Number(numeric.toFixed(2));
}

function statusFor(collected: number, remitted: number, fee: number): CodStatus {
  if (collected <= 0) return "awaiting_collection";
  const variance = Number((collected - fee - remitted).toFixed(2));
  if (remitted <= 0) return "collected";
  if (Math.abs(variance) <= 0.01) return "reconciled";
  return variance > 0 ? "short_paid" : "over_paid";
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const session = await readSession(req);
  if (session?.role !== "admin") {
    return res.status(403).json({ error: "Only admin can update COD reconciliation" });
  }

  const reconciliationId = cleanId(req.query.id);
  if (!reconciliationId) return res.status(400).json({ error: "COD reconciliation id is required" });

  try {
    if (canUseLocalDevAuthFallback()) {
      const db = await readLocalDatabase();
      const row = db.cod_reconciliations.find((item) => item.id === reconciliationId);
      if (!row) return res.status(404).json({ error: "COD reconciliation not found" });

      const timestamp = new Date().toISOString();
      const collected = cleanMoney(req.body?.collected_amount, Number(row.collected_amount || 0));
      const remitted = cleanMoney(req.body?.remitted_amount, Number(row.remitted_amount || 0));
      const fee = cleanMoney(req.body?.courier_fee, Number(row.courier_fee || 0));
      const discrepancy = Number((collected - fee - remitted).toFixed(2));
      const nextStatus = cleanText(req.body?.status) as CodStatus | null;
      const status = nextStatus || statusFor(collected, remitted, fee);

      row.courier_name = cleanText(req.body?.courier_name) ?? row.courier_name ?? null;
      row.courier_reference = cleanText(req.body?.courier_reference) ?? row.courier_reference ?? null;
      row.collected_amount = collected;
      row.remitted_amount = remitted;
      row.courier_fee = fee;
      row.discrepancy_amount = discrepancy;
      row.status = status;
      row.notes = cleanText(req.body?.notes, 500) ?? row.notes ?? null;
      row.collected_at = collected > 0 ? row.collected_at || timestamp : row.collected_at || null;
      row.remitted_at = remitted > 0 ? timestamp : row.remitted_at || null;
      row.reconciled_at = status === "reconciled" ? timestamp : row.reconciled_at || null;
      row.reconciled_by = status === "reconciled" ? session.id : row.reconciled_by || null;
      row.updated_at = timestamp;

      const payment = db.payments.find((item) => item.id === row.payment_id);
      if (payment && collected > 0 && payment.status !== "completed") {
        payment.status = "completed";
        payment.paid_at = payment.paid_at || timestamp;
        payment.updated_at = timestamp;
      }

      const order = db.orders.find((item) => item.id === row.order_id);
      if (order && collected > 0 && order.status === "pending") {
        order.status = "confirmed";
        order.updated_at = timestamp;
      }

      await writeLocalDatabase(db);
      return res.status(200).json({ reconciliation: row });
    }

    const result = await withTransaction(async (connection) => {
      const [rows] = await connection.execute<CodRow[]>(
        `SELECT id, order_id, payment_id, expected_amount, collected_amount, remitted_amount, courier_fee, currency
         FROM cod_reconciliations
         WHERE id = ?
         FOR UPDATE`,
        [reconciliationId]
      );
      const row = rows[0];
      if (!row) throw new Error("COD reconciliation not found");
      if (!row.payment_id) throw new Error("COD reconciliation is missing a payment link");

      const collected = cleanMoney(req.body?.collected_amount, Number(row.collected_amount || 0));
      const remitted = cleanMoney(req.body?.remitted_amount, Number(row.remitted_amount || 0));
      const fee = cleanMoney(req.body?.courier_fee, Number(row.courier_fee || 0));
      const discrepancy = Number((collected - fee - remitted).toFixed(2));
      const nextStatus = cleanText(req.body?.status) as CodStatus | null;
      const status = nextStatus || statusFor(collected, remitted, fee);
      const idempotencyKey = cleanText(
        req.body?.idempotency_key || req.headers["idempotency-key"],
        191
      ) || `cod-reconciliation:${reconciliationId}:${Date.now()}`;

      await connection.execute<ResultSetHeader>(
        `UPDATE cod_reconciliations
         SET courier_name = COALESCE(?, courier_name),
             courier_reference = COALESCE(?, courier_reference),
             collected_amount = ?,
             remitted_amount = ?,
             courier_fee = ?,
             discrepancy_amount = ?,
             status = ?,
             notes = COALESCE(?, notes),
             collected_at = CASE WHEN ? > 0 THEN COALESCE(collected_at, NOW()) ELSE collected_at END,
             remitted_at = CASE WHEN ? > 0 THEN NOW() ELSE remitted_at END,
             reconciled_at = CASE WHEN ? = 'reconciled' THEN NOW() ELSE reconciled_at END,
             reconciled_by = CASE WHEN ? = 'reconciled' THEN ? ELSE reconciled_by END,
             updated_at = NOW()
         WHERE id = ?`,
        [
          cleanText(req.body?.courier_name),
          cleanText(req.body?.courier_reference),
          collected,
          remitted,
          fee,
          discrepancy,
          status,
          cleanText(req.body?.notes, 500),
          collected,
          remitted,
          status,
          status,
          session.id,
          reconciliationId,
        ]
      );

      if (collected > 0) {
        await connection.execute<ResultSetHeader>(
          `UPDATE payments
           SET status = 'completed',
               paid_at = COALESCE(paid_at, NOW()),
               updated_at = NOW()
           WHERE id = ? AND status <> 'completed'`,
          [row.payment_id]
        );
        await connection.execute<ResultSetHeader>(
          `UPDATE orders
           SET status = 'confirmed', updated_at = NOW()
           WHERE id = ? AND status = 'pending'`,
          [row.order_id]
        );
      }

      const paymentEventId = await insertPaymentEvent(connection, {
        paymentId: row.payment_id,
        orderId: row.order_id,
        provider: "cash_on_delivery",
        eventType: status === "reconciled" ? "cod.reconciled" : "cod.updated",
        eventStatus: "processed",
        providerEventId: idempotencyKey,
        providerPaymentId: row.payment_id,
        amount: collected,
        currency: row.currency || "PKR",
        payload: {
          reconciliation_id: reconciliationId,
          collected_amount: collected,
          remitted_amount: remitted,
          courier_fee: fee,
          discrepancy_amount: discrepancy,
          status,
        },
      });

      if (remitted > 0) {
        await insertLedgerEntry(connection, {
          entryType: "cod_cash_remitted",
          direction: "debit",
          status: "posted",
          accountCode: "platform_cash",
          orderId: row.order_id,
          paymentId: row.payment_id,
          paymentEventId,
          codReconciliationId: reconciliationId,
          amount: remitted,
          currency: row.currency || "PKR",
          memo: "COD remittance deposited to platform.",
          idempotencyKey: `${idempotencyKey}:ledger:remitted`,
          metadata: { source: "cod_reconciliation", status },
          createdBy: session.id,
        });
      }

      if (fee > 0) {
        await insertLedgerEntry(connection, {
          entryType: "cod_courier_fee",
          direction: "debit",
          status: "posted",
          accountCode: "payment_processing_cost",
          orderId: row.order_id,
          paymentId: row.payment_id,
          paymentEventId,
          codReconciliationId: reconciliationId,
          amount: fee,
          currency: row.currency || "PKR",
          memo: "Courier fee recorded during COD reconciliation.",
          idempotencyKey: `${idempotencyKey}:ledger:courier-fee`,
          metadata: { source: "cod_reconciliation", status },
          createdBy: session.id,
        });
      }

      return {
        id: reconciliationId,
        status,
        collected_amount: collected,
        remitted_amount: remitted,
        courier_fee: fee,
        discrepancy_amount: discrepancy,
      };
    });

    return res.status(200).json({ reconciliation: result });
  } catch (error) {
    return res.status(400).json({
      error: error instanceof Error ? error.message : "Could not update COD reconciliation",
    });
  }
}
