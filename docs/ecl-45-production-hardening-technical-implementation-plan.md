# ECL-45 Mercato Production Hardening Technical Implementation Plan

Date: 2026-06-16
Revision: ECL-45-plan-20260616-r1
Owner: Codex Engineer
Status: Pending approval
Scope: Technical implementation plan only. No implementation work is included in this issue.

## Executive Disposition

Mercato is close to a controlled private-beta posture, but it should not be approved for production traffic or real-money card payments until the remaining hardening work is implemented and verified against a production-like MySQL database.

This plan should be approved as the technical baseline for implementation. After approval, create implementation issues in the order below and keep public launch blocked until the release gates pass with evidence.

## Source Evidence Reviewed

- `PROJECT_AUDIT_AND_DEPLOYMENT.md`
- `CPANEL_DEPLOYMENT.md`
- `docs/security-audit-phase-1f.md`
- `docs/ecl-31-production-deployment-operations-plan.md`
- `database/mysql/schema.sql`
- `src/lib/server/session.ts`
- `src/middleware.ts`
- `src/pages/api/data/query.ts`
- `src/pages/api/uploads.ts`
- `src/pages/api/uploads/[...path].ts`
- `src/pages/api/orders/index.ts`
- `src/lib/server/db.ts`
- `src/lib/server/rate-limit.ts`
- `next.config.mjs`

## Current Baseline

Already completed or present:

- HTTP-only signed session cookie with production `AUTH_SECRET` length enforcement.
- Readable double-submit CSRF cookie plus `X-CSRF-Token` validation for authenticated non-safe API methods.
- API origin checks in middleware for state-changing requests.
- Global security headers, including CSP, frame denial, nosniff, referrer policy, permissions policy, cross-origin policy headers, and production HSTS.
- Allowlist-based Next image hosts instead of wildcard remote images.
- Private upload storage for `kyc` and `payment-proof` scopes under `.private/uploads`.
- Authenticated private upload serving under `/api/uploads/...` with owner/staff checks.
- Generic `/api/data/query` table allowlist, public column redaction, role-scoped read policies, and role-scoped mutation policies.
- MySQL-backed checkout uses a transaction, row locks approved products, recalculates totals server-side, decrements stock atomically, creates order items, creates seller earnings, and clears the cart.
- Basic in-process rate limiting is present for auth-sensitive paths, checkout, uploads, and selected APIs.

Remaining production risks:

- Payment flow is not PCI-complete. Stripe packages exist, but checkout still creates pending payment records without provider-backed authorization, capture, webhook reconciliation, or refund workflow.
- Live database policy verification is still missing because production-like MySQL credentials are not available in the workspace.
- Monitoring, audit visibility, backup/restore evidence, and dependency remediation are not yet sufficient for production launch.
- Upload hardening is improved but still local-disk based and needs operational controls for backups, retention, scanning, and disk pressure.
- Rate limiting is in-process only; it does not work reliably across multiple Node processes or restarts.

## Implementation Principles

- Preserve the current Next.js Pages Router, TypeScript, cPanel Node.js, and MySQL/MariaDB architecture.
- Keep Cash on Delivery working as a fallback while adding card-payment capability.
- Never trust client-submitted prices, seller IDs, commission rates, stock, roles, payment status, payout balances, refund amounts, or fulfillment transitions.
- Make database changes idempotent where practical and back up production before schema changes.
- Use server-side MySQL transactions for inventory, order, payment, refund, earning, and payout state changes.
- Keep private KYC/payment documents outside `public/` and serve them only through authenticated API routes.
- Gate launch on evidence, not code presence.

## Workstream 1: Payment Provider Hardening

Objective: make online card payments provider-confirmed and reconcilable without raw card handling.

Implementation:

1. Add a Stripe PaymentIntent creation endpoint for authenticated checkout sessions.
2. Validate cart contents server-side before creating the intent and store an internal pending payment attempt linked to the authenticated customer.
3. Move order finalization for card payments behind Stripe webhook confirmation, using `payment_intent.succeeded`, failure, cancellation, and refund events as the source of truth.
4. Add idempotency keys for order creation and webhook processing.
5. Store provider IDs, payment status history, amount, currency, failure reason, webhook event ID, and reconciliation timestamps.
6. Preserve COD order creation through the existing path, but keep COD status distinct from provider-confirmed paid status.
7. Add admin refund workflow boundaries: requested, approved, provider refund created, refunded, failed.

Acceptance criteria:

