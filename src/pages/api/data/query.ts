import { randomUUID } from "node:crypto";
import type { NextApiRequest, NextApiResponse } from "next";
import type { ResultSetHeader, RowDataPacket } from "mysql2";
import { emailService, isEmailConfigured } from "@/lib/email";
import { canUseLocalDevAuthFallback, queryRows, withTransaction } from "@/lib/server/db";
import { localMutate, localSelect, readLocalDatabase, releaseLocalSellerEarnings } from "@/lib/server/local-db";
import { logServerEvent } from "@/lib/server/observability";
import { enforceRateLimit } from "@/lib/server/rate-limit";
import { readSession, type SessionUser } from "@/lib/server/session";

type FilterOp = "eq" | "neq" | "gt" | "gte" | "lt" | "lte" | "ilike" | "in" | "is" | "not_is";

interface Filter {
  column: string;
  op: FilterOp;
  value: unknown;
}

interface DataQuery {
  table: string;
  operation: "select" | "insert" | "update" | "delete" | "upsert";
  columns?: string;
  filters?: Filter[];
  orFilters?: Array<{ columns: string[]; op: "ilike"; value: string }>;
  order?: Array<{ column: string; ascending: boolean }>;
  limit?: number;
  range?: { from: number; to: number };
  single?: boolean;
  maybeSingle?: boolean;
  head?: boolean;
  count?: "exact";
  payload?: Record<string, unknown> | Array<Record<string, unknown>>;
  onConflict?: string;
}

const TABLES = new Set([
  "profiles",
  "seller_profiles",
  "categories",
  "products",
  "product_images",
  "product_variants",
  "carts",
  "cart_items",
  "wishlists",
  "orders",
  "order_items",
  "payments",
  "seller_earnings",
  "withdrawal_requests",
  "reviews",
  "return_requests",
  "support_tickets",
  "ticket_messages",
  "coupons",
  "promotion_requests",
  "marketing_campaigns",
  "marketing_ad_events",
  "banners",
  "customer_addresses",
  "system_settings",
  "admin_audit_logs",
  "email_delivery_logs",
  "upload_files",
]);

const PUBLIC_READ_TABLES = new Set([
  "categories",
  "products",
  "product_images",
  "seller_profiles",
  "reviews",
  "banners",
  "system_settings",
]);

const STAFF_READ_ROLES = new Set(["admin", "manager", "warehouse"]);

const SENSITIVE_SELLER_PROFILE_FIELDS = [
  "business_address",
  "business_phone",
  "business_email",
  "kyc_document_url",
  "kyc_document_type",
  "tax_id",
  "owner_full_name",
  "owner_cnic",
  "cnic_front_url",
  "cnic_back_url",
  "business_registration_url",
  "tax_certificate_url",
  "bank_statement_url",
  "brand_authorization_url",
  "pickup_address",
  "return_address",
  "bank_account_name",
  "bank_account_number",
  "bank_name",
  "total_sales",
  "total_earnings",
  "available_balance",
  "order_volume_limit",
  "non_compliance_points",
  "admin_note",
  "seller_center_enabled_options",
];

const PUBLIC_COLUMNS_BY_TABLE: Record<string, Set<string>> = {
  categories: new Set([
    "id",
    "name",
    "slug",
    "description",
    "image_url",
    "icon",
    "parent_id",
    "display_order",
    "is_active",
    "created_at",
    "updated_at",
  ]),
  products: new Set([
    "id",
    "seller_id",
    "category_id",
    "title",
    "slug",
    "description",
    "price",
    "compare_at_price",
    "sku",
    "stock_quantity",
    "low_stock_threshold",
    "weight",
    "dimensions",
    "status",
    "featured",
    "sales_count",
    "view_count",
    "rating",
    "total_reviews",
    "created_at",
    "updated_at",
  ]),
  product_images: new Set(["id", "product_id", "url", "alt_text", "display_order", "created_at"]),
  seller_profiles: new Set([
    "id",
    "business_name",
    "business_description",
    "logo_url",
    "banner_url",
    "status",
    "rating",
    "total_reviews",
    "holiday_mode",
    "holiday_message",
    "created_at",
    "updated_at",
  ]),
  reviews: new Set([
    "id",
    "product_id",
    "user_id",
    "rating",
    "title",
    "comment",
    "is_verified",
    "created_at",
    "updated_at",
  ]),
  banners: new Set([
    "id",
    "title",
    "subtitle",
    "image_url",
    "link_url",
    "position",
    "is_active",
    "display_order",
    "created_at",
    "updated_at",
  ]),
  system_settings: new Set(["id", "key", "value", "description", "updated_at"]),
};

const PUBLIC_SETTINGS_KEYS = new Set([
  "marketplace_name",
  "marketplace_logo",
  "marketplace_favicon",
  "marketplace_description",
  "site_name",
  "site_currency_code",
  "site_currency_symbol",
  "site_currency_rate",
  "default_delivery_city",
  "footer_about_text",
  "footer_links_json",
  "seller_campaign_slots_json",
  "theme_config",
  "homepage_sections",
  "public_pages_json",
  "seller_payout_hold_days",
]);

const STAFF_SELECT_TABLES = new Set([
  "seller_profiles",
  "categories",
  "products",
  "product_images",
  "product_variants",
  "orders",
  "order_items",
  "payments",
  "seller_earnings",
  "withdrawal_requests",
  "return_requests",
  "support_tickets",
  "ticket_messages",
  "coupons",
  "promotion_requests",
  "marketing_campaigns",
  "marketing_ad_events",
  "banners",
  "customer_addresses",
  "system_settings",
]);

const PAYOUT_RELEASE_READ_TABLES = new Set([
  "seller_profiles",
  "seller_earnings",
  "withdrawal_requests",
  "orders",
  "order_items",
]);

const AUDITED_STATE_TABLES = new Set([
  "orders",
  "payments",
  "seller_earnings",
  "withdrawal_requests",
  "return_requests",
  "seller_profiles",
  "products",
]);

interface SellerAccess {
  id: string;
  status: string;
}

function safeIdentifier(identifier: string) {
  if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(identifier)) {
    throw new Error("Invalid database identifier");
  }
  return `\`${identifier}\``;
}

function normalizePayload(payload: DataQuery["payload"]) {
  if (!payload) return [];
  const rows = Array.isArray(payload) ? payload : [payload];
  return rows.map((row) => ({ ...row, id: row.id || randomUUID() }));
}

function sqlValue(value: unknown): string | number | boolean | null {
  if (value === undefined) return null;
  if (value === null) return null;
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return value;
  }
  if (typeof value === "bigint") return value.toString();
  if (value && typeof value === "object" && !(value instanceof Date)) {
    return JSON.stringify(value);
  }
  return String(value);
}

function payloadRows(payload: DataQuery["payload"]) {
  if (!payload) return [];
  return Array.isArray(payload) ? payload : [payload];
}

function idFilters(query: DataQuery) {
  return (query.filters || [])
    .filter((filter) => filter.column === "id" && filter.op === "eq")
    .map((filter) => String(filter.value));
}

