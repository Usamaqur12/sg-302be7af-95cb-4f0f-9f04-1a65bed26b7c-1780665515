# Amzn Phase 1F Security Audit

Date: 2026-06-15
Issue: ECL-29
Auditor: Cybersecurity Specialist

## Scope

Reviewed the Next.js marketplace security posture for authentication, role-based access control, API data access, uploads, data leakage, SQL injection exposure, deployment secrets, and secure cPanel readiness.

Primary files reviewed:

- `src/lib/server/session.ts`
- `src/pages/api/data/query.ts`
- `src/pages/api/uploads.ts`
- `src/pages/api/uploads/[...path].ts`
- `src/pages/api/auth/login.ts`
- `src/pages/api/auth/register.ts`
- `src/pages/api/auth/dev-login.ts`
- `src/pages/api/orders/index.ts`
- `src/pages/api/admin/users.ts`
- `src/lib/server/db.ts`
- `src/lib/server/rate-limit.ts`
- `next.config.mjs`
- `PROJECT_AUDIT_AND_DEPLOYMENT.md`
- `CPANEL_DEPLOYMENT.md`

## Remediations Completed

### 1. Private KYC and Payment-Proof Uploads

Before this audit, `kyc` and `payment-proof` uploads were written under `public/uploads`, making sensitive identity and payment documents directly web-addressable.

Implemented:

- `kyc` and `payment-proof` files now write to `.private/uploads`.
- Upload responses for private scopes now return authenticated URLs under `/api/uploads/...`.
- Added `src/pages/api/uploads/[...path].ts` to serve private uploads only to the owning user or privileged staff.
- Added `Cache-Control: private, no-store` and `X-Content-Type-Options: nosniff` for private document responses.
- Product, seller logo, seller banner, CMS, and category image behavior remains public as expected.

### 2. Generic Data API Read Access Hardening

The shared `/api/data/query` endpoint is high impact because the frontend uses it as a Supabase-compatible data adapter. The prior policy allowed broad authenticated `select` access after login, which risked cross-account reads of profiles, orders, payments, support tickets, KYC document URLs, and seller financial data.

Implemented/confirmed in `src/pages/api/data/query.ts`:

- Public catalog tables stay readable.
- Public reads are redacted through table-specific public column allowlists.
- Public seller profile responses exclude KYC, bank, payout, owner identity, admin, and operations fields.
- Customer reads require user/order ownership for profiles, orders, addresses, wishlists, support tickets, payments, returns, and order items.
- Seller reads require seller ownership for seller profiles, order items, orders, payout/withdrawal data, campaigns, promotions, product images, and support tickets.
- Staff read access is constrained to operational tables instead of all tables.
- SQL identifiers remain validated and query values remain parameterized.

## Positive Findings

- Session cookies are HTTP-only and use secure cookies in production or HTTPS configured deployments.
- `AUTH_SECRET` is required in production and must be at least 32 characters.
- Login, registration, order creation, and uploads have server-side rate limits.
- Passwords are hashed with bcrypt.
- SQL query values use parameterized execution through `mysql2`.
- Dangerous table names and column names are guarded by allowlists and identifier validation.
- Seller product mutation paths enforce seller ownership and product approval workflow.
- Admin and manager mutations are audit-logged to `admin_audit_logs`.
- Local dev login is disabled when the cPanel/MySQL database is configured for production.

## Remaining Launch Blockers

### Blocker 1: Live Database Policy Verification

The audit could not exercise real cPanel MySQL data because production DB credentials are not present in the workspace. Before launch, run role-based smoke tests against the real database:

- anonymous public catalog read
- customer own order read
- customer cross-order read denial
- seller own order item read
- seller cross-seller order item read denial
- admin KYC document view
- seller KYC owner document view
- anonymous/private KYC URL denial

### Blocker 2: Payment Flow Is Not PCI-Complete

Checkout currently records payment method/reference/proof and creates pending payments. It does not yet use Stripe PaymentIntents or webhook-confirmed payment status. Do not launch card payments until raw card handling is avoided and payment status is driven by provider webhooks.

### Blocker 3: Security Headers Baseline (Partially Implemented)

Implementation now added in `next.config.mjs`:

