# Multivendor Marketplace Audit And Implementation Plan

Date: 2026-06-15
Issue: ECL-3
Scope: planning-only technical audit and MVP implementation plan.

Revision ECL-3-plan-20260615-r2, 2026-06-15: revalidated this plan against the actual Softgen marketplace project root containing `.git` metadata and the root `package.json`. The earlier workspace validation blocker is stale; this audit reflects the real Next.js/MySQL multivendor codebase, not the Paperclip setup folder. This revision also verifies the schema/API findings against `database/mysql/schema.sql`, `database/mysql/upgrade-20260608-workflows.sql`, `src/pages/api/data/query.ts`, `src/pages/api/orders/index.ts` and `src/lib/server/session.ts`.

## Current Structure

The repository is a Next.js Pages Router marketplace named Mercato. It contains three main user surfaces:

- Customer storefront: homepage, product catalog, product detail, category browsing, search, cart, checkout, wishlist, account orders, order tracking, returns, public CMS pages, help and policy pages.
- Seller center: seller landing, registration, login, pending approval, dashboard, products, orders, reviews, payouts, finance, earnings, marketing, analytics, assortment growth, account health, store settings, messages, support and learning pages.
- Admin console: dashboard, login, users, sellers/vendors, seller-center controls, products, categories, orders, returns, payments, payouts, promotions, marketing, reports, CMS, support and settings.

Important implementation areas:

- `src/pages`: all customer, seller, admin and API routes.
- `src/components`: portal shells, layouts, product/review/cart components and shadcn-style UI primitives.
- `src/contexts`: auth, cart, marketplace settings and theme providers.
- `src/integrations/supabase`: a Supabase-shaped client facade that actually calls internal MySQL-backed APIs.
- `src/lib/server`: MySQL connection, session handling, rate limiting and JSON local database fallback.
- `src/services`: older Supabase-style service abstractions for auth, products, orders, cart and vendors.
- `database/mysql/schema.sql`: production MySQL schema and seed data.
- `database/mysql/upgrade-20260608-workflows.sql`: workflow upgrade tables/columns.
- `scripts/install-mysql.mjs` and `scripts/setup-admin.mjs`: deployment/setup helpers.

## Tech Stack Detected

- Next.js 15 with Pages Router, React 19 and TypeScript.
- Tailwind CSS with shadcn/Radix UI primitives and lucide-react icons.
- MySQL via `mysql2/promise` for production, targeting cPanel Node.js hosting.
- Local development fallback stored in `.localdb/marketplace.json`.
- JWT cookie sessions with `jose` and `cookie`.
- Cookie-authenticated APIs currently use `SameSite=Lax` sessions; explicit CSRF protection is not present in the verified request handlers.
- Validation with `zod`.
- Password hashing with `bcryptjs`.
- Optional integrations already referenced: Resend email, Stripe packages, PostHog analytics.
- A Supabase-compatible client interface remains in the codebase, but current data calls route through `/api/data/query` and first-party Next API endpoints.

## Existing Features

- Role-based auth for customer, seller, admin, manager and warehouse roles.
- Local demo accounts and local DB fallback.
- Seller registration and approval-gated seller/product workflow.
- Product catalog, categories, images, variants, stock, featured/deal flags and moderation status.
- Cart and checkout APIs with stock checks, seller holiday-mode checks, promotion summary calculation, order item creation and seller earning records.
- Customer wishlist, order history and order tracking.
- Reviews with verified-purchase support in the schema.
- Seller dashboards for products, orders, reviews, payouts/finance, marketing, analytics, account health, store controls and support.
- Admin dashboards for users, sellers, products, categories, orders, returns, payments, payouts, marketing, promotions, support, CMS and settings.
- Payout hold/release logic for delivered orders.
- Return request, support ticket, promotion request, marketing campaign and ad event tables.
- Admin audit logging for mutation activity.
- Staff role restrictions for manager and warehouse portals.
- CMS-controlled public pages, homepage text, footer links and marketplace settings.
- Deployment path for cPanel MySQL and Node startup via `server.cjs`.
- Checkout order creation is transactional and performs product/seller approval checks, holiday-mode checks, stock decrement, promotion calculation, order item creation, payment row creation and seller earning row creation.

## Missing Or Incomplete Features

