import type { NextApiRequest, NextApiResponse } from "next";
import { canUseLocalDevAuthFallback } from "@/lib/server/db";
import { findLocalProfileByEmail } from "@/lib/server/local-db";
import { createSessionToken, setSessionCookie, type MarketplaceRole } from "@/lib/server/session";

const DEV_ACCOUNTS: Record<MarketplaceRole, string> = {
  admin: "admin@marketplace.com",
  seller: "seller@marketplace.com",
  customer: "customer@marketplace.com",
  manager: "manager@marketplace.com",
  warehouse: "warehouse@marketplace.com",
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!canUseLocalDevAuthFallback()) {
    return res.status(404).json({ error: "Dev login is not available" });
  }

  const role = String(req.query.role || "seller") as MarketplaceRole;
  const email = DEV_ACCOUNTS[role];

  if (!email) {
    return res.status(400).json({ error: "Unsupported dev role" });
  }

  const localUser = await findLocalProfileByEmail(email);
  if (!localUser) {
    return res.status(404).json({ error: "Local dev account not found" });
  }

  const sessionUser = {
    id: String(localUser.id),
    email: String(localUser.email),
    role: localUser.role as MarketplaceRole,
    created_at: typeof localUser.created_at === "string" ? localUser.created_at : new Date().toISOString(),
  };
  const token = await createSessionToken(sessionUser);
  setSessionCookie(res, token);

  const nextPath = typeof req.query.next === "string" && req.query.next.startsWith("/")
    ? req.query.next
    : `/${role}`;

  return res.redirect(302, nextPath);
}
