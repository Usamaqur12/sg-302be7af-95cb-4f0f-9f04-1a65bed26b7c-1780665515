import type { NextApiRequest, NextApiResponse } from "next";
import type { RowDataPacket } from "mysql2";
import { canUseLocalDevAuthFallback, queryRows } from "@/lib/server/db";
import { readSession } from "@/lib/server/session";

interface AbuseAuditRow extends RowDataPacket {
  id: string;
  event_type: string;
  rate_limit_key: string | null;
  ip_address: string | null;
  user_agent: string | null;
  metadata: unknown;
  created_at: string;
}

function cleanFilter(value: unknown, maxLength: number) {
  const text = String(value ?? "").trim();
  return text ? text.slice(0, maxLength) : null;
}

function cleanLimit(value: unknown) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return 50;
  return Math.min(200, Math.max(1, Math.floor(parsed)));
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const session = await readSession(req);
  if (session?.role !== "admin" && session?.role !== "manager") {
    return res.status(403).json({ error: "Only admin or manager can view abuse audits" });
  }

  if (canUseLocalDevAuthFallback()) {
    return res.status(200).json({ events: [] });
  }

  const rateLimitKey = cleanFilter(req.query.key, 120);
  const ipAddress = cleanFilter(req.query.ip, 80);
  const limit = cleanLimit(req.query.limit);
  const where: string[] = [];
  const values: unknown[] = [];

  if (rateLimitKey) {
    where.push("rate_limit_key = ?");
    values.push(rateLimitKey);
  }
  if (ipAddress) {
    where.push("ip_address = ?");
    values.push(ipAddress);
  }

  try {
    const events = await queryRows<AbuseAuditRow[]>(
      `SELECT id, event_type, rate_limit_key, ip_address, user_agent, metadata, created_at
       FROM abuse_audit_events
       ${where.length ? `WHERE ${where.join(" AND ")}` : ""}
       ORDER BY created_at DESC
       LIMIT ${limit}`,
      values
    );

    return res.status(200).json({ events });
  } catch {
    return res.status(503).json({ error: "Abuse audit events are not available" });
  }
}
