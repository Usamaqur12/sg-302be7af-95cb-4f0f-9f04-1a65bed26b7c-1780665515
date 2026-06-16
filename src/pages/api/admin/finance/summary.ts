import type { NextApiRequest, NextApiResponse } from "next";
import type { RowDataPacket } from "mysql2";
import { canUseLocalDevAuthFallback, queryRows } from "@/lib/server/db";
import { readLocalDatabase } from "@/lib/server/local-db";
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

interface CodReconciliation {
  id: string;
  order_id: string;
  payment_id: string | null;
  order_number: string | null;
  customer_name: string | null;
  courier_name: string | null;
  courier_reference: string | null;
  expected_amount: number;
  collected_amount: number;
  remitted_amount: number;
  courier_fee: number;
  discrepancy_amount: number;
  currency: string;
  status: CodStatus;
  collected_at: string | null;
  remitted_at: string | null;
  reconciled_at: string | null;
  notes: string | null;
  created_at: string | null;
}

interface FinanceSummary {
  completedSales: number;
  users: number;
  activeProducts: number;
  platformCommission: number;
  collectedCash: number;
  unreconciledCod: number;
  codVariance: number;
  refundExposure: number;
  sellerPayable: number;
  payoutPaid: number;
  paymentFees: number;
  contributionMargin: number;
  codReconciliations: CodReconciliation[];
  topProducts: Array<{ id: string; title: string; sales_count: number; estimated_revenue: number }>;
  topSellers: Array<{ id: string; business_name: string; total_sales: number; total_earnings: number }>;
}

function money(value: unknown) {
  const numeric = Number(value || 0);
  return Number.isFinite(numeric) ? Number(numeric.toFixed(2)) : 0;
}

function sum<T>(rows: T[], pick: (row: T) => unknown) {
  return money(rows.reduce((total, row) => total + Number(pick(row) || 0), 0));
}

async function localSummary(): Promise<FinanceSummary> {
  const db = await readLocalDatabase();
  const completedPayments = db.payments.filter((payment) => payment.status === "completed");
  const orderItems = db.order_items;
  const codRows = db.cod_reconciliations;
  const unresolvedCod = codRows.filter((row) => !["reconciled", "written_off"].includes(String(row.status)));
  const refundRows = db.return_requests.filter((row) =>
    ["requested", "approved", "processing"].includes(String(row.status))
  );
  const sellerPayableRows = db.seller_earnings.filter((row) =>
    ["available", "processing", "pending"].includes(String(row.status))
  );

  const topProducts = [...db.products]
    .sort((a, b) => Number(b.sales_count || 0) - Number(a.sales_count || 0))
    .slice(0, 5)
    .map((product) => ({
      id: String(product.id),
      title: String(product.title || "Untitled product"),
      sales_count: Number(product.sales_count || 0),
      estimated_revenue: money(Number(product.price || 0) * Number(product.sales_count || 0)),
    }));

  const topSellers = [...db.seller_profiles]
    .sort((a, b) => Number(b.total_sales || 0) - Number(a.total_sales || 0))
    .slice(0, 5)
    .map((seller) => ({
      id: String(seller.id),
      business_name: String(seller.business_name || "Seller"),
      total_sales: money(seller.total_sales),
      total_earnings: money(seller.total_earnings),
    }));

  const codReconciliations = codRows
    .slice()
    .sort((a, b) => String(b.created_at || "").localeCompare(String(a.created_at || "")))
    .slice(0, 25)
    .map((row) => {
      const order = db.orders.find((item) => item.id === row.order_id);
      const customer = db.profiles.find((item) => item.id === order?.customer_id);
      return {
        id: String(row.id),
        order_id: String(row.order_id),
        payment_id: row.payment_id ? String(row.payment_id) : null,
        order_number: order?.order_number ? String(order.order_number) : null,
        customer_name: customer?.full_name ? String(customer.full_name) : null,
        courier_name: row.courier_name ? String(row.courier_name) : null,
        courier_reference: row.courier_reference ? String(row.courier_reference) : null,
        expected_amount: money(row.expected_amount),
        collected_amount: money(row.collected_amount),
        remitted_amount: money(row.remitted_amount),
        courier_fee: money(row.courier_fee),
        discrepancy_amount: money(row.discrepancy_amount),
        currency: String(row.currency || "PKR"),
        status: String(row.status || "awaiting_collection") as CodStatus,
        collected_at: row.collected_at ? String(row.collected_at) : null,
        remitted_at: row.remitted_at ? String(row.remitted_at) : null,
        reconciled_at: row.reconciled_at ? String(row.reconciled_at) : null,
        notes: row.notes ? String(row.notes) : null,
        created_at: row.created_at ? String(row.created_at) : null,
      };
    });

  const platformCommission = sum(orderItems, (item) => item.commission_amount);
  const collectedCash = sum(codRows, (row) => row.remitted_amount);
  const codVariance = sum(codRows, (row) => Math.abs(Number(row.discrepancy_amount || 0)));
  const refundExposure = sum(refundRows, (row) => row.refund_amount);
  const sellerPayable = sum(sellerPayableRows, (row) => row.amount);
  const paymentFees = sum(codRows, (row) => row.courier_fee);

  return {
    completedSales: sum(completedPayments, (payment) => payment.amount),
    users: db.profiles.length,
    activeProducts: db.products.filter((product) => product.status === "approved").length,
    platformCommission,
    collectedCash,
    unreconciledCod: sum(unresolvedCod, (row) => row.expected_amount),
    codVariance,
    refundExposure,
    sellerPayable,
    payoutPaid: sum(db.withdrawal_requests.filter((row) => row.status === "completed"), (row) => row.amount),
    paymentFees,
    contributionMargin: money(platformCommission - paymentFees - refundExposure - codVariance),
    codReconciliations,
    topProducts,
    topSellers,
  };
}