function metadataStateRows(result: unknown) {
  const data = (result as { data?: unknown })?.data;
  if (!data) return [];
  return Array.isArray(data) ? data : [data];
}

function redactAuditRow(row: Record<string, unknown>) {
  const sensitiveKeys = new Set([
    "password_hash",
    "kyc_document_url",
    "cnic_front_url",
    "cnic_back_url",
    "owner_cnic",
    "tax_id",
    "payment_proof_url",
    "storage_path",
  ]);
  return Object.fromEntries(
    Object.entries(row).map(([key, value]) => [key, sensitiveKeys.has(key) ? "[redacted]" : value])
  );
}

async function captureAuditPreviousState(query: DataQuery, useLocalDevDb: boolean) {
  if (query.operation === "select" || query.operation === "insert") return [];
  if (!AUDITED_STATE_TABLES.has(query.table)) return [];
  if (!query.filters?.length) return [];

  const snapshotQuery: DataQuery = {
    ...query,
    operation: "select",
    columns: "*",
    payload: undefined,
    order: undefined,
    limit: 25,
    range: undefined,
    single: false,
    maybeSingle: false,
    head: false,
    count: undefined,
  };
  const result = useLocalDevDb ? await localSelect(snapshotQuery) : await selectRows(snapshotQuery);
  return metadataStateRows(result).map((row) => redactAuditRow(row as Record<string, unknown>));
}

function eqFilters(query: DataQuery, column: string) {
  return (query.filters || [])
    .filter((filter) => filter.column === column && filter.op === "eq")
    .map((filter) => String(filter.value));
}

function forbidPayloadKeys(query: DataQuery, keys: string[]) {
  for (const row of payloadRows(query.payload)) {
    for (const key of keys) {
      if (Object.prototype.hasOwnProperty.call(row, key)) {
        throw new Error(`Access denied: ${key} cannot be changed from this portal`);
      }
    }
  }
}

function allowOnlyPayloadKeys(query: DataQuery, keys: string[]) {
  const allowed = new Set(keys);
  for (const row of payloadRows(query.payload)) {
    for (const key of Object.keys(row)) {
      if (!allowed.has(key)) {
        throw new Error(`Access denied: ${key} cannot be changed from this portal`);
      }
    }
  }
}

function prepareSupportTicketPayload(query: DataQuery, session: SessionUser) {
  for (const row of payloadRows(query.payload)) {
    row.user_id = session.id;
    row.ticket_number = row.ticket_number || `TKT-${Date.now()}-${randomUUID().slice(0, 6).toUpperCase()}`;
    row.status = row.status || "open";
  }
}

const MANAGER_MUTATION_TABLES = new Set([
  "seller_profiles",
  "categories",
  "products",
  "product_images",
  "product_variants",
  "orders",
  "order_items",
  "payments",
  "seller_earnings",
  "withdrawal_requests",
  "return_requests",
  "support_tickets",
  "ticket_messages",
  "coupons",
  "promotion_requests",
  "marketing_campaigns",
  "marketing_ad_events",
  "banners",
]);

function ensureStaffMutationAccess(query: DataQuery, session: SessionUser) {
  if (session.role === "manager") {
    if (!MANAGER_MUTATION_TABLES.has(query.table)) {
      throw new Error("Access denied: managers cannot change this area");
    }
    return;
  }

  if (session.role !== "warehouse") {
    throw new Error("Authentication required");
  }

  if (query.table === "orders" && query.operation === "update") {
    allowOnlyPayloadKeys(query, [
      "status",
      "tracking_number",
      "shipped_at",
      "delivered_at",
      "updated_at",
    ]);
    return;
  }

  if (query.table === "products" && query.operation === "update") {
    allowOnlyPayloadKeys(query, [
      "stock_quantity",
      "low_stock_threshold",
      "status",
      "updated_at",
    ]);
    return;
  }

  if (query.table === "return_requests" && query.operation === "update") {
    allowOnlyPayloadKeys(query, [
      "status",
      "admin_note",
      "approved_at",
      "rejected_at",
      "updated_at",
    ]);
    return;
  }

  if (query.table === "support_tickets" && ["insert", "upsert"].includes(query.operation)) {
    prepareSupportTicketPayload(query, session);
    return;
  }

  if (query.table === "support_tickets" && query.operation === "update") {
    allowOnlyPayloadKeys(query, ["status", "assigned_to", "updated_at"]);
    return;
  }

  if (query.table === "ticket_messages" && ["insert", "upsert"].includes(query.operation)) {
    return;
  }

  throw new Error("Access denied: warehouse can only update fulfillment, stock, returns and support");
}

function prepareReturnRequestPayload(query: DataQuery, session: SessionUser) {
  for (const row of payloadRows(query.payload)) {
    row.customer_id = session.id;
    row.return_number = row.return_number || `RET-${Date.now()}-${randomUUID().slice(0, 6).toUpperCase()}`;
    row.status = "requested";
  }
}

async function getSellerAccess(userId: string, useLocalDevDb: boolean): Promise<SellerAccess | null> {
  if (useLocalDevDb) {
    const db = await readLocalDatabase();
    const seller = db.seller_profiles.find((row) => String(row.user_id) === userId);
    return seller
      ? { id: String(seller.id), status: String(seller.status || "pending") }
      : null;
  }

  const rows = await queryRows<Array<RowDataPacket & SellerAccess>>(
    "SELECT id, status FROM seller_profiles WHERE user_id = ? LIMIT 1",
    [userId]
  );
  return rows[0] ? { id: rows[0].id, status: rows[0].status } : null;
}

async function sellerOwnsProducts(
  sellerId: string,
  productIds: string[],
  useLocalDevDb: boolean
) {
  const uniqueIds = [...new Set(productIds.filter(Boolean))];
  if (!uniqueIds.length) return false;

  if (useLocalDevDb) {
    const db = await readLocalDatabase();
    return uniqueIds.every((id) =>
      db.products.some((product) => String(product.id) === id && String(product.seller_id) === sellerId)
    );
  }

  const rows = await queryRows<Array<RowDataPacket & { id: string }>>(
    `SELECT id FROM products WHERE seller_id = ? AND id IN (${uniqueIds.map(() => "?").join(", ")})`,
    [sellerId, ...uniqueIds]
  );
  return rows.length === uniqueIds.length;
}

async function categoriesAreFinalLeaf(categoryIds: string[], useLocalDevDb: boolean) {
  const uniqueIds = [...new Set(categoryIds.filter(Boolean))];
  if (!uniqueIds.length) return false;

  if (useLocalDevDb) {
    const db = await readLocalDatabase();
    return uniqueIds.every((id) => {
      const category = db.categories.find((row) => String(row.id) === id && String(row.is_active ?? 1) !== "0");
      const hasChildren = db.categories.some(
        (row) => String(row.parent_id || "") === id && String(row.is_active ?? 1) !== "0"
      );
      return Boolean(category && !hasChildren);
    });
  }

  const rows = await queryRows<Array<RowDataPacket & { id: string; child_count: number }>>(
    `SELECT c.id, COUNT(child.id) AS child_count
     FROM categories c
     LEFT JOIN categories child ON child.parent_id = c.id AND child.is_active = 1
     WHERE c.is_active = 1 AND c.id IN (${uniqueIds.map(() => "?").join(", ")})
     GROUP BY c.id`,
    uniqueIds
  );

  return rows.length === uniqueIds.length && rows.every((row) => Number(row.child_count) === 0);
}

