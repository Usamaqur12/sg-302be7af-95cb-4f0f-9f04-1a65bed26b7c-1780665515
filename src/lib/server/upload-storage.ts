import { randomUUID } from "node:crypto";
import { mkdir, readFile, rename, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import type { RowDataPacket } from "mysql2/promise";
import { canUseLocalDevAuthFallback, isDatabaseConfigured, queryRows } from "@/lib/server/db";
import type { MarketplaceRole, SessionUser } from "@/lib/server/session";

export type UploadScope =
  | "product"
  | "seller-logo"
  | "seller-banner"
  | "kyc"
  | "cms"
  | "category"
  | "payment-proof";

export type UploadStorage = "public" | "private";
export type UploadReviewStatus = "pending" | "approved" | "manual_review";

export interface UploadRecord {
  id: string;
  owner_id: string;
  scope: UploadScope;
  storage: UploadStorage;
  url: string;
  storage_path: string;
  original_name: string;
  mime_type: string;
  size_bytes: number;
  review_status: UploadReviewStatus;
  retention_days: number | null;
  expires_at: string | null;
  deleted_at: string | null;
  created_at: string;
}

type UploadPolicy = {
  roles: MarketplaceRole[];
  storage: UploadStorage;
  allowedMimeTypes: string[];
  maxBytes: number;
  reviewStatus: UploadReviewStatus;
  retentionDays: number | null;
  keepLatest: number | null;
};

type UploadMetadataStore = {
  upload_files?: UploadRecord[];
};

const privateScopes = new Set<UploadScope>(["kyc", "payment-proof"]);

export const uploadPolicies: Record<UploadScope, UploadPolicy> = {
  product: {
    roles: ["seller", "admin", "manager", "warehouse"],
    storage: "public",
    allowedMimeTypes: ["image/jpeg", "image/png", "image/webp", "image/gif"],
    maxBytes: 5 * 1024 * 1024,
    reviewStatus: "pending",
    retentionDays: null,
    keepLatest: null,
  },
  "seller-logo": {
    roles: ["seller", "admin"],
    storage: "public",
    allowedMimeTypes: ["image/jpeg", "image/png", "image/webp", "image/gif"],
    maxBytes: 5 * 1024 * 1024,
    reviewStatus: "approved",
    retentionDays: null,
    keepLatest: 5,
  },
  "seller-banner": {
    roles: ["seller", "admin"],
    storage: "public",
    allowedMimeTypes: ["image/jpeg", "image/png", "image/webp", "image/gif"],
    maxBytes: 5 * 1024 * 1024,
    reviewStatus: "approved",
    retentionDays: null,
    keepLatest: 5,
  },
  kyc: {
    roles: ["seller", "admin"],
    storage: "private",
    allowedMimeTypes: ["image/jpeg", "image/png", "image/webp", "image/gif", "application/pdf"],
    maxBytes: 10 * 1024 * 1024,
    reviewStatus: "manual_review",
    retentionDays: 1095,
    keepLatest: 10,
  },
  cms: {
    roles: ["admin"],
    storage: "public",
    allowedMimeTypes: ["image/jpeg", "image/png", "image/webp", "image/gif"],
    maxBytes: 5 * 1024 * 1024,
    reviewStatus: "approved",
    retentionDays: null,
    keepLatest: null,
  },
  category: {
    roles: ["admin", "manager", "warehouse"],
    storage: "public",
    allowedMimeTypes: ["image/jpeg", "image/png", "image/webp", "image/gif"],
    maxBytes: 5 * 1024 * 1024,
    reviewStatus: "approved",
    retentionDays: null,
    keepLatest: null,
  },
  "payment-proof": {
    roles: ["customer", "admin", "manager"],
    storage: "private",
    allowedMimeTypes: ["image/jpeg", "image/png", "image/webp", "image/gif", "application/pdf"],
    maxBytes: 5 * 1024 * 1024,
    reviewStatus: "manual_review",
    retentionDays: 2555,
    keepLatest: 100,
  },
};

export const extensionsByMime: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "application/pdf": "pdf",
};

export const contentTypesByExtension: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".pdf": "application/pdf",
};

export function cleanUploadSegment(value: string) {
  return (
    value
      .toLowerCase()
      .replace(/[^a-z0-9._-]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 80) || "upload"
  );
}

export function isUploadScope(value: string): value is UploadScope {
  return Object.hasOwn(uploadPolicies, value);
}

export function isPrivateUploadScope(value: string): value is UploadScope {
  return isUploadScope(value) && privateScopes.has(value);
}

export function uploadRoot(storage: UploadStorage) {
  return storage === "private"
    ? path.join(process.cwd(), ".private", "uploads")
    : path.join(process.cwd(), "public", "uploads");
}

export function uploadMetadataPath() {
  return path.join(process.cwd(), ".private", "upload-metadata.json");
}

