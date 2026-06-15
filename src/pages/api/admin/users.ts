import { randomUUID } from "node:crypto";
import type { NextApiRequest, NextApiResponse } from "next";
import bcrypt from "bcryptjs";
import type { RowDataPacket } from "mysql2";
import { canUseLocalDevAuthFallback, queryRows } from "@/lib/server/db";
import { createLocalProfile, readLocalDatabase, writeLocalDatabase } from "@/lib/server/local-db";
import { readSession, type MarketplaceRole } from "@/lib/server/session";

const staffRoles: MarketplaceRole[] = ["customer", "seller", "manager", "warehouse"];

function cleanText(value: unknown) {
  return String(value ?? "").trim();
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const session = await readSession(req);
  if (session?.role !== "admin") {
    return res.status(403).json({ error: "Only admin can create users" });
  }

  const role = cleanText(req.body.role) as MarketplaceRole;
  const email = cleanText(req.body.email).toLowerCase();
  const password = String(req.body.password ?? "");
  const fullName = cleanText(req.body.full_name || req.body.name);
  const phone = cleanText(req.body.phone);
  const cnicNumber = cleanText(req.body.cnic_number);
  const kycDocumentUrl = cleanText(req.body.kyc_document_url);
  const businessName = cleanText(req.body.business_name) || fullName || email;

  if (!staffRoles.includes(role)) {
    return res.status(400).json({ error: "Select customer, seller, manager, or warehouse role" });
  }
  if (!email || !email.includes("@") || password.length < 8 || !fullName) {
    return res.status(400).json({ error: "Name, valid email, and 8+ character password are required" });
  }

  try {
    if (canUseLocalDevAuthFallback()) {
      const profile = await createLocalProfile({
        email,
        password,
        fullName,
        phone: phone || null,
        role,
        cnicNumber: cnicNumber || null,
        kycDocumentUrl: kycDocumentUrl || null,
      });

      if (role === "seller") {
        const db = await readLocalDatabase();
        db.seller_profiles.push({
          id: randomUUID(),
          user_id: profile.id,
          business_name: businessName,
          business_description: "Seller profile created by admin.",
          business_address: null,
          business_phone: phone || null,
          business_email: email,
          logo_url: null,
          banner_url: null,
          kyc_document_url: kycDocumentUrl || null,
          kyc_document_type: null,
          tax_id: null,
          owner_full_name: fullName,
          owner_cnic: cnicNumber || null,
          cnic_front_url: null,
          cnic_back_url: null,
          business_registration_url: null,
          tax_certificate_url: null,
          bank_statement_url: null,
          brand_authorization_url: null,
          pickup_address: null,
          return_address: null,
          seller_center_enabled_options: null,
          storefront_config: null,
          status: "pending",
          commission_rate: 15,
          total_sales: 0,
          total_earnings: 0,
          available_balance: 0,
          rating: 0,
          total_reviews: 0,
          holiday_mode: 0,
          holiday_message: null,
          order_volume_limit: 50,
          non_compliance_points: 0,
          account_health_status: "excellent",
          admin_note: "Created by admin from User Management.",
          verified_at: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
        await writeLocalDatabase(db);
      }

      return res.status(201).json({ success: true, user: profile });
    }

    const existing = await queryRows<RowDataPacket[]>("SELECT id FROM profiles WHERE email = ? LIMIT 1", [email]);
    if (existing.length) return res.status(409).json({ error: "A user with this email already exists" });

    const id = randomUUID();
    const passwordHash = await bcrypt.hash(password, 12);
    await queryRows<RowDataPacket[]>(
      `INSERT INTO profiles
       (id, email, password_hash, full_name, phone, role, is_active, cnic_number, kyc_document_url)
       VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?)`,
      [id, email, passwordHash, fullName, phone || null, role, cnicNumber || null, kycDocumentUrl || null]
    );

    if (role === "seller") {
      await queryRows<RowDataPacket[]>(
        `INSERT INTO seller_profiles
         (id, user_id, business_name, business_description, business_phone, business_email, owner_full_name, owner_cnic, kyc_document_url, status, commission_rate)
         VALUES (?, ?, ?, 'Seller profile created by admin.', ?, ?, ?, ?, ?, 'pending', 15.00)`,
        [randomUUID(), id, businessName, phone || null, email, fullName, cnicNumber || null, kycDocumentUrl || null]
      );
    }

    return res.status(201).json({ success: true, user: { id, email, role, full_name: fullName } });
  } catch (error) {
    return res.status(500).json({
      error: error instanceof Error ? error.message : "Could not create user",
    });
  }
}
