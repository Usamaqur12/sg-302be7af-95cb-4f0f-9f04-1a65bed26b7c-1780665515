# ECL-49 Support/Ops Runbooks Plan

Date: 2026-06-16
Issue: ECL-49
Project: Amzn Project / Mercato Multi-Vendor Marketplace
Owner: Customer Support Manager
Scope: Planning only. Define Mercato refund, dispute, cancellation, seller-quality and escalation runbooks for launch operations.

## Executive Disposition

ECL-49 is complete as a planning artifact. The support and operations runbooks below are ready for CEO/product, Finance, Operations and Support review before implementation.

Recommended launch posture:

- Treat refunds, cancellations, disputes and seller-quality decisions as manual admin-reviewed workflows for MVP.
- Keep buyer acquisition and broad seller onboarding gated until refund authority, dispute ownership, cancellation windows and seller-quality penalties are approved.
- Do not promise instant or guaranteed refunds until payment-provider refunds, ledger reconciliation and support evidence handling are implemented.
- Use existing return request, support ticket, seller account health and admin moderation surfaces where available, but track disputed cases manually until first-class dispute records exist.

## Source Evidence Reviewed

- `docs/phase-1c-completion-audit.md`
- `docs/multivendor-implementation-plan.md`
- `docs/ecl-31-production-deployment-operations-plan.md`
- `docs/ecl-33-launch-growth-content-plan.md`
- `docs/amzn-phase-1b-product-requirements-gap-map.md`
- `docs/security-audit-phase-1f.md`
- `.softgen/flows.md`
- `.softgen/database-schema.md`
- Targeted repository search for returns, refunds, disputes, cancellations, seller quality, support tickets, payments, order status and escalation references.

## Current Operational Reality

Verified planning assumptions:

- Mercato has customer return request and support ticket concepts.
- Admin operations include returns/refunds, payments, payouts, seller/product moderation, support and settings.
- Seller Center includes seller support, account health, order handling and quality-related guidance.
- Payments are currently manual or incomplete for production-grade online payment finality.
- Provider-backed refund APIs, webhook reconciliation, payment event ledgers and chargeback/dispute provider flows are not yet complete.
- First-class disputes are absent. Returns and support tickets can represent simple cases, but contested cases need manual tracking or future dispute tables.
- Cancellation support is partial through order statuses, but split seller fulfillment, restock rules, cancellation windows and buyer/seller notification events are not complete.
- Private evidence storage remains sensitive. Support, KYC and payment-proof files must not be handled as public assets.

## Operating Principles

Runbook decisions should use these principles:

1. Protect buyer trust without creating unsupported refund promises.
2. Keep seller accountability tied to evidence, order status and policy breach history.
3. Separate simple returns from contested disputes.
4. Require Finance approval for money movement and payout-impacting decisions.
5. Require Operations approval for seller penalties, suspension and high-impact marketplace interventions.
6. Require Engineering review when a case exposes missing workflow support, data integrity risk or security risk.
7. Preserve an audit trail for every refund, cancellation, dispute decision, seller-quality action and escalation.

## Role Matrix

| Role | Decision rights | Required actions |
| --- | --- | --- |
| Support Agent | Triage, buyer/seller communication, evidence collection, SLA tracking. | Create/update support ticket, classify case, request missing evidence, escalate by rules below. |
| Support Lead | Approve service recovery gestures within approved limits, resolve low-risk disputes, enforce support SLAs. | Review aged cases, approve exceptions, assign owners. |
| Operations Manager | Seller-quality actions, cancellation exceptions, fulfillment investigations, seller warnings/suspensions. | Validate seller history, apply account health actions, coordinate with sellers. |
| Finance Manager | Refund release, partial refunds, payout holds, payment reconciliation, chargeback response. | Confirm payment state, ledger impact, payout eligibility and refund evidence. |
| Admin/Trust Lead | High-risk abuse, fraud, repeat policy breaches, restricted product or safety cases. | Decide restriction, suspension, manual review or legal escalation. |
| Engineering Owner | Workflow blockers, data defects, role/access defects, automation gaps. | Create implementation issues and provide operational workaround. |
| CEO/COO | Policy exceptions, large-value refunds, public launch gate decisions, seller termination appeals. | Approve exceptions outside published policy. |

## Severity Model

