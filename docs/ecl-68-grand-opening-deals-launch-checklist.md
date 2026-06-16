# ECL-68 Grand Opening Deals Launch Checklist

Date: 2026-06-16
Issue: ECL-68
Project: Mercato Multi-Vendor Marketplace
Owner: Operations Manager
Source: ECL-48 launch marketing plan, plus ECL-30 QA, ECL-31 deployment, ECL-49 support operations and ECL-50 finance operations planning.

## Operating Decision

Grand Opening Deals may launch only as a controlled campaign using approved sellers, approved products, verified inventory, clear discount rules and named support/finance escalation owners.

Recommended launch posture:

- Start with private beta or soft-launch traffic only.
- Use approved products only. Pending, rejected, suspended, out-of-stock or policy-unclear products stay out of campaign modules and paid promotion.
- Keep payment, payout, refund and delivery promises conservative until Finance, Support and QA evidence is attached.
- Pause category promotion when supply depth, product quality, moderation SLA, checkout reliability or support readiness falls below the thresholds below.

## Source Evidence Reviewed

- `docs/ecl-48-mercato-launch-positioning-funnel-vendor-kit-channel-plan.md`
- `docs/ecl-49-support-ops-runbooks-plan.md`
- `docs/ecl-50-finance-ops-plan.md`
- `docs/ecl-31-production-deployment-operations-plan.md`
- `docs/ecl-30-phase-1g-qa-launch-readiness-test-plan.md`
- `src/lib/promotions.ts`
- `src/pages/deals.tsx`
- `src/pages/admin/promotions.tsx`

## Owner Matrix

| Area | Primary owner | Backup / approver | Required output |
| --- | --- | --- | --- |
| Campaign readiness | Operations Manager | COO / Product owner | Go/no-go checklist signed before launch. |
| Seller invitation | Operations Manager | Content Manager | Approved seller invitation list and deadline calendar. |
| Product moderation | Admin/Ops | Trust Lead | Approved SKU list with image, stock, price and claim checks. |
| Discount controls | Marketing Ops | Finance Manager | Voucher, bundle, flash deal and featured placement rules. |
| Buyer copy | Content Manager | Operations Manager | Campaign copy that avoids unsupported delivery/refund/payout promises. |
| Checkout/order QA | QA | Engineering | Smoke evidence for deals, cart, checkout, orders and role access. |
| Support readiness | Support Lead | Operations Manager | Return/support routing, escalation owner and buyer/seller response path. |
| Finance readiness | Finance Manager | Operations Manager | Manual payment, refund, payout-hold and reconciliation checklist. |
| Analytics | Engineering/Data | Marketing Ops | Event checklist and daily campaign report fields. |
| Incident / pause decision | Operations Manager | CEO/COO | Pause/resume log with reason, owner and next review time. |

## Launch Readiness Checklist

### Seller Readiness

| Check | Pass rule | Owner | Evidence |
| --- | --- | --- | --- |
| Seller approved | Seller status is approved and not suspended/restricted. | Ops | Admin seller record or export. |
| Store profile complete | Business name, public seller profile, support contact and return address are present. | Ops | Seller profile review. |
| Account health acceptable | Seller is Healthy or Watch with no open high-severity support, fraud, KYC or payout blocker. | Ops/Support | Account health note. |
| Fulfillment capacity confirmed | Seller confirms stock, shipment handling and response SLA for campaign dates. | Ops | Seller confirmation message. |
| Payout/payment messaging reviewed | Seller-facing payout/payment expectations match Finance-approved MVP wording. | Finance/Ops | Approved seller FAQ or note. |
| Campaign terms accepted | Seller accepts deal period, discount, stock, cancellation and support obligations. | Ops | Seller invitation response or campaign request. |

Minimum seller gate:

- 10-25 approved sellers for private beta, or a smaller CEO/COO-approved cohort if the launch is intentionally narrow.
- No seller in the campaign has unresolved Critical/High trust, KYC, fraud, payout or fulfillment blockers.

### Product Readiness

| Check | Pass rule | Owner | Evidence |
| --- | --- | --- | --- |
| Product approved | Product status is approved before it appears in Grand Opening Deals. | Product Moderation | Admin product record. |
| Inventory verified | Stock is greater than zero and seller confirms launch quantity. | Ops/Seller | SKU stock export and seller confirmation. |
| Pricing verified | Deal price, compare-at price and discount percent are internally consistent. | Marketing Ops/Finance | Promotion request or price review. |
| Image quality approved | Primary image is product-specific, clear and not misleading. | Product Moderation | Product image review. |
| Claim review passed | Copy avoids unverifiable claims such as fastest delivery, guaranteed refund or guaranteed availability. | Content/Ops | Campaign copy review. |
| Return/support policy clear | Product category has approved return/support handling before promotion. | Support/Ops | Policy note or support SOP link. |
| Category fit confirmed | Product belongs to a launch category with enough supply depth for promotion. | Ops | Category SKU count. |

