import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import type { NextApiRequest, NextApiResponse } from "next";
import { logServerEvent } from "@/lib/server/observability";
import { readSession } from "@/lib/server/session";
import {
  cleanUploadSegment,
  contentTypesByExtension,
  findUploadByUrl,
  isPrivateUploadScope,
  uploadRoot,
  type UploadScope,
} from "@/lib/server/upload-storage";

const privateScopeAccess: Record<UploadScope, Array<"admin" | "manager">> = {
  product: [],
  "seller-logo": [],
  "seller-banner": [],
  kyc: ["admin"],
  cms: [],
  category: [],
  "payment-proof": ["admin", "manager"],
};

function hasUnsafeSegment(value: string) {
  return !value || value === "." || value === ".." || value.includes("/") || value.includes("\\");
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET" && req.method !== "HEAD") {
    res.setHeader("Allow", "GET, HEAD");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const routePath = req.query.path;
  const segments = Array.isArray(routePath) ? routePath : [];
  if (segments.length !== 3) {
    return res.status(404).json({ error: "File not found" });
  }

  const [scope, ownerFolder, fileName] = segments;
  if (
    !isPrivateUploadScope(scope) ||
    hasUnsafeSegment(ownerFolder) ||
    hasUnsafeSegment(fileName)
  ) {
    return res.status(404).json({ error: "File not found" });
  }

  const session = await readSession(req);
  if (!session) {
    logServerEvent({
      event: "private_upload_auth_required",
      level: "warn",
      req,
      target: { scope, ownerFolder, fileName },
    });
    return res.status(401).json({ error: "Authentication required" });
  }

  const url = `/api/uploads/${scope}/${ownerFolder}/${fileName}`;
  const upload = await findUploadByUrl(url);
  const isOwner = upload ? upload.owner_id === session.id : cleanUploadSegment(session.id) === ownerFolder;
  const isPrivilegedViewer = privateScopeAccess[scope].includes(
    session.role as "admin" | "manager"
  );
  if (!isOwner && !isPrivilegedViewer) {
    logServerEvent({
      event: "private_upload_access_denied",
      level: "warn",
      req,
      actorId: session.id,
      actorRole: session.role,
      target: { scope, ownerFolder, fileName },
    });
    return res.status(403).json({ error: "Access denied" });
  }

  const root = uploadRoot("private");
  const filePath = upload?.storage_path || path.join(root, scope, ownerFolder, fileName);
  const resolvedRoot = path.resolve(root);
  const resolvedPath = path.resolve(filePath);
  if (!resolvedPath.startsWith(`${resolvedRoot}${path.sep}`)) {
    return res.status(404).json({ error: "File not found" });
  }

  try {
    const fileStat = await stat(resolvedPath);
    if (!fileStat.isFile()) return res.status(404).json({ error: "File not found" });

    const extension = path.extname(fileName).toLowerCase();
    res.setHeader("Content-Type", upload?.mime_type || contentTypesByExtension[extension] || "application/octet-stream");
    res.setHeader("Content-Length", String(fileStat.size));
    res.setHeader("Cache-Control", "private, no-store");
    res.setHeader("X-Content-Type-Options", "nosniff");

    if (req.method === "HEAD") return res.status(200).end();

    const file = await readFile(resolvedPath);
    logServerEvent({
      event: "private_upload_served",
      req,
      actorId: session.id,
      actorRole: session.role,
      target: { uploadId: upload?.id || null, scope, ownerFolder, fileName },
      details: { size: fileStat.size },
    });
    return res.status(200).send(file);
  } catch (error) {
    logServerEvent({
      event: "private_upload_missing",
      level: "warn",
      req,
      actorId: session.id,
      actorRole: session.role,
      target: { uploadId: upload?.id || null, scope, ownerFolder, fileName },
      error,
    });
    return res.status(404).json({ error: "File not found" });
  }
}