async function sellerOwnsOrders(
  sellerId: string,
  orderIds: string[],
  useLocalDevDb: boolean
) {
  const uniqueIds = [...new Set(orderIds.filter(Boolean))];
  if (!uniqueIds.length) return false;

  if (useLocalDevDb) {
    const db = await readLocalDatabase();
    return uniqueIds.every((id) =>
      db.order_items.some((item) => String(item.order_id) === id && String(item.seller_id) === sellerId)
    );
  }

  const rows = await queryRows<Array<RowDataPacket & { order_id: string }>>(
    `SELECT DISTINCT order_id FROM order_items WHERE seller_id = ? AND order_id IN (${uniqueIds.map(() => "?").join(", ")})`,
    [sellerId, ...uniqueIds]
  );
  return rows.length === uniqueIds.length;
}

async function customerOwnsOrders(
  customerId: string,
  orderIds: string[],
  useLocalDevDb: boolean
) {
  const uniqueIds = [...new Set(orderIds.filter(Boolean))];
  if (!uniqueIds.length) return false;

  if (useLocalDevDb) {
    const db = await readLocalDatabase();
    return uniqueIds.every((id) =>
      db.orders.some((order) => String(order.id) === id && String(order.customer_id) === customerId)
    );
  }

  const rows = await queryRows<Array<RowDataPacket & { id: string }>>(
    `SELECT id FROM orders WHERE customer_id = ? AND id IN (${uniqueIds.map(() => "?").join(", ")})`,
    [customerId, ...uniqueIds]
  );
  return rows.length === uniqueIds.length;
}

async function customerOwnsCarts(customerId: string, cartIds: string[], useLocalDevDb: boolean) {
  const uniqueIds = [...new Set(cartIds.filter(Boolean))];
  if (!uniqueIds.length) return false;

  if (useLocalDevDb) {
    const db = await readLocalDatabase();
    return uniqueIds.every((id) =>
      db.carts.some((cart) => String(cart.id) === id && String(cart.user_id) === customerId)
    );
  }

  const rows = await queryRows<Array<RowDataPacket & { id: string }>>(
    `SELECT id FROM carts WHERE user_id = ? AND id IN (${uniqueIds.map(() => "?").join(", ")})`,
    [customerId, ...uniqueIds]
  );
  return rows.length === uniqueIds.length;
}

async function sellerOwnsProductImages(
  sellerId: string,
  imageIds: string[],
  useLocalDevDb: boolean
) {
  const uniqueIds = [...new Set(imageIds.filter(Boolean))];
  if (!uniqueIds.length) return false;

  if (useLocalDevDb) {
    const db = await readLocalDatabase();
    return uniqueIds.every((id) => {
      const image = db.product_images.find((row) => String(row.id) === id);
      return Boolean(image && db.products.some(
        (product) =>
          String(product.id) === String(image.product_id) &&
          String(product.seller_id) === sellerId
      ));
    });
  }

  const rows = await queryRows<Array<RowDataPacket & { id: string }>>(
    `SELECT pi.id
     FROM product_images pi
     INNER JOIN products p ON p.id = pi.product_id
     WHERE p.seller_id = ? AND pi.id IN (${uniqueIds.map(() => "?").join(", ")})`,
    [sellerId, ...uniqueIds]
  );
  return rows.length === uniqueIds.length;
}

async function sellerOwnsMarketingCampaigns(
  sellerId: string,
  campaignIds: string[],
  useLocalDevDb: boolean
) {
  const uniqueIds = [...new Set(campaignIds.filter(Boolean))];
  if (!uniqueIds.length) return false;

  if (useLocalDevDb) {
    const db = await readLocalDatabase();
    return uniqueIds.every((id) =>
      db.marketing_campaigns.some((campaign) => String(campaign.id) === id && String(campaign.seller_id) === sellerId)
    );
  }

  const rows = await queryRows<Array<RowDataPacket & { id: string }>>(
    `SELECT id FROM marketing_campaigns WHERE seller_id = ? AND id IN (${uniqueIds.map(() => "?").join(", ")})`,
    [sellerId, ...uniqueIds]
  );
  return rows.length === uniqueIds.length;
}

async function sellerOwnsPromotionRequests(
  sellerId: string,
  requestIds: string[],
  useLocalDevDb: boolean
) {
  const uniqueIds = [...new Set(requestIds.filter(Boolean))];
  if (!uniqueIds.length) return false;

  if (useLocalDevDb) {
    const db = await readLocalDatabase();
    return uniqueIds.every((id) =>
      db.promotion_requests.some((request) => String(request.id) === id && String(request.seller_id) === sellerId)
    );
  }

  const rows = await queryRows<Array<RowDataPacket & { id: string }>>(
    `SELECT id FROM promotion_requests WHERE seller_id = ? AND id IN (${uniqueIds.map(() => "?").join(", ")})`,
    [sellerId, ...uniqueIds]
  );
  return rows.length === uniqueIds.length;
}

function scopedToUser(query: DataQuery, userId: string, column = "user_id") {
  return (query.filters || []).some(
    (filter) => filter.column === column && filter.op === "eq" && String(filter.value) === userId
  );
}

function isStaff(session: SessionUser | null) {
  return Boolean(session && STAFF_READ_ROLES.has(session.role));
}

function hasScopedFilter(query: DataQuery, column: string, value: string) {
  return (query.filters || []).some((filter) => {
    if (filter.column !== column) return false;
    if (filter.op === "eq") return String(filter.value) === value;
    if (filter.op === "in" && Array.isArray(filter.value)) {
      return filter.value.length > 0 && filter.value.every((item) => String(item) === value);
    }
    return false;
  });
}

function filterValues(query: DataQuery, column: string) {
  const values: string[] = [];
  for (const filter of query.filters || []) {
    if (filter.column !== column) continue;
    if (filter.op === "eq") values.push(String(filter.value));
    if (filter.op === "in" && Array.isArray(filter.value)) {
      values.push(...filter.value.map((item) => String(item)));
    }
  }
  return values.filter(Boolean);
}

function redactRecord(table: string, row: RowDataPacket | Record<string, unknown>) {
  const allowed = PUBLIC_COLUMNS_BY_TABLE[table];
  if (!allowed) return row;

  if (table === "system_settings" && !PUBLIC_SETTINGS_KEYS.has(String(row.key || ""))) {
    return null;
  }

  const next: Record<string, unknown> = {};
  for (const key of allowed) {
    if (Object.prototype.hasOwnProperty.call(row, key)) next[key] = row[key];
  }

  if (table === "products") {
    if (Array.isArray(row.images)) {
      next.images = row.images
        .map((image) => redactRecord("product_images", image))
        .filter(Boolean);
    }
    if (row.category && typeof row.category === "object") {
      next.category = redactRecord("categories", row.category as RowDataPacket);
    }
    if (row.seller && typeof row.seller === "object") {
      next.seller = redactRecord("seller_profiles", row.seller as RowDataPacket);
    }
  }

  return next;
}

