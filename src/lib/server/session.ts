import type { NextApiRequest, NextApiResponse } from "next";
import { parse, serialize } from "cookie";
import { jwtVerify, SignJWT } from "jose";

export type MarketplaceRole = "customer" | "seller" | "admin" | "manager" | "warehouse";

export interface SessionUser {
  id: string;
  email: string;
  role: MarketplaceRole;
  created_at?: string | null;
}

const COOKIE_NAME = "mercato_session";
const SESSION_DURATION_SECONDS = 60 * 60 * 24 * 7;

function shouldUseSecureCookie() {
  if (process.env.AUTH_COOKIE_SECURE === "true") return true;
  if (process.env.AUTH_COOKIE_SECURE === "false") return false;
  if (process.env.LOCAL_DB_FALLBACK === "true") return false;

  const configuredUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.APP_URL ||
    process.env.SITE_URL ||
    "";
  if (configuredUrl) return configuredUrl.startsWith("https://");

  return process.env.NODE_ENV === "production";
}

function getSessionSecret() {
  const secret = process.env.AUTH_SECRET;
  if (!secret && process.env.NODE_ENV !== "production") {
    return new TextEncoder().encode("local-development-only-auth-secret-please-replace");
  }

  if (!secret || secret.length < 32) {
    throw new Error("AUTH_SECRET must contain at least 32 characters");
  }
  return new TextEncoder().encode(secret);
}

export async function createSessionToken(user: SessionUser) {
  return new SignJWT({
    id: user.id,
    email: user.email,
    role: user.role,
    created_at: user.created_at,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DURATION_SECONDS}s`)
    .sign(getSessionSecret());
}

export async function readSession(req: NextApiRequest): Promise<SessionUser | null> {
  const token = parse(req.headers.cookie || "")[COOKIE_NAME];
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, getSessionSecret());
    if (
      typeof payload.id !== "string" ||
      typeof payload.email !== "string" ||
      !["customer", "seller", "admin", "manager", "warehouse"].includes(String(payload.role))
    ) {
      return null;
    }

    return {
      id: payload.id,
      email: payload.email,
      role: payload.role as MarketplaceRole,
      created_at: typeof payload.created_at === "string" ? payload.created_at : null,
    };
  } catch {
    return null;
  }
}

export function setSessionCookie(res: NextApiResponse, token: string) {
  res.setHeader(
    "Set-Cookie",
    serialize(COOKIE_NAME, token, {
      httpOnly: true,
      secure: shouldUseSecureCookie(),
      sameSite: "lax",
      path: "/",
      maxAge: SESSION_DURATION_SECONDS,
    })
  );
}

export function clearSessionCookie(res: NextApiResponse) {
  res.setHeader(
    "Set-Cookie",
    serialize(COOKIE_NAME, "", {
      httpOnly: true,
      secure: shouldUseSecureCookie(),
      sameSite: "lax",
      path: "/",
      maxAge: 0,
    })
  );
}
