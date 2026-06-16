import { randomUUID } from "node:crypto";
import type { NextApiRequest, NextApiResponse } from "next";
import type { RowDataPacket } from "mysql2/promise";
import { canUseLocalDevAuthFallback, getDatabaseSetupMessage, withTransaction } from "@/lib/server/db";
import { readLocalDatabase, writeLocalDatabase, type LocalRecord } from "@/lib/server/local-db";
import { enforceRateLimit } from "@/lib/server/rate-limit";

type MarketingAdEventType = "impression" | "click" | "conversion";

interface TrackingCampaignRow extends RowDataPacket {
  id: string;
  seller_id: string;
  product_id: string | null;
  status: string;
  daily_budget: number;
  total_budget: number;
  bid_amount: number;
  spent_amount: number;
  start_at: string | null;
  end_at: string | null;
  product_status: string | null;
  stock_quantity: number | null;
  seller_status: string | null;
}

function text(value: unknown) {
  return String(value ?? "");
}

function numeric(value: unknown, fallback = 0) {
  const next = Number(value);
  return Number.isFinite(next) ? next : fallback;
}

function parseBody(req: NextApiRequest) {
  if (typeof req.body === "string") {
    try {
      return JSON.parse(req.body) as Record<string, unknown>;
    } catch {
      return {};
    }
  }
  return (req.body || {}) as Record<string, unknown>;
}

function validEventType(value: unknown): value is MarketingAdEventType {
  return value === "impression" || value === "click" || value === "conversion";
}

function startOfTodayIso() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today.toISOString();
}

function isCampaignEligible(campaign: LocalRecord | TrackingCampaignRow, productId: string) {
  const now = Date.now();
  const campaignProductId = text(campaign.product_id);
  const startAt = campaign.start_at ? new Date(text(campaign.start_at)).getTime() : 0;
  const endAt = campaign.end_at ? new Date(text(campaign.end_at)).getTime() : Number.POSITIVE_INFINITY;

  return (
    campaign.status === "active" &&
    campaignProductId &&
    campaignProductId === productId &&
    (!startAt || startAt <= now) &&
    endAt >= now
  );
}

function hasBudgetForClick(campaign: LocalRecord | TrackingCampaignRow, cost: number, dailySpend: number) {
  if (cost <= 0) return true;

  const totalBudget = numeric(campaign.total_budget);
  const spentAmount = numeric(campaign.spent_amount);
  const dailyBudget = numeric(campaign.daily_budget);

  if (totalBudget > 0 && spentAmount + cost > totalBudget) return false;
  if (dailyBudget > 0 && dailySpend + cost > dailyBudget) return false;
  return true;
}

function requestMetadata(req: NextApiRequest) {
  return {
    source: "marketplace_web",
    referer: req.headers.referer || null,
    userAgent: req.headers["user-agent"] || null,
  };
}

async function trackLocalEvent(
  req: NextApiRequest,
  campaignId: string,
  productId: string,
  eventType: MarketingAdEventType,
  revenue: number
) {
  const db = await readLocalDatabase();
  const campaign = db.marketing_campaigns.find((item) => text(item.id) === campaignId);
  if (!campaign || !isCampaignEligible(campaign, productId)) {
    return { status: 404, payload: { error: "Sponsored campaign is not available" } };
  }

  const product = db.products.find((item) => text(item.id) === productId);
  const seller = db.seller_profiles.find((item) => text(item.id) === text(campaign.seller_id));
  if (!product || product.status !== "approved" || numeric(product.stock_quantity) <= 0 || seller?.status !== "approved") {
    return { status: 404, payload: { error: "Sponsored product is not available" } };
  }

  const todayStart = startOfTodayIso();
  const dailySpend = db.marketing_ad_events
    .filter(
      (event) =>
        text(event.campaign_id) === campaignId &&
        event.event_type === "click" &&
        text(event.created_at) >= todayStart
    )
    .reduce((sum, event) => sum + numeric(event.cost), 0);

  const cost = eventType === "click" ? numeric(campaign.bid_amount) : 0;
  if (eventType === "click" && !hasBudgetForClick(campaign, cost, dailySpend)) {
    campaign.status = "ended";
    campaign.updated_at = new Date().toISOString();
    await writeLocalDatabase(db);
    return { status: 409, payload: { error: "Campaign budget is exhausted" } };
  }

  const now = new Date().toISOString();
  db.marketing_ad_events.push({
    id: randomUUID(),
    campaign_id: campaignId,
    product_id: productId,
    seller_id: text(campaign.seller_id),
    event_type: eventType,
    cost,
    revenue,
    metadata: requestMetadata(req),
    created_at: now,
  });

  if (eventType === "impression") campaign.impressions = numeric(campaign.impressions) + 1;
  if (eventType === "click") {
    campaign.clicks = numeric(campaign.clicks) + 1;
    campaign.spent_amount = numeric(campaign.spent_amount) + cost;
  }
  if (eventType === "conversion") {
    campaign.conversions = numeric(campaign.conversions) + 1;
    campaign.revenue = numeric(campaign.revenue) + revenue;
  }
  campaign.updated_at = now;

  await writeLocalDatabase(db);
  return { status: 200, payload: { success: true, cost } };
}