async function mysqlSummary(): Promise<FinanceSummary> {
  const [metrics] = await queryRows<Array<RowDataPacket & {
    completed_sales: number;
    users: number;
    active_products: number;
    platform_commission: number;
    collected_cash: number;
    unreconciled_cod: number;
    cod_variance: number;
    refund_exposure: number;
    seller_payable: number;
    payout_paid: number;
    payment_fees: number;
  }>>(
    `SELECT
       COALESCE((SELECT SUM(amount) FROM payments WHERE status = 'completed'), 0) AS completed_sales,
       COALESCE((SELECT COUNT(*) FROM profiles), 0) AS users,
       COALESCE((SELECT COUNT(*) FROM products WHERE status = 'approved'), 0) AS active_products,
       COALESCE((SELECT SUM(commission_amount) FROM order_items), 0) AS platform_commission,
       COALESCE((SELECT SUM(remitted_amount) FROM cod_reconciliations), 0) AS collected_cash,
       COALESCE((SELECT SUM(expected_amount) FROM cod_reconciliations WHERE status NOT IN ('reconciled', 'written_off')), 0) AS unreconciled_cod,
       COALESCE((SELECT SUM(ABS(discrepancy_amount)) FROM cod_reconciliations), 0) AS cod_variance,
       COALESCE((SELECT SUM(COALESCE(refund_amount, 0)) FROM return_requests WHERE status IN ('requested', 'approved', 'processing')), 0) AS refund_exposure,
       COALESCE((SELECT SUM(amount) FROM seller_earnings WHERE status IN ('pending', 'processing', 'available')), 0) AS seller_payable,
       COALESCE((SELECT SUM(amount) FROM withdrawal_requests WHERE status = 'completed'), 0) AS payout_paid,
       COALESCE((SELECT SUM(courier_fee) FROM cod_reconciliations), 0) AS payment_fees`
  );

  const codReconciliations = await queryRows<Array<RowDataPacket & CodReconciliation>>(
    `SELECT
       cr.id, cr.order_id, cr.payment_id, o.order_number, p.full_name AS customer_name,
       cr.courier_name, cr.courier_reference, cr.expected_amount, cr.collected_amount,
       cr.remitted_amount, cr.courier_fee, cr.discrepancy_amount, cr.currency, cr.status,
       cr.collected_at, cr.remitted_at, cr.reconciled_at, cr.notes, cr.created_at
     FROM cod_reconciliations cr
     LEFT JOIN orders o ON o.id = cr.order_id
     LEFT JOIN profiles p ON p.id = o.customer_id
     ORDER BY cr.created_at DESC
     LIMIT 25`
  );

  const topProducts = await queryRows<Array<RowDataPacket & {
    id: string;
    title: string;
    sales_count: number;
    estimated_revenue: number;
  }>>(
    `SELECT id, title, COALESCE(sales_count, 0) AS sales_count,
            COALESCE(price, 0) * COALESCE(sales_count, 0) AS estimated_revenue
     FROM products
     WHERE status = 'approved'
     ORDER BY sales_count DESC
     LIMIT 5`
  );

  const topSellers = await queryRows<Array<RowDataPacket & {
    id: string;
    business_name: string;
    total_sales: number;
    total_earnings: number;
  }>>(
    `SELECT id, business_name, COALESCE(total_sales, 0) AS total_sales,
            COALESCE(total_earnings, 0) AS total_earnings
     FROM seller_profiles
     WHERE status = 'approved'
     ORDER BY total_sales DESC
     LIMIT 5`
  );

  const platformCommission = money(metrics?.platform_commission);
  const paymentFees = money(metrics?.payment_fees);
  const refundExposure = money(metrics?.refund_exposure);
  const codVariance = money(metrics?.cod_variance);

  return {
    completedSales: money(metrics?.completed_sales),
    users: Number(metrics?.users || 0),
    activeProducts: Number(metrics?.active_products || 0),
    platformCommission,
    collectedCash: money(metrics?.collected_cash),
    unreconciledCod: money(metrics?.unreconciled_cod),
    codVariance,
    refundExposure,
    sellerPayable: money(metrics?.seller_payable),
    payoutPaid: money(metrics?.payout_paid),
    paymentFees,
    contributionMargin: money(platformCommission - paymentFees - refundExposure - codVariance),
    codReconciliations: codReconciliations.map((row) => ({
      ...row,
      expected_amount: money(row.expected_amount),
      collected_amount: money(row.collected_amount),
      remitted_amount: money(row.remitted_amount),
      courier_fee: money(row.courier_fee),
      discrepancy_amount: money(row.discrepancy_amount),
    })),
    topProducts: topProducts.map((row) => ({
      id: row.id,
      title: row.title,
      sales_count: Number(row.sales_count || 0),
      estimated_revenue: money(row.estimated_revenue),
    })),
    topSellers: topSellers.map((row) => ({
      id: row.id,
      business_name: row.business_name,
      total_sales: money(row.total_sales),
      total_earnings: money(row.total_earnings),
    })),
  };
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const session = await readSession(req);
  if (session?.role !== "admin") {
    return res.status(403).json({ error: "Only admin can view finance reports" });
  }

  try {
    const summary = canUseLocalDevAuthFallback() ? await localSummary() : await mysqlSummary();
    return res.status(200).json({ report: summary });
  } catch (error) {
    return res.status(500).json({
      error: error instanceof Error ? error.message : "Could not load finance report",
    });
  }
}