function redactPublicResult(query: DataQuery, result: { data: unknown; count: number | null }) {
  if (query.head) return result;

  const redact = (row: unknown) => {
    if (!row || typeof row !== "object") return row;
    return redactRecord(query.table, row as RowDataPacket);
  };

  const data = Array.isArray(result.data)
    ? result.data.map(redact).filter(Boolean)
    : redact(result.data);

  return {
    ...result,
    data,
    count: query.count === "exact" && Array.isArray(data) ? data.length : result.count,
  };
}

function shouldRedactSelect(query: DataQuery, session: SessionUser | null) {
  if (query.operation !== "select" || !PUBLIC_READ_TABLES.has(query.table)) return false;
  if (session?.role === "admin" || session?.role === "manager" || session?.role === "warehouse") {
    return false;
  }
  if (session?.role === "seller" && query.table === "seller_profiles" && scopedToUser(query, session.id)) {
    return false;
  }
  return true;
}

function buildWhere(query: DataQuery) {
  const values: unknown[] = [];
  const clauses: string[] = [];

  for (const filter of query.filters || []) {
    const column = safeIdentifier(filter.column);
    if (filter.op === "eq") clauses.push(`${column} = ?`);
    if (filter.op === "neq") clauses.push(`${column} <> ?`);
    if (filter.op === "gt") clauses.push(`${column} > ?`);
    if (filter.op === "gte") clauses.push(`${column} >= ?`);
    if (filter.op === "lt") clauses.push(`${column} < ?`);
    if (filter.op === "lte") clauses.push(`${column} <= ?`);
    if (filter.op === "ilike") clauses.push(`LOWER(${column}) LIKE LOWER(?)`);
    if (filter.op === "is" && filter.value === null) clauses.push(`${column} IS NULL`);
    if (filter.op === "not_is" && filter.value === null) clauses.push(`${column} IS NOT NULL`);
    if (filter.op === "in" && Array.isArray(filter.value)) {
      clauses.push(`${column} IN (${filter.value.map(() => "?").join(", ")})`);
      values.push(...filter.value);
      continue;
    }
    if (!["is", "not_is", "in"].includes(filter.op)) values.push(filter.value);
  }

  for (const group of query.orFilters || []) {
    const parts = group.columns.map((column) => `LOWER(${safeIdentifier(column)}) LIKE LOWER(?)`);
    clauses.push(`(${parts.join(" OR ")})`);
    values.push(...group.columns.map(() => group.value));
  }

  return {
    sql: clauses.length ? ` WHERE ${clauses.join(" AND ")}` : "",
    values,
  };
}

function buildOrder(query: DataQuery) {
  if (!query.order?.length) return "";
  return ` ORDER BY ${query.order
    .map((item) => `${safeIdentifier(item.column)} ${item.ascending ? "ASC" : "DESC"}`)
    .join(", ")}`;
}

function buildLimit(query: DataQuery) {
  if (query.range) {
    const size = Math.max(query.range.to - query.range.from + 1, 0);
    return { sql: " LIMIT ? OFFSET ?", values: [size, query.range.from] };
  }
  if (query.limit) return { sql: " LIMIT ?", values: [query.limit] };
  return { sql: "", values: [] as number[] };
}

async function selectRows(query: DataQuery) {
  const table = safeIdentifier(query.table);
  const where = buildWhere(query);
  const order = buildOrder(query);

  if (query.head && query.count === "exact") {
    const rows = await queryRows<Array<RowDataPacket & { count: number }>>(
      `SELECT COUNT(*) AS count FROM ${table}${where.sql}`,
      where.values
    );
    return { data: null, count: rows[0]?.count ?? 0 };
  }

  const limit = buildLimit(query);
  const rows = await queryRows<RowDataPacket[]>(
    `SELECT * FROM ${table}${where.sql}${order}${limit.sql}`,
    [...where.values, ...limit.values]
  );
  const data = await enrichRows(query.table, query.columns || "", rows);
  return {
    data: query.single || query.maybeSingle ? data[0] ?? null : data,
    count: query.count === "exact" ? data.length : null,
  };
}

async function mutateRows(query: DataQuery) {
  const table = safeIdentifier(query.table);

  if (query.operation === "delete") {
    const where = buildWhere(query);
    await queryRows<RowDataPacket[]>(`DELETE FROM ${table}${where.sql}`, where.values);
    return { data: null, count: null };
  }

  const rows = normalizePayload(query.payload);
  if (!rows.length) return { data: null, count: null };

  return withTransaction(async (connection) => {
    const ids: string[] = [];

    if (query.operation === "insert" || query.operation === "upsert") {
      for (const row of rows) {
        const keys = Object.keys(row);
        ids.push(String(row.id));
        const placeholders = keys.map(() => "?").join(", ");
        const assignments = keys
          .filter((key) => key !== "id")
          .map((key) => `${safeIdentifier(key)} = VALUES(${safeIdentifier(key)})`)
          .join(", ");
        await connection.execute<ResultSetHeader>(
          `INSERT INTO ${table} (${keys.map(safeIdentifier).join(", ")})
           VALUES (${placeholders})
           ${query.operation === "upsert" ? `ON DUPLICATE KEY UPDATE ${assignments}` : ""}`,
          keys.map((key) => sqlValue(row[key]))
        );
      }
    }

    if (query.operation === "update") {
      const payload = rows[0];
      const keys = Object.keys(payload).filter((key) => key !== "id");
      const where = buildWhere(query);
      await connection.execute<ResultSetHeader>(
        `UPDATE ${table} SET ${keys.map((key) => `${safeIdentifier(key)} = ?`).join(", ")}${where.sql}`,
        [...keys.map((key) => sqlValue(payload[key])), ...where.values.map(sqlValue)]
      );
    }

    if (query.columns !== undefined || query.single || query.maybeSingle) {
      const lookupIds = ids.length ? ids : query.filters?.filter((filter) => filter.column === "id").map((filter) => String(filter.value)) || [];
      if (lookupIds.length) {
        const [selected] = await connection.execute<RowDataPacket[]>(
          `SELECT * FROM ${table} WHERE id IN (${lookupIds.map(() => "?").join(", ")})`,
          lookupIds
        );
        const data = await enrichRows(query.table, query.columns || "", selected);
        return { data: query.single || query.maybeSingle ? data[0] ?? null : data, count: null };
      }
    }

    return { data: null, count: null };
  });
}

async function fetchByIds(table: string, ids: string[]) {
  const unique = [...new Set(ids.filter(Boolean))];
  if (!unique.length) return new Map<string, RowDataPacket>();
  const rows = await queryRows<RowDataPacket[]>(
    `SELECT * FROM ${safeIdentifier(table)} WHERE id IN (${unique.map(() => "?").join(", ")})`,
    unique
  );
  return new Map(rows.map((row) => [String(row.id), row]));
}