async function trackMysqlEvent(
  req: NextApiRequest,
  campaignId: string,
  productId: string,
  eventType: MarketingAdEventType,
  revenue: number
) {
  return withTransaction(async (connection) => {
    const [rows] = await connection.execute<TrackingCampaignRow[]>(
      `SELECT
         mc.id,
         mc.seller_id,
         mc.product_id,
         mc.status,
         mc.daily_budget,
         mc.total_budget,
         mc.bid_amount,
         mc.spent_amount,
         mc.start_at,
         mc.end_at,
         p.status AS product_status,
         p.stock_quantity,
         sp.status AS seller_status
       FROM marketing_campaigns mc
       INNER JOIN products p ON p.id = mc.product_id
       INNER JOIN seller_profiles sp ON sp.id = mc.seller_id
       WHERE mc.id = ?
       LIMIT 1
       FOR UPDATE`,
      [campaignId]
    );

    const campaign = rows[0];
    if (
      !campaign ||
      !isCampaignEligible(campaign, productId) ||
      campaign.product_status !== "approved" ||
      campaign.seller_status !== "approved" ||
      numeric(campaign.stock_quantity) <= 0
    ) {
      return { status: 404, payload: { error: "Sponsored campaign is not available" } };
    }

    const [dailyRows] = await connection.execute<Array<RowDataPacket & { daily_spend: number }>>(
      `SELECT COALESCE(SUM(cost), 0) AS daily_spend
       FROM marketing_ad_events
       WHERE campaign_id = ? AND event_type = 'click' AND created_at >= CURDATE()`,
      [campaignId]
    );

    const cost = eventType === "click" ? numeric(campaign.bid_amount) : 0;
    if (eventType === "click" && !hasBudgetForClick(campaign, cost, numeric(dailyRows[0]?.daily_spend))) {
      await connection.execute(
        "UPDATE marketing_campaigns SET status = 'ended', updated_at = NOW() WHERE id = ?",
        [campaignId]
      );
      return { status: 409, payload: { error: "Campaign budget is exhausted" } };
    }

    await connection.execute(
      `INSERT INTO marketing_ad_events
         (id, campaign_id, product_id, seller_id, event_type, cost, revenue, metadata)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        randomUUID(),
        campaignId,
        productId,
        campaign.seller_id,
        eventType,
        cost,
        revenue,
        JSON.stringify(requestMetadata(req)),
      ]
    );

    await connection.execute(
      `UPDATE marketing_campaigns
       SET impressions = impressions + ?,
           clicks = clicks + ?,
           conversions = conversions + ?,
           spent_amount = spent_amount + ?,
           revenue = revenue + ?,
           updated_at = NOW()
       WHERE id = ?`,
      [
        eventType === "impression" ? 1 : 0,
        eventType === "click" ? 1 : 0,
        eventType === "conversion" ? 1 : 0,
        eventType === "click" ? cost : 0,
        eventType === "conversion" ? revenue : 0,
        campaignId,
      ]
    );

    return { status: 200, payload: { success: true, cost } };
  });
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }
  if (await enforceRateLimit(req, res, { key: "marketing-track", limit: 120, windowMs: 60_000 })) {
    return;
  }

  const body = parseBody(req);
  const campaignId = text(body.campaignId || body.campaign_id).trim();
  const productId = text(body.productId || body.product_id).trim();
  const eventType = body.eventType || body.event_type;
  const revenue = Math.max(0, numeric(body.revenue));

  if (!campaignId || !productId || !validEventType(eventType)) {
    return res.status(400).json({ error: "campaignId, productId and eventType are required" });
  }

  try {
    const result = canUseLocalDevAuthFallback()
      ? await trackLocalEvent(req, campaignId, productId, eventType, revenue)
      : await trackMysqlEvent(req, campaignId, productId, eventType, revenue);
    return res.status(result.status).json(result.payload);
  } catch (error) {
    return res.status(503).json({ error: getDatabaseSetupMessage(error) });
  }
}
