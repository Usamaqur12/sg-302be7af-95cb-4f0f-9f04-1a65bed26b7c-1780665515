import { createHash } from "node:crypto";
import { cp, mkdir, readFile, rm, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const workRoot = path.join(appRoot, ".private", "upload-restore-smoke");
const backupRoot = path.join(workRoot, "backup");
const restoreRoot = path.join(workRoot, "restore");

const uploadSources = [
  { name: "public", source: path.join(appRoot, "public", "uploads") },
  { name: "private", source: path.join(appRoot, ".private", "uploads") },
  { name: "metadata", source: path.join(appRoot, ".private", "upload-metadata.json") },
];

async function exists(filePath) {
  try {
    await stat(filePath);
    return true;
  } catch {
    return false;
  }
}

async function walkFiles(root, prefix = "") {
  const { readdir } = await import("node:fs/promises");
  if (!(await exists(root))) return [];
  const entries = await readdir(root, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const relativePath = path.join(prefix, entry.name);
    const fullPath = path.join(root, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await walkFiles(fullPath, relativePath)));
    } else if (entry.isFile()) {
      files.push(relativePath);
    }
  }
  return files.sort();
}

async function digestFile(filePath) {
  const buffer = await readFile(filePath);
  return {
    bytes: buffer.byteLength,
    sha256: createHash("sha256").update(buffer).digest("hex"),
  };
}

async function collectManifest(root) {
  const manifest = {};
  for (const source of uploadSources) {
    const rootPath = path.join(root, source.name === "public" ? "public/uploads" : source.name === "private" ? ".private/uploads" : ".private");
    if (source.name === "metadata") {
      const metadataPath = path.join(rootPath, "upload-metadata.json");
      if (await exists(metadataPath)) {
        manifest.metadata = await digestFile(metadataPath);
      }
      continue;
    }

    const files = await walkFiles(rootPath);
    manifest[source.name] = {};
    for (const file of files) {
      manifest[source.name][file] = await digestFile(path.join(rootPath, file));
    }
  }
  return manifest;
}

function countManifestFiles(manifest) {
  return Object.values(manifest.public || {}).length + Object.values(manifest.private || {}).length;
}

async function copyIfPresent(source, destination) {
  if (!(await exists(source))) return false;
  await mkdir(path.dirname(destination), { recursive: true });
  await cp(source, destination, { recursive: true });
  return true;
}

async function verifyMetadataReferences(root) {
  const metadataPath = path.join(root, ".private", "upload-metadata.json");
  if (!(await exists(metadataPath))) return { checked: 0, missing: [] };
  const parsed = JSON.parse(await readFile(metadataPath, "utf8"));
  const records = Array.isArray(parsed.upload_files) ? parsed.upload_files : [];
  const missing = [];
  for (const record of records.filter((item) => !item.deleted_at)) {
    if (typeof record.storage_path !== "string") continue;
    const relative = path.relative(appRoot, record.storage_path);
    if (relative.startsWith("..")) continue;
    const restoredPath = path.join(root, relative);
    if (!(await exists(restoredPath))) missing.push(record.url || record.storage_path);
  }
  return { checked: records.length, missing };
}

await rm(workRoot, { recursive: true, force: true });
await mkdir(backupRoot, { recursive: true });

await copyIfPresent(path.join(appRoot, "public", "uploads"), path.join(backupRoot, "public", "uploads"));
await copyIfPresent(path.join(appRoot, ".private", "uploads"), path.join(backupRoot, ".private", "uploads"));
await copyIfPresent(path.join(appRoot, ".private", "upload-metadata.json"), path.join(backupRoot, ".private", "upload-metadata.json"));

const backupManifest = await collectManifest(backupRoot);
await writeFile(path.join(backupRoot, "upload-restore-manifest.json"), `${JSON.stringify(backupManifest, null, 2)}\n`);

await mkdir(restoreRoot, { recursive: true });
await copyIfPresent(path.join(backupRoot, "public", "uploads"), path.join(restoreRoot, "public", "uploads"));
await copyIfPresent(path.join(backupRoot, ".private", "uploads"), path.join(restoreRoot, ".private", "uploads"));
await copyIfPresent(path.join(backupRoot, ".private", "upload-metadata.json"), path.join(restoreRoot, ".private", "upload-metadata.json"));

const restoredManifest = await collectManifest(restoreRoot);
const metadataCheck = await verifyMetadataReferences(restoreRoot);

if (JSON.stringify(backupManifest) !== JSON.stringify(restoredManifest)) {
  throw new Error("Upload restore smoke failed: restored files do not match backup manifest");
}
if (metadataCheck.missing.length > 0) {
  throw new Error(`Upload restore smoke failed: ${metadataCheck.missing.length} metadata file reference(s) missing`);
}

console.log(
  JSON.stringify(
    {
      status: "ok",
      filesVerified: countManifestFiles(restoredManifest),
      metadataRecordsChecked: metadataCheck.checked,
      backupRoot,
      restoreRoot,
    },
    null,
    2
  )
);