async function enrichRows(table: string, columns: string, rows: RowDataPacket[]) {
  const data = rows.map((row) => ({ ...row }));
  if (!data.length) return data;

  if (table === "products" && columns.includes("product_images")) {
    const ids = data.map((row) => String(row.id));
    const images = await queryRows<RowDataPacket[]>(
      `SELECT * FROM product_images WHERE product_id IN (${ids.map(() => "?").join(", ")}) ORDER BY display_order ASC`,
      ids
    );
    for (const row of data) {
      row.images = images.filter((image) => image.product_id === row.id);
    }
  }

  if (table === "products" && columns.includes("categories")) {
    const categories = await fetchByIds("categories", data.map((row) => String(row.category_id)));
    for (const row of data) row.category = categories.get(String(row.category_id)) || null;
  }

  if (table === "products" && columns.includes("seller_profiles")) {
    const sellers = await fetchByIds("seller_profiles", data.map((row) => String(row.seller_id)));
    for (const row of data) row.seller = sellers.get(String(row.seller_id)) || null;
  }

  if (table === "seller_profiles" && columns.includes("user_id")) {
    const profiles = await fetchByIds("profiles", data.map((row) => String(row.user_id)));
    for (const row of data) row.profiles = profiles.get(String(row.user_id)) || null;
  }

  if (table === "orders" && columns.includes("order_items")) {
    const ids = data.map((row) => String(row.id));
    const items = await queryRows<RowDataPacket[]>(
      `SELECT * FROM order_items WHERE order_id IN (${ids.map(() => "?").join(", ")})`,
      ids
    );
    for (const row of data) row.items = items.filter((item) => item.order_id === row.id);
  }

  if (table === "return_requests") {
    if (columns.includes("orders")) {
      const orders = await fetchByIds("orders", data.map((row) => String(row.order_id)));
      for (const row of data) row.order = orders.get(String(row.order_id)) || null;
    }
    if (columns.includes("profiles")) {
      const profiles = await fetchByIds("profiles", data.map((row) => String(row.customer_id)));
      for (const row of data) row.customer = profiles.get(String(row.customer_id)) || null;
    }
  }

  if (table === "order_items" && columns.includes("orders")) {
    const orders = await fetchByIds("orders", data.map((row) => String(row.order_id)));
    for (const row of data) row.order = orders.get(String(row.order_id)) || null;
  }

  if (table === "payments" && columns.includes("orders")) {
    const orders = await fetchByIds("orders", data.map((row) => String(row.order_id)));
    const customers = await fetchByIds(
      "profiles",
      Array.from(orders.values()).map((row) => String(row.customer_id))
    );
    for (const row of data) {
      const order = orders.get(String(row.order_id));
      row.order = order ? { ...order, customer: customers.get(String(order.customer_id)) || null } : null;
    }
  }

  if (table === "reviews") {
    if (columns.includes("profiles")) {
      const profiles = await fetchByIds("profiles", data.map((row) => String(row.user_id)));
      for (const row of data) {
        const profile = profiles.get(String(row.user_id)) || null;
        row.user = profile;
        row.customer = profile;
      }
    }
    if (columns.includes("products")) {
      const products = await fetchByIds("products", data.map((row) => String(row.product_id)));
      for (const row of data) row.product = products.get(String(row.product_id)) || null;
    }
  }

  if (table === "marketing_campaigns") {
    if (columns.includes("products")) {
      const products = await fetchByIds("products", data.map((row) => String(row.product_id)));
      const productIds = Array.from(products.values()).map((row) => String(row.id));
      const images = productIds.length
        ? await queryRows<RowDataPacket[]>(
            `SELECT * FROM product_images WHERE product_id IN (${productIds.map(() => "?").join(", ")}) ORDER BY display_order ASC`,
            productIds
          )
        : [];
      const sellers = await fetchByIds(
        "seller_profiles",
        Array.from(products.values()).map((row) => String(row.seller_id))
      );
      for (const row of data) {
        const product = products.get(String(row.product_id)) || null;
        row.product = product
          ? {
              ...product,
              images: images.filter((image) => String(image.product_id) === String(product.id)),
              seller: sellers.get(String(product.seller_id)) || null,
            }
          : null;
      }
    }
    if (columns.includes("seller_profiles")) {
      const sellers = await fetchByIds("seller_profiles", data.map((row) => String(row.seller_id)));
      for (const row of data) row.seller = sellers.get(String(row.seller_id)) || null;
    }
  }

  if (table === "promotion_requests") {
    if (columns.includes("products")) {
      const products = await fetchByIds("products", data.map((row) => String(row.product_id)));
      const productIds = Array.from(products.values()).map((row) => String(row.id));
      const images = productIds.length
        ? await queryRows<RowDataPacket[]>(
            `SELECT * FROM product_images WHERE product_id IN (${productIds.map(() => "?").join(", ")}) ORDER BY display_order ASC`,
            productIds
          )
        : [];
      for (const row of data) {
        const product = products.get(String(row.product_id)) || null;
        row.product = product
          ? {
              ...product,
              images: images.filter((image) => String(image.product_id) === String(product.id)),
            }
          : null;
      }
    }
    if (columns.includes("seller_profiles")) {
      const sellers = await fetchByIds("seller_profiles", data.map((row) => String(row.seller_id)));
      for (const row of data) row.seller = sellers.get(String(row.seller_id)) || null;
    }
  }

  return data;
}

