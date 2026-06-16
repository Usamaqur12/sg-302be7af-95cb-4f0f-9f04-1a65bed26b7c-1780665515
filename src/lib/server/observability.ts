import type { NextApiRequest } from "next";

type EventLevel = "info" | "warn" | "error";

interface ServerEventInput {
  event: string;
  level?: EventLevel;
  req?: NextApiRequest;
  actorId?: string | null;
  actorRole?: string | null;
  target?: Record<string, unknown>;
  error?: unknown;
  details?: Record<string, unknown>;
}

function errorDetails(error: unknown) {
  if (!error) return undefined;
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
    };
  }
  return { message: String(error) };
}

function requestDetails(req?: NextApiRequest) {
  if (!req) return undefined;
  const forwardedFor = req.headers["x-forwarded-for"];
  return {
    method: req.method,
    url: req.url,
    ip: Array.isArray(forwardedFor) ? forwardedFor[0] : forwardedFor || req.socket.remoteAddress || null,
    userAgent: req.headers["user-agent"] || null,
  };
}

export function logServerEvent(input: ServerEventInput) {
  const level = input.level || "info";
  const payload = {
    timestamp: new Date().toISOString(),
    service: "mercato",
    event: input.event,
    level,
    actor: input.actorId || input.actorRole ? {
      id: input.actorId || null,
      role: input.actorRole || null,
    } : undefined,
    target: input.target,
    request: requestDetails(input.req),
    error: errorDetails(input.error),
    details: input.details,
  };

  const line = JSON.stringify(payload);
  if (level === "error") {
    console.error(line);
    return;
  }
  if (level === "warn") {
    console.warn(line);
    return;
  }
  console.info(line);
}
