# ECL-50 Finance/Ops Plan

Date: 2026-06-16
Issue: ECL-50
Scope: Planning-only model for Mercato commissions, payouts, refunds, COD/Stripe reconciliation and unit economics.

## Planning Verdict

Mercato already creates order items, payment rows and seller earning rows during checkout, but the money model is not strong enough for launch-scale operations. The finance plan should keep MVP execution manual where the roadmap allows it, while introducing a single immutable ledger and reconciliation model that can support COD, manual payment proof and Stripe/provider automation later without reworking seller balances.

## Current Baseline

- Checkout in `src/pages/api/orders/index.ts` calculates per-item commission and seller earnings, inserts `order_items`, inserts pending `seller_earnings`, creates a `payments` row and decrements inventory transactionally.
- `database/mysql/schema.sql` includes `seller_profiles.commission_rate`, `orders`, `order_items`, `payments`, `seller_earnings`, `withdrawal_requests`, `return_requests`, `system_settings.seller_payout_hold_days` and admin audit logs.
- Admin payment UI can manually mark payments completed, failed or refunded, and syncs the coarse order status.
- Seller earnings UI uses delivered order items, hold days and withdrawal requests to present pending/available payout state.
- Admin reports sum completed payments and order-item commission amounts, but there is no finance-grade settlement ledger.

## Core Gaps To Model

1. Ledger
   The current system stores derived balances in multiple places without an immutable journal. Add an append-only ledger as the source of truth for order capture, COD collection, Stripe capture, commission, seller payable, payout hold, payout release, refund, reversal, adjustment and payout settlement.

2. Commission
   Commission is calculated at checkout, but needs explicit rounding, item-level discount allocation, tax/shipping treatment, refund reversal rules, seller override history and audit visibility.

3. Payouts
   `seller_earnings` and `withdrawal_requests` provide an MVP queue, but payout approval must validate against ledger-derived available balance, hold periods, refunds, reserves and already-pending withdrawals before funds leave the platform.

4. Refunds
   Payment status can be marked refunded, and return requests include refund fields, but there is no item-level refund transaction model, partial refund support, commission clawback, seller earning reversal, provider refund reference or reconciliation status.

5. COD/Stripe Reconciliation
   COD and Stripe should both feed the same payment event and ledger model. COD needs courier/collector reference, expected cash, collected cash, shortage/overage and deposit batch status. Stripe needs PaymentIntent, Charge, Refund, webhook event and payout/fee references.

6. Unit Economics
   Reports need contribution margin by order, item, seller, category and payment method. Current admin reporting only shows gross completed sales and commission totals.

## Target Finance Model

## Commission Policy Model

- Default commission: 10% of item net merchandise value for standard sellers.
- Launch cohort commission: 5% for approved launch sellers during their configured launch window. The launch cohort needs an effective start/end date and should fall back to the standard rate after expiry.
- Category override range: 3% to 18%, configured by category and effective date. Category overrides should apply before seller-specific overrides unless the admin explicitly marks the seller override as absolute.
- Vendor override range: 0% to 20%, configured per seller with approval note, effective dates and audit trail. Zero-rate overrides should require admin/finance approval because they remove platform revenue.
- Commission is earned when payment is captured or COD is collected, but remains reversible until the refund/return/dispute window closes.
- Commission is reversed pro rata on partial refunds and fully reversed on full refunds, cancellations before capture/collection and successful chargebacks.
- Commission should be rounded per order item to two decimal places. Ledger summaries should reconcile any rounding residual to a platform rounding adjustment entry.
- Initial MVP commission base should be product subtotal after item-level discounts, excluding shipping and tax. Platform-funded discounts should reduce platform margin, not seller payable, unless the board chooses a different policy before implementation.

### Canonical Tables

- `finance_ledger_entries`
  Append-only journal with `entry_type`, `order_id`, `order_item_id`, `seller_id`, `payment_id`, `payout_batch_id`, `return_request_id`, `amount`, `currency`, `direction`, `status`, `available_at`, `source_type`, `source_id`, `idempotency_key`, `metadata`, `created_by` and `created_at`.

- `payment_events`
  Provider/manual event stream with `payment_id`, `order_id`, `method`, `event_type`, `provider`, `provider_event_id`, `provider_payment_id`, `provider_refund_id`, `amount`, `fee_amount`, `net_amount`, `status`, `occurred_at`, `raw_payload` and `idempotency_key`.

