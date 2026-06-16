import type { NextApiRequest, NextApiResponse } from "next";
import type { RowDataPacket } from "mysql2";
import {
  canUseLocalDevAuthFallback,
  getDatabaseSetupMessage,
  isDatabaseConfigured,
  queryRows,
} from "@/lib/server/db";
import { logServerEvent } from "@/lib/server/observability";

type CheckStatus = "ok" | "degraded" | "not_configured";

interface HealthResponse {
  status: CheckStatus;
  checkedAt: string;
  app: {
    status: "ok";
    nodeEnv: string;
    version: string | null;
  };
  database: {
    status: CheckStatus;
    mode: "mysql" | "local_fallback" | "unconfigured";
    latencyMs: number | null;
    message?: string;
  };
}

function hasHealthAccess(req: NextApiRequest) {
  const token = process.env.OPS_HEALTH_TOKEN;
  if (!token) return process.env.NODE_ENV !== "production";

  const header = req.headers.authorization || "";
  return header === `Bearer ${token}` || req.query.token === token;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<HealthResponse | { error: string }>
) {
  if (req.method !== "GET" && req.method !== "HEAD") {
    res.setHeader("Allow", "GET, HEAD");
    return res.status(405).json({ error: "Method not allowed" });
  }

  if (!hasHealthAccess(req)) {
    logServerEvent({ event: "ops_health_access_denied", level: "warn", req });
    return res.status(401).json({ error: "Authentication required" });
  }

  const checkedAt = new Date().toISOString();
  const app = {
    status: "ok" as const,
    nodeEnv: process.env.NODE_ENV || "development",
    version: process.env.NEXT_PUBLIC_APP_VERSION || process.env.APP_VERSION || null,
  };

  let database: HealthResponse["database"];
  let status: CheckStatus = "ok";

  if (!isDatabaseConfigured()) {
    const localFallback = canUseLocalDevAuthFallback();
    status = localFallback ? "degraded" : "not_configured";
    database = {
      status,
      mode: localFallback ? "local_fallback" : "unconfigured",
      latencyMs: null,
      message: localFallback
        ? "Using local development database fallback."
        : "MySQL database environment variables are not configured.",
    };
  } else {
    const startedAt = Date.now();
    try {
      await queryRows<RowDataPacket[]>("SELECT 1 AS ok");
      database = {
        status: "ok",
        mode: "mysql",
        latencyMs: Date.now() - startedAt,
      };
    } catch (error) {
      status = "degraded";
      database = {
        status: "degraded",
        mode: "mysql",
        latencyMs: Date.now() - startedAt,
        message: getDatabaseSetupMessage(error),
      };
      logServerEvent({ event: "ops_health_database_failed", level: "error", req, error });
    }
  }

  const body: HealthResponse = { status, checkedAt, app, database };
  res.setHeader("Cache-Control", "no-store");
  if (req.method === "HEAD") return res.status(status === "ok" ? 200 : 503).end();
  return res.status(status === "ok" ? 200 : 503).json(body);
}
