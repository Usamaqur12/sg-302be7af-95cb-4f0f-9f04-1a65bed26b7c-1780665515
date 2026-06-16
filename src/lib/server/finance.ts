import { randomUUID } from "node:crypto";
import type { ResultSetHeader, RowDataPacket } from "mysql2";
import type { PoolConnection } from "mysql2/promise";
import { canUseLocalDevAuthFallback, queryRows, withTransaction } from "@/lib/server/db";
import { readLocalDatabase, releaseLocalSellerEarnings, writeLocalDatabase } from "@/lib/server/local-db";
import type { SessionUser } from "@/lib/server/session";

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
  paymentId?: string | null;
  paymentEventId?: string | null;
  refundRecordId?: string | null;
  orderItemId?: string | null;
  sellerId?: string | null;
  customerId?: string | null;
  memo?: string | null;
  idempotencyKey: string;
  metadata?: Record<string, unknown>;
  createdBy?: string | null;
  codReconciliationId?: string | null;
}

interface PaymentEventRow extends RowDataPacket {
  id: string;
}

interface PayoutWithdrawalRow extends RowDataPacket {
  id: string;
  seller_id: string;
  amount: number;
  status: string;
}

interface PayoutSellerRow extends RowDataPacket {
  id: string;
  business_name: string;
  business_email: string | null;
  bank_account_name: string | null;
  bank_account_number: string | null;
  bank_name: string | null;
}

interface PayoutSummaryRow extends RowDataPacket {
  amount: number | string | null;
  credits?: number | string | null;
  debits?: number | string | null;
}

interface RefundOrderItemRow extends RowDataPacket {
  order_item_id: string;
  seller_id: string;
  subtotal: number | string;
  commission_amount: number | string;
  seller_earnings: number | string;
  seller_earning_id: string | null;
}

type LocalDb = Record<string, Array<Record<string, unknown>>>;
type PayoutAction = "approve" | "reject";

function jsonPayload(value: Record<string, unknown> | undefined) {
  return JSON.stringify(value || {});
}

function entryNumber(prefix: string) {
  return `${prefix}-${Date.now()}-${randomUUID().slice(0, 8).toUpperCase()}`;
}

function numberValue(value: unknown) {
  const numericValue = Number(value ?? 0);
  return Number.isFinite(numericValue) ? numericValue : 0;
}

function sameId(left: unknown, right: unknown) {
  return String(left || "") === String(right || "");
}

function nowIso() {
  return new Date().toISOString();
}

function payoutBatchNumber() {
  return `PO-${Date.now()}-${randomUUID().slice(0, 6).toUpperCase()}`;
}

function hasBankDetails(seller: Record<string, unknown>) {
  return Boolean(seller.bank_account_name && seller.bank_account_number && seller.bank_name);
}