async function ensureSellerMutationAccess(
  query: DataQuery,
  session: SessionUser,
  useLocalDevDb: boolean
) {
  const seller = await getSellerAccess(session.id, useLocalDevDb);
  if (!seller) throw new Error("Access denied: seller profile not found");

  if (query.table === "products") {
    if (seller.status !== "approved") throw new Error("Seller account is not approved yet");
    if (query.operation === "insert" || query.operation === "upsert") {
      const rows = payloadRows(query.payload);
      const categoryIds = rows.map((row) => String(row.category_id || ""));
      const finalCategories = await categoriesAreFinalLeaf(categoryIds, useLocalDevDb);
      if (!finalCategories) {
        throw new Error("Select a final subcategory before submitting this product");
      }
      for (const row of rows) {
        row.seller_id = seller.id;
        row.status = "pending";
        row.approved_at = null;
        row.rejection_reason = null;
      }
      return;
    }

    const owned = await sellerOwnsProducts(seller.id, idFilters(query), useLocalDevDb);
    if (!owned) throw new Error("Access denied: product does not belong to this seller");
    forbidPayloadKeys(query, ["seller_id", "status", "approved_at", "rejection_reason"]);
    return;
  }

  if (query.table === "product_images") {
    if (seller.status !== "approved") throw new Error("Seller account is not approved yet");
    if (query.operation === "insert" || query.operation === "upsert") {
      const productIds = payloadRows(query.payload).map((row) => String(row.product_id || ""));
      const owned = await sellerOwnsProducts(seller.id, productIds, useLocalDevDb);
      if (!owned) throw new Error("Access denied: image product does not belong to this seller");
      return;
    }

    const owned = await sellerOwnsProductImages(seller.id, idFilters(query), useLocalDevDb);
    if (!owned) throw new Error("Access denied: image does not belong to this seller");
    return;
  }

  if (query.table === "seller_profiles") {
    const ids = idFilters(query);
    const scopedToOwnSeller =
      scopedToUser(query, session.id) || ids.some((id) => id === seller.id);
    if (!scopedToOwnSeller) {
      throw new Error("Access denied: seller profile scope is required");
    }
    forbidPayloadKeys(query, [
      "user_id",
      "status",
      "commission_rate",
      "total_sales",
      "total_earnings",
      "available_balance",
      "rating",
      "total_reviews",
      "order_volume_limit",
      "non_compliance_points",
      "account_health_status",
      "admin_note",
      "seller_center_enabled_options",
      "verified_at",
    ]);
    return;
  }

  if (query.table === "orders" && query.operation === "update") {
    if (seller.status !== "approved") throw new Error("Seller account is not approved yet");
    const allowedStatuses = new Set(["processing", "shipped", "delivered"]);
    for (const row of payloadRows(query.payload)) {
      if (row.status && !allowedStatuses.has(String(row.status))) {
        throw new Error("Access denied: seller can only update fulfillment status");
      }
    }
    const owned = await sellerOwnsOrders(seller.id, idFilters(query), useLocalDevDb);
    if (!owned) throw new Error("Access denied: order does not belong to this seller");
    return;
  }

  if (query.table === "withdrawal_requests" && query.operation === "insert") {
    if (seller.status !== "approved") throw new Error("Seller account is not approved yet");
    for (const row of payloadRows(query.payload)) row.seller_id = seller.id;
    return;
  }

  if (query.table === "marketing_campaigns") {
    if (seller.status !== "approved") throw new Error("Seller account is not approved yet");

    if (query.operation === "insert" || query.operation === "upsert") {
      const productIds = payloadRows(query.payload)
        .map((row) => String(row.product_id || ""))
        .filter(Boolean);
      if (productIds.length) {
        const owned = await sellerOwnsProducts(seller.id, productIds, useLocalDevDb);
        if (!owned) throw new Error("Access denied: sponsored product does not belong to this seller");
      }
      for (const row of payloadRows(query.payload)) {
        row.seller_id = seller.id;
        row.status = "pending";
        row.approved_by = null;
        row.approved_at = null;
        row.rejected_at = null;
        row.rejection_reason = null;
        row.admin_note = null;
        row.admin_score = 50;
        row.spent_amount = 0;
        row.impressions = 0;
        row.clicks = 0;
        row.conversions = 0;
        row.revenue = 0;
      }
      return;
    }

    const owned = await sellerOwnsMarketingCampaigns(seller.id, idFilters(query), useLocalDevDb);
    if (!owned) throw new Error("Access denied: campaign does not belong to this seller");
    forbidPayloadKeys(query, [
      "seller_id",
      "status",
      "approved_by",
      "approved_at",
      "rejected_at",
      "rejection_reason",
      "admin_note",
      "admin_score",
      "quality_score",
      "seller_health_score",
      "spent_amount",
      "impressions",
      "clicks",
      "conversions",
      "revenue",
    ]);
    return;
  }

  if (query.table === "promotion_requests") {
    if (seller.status !== "approved") throw new Error("Seller account is not approved yet");

    if (query.operation === "insert" || query.operation === "upsert") {
      const productIds = payloadRows(query.payload)
        .map((row) => String(row.product_id || ""))
        .filter(Boolean);
      if (productIds.length) {
        const owned = await sellerOwnsProducts(seller.id, productIds, useLocalDevDb);
        if (!owned) throw new Error("Access denied: promotion product does not belong to this seller");
      }
      for (const row of payloadRows(query.payload)) {
        row.seller_id = seller.id;
        row.status = "pending";
        row.approved_by = null;
        row.approved_at = null;
        row.rejected_at = null;
        row.rejection_reason = null;
        row.admin_note = null;
      }
      return;
    }

    const owned = await sellerOwnsPromotionRequests(seller.id, idFilters(query), useLocalDevDb);
    if (!owned) throw new Error("Access denied: promotion request does not belong to this seller");
    forbidPayloadKeys(query, [
      "seller_id",
      "status",
      "approved_by",
      "approved_at",
      "rejected_at",
      "rejection_reason",
      "admin_note",
    ]);
    return;
  }

  if (query.table === "marketing_ad_events") {
    throw new Error("Access denied: ad events are recorded by the platform");
  }

  if (query.table === "support_tickets" && (query.operation === "insert" || query.operation === "upsert")) {
    prepareSupportTicketPayload(query, session);
    return;
  }

  if (query.table === "support_tickets" && ["update", "delete"].includes(query.operation)) {
    if (!scopedToUser(query, session.id)) {
      throw new Error("Access denied: support ticket scope is required");
    }
    forbidPayloadKeys(query, ["user_id", "ticket_number", "assigned_to"]);
    return;
  }

  throw new Error("Access denied: this seller action is not allowed");
}

async function ensureCustomerMutationAccess(
  query: DataQuery,
  session: SessionUser,
  useLocalDevDb: boolean
) {
  if (query.table === "reviews" && (query.operation === "insert" || query.operation === "upsert")) {
    for (const row of payloadRows(query.payload)) row.user_id = session.id;
    return;
  }

  if (query.table === "wishlists" && ["insert", "upsert", "delete"].includes(query.operation)) {
    if (query.operation !== "delete") {
      for (const row of payloadRows(query.payload)) row.user_id = session.id;
    } else if (!scopedToUser(query, session.id)) {
      throw new Error("Access denied: wishlist scope is required");
    }
    return;
  }

  if (query.table === "customer_addresses" && ["insert", "update", "delete", "upsert"].includes(query.operation)) {
    if (query.operation === "insert" || query.operation === "upsert") {
      for (const row of payloadRows(query.payload)) row.user_id = session.id;
    } else if (!scopedToUser(query, session.id)) {
      throw new Error("Access denied: address scope is required");
    }
    return;
  }

  if (query.table === "support_tickets" && (query.operation === "insert" || query.operation === "upsert")) {
    prepareSupportTicketPayload(query, session);
    return;
  }

  if (query.table === "support_tickets" && ["update", "delete"].includes(query.operation)) {
    if (!scopedToUser(query, session.id)) {
      throw new Error("Access denied: support ticket scope is required");
    }
    forbidPayloadKeys(query, ["user_id", "ticket_number", "assigned_to"]);
    return;
  }

  if (query.table === "return_requests" && (query.operation === "insert" || query.operation === "upsert")) {
    const orderIds = payloadRows(query.payload).map((row) => String(row.order_id || ""));
    const ownsOrders = await customerOwnsOrders(session.id, orderIds, useLocalDevDb);
    if (!ownsOrders) throw new Error("Access denied: return order scope is required");
    prepareReturnRequestPayload(query, session);
    return;
  }

  if (query.table === "return_requests" && ["update", "delete"].includes(query.operation)) {
    throw new Error("Access denied: return requests are reviewed by admin");
  }

  throw new Error("Access denied: this customer action is not allowed");
}

