# Amzn Phase 1B Product Requirements Gap Map

Date: 2026-06-15
Owner: Product Manager
Issue: ECL-25
Scope: Customer, seller, and admin capability gap map against the current Amzn Project codebase.

## Executive Summary

The platform is beyond a blank MVP. It already has a Next.js Pages Router marketplace with customer storefront, seller center, admin console, MySQL-backed local API facade, Tailwind/shadcn UI, role-based dashboards, product approval, seller approval, cart, checkout, order creation, returns, payments, payouts, support tickets, marketing, reports, and CMS surfaces.

The main Phase 1B gap is not page coverage. The main gap is launch-grade marketplace behavior: first-class dispute handling, real payment/refund provider integration, payout settlement, seller-level order lifecycle, inventory reservation, hardened data access, production security controls, and operating policies wired into enforceable workflows.

Recommendation: treat the current codebase as a strong internal beta foundation, but do not launch publicly until the P0 blockers below are resolved.

## Source Of Truth Reviewed

- Customer routes in `src/pages`: storefront, products, categories, search, cart, checkout, orders, returns, support/help, public policy pages.
- Seller routes in `src/pages/seller`: onboarding, dashboard, products, orders, earnings/payouts, store, marketing, analytics, account health, support, settings.
- Admin routes in `src/pages/admin`: dashboard, sellers/vendors, products, categories, orders, returns, payments, payouts, reports, CMS, support, settings.
- Data and workflow schema in `database/mysql/schema.sql` and `database/mysql/upgrade-20260608-workflows.sql`.
- Order creation and checkout behavior in `src/pages/api/orders/index.ts` and local fallback parity in `src/lib/server/local-db.ts`.
- Seller-center navigation and workflow modules in `src/lib/seller-center.ts` and `src/components/SellerCenterModulePage.tsx`.
- Existing technical audit in `docs/multivendor-implementation-plan.md`.

## Current Capability Coverage

### Customer

| Area | Current State | Gap Level | Product Finding |
| --- | --- | --- | --- |
| Browse and categories | Present via homepage, categories, products, deals, new arrivals, seller pages, category routes, and category schema. | Partial | Need stronger category attributes, facet consistency, no-results guidance, and launch category governance. |
| Search and filtering | Present via search and product catalog utilities. | Partial | Needs relevance tuning, synonym handling, indexed attribute filters, seller rating/delivery filters, and analytics. |
| Product detail page | Present with product data, images, seller references, reviews, cart entry. | Partial | Needs clearer third-party seller disclosure, delivery promise, return eligibility, seller reliability signals, and unavailable variant enforcement. |
| Cart | Present with cart context, cart API behavior, stock-aware add/update logic. | Partial | Needs explicit multi-seller grouping and shipping clarity in cart UI. |
| Checkout | Present. Order API validates approved products/sellers, stock, seller holiday mode, promotions, stock decrement, payment row, seller earnings row. | Partial | Payment is manual/pending; checkout should not be considered launch-ready until provider authorization/capture and failure handling are integrated. |
| Orders and tracking | Present via account orders, order detail, and public tracking. | Partial | Status model exists but is too coarse for seller-level fulfillment, carrier events, cancellation windows, and split shipments. |
| Reviews | Present in schema/components with verified-purchase support. | Partial | Needs stronger post-purchase gating, moderation tools, seller response workflow, and review abuse controls. |
| Returns/support | Present via returns page, return request schema/admin returns, support tickets. | Partial | Returns exist; disputes are not first-class. Buyer protection needs evidence, mediation, decision, appeal, and refund ledger workflow. |

### Seller

| Area | Current State | Gap Level | Product Finding |
| --- | --- | --- | --- |
| Seller registration/store | Present with seller registration, approval states, pending approval, store/settings pages, seller profile schema. | Partial | Needs complete KYC/compliance checklist, admin request-info loop, document review states, and policy acceptance versioning. |
| Listing management | Present with seller product pages, product schema, admin moderation, product approval states. | Partial | Needs material edit review rules, rejection reason visibility, variant-level completeness, compliance attributes, and bulk import roadmap. |
| Inventory | Present as product/variant stock and stock decrement on checkout. | Partial | Needs reservation/expiry rules, low-stock alerts, restock audit, variant-level checkout parity, and oversell prevention under concurrency. |
| Seller orders | Present with seller order list and status/tracking update controls. | Partial | Needs seller-owned suborders or seller-level order status rather than a single shared order status for all sellers in mixed carts. |
| Fulfillment | Present through processing/shipped/delivered statuses and tracking field. | Partial | Needs carrier/service selection, tracking event history, SLA timers, overdue escalation, split shipment support, cancellation rules, and buyer notification events. |
| Earnings | Present through seller earnings rows and dashboard values. | Partial | Needs reconciliation across refunds, holds, disputes, chargebacks, commissions, payout batches, and admin adjustments. |
| Payouts | Present with withdrawal requests and admin payouts. | Partial | Needs payout provider/bank transfer integration, failure handling, reserve/hold policy, downloadable statements, and settlement audit trail. |
| Seller support/account health | Present with support, messages alias, account health, non-compliance points, order volume limit. | Partial | Needs automated risk triggers, policy violation case types, seller appeal workflow, and enforcement history. |

