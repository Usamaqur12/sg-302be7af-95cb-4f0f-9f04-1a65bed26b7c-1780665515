import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

function addOrigin(targets: string[], value: string | undefined) {
  if (!value) return;

  try {
    targets.push(new URL(value).origin);
  } catch {
    // Ignore invalid origin formats and keep middleware fail-safe.
  }
}

const ALLOWED_ORIGINS = new Set<string>();
const origins: string[] = [];

addOrigin(origins, process.env.NEXT_PUBLIC_APP_URL);
addOrigin(origins, process.env.APP_URL);
addOrigin(origins, process.env.SITE_URL);
origins.forEach((origin) => ALLOWED_ORIGINS.add(origin));

if (process.env.NEXT_PUBLIC_ALLOWED_ORIGINS) {
  process.env.NEXT_PUBLIC_ALLOWED_ORIGINS.split(",")
    .map((value) => value.trim())
    .filter(Boolean)
    .forEach((origin) => ALLOWED_ORIGINS.add(origin));
}

if (process.env.ALLOWED_ORIGINS) {
  process.env.ALLOWED_ORIGINS.split(",")
    .map((value) => value.trim())
    .filter(Boolean)
    .forEach((origin) => ALLOWED_ORIGINS.add(origin));
}

if (process.env.NODE_ENV !== "production") {
  ALLOWED_ORIGINS.add("http://localhost:3000");
  ALLOWED_ORIGINS.add("http://127.0.0.1:3000");
}

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

function isAllowedOrigin(origin: string, currentOrigin: string) {
  if (!origin) return false;
  if (origin === currentOrigin) return true;

  if (ALLOWED_ORIGINS.size > 0 && ALLOWED_ORIGINS.has(origin)) return true;

  return false;
}

export default function middleware(req: NextRequest) {
  if (SAFE_METHODS.has(req.method)) return NextResponse.next();

  const origin = req.headers.get("origin");
  const secFetchSite = req.headers.get("sec-fetch-site") || "";

  if (origin) {
    if (!isAllowedOrigin(origin, req.nextUrl.origin)) {
      return NextResponse.json(
        { error: "Cross-site request rejected" },
        { status: 403 }
      );
    }
    return NextResponse.next();
  }

  // Browsers on the same origin always send Origin for state-changing requests.
  // For non-browser callers in non-prod, allow missing Origin headers.
  if (process.env.NODE_ENV !== "production") return NextResponse.next();

  if (secFetchSite && secFetchSite !== "cross-site") return NextResponse.next();

  return NextResponse.json(
    { error: "Missing CSRF origin header" },
    { status: 403 }
  );
}

export const config = {
  matcher: ["/api/:path*"],
};