export function assertUploadAllowed(scope: UploadScope, role: MarketplaceRole) {
  const policy = uploadPolicies[scope];
  if (!policy.roles.includes(role)) {
    throw new Error("Upload is not allowed for this account");
  }
}

export function parseDataUrl(dataUrl: unknown) {
  if (typeof dataUrl !== "string") throw new Error("Upload data is required");
  const match = dataUrl.match(/^data:([^;]+);base64,([A-Za-z0-9+/=\r\n]+)$/);
  if (!match) throw new Error("Invalid upload payload");
  return {
    mimeType: match[1].toLowerCase(),
    buffer: Buffer.from(match[2], "base64"),
  };
}

function detectMimeType(buffer: Buffer) {
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return "image/jpeg";
  }
  if (
    buffer.length >= 8 &&
    buffer[0] === 0x89 &&
    buffer.subarray(1, 4).toString("ascii") === "PNG" &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return "image/png";
  }
  if (
    buffer.length >= 12 &&
    buffer.subarray(0, 4).toString("ascii") === "RIFF" &&
    buffer.subarray(8, 12).toString("ascii") === "WEBP"
  ) {
    return "image/webp";
  }
  if (buffer.length >= 6 && ["GIF87a", "GIF89a"].includes(buffer.subarray(0, 6).toString("ascii"))) {
    return "image/gif";
  }
  if (buffer.length >= 5 && buffer.subarray(0, 5).toString("ascii") === "%PDF-") {
    return "application/pdf";
  }
  return null;
}

export function validateUploadPayload(scope: UploadScope, claimedMimeType: string, buffer: Buffer) {
  const policy = uploadPolicies[scope];
  const normalizedMime = claimedMimeType.toLowerCase();
  if (!policy.allowedMimeTypes.includes(normalizedMime) || !extensionsByMime[normalizedMime]) {
    throw new Error("Unsupported file format");
  }
  if (buffer.byteLength > policy.maxBytes) {
    throw new Error("File is too large");
  }

  const detectedMimeType = detectMimeType(buffer);
  if (!detectedMimeType || detectedMimeType !== normalizedMime) {
    throw new Error("File contents do not match the declared file type");
  }

  return normalizedMime;
}

function toSqlDate(value: Date) {
  return value.toISOString().slice(0, 19).replace("T", " ");
}

function addDays(days: number) {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() + days);
  return date;
}

function retentionExpiry(policy: UploadPolicy) {
  return policy.retentionDays === null ? null : toSqlDate(addDays(policy.retentionDays));
}

async function readLocalMetadataStore(): Promise<UploadMetadataStore> {
  try {
    const raw = await readFile(uploadMetadataPath(), "utf8");
    const parsed = JSON.parse(raw) as UploadMetadataStore;
    if (!Array.isArray(parsed.upload_files)) parsed.upload_files = [];
    return parsed;
  } catch {
    return { upload_files: [] };
  }
}

async function writeLocalMetadataStore(store: UploadMetadataStore) {
  const filePath = uploadMetadataPath();
  await mkdir(path.dirname(filePath), { recursive: true });
  const tempPath = `${filePath}.${randomUUID()}.tmp`;
  await writeFile(tempPath, `${JSON.stringify(store, null, 2)}\n`);
  await rename(tempPath, filePath);
}

async function insertLocalUploadRecord(record: UploadRecord) {
  const store = await readLocalMetadataStore();
  store.upload_files = [...(store.upload_files || []), record];
  await writeLocalMetadataStore(store);
}

async function markLocalDeleted(records: UploadRecord[]) {
  if (!records.length) return;
  const deletedIds = new Set(records.map((record) => record.id));
  const store = await readLocalMetadataStore();
  store.upload_files = (store.upload_files || []).map((record) =>
    deletedIds.has(record.id) ? { ...record, deleted_at: new Date().toISOString() } : record
  );
  await writeLocalMetadataStore(store);
}