| Severity | Examples | Response target | Escalation |
| --- | --- | --- | --- |
| Critical | Data exposure, payment/refund fraud, admin access issue, large seller fraud, public safety product, legal threat. | Immediate same-day response. | Support Lead, Finance, Operations, Engineering and CEO/COO. |
| High | Checkout/order mismatch, refund over SLA, seller refuses eligible return, repeat cancellation abuse, chargeback notice. | Same business day owner action. | Support Lead plus Finance or Operations. |
| Medium | Standard return, seller shipment delay, buyer cancellation request, product-not-as-described claim with evidence pending. | 1 business day first response. | Support Lead if aging or disputed. |
| Low | Policy question, help request, minor listing quality complaint, seller education request. | 2 business days. | Support Lead only if SLA breach. |

## Runbook 1: Refunds And Returns

### Entry Points

- Buyer order detail return request.
- Support ticket from buyer.
- Admin-created manual case from phone/email/social support.
- Seller-initiated issue when seller cannot fulfill or accepts return.

### Case Classification

Classify the case as one of:

- Buyer remorse or changed mind.
- Damaged item.
- Wrong item.
- Item not received.
- Product not as described.
- Seller cancelled or cannot fulfill.
- Duplicate payment/order issue.
- Payment proof/reconciliation issue.
- Policy exception.

### Standard Workflow

1. Support confirms buyer identity, order ID, order item, seller, payment method, order status and delivery status.
2. Support checks eligibility window and product category restrictions from approved policy.
3. Support requests evidence when required: photos, unboxing evidence, delivery proof, payment proof or seller communication.
4. Operations confirms seller-side facts for fulfillment, delivery and item condition.
5. Finance confirms payment status, refund method, payout impact and whether seller earnings must be held.
6. Support Lead records the resolution: approve, reject, partial refund, replacement, store credit/manual gesture or dispute escalation.
7. Finance executes approved refund only after reconciliation is complete.
8. Support notifies buyer and seller with the decision, reason and next step.
9. Admin records internal notes and audit evidence.

### Refund Decision Rules

Approve refund when:

- Order was paid but not fulfillable and seller/admin confirms cancellation.
- Buyer received wrong, damaged or materially misrepresented item and evidence supports the claim.
- Duplicate payment/order can be reconciled.
- Delivery failure is confirmed and seller/carrier cannot prove successful handoff.

Reject refund when:

- Buyer is outside the approved return window and no exception applies.
- Evidence does not support the claim after reasonable request.
- Product is excluded by policy and no seller fault exists.
- Buyer refuses required return/evidence steps.

Use partial refund when:

- Buyer keeps a damaged but usable item by agreement.
- Some items in a multi-item order are affected.
- Shipping, restocking or seller-fault allocation requires partial settlement.

### MVP Constraints

- Provider-backed automated refunds are not production-ready.
- Refunds must remain Finance-approved and manually reconciled.
- Multi-seller mixed-cart refunds require item-level tracking discipline because aggregate order status is not enough.
- Payout holds must be applied manually for affected seller earnings until automated reserves are implemented.

### Refund SLAs

| Step | Target |
| --- | --- |
| First response | 1 business day |
| Evidence request after triage | Same business day |
| Seller response window | 2 business days |
| Finance review after complete evidence | 1 business day |
| Final decision target | 5 business days for standard cases |
| Critical/high escalation | Same business day |

## Runbook 2: Disputes

### Definition

A dispute is any contested case where buyer, seller, Finance or Operations disagree on facts, eligibility, fault, payment state, item condition or resolution. Simple eligible returns should not be handled as disputes.

### Dispute Triggers

Open or escalate to a dispute when:

- Seller rejects a return/refund that appears eligible.
- Buyer challenges support rejection with new evidence.
- Item-not-received facts conflict between buyer, seller and delivery evidence.
- Seller alleges buyer abuse, switched item, damaged return or false claim.
- Payment proof, payment status or refund amount cannot be reconciled.
- Chargeback or external payment dispute is received.
- Case value or reputational impact exceeds approved support limits.

### Manual MVP Workflow

1. Support Lead assigns a single dispute owner.
2. Support creates or updates the support ticket with `Dispute` in the subject/internal status.
3. Owner records buyer claim, seller response, evidence links, order/payment state, requested resolution and due date.
4. Operations reviews seller history, fulfillment evidence, cancellation history, account health and policy flags.
5. Finance reviews payment status, refund exposure, payout hold and chargeback risk.
6. Owner mediates one evidence round with buyer and seller unless severity requires immediate action.
7. Support Lead proposes decision: buyer refund, seller release, partial settlement, replacement, claim rejection, seller warning, seller suspension or executive escalation.
8. Finance and Operations approve any money or seller-quality action.
9. Final decision is communicated to both parties with reason and next step.
10. Case is tagged for metrics and future product automation.

### Dispute Decision Record

