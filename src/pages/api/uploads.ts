import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import type { NextApiRequest, NextApiResponse } from "next";
import { logServerEvent } from "@/lib/server/observability";
import { enforceRateLimit } from "@/lib/server/rate-limit";
import { readSession } from "@/lib/server/session";
import {
  assertUploadAllowed,
  cleanUploadSegment,
  extensionsByMime,
  isUploadScope,
  parseDataUrl,
  recordUpload,
  uploadPolicies,
  uploadRoot,
  validateUploadPayload,
} from "@/lib/server/upload-storage";

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
  if (await enforceRateLimit(req, res, { key: "uploads", limit: 30, windowMs: 10 * 60_000 })) {
    return;
  }

  const session = await readSession(req);
  if (!session) {
    logServerEvent({ event: "upload_auth_required", level: "warn", req });
    return res.status(401).json({ error: "Authentication required" });
  }

  try {
    const scope = String(req.body?.scope || "");
    if (!isUploadScope(scope)) {
      logServerEvent({
        event: "upload_scope_rejected",
        level: "warn",
        req,
        actorId: session.id,
        actorRole: session.role,
        details: { scope },
      });
      return res.status(400).json({ error: "Unsupported upload type" });
    }
    assertUploadAllowed(scope, session.role);

    const { mimeType, buffer } = parseDataUrl(req.body?.dataUrl);
    const validatedMimeType = validateUploadPayload(scope, mimeType, buffer);

    const policy = uploadPolicies[scope];
    const root = uploadRoot(policy.storage);
    const userFolder = cleanUploadSegment(session.id);
    const folder = path.join(root, scope, userFolder);
    await mkdir(folder, { recursive: true });

    const original = cleanUploadSegment(String(req.body?.fileName || "upload"));
    const extension = extensionsByMime[validatedMimeType];
    const fileName = `${Date.now()}-${randomUUID()}-${original.replace(/\.[^.]+$/, "")}.${extension}`;
    const filePath = path.join(folder, fileName);
    await writeFile(filePath, buffer);
    const url =
      policy.storage === "private"
        ? `/api/uploads/${scope}/${userFolder}/${fileName}`
        : `/uploads/${scope}/${userFolder}/${fileName}`;
    const upload = await recordUpload({
      session,
      scope,
      url,
      storagePath: filePath,
      originalName: original,
      mimeType: validatedMimeType,
      sizeBytes: buffer.byteLength,
    });
    logServerEvent({
      event: "upload_saved",
      req,
      actorId: session.id,
      actorRole: session.role,
      target: { uploadId: upload.id, scope, storage: policy.storage, fileName },
      details: { mimeType: validatedMimeType, size: buffer.byteLength },
    });

    return res.status(201).json({
      id: upload.id,
      url,
      mimeType: validatedMimeType,
      size: buffer.byteLength,
      reviewStatus: upload.review_status,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Upload failed";
    const status = message === "File is too large" ? 413 : 400;
    logServerEvent({
      event: status === 413 ? "upload_too_large" : "upload_failed",
      level: status === 413 ? "warn" : "error",
      req,
      actorId: session.id,
      actorRole: session.role,
      error,
    });
    return res.status(status).json({ error: message });
  }
}