async function insertDatabaseUploadRecord(record: UploadRecord) {
  await queryRows<RowDataPacket[]>(
    `INSERT INTO upload_files
     (id, owner_id, scope, storage, url, storage_path, original_name, mime_type, size_bytes,
      review_status, retention_days, expires_at, deleted_at, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      record.id,
      record.owner_id,
      record.scope,
      record.storage,
      record.url,
      record.storage_path,
      record.original_name,
      record.mime_type,
      record.size_bytes,
      record.review_status,
      record.retention_days,
      record.expires_at,
      record.deleted_at,
      record.created_at,
    ]
  );
}

export async function recordUpload(input: {
  session: SessionUser;
  scope: UploadScope;
  url: string;
  storagePath: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
}) {
  const policy = uploadPolicies[input.scope];
  const record: UploadRecord = {
    id: randomUUID(),
    owner_id: input.session.id,
    scope: input.scope,
    storage: policy.storage,
    url: input.url,
    storage_path: input.storagePath,
    original_name: input.originalName,
    mime_type: input.mimeType,
    size_bytes: input.sizeBytes,
    review_status: policy.reviewStatus,
    retention_days: policy.retentionDays,
    expires_at: retentionExpiry(policy),
    deleted_at: null,
    created_at: toSqlDate(new Date()),
  };

  if (isDatabaseConfigured()) {
    await insertDatabaseUploadRecord(record);
  } else if (canUseLocalDevAuthFallback()) {
    await insertLocalUploadRecord(record);
  }

  await pruneUploadRetention(input.session.id, input.scope);
  return record;
}

function shouldUseLocalMetadata() {
  return !isDatabaseConfigured() && canUseLocalDevAuthFallback();
}

async function selectDatabaseUploadByUrl(url: string) {
  const rows = await queryRows<Array<UploadRecord & RowDataPacket>>(
    `SELECT id, owner_id, scope, storage, url, storage_path, original_name, mime_type, size_bytes,
            review_status, retention_days, expires_at, deleted_at, created_at
     FROM upload_files
     WHERE url = ? AND deleted_at IS NULL
     LIMIT 1`,
    [url]
  );
  return rows[0] || null;
}

export async function findUploadByUrl(url: string) {
  try {
    if (isDatabaseConfigured()) return await selectDatabaseUploadByUrl(url);
    if (shouldUseLocalMetadata()) {
      const store = await readLocalMetadataStore();
      return (store.upload_files || []).find((record) => record.url === url && !record.deleted_at) || null;
    }
  } catch {
    return null;
  }

  return null;
}

async function listPrunableDatabaseUploads(ownerId: string, scope: UploadScope) {
  const policy = uploadPolicies[scope];
  const values: unknown[] = [ownerId, scope];
  let limitClause = "";
  if (policy.keepLatest !== null) {
    limitClause = " OR id NOT IN (SELECT id FROM keep_latest)";
  }

  return queryRows<Array<UploadRecord & RowDataPacket>>(
    `WITH keep_latest AS (
       SELECT id
       FROM upload_files
       WHERE owner_id = ? AND scope = ? AND deleted_at IS NULL
       ORDER BY created_at DESC
       LIMIT ${Number(policy.keepLatest || 0)}
     )
     SELECT id, owner_id, scope, storage, url, storage_path, original_name, mime_type, size_bytes,
            review_status, retention_days, expires_at, deleted_at, created_at
     FROM upload_files
     WHERE owner_id = ? AND scope = ? AND deleted_at IS NULL
       AND ((expires_at IS NOT NULL AND expires_at < CURRENT_TIMESTAMP)${limitClause})`,
    [...values, ...values]
  );
}

function listPrunableLocalUploads(records: UploadRecord[], ownerId: string, scope: UploadScope) {
  const policy = uploadPolicies[scope];
  const active = records
    .filter((record) => record.owner_id === ownerId && record.scope === scope && !record.deleted_at)
    .sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)));
  const nowMs = Date.now();
  const overLimit =
    policy.keepLatest === null ? [] : active.slice(policy.keepLatest);
  const expired = active.filter((record) => {
    if (!record.expires_at) return false;
    return new Date(record.expires_at).getTime() < nowMs;
  });
  return [...new Map([...overLimit, ...expired].map((record) => [record.id, record])).values()];
}

async function removeUploadFile(record: UploadRecord) {
  const root = uploadRoot(record.storage);
  const resolvedRoot = path.resolve(root);
  const resolvedPath = path.resolve(record.storage_path);
  if (!resolvedPath.startsWith(`${resolvedRoot}${path.sep}`)) return;
  await unlink(resolvedPath).catch(() => undefined);
}

export async function pruneUploadRetention(ownerId: string, scope: UploadScope) {
  const policy = uploadPolicies[scope];
  if (policy.keepLatest === null && policy.retentionDays === null) return;

  try {
    if (isDatabaseConfigured()) {
      const records = await listPrunableDatabaseUploads(ownerId, scope);
      await Promise.all(records.map(removeUploadFile));
      if (records.length) {
        await queryRows<RowDataPacket[]>(
          `UPDATE upload_files SET deleted_at = CURRENT_TIMESTAMP WHERE id IN (${records.map(() => "?").join(",")})`,
          records.map((record) => record.id)
        );
      }
      return;
    }

    if (shouldUseLocalMetadata()) {
      const store = await readLocalMetadataStore();
      const records = listPrunableLocalUploads(store.upload_files || [], ownerId, scope);
      await Promise.all(records.map(removeUploadFile));
      await markLocalDeleted(records);
    }
  } catch {
    // Retention cleanup must not make a successful upload fail.
  }
}