### Admin

| Area | Current State | Gap Level | Product Finding |
| --- | --- | --- | --- |
| Seller management | Present with approve/reject/suspend/reinstate flows. | Partial | Needs request-info workflow, KYC/document review, reason-required admin actions, and seller risk notes/history. |
| Product/category management | Present with product/category admin pages and product statuses. | Partial | Needs category-required attributes, prohibited item checks, material edit review, and moderation queue SLA. |
| Order management | Present with status updates and tracking edits. | Partial | Needs seller-specific fulfillment visibility, cancellation/refund authority model, audit reasons, SLA/risk filters, and exception queues. |
| Payments | Present as payment rows and admin status controls. | Partial | Needs real provider payment intents, webhook reconciliation, refund transactions, chargeback handling, and PCI-safe flow. |
| Returns/refunds | Present with return request admin page and refund status sync. | Partial | Needs full/partial refund workflow, item-level refund, evidence, seller response, buyer protection decision, and ledger reconciliation. |
| Payouts | Present as withdrawal approval/rejection. | Partial | Needs batch payout execution, provider status, failure/retry, reserves, statement exports, and payout audit. |
| Reporting | Present with reports dashboard and basic marketplace KPIs. | Partial | Needs funnel analytics, seller quality dashboards, dispute/refund rates, SLA reports, and source-of-truth financial reporting. |
| Policies/CMS | Present with CMS public pages/settings. | Partial | Needs policy versioning, seller acceptance tracking, prohibited item taxonomy, and operational SOPs connected to admin workflows. |
| Audit/security | Audit table exists and mutations are intended to log sensitive actions. | Partial | Needs complete coverage verification, reason-required actions, CSRF strategy, and hardening of generic data API access. |

## P0 Launch Blockers

1. Payment provider integration is not launch-ready.
   - Current system supports payment rows/manual status changes and Stripe packages are installed, but there is no complete payment intent, webhook, refund, reconciliation, or failure lifecycle.
   - Required task: implement provider-backed authorization/capture/refund flow and make order confirmation depend on successful authorization.

2. Disputes are not first-class.
   - Returns/support exist, but buyer protection needs a dedicated dispute entity, evidence model, seller response, admin decision, refund/replacement outcomes, appeal/escalation, and audit trail.
   - Required task: add dispute schema, buyer/seller/admin screens, and refund/payout ledger impact.

3. Mixed-seller order lifecycle is too coarse.
   - `order_items` carry `seller_id`, but the main order status is shared across sellers. In multi-seller carts, one seller shipping should not advance the whole buyer order.
   - Required task: introduce seller suborders or item-level fulfillment statuses, tracking records, and buyer-facing grouped fulfillment timeline.

4. Inventory reservation and concurrency controls need hardening.
   - Checkout decrements stock and checks stock, but there is no reservation expiry, abandoned checkout release, restock history, or low-stock operational workflow.
   - Required task: add inventory reservations, variant-level stock rules, stock movement ledger, and low-stock alerts.

5. Payout settlement is not complete.
   - Earnings and withdrawals exist, but there is no provider/bank transfer execution, reserve policy, payout failure handling, chargeback impact, or full financial reconciliation.
   - Required task: design payout ledger, reserve/hold rules, batch export/provider integration, and seller statement view.

6. Production security and data-access hardening are unresolved.
   - The codebase uses a Supabase-shaped client over internal APIs/MySQL/local DB. The generic data endpoint and cookie-authenticated mutations need explicit production access controls and CSRF strategy.
   - Required task: harden `/api/data/query`, define role/table/action allowlists, add CSRF protection for state-changing browser requests, and verify audit coverage.

7. Seller KYC and policy enforcement are incomplete.
   - Seller approval exists, but the launch requirement needs request-info loops, document review, policy acceptance, prohibited item checks, risk notes, and suspension reason workflow.
   - Required task: add seller application checklist, document states, admin reasons, policy version acceptance, and enforcement history.

## Prioritized Requirements Gap List

### P0: Must Ship Before Public Launch

