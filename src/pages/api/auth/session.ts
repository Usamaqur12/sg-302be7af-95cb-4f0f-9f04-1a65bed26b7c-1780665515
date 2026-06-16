import type { NextApiRequest, NextApiResponse } from "next";
import type { RowDataPacket } from "mysql2";
import { canUseLocalDevAuthFallback, getDatabaseSetupMessage, queryRows } from "@/lib/server/db";
import { findLocalProfileById } from "@/lib/server/local-db";
import {
  clearSessionCookie,
  ensureCsrfCookie,
  readSession,
  type MarketplaceRole,
} from "@/lib/server/session";

interface ProfileRow extends RowDataPacket {
  id: string;
  email: string;
  full_name: string | null;
  role: MarketplaceRole;
  is_active: number;
  created_at: string | null;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed" });
  }
  res.setHeader("Cache-Control", "no-store");

  const session = await readSession(req);
  if (!session) return res.status(200).json({ user: null, profile: null });
  ensureCsrfCookie(req, res);

  if (canUseLocalDevAuthFallback()) {
    const localProfile = await findLocalProfileById(session.id);
    if (!localProfile) {
      clearSessionCookie(res);
      return res.status(200).json({ user: null, profile: null });
    }

    return res.status(200).json({
      user: session,
      profile: {
        id: localProfile.id,
        email: localProfile.email,
        full_name: localProfile.full_name,
        role: localProfile.role,
      },
    });
  }

  try {
    const rows = await queryRows<ProfileRow[]>(
      "SELECT id, email, full_name, role, is_active, created_at FROM profiles WHERE id = ? LIMIT 1",
      [session.id]
    );
    const profile = rows[0];

    if (!profile?.is_active) {
      clearSessionCookie(res);
      return res.status(200).json({ user: null, profile: null });
    }

    return res.status(200).json({
      user: { id: profile.id, email: profile.email, role: profile.role, created_at: profile.created_at },
      profile: {
        id: profile.id,
        email: profile.email,
        full_name: profile.full_name,
        role: profile.role,
      },
    });
  } catch (error) {
    return res.status(503).json({ error: getDatabaseSetupMessage(error) });
  }
}
