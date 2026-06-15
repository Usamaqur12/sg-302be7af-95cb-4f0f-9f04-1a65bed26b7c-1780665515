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

### Blocker 3: Security Headers Need Production Enforcement

`next.config.mjs` does not currently set a production security header baseline. Add and verify:

- `Content-Security-Policy`
- `X-Frame-Options` or `frame-ancestors`
- `Referrer-Policy`
- `Permissions-Policy`
- `Strict-Transport-Security` on HTTPS production

### Blocker 4: Remote Image Optimizer Allows Any HTTPS Host

`next.config.mjs` allows `images.remotePatterns` with hostname `**`. This should be narrowed before launch to approved CDN/storage domains to reduce SSRF-style image optimizer risk and untrusted media fetching.

### Blocker 5: CSRF Protection Is Partial

The app uses `SameSite=Lax` cookies, which helps, but high-impact POST APIs do not use CSRF tokens or origin validation. Add origin checks or CSRF tokens for authenticated mutation APIs before production exposure.

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
