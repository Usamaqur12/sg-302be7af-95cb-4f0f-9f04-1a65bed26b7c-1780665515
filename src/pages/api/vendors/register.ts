import { randomUUID } from "node:crypto";
import type { NextApiRequest, NextApiResponse } from "next";
import bcrypt from "bcryptjs";
import type { RowDataPacket } from "mysql2";
import {
  errorResponse,
  successResponse,
  validationErrorResponse,
} from "@/lib/api-response";
import { canUseLocalDevAuthFallback, withTransaction } from "@/lib/server/db";
import { createLocalSeller, type LocalSellerRegistrationInput } from "@/lib/server/local-db";
import { enforceRateLimit } from "@/lib/server/rate-limit";
import { sellerRegistrationSchema, validateSchema } from "@/lib/validation";
import { getErrorMessage } from "@/lib/errors";

interface ExistingUserRow extends RowDataPacket {
  id: string;
}

interface SettingRow extends RowDataPacket {
  value: string | number | null;
}

function parseCommission(value: string | number | null | undefined) {
  if (typeof value === "number") return value;
  if (!value) return 15;

  try {
    const parsed = JSON.parse(value);
    const numeric = Number(parsed);
    return Number.isFinite(numeric) ? numeric : 15;
  } catch {
    const numeric = Number(value);
    return Number.isFinite(numeric) ? numeric : 15;
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json(errorResponse("Method not allowed"));
  }
  if (await enforceRateLimit(req, res, { key: "seller-register", limit: 5, windowMs: 10 * 60_000 })) {
    return;
  }
  const accountScope =
    typeof req.body?.email === "string" ? req.body.email.trim().toLowerCase() : null;
  if (
    accountScope &&
    await enforceRateLimit(req, res, {
      key: "seller-register-account",
      limit: 3,
      windowMs: 60 * 60_000,
      scope: accountScope,
    })
  ) {
    return;
  }

  const validation = validateSchema(sellerRegistrationSchema, req.body);

  if (!validation.success || !validation.data) {
    return res
      .status(400)
      .json(validationErrorResponse(validation.errors ?? []));
  }

  const input = validation.data as LocalSellerRegistrationInput;

  try {
    if (canUseLocalDevAuthFallback()) {
      const sellerProfile = await createLocalSeller(input);
      return res.status(201).json(
        successResponse("Seller application submitted successfully", {
          sellerProfileId: sellerProfile.id,
          status: sellerProfile.status,
          emailConfirmationRequired: false,
        })
      );
    }

    const result = await withTransaction(async (connection) => {
      const email = input.email.trim().toLowerCase();
      const [existingRows] = await connection.execute<ExistingUserRow[]>(
        "SELECT id FROM profiles WHERE email = ? LIMIT 1",
        [email]
      );

      if (existingRows.length) {
        throw new Error("An account with this email already exists");
      }

      const [settingsRows] = await connection.execute<SettingRow[]>(
        "SELECT JSON_UNQUOTE(value) AS value FROM system_settings WHERE `key` = 'default_commission_rate' LIMIT 1"
      );
      const commissionRate = parseCommission(settingsRows[0]?.value);
      const userId = randomUUID();
      const sellerProfileId = randomUUID();
      const passwordHash = await bcrypt.hash(input.password, 12);

      await connection.execute(
        `INSERT INTO profiles
         (id, email, password_hash, full_name, phone, role, is_active)
         VALUES (?, ?, ?, ?, ?, 'seller', 1)`,
        [userId, email, passwordHash, input.full_name, input.phone]
      );

      await connection.execute(
        `INSERT INTO seller_profiles
         (
           id, user_id, business_name, business_description, business_address,
           business_email, business_phone, bank_account_name, bank_account_number,
           bank_name, owner_full_name, pickup_address, return_address, commission_rate, status
         )
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')`,
        [
          sellerProfileId,
          userId,
          input.business_name,
          input.description,
          input.business_address,
          input.business_email,
          input.business_phone,
          input.bank_account_name,
          input.bank_account_number,
          input.bank_name,
          input.full_name,
          input.business_address,
          input.business_address,
          commissionRate,
        ]
      );

      return { sellerProfileId };
    });

    return res.status(201).json(
      successResponse("Seller application submitted successfully", {
        sellerProfileId: result.sellerProfileId,
        status: "pending",
        emailConfirmationRequired: false,
      })
    );
  } catch (error: unknown) {
    const message = getErrorMessage(error, "Could not create seller account");
    const status = message.includes("already exists") ? 409 : 500;
    return res.status(status).json(errorResponse(message));
  }
}
