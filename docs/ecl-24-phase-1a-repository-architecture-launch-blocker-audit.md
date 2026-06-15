# ECL-24 Phase 1A Repository Architecture And Launch Blocker Audit

Audited: 2026-06-15

## Executive Summary

This repository is a Next.js Pages Router marketplace application using TypeScript, Tailwind CSS, shadcn/ui, a Supabase-compatible client shim, and a cPanel MySQL/MariaDB backend. The original project brief references Supabase/PostgreSQL/RLS, but the current codebase has already migrated core runtime behavior to MySQL through API routes and `src/pages/api/data/query.ts`.

The app is not launch-ready. The customer storefront, seller workspace, admin console, authentication, cart, order creation, seller registration, uploads, local dev database fallback, and MySQL schema are present. However, Phase 1A has first-class launch blockers around generic data read authorization, sensitive file storage, payment finality, production database verification, and unavailable local toolchain verification in this heartbeat.

## Architecture Observed

- Frontend: Next.js 15 Pages Router, React 18, TypeScript, Tailwind CSS, shadcn/ui components.
- Portals: customer storefront under `src/pages`, seller workspace under `src/pages/seller`, admin console under `src/pages/admin`.
- Auth/session: custom HTTP-only JWT cookie in `src/lib/server/session.ts`; roles are `customer`, `seller`, `admin`, `manager`, and `warehouse`.
- Database runtime: cPanel MySQL/MariaDB via `mysql2/promise` in `src/lib/server/db.ts`.
- Local development fallback: JSON-backed local database in `.localdb/marketplace.json` through `src/lib/server/local-db.ts` when production DB env is not configured.
- Supabase compatibility layer: `src/integrations/supabase/client.ts` maps Supabase-style calls to `POST /api/data/query`.
- Generic data API: `src/pages/api/data/query.ts` validates table names, builds parameterized SQL, applies role-based mutation checks, and handles local fallback.
- Commerce flow: cart and order APIs re-price products server-side, check stock, decrement inventory in transactions, create order items, payments, and seller earnings.
- Deployment target: README and existing audit docs describe cPanel Node.js hosting with MySQL/MariaDB, not static-only hosting.

## Launch Blockers

| ID | Severity | Area | Evidence | Risk | Required fix |
| --- | --- | --- | --- | --- | --- |
| ECL24-BL-001 | Critical | Data authorization | `src/pages/api/data/query.ts:1165-1183` allows any authenticated role to run broad `select` queries after special cases. | Customers or sellers may read orders, payments, profiles, payout data, support tickets, or other private tables by calling the generic query API directly. | Replace the catch-all authenticated select allowance with table-by-table read policies for customer, seller, manager, warehouse, admin, and public scopes. |
| ECL24-BL-002 | Critical | Sensitive uploads | `src/pages/api/uploads.ts:96-117` accepts KYC PDFs/images, writes them under `public/uploads`, and returns public URLs. | Seller KYC documents, payment proof, and potentially other private documents are publicly addressable. | Split public media from private documents; store KYC/payment/support evidence outside `public`, serve through authorized API routes, add virus scanning and retention controls. |
| ECL24-BL-003 | High | Payments | `src/pages/api/orders/index.ts` inserts payments with status `pending` and accepts `payment_method`, `payment_reference`, and `payment_proof_url`; existing deployment doc says Cash on Delivery only and Stripe is not implemented. | No online payment finality, webhook verification, refund path, or anti-fraud controls for paid launch. | Implement Stripe/approved PSP PaymentIntent creation, webhook-confirmed status transitions, idempotency, refund records, and keep COD as fallback. |
| ECL24-BL-004 | High | Production database verification | `src/lib/server/db.ts` requires `DB_HOST`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`; prior audit notes live cPanel credentials were unavailable. | Build can compile locally while real schema, permissions, seed admin, migrations, and transactions fail in production. | Provision cPanel DB credentials, run `npm run db:install`, `npm run setup:admin`, and execute live smoke tests for auth, checkout, seller approval, and admin moderation. |
| ECL24-BL-005 | High | Verification tooling | This heartbeat's shell has no `npm`, `node`, or `git` on PATH. | Typecheck/build/source-control verification could not be rerun from this environment, so launch cannot rely on this audit alone. | Restore Node/npm/git in the execution PATH or run verification in CI/cPanel shell; capture `npm run type-check`, `npm run lint`, and `npm run build` logs. |
| ECL24-BL-006 | Medium | Project architecture drift | Issue asks for Supabase/PostgreSQL/RLS, while repository now routes to cPanel MySQL and a Supabase-compatible shim. | Planning and security recommendations may target the wrong persistence/security model. | Confirm the canonical backend strategy. If MySQL remains canonical, update project scope language and stop referring to Supabase RLS as a launch requirement. |

## Important Non-Blocking Risks

- `RoleGuard` and `ProtectedRoute` protect UI rendering but are not security controls by themselves. Server APIs must remain the source of truth.
- Generic SQL builder code validates identifiers and parameterizes values, which reduces injection risk, but authorization is still too broad on reads.
- Seller/product/order mutation paths contain ownership checks, but read policy must be equally strict.
- Payout release logic is coupled to generic query reads and order updates. It should eventually move to an explicit admin/worker job to avoid side effects during reads.
- Upload validation checks MIME type declared in data URLs, but it does not inspect file magic bytes or scan content.
- There is no CI/CD workflow visible in this checkout. Launch readiness should not depend on manual local commands.

## Correct Implementation Sequence

1. Lock the backend strategy: either commit to cPanel MySQL/MariaDB as current code indicates, or deliberately revert/rebuild for Supabase/PostgreSQL/RLS. Do not mix launch requirements across both models.
2. Harden `POST /api/data/query` read authorization table by table before expanding features.
3. Move KYC/payment/support private files out of `public/uploads`; add authorized download APIs, malware scanning, retention, and audit logs.
4. Verify production database setup against real cPanel MySQL credentials, including schema install, admin bootstrap, and role/session smoke tests.
5. Implement payment finality: PaymentIntent creation, webhook-confirmed payments, idempotency keys, order status transitions, refunds, and payout eligibility rules.
6. Add CI verification for install, typecheck, lint, build, migration check, and selected API smoke tests.
7. Complete operational workflows: seller approval, product moderation, fulfillment status, returns/refunds, support ticket ownership, payout approval, and admin audit trails.
8. Only then run full route smoke testing across customer, seller, and admin portals on production-like infrastructure.

## Immediate Implementation Tasks

- Create a security hardening issue for scoped read policies in `src/pages/api/data/query.ts`.
- Create a private upload/storage issue for KYC, payment proof, support evidence, virus scanning, and authorized retrieval.
- Create a payment integration issue for Stripe or the selected payment service provider.
- Create a production verification issue for cPanel database provisioning, admin bootstrap, and smoke-test evidence.
- Create a CI/toolchain issue to restore deterministic `npm run type-check`, `npm run lint`, and `npm run build` verification.
- Create a product decision issue to reconcile Supabase/PostgreSQL/RLS language with the current MySQL implementation.

## Verification Performed

- Inspected repository structure, package scripts, README, existing audit notes, database schema references, auth/session code, MySQL pool setup, generic data API, uploads API, cart API, order API, admin user API, and seller registration API.
- Attempted `npm run type-check` and `npm run build`; both could not start because `npm` is not available on PATH in this execution shell.
- Checked command availability for `node`, `npm`, `npx`, and `git`; none were available through `Get-Command`.

## Final Disposition

Audit deliverable is complete. The marketplace itself remains blocked for launch until the blockers above are resolved, but ECL-24's requested architecture and launch blocker audit is complete.
