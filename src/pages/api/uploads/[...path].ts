import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import type { NextApiRequest, NextApiResponse } from "next";
import { readSession } from "@/lib/server/session";

type PrivateUploadScope = "kyc" | "payment-proof";

const privateScopeAccess: Record<PrivateUploadScope, Array<"admin" | "manager">> = {
  kyc: ["admin"],
  "payment-proof": ["admin", "manager"],
};

const contentTypes: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".pdf": "application/pdf",
};

function cleanName(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "upload";
}

function isPrivateUploadScope(value: string): value is PrivateUploadScope {
  return value === "kyc" || value === "payment-proof";
}

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
  if (!session) return res.status(401).json({ error: "Authentication required" });

  const isOwner = cleanName(session.id) === ownerFolder;
  const isPrivilegedViewer = privateScopeAccess[scope].includes(
    session.role as "admin" | "manager"
  );
  if (!isOwner && !isPrivilegedViewer) {
    return res.status(403).json({ error: "Access denied" });
  }

  const uploadRoot = path.join(process.cwd(), ".private", "uploads");
  const filePath = path.join(uploadRoot, scope, ownerFolder, fileName);
  const resolvedRoot = path.resolve(uploadRoot);
  const resolvedPath = path.resolve(filePath);
  if (!resolvedPath.startsWith(`${resolvedRoot}${path.sep}`)) {
    return res.status(404).json({ error: "File not found" });
  }

  try {
    const fileStat = await stat(resolvedPath);
    if (!fileStat.isFile()) return res.status(404).json({ error: "File not found" });

    const extension = path.extname(fileName).toLowerCase();
    res.setHeader("Content-Type", contentTypes[extension] || "application/octet-stream");
    res.setHeader("Content-Length", String(fileStat.size));
    res.setHeader("Cache-Control", "private, no-store");
    res.setHeader("X-Content-Type-Options", "nosniff");

    if (req.method === "HEAD") return res.status(200).end();

    const file = await readFile(resolvedPath);
    return res.status(200).send(file);
  } catch {
    return res.status(404).json({ error: "File not found" });
  }
}