1. Payment authorization, capture, refund, webhook reconciliation, and payment failure lifecycle.
2. First-class dispute and buyer-protection workflow.
3. Seller suborders/item-level fulfillment statuses for mixed carts.
4. Inventory reservation, variant-stock parity, stock movement ledger, and oversell safeguards.
5. Payout ledger and provider/bank-transfer settlement workflow.
6. Harden generic data API and add CSRF protection for cookie-authenticated mutations.
7. Require admin action reasons and audit logging for seller/product/order/payment/refund/payout changes.
8. Seller KYC/request-info workflow and policy acceptance versioning.
9. Return/refund item-level workflow with full/partial refund and seller payout reversal.
10. Launch category governance: required attributes, prohibited item rules, and moderation queue SLAs.

### P1: Private Beta Readiness

1. Search improvements: attribute facets, delivery/seller filters, synonyms, no-results recovery, and ranking analytics.
2. Seller performance scorecard: cancellation, late shipment, dispute, refund, response time, rating, and order defect rate.
3. Buyer/seller/admin notifications for checkout, payment, order status, shipping, return, dispute, payout, and policy actions.
4. Review moderation, seller response, review abuse controls, and post-purchase review prompts.
5. Support ticket categorization, SLA timers, macros, internal notes, and escalation routing.
6. Admin financial reports: payment success, refunds, fees, payout liabilities, reserves, and net settlement.
7. Seller statements and payout breakdown exports.
8. Bulk product import/export with validation and admin review queue.

### P2: Scale And Growth

1. Sponsored listings/ads beyond current marketing request scaffolding.
2. Recommendation engine and personalized merchandising.
3. Cross-border tax/duty/shipping models.
4. Seller API and third-party integrations.
5. Warehouse/3PL integration and managed fulfillment.
6. Advanced fraud scoring for buyer, seller, payment, listing, and dispute behavior.
7. Mobile apps or app-like seller workflow.

## Immediate Implementation Tasks

### Engineering

1. Create a `disputes` domain:
   - Tables: `disputes`, `dispute_messages`, `dispute_evidence`, `dispute_decisions`.
   - Buyer entry points from order detail and return flow.
   - Seller response queue in seller center.
   - Admin dispute queue with decision actions and refund/payout impact.

2. Split fulfillment from buyer order:
   - Add `seller_orders` or item-level fulfillment fields.
   - Move seller tracking/status actions to seller-owned records.
   - Keep buyer order as aggregate status derived from seller/order item state.

3. Replace manual payment status with provider-backed flow:
   - Payment intent creation during checkout.
   - Webhook-driven confirmation/failure/refund updates.
   - Idempotent order creation and payment reconciliation.

4. Add inventory ledger and reservations:
   - Reserve stock during checkout.
   - Expire reservations when payment fails or checkout is abandoned.
   - Record stock movements for purchase, cancellation, return, admin adjustment, and restock.

5. Harden platform APIs:
   - Restrict `/api/data/query` by role, table, and operation.
   - Add CSRF token validation to cookie-authenticated mutation requests.
   - Verify admin audit logging for all sensitive mutation flows.

### Product And Operations

1. Freeze Phase 1C MVP non-goals:
   - No auctions, no open seller publishing, no automated dispute decisions, no cross-border duties, no full ad platform.

2. Define policy decisions required by engineering:
   - Payment provider, payout provider, payout hold period, refund reserve, commission model, return windows, seller SLA, prohibited items, and launch categories.

3. Write operating SOPs:
   - Seller approval, listing moderation, return/refund, dispute resolution, payout hold/release, seller suspension, buyer abuse review, and emergency incident handling.

4. Define launch metrics:
   - Payment success, checkout conversion, seller approval cycle time, listing review cycle time, on-time shipment, cancellation rate, return rate, dispute rate, refund latency, support first response, payout cycle time.

## Product Decision Log

- Current platform should be classified as internal beta foundation, not public-launch ready.
- Current admin/seller/customer coverage is broad enough to continue buildout in-place rather than restart.
- Highest risk is trust and money movement, not UI page count.
- Phase 1C engineering tickets should prioritize payment, disputes, seller-level fulfillment, inventory, payout, and security before growth features.

## Suggested Child Issues

1. Engineering: Implement provider-backed payment authorization, capture, refund, and webhook reconciliation.
2. Engineering: Add dispute/buyer-protection workflow across buyer, seller, and admin.
3. Engineering: Add seller suborders and item-level fulfillment tracking for mixed-seller carts.
4. Engineering: Add inventory reservations, stock movement ledger, and low-stock alerts.
5. Engineering: Harden `/api/data/query` and add CSRF protection for authenticated mutations.
6. Operations: Finalize seller policy, prohibited items, return/refund, dispute SOP, payout hold, and seller SLA.
7. Finance/Ops: Select payout provider and define settlement, reserve, and reconciliation rules.

## Acceptance Status For ECL-25

Complete. The requirements gap map was produced against the current Amzn Project workspace and includes concrete findings, launch blockers, and immediate implementation tasks for customer, seller, and admin capabilities.
