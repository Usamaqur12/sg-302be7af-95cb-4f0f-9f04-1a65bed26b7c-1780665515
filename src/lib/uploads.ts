export type UploadScope =
  | "product"
  | "seller-logo"
  | "seller-banner"
  | "kyc"
  | "cms"
  | "category"
  | "payment-proof";

function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("Could not read file"));
    reader.readAsDataURL(file);
  });
}

export async function uploadFile(file: File, scope: UploadScope) {
  const dataUrl = await readFileAsDataUrl(file);
  const response = await fetch("/api/uploads", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({
      fileName: file.name,
      mimeType: file.type,
      scope,
      dataUrl,
    }),
  });
  const payload = await response.json().catch(() => ({ error: "Upload failed" }));

  if (!response.ok || !payload.url) {
    throw new Error(payload.error || "Upload failed");
  }

  return String(payload.url);
}