- No raw card details are accepted or stored by Mercato.
- Duplicate webhooks cannot create duplicate orders, duplicate payments, or duplicate seller earnings.
- Payment amount and currency must match the server-calculated order total before an order is marked paid.
- Failed or cancelled payment attempts do not decrement stock permanently.
- Refund state is visible to admin and finance users.

Verification:

- Stripe test-mode PaymentIntent success, failure, duplicate webhook, delayed webhook, and refund tests.
- `npm run type-check`
- Targeted API tests or scripted smoke tests for checkout and webhook idempotency.

## Workstream 2: Live Role and Data Policy Verification

Objective: prove that real MySQL data cannot be read or mutated across account boundaries.

Implementation:

1. Create a production-like test data pack with one admin, one manager, one warehouse user, two customers, and two approved sellers.
2. Add a role-policy smoke script or documented API runbook that exercises the current `/api/data/query`, private upload, cart, order, seller, and admin paths.
3. Add test cases for positive access, cross-account denial, public redaction, and private document denial.
4. Record results as launch evidence without exposing secrets or private document contents.

Required checks:

- Anonymous public catalog read succeeds with redacted seller and product fields.
- Customer can read own profile, cart, addresses, orders, order items, payments, returns, wishlist, and support tickets.
- Customer cannot read another customer order, payment, return, address, wishlist, cart, profile, or support ticket.
- Seller can read own seller profile, products, product images, order items, earnings, withdrawals, campaigns, promotions, and seller-scoped orders.
- Seller cannot read another seller's financial, order, product-image, campaign, promotion, or KYC data.
- Staff access is limited by role, with warehouse mutation restrictions preserved.
- Private KYC/payment-proof URLs deny anonymous users and unrelated accounts.
- Admin and permitted staff can access required operational records.

Acceptance criteria:

- All P0 cross-account read/write checks pass against production-like MySQL.
- Any failed check becomes a child defect issue and blocks production launch.

Verification:

- Role-policy smoke evidence attached to the launch tracker.
- `npm run type-check`

## Workstream 3: Upload Storage Operations Hardening

Objective: make upload handling safe enough for product media and private seller/customer documents in cPanel production.

Implementation:

1. Keep public media and private documents in separate roots.
2. Add explicit file retention and deletion rules for replaced seller logos, product images, KYC updates, payment proofs, and account deletion workflows.
3. Add upload metadata records for owner, scope, MIME type, size, storage path, original name, created time, and optional review status.
4. Add admin visibility for private-document review without revealing storage paths in browser-accessible table responses.
5. Add operational monitoring for upload disk usage and backup coverage.
6. Add file signature checks for supported MIME types. Treat extension and `data:` MIME alone as insufficient.
7. Define a malware scanning hook. If cPanel cannot support scanning, require manual review and keep public launch blocked for broad seller self-service uploads.

Acceptance criteria:

- Private files are never stored under `public/`.
- Private file URLs are short-lived or permission-checked on every request.
- Upload metadata supports audit and cleanup.
- Oversized, unsupported, malformed, and mislabeled files are rejected.
- Operations can back up and restore uploads independently from application builds.

Verification:

- Upload smoke tests for product image, seller logo, KYC PDF/image, payment proof, unauthorized fetch, and replaced-file cleanup.
- Disk usage and backup path documented in the deployment runbook.

## Workstream 4: Rate Limiting and Abuse Controls

Objective: replace best-effort process-local throttles with production controls that survive app restarts and multiple workers.

Implementation:

1. Introduce a shared rate-limit store appropriate for the deployment. Prefer MySQL-backed counters for cPanel MVP unless Redis or a managed edge limiter is available.
2. Apply route-specific thresholds to login, register, password reset, seller registration, checkout, upload, support ticket creation, marketing tracking, and generic data mutations.
3. Add account-level throttles for login and checkout in addition to IP throttles.
4. Add audit events for repeated blocked attempts on auth, uploads, checkout, and admin-sensitive mutation paths.
5. Preserve friendly error responses without leaking whether an email/account exists.

Acceptance criteria:

- Rate limits work after Node process restart.
- Limits cannot be bypassed by opening concurrent Node workers on the same host.
- High-risk endpoints have explicit thresholds and retry windows.
- Admins can see or export abuse/audit events relevant to launch operations.

Verification:

- Scripted rate-limit smoke tests across auth, checkout, upload, and support routes.
- Restart test proving counters persist as designed.

## Workstream 5: Observability, Audit, Backup, and Restore Evidence

Objective: make production failures visible and recovery evidence-backed.

Implementation:

