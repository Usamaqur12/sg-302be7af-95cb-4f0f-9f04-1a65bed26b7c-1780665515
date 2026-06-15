import type { NextApiRequest, NextApiResponse } from "next";
import type { RowDataPacket } from "mysql2";
import { calculateAdScore } from "@/lib/marketing";
import { canUseLocalDevAuthFallback, getDatabaseSetupMessage, queryRows } from "@/lib/server/db";
import { readLocalDatabase, type LocalRecord } from "@/lib/server/local-db";

interface SponsoredRow extends RowDataPacket {
  campaign_id: string;
  campaign_name: string;
  campaign_type: string;
  placement: string;
  bid_amount: number;
  daily_budget: number;
  total_budget: number;
  spent_amount: number;
  admin_score: number;
  quality_score: number;
  seller_health_score: number;
  target_keywords: string | null;
  product_id: string;
  title: string;
  price: number;
  compare_at_price: number | null;
  deal_expires_at: string | null;
  rating: number;
  total_reviews: number;
  stock_quantity: number;
  sales_count: number;
  seller_id: string;
  business_name: string;
}

function text(value: unknown) {
  return String(value ?? "");
}

function numeric(value: unknown, fallback = 0) {
  const next = Number(value);
  return Number.isFinite(next) ? next : fallback;
}

function isCampaignActive(campaign: LocalRecord) {
  const now = Date.now();
  const startAt = campaign.start_at ? new Date(text(campaign.start_at)).getTime() : 0;
  const endAt = campaign.end_at ? new Date(text(campaign.end_at)).getTime() : Number.POSITIVE_INFINITY;
  const budget = numeric(campaign.total_budget);
  const spent = numeric(campaign.spent_amount);
  return (
    campaign.status === "active" &&
    (!startAt || startAt <= now) &&
    endAt >= now &&
    (!budget || spent < budget)
  );
}

function mapSponsoredProduct(
  campaign: LocalRecord | SponsoredRow,
  product: LocalRecord | SponsoredRow,
  seller: LocalRecord | SponsoredRow,
  images: Array<{ url: string }>,
  searchQuery: string
) {
  const adScore = calculateAdScore(
    {
      bidAmount: numeric(campaign.bid_amount),
      dailyBudget: numeric(campaign.daily_budget),
      totalBudget: numeric(campaign.total_budget),
      spentAmount: numeric(campaign.spent_amount),
      adminScore: numeric(campaign.admin_score, 50),
      qualityScore: numeric(campaign.quality_score, 50),
      sellerHealthScore: numeric(campaign.seller_health_score, 50),
      targetKeywords: text(campaign.target_keywords),
    },
    {
      title: text(product.title),
      rating: numeric(product.rating),
      totalReviews: numeric(product.total_reviews),
      stockQuantity: numeric(product.stock_quantity),
      salesCount: numeric(product.sales_count),
    },
    searchQuery
  );

  return {
    id: text(product.id ?? product.product_id),
    title: text(product.title),
    price: numeric(product.price),
    compare_at_price: product.compare_at_price ?? null,
    deal_expires_at: product.deal_expires_at ?? null,
    rating: numeric(product.rating),
    total_reviews: numeric(product.total_reviews),
    images,
    seller: {
      id: text(seller.id ?? product.seller_id),
      business_name: text(seller.business_name),
    },
    sponsoredCampaign: {
      id: text(campaign.id ?? campaign.campaign_id),
      name: text(campaign.name ?? campaign.campaign_name),
      campaignType: text(campaign.campaign_type),
      placement: text(campaign.placement),
      adScore,
    },
  };
}

async function localSponsoredProducts(searchQuery: string, limit: number) {
  const db = await readLocalDatabase();
  const rows = db.marketing_campaigns
    .filter(isCampaignActive)
    .flatMap((campaign) => {
      const product = db.products.find((item) => item.id === campaign.product_id);
      if (!product || product.status !== "approved" || numeric(product.stock_quantity) <= 0) return [];
      const seller = db.seller_profiles.find((item) => item.id === product.seller_id);
      if (!seller || seller.status !== "approved") return [];
      const images = db.product_images
        .filter((image) => image.product_id === product.id)
        .sort((a, b) => numeric(a.display_order) - numeric(b.display_order))
        .map((image) => ({ url: text(image.url) }));
      return [mapSponsoredProduct(campaign, product, seller, images, searchQuery)];
    })
    .sort((a, b) => b.sponsoredCampaign.adScore - a.sponsoredCampaign.adScore)
    .slice(0, limit);

  return rows;
}

async function mysqlSponsoredProducts(searchQuery: string, limit: number) {
  const rows = await queryRows<SponsoredRow[]>(
    `SELECT
       mc.id AS campaign_id,
       mc.name AS campaign_name,
       mc.campaign_type,
       mc.placement,
       mc.bid_amount,
       mc.daily_budget,
       mc.total_budget,
       mc.spent_amount,
       mc.admin_score,
       mc.quality_score,
       mc.seller_health_score,
       mc.target_keywords,
       p.id AS product_id,
       p.title,
       p.price,
       p.compare_at_price,
       p.deal_expires_at,
       p.rating,
       p.total_reviews,
       p.stock_quantity,
       p.sales_count,
       sp.id AS seller_id,
       sp.business_name
     FROM marketing_campaigns mc
     INNER JOIN products p ON p.id = mc.product_id
     INNER JOIN seller_profiles sp ON sp.id = mc.seller_id
     WHERE mc.status = 'active'
       AND p.status = 'approved'
       AND sp.status = 'approved'
       AND p.stock_quantity > 0
       AND (mc.start_at IS NULL OR mc.start_at <= NOW())
       AND (mc.end_at IS NULL OR mc.end_at >= NOW())
       AND (mc.total_budget <= 0 OR mc.spent_amount < mc.total_budget)
     ORDER BY mc.admin_score DESC, mc.bid_amount DESC, mc.created_at DESC
     LIMIT ?`,
    [limit * 4]
  );

  const productIds = [...new Set(rows.map((row) => row.product_id))];
  const images = productIds.length
    ? await queryRows<Array<RowDataPacket & { product_id: string; url: string }>>(
        `SELECT product_id, url FROM product_images WHERE product_id IN (${productIds.map(() => "?").join(", ")}) ORDER BY display_order ASC`,
        productIds
      )
    : [];

  return rows
    .map((row) =>
      mapSponsoredProduct(
        { ...row, id: row.campaign_id, name: row.campaign_name },
        { ...row, id: row.product_id },
        { id: row.seller_id, business_name: row.business_name },
        images.filter((image) => image.product_id === row.product_id).map((image) => ({ url: image.url })),
        searchQuery
      )
    )
    .sort((a, b) => b.sponsoredCampaign.adScore - a.sponsoredCampaign.adScore)
    .slice(0, limit);
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const searchQuery = typeof req.query.q === "string" ? req.query.q : "";
  const limit = Math.min(Math.max(Number(req.query.limit || 8), 1), 16);

  try {
    const products = canUseLocalDevAuthFallback()
      ? await localSponsoredProducts(searchQuery, limit)
      : await mysqlSponsoredProducts(searchQuery, limit);
    return res.status(200).json({ products });
  } catch (error) {
    return res.status(503).json({ error: getDatabaseSetupMessage(error), products: [] });
  }
}
