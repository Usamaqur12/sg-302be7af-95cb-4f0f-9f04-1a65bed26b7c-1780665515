export type PromotionStatus = "pending" | "approved" | "active" | "rejected" | "ended" | string;

export interface PromotionLike {
  id: string;
  seller_id?: string | null;
  product_id?: string | null;
  request_type?: string | null;
  title?: string | null;
  discount_type?: string | null;
  discount_value?: number | string | null;
  min_order_amount?: number | string | null;
  max_discount_amount?: number | string | null;
  budget_amount?: number | string | null;
  start_at?: string | null;
  end_at?: string | null;
  status?: PromotionStatus | null;
}

export interface PromotionCartItem {
  product_id: string;
  seller_id?: string | null;
  price: number;
  quantity: number;
  title?: string;
}

export interface AppliedPromotion {
  id: string;
  title: string;
  request_type: string;
  discount_type: string | null;
  discount_amount: number;
  shipping_discount: number;
  product_ids: string[];
}

export interface PromotionSummary {
  subtotal: number;
  productDiscount: number;
  shippingBeforeDiscount: number;
  shippingDiscount: number;
  shipping: number;
  taxableSubtotal: number;
  tax: number;
  totalDiscount: number;
  total: number;
  appliedPromotions: AppliedPromotion[];
}

const SHIPPING_THRESHOLD = 50;
const STANDARD_SHIPPING = 9.99;
const TAX_RATE = 0.08;

function money(value: unknown) {
  const next = Number(value || 0);
  if (!Number.isFinite(next) || next <= 0) return 0;
  return Number(next.toFixed(2));
}

function normalizeType(value: unknown) {
  return String(value || "seller_voucher").toLowerCase().replace(/[\s-]+/g, "_");
}

function sameId(left: unknown, right: unknown) {
  return String(left || "") === String(right || "");
}

export function isPromotionLive(promotion: PromotionLike, nowMs = Date.now()) {
  if (!["approved", "active"].includes(String(promotion.status || ""))) return false;
  const startMs = promotion.start_at ? new Date(promotion.start_at).getTime() : 0;
  const endMs = promotion.end_at ? new Date(promotion.end_at).getTime() : Number.POSITIVE_INFINITY;
  return (Number.isNaN(startMs) || startMs <= nowMs) && (Number.isNaN(endMs) || endMs >= nowMs);
}

export function promotionLabel(promotion: PromotionLike) {
  const type = normalizeType(promotion.request_type);
  if (type === "drzflash") return "Flash deal";
  if (type === "free_shipping") return "Free shipping";
  if (type === "bundle_deal") return "Bundle deal";
  if (type === "coins_discount") return "Coins discount";
  if (type === "seller_program") return "Seller program";
  if (type === "campaign") return "Campaign deal";
  return "Seller voucher";
}

function eligibleItems(items: PromotionCartItem[], promotion: PromotionLike) {
  return items.filter((item) => {
    const sellerMatches = !promotion.seller_id || sameId(item.seller_id, promotion.seller_id);
    const productMatches = !promotion.product_id || sameId(item.product_id, promotion.product_id);
    return sellerMatches && productMatches;
  });
}

function discountForPromotion(eligibleSubtotal: number, promotion: PromotionLike) {
  const discountType = String(promotion.discount_type || "").toLowerCase();
  const value = money(promotion.discount_value);
  if (value <= 0 || eligibleSubtotal <= 0) return 0;

  const rawDiscount = discountType === "fixed" ? value : eligibleSubtotal * (value / 100);
  const maxDiscount = money(promotion.max_discount_amount);
  return money(Math.min(eligibleSubtotal, maxDiscount > 0 ? Math.min(rawDiscount, maxDiscount) : rawDiscount));
}

