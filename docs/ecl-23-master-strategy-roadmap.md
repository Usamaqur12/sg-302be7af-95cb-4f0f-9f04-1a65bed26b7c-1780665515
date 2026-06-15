# ECL-23 Multivendor Marketplace Master Strategy And Execution Roadmap

Date: 2026-06-15
Lead: CEO
Project: Amzn Project / Mercato multivendor marketplace
Workspace: `sg-302be7af-95cb-4f0f-9f04-1a65bed26b7c-1780665515-main`

## Executive Direction

Mercato should launch as a controlled, professional Amazon-style multivendor marketplace with three dependable operating surfaces:

- Customer storefront for discovery, cart, checkout, order tracking, reviews, returns and support.
- Seller center for onboarding, store setup, catalog management, fulfillment, earnings, payouts, support and policy compliance.
- Admin console for marketplace operations, seller/product moderation, orders, payments, payouts, refunds, reviews, support, CMS, settings and reporting.

The current codebase already contains a substantial Next.js Pages Router marketplace with customer, seller and admin routes, MySQL-backed APIs, local development fallback, checkout, seller earnings, returns, support tickets, CMS settings and portal shells. The launch strategy is therefore not a greenfield rebuild. The correct path is to harden the existing marketplace, close money and trust workflow gaps, and verify every role-based workflow end to end.

## Strategic Outcomes

1. Launch a buyer experience that feels complete: browse, search, product detail, cart, checkout, profile, orders, tracking, reviews, returns and support.
2. Launch a seller experience that is operationally useful: registration, approval, store profile, product CRUD, inventory, order fulfillment, earnings, payout requests and seller support.
3. Launch an admin experience that can run the marketplace daily: seller approval, product moderation, order operations, payment verification, payout approval, returns/refunds, support, CMS and settings.
4. Protect the business before scale: authenticated APIs, role boundaries, CSRF strategy, audit logs, immutable finance ledger, upload validation and clear operational policies.
5. Keep launch scope disciplined: use manual payment and payout workflows for MVP unless the board explicitly selects Stripe or another provider before the payment workstream starts.

## Current Platform Baseline

Confirmed from the repository structure and the existing `docs/multivendor-implementation-plan.md` audit:

- Stack: Next.js 15, React 19, TypeScript, Tailwind, shadcn/Radix UI, MySQL, local JSON DB fallback and JWT cookie sessions.
- Customer routes exist for storefront, product catalog/detail, categories, search, cart, checkout, wishlist, orders, order tracking, returns and public CMS pages.
- Seller routes exist for registration/login, dashboard, products, orders, reviews, payouts, finance, earnings, marketing, analytics, account health, store settings, messages and support.
- Admin routes exist for users, sellers, products, categories, orders, returns, payments, payouts, promotions, marketing, reports, CMS, support and settings.
- Database coverage exists for sellers, products, orders, order items, payments, seller earnings, payout requests, returns, support tickets, ticket messages, CMS/settings and audit logs.
- Known launch gaps remain around payment provider/webhook flow, refund/reconciliation workflow, payout settlement rigor, generic API hardening, CSRF controls, first-class disputes, production uploads and integration tests for money/access workflows.

## Phase 1: Launch-Critical Stabilization

Phase 1 is the only work that should block MVP launch. ECL-24 through ECL-33 are the parallel child workstreams for this phase. Each workstream must leave code, tests or a verifiable artifact, not just discussion.