Every dispute needs:

- Order ID and order item ID when available.
- Buyer ID and seller ID.
- Case type and severity.
- Evidence requested and received.
- Buyer claim summary.
- Seller response summary.
- Payment/refund state.
- Payout hold decision.
- Final resolution and approving owner.
- Follow-up issue when a platform gap caused manual risk.

### Product Gap

The repository already identifies future first-class dispute tables: disputes, dispute messages, dispute evidence and dispute events. Until implemented, manual tracking through support tickets and admin notes is an operational workaround, not a durable long-term control.

## Runbook 3: Cancellations

### Cancellation Types

- Buyer pre-fulfillment cancellation.
- Seller stock-out or seller-initiated cancellation.
- Admin cancellation for fraud, policy, duplicate order or operational error.
- Payment failure or payment timeout cancellation.
- Partial cancellation for one seller/item in a mixed order.

### Standard Workflow

1. Confirm order status, payment status, seller fulfillment status and whether shipment has started.
2. If shipment has not started, Support may accept buyer cancellation within approved policy.
3. If seller initiated cancellation, Operations checks stock, fulfillment reason and seller history.
4. Finance confirms refund or payment release handling.
5. Seller inventory/restock action is recorded where applicable.
6. Buyer and seller receive cancellation reason and next step.
7. Seller-quality score/history is updated manually for seller-fault cancellation.

### Cancellation Rules

Allow buyer cancellation when:

- Order has not shipped.
- Seller has not purchased irreversible custom service or product exclusion applies.
- Payment/refund path is confirmed by Finance.

Require Operations approval when:

- Order has shipped or tracking exists.
- Seller disputes cancellation.
- Partial cancellation affects multi-seller order totals.
- Cancellation would trigger refund before payment state is reconciled.

Escalate seller cancellation when:

- Seller cancels due to stock-out after accepting order.
- Seller repeatedly cancels approved orders.
- Seller cancels campaign/promotional orders after buyer commitment.
- Seller cancellation creates buyer harm or public complaint.

### MVP Constraints

- Aggregate order status is insufficient for multi-seller orders.
- Item-level fulfillment, cancellation and restock automation are required before high-volume operations.
- Support must avoid changing whole-order status when only one seller or item is affected unless the current data model makes partial status impossible and the workaround is approved.

## Runbook 4: Seller Quality

### Quality Dimensions

Track seller quality across:

- KYC/verification completeness.
- Product listing accuracy and image quality.
- Product approval rejection rate.
- Fulfillment speed and SLA misses.
- Cancellation rate.
- Return/refund rate by seller fault.
- Dispute rate and dispute loss rate.
- Buyer reviews and verified-purchase complaints.
- Support responsiveness.
- Policy violations and prohibited/restricted product attempts.
- Campaign eligibility and promotion abuse.

### Account Health Bands

| Band | Criteria | Action |
| --- | --- | --- |
| Healthy | Low complaints, low cancellations, timely fulfillment, accurate listings. | Eligible for campaigns and featured seller consideration. |
| Watch | Isolated SLA miss, quality complaint or minor policy issue. | Seller education and monitoring. |
| At Risk | Repeat cancellations, slow responses, repeated listing rejections, unresolved disputes. | Written warning, campaign restriction, payout hold review. |
| Restricted | Serious policy breach, fraud signal, safety risk, repeat dispute loss, abusive behavior. | Listing suspension, seller suspension or executive review. |

### Standard Workflow

1. Operations reviews seller account health weekly during private beta.
2. Support flags seller-quality cases from tickets, returns, disputes and buyer complaints.
3. Operations records seller fault categories and supporting evidence.
4. Support Lead and Operations decide coaching, warning, restriction, suspension or escalation.
5. Finance is consulted when seller-quality action affects payouts, reserves, refunds or commissions.
6. Seller receives clear notice: issue, evidence, required correction and deadline.
7. Repeat or severe cases are escalated to Trust Lead or CEO/COO.

### Launch Quality Thresholds

Recommended private beta thresholds:

- More than 2 seller-fault cancellations in 14 days: Watch.
- More than 5% seller-fault cancellation rate over 20+ orders: At Risk.
- More than 3 unresolved support cases older than SLA: At Risk.
- Any confirmed counterfeit, unsafe item, KYC fraud or payment fraud: Restricted pending review.
- More than 2 dispute losses in 30 days: At Risk or Restricted depending on value/severity.

Thresholds should be approved by CEO/product before seller enforcement begins.

## Runbook 5: Escalations

### Escalation Paths

