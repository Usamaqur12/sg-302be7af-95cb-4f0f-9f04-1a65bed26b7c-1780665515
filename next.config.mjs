/** @type {import('next').NextConfig} */
import { createRequire } from "module";

function parseCsv(value = "") {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function getAppHost() {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || process.env.SITE_URL;
  if (!appUrl) return "";
  try {
    return new URL(appUrl).hostname;
  } catch {
    return "";
  }
}

function getImageHostnames() {
  const hosts = new Set(["images.unsplash.com"]);
  parseCsv(process.env.NEXT_PUBLIC_ALLOWED_IMAGE_HOSTS || process.env.ALLOWED_IMAGE_HOSTS || "")
    .forEach((host) => hosts.add(host));

  const appHost = getAppHost();
  if (appHost) hosts.add(appHost);

  if (process.env.NODE_ENV !== "production") {
    hosts.add("localhost");
    hosts.add("127.0.0.1");
  }

  return Array.from(hosts).flatMap((hostname) => [
    { protocol: "https", hostname },
    ...(hostname === "localhost" || hostname === "127.0.0.1"
      ? [{ protocol: "http", hostname }]
      : []),
  ]);
}

// Check if element-tagger is available
function isElementTaggerAvailable() {
  const enabled =
    process.env.NEXT_PUBLIC_ENABLE_SOFTGEN_SCRIPTS === "true" &&
    process.env.NEXT_PUBLIC_ENABLE_ELEMENT_TAGGER === "true";

  if (!enabled) return false;

  try {
    const require = createRequire(import.meta.url);
    require.resolve("@softgenai/element-tagger");
    return true;
  } catch {
    return false;
  }
}

// Build turbo rules only if tagger is available
function getTurboRules() {
  if (!isElementTaggerAvailable()) {
    console.log(
      "[Softgen] Element tagger not found, skipping loader configuration"
    );
    return {};
  }

  return {
    "*.tsx": ["@softgenai/element-tagger"],
    "*.jsx": ["@softgenai/element-tagger"],
  };
}

function getContentSecurityPolicy() {
  const host = getAppHost() || "";
  const safeHosts = ["images.unsplash.com"];
  if (host) safeHosts.push(host);

  return [
    "default-src 'self'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "object-src 'none'",
    "script-src 'self' 'unsafe-inline'",
    "style-src 'self' 'unsafe-inline'",
    `img-src 'self' data: blob: ${safeHosts.join(" ")}`,
    "font-src 'self' data:",
    "connect-src 'self'",
    "media-src 'self' https://images.unsplash.com",
    "upgrade-insecure-requests",
  ].join("; ");
}

const securityHeaders = [
  {
    key: "Content-Security-Policy",
    value: getContentSecurityPolicy(),
  },
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  {
    key: "X-Frame-Options",
    value: "DENY",
  },
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=(), usb=(), fullscreen=(self)",
  },
  {
    key: "Cross-Origin-Opener-Policy",
    value: "same-origin-allow-popups",
  },
  {
    key: "Cross-Origin-Resource-Policy",
    value: "same-site",
  },
];

const productionHeaders =
  process.env.NODE_ENV === "production"
    ? [
        {
          key: "Strict-Transport-Security",
          value: "max-age=31536000; includeSubDomains; preload",
        },
      ]
    : [];

const nextConfig = {
  reactStrictMode: true,
  distDir: process.env.NEXT_DIST_DIR || ".next-build",
  serverExternalPackages: ["mysql2"],
  headers: async () => {
    return [
      {
        source: "/:path*",
        headers: [...securityHeaders, ...productionHeaders],
      },
      {
        source: "/_next/image",
        headers: [{ key: "Cross-Origin-Resource-Policy", value: "same-origin" }],
      },
    ];
  },
  images: {
    remotePatterns: getImageHostnames(),
  },
  turbopack: {
    rules: getTurboRules(),
  },
  allowedDevOrigins: ["*.daytona.work", "*.softgen.dev"],
};

export default nextConfig;