- Disputes are represented indirectly through returns and support tickets, but there is no first-class dispute entity, lifecycle, evidence model, mediation workflow or resolution ledger.
- Payment processing is mostly pending/manual. Stripe packages exist in `package.json`, but no complete payment intent, provider webhook, refund or reconciliation workflow is visible.
- Payout processing lacks bank-transfer integration, payout batch export, payout failure handling and settlement ledger reconciliation.
- The generic `/api/data/query` endpoint is powerful and must be hardened further before production scale: table-level access exists, but select scope is broad for authenticated users.
- Cookie-authenticated mutations need a clear CSRF strategy before production because the verified session layer uses a browser cookie and the generic data endpoint accepts state-changing operations.
- Service layer naming is confusing: `supabase` imports are compatibility shims over MySQL APIs, while `src/services` still reads like real Supabase usage.
- Order fulfillment is functional but needs shipment carrier, tracking event, cancellation, split shipment and seller-specific order-status modeling.
- Inventory needs reservation/expiry rules, low-stock workflows, variant-level checkout and restock audit history.
- Reviews need moderation, seller response, review media, abuse reports and stronger verified-purchase enforcement in the API layer.
- Vendor onboarding has KYC fields, but lacks a full review queue, document verification state machine, rejection templates and resubmission workflow.
- Admin reports are likely UI-first; production analytics should use aggregate queries or materialized summary tables instead of broad client-side scans.
- File uploads are URL-field ready, but production storage needs a concrete provider, signed upload policy, image validation and malware/content checks.
- Email workflows are optional and incomplete for password reset, seller approval, order lifecycle, returns, support and payout notifications.
- Automated tests are not apparent in the file listing; critical workflows need integration coverage.

## MVP Architecture Recommendation

Keep the current Next.js + MySQL architecture for MVP rather than introducing a new backend. It is already aligned with cPanel deployment and has enough foundations for a marketplace launch. The main architectural work should be to make the existing boundaries explicit:

- Use first-party API routes as the canonical backend boundary for sensitive workflows: auth, seller onboarding, product moderation, cart, checkout, orders, payouts, disputes, uploads and admin actions.
- Keep `/api/data/query` only as an internal compatibility/query API, and progressively reduce use from high-risk mutations.
- Rename or wrap the `supabase` compatibility client behind a marketplace data client to remove false coupling to Supabase.
- Keep MySQL as the source of truth. Treat `.localdb/marketplace.json` as a development/demo adapter only.
- Add transactional service modules for each domain: identity, vendor onboarding, catalog, cart, order, payment, payout, review, dispute, support and admin audit.
- Add domain-level authorization checks in API handlers/services, not only in UI guards.
- Add a migration discipline: versioned SQL migrations, seed scripts and deployment checklist for schema changes.
- Treat manual payments and manual payouts as the default MVP path unless CEO/product explicitly selects Stripe or another provider for launch. Provider integration should sit behind the same ledger and payment-event model, not replace it.

Recommended MVP phases:

1. Stabilize core commerce: auth, catalog, cart, checkout, order creation, admin product approval and seller order fulfillment.
2. Stabilize money movement: payment confirmation, order settlement, commission, seller earnings, payout request and admin payout approval.
3. Stabilize trust operations: KYC, reviews, returns/disputes, support tickets, moderation and audit logs.
4. Stabilize operations: dashboards, reports, notifications, uploads, backups, monitoring and deployment runbooks.

## Database And Entity Model

The existing schema already covers most MVP entities. Recommended model:

- Users: `profiles`
  - Roles: customer, seller, admin, manager, warehouse.
  - Add or verify: email verification flow, password reset fields, KYC status if buyer KYC remains required, account suspension reason.

- Vendors: `seller_profiles`
  - Current fields cover business info, owner/KYC docs, bank info, approval status, commission rate, balances, rating, holiday mode, order volume limit and account health.
  - Add: KYC review status/history table, document verification table, seller policy acknowledgement, risk flags and payout method tokenization if not storing raw bank details.

- Products: `products`, `product_images`, `product_variants`, `categories`
  - Current fields cover category, seller, price, inventory, approval status, metadata, images and variants.
  - Add: product moderation history, variant-level inventory in checkout, brand/category compliance fields, stock movement ledger.

- Orders: `orders`, `order_items`, `payments`
  - Current fields cover customer, status, totals, shipping address, item seller split, commission and payment record.
  - Add: order status history, seller-specific fulfillment status if one order can contain multiple sellers, payment transaction events, refunds and shipment tracking events.

- Payouts: `seller_earnings`, `withdrawal_requests`
  - Current fields cover pending earnings, release timing, available balance and withdrawal requests.
  - Add: immutable ledger table for all money movements, payout batches, payout provider references, failure/retry status and admin approval notes.

- Reviews: `reviews`
  - Current fields cover product, user, order, rating, title/comment and verified purchase.
  - Add: moderation status, media attachments, seller response, abuse reports and edit history.

- Disputes: new first-class tables recommended
  - `disputes`: id, dispute_number, order_id, order_item_id nullable, customer_id, seller_id, type, status, opened_by, reason, requested_resolution, resolution, refund_amount, assigned_to, due_at, resolved_at, created_at, updated_at.
  - `dispute_messages`: id, dispute_id, user_id, message, is_internal, created_at.
  - `dispute_evidence`: id, dispute_id, user_id, file_url, evidence_type, notes, created_at.
  - `dispute_events`: id, dispute_id, actor_id, action, metadata, created_at.
  - Keep `return_requests` for simple returns, but escalate contested cases into `disputes`.

## Dashboard Plan

### Buyer Dashboard

- Account overview: profile, default address, recent orders, wishlist, support tickets and returns/disputes.
- Order detail: payment state, shipment timeline, item-level seller info, return/dispute actions and review prompt after delivery.
- Trust workflows: upload payment proof where manual payments are used, create support ticket, create return request, open dispute if return/refund is contested.

