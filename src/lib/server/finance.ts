import { randomUUID } from "node:crypto";
import type { PoolConnection, ResultSetHeader, RowDataPacket } from "mysql2/promise";

type PaymentEventStatus = "received" | "processed" | "ignored" | "failed";
type LedgerDirection = "debit" | "credit";
type LedgerStatus = "pending" | "posted" | "voided";

interface PaymentEventInput {
  paymentId: string;
  orderId: string;
  provider: string;
  eventType: string;
  eventStatus?: PaymentEventStatus;
  providerEventId: string;
  providerPaymentId?: string | null;
  amount?: number | string | null;
  currency?: string | null;
  payload?: Record<string, unknown>;
  errorMessage?: string | null;
}

interface LedgerEntryInput {
  entryType: string;
  direction: LedgerDirection;
  status?: LedgerStatus;
  accountCode: string;
  amount: number | string;
  currency?: string | null;
  orderId: string;
  paymentId: string;
  paymentEventId?: string | null;
  sellerId?: string | null;
  customerId?: string | null;
  memo?: string | null;
  idempotencyKey: string;
  metadata?: Record<string, unknown>;
  createdBy?: string | null;
}

interface PaymentEventRow extends RowDataPacket {
  id: string;
}

function jsonPayload(value: Record<string, unknown> | undefined) {
  return JSON.stringify(value || {});
}

function entryNumber(prefix: string) {
  return `${prefix}-${Date.now()}-${randomUUID().slice(0, 8).toUpperCase()}`;
}

export async function insertPaymentEvent(
  connection: PoolConnection,
  input: PaymentEventInput
) {
  const eventId = randomUUID();
  await connection.execute<ResultSetHeader>(
    `INSERT INTO payment_events
     (
       id, payment_id, order_id, provider, event_type, event_status,
       provider_event_id, provider_payment_id, amount, currency, payload,
       processed_at, error_message
     )
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CASE WHEN ? IN ('processed', 'ignored', 'failed') THEN NOW() ELSE NULL END, ?)
     ON DUPLICATE KEY UPDATE id = LAST_INSERT_ID(id)`,
    [
      eventId,
      input.paymentId,
      input.orderId,
      input.provider,
      input.eventType,
      input.eventStatus || "processed",
      input.providerEventId,
      input.providerPaymentId || null,
      input.amount ?? null,
      input.currency || "PKR",
      jsonPayload(input.payload),
      input.eventStatus || "processed",
      input.errorMessage || null,
    ]
  );

  const [rows] = await connection.execute<PaymentEventRow[]>(
    "SELECT id FROM payment_events WHERE provider = ? AND provider_event_id = ? LIMIT 1",
    [input.provider, input.providerEventId]
  );

  return rows[0]?.id || eventId;
}

export async function insertLedgerEntry(
  connection: PoolConnection,
  input: LedgerEntryInput
) {
  await connection.execute<ResultSetHeader>(
    `INSERT IGNORE INTO finance_ledger_entries
     (
       id, entry_number, entry_type, direction, status, account_code,
       seller_id, customer_id, order_id, payment_id, payment_event_id,
       amount, currency, memo, idempotency_key, posted_at, metadata, created_by
     )
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CASE WHEN ? = 'posted' THEN NOW() ELSE NULL END, ?, ?)`,
    [
      randomUUID(),
      entryNumber("FLE"),
      input.entryType,
      input.direction,
      input.status || "pending",
      input.accountCode,
      input.sellerId || null,
      input.customerId || null,
      input.orderId,
      input.paymentId,
      input.paymentEventId || null,
      input.amount,
      input.currency || "PKR",
      input.memo || null,
      input.idempotencyKey,
      input.status || "pending",
      jsonPayload(input.metadata),
      input.createdBy || null,
    ]
  );
}

