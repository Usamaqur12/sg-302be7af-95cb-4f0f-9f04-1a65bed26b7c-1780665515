import { randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import bcrypt from "bcryptjs";
import {
  defaultFooterSections,
  flatMarketplaceCategories,
} from "../marketplace-config";
import { calculatePromotionSummary, type PromotionLike } from "../promotions";
import { defaultPublicPages } from "../public-pages";

type FilterOp = "eq" | "neq" | "gt" | "gte" | "lt" | "lte" | "ilike" | "in" | "is" | "not_is";

export interface LocalFilter {
  column: string;
  op: FilterOp;
  value: unknown;
}

export interface LocalQuery {
  table: string;
  operation: "select" | "insert" | "update" | "delete" | "upsert";
  filters?: LocalFilter[];
  orFilters?: Array<{ columns: string[]; op: "ilike"; value: string }>;
  order?: Array<{ column: string; ascending: boolean }>;
  limit?: number;
  range?: { from: number; to: number };
  single?: boolean;
  maybeSingle?: boolean;
  head?: boolean;
  count?: "exact";
  columns?: string;
  payload?: Record<string, unknown> | Array<Record<string, unknown>>;
  onConflict?: string;
}

export type LocalRecord = Record<string, unknown>;
type LocalDatabase = Record<string, LocalRecord[]>;
export type LocalOrderStatus =
  | "pending"
  | "confirmed"
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled"
  | "refunded";

export interface LocalSellerRegistrationInput {
  full_name: string;
  email: string;
  phone: string;
  password: string;
  business_name: string;
  description: string;
  business_address: string;
  business_email: string;
  business_phone: string;
  bank_account_name: string;
  bank_account_number: string;
  bank_name: string;
}

export interface LocalOrderInput {
  items: Array<{
    product_id: string;
    quantity: number;
  }>;
  shipping_full_name: string;
  shipping_email: string;
  shipping_phone: string;
  shipping_street: string;
  shipping_city: string;
  shipping_state: string;
  shipping_zip_code: string;
  shipping_country: string;
  payment_method: string;
  payment_reference?: string;
  payment_proof_url?: string;
  customer_notes?: string;
}

const TABLES = [
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
];

const ADMIN_ID = "00000000-0000-4000-8000-000000000001";
const SELLER_USER_ID = "00000000-0000-4000-8000-000000000002";
const CUSTOMER_ID = "00000000-0000-4000-8000-000000000003";
const MANAGER_ID = "00000000-0000-4000-8000-000000000004";
const WAREHOUSE_ID = "00000000-0000-4000-8000-000000000005";
const SELLER_ID = "00000000-0000-4000-8000-000000000102";
const PRODUCT_ID = "00000000-0000-4000-8000-000000000301";
const OLD_FOOTER_ABOUT_TEXT =
  "Mercato is a managed multivendor marketplace with admin-controlled sellers, products and public content.";
const DEFAULT_FOOTER_ABOUT_TEXT =
  "Mercato connects customers with verified sellers, curated products, secure checkout and reliable support.";
const DEFAULT_SYSTEM_SETTINGS = [
  {
    key: "default_commission_rate",
    value: "15.00",
    description: "Default commission percentage for new sellers",
  },
  {
    key: "platform_name",
    value: "Mercato",
    description: "Marketplace display name",
  },
  {
    key: "site_name",
    value: "Mercato",
    description: "Public marketplace name",
  },
  {
    key: "site_currency_code",
    value: "PKR",
    description: "Currency code displayed across the marketplace",
  },
  {
    key: "site_currency_symbol",
    value: "Rs",
    description: "Currency symbol displayed before marketplace prices",
  },
  {
    key: "site_currency_rate",
    value: "1",
    description: "Display conversion rate applied to base product prices",
  },
  {
    key: "default_delivery_city",
    value: "Karachi",
    description: "Default customer delivery city shown in the header",
  },
  {
    key: "seller_payout_hold_days",
    value: "2",
    description: "Days after delivery before seller earnings become available",
  },
  {
    key: "seller_center_important_notification",
    value: "You are updated! No new important notification for you.",
    description: "Seller Center dashboard notification controlled by admin",
  },
  {
    key: "seller_center_learning_enabled",
    value: "true",
    description: "Show Learn and Grow recommendations in seller dashboard",
  },
  {
    key: "seller_center_toolkit_enabled",
    value: "true",
    description: "Show popular seller toolkit actions",
  },
  {
    key: "seller_center_campaign_name",
    value: "11.11 Growth Guide",
    description: "Featured seller education campaign",
  },
  {
    key: "seller_center_enabled_options",
    value: "all",
    description: "Enabled Seller Center workflow options",
  },
  {
    key: "homepage_hero_title",
    value: "Everything your customers search for, all in one marketplace",
    description: "Homepage hero title controlled by admin CMS",
  },
  {
    key: "homepage_hero_subtitle",
    value: "Discover trusted sellers, daily deals, fast order tracking and admin-approved products built for a serious multivendor store.",
    description: "Homepage hero subtitle controlled by admin CMS",
  },
  {
    key: "homepage_hero_cta_label",
    value: "Shop Today's Deals",
    description: "Homepage hero CTA label controlled by admin CMS",
  },
  {
    key: "homepage_hero_cta_href",
    value: "/deals",
    description: "Homepage hero CTA link controlled by admin CMS",
  },
  {
    key: "footer_about_text",
    value: DEFAULT_FOOTER_ABOUT_TEXT,
    description: "Footer about text controlled by admin CMS",
  },
  {
    key: "footer_links_json",
    value: JSON.stringify(defaultFooterSections, null, 2),
    description: "Editable footer column links as JSON",
  },
  {
    key: "public_pages_json",
    value: JSON.stringify(defaultPublicPages, null, 2),
    description: "Editable public pages such as terms, privacy, contact and custom pages",
  },
];

function localDbPath() {
  return process.env.LOCAL_DB_FILE || join(process.cwd(), ".localdb", "marketplace.json");
}

function now() {
  return new Date().toISOString();
}

function createInitialDatabase(): LocalDatabase {
  const createdAt = now();
  const db = Object.fromEntries(TABLES.map((table) => [table, []])) as LocalDatabase;

  db.profiles.push(
    {
      id: ADMIN_ID,
      email: "admin@marketplace.com",
      password_hash: bcrypt.hashSync("Admin12345", 10),
      full_name: "Local Admin",
      phone: null,
      role: "admin",
      cnic_number: null,
      cnic_front_url: null,
      cnic_back_url: null,
      kyc_document_url: null,
      is_active: 1,
      email_verified_at: createdAt,
      created_at: createdAt,
      updated_at: createdAt,
    },
    {
      id: SELLER_USER_ID,
      email: "seller@marketplace.com",
      password_hash: bcrypt.hashSync("Seller12345", 10),
      full_name: "Local Seller",
      phone: "+10000000001",
      role: "seller",
      cnic_number: null,
      cnic_front_url: null,
      cnic_back_url: null,
      kyc_document_url: null,
      is_active: 1,
      email_verified_at: createdAt,
      created_at: createdAt,
      updated_at: createdAt,
    },
    {
      id: CUSTOMER_ID,
      email: "customer@marketplace.com",
      password_hash: bcrypt.hashSync("Customer12345", 10),
      full_name: "Local Customer",
      phone: "+10000000002",
      role: "customer",
      cnic_number: null,
      cnic_front_url: null,
      cnic_back_url: null,
      kyc_document_url: null,
      is_active: 1,
      email_verified_at: createdAt,
      created_at: createdAt,
      updated_at: createdAt,
    },
    {
      id: MANAGER_ID,
      email: "manager@marketplace.com",
      password_hash: bcrypt.hashSync("Manager12345", 10),
      full_name: "Local Manager",
      phone: "+10000000004",
      role: "manager",
      cnic_number: null,
      cnic_front_url: null,
      cnic_back_url: null,
      kyc_document_url: null,
      is_active: 1,
      email_verified_at: createdAt,
      created_at: createdAt,
      updated_at: createdAt,
    },
    {
      id: WAREHOUSE_ID,
      email: "warehouse@marketplace.com",
      password_hash: bcrypt.hashSync("Warehouse12345", 10),
      full_name: "Local Warehouse Staff",
      phone: "+10000000005",
      role: "warehouse",
      cnic_number: null,
      cnic_front_url: null,
      cnic_back_url: null,
      kyc_document_url: null,
      is_active: 1,
      email_verified_at: createdAt,
      created_at: createdAt,
      updated_at: createdAt,
    }
  );

  db.seller_profiles.push({
    id: SELLER_ID,
    user_id: SELLER_USER_ID,
    business_name: "Mercato Demo Store",
    business_description: "Local demo seller for testing the marketplace workflow.",
    business_address: "123 Local Market Street",
    business_phone: "+10000000001",
    business_email: "seller@marketplace.com",
    logo_url: null,
    banner_url: null,
    kyc_document_url: null,
    kyc_document_type: null,
    tax_id: null,
    owner_full_name: "Local Seller",
    owner_cnic: null,
    cnic_front_url: null,
    cnic_back_url: null,
    business_registration_url: null,
    tax_certificate_url: null,
    bank_statement_url: null,
    brand_authorization_url: null,
    pickup_address: "123 Local Market Street",
    return_address: "123 Local Market Street",
    seller_center_enabled_options: null,
    storefront_config: null,
    status: "approved",
    rejection_reason: null,
    commission_rate: 15,
    total_sales: 0,
    total_earnings: 0,
    available_balance: 0,
    rating: 4.8,
    total_reviews: 12,
    holiday_mode: 0,
    holiday_message: null,
    order_volume_limit: 50,
    non_compliance_points: 0,
    account_health_status: "excellent",
    admin_note: "Local seller is approved for testing the seller center workflow.",
    verified_at: createdAt,
    created_at: createdAt,
    updated_at: createdAt,
  });

  db.categories.push(
    ...flatMarketplaceCategories.map((category) => ({
      ...category,
      is_active: 1,
      created_at: createdAt,
      updated_at: createdAt,
    }))
  );

  db.system_settings.push(
    ...DEFAULT_SYSTEM_SETTINGS.map((setting) => ({
      id: randomUUID(),
      ...setting,
      updated_at: createdAt,
    }))
  );

  return db;
}

export async function readLocalDatabase(): Promise<LocalDatabase> {
  const filePath = localDbPath();

  try {
    const raw = await readFile(filePath, "utf8");
    const parsed = JSON.parse(raw) as LocalDatabase;
    for (const table of TABLES) {
      if (!Array.isArray(parsed[table])) parsed[table] = [];
    }
    if (applyDatabaseDefaults(parsed)) {
      await writeLocalDatabase(parsed);
    }
    return parsed;
  } catch {
    const initial = createInitialDatabase();
    await writeLocalDatabase(initial);
    return initial;
  }
}

export async function writeLocalDatabase(db: LocalDatabase) {
  const filePath = localDbPath();
  await mkdir(dirname(filePath), { recursive: true });
  await writeFile(filePath, JSON.stringify(db, null, 2));
}

function getValue(row: LocalRecord, column: string) {
  return row[column];
}

function booleanValue(value: unknown) {
  if (value === true || value === 1 || value === "1" || value === "true") return true;
  if (value === false || value === 0 || value === "0" || value === "false") return false;
  return null;
}

function equalValue(current: unknown, value: unknown) {
  const left = current === undefined ? null : current;
  const right = value === undefined ? null : value;
  const leftBoolean = booleanValue(left);
  const rightBoolean = booleanValue(right);

  if (leftBoolean !== null && rightBoolean !== null) {
    return leftBoolean === rightBoolean;
  }

  if (left === null || right === null) {
    return left === right;
  }

  return String(left) === String(right);
}

function like(value: unknown, pattern: unknown) {
  const escaped = String(pattern)
    .replace(/[.+?^${}()|[\]\\]/g, "\\$&")
    .replaceAll("%", ".*");
  return new RegExp(`^${escaped}$`, "i").test(String(value ?? ""));
}

function matchesFilter(row: LocalRecord, filter: LocalFilter) {
  const current = getValue(row, filter.column);
  const value = filter.value;

  if (filter.op === "eq") return equalValue(current, value);
  if (filter.op === "neq") return !equalValue(current, value);
  if (filter.op === "gt") return Number(current) > Number(value);
  if (filter.op === "gte") return String(current) >= String(value);
  if (filter.op === "lt") return Number(current) < Number(value);
  if (filter.op === "lte") return String(current) <= String(value);
  if (filter.op === "ilike") return like(current, value);
  if (filter.op === "is") return equalValue(current, value);
  if (filter.op === "not_is") return !equalValue(current, value);
  if (filter.op === "in" && Array.isArray(value)) {
    return value.map(String).includes(String(current));
  }
  return true;
}

function setDefault(row: LocalRecord, key: string, value: unknown) {
  if (row[key] === undefined) {
    row[key] = value;
    return true;
  }
  return false;
}

function applyRowDefaults(db: LocalDatabase, table: string, row: LocalRecord) {
  let changed = false;

  if (table === "categories") {
    changed = setDefault(row, "description", null) || changed;
    changed = setDefault(row, "image_url", null) || changed;
    changed = setDefault(row, "parent_id", null) || changed;
    changed = setDefault(row, "display_order", db.categories.length + 1) || changed;
    changed = setDefault(row, "is_active", 1) || changed;
  }

  if (table === "products") {
    changed = setDefault(row, "specifications", {}) || changed;
    changed = setDefault(row, "compare_at_price", null) || changed;
    changed = setDefault(row, "cost_per_item", null) || changed;
    changed = setDefault(row, "barcode", null) || changed;
    changed = setDefault(row, "low_stock_threshold", 5) || changed;
    changed = setDefault(row, "status", "pending") || changed;
    changed = setDefault(row, "rejection_reason", null) || changed;
    changed = setDefault(row, "is_featured", 0) || changed;
    changed = setDefault(row, "is_deal", 0) || changed;
    changed = setDefault(row, "deal_expires_at", null) || changed;
    changed = setDefault(row, "views_count", 0) || changed;
    changed = setDefault(row, "sales_count", 0) || changed;
    changed = setDefault(row, "rating", 0) || changed;
    changed = setDefault(row, "total_reviews", 0) || changed;
    changed = setDefault(row, "approved_at", null) || changed;
  }

  if (table === "profiles") {
    changed = setDefault(row, "cnic_number", null) || changed;
    changed = setDefault(row, "cnic_front_url", null) || changed;
    changed = setDefault(row, "cnic_back_url", null) || changed;
    changed = setDefault(row, "kyc_document_url", null) || changed;
  }

  if (table === "product_images") {
    changed = setDefault(row, "alt_text", null) || changed;
    changed = setDefault(row, "display_order", 0) || changed;
  }

  if (table === "seller_profiles") {
    changed = setDefault(row, "logo_url", null) || changed;
    changed = setDefault(row, "banner_url", null) || changed;
    changed = setDefault(row, "kyc_document_url", null) || changed;
    changed = setDefault(row, "kyc_document_type", null) || changed;
    changed = setDefault(row, "tax_id", null) || changed;
    changed = setDefault(row, "owner_full_name", null) || changed;
    changed = setDefault(row, "owner_cnic", null) || changed;
    changed = setDefault(row, "cnic_front_url", null) || changed;
    changed = setDefault(row, "cnic_back_url", null) || changed;
    changed = setDefault(row, "business_registration_url", null) || changed;
    changed = setDefault(row, "tax_certificate_url", null) || changed;
    changed = setDefault(row, "bank_statement_url", null) || changed;
    changed = setDefault(row, "brand_authorization_url", null) || changed;
    changed = setDefault(row, "pickup_address", null) || changed;
    changed = setDefault(row, "return_address", null) || changed;
    changed = setDefault(row, "seller_center_enabled_options", null) || changed;
    changed = setDefault(row, "storefront_config", null) || changed;
    changed = setDefault(row, "status", "pending") || changed;
    changed = setDefault(row, "rejection_reason", null) || changed;
    changed = setDefault(row, "commission_rate", 15) || changed;
    changed = setDefault(row, "total_sales", 0) || changed;
    changed = setDefault(row, "total_earnings", 0) || changed;
    changed = setDefault(row, "available_balance", 0) || changed;
    changed = setDefault(row, "rating", 0) || changed;
    changed = setDefault(row, "total_reviews", 0) || changed;
    changed = setDefault(row, "holiday_mode", 0) || changed;
    changed = setDefault(row, "holiday_message", null) || changed;
    changed = setDefault(row, "order_volume_limit", 50) || changed;
    changed = setDefault(row, "non_compliance_points", 0) || changed;
    changed = setDefault(row, "account_health_status", "excellent") || changed;
    changed = setDefault(row, "admin_note", null) || changed;
    changed = setDefault(row, "verified_at", null) || changed;
  }

  if (table === "seller_earnings") {
    changed = setDefault(row, "status", "pending") || changed;
    changed = setDefault(row, "available_at", null) || changed;
    changed = setDefault(row, "released_at", null) || changed;
  }

  if (table === "return_requests") {
    changed = setDefault(row, "return_number", `RET-${Date.now()}-${randomUUID().slice(0, 6).toUpperCase()}`) || changed;
    changed = setDefault(row, "status", "requested") || changed;
    changed = setDefault(row, "refund_amount", null) || changed;
    changed = setDefault(row, "admin_note", null) || changed;
    changed = setDefault(row, "approved_at", null) || changed;
    changed = setDefault(row, "rejected_at", null) || changed;
    changed = setDefault(row, "refunded_at", null) || changed;
  }

  if (table === "admin_audit_logs") {
    changed = setDefault(row, "created_at", new Date().toISOString()) || changed;
  }

  if (table === "promotion_requests") {
    changed = setDefault(row, "product_id", null) || changed;
    changed = setDefault(row, "request_type", "seller_voucher") || changed;
    changed = setDefault(row, "title", "Promotion Request") || changed;
    changed = setDefault(row, "details", null) || changed;
    changed = setDefault(row, "discount_type", null) || changed;
    changed = setDefault(row, "discount_value", 0) || changed;
    changed = setDefault(row, "min_order_amount", 0) || changed;
    changed = setDefault(row, "max_discount_amount", 0) || changed;
    changed = setDefault(row, "budget_amount", 0) || changed;
    changed = setDefault(row, "start_at", null) || changed;
    changed = setDefault(row, "end_at", null) || changed;
    changed = setDefault(row, "status", "pending") || changed;
    changed = setDefault(row, "approved_by", null) || changed;
    changed = setDefault(row, "approved_at", null) || changed;
    changed = setDefault(row, "rejected_at", null) || changed;
    changed = setDefault(row, "rejection_reason", null) || changed;
    changed = setDefault(row, "admin_note", null) || changed;
  }

  if (table === "marketing_campaigns") {
    changed = setDefault(row, "product_id", null) || changed;
    changed = setDefault(row, "campaign_type", "sponsored_products") || changed;
    changed = setDefault(row, "objective", "traffic") || changed;
    changed = setDefault(row, "placement", "search_results") || changed;
    changed = setDefault(row, "status", "pending") || changed;
    changed = setDefault(row, "daily_budget", 0) || changed;
    changed = setDefault(row, "total_budget", 0) || changed;
    changed = setDefault(row, "bid_amount", 0) || changed;
    changed = setDefault(row, "spent_amount", 0) || changed;
    changed = setDefault(row, "impressions", 0) || changed;
    changed = setDefault(row, "clicks", 0) || changed;
    changed = setDefault(row, "conversions", 0) || changed;
    changed = setDefault(row, "revenue", 0) || changed;
    changed = setDefault(row, "target_keywords", null) || changed;
    changed = setDefault(row, "target_categories", null) || changed;
    changed = setDefault(row, "admin_score", 50) || changed;
    changed = setDefault(row, "quality_score", 50) || changed;
    changed = setDefault(row, "seller_health_score", 50) || changed;
    changed = setDefault(row, "start_at", null) || changed;
    changed = setDefault(row, "end_at", null) || changed;
    changed = setDefault(row, "approved_by", null) || changed;
    changed = setDefault(row, "approved_at", null) || changed;
    changed = setDefault(row, "rejected_at", null) || changed;
    changed = setDefault(row, "rejection_reason", null) || changed;
    changed = setDefault(row, "admin_note", null) || changed;
  }

  if (table === "marketing_ad_events") {
    changed = setDefault(row, "product_id", null) || changed;
    changed = setDefault(row, "event_type", "impression") || changed;
    changed = setDefault(row, "cost", 0) || changed;
    changed = setDefault(row, "revenue", 0) || changed;
    changed = setDefault(row, "metadata", null) || changed;
    changed = setDefault(row, "created_at", new Date().toISOString()) || changed;
  }

  return changed;
}

function localSettingNumber(db: LocalDatabase, key: string, fallback: number) {
  const setting = db.system_settings.find((row) => row.key === key);
  const numericValue = Number(setting?.value);
  return Number.isFinite(numericValue) ? numericValue : fallback;
}

function localPayoutHoldDays(db: LocalDatabase) {
  return Math.max(0, Math.min(30, Math.floor(localSettingNumber(db, "seller_payout_hold_days", 2))));
}

function releaseSellerEarningsInDatabase(db: LocalDatabase) {
  let changed = false;
  const currentTime = Date.now();
  const releasedAt = now();
  const holdDays = localPayoutHoldDays(db);

  for (const earning of db.seller_earnings) {
    const currentStatus = String(earning.status || "pending");
    if (["available", "paid", "reversed"].includes(currentStatus)) continue;

    const item = db.order_items.find((row) => sameId(row.id, earning.order_item_id));
    const order = item ? db.orders.find((row) => sameId(row.id, item.order_id)) : null;
    if (!order || order.status !== "delivered" || !order.delivered_at) continue;

    const deliveredAt = new Date(String(order.delivered_at));
    if (Number.isNaN(deliveredAt.getTime())) continue;
    const availableAtDate = new Date(deliveredAt.getTime() + holdDays * 24 * 60 * 60 * 1000);
    const availableAt = availableAtDate.toISOString();

    if (earning.available_at !== availableAt) {
      earning.available_at = availableAt;
      changed = true;
    }

    if (currentTime >= availableAtDate.getTime()) {
      const seller = db.seller_profiles.find((row) => sameId(row.id, earning.seller_id));
      if (seller) {
        seller.available_balance = numeric(seller.available_balance) + numeric(earning.amount);
        seller.updated_at = releasedAt;
      }
      earning.status = "available";
      earning.released_at = releasedAt;
      changed = true;
    } else if (currentStatus === "pending") {
      earning.status = "processing";
      changed = true;
    }
  }

  return changed;
}

export async function releaseLocalSellerEarnings() {
  const db = await readLocalDatabase();
  const changed = releaseSellerEarningsInDatabase(db);
  if (changed) await writeLocalDatabase(db);
  return changed;
}

function applyDatabaseDefaults(db: LocalDatabase) {
  let changed = false;
  for (const table of TABLES) {
    for (const row of db[table] || []) {
      changed = applyRowDefaults(db, table, row) || changed;
    }
  }

  const seedProfiles = [
    {
      id: ADMIN_ID,
      email: "admin@marketplace.com",
      password: "Admin12345",
      full_name: "Local Admin",
      phone: null,
      role: "admin",
    },
    {
      id: SELLER_USER_ID,
      email: "seller@marketplace.com",
      password: "Seller12345",
      full_name: "Local Seller",
      phone: "+10000000001",
      role: "seller",
    },
    {
      id: CUSTOMER_ID,
      email: "customer@marketplace.com",
      password: "Customer12345",
      full_name: "Local Customer",
      phone: "+10000000002",
      role: "customer",
    },
    {
      id: MANAGER_ID,
      email: "manager@marketplace.com",
      password: "Manager12345",
      full_name: "Local Manager",
      phone: "+10000000004",
      role: "manager",
    },
    {
      id: WAREHOUSE_ID,
      email: "warehouse@marketplace.com",
      password: "Warehouse12345",
      full_name: "Local Warehouse Staff",
      phone: "+10000000005",
      role: "warehouse",
    },
  ];

  for (const seed of seedProfiles) {
    const existing = db.profiles.find(
      (row) => String(row.id) === seed.id || String(row.email).toLowerCase() === seed.email
    );
    if (!existing) {
      db.profiles.push({
        id: seed.id,
        email: seed.email,
        password_hash: bcrypt.hashSync(seed.password, 10),
        full_name: seed.full_name,
        phone: seed.phone,
        role: seed.role,
        cnic_number: null,
        cnic_front_url: null,
        cnic_back_url: null,
        kyc_document_url: null,
        is_active: 1,
        email_verified_at: now(),
        created_at: now(),
        updated_at: now(),
      });
      changed = true;
      continue;
    }

    if (
      typeof existing.password_hash !== "string" ||
      !bcrypt.compareSync(seed.password, existing.password_hash)
    ) {
      existing.password_hash = bcrypt.hashSync(seed.password, 10);
      existing.updated_at = now();
      changed = true;
    }
    if (existing.role !== seed.role) {
      existing.role = seed.role;
      existing.updated_at = now();
      changed = true;
    }
    changed = setDefault(existing, "full_name", seed.full_name) || changed;
    changed = setDefault(existing, "phone", seed.phone) || changed;
    changed = setDefault(existing, "is_active", 1) || changed;
    changed = setDefault(existing, "email_verified_at", now()) || changed;
  }

  const demoProduct = db.products.find(
    (row) => String(row.id) === PRODUCT_ID || String(row.slug) === "wireless-headphones"
  );
  if (demoProduct && String(demoProduct.title || "").toLowerCase() === "wireless headphones") {
    if (demoProduct.status !== "inactive") {
      demoProduct.status = "inactive";
      demoProduct.updated_at = now();
      changed = true;
    }
    if (demoProduct.is_featured !== 0 || demoProduct.is_deal !== 0) {
      demoProduct.is_featured = 0;
      demoProduct.is_deal = 0;
      demoProduct.deal_expires_at = null;
      changed = true;
    }
  }

  const upsertCategory = (
    category: {
      id: string;
      name: string;
      slug: string;
      description: string;
      image_url?: string | null;
    },
    parentId: string | null,
    displayOrder: number
  ) => {
    const existing = db.categories.find(
      (row) => String(row.id) === category.id || String(row.slug) === category.slug
    );
    if (existing) {
      changed = setDefault(existing, "description", category.description) || changed;
      changed = setDefault(existing, "image_url", category.image_url ?? null) || changed;
      changed = setDefault(existing, "parent_id", parentId) || changed;
      changed = setDefault(existing, "display_order", displayOrder) || changed;
      changed = setDefault(existing, "is_active", 1) || changed;
      return String(existing.id);
    }

    db.categories.push({
      id: category.id,
      name: category.name,
      slug: category.slug,
      description: category.description,
      image_url: category.image_url ?? null,
      parent_id: parentId,
      display_order: displayOrder,
      is_active: 1,
      created_at: now(),
      updated_at: now(),
    });
    changed = true;
    return category.id;
  };

  flatMarketplaceCategories.forEach((category) => {
    upsertCategory(category, category.parent_id, category.display_order);
  });

  for (const setting of DEFAULT_SYSTEM_SETTINGS) {
    const existing = db.system_settings.find((row) => row.key === setting.key);
    if (!existing) {
      db.system_settings.push({
        id: randomUUID(),
        ...setting,
        updated_at: now(),
      });
      changed = true;
    } else if (setting.key === "footer_about_text" && existing.value === OLD_FOOTER_ABOUT_TEXT) {
      existing.value = DEFAULT_FOOTER_ABOUT_TEXT;
      existing.updated_at = now();
      changed = true;
    }
  }
  return changed;
}

function applyQueryFilters(rows: LocalRecord[], query: LocalQuery) {
  return rows.filter((row) => {
    const andMatch = (query.filters || []).every((filter) => matchesFilter(row, filter));
    const orMatch = (query.orFilters || []).every((group) =>
      group.columns.some((column) => like(row[column], group.value))
    );
    return andMatch && orMatch;
  });
}

function applyQueryOrder(rows: LocalRecord[], query: LocalQuery) {
  const ordered = [...rows];
  for (const order of [...(query.order || [])].reverse()) {
    ordered.sort((a, b) => {
      const left = a[order.column];
      const right = b[order.column];
      if (left === right) return 0;
      const direction = order.ascending ? 1 : -1;
      return String(left ?? "") > String(right ?? "") ? direction : -direction;
    });
  }
  return ordered;
}

function applyQueryLimit(rows: LocalRecord[], query: LocalQuery) {
  if (query.range) return rows.slice(query.range.from, query.range.to + 1);
  if (query.limit) return rows.slice(0, query.limit);
  return rows;
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function text(value: unknown) {
  return String(value ?? "");
}

function numeric(value: unknown, fallback = 0) {
  const next = Number(value);
  return Number.isFinite(next) ? next : fallback;
}

function sameId(left: unknown, right: unknown) {
  return text(left) === text(right);
}

function firstProductImage(db: LocalDatabase, productId: string) {
  return db.product_images
    .filter((image) => sameId(image.product_id, productId))
    .sort((a, b) => numeric(a.display_order) - numeric(b.display_order))[0];
}

function buildLocalCartItems(db: LocalDatabase, userId: string) {
  const cart = db.carts.find((item) => sameId(item.user_id, userId));
  if (!cart) return [];

  return db.cart_items
    .filter((item) => sameId(item.cart_id, cart.id))
    .sort((a, b) => text(b.created_at).localeCompare(text(a.created_at)))
    .flatMap((item) => {
      const product = db.products.find((row) => sameId(row.id, item.product_id));
      if (!product) return [];

      const image = firstProductImage(db, text(product.id));
      const seller = db.seller_profiles.find((row) => sameId(row.id, product.seller_id));

      return [
        {
          id: text(item.id),
          product_id: text(item.product_id),
          quantity: numeric(item.quantity),
          product: {
            id: text(product.id),
            title: text(product.title),
            price: numeric(product.price),
            stock_quantity: numeric(product.stock_quantity),
            images: image ? [{ url: text(image.url) }] : [],
            seller: { id: text(seller?.id || product.seller_id), business_name: text(seller?.business_name || "Seller") },
          },
        },
      ];
    });
}

async function enrichRows(db: LocalDatabase, table: string, columns: string, rows: LocalRecord[]) {
  const data = clone(rows);

  if (table === "products") {
    if (columns.includes("product_images")) {
      for (const row of data) {
        row.images = db.product_images
          .filter((image) => image.product_id === row.id)
          .sort((a, b) => Number(a.display_order || 0) - Number(b.display_order || 0));
      }
    }
    if (columns.includes("categories")) {
      for (const row of data) {
        row.category = db.categories.find((category) => category.id === row.category_id) || null;
      }
    }
    if (columns.includes("seller_profiles")) {
      for (const row of data) {
        row.seller = db.seller_profiles.find((seller) => seller.id === row.seller_id) || null;
      }
    }
  }

  if (table === "seller_profiles" && columns.includes("user_id")) {
    for (const row of data) {
      row.profiles = db.profiles.find((profile) => profile.id === row.user_id) || null;
    }
  }

  if (table === "orders" && columns.includes("order_items")) {
    for (const row of data) {
      row.items = db.order_items.filter((item) => item.order_id === row.id);
    }
  }

  if (table === "return_requests") {
    for (const row of data) {
      if (columns.includes("orders")) {
        row.order = db.orders.find((order) => order.id === row.order_id) || null;
      }
      if (columns.includes("profiles")) {
        row.customer = db.profiles.find((profile) => profile.id === row.customer_id) || null;
      }
    }
  }

  if (table === "order_items" && columns.includes("orders")) {
    for (const row of data) {
      row.order = db.orders.find((order) => order.id === row.order_id) || null;
    }
  }

  if (table === "payments" && columns.includes("orders")) {
    for (const row of data) {
      const order = db.orders.find((item) => item.id === row.order_id);
      row.order = order
        ? {
            ...order,
            customer: db.profiles.find((profile) => profile.id === order.customer_id) || null,
          }
        : null;
    }
  }

  if (table === "reviews") {
    for (const row of data) {
      if (columns.includes("profiles")) {
        const profile = db.profiles.find((item) => item.id === row.user_id) || null;
        row.user = profile;
        row.customer = profile;
      }
      if (columns.includes("products")) {
        row.product = db.products.find((product) => product.id === row.product_id) || null;
      }
    }
  }

  if (table === "marketing_campaigns") {
    if (columns.includes("products")) {
      for (const row of data) {
        const product = db.products.find((item) => item.id === row.product_id) || null;
        row.product = product
          ? {
              ...product,
              images: db.product_images
                .filter((image) => image.product_id === product.id)
                .sort((a, b) => Number(a.display_order || 0) - Number(b.display_order || 0)),
              seller: db.seller_profiles.find((seller) => seller.id === product.seller_id) || null,
            }
          : null;
      }
    }
    if (columns.includes("seller_profiles")) {
      for (const row of data) {
        row.seller = db.seller_profiles.find((seller) => seller.id === row.seller_id) || null;
      }
    }
  }

  if (table === "promotion_requests") {
    if (columns.includes("products")) {
      for (const row of data) {
        const product = db.products.find((item) => item.id === row.product_id) || null;
        row.product = product
          ? {
              ...product,
              images: db.product_images
                .filter((image) => image.product_id === product.id)
                .sort((a, b) => Number(a.display_order || 0) - Number(b.display_order || 0)),
            }
          : null;
      }
    }
    if (columns.includes("seller_profiles")) {
      for (const row of data) {
        row.seller = db.seller_profiles.find((seller) => seller.id === row.seller_id) || null;
      }
    }
  }

  return data;
}

export async function localSelect(query: LocalQuery) {
  const db = await readLocalDatabase();
  let rows = applyQueryFilters(db[query.table] || [], query);
  const total = rows.length;
  rows = applyQueryLimit(applyQueryOrder(rows, query), query);
  const data = await enrichRows(db, query.table, query.columns || "", rows);

  if (query.head && query.count === "exact") {
    return { data: null, count: total };
  }

  return {
    data: query.single || query.maybeSingle ? data[0] ?? null : data,
    count: query.count === "exact" ? total : null,
  };
}

function findConflictIndex(rows: LocalRecord[], row: LocalRecord, conflictColumn?: string) {
  const column = conflictColumn || "id";
  return rows.findIndex((item) => String(item[column]) === String(row[column]));
}

export async function localMutate(query: LocalQuery) {
  const db = await readLocalDatabase();
  const rows = db[query.table] || [];

  if (query.operation === "delete") {
    const toDelete = new Set(applyQueryFilters(rows, query).map((row) => row.id));
    db[query.table] = rows.filter((row) => !toDelete.has(row.id));
    await writeLocalDatabase(db);
    return { data: null, count: toDelete.size };
  }

  if (query.operation === "update") {
    const payload = (Array.isArray(query.payload) ? query.payload[0] : query.payload) || {};
    const updated: LocalRecord[] = [];
    for (const row of rows) {
      if (applyQueryFilters([row], query).length) {
        Object.assign(row, payload, { updated_at: now() });
        updated.push({ ...row });
      }
    }
    if (query.table === "orders") {
      releaseSellerEarningsInDatabase(db);
    }
    await writeLocalDatabase(db);
    const data = await enrichRows(db, query.table, query.columns || "", updated);
    return { data: query.single || query.maybeSingle ? data[0] ?? null : data, count: updated.length };
  }

  const payloadRows = (Array.isArray(query.payload) ? query.payload : [query.payload || {}]).map((row) => {
    const nextRow: LocalRecord = {
      ...row,
      id: row?.id || randomUUID(),
      created_at: row?.created_at || now(),
      updated_at: row?.updated_at || now(),
    };
    applyRowDefaults(db, query.table, nextRow);
    return nextRow;
  });

  const saved: LocalRecord[] = [];
  for (const row of payloadRows) {
    if (query.operation === "upsert") {
      const index = findConflictIndex(rows, row, query.onConflict);
      if (index >= 0) {
        rows[index] = { ...rows[index], ...row, updated_at: now() };
        saved.push({ ...rows[index] });
      } else {
        rows.push(row);
        saved.push({ ...row });
      }
    } else {
      rows.push(row);
      saved.push({ ...row });
    }
  }

  db[query.table] = rows;
  await writeLocalDatabase(db);
  const data = await enrichRows(db, query.table, query.columns || "", saved);
  return { data: query.single || query.maybeSingle ? data[0] ?? null : data, count: saved.length };
}

export async function findLocalProfileByEmail(email: string) {
  const db = await readLocalDatabase();
  return db.profiles.find((profile) => String(profile.email).toLowerCase() === email.toLowerCase()) || null;
}

export async function findLocalProfileById(id: string) {
  const db = await readLocalDatabase();
  return db.profiles.find((profile) => profile.id === id) || null;
}

export async function createLocalProfile(input: {
  email: string;
  password: string;
  fullName: string;
  phone?: string | null;
  role?: "customer" | "seller" | "admin" | "manager" | "warehouse";
  cnicNumber?: string | null;
  cnicFrontUrl?: string | null;
  cnicBackUrl?: string | null;
  kycDocumentUrl?: string | null;
}) {
  const existing = await findLocalProfileByEmail(input.email);
  if (existing) throw new Error("An account with this email already exists");

  const db = await readLocalDatabase();
  const profile = {
    id: randomUUID(),
    email: input.email.toLowerCase(),
    password_hash: bcrypt.hashSync(input.password, 10),
    full_name: input.fullName,
    phone: input.phone || null,
    role: input.role || "customer",
    cnic_number: input.cnicNumber || null,
    cnic_front_url: input.cnicFrontUrl || null,
    cnic_back_url: input.cnicBackUrl || null,
    kyc_document_url: input.kycDocumentUrl || null,
    is_active: 1,
    email_verified_at: now(),
    created_at: now(),
    updated_at: now(),
  };
  db.profiles.push(profile);
  await writeLocalDatabase(db);
  return profile;
}

export async function createLocalSeller(input: LocalSellerRegistrationInput) {
  const profile = await createLocalProfile({
    email: input.email,
    password: input.password,
    fullName: input.full_name,
    phone: input.phone,
    role: "seller",
  });
  const db = await readLocalDatabase();
  const sellerProfile = {
    id: randomUUID(),
    user_id: profile.id,
    business_name: input.business_name,
    business_description: input.description,
    business_address: input.business_address,
    business_phone: input.business_phone,
    business_email: input.business_email,
    bank_account_name: input.bank_account_name,
    bank_account_number: input.bank_account_number,
    bank_name: input.bank_name,
    logo_url: null,
    banner_url: null,
    kyc_document_url: null,
    kyc_document_type: null,
    tax_id: null,
    owner_full_name: input.full_name,
    owner_cnic: null,
    cnic_front_url: null,
    cnic_back_url: null,
    business_registration_url: null,
    tax_certificate_url: null,
    bank_statement_url: null,
    brand_authorization_url: null,
    pickup_address: input.business_address,
    return_address: input.business_address,
    seller_center_enabled_options: null,
    storefront_config: null,
    status: "pending",
    commission_rate: 15,
    total_sales: 0,
    total_earnings: 0,
    available_balance: 0,
    rating: 0,
    total_reviews: 0,
    verified_at: null,
    created_at: now(),
    updated_at: now(),
  };
  db.seller_profiles.push(sellerProfile);
  await writeLocalDatabase(db);
  return sellerProfile;
}

export async function getLocalCartItems(userId: string) {
  const db = await readLocalDatabase();
  return buildLocalCartItems(db, userId);
}

export async function addLocalCartItem(userId: string, productId: string, quantity: number) {
  const db = await readLocalDatabase();
  const product = db.products.find(
    (row) => sameId(row.id, productId) && row.status === "approved"
  );

  if (!product) throw new Error("Product not found");
  const seller = db.seller_profiles.find((row) => sameId(row.id, product.seller_id));
  if (booleanValue(seller?.holiday_mode) === true) {
    throw new Error(`${text(seller?.business_name || "Seller")} is currently in holiday mode`);
  }
  if (numeric(product.stock_quantity) < quantity) {
    throw new Error(`${text(product.title)} does not have enough stock`);
  }

  let cart = db.carts.find((item) => sameId(item.user_id, userId));
  if (!cart) {
    cart = {
      id: randomUUID(),
      user_id: userId,
      created_at: now(),
      updated_at: now(),
    };
    db.carts.push(cart);
  }

  const existing = db.cart_items.find(
    (item) => sameId(item.cart_id, cart?.id) && sameId(item.product_id, productId)
  );

  if (existing) {
    existing.quantity = numeric(existing.quantity) + quantity;
    existing.updated_at = now();
  } else {
    db.cart_items.push({
      id: randomUUID(),
      cart_id: cart.id,
      product_id: productId,
      quantity,
      price_at_addition: numeric(product.price),
      created_at: now(),
      updated_at: now(),
    });
  }

  await writeLocalDatabase(db);
  return buildLocalCartItems(db, userId);
}

export async function updateLocalCartItem(userId: string, itemId: string, quantity: number) {
  const db = await readLocalDatabase();
  const cart = db.carts.find((item) => sameId(item.user_id, userId));
  if (!cart) return [];

  if (quantity <= 0) {
    db.cart_items = db.cart_items.filter(
      (item) => !(sameId(item.id, itemId) && sameId(item.cart_id, cart.id))
    );
  } else {
    const item = db.cart_items.find(
      (row) => sameId(row.id, itemId) && sameId(row.cart_id, cart.id)
    );
    if (item) {
      item.quantity = quantity;
      item.updated_at = now();
    }
  }

  cart.updated_at = now();
  await writeLocalDatabase(db);
  return buildLocalCartItems(db, userId);
}

export async function removeLocalCartItem(userId: string, itemId: string) {
  return updateLocalCartItem(userId, itemId, 0);
}

export async function clearLocalCart(userId: string) {
  const db = await readLocalDatabase();
  const cart = db.carts.find((item) => sameId(item.user_id, userId));
  if (!cart) return [];

  db.cart_items = db.cart_items.filter((item) => !sameId(item.cart_id, cart.id));
  cart.updated_at = now();
  await writeLocalDatabase(db);
  return buildLocalCartItems(db, userId);
}

export async function createLocalOrder(userId: string, input: LocalOrderInput) {
  const db = await readLocalDatabase();
  const requestedIds = [...new Set(input.items.map((item) => item.product_id))];
  const products = db.products.filter(
    (product) => requestedIds.includes(text(product.id)) && product.status === "approved"
  );

  if (products.length !== requestedIds.length) {
    throw new Error("One or more products are unavailable");
  }

  const holidaySeller = products
    .map((product) => db.seller_profiles.find((seller) => sameId(seller.id, product.seller_id)))
    .find((seller) => booleanValue(seller?.holiday_mode) === true);
  if (holidaySeller) {
    throw new Error(`${text(holidaySeller.business_name || "Seller")} is currently in holiday mode`);
  }

  const productMap = new Map(products.map((product) => [text(product.id), product]));
  let subtotal = 0;
  const createdAt = now();
  const orderId = randomUUID();
  const orderNumber = `ORD-${Date.now()}-${randomUUID().slice(0, 8).toUpperCase()}`;

  const orderItems = input.items.map((item) => {
    const product = productMap.get(item.product_id);
    if (!product) throw new Error("Product unavailable");

    const stockQuantity = numeric(product.stock_quantity);
    if (stockQuantity < item.quantity) {
      throw new Error(`${text(product.title)} does not have enough stock`);
    }

    const seller = db.seller_profiles.find((row) => sameId(row.id, product.seller_id));
    const itemSubtotal = numeric(product.price) * item.quantity;
    const commissionRate = numeric(seller?.commission_rate, 15);
    const commissionAmount = itemSubtotal * (commissionRate / 100);
    const sellerEarnings = itemSubtotal - commissionAmount;
    const image = firstProductImage(db, text(product.id));

    subtotal += itemSubtotal;

    product.stock_quantity = stockQuantity - item.quantity;
    product.sales_count = numeric(product.sales_count) + item.quantity;
    product.updated_at = createdAt;

    return {
      id: randomUUID(),
      order_id: orderId,
      product_id: text(product.id),
      seller_id: text(product.seller_id),
      product_title: text(product.title),
      product_image: image ? text(image.url) : null,
      quantity: item.quantity,
      price: numeric(product.price),
      subtotal: itemSubtotal,
      commission_rate: commissionRate,
      commission_amount: commissionAmount,
      seller_earnings: sellerEarnings,
      created_at: createdAt,
    };
  });

  const promotionSummary = calculatePromotionSummary(
    orderItems.map((item) => ({
      product_id: item.product_id,
      seller_id: item.seller_id,
      price: item.price,
      quantity: item.quantity,
      title: item.product_title,
    })),
    db.promotion_requests as unknown as PromotionLike[]
  );
  const discountRatio = subtotal > 0 ? promotionSummary.productDiscount / subtotal : 0;

  for (const item of orderItems) {
    const itemDiscount = Number((item.subtotal * discountRatio).toFixed(2));
    const netSubtotal = Math.max(0, Number((item.subtotal - itemDiscount).toFixed(2)));
    item.commission_amount = Number((netSubtotal * (item.commission_rate / 100)).toFixed(2));
    item.seller_earnings = Number((netSubtotal - item.commission_amount).toFixed(2));

    const seller = db.seller_profiles.find((row) => sameId(row.id, item.seller_id));
    if (seller) {
      seller.total_sales = numeric(seller.total_sales) + netSubtotal;
      seller.total_earnings = numeric(seller.total_earnings) + item.seller_earnings;
      seller.updated_at = createdAt;
    }
  }

  const shippingCost = promotionSummary.shipping;
  const tax = promotionSummary.tax;
  const total = promotionSummary.total;

  db.orders.push({
    id: orderId,
    customer_id: userId,
    order_number: orderNumber,
    status: "pending",
    subtotal,
    tax,
    shipping_cost: shippingCost,
    discount: promotionSummary.totalDiscount,
    total,
    shipping_full_name: input.shipping_full_name,
    shipping_phone: input.shipping_phone,
    shipping_address: input.shipping_street,
    shipping_city: input.shipping_city,
    shipping_state: input.shipping_state,
    shipping_postal_code: input.shipping_zip_code,
    shipping_country: input.shipping_country,
    billing_same_as_shipping: 1,
    billing_full_name: null,
    billing_address: null,
    billing_city: null,
    billing_state: null,
    billing_postal_code: null,
    billing_country: null,
    notes: input.customer_notes || null,
    tracking_number: null,
    shipped_at: null,
    delivered_at: null,
    cancelled_at: null,
    cancellation_reason: null,
    created_at: createdAt,
    updated_at: createdAt,
  });

  db.order_items.push(...orderItems);

  for (const item of orderItems) {
    db.seller_earnings.push({
      id: randomUUID(),
      seller_id: item.seller_id,
      order_item_id: item.id,
      amount: item.seller_earnings,
      commission_amount: item.commission_amount,
      status: "pending",
      available_at: null,
      released_at: null,
      created_at: createdAt,
    });
  }

  db.payments.push({
    id: randomUUID(),
    order_id: orderId,
    payment_method: input.payment_method || "cash_on_delivery",
    transaction_id: input.payment_reference || null,
    payment_proof_url: input.payment_proof_url || null,
    amount: total,
    status: "pending",
    paid_at: null,
    created_at: createdAt,
  });

  const cart = db.carts.find((item) => sameId(item.user_id, userId));
  if (cart) {
    db.cart_items = db.cart_items.filter((item) => !sameId(item.cart_id, cart.id));
    cart.updated_at = createdAt;
  }

  await writeLocalDatabase(db);
  return {
    id: orderId,
    orderNumber,
    total,
    items: orderItems.map((item) => ({
      title: item.product_title,
      quantity: item.quantity,
      price: item.price,
    })),
  };
}

export async function findLocalOrderTracking(orderNumber: string, email: string) {
  const db = await readLocalDatabase();
  const profile = db.profiles.find(
    (item) => text(item.email).toLowerCase() === email.toLowerCase()
  );
  if (!profile) return null;

  const order = db.orders.find(
    (item) =>
      sameId(item.customer_id, profile.id) &&
      text(item.order_number).toLowerCase() === orderNumber.toLowerCase()
  );
  if (!order) return null;

  return {
    orderNumber: text(order.order_number),
    status: text(order.status) as LocalOrderStatus,
    trackingNumber: order.tracking_number ? text(order.tracking_number) : null,
    createdAt: order.created_at ? text(order.created_at) : null,
    shippedAt: order.shipped_at ? text(order.shipped_at) : null,
    deliveredAt: order.delivered_at ? text(order.delivered_at) : null,
  };
}

export async function resetLocalDatabase() {
  const db = createInitialDatabase();
  await writeLocalDatabase(db);
  return db;
}
