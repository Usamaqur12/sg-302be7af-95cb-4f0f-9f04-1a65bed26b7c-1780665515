import { randomUUID } from "node:crypto";
import type { NextApiRequest, NextApiResponse } from "next";
import bcrypt from "bcryptjs";
import type { RowDataPacket } from "mysql2";
import { canUseLocalDevAuthFallback, queryRows } from "@/lib/server/db";
import { createLocalProfile } from "@/lib/server/local-db";
import { enforceRateLimit } from "@/lib/server/rate-limit";
import { registerSchema, validateSchema } from "@/lib/validation";
import { getErrorMessage } from "@/lib/errors";

interface ExistingUserRow extends RowDataPacket {
  id: string;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }
  if (enforceRateLimit(req, res, { key: "auth-register", limit: 5, windowMs: 10 * 60_000 })) {
    return;
  }

  const validation = validateSchema(registerSchema, req.body);
  if (!validation.success || !validation.data) {
    return res.status(400).json({ error: "Invalid registration details", errors: validation.errors });
  }

  try {
    const input = validation.data;
    const email = input.email.trim().toLowerCase();
    if (canUseLocalDevAuthFallback()) {
      await createLocalProfile({
        email,
        password: input.password,
        fullName: input.name,
        phone: input.phone || null,
        role: "customer",
      });
      return res.status(201).json({ success: true });
    }

    const existing = await queryRows<ExistingUserRow[]>(
      "SELECT id FROM profiles WHERE email = ? LIMIT 1",
      [email]
    );
    if (existing.length) {
      return res.status(409).json({ error: "An account with this email already exists" });
    }

    const id = randomUUID();
    const passwordHash = await bcrypt.hash(input.password, 12);
    await queryRows<RowDataPacket[]>(
      `INSERT INTO profiles
       (id, email, password_hash, full_name, phone, role, is_active)
       VALUES (?, ?, ?, ?, ?, 'customer', 1)`,
      [id, email, passwordHash, input.name, input.phone || null]
    );

    return res.status(201).json({ success: true });
  } catch (error) {
    return res.status(500).json({
      error: getErrorMessage(error, "Could not create account"),
    });
  }
}