async function recordAdminAuditLog(
  query: DataQuery,
  session: SessionUser,
  useLocalDevDb: boolean,
  previousState: Array<Record<string, unknown>> = []
) {
  if (query.operation === "select" || query.table === "admin_audit_logs") return;

  const recordIds = [
    ...idFilters(query),
    ...payloadRows(query.payload).map((row) => String(row.id || "")).filter(Boolean),
  ];
  const payload = {
    id: randomUUID(),
    admin_id: session.id,
    action: query.operation,
    table_name: query.table,
    record_id: recordIds[0] || null,
    metadata: JSON.stringify({
      record_ids: [...new Set(recordIds)],
      payload_keys: payloadRows(query.payload).flatMap((row) => Object.keys(row)),
      previous_state: previousState,
      next_state: payloadRows(query.payload).map((row) => redactAuditRow(row)),
      actor_role: session.role,
    }),
    created_at: new Date().toISOString(),
  };

  if (useLocalDevDb) {
    await localMutate({
      table: "admin_audit_logs",
      operation: "insert",
      payload,
    });
    return;
  }

  await queryRows<RowDataPacket[]>(
    `INSERT INTO admin_audit_logs
     (id, admin_id, action, table_name, record_id, metadata, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      payload.id,
      payload.admin_id,
      payload.action,
      payload.table_name,
      payload.record_id,
      payload.metadata,
      payload.created_at,
    ]
  );
}

async function notifySellerStatusIfNeeded(query: DataQuery, useLocalDevDb: boolean) {
  if (!isEmailConfigured() || query.table !== "seller_profiles") return;
  if (!["insert", "update", "upsert"].includes(query.operation)) return;

  const status = payloadRows(query.payload)
    .map((row) => String(row.status || ""))
    .find((value) => value === "approved" || value === "rejected") as "approved" | "rejected" | undefined;
  if (!status) return;

  const sellerIds = [
    ...idFilters(query),
    ...payloadRows(query.payload).map((row) => String(row.id || "")).filter(Boolean),
  ];
  if (!sellerIds.length) return;

  if (useLocalDevDb) {
    const db = await readLocalDatabase();
    const sellers = db.seller_profiles.filter((seller) => sellerIds.includes(String(seller.id)));
    await Promise.all(sellers.map((seller) => {
      const profile = db.profiles.find((item) => String(item.id) === String(seller.user_id));
      const to = String(seller.business_email || profile?.email || "");
      if (!to) return Promise.resolve();
      return emailService.sendSellerApproval({
        to,
        businessName: String(seller.business_name || "Seller"),
        status,
        reason: String(seller.rejection_reason || ""),
      });
    }));
    return;
  }

  const rows = await queryRows<Array<RowDataPacket & {
    id: string;
    business_name: string;
    business_email: string | null;
    owner_email: string | null;
    rejection_reason: string | null;
  }>>(
    `SELECT sp.id, sp.business_name, sp.business_email, sp.rejection_reason, p.email AS owner_email
     FROM seller_profiles sp
     LEFT JOIN profiles p ON p.id = sp.user_id
     WHERE sp.id IN (${sellerIds.map(() => "?").join(", ")})`,
    sellerIds
  );

  await Promise.all(rows.map((seller) => {
    const to = seller.business_email || seller.owner_email;
    if (!to) return Promise.resolve();
    return emailService.sendSellerApproval({
      to,
      businessName: seller.business_name,
      status,
      reason: seller.rejection_reason || "",
    });
  }));
}

function normalizePayoutHoldDays(value: unknown) {
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue)) return 2;
  return Math.max(0, Math.min(30, Math.floor(numericValue)));
}

async function mysqlPayoutHoldDays() {
  const rows = await queryRows<Array<RowDataPacket & { value: string | null }>>(
    "SELECT value FROM system_settings WHERE `key` = 'seller_payout_hold_days' LIMIT 1"
  );
  return normalizePayoutHoldDays(rows[0]?.value);
}

async function releaseMysqlSellerEarnings() {
  const holdDays = await mysqlPayoutHoldDays();
  const intervalSql = `${holdDays}`;

  await queryRows<RowDataPacket[]>(
    `UPDATE seller_earnings se
     INNER JOIN order_items oi ON oi.id = se.order_item_id
     INNER JOIN orders o ON o.id = oi.order_id
     SET se.status = 'processing',
         se.available_at = DATE_ADD(o.delivered_at, INTERVAL ${intervalSql} DAY)
     WHERE o.status = 'delivered'
       AND o.delivered_at IS NOT NULL
       AND se.status = 'pending'
       AND DATE_ADD(o.delivered_at, INTERVAL ${intervalSql} DAY) > NOW()`
  );

  const dueRows = await queryRows<Array<RowDataPacket & {
    id: string;
    seller_id: string;
    amount: number | string;
  }>>(
    `SELECT se.id, se.seller_id, se.amount
     FROM seller_earnings se
     INNER JOIN order_items oi ON oi.id = se.order_item_id
     INNER JOIN orders o ON o.id = oi.order_id
     WHERE o.status = 'delivered'
       AND o.delivered_at IS NOT NULL
       AND se.status IN ('pending', 'processing')
       AND DATE_ADD(o.delivered_at, INTERVAL ${intervalSql} DAY) <= NOW()`
  );

  if (!dueRows.length) return;

  const ids = dueRows.map((row) => row.id);
  await queryRows<RowDataPacket[]>(
    `UPDATE seller_earnings se
     INNER JOIN order_items oi ON oi.id = se.order_item_id
     INNER JOIN orders o ON o.id = oi.order_id
     SET se.status = 'available',
         se.available_at = COALESCE(se.available_at, DATE_ADD(o.delivered_at, INTERVAL ${intervalSql} DAY)),
         se.released_at = COALESCE(se.released_at, NOW())
     WHERE se.id IN (${ids.map(() => "?").join(", ")})
       AND se.status IN ('pending', 'processing')`,
    ids
  );

  const releaseTotals = new Map<string, number>();
  for (const row of dueRows) {
    releaseTotals.set(row.seller_id, (releaseTotals.get(row.seller_id) || 0) + Number(row.amount || 0));
  }

  for (const [sellerId, amount] of releaseTotals) {
    if (amount <= 0) continue;
    await queryRows<RowDataPacket[]>(
      "UPDATE seller_profiles SET available_balance = available_balance + ?, updated_at = NOW() WHERE id = ?",
      [amount, sellerId]
    );
  }
}

async function releaseDueSellerEarnings(useLocalDevDb: boolean) {
  if (useLocalDevDb) {
    await releaseLocalSellerEarnings();
    return;
  }
  await releaseMysqlSellerEarnings();
}

function shouldReleaseSellerEarnings(query: DataQuery) {
  return (
    (query.operation === "select" && PAYOUT_RELEASE_READ_TABLES.has(query.table)) ||
    (query.table === "orders" && ["update", "upsert"].includes(query.operation))
  );
}

async function ensureSellerSelectAccess(
  query: DataQuery,
  session: SessionUser,
  useLocalDevDb: boolean
) {
  const seller = await getSellerAccess(session.id, useLocalDevDb);

  if (query.table === "seller_profiles") {
    if (scopedToUser(query, session.id) || (seller && hasScopedFilter(query, "id", seller.id))) return;
    throw new Error("Access denied: seller profile scope is required");
  }

  if (!seller) throw new Error("Access denied: seller profile not found");

  if (
    [
      "products",
      "product_variants",
      "order_items",
      "seller_earnings",
      "withdrawal_requests",
      "marketing_campaigns",
      "promotion_requests",
    ].includes(query.table)
  ) {
    if (hasScopedFilter(query, "seller_id", seller.id)) return;
    throw new Error(`Access denied: seller ${query.table} scope is required`);
  }

  if (query.table === "product_images") {
    const productIds = filterValues(query, "product_id");
    if (productIds.length && (await sellerOwnsProducts(seller.id, productIds, useLocalDevDb))) return;
    throw new Error("Access denied: seller product image scope is required");
  }

  if (query.table === "orders") {
    const orderIds = idFilters(query);
    if (orderIds.length && (await sellerOwnsOrders(seller.id, orderIds, useLocalDevDb))) return;
    throw new Error("Access denied: seller order scope is required");
  }

  if (query.table === "support_tickets" && scopedToUser(query, session.id)) return;

  throw new Error("Access denied: this seller read is not allowed");
}

async function ensureCustomerSelectAccess(
  query: DataQuery,
  session: SessionUser,
  useLocalDevDb: boolean
) {
  if (query.table === "profiles" && hasScopedFilter(query, "id", session.id)) return;
  if (query.table === "orders" && scopedToUser(query, session.id, "customer_id")) return;
  if (["wishlists", "customer_addresses", "carts", "support_tickets"].includes(query.table)) {
    if (scopedToUser(query, session.id)) return;
    throw new Error(`Access denied: ${query.table} scope is required`);
  }
  if (query.table === "cart_items") {
    throw new Error("Access denied: use the cart API for cart items");
  }
  if (["order_items", "payments", "return_requests"].includes(query.table)) {
    if (query.table === "return_requests" && scopedToUser(query, session.id, "customer_id")) return;
    const orderIds = filterValues(query, "order_id");
    if (orderIds.length && (await customerOwnsOrders(session.id, orderIds, useLocalDevDb))) return;
    throw new Error(`Access denied: ${query.table} order scope is required`);
  }
  if (query.table === "reviews" && scopedToUser(query, session.id)) return;

  throw new Error("Access denied: this customer read is not allowed");
}

async function ensureAccess(query: DataQuery, session: SessionUser | null, useLocalDevDb: boolean) {
  if (
    query.operation === "select" &&
    PUBLIC_READ_TABLES.has(query.table) &&
    !(query.table === "seller_profiles" && session?.role === "seller" && scopedToUser(query, session.id))
  ) {
    return;
  }

  if (!session) throw new Error("Authentication required");
  if (session.role === "admin") return;

  if (query.operation === "select") {
    if (session.role === "manager" || session.role === "warehouse") {
      if (STAFF_SELECT_TABLES.has(query.table)) return;
      throw new Error("Access denied: staff cannot read this area");
    }
    if (session.role === "seller") {
      if (PUBLIC_READ_TABLES.has(query.table) && query.table !== "seller_profiles") return;
      await ensureSellerSelectAccess(query, session, useLocalDevDb);
      return;
    }
    if (session.role === "customer") {
      if (PUBLIC_READ_TABLES.has(query.table)) return;
      await ensureCustomerSelectAccess(query, session, useLocalDevDb);
      return;
    }
    throw new Error("Authentication required");
  }

  if (session.role === "manager" || session.role === "warehouse") {
    ensureStaffMutationAccess(query, session);
    return;
  }
  if (session.role === "seller") {
    await ensureSellerMutationAccess(query, session, useLocalDevDb);
    return;
  }
  if (session.role === "customer") {
    await ensureCustomerMutationAccess(query, session, useLocalDevDb);
    return;
  }
  throw new Error("Authentication required");
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const query = req.body as DataQuery;
  if (!query?.table || !TABLES.has(query.table)) {
    return res.status(400).json({ error: "Unsupported table" });
  }
  if (query.operation !== "select") {
    const key = query.table === "support_tickets"
      ? "support-ticket-mutation"
      : query.table === "admin_audit_logs" || query.table.startsWith("admin_")
        ? "admin-sensitive-mutation"
        : "data-mutation";
    const limit = key === "support-ticket-mutation" ? 12 : key === "admin-sensitive-mutation" ? 60 : 120;
    if (await enforceRateLimit(req, res, { key, limit, windowMs: 10 * 60_000 })) {
      return;
    }
  }

  try {
    const session = await readSession(req);
    const useLocalDevDb = canUseLocalDevAuthFallback();
    await ensureAccess(query, session, useLocalDevDb);
    if (shouldReleaseSellerEarnings(query)) {
      await releaseDueSellerEarnings(useLocalDevDb);
    }
    const auditPreviousState =
      session?.role === "admin" || session?.role === "manager"
        ? await captureAuditPreviousState(query, useLocalDevDb)
        : [];
    if (useLocalDevDb) {
      const rawResult = query.operation === "select"
        ? await localSelect(query)
        : await localMutate(query);
      const result =
        query.operation === "select" && shouldRedactSelect(query, session)
          ? redactPublicResult(query, rawResult)
          : rawResult;
      if (query.table === "orders" && query.operation !== "select") {
        await releaseDueSellerEarnings(useLocalDevDb);
      }
      if (session?.role === "admin" || session?.role === "manager") {
        await recordAdminAuditLog(query, session, useLocalDevDb, auditPreviousState);
        void notifySellerStatusIfNeeded(query, useLocalDevDb).catch((emailError) => {
          console.error("Seller status email failed:", emailError);
        });
      }
      return res.status(200).json({ ...result, error: null });
    }

    const rawResult = query.operation === "select"
      ? await selectRows(query)
      : await mutateRows(query);
    const result =
      query.operation === "select" && shouldRedactSelect(query, session)
        ? redactPublicResult(query, rawResult)
        : rawResult;
    if (query.table === "orders" && query.operation !== "select") {
      await releaseDueSellerEarnings(useLocalDevDb);
    }
    if (session?.role === "admin" || session?.role === "manager") {
      await recordAdminAuditLog(query, session, useLocalDevDb, auditPreviousState);
      void notifySellerStatusIfNeeded(query, useLocalDevDb).catch((emailError) => {
        console.error("Seller status email failed:", emailError);
      });
    }
    return res.status(200).json({ ...result, error: null });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Database query failed";
    const status = message.includes("Authentication")
      ? 401
      : message.includes("Access denied") || message.includes("not approved")
        ? 403
        : 500;
    logServerEvent({
      event: "data_query_failed",
      level: status >= 500 ? "error" : "warn",
      req,
      error,
      target: { table: query.table, operation: query.operation },
      details: { status },
    });
    return res.status(status).json({ data: null, error: { message } });
  }
}