| Trigger | Owner | Escalate to |
| --- | --- | --- |
| Refund amount exceeds approved support limit | Support Lead | Finance Manager and CEO/COO |
| Chargeback or external payment dispute | Finance Manager | Support Lead and CEO/COO |
| Seller refuses eligible return/refund | Support Lead | Operations Manager |
| Repeat seller-fault cancellations | Operations Manager | Trust Lead |
| Data exposure or private evidence risk | Support Lead | Engineering and CEO/COO |
| Platform cannot represent required workflow safely | Support Lead | Engineering Owner |
| Legal threat, regulator, public safety, fraud ring | Trust Lead | CEO/COO |
| Support SLA breach on high-severity case | Support Lead | Operations Manager |

### Escalation Packet

Every escalation must include:

- Case ID or support ticket ID.
- Order ID and order item IDs.
- Buyer and seller IDs.
- Severity and business impact.
- Timeline of events.
- Evidence links or notes.
- Payment/refund/payout state.
- Requested decision.
- Deadline for decision.
- Current customer/seller communication state.

## Operational Metrics

Track weekly during private beta:

- Return request volume and rate.
- Refund approval rate.
- Partial refund rate.
- Average refund decision time.
- Dispute volume by type.
- Dispute aging and SLA breaches.
- Cancellation rate by buyer, seller and admin reason.
- Seller-fault cancellation rate.
- Seller response time to support/return cases.
- Seller-quality warnings, restrictions and suspensions.
- Refund amount by reason and seller.
- Payout holds caused by returns/disputes.
- Support first response time and resolution time.
- High/Critical escalation count.

## Required Policies Before Launch

CEO/product must approve:

- Return window by category.
- Non-returnable or restricted categories.
- Refund authority limits by role.
- Partial refund and service recovery limits.
- Cancellation windows and shipment cutoffs.
- Seller cancellation penalties.
- Seller-quality thresholds and enforcement levels.
- Evidence requirements for damaged/wrong/not-received claims.
- Chargeback handling owner and response template.
- Payout hold/reserve policy for open returns and disputes.

Finance must approve:

- Refund execution method.
- Reconciliation workflow.
- Payout hold rules.
- Chargeback response and accounting treatment.
- Manual refund audit fields.

Operations must approve:

- Seller warning/suspension workflow.
- Fulfillment SLA and seller response SLA.
- Seller education path.
- Campaign eligibility restrictions tied to account health.

Engineering must approve or create follow-up issues for:

- First-class dispute records and evidence model.
- Item-level cancellation/refund/fulfillment status.
- Provider-backed refunds and payment event ledger.
- Private support evidence storage and authorized retrieval.
- Audit logs for support/admin refund and seller-quality actions.
- Notification templates for returns, refunds, disputes, cancellations and seller enforcement.

## Launch Gates

Private beta support operations are blocked unless:

- Support ticket queue can classify return, refund, dispute, cancellation and seller-quality cases.
- Admin can locate order, payment, seller and return context for each case.
- Finance has a manual refund and payout-hold reconciliation checklist.
- Operations has approved seller-quality thresholds and enforcement notices.
- Support has approved customer/seller response templates.
- Private evidence handling path is approved for support attachments.

Public launch is blocked unless:

- Payment/refund flow is provider-backed or manual limitations are clearly reflected in public policy.
- Disputes have either first-class platform support or a reviewed manual case register.
- Multi-seller cancellations/refunds can be handled without corrupting whole-order status.
- Seller-quality enforcement is consistently recorded and appealable.
- High/Critical escalation owners are named for launch week.

## Recommended Follow-Up Issues

Create implementation issues after plan approval for:

1. Engineering: first-class dispute tables, APIs, admin UI, seller/buyer case views, evidence and event ledger.
2. Engineering: item-level cancellation, refund, return and fulfillment state for multi-seller orders.
3. Engineering/Finance: provider-backed refund API, payment event ledger, payout hold automation and reconciliation exports.
4. Engineering/Security: private support evidence storage with authorized retrieval, malware scanning, retention and audit logs.
5. Support/Ops: approved response templates for refund, dispute, cancellation, seller warning, seller suspension and escalation notices.
6. Finance/Ops: refund authority matrix, payout-hold policy and weekly reconciliation dashboard.
7. Ops/Trust: seller-quality dashboard and account health enforcement workflow.

## Final Recommendation

Approve this plan as the ECL-49 support and operations baseline, then create implementation child issues only after CEO/product, Finance and Operations confirm policy limits. Until those approvals exist, Mercato should operate refunds, disputes, cancellations and seller-quality actions manually with named owners, documented evidence and conservative public promises.
