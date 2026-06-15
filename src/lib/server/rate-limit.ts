import type { NextApiRequest, NextApiResponse } from "next";

interface Bucket {
  count: number;
  resetAt: number;
}

const globalBuckets = globalThis as typeof globalThis & {
  __mercatoRateLimitBuckets?: Map<string, Bucket>;
};

const buckets = globalBuckets.__mercatoRateLimitBuckets ?? new Map<string, Bucket>();
globalBuckets.__mercatoRateLimitBuckets = buckets;

function clientIp(req: NextApiRequest) {
  const forwardedFor = req.headers["x-forwarded-for"];
  const firstForwarded = Array.isArray(forwardedFor) ? forwardedFor[0] : forwardedFor;
  return (
    firstForwarded?.split(",")[0]?.trim() ||
    req.socket.remoteAddress ||
    "unknown"
  );
}

export function enforceRateLimit(
  req: NextApiRequest,
  res: NextApiResponse,
  options: { key: string; limit: number; windowMs: number }
) {
  const now = Date.now();
  const bucketKey = `${options.key}:${clientIp(req)}`;
  const current = buckets.get(bucketKey);

  if (!current || current.resetAt <= now) {
    buckets.set(bucketKey, { count: 1, resetAt: now + options.windowMs });
    return false;
  }

  current.count += 1;
  if (current.count <= options.limit) return false;

  const retryAfterSeconds = Math.ceil((current.resetAt - now) / 1000);
  res.setHeader("Retry-After", String(retryAfterSeconds));
  res.status(429).json({
    error: "Too many requests. Please wait and try again.",
  });
  return true;
}