export function calculatePromotionSummary(
  items: PromotionCartItem[],
  promotions: PromotionLike[] = []
): PromotionSummary {
  const subtotal = money(items.reduce((sum, item) => sum + money(item.price) * Number(item.quantity || 0), 0));
  const shippingBeforeDiscount = subtotal >= SHIPPING_THRESHOLD || subtotal <= 0 ? 0 : STANDARD_SHIPPING;
  const livePromotions = promotions.filter((promotion) => isPromotionLive(promotion));
  const appliedPromotions: AppliedPromotion[] = [];
  let productDiscount = 0;
  let shippingDiscount = 0;

  for (const promotion of livePromotions) {
    const type = normalizeType(promotion.request_type);
    const scopedItems = eligibleItems(items, promotion);
    if (!scopedItems.length) continue;

    const eligibleSubtotal = money(scopedItems.reduce((sum, item) => sum + money(item.price) * Number(item.quantity || 0), 0));
    const minOrder = money(promotion.min_order_amount);
    if (minOrder > 0 && eligibleSubtotal < minOrder) continue;

    const isShippingPromotion = type === "free_shipping" || promotion.discount_type === "free_shipping";
    if (isShippingPromotion) {
      const nextShippingDiscount = money(shippingBeforeDiscount - shippingDiscount);
      if (nextShippingDiscount <= 0) continue;
      shippingDiscount = money(shippingDiscount + nextShippingDiscount);
      appliedPromotions.push({
        id: promotion.id,
        title: promotion.title || promotionLabel(promotion),
        request_type: type,
        discount_type: "free_shipping",
        discount_amount: 0,
        shipping_discount: nextShippingDiscount,
        product_ids: scopedItems.map((item) => item.product_id),
      });
      continue;
    }

    if (type === "seller_program" && money(promotion.discount_value) <= 0) continue;

    const remainingSubtotal = Math.max(0, subtotal - productDiscount);
    const discountAmount = money(Math.min(remainingSubtotal, discountForPromotion(eligibleSubtotal, promotion)));
    if (discountAmount <= 0) continue;

    productDiscount = money(productDiscount + discountAmount);
    appliedPromotions.push({
      id: promotion.id,
      title: promotion.title || promotionLabel(promotion),
      request_type: type,
      discount_type: promotion.discount_type || "percentage",
      discount_amount: discountAmount,
      shipping_discount: 0,
      product_ids: scopedItems.map((item) => item.product_id),
    });
  }

  productDiscount = money(Math.min(productDiscount, subtotal));
  shippingDiscount = money(Math.min(shippingDiscount, shippingBeforeDiscount));
  const taxableSubtotal = money(Math.max(0, subtotal - productDiscount));
  const tax = money(taxableSubtotal * TAX_RATE);
  const shipping = money(Math.max(0, shippingBeforeDiscount - shippingDiscount));
  const totalDiscount = money(productDiscount + shippingDiscount);
  const total = money(taxableSubtotal + tax + shipping);

  return {
    subtotal,
    productDiscount,
    shippingBeforeDiscount,
    shippingDiscount,
    shipping,
    taxableSubtotal,
    tax,
    totalDiscount,
    total,
    appliedPromotions,
  };
}

export function scorePromotionRequest(promotion: PromotionLike & {
  seller?: { status?: string | null; account_health_status?: string | null } | null;
  product?: { status?: string | null; stock_quantity?: number | null; price?: number | null } | null;
}) {
  let score = 25;
  const sellerStatus = String(promotion.seller?.status || "").toLowerCase();
  const health = String(promotion.seller?.account_health_status || "").toLowerCase();
  const productStatus = String(promotion.product?.status || "").toLowerCase();
  const hasProduct = Boolean(promotion.product_id);
  const type = normalizeType(promotion.request_type);

  if (sellerStatus === "approved") score += 15;
  if (["excellent", "good", "healthy"].includes(health)) score += 10;
  if (!hasProduct || productStatus === "approved") score += 15;
  if (!hasProduct || Number(promotion.product?.stock_quantity || 0) > 0) score += 10;
  if (type === "free_shipping" || money(promotion.discount_value) > 0) score += 10;
  if (money(promotion.budget_amount) > 0 || ["seller_program", "campaign"].includes(type)) score += 10;
  if (!promotion.end_at || new Date(promotion.end_at).getTime() > Date.now()) score += 5;

  return Math.max(0, Math.min(100, score));
}