- `refund_transactions`
  Refund intent/execution records with `order_id`, optional `order_item_id`, `return_request_id`, `payment_id`, `requested_amount`, `approved_amount`, `provider_refund_id`, `reason`, `status`, `approved_by`, `approved_at`, `processed_at` and `failed_reason`.

- `payout_batches`
  Admin settlement batches with `batch_number`, `status`, `method`, `total_amount`, `seller_count`, `export_url`, `provider_reference`, `approved_by`, `approved_at`, `processed_at`, `failed_reason` and timestamps.

- `payout_batch_items`
  Seller-level payout lines with `batch_id`, `seller_id`, `withdrawal_request_id`, `amount`, `status`, `provider_reference`, `failure_reason`, `processed_at` and timestamps.

- `commission_rules` or `seller_commission_history`
  Effective-dated commission records for default and seller overrides so historic orders can be explained even after rates change.

- `cod_reconciliation_batches`
  COD collection/deposit batches with collector/courier reference, expected amount, collected amount, deposited amount, variance, status and reconciliation timestamps.

### Ledger Entry Types

- `payment_authorized`
- `payment_captured`
- `cod_expected`
- `cod_collected`
- `cod_deposited`
- `platform_commission`
- `seller_earning_pending`
- `seller_earning_available`
- `refund_requested`
- `refund_processed`
- `seller_earning_reversed`
- `commission_reversed`
- `payout_requested`
- `payout_approved`
- `payout_paid`
- `payout_failed`
- `manual_adjustment`

Each entry must be idempotent by source event and immutable after creation. Corrections should be reversal entries, not updates.

## State Rules

- Order payment states are derived from payment events, not manually edited in isolation.
- Seller payable balance is derived from ledger entries filtered by seller, availability date, payout status and refund/reversal status.
- Payout approval must fail if requested amount exceeds ledger-derived available balance after pending payout holds.
- Refund approval must create refund transaction records first, then provider/manual payment events, then ledger reversal entries.
- Commission is calculated from item net merchandise value after item-level discounts. Shipping, tax and platform-funded discounts need explicit settings before inclusion in seller payable or commission base.
- COD orders create expected-cash ledger entries at order confirmation, collection events at delivery/collector confirmation and deposit events when finance reconciles cash received.
- Stripe events are accepted only through idempotent webhook/payment event processing. Manual admin edits can annotate or reconcile, but should not bypass event/ledger creation.

## Payout Policy Model

- Earnings availability: seller earning entries start as pending and become available only after delivery, payment finality and the configured hold period.
- Default hold: use existing `seller_payout_hold_days` as the minimum hold, but finance should set a launch value of 7 days unless the board keeps the current 2-day setting.
- COD hold: release seller funds after COD deposit reconciliation, not merely delivery, unless finance accepts courier collection risk.
- Refund/dispute hold: any open return, refund, dispute, chargeback or COD variance holds affected seller earnings until resolved.
- Payout cadence: weekly manual payout batch for MVP, with off-cycle admin payout allowed only by finance override.
- Approval controls: payout approval must require ledger-derived available balance, no unresolved holds, bank details present, admin note, approver identity and audit log.
- Manual export fields: batch number, payout item id, seller id, business name, account title, bank name, IBAN/account number, amount, currency, withholding/adjustment amount, reference, approval date and approver.

## COD And Stripe Reconciliation Model

- COD statuses: expected, collected by courier/collector, deposited to platform, variance_open, reconciled and written_off.
- COD records should capture order, collector/courier, collection reference, collected amount, deposit batch, variance amount and finance note.
- Stripe statuses: intent_created, requires_action, authorized, captured, failed, refunded, disputed, chargeback_lost and chargeback_won.
- Stripe records should capture PaymentIntent, Charge, Refund, BalanceTransaction, webhook event id, provider fee and net settlement amount.
- Manual payment proof remains an MVP event source, but must use the same payment event and ledger path as COD/Stripe.
- Failed payments should not create available seller earnings; chargebacks and failed COD deposits should create reversal/hold ledger entries.

## Unit Economics Model