1. Add structured server logging for auth failures, checkout failures, payment webhook outcomes, upload failures, private file access denial, and database connectivity errors.
2. Add a minimal admin/ops health endpoint or runbook for checking app, database, and build version without exposing secrets.
3. Ensure admin mutations and payment/refund/withdrawal state changes are audit logged with actor, target, action, previous state, next state, and timestamp.
4. Configure uptime monitoring, 5xx alerting, DB connectivity alerting, disk usage alerting, backup failure alerting, and checkout failure alerting.
5. Rehearse MySQL restore into staging or a temporary database.
6. Rehearse upload restore when upload hardening is implemented.

Acceptance criteria:

- A production operator can identify whether checkout, auth, DB, upload, email, or payment provider is failing.
- Restore rehearsal has timestamp, operator, backup source, duration, and smoke result.
- Launch tracker has evidence for monitoring screenshots or provider configuration.

Verification:

- Production-like smoke after restore.
- Alert test or documented dry run.

## Workstream 6: Dependency and Build Gate Remediation

Objective: eliminate known high-risk dependency and build issues before real traffic.

Implementation:

1. Run `npm audit --omit=dev` and `npm audit` with current lockfile.
2. Triage advisories into runtime blocker, dev-only acceptable risk, patched by upgrade, or accepted with owner/date.
3. Upgrade vulnerable runtime packages where compatible with Next.js 15 and React 19.
4. Remove remaining launch-relevant ESLint warnings where they affect security, data flow, or hooks around checkout/auth/admin operations.
5. Keep a reproducible build path for cPanel Node.js 20 or 22.

Acceptance criteria:

- No untriaged high or critical runtime advisories remain.
- `npm run type-check`, `npm run lint`, and `npm run build` pass in a production-like environment.
- Any accepted dependency risk has owner, rationale, expiry date, and mitigation.

Verification:

- Command output attached to launch evidence.
- Dependency risk register updated.

## Workstream 7: Transactional Email and Support Continuity

Objective: avoid silent operational failures for buyer, seller, payout, refund, and support workflows.

Implementation:

1. Configure Resend sender domain and production keys outside source control.
2. Add durable email send logging for order confirmation, seller approval/rejection, payout status, refund status, password reset, and support updates.
3. Add retry or manual resend workflow for failed transactional emails.
4. Ensure email failures do not corrupt database transactions or mark business actions complete incorrectly.

Acceptance criteria:

- Email send failures are visible to operations.
- A failed email can be retried or handled manually.
- Order/payment/refund truth remains in the database, not email delivery state.

Verification:

- Resend sandbox or production-domain test sends.
- Failure-path test with email provider disabled.

## Proposed Implementation Sequence

1. Payment provider hardening and webhook idempotency.
2. Live role/data policy verification.
3. Upload operations hardening.
4. Shared rate limiting and abuse audit events.
5. Observability, audit expansion, backup and restore evidence.
6. Dependency and build gate remediation.
7. Transactional email reliability.

Rationale: money movement and access control carry the highest launch risk. Uploads, abuse controls, and observability come next because they affect data exposure and incident response. Dependency and email work can run in parallel after payment/access requirements are stable.

## Child Issues To Create After Approval

Create these only after plan approval:

1. Implement Stripe PaymentIntent, webhook confirmation, idempotency, and refund state machine.
2. Build and run production-like role/data policy smoke verification.
3. Harden upload metadata, retention, MIME signature validation, and restore coverage.
4. Replace in-process rate limiting with shared production counters and abuse audit events.
5. Add production observability, health checks, audit expansion, backup and restore evidence.
6. Triage and remediate dependency advisories and launch-relevant lint/build warnings.
7. Configure transactional email reliability, logging, and retry/manual recovery.

## Launch Gates

Production/private-beta implementation is not complete until:

- Payment, access-control, upload, rate-limit, monitoring, backup/restore, dependency, and email acceptance criteria above pass.
- `npm run type-check`, `npm run lint`, and `npm run build` pass with production-like environment variables.
- Role-policy smoke tests pass against production-like MySQL.
- Payment webhook duplicate and failure-path tests pass.
- Backup and restore rehearsal evidence is attached.
- No Critical or High launch blocker remains in checkout, auth, role access, payment, private documents, order creation, seller earnings, payout/refund handling, database connectivity, or admin moderation.

## Approval Request

Approve revision `ECL-45-plan-20260616-r1` as the technical implementation baseline for Mercato production hardening. Approval authorizes creation of the child implementation issues listed above. It does not authorize public launch; launch remains gated by the acceptance criteria and evidence in this plan.