export async function createCheckoutFinanceRecords(
  connection: PoolConnection,
  input: {
    paymentId: string;
    orderId: string;
    customerId: string;
    paymentMethod: string;
    provider: string | null;
    providerPaymentId?: string | null;
    amount: number | string;
    currency?: string | null;
    idempotencyKey?: string | null;
  }
) {
  const provider = input.provider || input.paymentMethod || "checkout";
  const eventKey = input.idempotencyKey
    ? `checkout:${input.idempotencyKey}`
    : `checkout:${input.paymentId}`;
  const paymentEventId = await insertPaymentEvent(connection, {
    paymentId: input.paymentId,
    orderId: input.orderId,
    provider,
    eventType: "checkout.payment_created",
    eventStatus: "processed",
    providerEventId: eventKey,
    providerPaymentId: input.providerPaymentId || input.paymentId,
    amount: input.amount,
    currency: input.currency,
    payload: {
      payment_method: input.paymentMethod,
      provider: input.provider,
      source: "checkout",
    },
  });

  await insertLedgerEntry(connection, {
    entryType: "order_receivable",
    direction: "debit",
    status: "pending",
    accountCode: "customer_receivable",
    customerId: input.customerId,
    orderId: input.orderId,
    paymentId: input.paymentId,
    paymentEventId,
    amount: input.amount,
    currency: input.currency,
    memo: "Receivable opened at checkout.",
    idempotencyKey: `${eventKey}:ledger:receivable`,
    metadata: { source: "checkout", payment_method: input.paymentMethod },
  });

  await insertLedgerEntry(connection, {
    entryType: "order_control",
    direction: "credit",
    status: "pending",
    accountCode: "order_clearing",
    customerId: input.customerId,
    orderId: input.orderId,
    paymentId: input.paymentId,
    paymentEventId,
    amount: input.amount,
    currency: input.currency,
    memo: "Order clearing entry opened at checkout.",
    idempotencyKey: `${eventKey}:ledger:order-clearing`,
    metadata: { source: "checkout", payment_method: input.paymentMethod },
  });

  return paymentEventId;
}

export async function postManualPaymentLedger(
  connection: PoolConnection,
  input: {
    paymentId: string;
    orderId: string;
    customerId: string;
    paymentMethod: string;
    amount: number | string;
    currency?: string | null;
    status: "completed" | "failed";
    idempotencyKey: string;
    createdBy: string;
    transactionId?: string | null;
    note?: string | null;
  }
) {
  const paymentEventId = await insertPaymentEvent(connection, {
    paymentId: input.paymentId,
    orderId: input.orderId,
    provider: input.paymentMethod || "manual",
    eventType: input.status === "completed" ? "manual_payment.verified" : "manual_payment.failed",
    eventStatus: input.status === "completed" ? "processed" : "failed",
    providerEventId: input.idempotencyKey,
    providerPaymentId: input.transactionId || input.paymentId,
    amount: input.amount,
    currency: input.currency,
    payload: {
      source: "admin_payment_verification",
      status: input.status,
      note: input.note || null,
    },
    errorMessage: input.status === "failed" ? input.note || "Manual payment marked failed." : null,
  });

  if (input.status === "failed") {
    await connection.execute<ResultSetHeader>(
      `UPDATE finance_ledger_entries
       SET status = 'voided', voided_at = COALESCE(voided_at, NOW()), updated_at = NOW()
       WHERE payment_id = ? AND status = 'pending'`,
      [input.paymentId]
    );
    return paymentEventId;
  }

  await insertLedgerEntry(connection, {
    entryType: "manual_payment_cash",
    direction: "debit",
    status: "posted",
    accountCode: input.paymentMethod === "cash_on_delivery" ? "cod_cash_clearing" : "manual_payment_clearing",
    customerId: input.customerId,
    orderId: input.orderId,
    paymentId: input.paymentId,
    paymentEventId,
    amount: input.amount,
    currency: input.currency,
    memo: "Manual payment verified by admin.",
    idempotencyKey: `${input.idempotencyKey}:ledger:cash`,
    metadata: { source: "admin_payment_verification", payment_method: input.paymentMethod },
    createdBy: input.createdBy,
  });

  await insertLedgerEntry(connection, {
    entryType: "manual_payment_receivable_settlement",
    direction: "credit",
    status: "posted",
    accountCode: "customer_receivable",
    customerId: input.customerId,
    orderId: input.orderId,
    paymentId: input.paymentId,
    paymentEventId,
    amount: input.amount,
    currency: input.currency,
    memo: "Customer receivable settled by manual payment verification.",
    idempotencyKey: `${input.idempotencyKey}:ledger:receivable`,
    metadata: { source: "admin_payment_verification", payment_method: input.paymentMethod },
    createdBy: input.createdBy,
  });

  return paymentEventId;
}