### Vendor Dashboard

- Home: sales, order count, pending tasks, available balance, account health, notices and quick actions.
- Products: create/edit products, images, variants, inventory, product approval state and rejection fixes.
- Orders: seller-scoped order items, fulfillment status, shipping/tracking, cancellation constraints and buyer notes.
- Finance: earnings, hold periods, available balance, withdrawal requests, payout history, commission breakdown and tax/export views.
- Marketing: campaign requests, sponsored products, promotions, budget, performance and admin approval status.
- Reputation: reviews, ratings, response workflow, disputes, returns, support and account health policy items.
- Store: logo/banner/profile, holiday mode, pickup/return address, seller settings and module visibility.

### Admin Dashboard

- Operations overview: pending sellers, pending products, pending payouts, pending returns/disputes, revenue, orders and support load.
- Seller management: approval, suspension, KYC review, commission override, account health, holiday/order limits and notes.
- Catalog moderation: category management, product approvals/rejections, featured/deal controls and compliance audit.
- Order operations: all orders, status changes, payment verification, shipment oversight, cancellations, refunds and split seller views.
- Finance: payments, seller earnings, payout holds, withdrawal approval, payout batches, ledger reconciliation and exports.
- Trust and safety: reviews moderation, disputes, return workflows, support tickets and audit log review.
- CMS/settings: public pages, homepage/footer content, currency/tax/shipping settings, email templates and marketplace policy settings.

## Prioritized Implementation Tasks

P0: Planning and architecture cleanup

- Confirm CEO roadmap priorities: launch market, payment method, fulfillment model, seller onboarding rules and required compliance fields.
- Freeze MVP workflow definitions for buyer checkout, seller approval, product approval, order fulfillment, payouts, returns and disputes.
- Document the MySQL schema as the canonical model and identify required migrations.
- Decide whether to keep the Supabase-shaped compatibility client name or rename it to reduce developer confusion.
- CEO/product approval needed for this revision: `ECL-3-plan-20260615-r2`.

P1: Core security and backend hardening

- Tighten `/api/data/query` select authorization so customers, sellers, managers and warehouse users can only read scoped data.
- Move high-risk mutations from generic query calls into explicit domain APIs.
- Add CSRF strategy for cookie-authenticated mutations.
- Add audit log coverage for admin/staff actions and sensitive seller/customer actions.
- Add integration tests for auth role access, seller scoping, cart checkout and admin approval workflows.

P2: Core commerce completion

- Verify product creation/editing uses leaf categories, image validation, variants and seller ownership consistently.
- Complete buyer checkout UX around payment method, payment proof, stock errors and order confirmation.
- Add order status history and seller-scoped order views for multi-seller orders.
- Add inventory reservation or clear stock decrement rules for payment-pending orders.

P3: Money movement

- Implement payment confirmation path: manual admin verification first, then Stripe/payment-provider integration if required by roadmap.
- Add ledger entries for order payment, commission, seller earning, release, withdrawal and payout.
- Improve payout request approval/completion flow with balances, payout batch export and failure handling.
- Add finance reports for admin and seller reconciliation.

P4: Trust operations

- Add first-class dispute tables and APIs.
- Extend returns into a full lifecycle: requested, approved, shipped/received, refunded/rejected, escalated.
- Add review moderation, seller responses and abuse reports.
- Add KYC document review states and seller resubmission workflow.

P5: Production readiness

- Configure production upload storage with signed uploads and validation.
- Complete email workflows for registration, seller approval/rejection, order updates, returns/disputes, support and payouts.
- Add observability: structured logs, error reporting, uptime checks, slow query logging and backup verification.
- Add deployment runbooks for cPanel: env vars, migrations, admin bootstrap, rollback and backup restore.

## Risks And Dependencies

- Roadmap dependency: payment method, fulfillment responsibilities, dispute policy and seller compliance rules must be confirmed by CEO/product before final implementation.
- Security risk: the generic data API can become a broad access surface unless read/write scoping is tightened and high-risk workflows move to explicit APIs.
- Financial risk: seller balances and payouts need an immutable ledger before real money movement.
- Operational risk: manual payment proof and manual payouts can work for MVP, but require clear admin queues and audit trails.
- Data integrity risk: multi-seller orders need item-level fulfillment, refunds, disputes and payout implications.
- Naming risk: Supabase-compatible code over MySQL can mislead future contributors and cause incorrect implementation assumptions.
- Storage dependency: production uploads need a selected provider and file validation policy.
- Compliance dependency: KYC, bank account handling, refunds, privacy and tax requirements depend on launch geography and business policy.
- Testing risk: without integration tests around checkout, seller scoping and payouts, regressions could affect money and access control.

## Recommended Final Disposition

Planning deliverable is complete at revision `ECL-3-plan-20260615-r2`. Recommended next step is CEO/product approval of MVP workflow priorities, followed by child implementation issues for security hardening, commerce completion, money movement, disputes/trust workflows and production readiness.