- `Content-Security-Policy`
- `X-Content-Type-Options`
- `X-Frame-Options` (`DENY`) and `frame-ancestors` via CSP
- `Referrer-Policy`
- `Permissions-Policy`
- `Cross-Origin-*` baseline controls
- `Strict-Transport-Security` for production

### Blocker 4: Remote Image Host Restriction (Implemented)

- `images.remotePatterns` in `next.config.mjs` now rejects wildcard `**` and allows:
- `images.unsplash.com` (public fallback/product placeholders)
- image host derived from `NEXT_PUBLIC_APP_URL` / `APP_URL` / `SITE_URL`
- optional `ALLOWED_IMAGE_HOSTS` / `NEXT_PUBLIC_ALLOWED_IMAGE_HOSTS`
- local dev hosts

### Blocker 5: CSRF Protection (Implemented for Authenticated APIs)

- Added `src/middleware.ts` with middleware-enforced origin validation for non-safe methods under `/api/*`.
- In production, state-changing requests without `Origin` are now rejected.
- Production browser/API cross-site POST/PUT/PATCH/DELETE calls from unapproved origins are rejected with 403.
- Added a double-submit CSRF token cookie and `X-CSRF-Token` validation for authenticated non-safe API requests.
- Added `src/lib/csrf.ts` and wired token headers through the auth wrapper, Supabase-shaped data adapter, uploads, cart mutations, and checkout order creation.
- Public unauthenticated POST endpoints remain origin-gated but token-exempt: login, registration, seller registration, order tracking, promotion summaries, and marketing tracking.

## Verification

Ran:

```text
npm run type-check
```

Result: passed.

Command required the local bundled Node runtime because `node`/`npm` are not on the default PowerShell PATH:

```text
C:\Users\OSAMA\Documents\Codex\2026-06-05\chrome-plugin-chrome-openai-bundled-mai\tools\node-v22.11.0-win-x64
```

## Wake Recovery Update (2026-06-15)

Implemented directly from this heartbeat:

- Added request-level hardening in `next.config.mjs`:
  - security headers are now added as global response headers, with HSTS in production.
  - `Content-Security-Policy`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`, and baseline cross-origin controls are now active.
  - `images.remotePatterns` is now allowlist-based (`images.unsplash.com` + configured hosts + app host), no longer `**`.
- Added `src/middleware.ts` to reject non-safe API mutations (`POST`/`PUT`/`PATCH`/`DELETE`) from disallowed origins.

## Resume Update (2026-06-16)

Implemented directly from this heartbeat:

- Added `src/lib/csrf.ts` with shared CSRF cookie/header helpers.
- Updated `src/lib/server/session.ts` to issue and clear a readable `mercato_csrf` cookie alongside the HTTP-only session cookie.
- Updated `src/middleware.ts` to require `X-CSRF-Token` to match `mercato_csrf` whenever a `mercato_session` cookie is present on protected non-safe API routes.
- Updated protected browser request paths to send the token:
  - `src/contexts/AuthContext.tsx`
  - `src/integrations/supabase/client.ts`
  - `src/lib/uploads.ts`
  - `src/contexts/CartContext.tsx`
  - `src/pages/checkout.tsx`
  - `src/pages/admin/users.tsx` (admin user creation)

Current blockers:

- Payment launch still blocked until provider-backed authorization/capture/refund and webhook reconciliation are implemented.
- Live policy verification remains blocked until staging/production-like MySQL credentials are available for cross-role read/write smoke tests.

Resume Update (2026-06-16, Recovery Continuation):

- Added server-side payment-collection hardening in `src/pages/api/orders/index.ts`:
  - Explicitly rejects unsupported payment methods (`card`, `paypal`, etc.) so only `cash_on_delivery`, `bank_transfer`, `jazzcash`, and `easypaisa` can be submitted.
  - Requires manual payment submissions to include at least one of `payment_reference` or `payment_proof_url`, preventing direct API bypass of checkout client-side checks.

Current blockers remain unchanged:

- PCI launch blocker is still active until provider-backed authorization/capture/refund + webhook reconciliation is implemented.
- Live policy verification is still blocked by missing staging/production-like MySQL credentials for cross-role read/write smoke tests.