function csvCell(value: unknown) {
  const text = String(value ?? "");
  if (/[",\r\n]/.test(text)) return `"${text.replaceAll('"', '""')}"`;
  return text;
}

function localSellerLedgerBalance(db: LocalDb, sellerId: string) {
  const sellerRows = (db.finance_ledger_entries || []).filter((entry) =>
    sameId(entry.seller_id, sellerId) &&
    String(entry.status || "posted") === "posted" &&
    (
      String(entry.account_code || "") === "seller_payable" ||
      String(entry.entry_type || "").startsWith("seller_earning") ||
      String(entry.entry_type || "").startsWith("payout_")
    )
  );

  const sellerPayableCredits = sellerRows
    .filter((entry) => String(entry.direction || "") === "credit")
    .reduce((sum, entry) => sum + numberValue(entry.amount), 0);

  if (sellerPayableCredits <= 0) {
    return (db.seller_earnings || [])
      .filter((earning) => sameId(earning.seller_id, sellerId) && String(earning.status) === "available")
      .reduce((sum, earning) => sum + numberValue(earning.amount), 0);
  }

  const debits = sellerRows
    .filter((entry) => String(entry.direction || "") === "debit")
    .reduce((sum, entry) => sum + numberValue(entry.amount), 0);

  return Math.max(0, sellerPayableCredits - debits);
}

function localOpenPayoutHolds(db: LocalDb, sellerId: string, currentWithdrawalId?: string) {
  const withdrawalHolds = (db.withdrawal_requests || [])
    .filter((withdrawal) =>
      sameId(withdrawal.seller_id, sellerId) &&
      !sameId(withdrawal.id, currentWithdrawalId) &&
      ["pending", "approved"].includes(String(withdrawal.status || ""))
    )
    .reduce((sum, withdrawal) => sum + numberValue(withdrawal.amount), 0);

  const batchHolds = (db.payout_batch_items || [])
    .filter((item) =>
      sameId(item.seller_id, sellerId) &&
      !sameId(item.withdrawal_request_id, currentWithdrawalId) &&
      ["pending", "included"].includes(String(item.status || ""))
    )
    .reduce((sum, item) => sum + numberValue(item.net_amount || item.amount), 0);

  return withdrawalHolds + batchHolds;
}

async function mysqlSellerLedgerBalance(connection: PoolConnection, sellerId: string) {
  const [ledgerRows] = await connection.execute<PayoutSummaryRow[]>(
    `SELECT
       SUM(CASE WHEN direction = 'credit' THEN amount ELSE 0 END) AS credits,
       SUM(CASE WHEN direction = 'debit' THEN amount ELSE 0 END) AS debits
     FROM finance_ledger_entries
     WHERE seller_id = ?
       AND status = 'posted'
       AND (
         account_code = 'seller_payable'
         OR entry_type LIKE 'seller_earning%'
         OR entry_type LIKE 'payout_%'
       )`,
    [sellerId]
  );
  const credits = numberValue(ledgerRows[0]?.credits);
  const debits = numberValue(ledgerRows[0]?.debits);
  if (credits > 0) return Math.max(0, credits - debits);

  const [earningRows] = await connection.execute<PayoutSummaryRow[]>(
    "SELECT SUM(amount) AS amount FROM seller_earnings WHERE seller_id = ? AND status = 'available'",
    [sellerId]
  );
  return numberValue(earningRows[0]?.amount);
}

async function mysqlSellerLedgerBalanceFromPool(sellerId: string) {
  const ledgerRows = await queryRows<PayoutSummaryRow[]>(
    `SELECT
       SUM(CASE WHEN direction = 'credit' THEN amount ELSE 0 END) AS credits,
       SUM(CASE WHEN direction = 'debit' THEN amount ELSE 0 END) AS debits
     FROM finance_ledger_entries
     WHERE seller_id = ?
       AND status = 'posted'
       AND (
         account_code = 'seller_payable'
         OR entry_type LIKE 'seller_earning%'
         OR entry_type LIKE 'payout_%'
       )`,
    [sellerId]
  );
  const credits = numberValue(ledgerRows[0]?.credits);
  const debits = numberValue(ledgerRows[0]?.debits);
  if (credits > 0) return Math.max(0, credits - debits);

  const earningRows = await queryRows<PayoutSummaryRow[]>(
    "SELECT SUM(amount) AS amount FROM seller_earnings WHERE seller_id = ? AND status = 'available'",
    [sellerId]
  );
  return numberValue(earningRows[0]?.amount);
}

async function mysqlOpenPayoutHolds(
  connection: PoolConnection,
  sellerId: string,
  currentWithdrawalId: string
) {
  const [withdrawalRows] = await connection.execute<PayoutSummaryRow[]>(
    `SELECT SUM(amount) AS amount
     FROM withdrawal_requests
     WHERE seller_id = ?
       AND id <> ?
       AND status IN ('pending', 'approved')`,
    [sellerId, currentWithdrawalId]
  );
  const [batchRows] = await connection.execute<PayoutSummaryRow[]>(
    `SELECT SUM(net_amount) AS amount
     FROM payout_batch_items
     WHERE seller_id = ?
       AND (withdrawal_request_id IS NULL OR withdrawal_request_id <> ?)
       AND status IN ('pending', 'included')`,
    [sellerId, currentWithdrawalId]
  );
  return numberValue(withdrawalRows[0]?.amount) + numberValue(batchRows[0]?.amount);
}

async function insertPayoutLedgerEntry(
  connection: PoolConnection,
  input: {
    sellerId: string;
    amount: number;
    batchId: string;
    itemId: string;
    withdrawalId: string;
    createdBy: string;
  }
) {
  await connection.execute<ResultSetHeader>(
    `INSERT IGNORE INTO finance_ledger_entries
     (
       id, entry_number, entry_type, direction, status, account_code,
       seller_id, payout_batch_id, payout_batch_item_id, amount, currency,
       memo, idempotency_key, posted_at, metadata, created_by
     )
     VALUES (?, ?, 'payout_approved', 'debit', 'posted', 'seller_payable', ?, ?, ?, ?, 'PKR', ?, ?, NOW(), ?, ?)`,
    [
      randomUUID(),
      entryNumber("FLE"),
      input.sellerId,
      input.batchId,
      input.itemId,
      input.amount,
      `Payout approved for withdrawal ${input.withdrawalId}.`,
      `payout:${input.withdrawalId}:approved`,
      jsonPayload({ source: "admin_payout_approval", withdrawal_request_id: input.withdrawalId }),
      input.createdBy,
    ]
  );
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
     ON DUPLICATE KEY UPDATE event_status = event_status`,
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
       refund_record_id, order_item_id, cod_reconciliation_id, amount, currency, memo, idempotency_key,
       posted_at, metadata, created_by
     )
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CASE WHEN ? = 'posted' THEN NOW() ELSE NULL END, ?, ?)`,
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
      input.paymentId || null,
      input.paymentEventId || null,
      input.refundRecordId || null,
      input.orderItemId || null,
      input.codReconciliationId || null,
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

export async function postRefundLedgerReversal(
  connection: PoolConnection,
  input: {
    paymentId: string;
    orderId: string;
    customerId?: string | null;
    returnRequestId?: string | null;
    approvedBy?: string | null;
    provider?: string | null;
    providerRefundId?: string | null;
    providerPaymentId?: string | null;
    amount: number | string;
    currency?: string | null;
    reason: string;
    notes?: string | null;
    idempotencyKey: string;
  }
) {
  const provider = input.provider || "manual";
  const refundRecordId = randomUUID();

  await connection.execute<ResultSetHeader>(
    `INSERT INTO refund_records
     (
       id, order_id, payment_id, return_request_id, requested_by, approved_by,
       amount, currency, reason, status, provider, provider_refund_id, notes,
       approved_at, processed_at, completed_at
     )
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'completed', ?, ?, ?, NOW(), NOW(), NOW())
     ON DUPLICATE KEY UPDATE
       status = 'completed',
       amount = VALUES(amount),
       provider_refund_id = VALUES(provider_refund_id),
       notes = VALUES(notes),
       processed_at = COALESCE(processed_at, NOW()),
       completed_at = COALESCE(completed_at, NOW()),
       updated_at = NOW()`,
    [
      refundRecordId,
      input.orderId,
      input.paymentId,
      input.returnRequestId || null,
      input.customerId || null,
      input.approvedBy || null,
      input.amount,
      input.currency || "PKR",
      input.reason,
      provider,
      input.providerRefundId || null,
      input.notes || null,
    ]
  );

  const [refundRows] = await connection.execute<PaymentEventRow[]>(
    input.providerRefundId
      ? "SELECT id FROM refund_records WHERE provider = ? AND provider_refund_id = ? LIMIT 1"
      : "SELECT id FROM refund_records WHERE payment_id = ? AND return_request_id <=> ? ORDER BY created_at DESC LIMIT 1",
    input.providerRefundId
      ? [provider, input.providerRefundId]
      : [input.paymentId, input.returnRequestId || null]
  );
  const persistedRefundRecordId = refundRows[0]?.id || refundRecordId;

  const paymentEventId = await insertPaymentEvent(connection, {
    paymentId: input.paymentId,
    orderId: input.orderId,
    provider,
    eventType: "refund.completed",
    eventStatus: "processed",
    providerEventId: input.idempotencyKey,
    providerPaymentId: input.providerPaymentId || input.paymentId,
    amount: input.amount,
    currency: input.currency,
    payload: {
      source: input.returnRequestId ? "return_workflow" : "payment_refund",
      return_request_id: input.returnRequestId || null,
      refund_record_id: persistedRefundRecordId,
      provider_refund_id: input.providerRefundId || null,
      reason: input.reason,
    },
  });

  await insertLedgerEntry(connection, {
    entryType: "refund_customer_reversal",
    direction: "debit",
    status: "posted",
    accountCode: "order_refunds",
    customerId: input.customerId || null,
    orderId: input.orderId,
    paymentId: input.paymentId,
    paymentEventId,
    refundRecordId: persistedRefundRecordId,
    amount: input.amount,
    currency: input.currency,
    memo: "Customer refund posted from return workflow.",
    idempotencyKey: `${input.idempotencyKey}:ledger:refund-debit`,
    metadata: { source: "return_workflow", return_request_id: input.returnRequestId || null },
    createdBy: input.approvedBy || null,
  });

  await insertLedgerEntry(connection, {
    entryType: "refund_payment_reversal",
    direction: "credit",
    status: "posted",
    accountCode: provider === "stripe" ? "stripe_cash_clearing" : "manual_payment_clearing",
    customerId: input.customerId || null,
    orderId: input.orderId,
    paymentId: input.paymentId,
    paymentEventId,
    refundRecordId: persistedRefundRecordId,
    amount: input.amount,
    currency: input.currency,
    memo: "Payment clearing reduced by customer refund.",
    idempotencyKey: `${input.idempotencyKey}:ledger:refund-credit`,
    metadata: { source: "return_workflow", return_request_id: input.returnRequestId || null },
    createdBy: input.approvedBy || null,
  });

  const refundAmount = numberValue(input.amount);
  const [items] = await connection.execute<RefundOrderItemRow[]>(
    `SELECT
       oi.id AS order_item_id,
       oi.seller_id,
       oi.subtotal,
       oi.commission_amount,
       oi.seller_earnings,
       se.id AS seller_earning_id
     FROM order_items oi
     LEFT JOIN seller_earnings se ON se.order_item_id = oi.id
     WHERE oi.order_id = ?
     ORDER BY oi.created_at, oi.id`,
    [input.orderId]
  );
  const orderItemSubtotal = items.reduce((sum, item) => sum + numberValue(item.subtotal), 0);
  let allocatedRefund = 0;

  for (const [index, item] of items.entries()) {
    const itemSubtotal = numberValue(item.subtotal);
    if (refundAmount <= 0 || itemSubtotal <= 0 || orderItemSubtotal <= 0) continue;

    const isLastItem = index === items.length - 1;
    const rawItemRefund = refundAmount >= orderItemSubtotal
      ? itemSubtotal
      : (refundAmount * itemSubtotal) / orderItemSubtotal;
    const itemRefund = Number((
      isLastItem ? Math.max(0, refundAmount - allocatedRefund) : Math.min(itemSubtotal, rawItemRefund)
    ).toFixed(2));
    allocatedRefund = Number((allocatedRefund + itemRefund).toFixed(2));
    if (itemRefund <= 0) continue;

    const ratio = Math.min(1, itemRefund / itemSubtotal);
    const sellerEarningReversal = Number((numberValue(item.seller_earnings) * ratio).toFixed(2));
    const commissionReversal = Number((numberValue(item.commission_amount) * ratio).toFixed(2));

    if (sellerEarningReversal > 0) {
      await insertLedgerEntry(connection, {
        entryType: "seller_earning_reversal",
        direction: "debit",
        status: "posted",
        accountCode: "seller_payable",
        sellerId: item.seller_id,
        orderId: input.orderId,
        orderItemId: item.order_item_id,
        paymentId: input.paymentId,
        paymentEventId,
        refundRecordId: persistedRefundRecordId,
        amount: sellerEarningReversal,
        currency: input.currency,
        memo: "Seller earning reversed for customer refund.",
        idempotencyKey: `${input.idempotencyKey}:ledger:seller-earning:${item.order_item_id}`,
        metadata: {
          source: "return_workflow",
          return_request_id: input.returnRequestId || null,
          allocated_refund_amount: itemRefund,
        },
        createdBy: input.approvedBy || null,
      });

      await connection.execute<ResultSetHeader>(
        `UPDATE seller_profiles
         SET available_balance = GREATEST(available_balance - ?, 0),
             total_earnings = GREATEST(total_earnings - ?, 0),
             updated_at = NOW()
         WHERE id = ?`,
        [sellerEarningReversal, sellerEarningReversal, item.seller_id]
      );
    }

    if (commissionReversal > 0) {
      await insertLedgerEntry(connection, {
        entryType: "commission_reversal",
        direction: "debit",
        status: "posted",
        accountCode: "marketplace_commission_revenue",
        sellerId: item.seller_id,
        orderId: input.orderId,
        orderItemId: item.order_item_id,
        paymentId: input.paymentId,
        paymentEventId,
        refundRecordId: persistedRefundRecordId,
        amount: commissionReversal,
        currency: input.currency,
        memo: "Marketplace commission reversed for customer refund.",
        idempotencyKey: `${input.idempotencyKey}:ledger:commission:${item.order_item_id}`,
        metadata: {
          source: "return_workflow",
          return_request_id: input.returnRequestId || null,
          allocated_refund_amount: itemRefund,
        },
        createdBy: input.approvedBy || null,
      });
    }

    if (item.seller_earning_id) {
      await connection.execute<ResultSetHeader>(
        "UPDATE seller_earnings SET status = ? WHERE id = ? AND status <> 'paid'",
        [ratio >= 1 ? "reversed" : "partially_reversed", item.seller_earning_id]
      );
    }
  }

  return { refundRecordId: persistedRefundRecordId, paymentEventId };
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

  if (input.paymentMethod === "cash_on_delivery") {
    await createCodReconciliationRecord(connection, {
      orderId: input.orderId,
      paymentId: input.paymentId,
      amount: input.amount,
      currency: input.currency,
    });
  }

  return paymentEventId;
}

export async function createCodReconciliationRecord(
  connection: PoolConnection,
  input: {
    orderId: string;
    paymentId: string;
    amount: number | string;
    currency?: string | null;
  }
) {
  const reconciliationId = randomUUID();
  await connection.execute<ResultSetHeader>(
    `INSERT IGNORE INTO cod_reconciliations
     (id, order_id, payment_id, expected_amount, currency, status)
     VALUES (?, ?, ?, ?, ?, 'awaiting_collection')`,
    [
      reconciliationId,
      input.orderId,
      input.paymentId,
      input.amount,
      input.currency || "PKR",
    ]
  );

  const [rows] = await connection.execute<PaymentEventRow[]>(
    "SELECT id FROM cod_reconciliations WHERE order_id = ? LIMIT 1",
    [input.orderId]
  );

  return rows[0]?.id || reconciliationId;
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

  if (input.paymentMethod === "cash_on_delivery") {
    await createCodReconciliationRecord(connection, {
      orderId: input.orderId,
      paymentId: input.paymentId,
      amount: input.amount,
      currency: input.currency,
    });
  }

  return paymentEventId;
}

export async function listAdminPayouts() {
  if (canUseLocalDevAuthFallback()) {
    await releaseLocalSellerEarnings();
    const db = await readLocalDatabase() as LocalDb;
    const withdrawals = (db.withdrawal_requests || [])
      .slice()
      .sort((a, b) => String(b.created_at || b.requested_at || "").localeCompare(String(a.created_at || a.requested_at || "")))
      .map((withdrawal) => {
        const seller = (db.seller_profiles || []).find((row) => sameId(row.id, withdrawal.seller_id)) || null;
        const batchItem = (db.payout_batch_items || []).find((row) => sameId(row.withdrawal_request_id, withdrawal.id));
        const batch = batchItem
          ? (db.payout_batches || []).find((row) => sameId(row.id, batchItem.payout_batch_id)) || null
          : null;
        const ledgerAvailable = seller ? localSellerLedgerBalance(db, String(seller.id)) : 0;
        const openHolds = seller ? localOpenPayoutHolds(db, String(seller.id), String(withdrawal.id)) : 0;
        return {
          ...withdrawal,
          seller,
          payout_batch: batch,
          payout_batch_item: batchItem || null,
          ledger_available_balance: Math.max(0, ledgerAvailable - openHolds),
          has_bank_details: seller ? hasBankDetails(seller) : false,
        };
      });
    const batches = (db.payout_batches || [])
      .slice()
      .sort((a, b) => String(b.created_at || "").localeCompare(String(a.created_at || "")));
    return { withdrawals, batches };
  }

  const rows = await queryRows<Array<RowDataPacket & Record<string, unknown>>>(
    `SELECT
       wr.*,
       sp.business_name,
       sp.business_email,
       sp.bank_account_name,
       sp.bank_account_number,
       sp.bank_name,
       pbi.id AS payout_batch_item_id,
       pbi.status AS payout_batch_item_status,
       pb.id AS payout_batch_id,
       pb.batch_number,
       pb.status AS payout_batch_status,
       pb.approved_at AS batch_approved_at
     FROM withdrawal_requests wr
     LEFT JOIN seller_profiles sp ON sp.id = wr.seller_id
     LEFT JOIN payout_batch_items pbi ON pbi.withdrawal_request_id = wr.id
     LEFT JOIN payout_batches pb ON pb.id = pbi.payout_batch_id
     ORDER BY COALESCE(wr.created_at, wr.requested_at) DESC`
  );

  const withdrawals = await Promise.all(rows.map(async (row) => {
    const sellerId = String(row.seller_id);
    const ledgerAvailable = await mysqlSellerLedgerBalanceFromPool(sellerId);
    return {
      id: row.id,
      seller_id: row.seller_id,
      amount: Number(row.amount || 0),
      status: row.status,
      created_at: row.created_at || row.requested_at,
      requested_at: row.requested_at,
      approved_at: row.approved_at,
      completed_at: row.completed_at,
      rejected_at: row.rejected_at,
      rejection_reason: row.rejection_reason,
      seller: {
        business_name: row.business_name,
        business_email: row.business_email,
        bank_account_name: row.bank_account_name,
        bank_account_number: row.bank_account_number,
        bank_name: row.bank_name,
      },
      payout_batch: row.payout_batch_id
        ? {
            id: row.payout_batch_id,
            batch_number: row.batch_number,
            status: row.payout_batch_status,
            approved_at: row.batch_approved_at,
          }
        : null,
      payout_batch_item: row.payout_batch_item_id
        ? {
            id: row.payout_batch_item_id,
            status: row.payout_batch_item_status,
          }
        : null,
      ledger_available_balance: ledgerAvailable,
      has_bank_details: Boolean(row.bank_account_name && row.bank_account_number && row.bank_name),
    };
  }));

  const batches = await queryRows<RowDataPacket[]>(
    "SELECT * FROM payout_batches ORDER BY created_at DESC LIMIT 50"
  );
  return { withdrawals, batches };
}

async function updateLocalPayout(
  withdrawalId: string,
  action: PayoutAction,
  actor: SessionUser,
  note?: string
) {
  await releaseLocalSellerEarnings();
  const db = await readLocalDatabase() as LocalDb;
  const withdrawal = (db.withdrawal_requests || []).find((row) => sameId(row.id, withdrawalId));
  if (!withdrawal) throw new Error("Withdrawal request not found");
  if (String(withdrawal.status || "") !== "pending") {
    throw new Error("Only pending withdrawals can be updated");
  }

  const seller = (db.seller_profiles || []).find((row) => sameId(row.id, withdrawal.seller_id));
  if (!seller) throw new Error("Seller profile not found");
  const timestamp = nowIso();

  if (action === "reject") {
    withdrawal.status = "rejected";
    withdrawal.rejected_at = timestamp;
    withdrawal.approved_by = actor.id;
    withdrawal.rejection_reason = note || "Rejected by finance.";
    withdrawal.notes = note || null;
    await writeLocalDatabase(db);
    return { withdrawal, batch: null };
  }

  if (!hasBankDetails(seller)) {
    throw new Error("Seller bank details are required before payout approval");
  }

  const amount = numberValue(withdrawal.amount);
  const available = localSellerLedgerBalance(db, String(seller.id));
  const openHolds = localOpenPayoutHolds(db, String(seller.id), withdrawalId);
  const approvable = Math.max(0, available - openHolds);
  if (amount <= 0 || amount > approvable) {
    throw new Error(`Payout exceeds ledger-derived available balance (${approvable.toFixed(2)})`);
  }

  const batchId = randomUUID();
  const itemId = randomUUID();
  const batch = {
    id: batchId,
    batch_number: payoutBatchNumber(),
    status: "approved",
    currency: "PKR",
    total_amount: amount,
    total_fees: 0,
    net_amount: amount,
    item_count: 1,
    payout_method: "manual_bank_export",
    payout_reference: null,
    scheduled_for: null,
    approved_by: actor.id,
    approved_at: timestamp,
    processed_at: null,
    completed_at: null,
    notes: note || null,
    created_at: timestamp,
    updated_at: timestamp,
  };
  const item = {
    id: itemId,
    payout_batch_id: batchId,
    seller_id: seller.id,
    seller_earning_id: null,
    withdrawal_request_id: withdrawal.id,
    amount,
    fee_amount: 0,
    net_amount: amount,
    status: "included",
    failure_reason: null,
    paid_at: null,
    created_at: timestamp,
  };

  db.payout_batches.push(batch);
  db.payout_batch_items.push(item);
  db.finance_ledger_entries.push({
    id: randomUUID(),
    entry_number: entryNumber("FLE"),
    entry_type: "payout_approved",
    direction: "debit",
    status: "posted",
    account_code: "seller_payable",
    seller_id: seller.id,
    payout_batch_id: batchId,
    payout_batch_item_id: itemId,
    amount,
    currency: "PKR",
    memo: `Payout approved for withdrawal ${withdrawal.id}.`,
    idempotency_key: `payout:${withdrawal.id}:approved`,
    posted_at: timestamp,
    metadata: { source: "admin_payout_approval", withdrawal_request_id: withdrawal.id },
    created_by: actor.id,
    created_at: timestamp,
    updated_at: timestamp,
  });

  withdrawal.status = "approved";
  withdrawal.approved_at = timestamp;
  withdrawal.approved_by = actor.id;
  withdrawal.notes = note || null;
  seller.available_balance = Math.max(0, numberValue(seller.available_balance) - amount);
  seller.updated_at = timestamp;

  await writeLocalDatabase(db);
  return { withdrawal, batch };
}

async function updateMysqlPayout(
  withdrawalId: string,
  action: PayoutAction,
  actor: SessionUser,
  note?: string
) {
  return withTransaction(async (connection) => {
    const [withdrawalRows] = await connection.execute<PayoutWithdrawalRow[]>(
      "SELECT * FROM withdrawal_requests WHERE id = ? FOR UPDATE",
      [withdrawalId]
    );
    const withdrawal = withdrawalRows[0];
    if (!withdrawal) throw new Error("Withdrawal request not found");
    if (withdrawal.status !== "pending") {
      throw new Error("Only pending withdrawals can be updated");
    }

    const [sellerRows] = await connection.execute<PayoutSellerRow[]>(
      `SELECT id, business_name, business_email, bank_account_name, bank_account_number, bank_name
       FROM seller_profiles WHERE id = ? FOR UPDATE`,
      [withdrawal.seller_id]
    );
    const seller = sellerRows[0];
    if (!seller) throw new Error("Seller profile not found");

    if (action === "reject") {
      await connection.execute<ResultSetHeader>(
        `UPDATE withdrawal_requests
         SET status = 'rejected', rejected_at = NOW(), approved_by = ?, rejection_reason = ?, notes = ?
         WHERE id = ?`,
        [actor.id, note || "Rejected by finance.", note || null, withdrawalId]
      );
      return { withdrawal: { ...withdrawal, status: "rejected" }, batch: null };
    }

    if (!hasBankDetails(seller as unknown as Record<string, unknown>)) {
      throw new Error("Seller bank details are required before payout approval");
    }

    const amount = numberValue(withdrawal.amount);
    const available = await mysqlSellerLedgerBalance(connection, withdrawal.seller_id);
    const openHolds = await mysqlOpenPayoutHolds(connection, withdrawal.seller_id, withdrawalId);
    const approvable = Math.max(0, available - openHolds);
    if (amount <= 0 || amount > approvable) {
      throw new Error(`Payout exceeds ledger-derived available balance (${approvable.toFixed(2)})`);
    }

    const [existingItems] = await connection.execute<RowDataPacket[]>(
      "SELECT id FROM payout_batch_items WHERE withdrawal_request_id = ? LIMIT 1",
      [withdrawalId]
    );
    if (existingItems.length) {
      throw new Error("Withdrawal is already attached to a payout batch");
    }

    const batchId = randomUUID();
    const batchNumber = payoutBatchNumber();
    const itemId = randomUUID();
    await connection.execute<ResultSetHeader>(
      `INSERT INTO payout_batches
       (id, batch_number, status, currency, total_amount, total_fees, net_amount, item_count, payout_method, approved_by, approved_at, notes)
       VALUES (?, ?, 'approved', 'PKR', ?, 0, ?, 1, 'manual_bank_export', ?, NOW(), ?)`,
      [batchId, batchNumber, amount, amount, actor.id, note || null]
    );
    await connection.execute<ResultSetHeader>(
      `INSERT INTO payout_batch_items
       (id, payout_batch_id, seller_id, withdrawal_request_id, amount, fee_amount, net_amount, status)
       VALUES (?, ?, ?, ?, ?, 0, ?, 'included')`,
      [itemId, batchId, withdrawal.seller_id, withdrawalId, amount, amount]
    );
    await insertPayoutLedgerEntry(connection, {
      sellerId: withdrawal.seller_id,
      amount,
      batchId,
      itemId,
      withdrawalId,
      createdBy: actor.id,
    });
    await connection.execute<ResultSetHeader>(
      `UPDATE withdrawal_requests
       SET status = 'approved', approved_by = ?, approved_at = NOW(), notes = ?
       WHERE id = ?`,
      [actor.id, note || null, withdrawalId]
    );
    await connection.execute<ResultSetHeader>(
      "UPDATE seller_profiles SET available_balance = GREATEST(available_balance - ?, 0), updated_at = NOW() WHERE id = ?",
      [amount, withdrawal.seller_id]
    );

    return {
      withdrawal: { ...withdrawal, status: "approved" },
      batch: { id: batchId, batch_number: batchNumber, total_amount: amount },
    };
  });
}

export async function updateAdminPayout(
  withdrawalId: string,
  action: PayoutAction,
  actor: SessionUser,
  note?: string
) {
  if (!["admin", "manager"].includes(actor.role)) {
    throw new Error("Access denied: finance role required");
  }
  if (canUseLocalDevAuthFallback()) {
    return updateLocalPayout(withdrawalId, action, actor, note);
  }
  return updateMysqlPayout(withdrawalId, action, actor, note);
}

export async function exportApprovedPayoutsCsv() {
  const header = [
    "batch_number",
    "payout_item_id",
    "seller_id",
    "business_name",
    "account_title",
    "bank_name",
    "account_number",
    "amount",
    "currency",
    "reference",
    "approval_date",
    "approver",
  ];

  if (canUseLocalDevAuthFallback()) {
    const db = await readLocalDatabase() as LocalDb;
    const rows = (db.payout_batch_items || [])
      .filter((item) => ["included", "pending"].includes(String(item.status || "")))
      .map((item) => {
        const batch = (db.payout_batches || []).find((row) => sameId(row.id, item.payout_batch_id)) || {};
        const seller = (db.seller_profiles || []).find((row) => sameId(row.id, item.seller_id)) || {};
        return [
          batch.batch_number,
          item.id,
          item.seller_id,
          seller.business_name,
          seller.bank_account_name,
          seller.bank_name,
          seller.bank_account_number,
          item.net_amount || item.amount,
          batch.currency || "PKR",
          batch.payout_reference || item.withdrawal_request_id,
          batch.approved_at,
          batch.approved_by,
        ];
      });
    return [header, ...rows].map((row) => row.map(csvCell).join(",")).join("\r\n");
  }

  const rows = await queryRows<Array<RowDataPacket & Record<string, unknown>>>(
    `SELECT
       pb.batch_number,
       pbi.id AS payout_item_id,
       pbi.seller_id,
       sp.business_name,
       sp.bank_account_name,
       sp.bank_name,
       sp.bank_account_number,
       pbi.net_amount,
       pb.currency,
       COALESCE(pb.payout_reference, pbi.withdrawal_request_id) AS reference,
       pb.approved_at,
       pb.approved_by
     FROM payout_batch_items pbi
     INNER JOIN payout_batches pb ON pb.id = pbi.payout_batch_id
     INNER JOIN seller_profiles sp ON sp.id = pbi.seller_id
     WHERE pbi.status IN ('included', 'pending')
       AND pb.status IN ('approved', 'processing')
     ORDER BY pb.approved_at, pb.batch_number, pbi.id`
  );

  const csvRows = rows.map((row) => [
    row.batch_number,
    row.payout_item_id,
    row.seller_id,
    row.business_name,
    row.bank_account_name,
    row.bank_name,
    row.bank_account_number,
    row.net_amount,
    row.currency,
    row.reference,
    row.approved_at,
    row.approved_by,
  ]);
  return [header, ...csvRows].map((row) => row.map(csvCell).join(",")).join("\r\n");
}
