export type MarketingCampaignStatus = "pending" | "approved" | "active" | "paused" | "rejected" | "ended";

export interface MarketingCampaignScoreInput {
  bidAmount?: number | null;
  dailyBudget?: number | null;
  totalBudget?: number | null;
  spentAmount?: number | null;
  adminScore?: number | null;
  qualityScore?: number | null;
  sellerHealthScore?: number | null;
  targetKeywords?: string | null;
}

export interface SponsoredProductSignals {
  title?: string | null;
  rating?: number | null;
  totalReviews?: number | null;
  stockQuantity?: number | null;
  salesCount?: number | null;
}

function clamp(value: number, min = 0, max = 100) {
  return Math.min(max, Math.max(min, value));
}

function words(value: string) {
  return value
    .toLowerCase()
    .split(/[^a-z0-9]+/i)
    .map((item) => item.trim())
    .filter(Boolean);
}

export function keywordRelevance(query: string | undefined, title: string | undefined | null, keywords: string | undefined | null) {
  const queryWords = words(query || "");
  const haystack = new Set([...words(title || ""), ...words(keywords || "")]);
  if (!queryWords.length) return 60;
  const matches = queryWords.filter((item) => haystack.has(item)).length;
  return clamp(35 + (matches / queryWords.length) * 65);
}

export function productQualityScore(product: SponsoredProductSignals) {
  const ratingScore = clamp((Number(product.rating || 0) / 5) * 45);
  const reviewScore = clamp(Math.log10(Number(product.totalReviews || 0) + 1) * 18, 0, 25);
  const stockScore = Number(product.stockQuantity || 0) > 0 ? 20 : -40;
  const salesScore = clamp(Math.log10(Number(product.salesCount || 0) + 1) * 8, 0, 10);
  return clamp(ratingScore + reviewScore + stockScore + salesScore);
}

export function calculateAdScore(
  campaign: MarketingCampaignScoreInput,
  product: SponsoredProductSignals,
  searchQuery?: string
) {
  const bidScore = clamp(Number(campaign.bidAmount || 0) * 12, 0, 100);
  const budgetLeft = Number(campaign.totalBudget || 0) - Number(campaign.spentAmount || 0);
  const budgetScore = budgetLeft > 0 || Number(campaign.dailyBudget || 0) > 0 ? 70 : 15;
  const relevance = keywordRelevance(searchQuery, product.title, campaign.targetKeywords);
  const quality = campaign.qualityScore ?? productQualityScore(product);
  const sellerHealth = campaign.sellerHealthScore ?? 60;
  const admin = campaign.adminScore ?? 50;

  return Math.round(
    relevance * 0.28 +
      bidScore * 0.2 +
      budgetScore * 0.12 +
      quality * 0.2 +
      sellerHealth * 0.12 +
      admin * 0.08
  );
}

export function campaignCtr(clicks?: number | null, impressions?: number | null) {
  const totalImpressions = Number(impressions || 0);
  return totalImpressions ? (Number(clicks || 0) / totalImpressions) * 100 : 0;
}

export function campaignCpc(spent?: number | null, clicks?: number | null) {
  const totalClicks = Number(clicks || 0);
  return totalClicks ? Number(spent || 0) / totalClicks : 0;
}

export function campaignRoas(revenue?: number | null, spent?: number | null) {
  const totalSpent = Number(spent || 0);
  return totalSpent ? Number(revenue || 0) / totalSpent : 0;
}