| Workstream | Ownership Intent | Required Output | Launch Gate |
| --- | --- | --- | --- |
| ECL-24 Customer storefront and checkout | Buyer workflow owner | Browse/search/product/cart/checkout/order tracking path verified and defects fixed | A customer can place and track a real order in local and configured DB modes |
| ECL-25 Seller onboarding and store operations | Seller workflow owner | Seller registration, approval gate, store setup and product lifecycle verified | A seller can register, be approved, publish products and manage inventory |
| ECL-26 Seller fulfillment and earnings | Seller operations owner | Seller order queue, fulfillment status, earnings and payout readiness verified | Seller can fulfill orders and see correct earnings by order item |
| ECL-27 Admin marketplace operations | Admin workflow owner | Admin queues for sellers, products, orders, returns, support, CMS/settings verified | Admin can operate all daily queues without direct DB edits |
| ECL-28 Payments, refunds and ledger | Finance owner | Payment confirmation, refund path, settlement ledger and reconciliation model implemented or documented with MVP manual flow | Money states are auditable and cannot silently diverge from orders |
| ECL-29 Payouts and commissions | Finance operations owner | Commission calculation, seller balances, payout requests, holds, approvals and exports hardened | Admin can approve payouts from available balances with audit trail |
| ECL-30 Trust, reviews, returns and disputes | Trust and safety owner | Reviews, return lifecycle, support escalation and dispute policy/workflow completed | Contested orders have a defined operational path |
| ECL-31 Security and access control | Security owner | Role checks, generic data API scope, CSRF strategy, upload policy and sensitive data handling hardened | No known cross-role data mutation path remains |
| ECL-32 Responsive UX and polish | Product/design owner | Mobile and desktop customer/seller/admin surfaces reviewed and repaired | Core workflows are usable on mobile and desktop |
| ECL-33 Release readiness and deployment | Release owner | Environment checklist, seed/admin setup, cPanel/Vercel path, smoke test plan and rollback notes | A non-developer can follow the launch runbook |

## Execution Sequence

1. Stabilize access and workflow foundations first: ECL-31, ECL-24, ECL-25 and ECL-27 should start immediately because every other stream depends on role boundaries and working portals.
2. Stabilize money next: ECL-28 and ECL-29 must converge on one finance state model before payout or refund UI is considered launch-ready.
3. Stabilize operational trust: ECL-26 and ECL-30 must align order fulfillment, returns, disputes and seller/account health consequences.
4. Polish after workflows are real: ECL-32 should fix UX around verified flows rather than styling incomplete screens.
5. Prepare release in parallel but finish last: ECL-33 should maintain the runbook while other streams land changes, then perform the final smoke pass.

## Non-Negotiable Product Decisions

These defaults stand unless the board overrides them in writing:

- MVP payment mode: manual payment verification is acceptable for launch. Stripe/provider integration is a post-MVP upgrade unless selected before ECL-28 implementation.
- MVP payout mode: manual payout approval and export is acceptable for launch. Direct bank transfer automation is post-MVP unless selected before ECL-29 implementation.
- Seller approval: products from unapproved sellers must not be purchasable.
- Product moderation: seller-created products must remain pending until admin approval unless the board explicitly approves auto-publish.
- Finance: seller payouts must use available balances after holds, refunds and commissions, not raw order totals.
- Trust: returns can launch before full disputes only if support escalation records the contested state and admin resolution path.
- Security: cookie-authenticated mutations require a deliberate CSRF mitigation before production launch.

## Verification Standards

Each child workstream should use the smallest proof that covers its risk:

- Buyer workflow: one local smoke path from product discovery to checkout and order tracking.
- Seller workflow: one smoke path from registration/approval to product publication and fulfillment update.
- Admin workflow: queue-level verification for seller approval, product approval, order status, return/refund, support and settings.
- Finance workflow: deterministic checks for commission, seller earnings, payment/refund status and payout balance transitions.
- Security workflow: targeted checks around role-restricted data access and mutation attempts.
- Release workflow: documented environment variables, install/setup commands, smoke tests and rollback steps.

Full build/typecheck should run at release-readiness or when shared contracts change. Individual streams should prefer focused checks unless their changes touch global types, schema or shared API boundaries.

## Phase 2: Post-MVP Scale

After Phase 1 launch readiness:

- Add Stripe or selected provider payment intents, webhooks, refund events and reconciliation dashboards.
- Add payout provider integration with batch status, failed payout recovery and settlement reports.
- Add first-class disputes with evidence, mediation SLA, resolution ledger and seller/customer notifications.
- Add production object storage with signed uploads, MIME validation, image processing and malware/content scanning.
- Add search relevance improvements, merchandising rules, sponsored placement controls and analytics attribution.
- Add automated notification templates for seller approval, order lifecycle, returns, support and payouts.
- Add regression coverage for checkout, seller scoping, payouts, admin moderation and access control.

## CEO Disposition

ECL-23 should remain the master coordination issue while ECL-24 through ECL-33 execute in parallel. This issue is not blocked after the workspace repair. The live continuation path is the active child workstream set plus this roadmap artifact as the coordination contract.

Next CEO heartbeat should review child workstream outputs, resolve cross-stream decisions, and close ECL-23 only after every Phase 1 launch gate is either complete or explicitly deferred by the board.
