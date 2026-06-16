import type { NextApiRequest, NextApiResponse } from "next";
import bcrypt from "bcryptjs";
import type { RowDataPacket } from "mysql2";
import {
  canUseLocalDevAuthFallback,
  getDatabaseSetupMessage,
  isDatabaseConfigured,
  queryRows,
} from "@/lib/server/db";
import { findLocalProfileByEmail } from "@/lib/server/local-db";
import { logServerEvent } from "@/lib/server/observability";
import { enforceRateLimit } from "@/lib/server/rate-limit";
import {
  createSessionToken,
  setSessionCookie,
  type MarketplaceRole,
} from "@/lib/server/session";
import { loginSchema, validateSchema } from "@/lib/validation";

interface UserRow extends RowDataPacket {
  id: string;
  email: string;
  password_hash: string;
  full_name: string | null;
  role: MarketplaceRole;
  is_active: number;
  created_at: string | null;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }
  if (await enforceRateLimit(req, res, { key: "auth-login", limit: 8, windowMs: 60_000 })) {
    return;
  }
  const accountScope =
    typeof req.body?.email === "string" ? req.body.email.trim().toLowerCase() : null;
  if (
    accountScope &&
    await enforceRateLimit(req, res, {
      key: "auth-login-account",
      limit: 12,
      windowMs: 10 * 60_000,
      scope: accountScope,
    })
  ) {
    return;
  }

  const validation = validateSchema(loginSchema, req.body);
  if (!validation.success || !validation.data) {
    return res.status(400).json({ error: "Enter a valid email and password" });
  }

  try {
    const email = validation.data.email.trim().toLowerCase();

    if (!isDatabaseConfigured() && canUseLocalDevAuthFallback()) {
      const localUser = await findLocalProfileByEmail(email);

      if (
        !localUser ||
        !localUser.is_active ||
        typeof localUser.password_hash !== "string" ||
        !(await bcrypt.compare(validation.data.password, localUser.password_hash))
      ) {
        logServerEvent({
          event: "auth_login_failed",
          level: "warn",
          req,
          target: { email, mode: "local_fallback" },
          details: { reason: "invalid_credentials" },
        });
        return res.status(401).json({ error: "Invalid email or password" });
      }

      const sessionUser = {
        id: String(localUser.id),
        email: String(localUser.email),
        role: localUser.role as MarketplaceRole,
        created_at: typeof localUser.created_at === "string" ? localUser.created_at : new Date().toISOString(),
      };
      const token = await createSessionToken(sessionUser);
      setSessionCookie(res, token);

      return res.status(200).json({
        user: sessionUser,
        profile: {
          id: sessionUser.id,
          email: sessionUser.email,
          full_name: typeof localUser.full_name === "string" ? localUser.full_name : null,
          role: sessionUser.role,
        },
      });
    }

    const users = await queryRows<UserRow[]>(
      `SELECT id, email, password_hash, full_name, role, is_active, created_at
       FROM profiles
       WHERE email = ?
       LIMIT 1`,
      [email]
    );
    const user = users[0];

    if (!user || !user.is_active || !(await bcrypt.compare(validation.data.password, user.password_hash))) {
      logServerEvent({
        event: "auth_login_failed",
        level: "warn",
        req,
        target: { email, mode: "mysql" },
        details: { reason: !user ? "not_found" : !user.is_active ? "inactive" : "invalid_credentials" },
      });
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const sessionUser = { id: user.id, email: user.email, role: user.role, created_at: user.created_at };
    const token = await createSessionToken(sessionUser);
    setSessionCookie(res, token);

    return res.status(200).json({
      user: sessionUser,
      profile: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        role: user.role,
      },
    });
  } catch (error) {
    logServerEvent({ event: "auth_login_error", level: "error", req, error });
    return res.status(503).json({
      error: getDatabaseSetupMessage(error),
    });
  }
}