- GMV: sum of product merchandise value before refunds.
- Net GMV: GMV minus cancelled/refunded merchandise value.
- Marketplace net revenue: commission earned plus seller/service fees plus payment incentives retained, minus commission reversals.
- Payment cost: Stripe/provider fees, COD collection fees, failed payment fees and chargeback fees.
- Refund exposure: approved refunds plus pending refund requests plus disputed/chargeback exposure.
- Support cost assumption: track cost per support ticket/dispute as a configurable finance assumption until real staffing cost data exists.
- Acquisition cost assumption: track CAC by channel/campaign from marketing inputs; default unknown CAC should be reported separately rather than treated as zero.
- Contribution margin: marketplace net revenue minus payment cost, refund exposure, support cost allocation, acquisition cost allocation, COD variance and manual adjustments.

## Finance KPIs And Launch Risk Limits

- KPIs: GMV, net GMV, collected cash, unreconciled COD, commission earned, commission reversed, seller payable, payout paid, refund rate, chargeback rate, COD variance rate, average payout age and contribution margin.
- Launch risk limits: unresolved COD variance under 2% of COD GMV, refund exposure under 5% of rolling GMV, chargebacks under 1% of Stripe GMV, payouts blocked when seller has open high-risk disputes, and no payout from unreconciled COD collections.
- Engineering dependencies: ledger schema, explicit finance APIs, admin audit logs, role-gated finance operations, idempotent event processing, return/refund integration and focused finance workflow tests.

## MVP Implementation Sequence

1. Finance schema migration
   Add ledger, payment events, refund transaction, payout batch, payout item, commission history and COD reconciliation tables. Backfill current `order_items`, `payments`, `seller_earnings` and `withdrawal_requests` into ledger entries for local/dev data.

2. Checkout ledger write
   Extend order creation to write idempotent payment and seller earning ledger entries inside the existing transaction. Keep existing tables for UI compatibility until pages are migrated.

3. Admin payment reconciliation
   Replace direct payment status edits with a payment-event workflow for manual proof, COD and Stripe-ready events. Keep the current admin payments page shape, but drive status from events.

4. Refund workflow
   Add item-level refund transactions connected to return requests and payments. Generate commission and seller earning reversal ledger entries on approved refunds.

5. Payout controls
   Move payout approval to ledger-derived balances. Add payout batches and exportable payout batch items. Keep manual payout execution for MVP, with failure/retry state.

6. COD reconciliation
   Add finance/admin COD batches for expected, collected and deposited cash. Show variance and unresolved COD orders before payout release.

7. Stripe integration seam
   Add provider identifiers and webhook idempotency to the event model. Implement Stripe PaymentIntent/webhook/refund only after board selection, using the same ledger entry path.

8. Unit economics reporting
   Add admin finance reports for gross merchandise value, collected cash, payment fees, refunds, commission, seller payable, payout paid, COD variance and contribution margin by seller/category/payment method.

9. Verification
   Add deterministic workflow checks for commission calculation, partial refund reversal, payout balance validation, COD reconciliation variance and duplicate webhook/event idempotency.

## Acceptance Criteria

- Every money movement has an immutable ledger entry with source, actor/system origin, amount, currency and idempotency key.
- Seller available balance can be recomputed from ledger entries and matches UI totals.
- Partial and full refunds reverse seller earnings and commission correctly.
- COD orders can be reconciled from expected cash through collection and deposit, with variance surfaced.
- Stripe/provider records can be introduced without changing seller balance semantics.
- Payout batches cannot pay unavailable, refunded or already-pending funds.
- Admin finance reports expose unit economics beyond gross revenue.

## Recommended Child Issues After Approval

- ECL-50A: Add finance ledger, payment event, refund, payout batch and COD reconciliation schema.
- ECL-50B: Wire checkout and manual payment verification to idempotent ledger/payment events.
- ECL-50C: Implement refund transactions and ledger reversals from return workflows.
- ECL-50D: Harden payout approval with ledger-derived balances, batches and manual export.
- ECL-50E: Add COD reconciliation operations and finance reporting/unit economics.
- ECL-50F: Add focused finance workflow tests for commissions, refunds, payouts and reconciliation.

## Decisions Needed Before Implementation

- Confirm whether MVP remains manual payment/COD-first, with Stripe as post-MVP, or whether Stripe must be included in the initial implementation batch.
- Confirm commission base: product subtotal only, or product subtotal plus shipping/tax minus discounts.
- Confirm payout hold policy for COD: release after delivered, after COD collected, or after COD deposited.
- Confirm whether platform-funded discounts reduce seller payable or platform margin only.
- Confirm required payout export format for manual finance operations.

## Disposition

Planning is complete for ECL-50. Implementation should wait for board approval of this plan and the finance decisions above, then proceed through child issues rather than a single broad implementation ticket.