Minimum product gate:

- Each promoted category should have at least 20 approved live SKUs before buyer demand is scaled.
- Each promoted SKU must have a named seller, approved product state, visible stock, valid price/discount and clear support/return handling.
- Storewide promotions can be approved only when all included products meet the same seller, status, stock and policy checks.

### Promotion Controls

Allowed launch offer types:

| Offer type | Launch use | Approval notes |
| --- | --- | --- |
| Seller voucher | P0 | Seller-funded or approved discount with min order and max discount caps. |
| Bundle deal | P1 | Use only when bundle products have verified stock and compatible return handling. |
| Flash deal | P1 | Use for short windows only after stock and checkout smoke pass. |
| Free shipping | P1 | Finance must confirm who pays shipping and whether any minimum order applies. |
| Featured placement | P1 | Product must pass image, stock, seller health and category-fit checks. |
| Seller program / campaign deal | P1 | Use for admin-curated groups after product list is locked. |

Promotion setup rules:

- Record seller, product or store scope for every request.
- Record start and end time before approval.
- Record discount type, discount value, min order, max discount and budget where applicable.
- Finance reviews discounts that affect platform margin, shipping subsidy, payout or commission treatment.
- Admin note must state why the offer is approved or rejected.
- Rejected requests include a clear seller-facing reason and a resubmission path when appropriate.

## Seller Invitation Workflow

### Timeline

| Relative day | Action | Owner |
| --- | --- | --- |
| T-10 to T-7 | Build approved seller shortlist from active categories and account health. | Ops |
| T-7 | Send Grand Opening Deals invitation with offer types, rules and deadlines. | Ops/Content |
| T-5 | First reminder to sellers without submitted offers. | Ops |
| T-4 | Close priority submission window for launch-day placement. | Ops |
| T-3 | Review submitted offers, request repairs and reject unsafe claims. | Ops/Moderation |
| T-2 | Lock launch SKU list and promotional copy. | Ops/Marketing |
| T-1 | Run final QA smoke, support/finance check and go/no-go review. | QA/Ops/Finance/Support |
| Launch day | Activate approved deals only; monitor hourly for first 6 hours. | Ops |
| T+1 | Send seller performance nudge and collect fulfillment issues. | Ops |

### Invitation Content Requirements

Seller invitations must include:

- Campaign name and intended launch dates.
- Eligible offer types: vouchers, bundles, flash deals, free shipping and featured placement consideration.
- Submission deadline and review SLA.
- Product readiness rules: approved products only, verified stock, clear images, accurate pricing and supportable claims.
- Seller obligations: respond to support/escalations, honor approved discounts, avoid stock-outs, disclose fulfillment constraints.
- Finance language: payout/payment handling follows Mercato's approved finance workflow; no instant payout promise.
- Operations pause language: Mercato may pause a seller deal for stock, policy, support, quality or checkout risk.

## Internal Approval Workflow

1. Ops builds campaign candidate list from approved sellers, approved products and priority categories.
2. Ops sends seller invitation and records seller responses.
3. Seller submits campaign request or confirms the requested offer.
4. Product moderation checks product status, image quality, category fit, stock and claims.
5. Finance checks discount economics, shipping subsidy, payout implications and refund exposure.
6. Support checks category return/support handling and open seller cases.
7. Marketing/Content checks buyer-facing copy against trust-first claims and ECL-48 positioning.
8. QA checks deal page visibility, cart/checkout totals, promotion application and order creation on the selected release candidate.
9. Ops signs the go/no-go record and activates only approved or active promotion requests.
10. Ops monitors performance, support issues, stock and checkout failures during launch.

Approval status rules:

- `pending`: seller request received but not launch-ready.
- `approved`: operations has accepted the deal, but activation time has not started or QA/launch gate is pending.
- `active`: deal is live and monitored.
- `rejected`: seller, product, finance, support or claim gate failed.
- `ended`: deal is complete or manually stopped.

## Pause Criteria

Pause a product deal immediately when:

- Product becomes out of stock or stock cannot be trusted.
- Product status is not approved.
- Product image, title, price or discount is misleading.
- Seller disputes the approved offer or cannot honor fulfillment.
- Support identifies a return, safety, restricted product or buyer harm issue.

