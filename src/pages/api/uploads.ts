import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import type { NextApiRequest, NextApiResponse } from "next";
import { enforceRateLimit } from "@/lib/server/rate-limit";
import { readSession, type MarketplaceRole } from "@/lib/server/session";

type UploadScope =
  | "product"
  | "seller-logo"
  | "seller-banner"
  | "kyc"
  | "cms"
  | "category"
  | "payment-proof";

const scopeAccess: Record<UploadScope, MarketplaceRole[]> = {
  product: ["seller", "admin", "manager", "warehouse"],
  "seller-logo": ["seller", "admin"],
  "seller-banner": ["seller", "admin"],
  kyc: ["seller", "admin"],
  cms: ["admin"],
  category: ["admin", "manager", "warehouse"],
  "payment-proof": ["customer", "admin", "manager"],
};

const imageScopes = new Set<UploadScope>([
  "product",
  "seller-logo",
  "seller-banner",
  "cms",
  "category",
  "payment-proof",
]);

const privateScopes = new Set<UploadScope>(["kyc", "payment-proof"]);

const extensionsByMime: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "application/pdf": "pdf",
};

function cleanName(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "upload";
}

function parseDataUrl(dataUrl: unknown) {
  if (typeof dataUrl !== "string") throw new Error("Upload data is required");
  const match = dataUrl.match(/^data:([^;]+);base64,([A-Za-z0-9+/=\r\n]+)$/);
  if (!match) throw new Error("Invalid upload payload");
  return {
    mimeType: match[1].toLowerCase(),
    buffer: Buffer.from(match[2], "base64"),
  };
}

export const config = {
  api: {
    bodyParser: {
      sizeLimit: "12mb",
    },
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }
  if (enforceRateLimit(req, res, { key: "uploads", limit: 30, windowMs: 10 * 60_000 })) {
    return;
  }

  const session = await readSession(req);
  if (!session) return res.status(401).json({ error: "Authentication required" });

  try {
    const scope = String(req.body?.scope || "") as UploadScope;
    if (!scopeAccess[scope]) return res.status(400).json({ error: "Unsupported upload type" });
    if (!scopeAccess[scope].includes(session.role)) {
      return res.status(403).json({ error: "Upload is not allowed for this account" });
    }

    const { mimeType, buffer } = parseDataUrl(req.body?.dataUrl);
    if (!extensionsByMime[mimeType]) {
      return res.status(400).json({ error: "Unsupported file format" });
    }
    if (imageScopes.has(scope) && !mimeType.startsWith("image/")) {
      return res.status(400).json({ error: "Image file is required" });
    }
    if (scope === "kyc" && !mimeType.startsWith("image/") && mimeType !== "application/pdf") {
      return res.status(400).json({ error: "KYC document must be an image or PDF" });
    }

    const maxBytes = scope === "kyc" ? 10 * 1024 * 1024 : 5 * 1024 * 1024;
    if (buffer.byteLength > maxBytes) {
      return res.status(413).json({ error: "File is too large" });
    }

    const uploadRoot = privateScopes.has(scope)
      ? path.join(process.cwd(), ".private", "uploads")
      : path.join(process.cwd(), "public", "uploads");
    const userFolder = cleanName(session.id);
    const folder = path.join(uploadRoot, scope, userFolder);
    await mkdir(folder, { recursive: true });

    const original = cleanName(String(req.body?.fileName || "upload"));
    const extension = extensionsByMime[mimeType];
    const fileName = `${Date.now()}-${randomUUID()}-${original.replace(/\.[^.]+$/, "")}.${extension}`;
    const filePath = path.join(folder, fileName);
    await writeFile(filePath, buffer);

    return res.status(201).json({
      url: privateScopes.has(scope)
        ? `/api/uploads/${scope}/${userFolder}/${fileName}`
        : `/uploads/${scope}/${userFolder}/${fileName}`,
      mimeType,
      size: buffer.byteLength,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Upload failed";
    return res.status(400).json({ error: message });
  }
}
