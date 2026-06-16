import type { NextApiRequest, NextApiResponse } from "next";
import type { RowDataPacket } from "mysql2";
import { isDatabaseConfigured, queryRows } from "@/lib/server/db";

interface Bucket {
  count: number;
  resetAt: number;
}

interface RateLimitCounterRow extends RowDataPacket {
  request_count: number;
  window_reset_at: Date | string;
}

interface RateLimitOptions {
  key: string;
  limit: number;
  windowMs: number;
  scope?: string | null;
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

function routePath(req: NextApiRequest) {
  return String(req.query?.path || req.url || "").slice(0, 255);
}

function retryAfterSeconds(resetAt: Date | string | number) {
  const resetTime =
    typeof resetAt === "number" ? resetAt : new Date(resetAt).getTime();
  return Math.max(1, Math.ceil((resetTime - Date.now()) / 1000));
}

function enforceMemoryRateLimit(
  req: NextApiRequest,
  res: NextApiResponse,
  options: RateLimitOptions
) {
  const now = Date.now();
  const bucketKey = `${options.key}:${options.scope || clientIp(req)}`;
  const current = buckets.get(bucketKey);

  if (!current || current.resetAt <= now) {
    buckets.set(bucketKey, { count: 1, resetAt: now + options.windowMs });
    return false;
  }

  current.count += 1;
  if (current.count <= options.limit) return false;

  const waitSeconds = retryAfterSeconds(current.resetAt);
  res.setHeader("Retry-After", String(waitSeconds));
  res.status(429).json({
    error: "Too many requests. Please wait and try again.",
  });
  return true;
}

async function recordAbuseAuditEvent(
  req: NextApiRequest,
  options: RateLimitOptions,
  observedCount: number,
  resetAt: Date | string
) {
  const ipAddress = clientIp(req);
  const userAgent = String(req.headers["user-agent"] || "").slice(0, 500) || null;
  const metadata = JSON.stringify({
    method: req.method || null,
    path: routePath(req),
    limit: options.limit,
    windowMs: options.windowMs,
    scope: options.scope || null,
    observedCount,
    resetAt: resetAt instanceof Date ? resetAt.toISOString() : resetAt,
  });

  await queryRows<RowDataPacket[]>(
    `INSERT INTO abuse_audit_events
       (id, event_type, rate_limit_key, ip_address, user_agent, metadata)
     VALUES (UUID(), 'rate_limit_exceeded', ?, ?, ?, ?)`,
    [options.key, ipAddress, userAgent, metadata]
  );
}

async function enforceSharedRateLimit(
  req: NextApiRequest,
  res: NextApiResponse,
  options: RateLimitOptions
) {
  const ipAddress = clientIp(req);
  const bucketKey = `${options.key}:${options.scope || ipAddress}`;
  const windowSeconds = Math.max(1, Math.ceil(options.windowMs / 1000));

  await queryRows<RowDataPacket[]>(
    `INSERT INTO rate_limit_counters
       (bucket_key, rate_limit_key, ip_address, request_count, window_reset_at)
     VALUES (?, ?, ?, 1, DATE_ADD(UTC_TIMESTAMP(), INTERVAL ? SECOND))
     ON DUPLICATE KEY UPDATE
       rate_limit_key = VALUES(rate_limit_key),
       ip_address = VALUES(ip_address),
       request_count = IF(window_reset_at <= UTC_TIMESTAMP(), 1, request_count + 1),
       window_reset_at = IF(window_reset_at <= UTC_TIMESTAMP(), VALUES(window_reset_at), window_reset_at),
       updated_at = CURRENT_TIMESTAMP`,
    [bucketKey, options.key, ipAddress, windowSeconds]
  );

  const rows = await queryRows<RateLimitCounterRow[]>(
    `SELECT request_count, window_reset_at
     FROM rate_limit_counters
     WHERE bucket_key = ?
     LIMIT 1`,
    [bucketKey]
  );
  const counter = rows[0];

  if (!counter || Number(counter.request_count) <= options.limit) return false;

  try {
    await recordAbuseAuditEvent(req, options, Number(counter.request_count), counter.window_reset_at);
  } catch {
    // Rate-limit enforcement must not depend on the audit insert succeeding.
  }
  const waitSeconds = retryAfterSeconds(counter.window_reset_at);
  res.setHeader("Retry-After", String(waitSeconds));
  res.status(429).json({
    error: "Too many requests. Please wait and try again.",
  });
  return true;
}

export async function enforceRateLimit(
  req: NextApiRequest,
  res: NextApiResponse,
  options: RateLimitOptions
) {
  if (!isDatabaseConfigured()) {
    return enforceMemoryRateLimit(req, res, options);
  }

  try {
    return await enforceSharedRateLimit(req, res, options);
  } catch {
    res.status(503).json({
      error: "Rate limit service is temporarily unavailable. Please try again.",
    });
    return true;
  }
}