Pause a seller from campaign participation when:

- Seller approval is revoked, suspended or incomplete.
- Seller approval SLA/backlog exceeds 48 hours for pending launch sellers.
- Product moderation SLA/backlog exceeds 72 hours.
- Seller has unresolved Critical/High support, dispute, fraud, KYC or payout blocker.
- Seller-fault cancellation or stock-out pattern threatens buyer trust.

Pause a category or acquisition channel when:

- Promoted category has fewer than 20 approved live SKUs.
- Checkout/order creation, payment confirmation or cart promotion calculation is unreliable.
- Support, return or order tracking paths are incomplete or misleading.
- Paid traffic has spend but no verified order or seller-application signal.
- Category supply, pricing or imagery is too weak for public promotion.

Pause the whole campaign when:

- Any Critical issue appears in checkout, order creation, admin access, seller fulfillment, database, role access or production availability.
- Finance cannot reconcile payment/COD, commission, refund exposure or payout hold for campaign orders.
- Support cannot locate order, seller, payment or return context for campaign cases.
- Monitoring/backup/incident owners are missing for launch traffic.

Resume only after the owner records cause, fix/workaround, verification evidence and next monitor checkpoint.

## First 30-Day Operating Cadence

### Daily During Launch Week

Use this update format:

```text
Status: green/yellow/red
Live sellers:
Live deal SKUs:
Approved SKUs by category:
Seller invites sent / accepted / pending:
Promotion requests pending / approved / active / rejected:
Traffic and orders:
Checkout or payment issues:
Support tickets and SLA risk:
Stock-outs or seller fulfillment risk:
Finance reconciliation notes:
Paused deals/categories:
Decisions needed:
Next 24-hour action:
```

Daily owner actions:

- Ops reviews seller response, stock-outs, campaign request queue and paused deals.
- Support reviews campaign-related tickets, returns, buyer complaints and seller responsiveness.
- Finance reviews order/payment status, manual refund exposure, payout holds and discount/shipping cost.
- Marketing reviews category/deal performance and keeps paid spend capped until checkout/payment proof is verified.
- QA/Engineering reviews any Critical/High defects and confirms whether launch can continue.

### Weekly Cadence

| Day range | Operating focus | Required decision |
| --- | --- | --- |
| Days 1-7 | Foundation and soft launch readiness. | Confirm vendor kit, trust pages, seller SLA and category SKU depth. |
| Days 8-14 | Launch campaign activation. | Activate only approved Grand Opening Deals and seller invitations. |
| Days 15-21 | Scale what converts. | Increase only categories/channels with supply, conversion and support evidence. |
| Days 22-30 | Optimize Month 2. | Keep winners, pause weak categories and create follow-up issues for blockers. |

## Metrics To Track

Campaign operations:

- Approved sellers invited.
- Seller invitation acceptance rate.
- Promotion requests by type and status.
- Approved live deal SKUs by category.
- Products rejected for stock, image, claim, seller health or return/support policy.
- Product moderation backlog age.
- Seller approval backlog age.
- Paused deals and pause reasons.

Buyer and conversion:

- Deal page views.
- Product views from deals.
- Add-to-cart from deals.
- Checkout starts from deals.
- Orders from deals.
- Promotion discount amount and shipping discount amount.
- Checkout/payment/order creation failure count.

Support and finance:

- Campaign support tickets by severity.
- Return/refund/dispute cases tied to campaign products.
- Seller-fault cancellation count.
- Manual refund exposure.
- COD/payment reconciliation exceptions.
- Payout holds caused by campaign returns, disputes or stock-outs.

## Go/No-Go Checklist

Mark `GO` only when:

- Approved seller list is locked.
- Approved product list is locked.
- Each promoted category has enough approved SKUs or CEO/COO has accepted the narrower launch.
- Campaign copy and seller invitations avoid unsupported promises.
- Promotion requests are approved with start/end time, discount rules and admin notes.
- QA has smoke-tested deals, cart, checkout, orders and role access on the selected release candidate.
- Support has return/support escalation owners and response path.
- Finance has manual payment, refund, payout-hold and reconciliation owner.
- Operations has pause/resume authority and daily cadence owner.

Mark `NO-GO` when any Critical/High gate remains unresolved in seller approval, product moderation, checkout/order creation, support readiness, finance reconciliation, role access, production monitoring or policy clarity.

## Final Recommendation

ECL-68 is complete as an operational checklist. Grand Opening Deals can move to execution only after the launch owner runs this checklist against the live seller/product set, attaches QA/support/finance evidence and records a campaign go/no-go decision.
