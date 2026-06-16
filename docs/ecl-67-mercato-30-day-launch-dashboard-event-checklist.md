# ECL-67 Mercato 30-Day Launch Dashboard And Event Checklist

Date: 2026-06-16
Issue: ECL-67
Scope: Analytics specification for Mercato launch measurement, event instrumentation, QA checks, alerting and 30-day operating cadence.
Owner: Data Analyst

## Objective

Mercato needs a launch analytics layer that lets leadership, growth, operations, seller success and engineering see whether the first 30 days are creating reliable marketplace liquidity without scaling into operational risk.

The dashboard should answer five questions every day:

1. Are qualified buyers reaching approved products and starting checkout?
2. Are orders completing with reliable payment/order confirmation?
3. Are approved sellers getting products live and participating in campaigns?
4. Are support, returns, approval queues or payment proof issues creating launch risk?
5. Which channels, categories and seller cohorts should receive more or less demand in the next 24-72 hours?

## Current Analytics Baseline

Verified repository signals:

- `posthog-js` is installed and initialized in `src/lib/analytics.ts`.
- Existing client helpers cover page views, product views, add/remove cart, checkout start, order completion, wishlist, search, review submission, seller registration, product listing and generic events.
- `src/pages/api/marketing/track.ts` records sponsored campaign impression, click and conversion events into `marketing_ad_events`.
- The app has launch-critical buyer, seller and admin surfaces for homepage, categories, products, search, cart, checkout, orders, public tracking, seller registration, seller products, seller analytics, seller marketing, admin reports, admin sellers, admin products, admin orders, admin payments, admin promotions, admin support and admin returns.
- Existing ECL-33 and ECL-48 plans already require tracking for buyer funnel, seller funnel, launch campaigns and channel performance before paid demand scales.

Primary gap:

The current event set is a useful starting point, but it is not yet a complete launch measurement contract. Event names are not normalized across all launch paths, several funnel steps lack required properties, server-side order/payment/approval events are not specified, and no 30-day launch dashboard operating view exists.

## Dashboard Structure

Build one launch dashboard with six tabs. Use PostHog, warehouse SQL, or the existing admin reports stack as the backing implementation, but keep the metric definitions below as the source of truth.

### 1. Executive Launch Pulse

Purpose: daily decision view for whether to scale, hold or pause launch channels.

Required cards:

| Metric | Definition | Target/Guardrail | Grain |
| --- | --- | --- | --- |
| Net orders | Orders completed minus cancelled/refunded orders | Upward trend after day 7 | Daily, 7-day |
| Net GMV | Order merchandise value minus refunds/cancellations | Upward trend after day 7 | Daily, 7-day |
| Checkout completion rate | `order_completed` / `checkout_started` | Investigate under 35%; pause paid under 20% | Daily, channel |
| Approved sellers live | Approved sellers with at least 1 approved live SKU | Minimum 10 for public push; category-specific for ads | Daily |
| Live approved SKUs | Approved, in-stock products by category | Minimum 20 per promoted category | Daily, category |
| Seller application approval SLA | Median time from submitted to approved/rejected | Investigate over 48h | Daily |
| Product moderation SLA | Median time from product submitted to approved/rejected | Investigate over 72h | Daily |
| Support contact rate | Support tickets per completed order | Investigate over 8%; pause scale over 15% | Daily |
| Refund/return request rate | Return or refund requests per completed order | Investigate over 5% | Daily |
| Payment proof issue rate | Payment submissions needing manual correction per completed order | Investigate over 5% | Daily |

Required filters:

- Date range: launch day, last 7 days, last 30 days.
- Channel/source/medium/campaign.
- Category.
- Seller cohort: launch cohort, organic seller, direct outreach, campaign participant.
- Buyer cohort: new buyer, returning buyer, guest, registered customer.
- Payment method.
- Device class: desktop, mobile, tablet.

### 2. Buyer Funnel

Purpose: identify where buyer demand drops or where weak supply creates bad conversion.

Funnel steps:

1. `landing_page_viewed`
2. `category_viewed` or `search_performed`
3. `product_viewed`
4. `add_to_cart`
5. `cart_viewed`
6. `checkout_started`
7. `payment_method_selected`
8. `payment_proof_submitted` or `cod_selected`
9. `order_created`
10. `order_completed`

Required breakdowns:

- Source, medium, campaign, content and term.
- Landing page path.
- Category and product.
- Seller.
- Device class and browser.
- New versus returning visitor.
- Promotion or voucher attached.

Required diagnostic views:

- Top 20 landing pages by product-view rate.
- Top 20 categories by add-to-cart rate.
- Top 20 products by cart-to-checkout rate.
- Checkout abandonment by payment method.
- Search terms with zero results.
- Products with high views and low carts.
- Products with high carts and low checkout starts.

### 3. Seller Funnel

Purpose: measure seller acquisition quality and time to live assortment.

Funnel steps:

1. `seller_landing_viewed`
2. `seller_registration_started`
3. `seller_registration_submitted`
4. `seller_application_approved` or `seller_application_rejected`
5. `seller_store_profile_completed`
6. `seller_product_draft_created`
7. `seller_product_submitted`
8. `seller_product_approved` or `seller_product_rejected`
9. `seller_first_product_live`
10. `seller_campaign_request_submitted`
11. `seller_first_order_received`

Required cards:

- Applications by source and category focus.
- Approval rate by source.
- Median application approval time.
- Approved sellers with no products after 48h.
- Product rejection reasons.
- Median product moderation time.
- Sellers with live products but no campaign request.
- Sellers with campaigns but no orders.
- First order time from seller approval.

### 4. Channel And Campaign Performance

Purpose: allocate launch effort only to channels with verified supply and operational readiness.

Required cards:

- Sessions, product views, carts, checkouts, orders and GMV by channel.
- Cost, CPC, CTR, cost per checkout start, cost per order and cost per approved seller where cost exists.
- Sponsored campaign impressions, clicks, conversions, spend and revenue from `marketing_ad_events`.
- Campaign products with out-of-stock, rejected or seller-not-approved status.
- Retargeting audience size for product viewers and cart abandoners.
- Email sends, opens, clicks, unsubscribes and attributed actions when email tooling is connected.

Pause rules:

- Pause paid buyer acquisition for any category with fewer than 20 approved in-stock SKUs.
- Pause campaigns if checkout completion falls below 20% for two consecutive days.
- Pause campaign product promotion if product rejection, stockout or seller approval status changes.
- Pause seller acquisition spend if approval SLA exceeds 48h for two consecutive days.

### 5. Operations And Trust

Purpose: surface launch risks before they damage buyers, sellers or finance.

Required cards:

- Order creation errors.
- Payment proof submissions pending review.
- Payment proof rejections or correction requests.
- COD orders awaiting confirmation if COD is active.
- Orders pending seller fulfillment over SLA.
- Orders shipped, delivered and delayed.
- Tracking lookup success and failure rates.
- Return/refund requests opened, approved, rejected and pending.
- Support tickets opened by topic, category, seller and order status.
- Admin moderation backlog by queue age.

Risk thresholds:

| Signal | Investigate | Pause/Block Scale |
| --- | --- | --- |
| Order API error rate | Over 1% of checkout attempts | Over 3% for 2 hours |
| Payment proof pending age | Median over 24h | P90 over 48h |
| Seller fulfillment pending | Over 10% of paid orders beyond SLA | Over 20% beyond SLA |
| Support ticket rate | Over 8% of orders | Over 15% of orders |
| Return/refund request rate | Over 5% of orders | Over 10% of orders |
| Product moderation SLA | Median over 72h | P90 over 5 days |

### 6. Data Quality And Instrumentation Health

Purpose: make the dashboard trustworthy enough for daily launch decisions.

Required cards:

- Events received by event name over the last 24 hours.
- Events missing required IDs.
- Duplicate order completion events by order ID.
- Client checkout events without matching server order event.
- Server order events without matching client checkout event.
- Unknown/null UTM source share.
- Anonymous-to-identified merge rate after login/register.
- Event ingestion latency.

Data quality guardrails:

- Fewer than 2% of launch-critical events may be missing `session_id`, `user_id` or `anonymous_id`.
- Fewer than 1% of order events may be missing `order_id`.
- Fewer than 5% of channel-attributed sessions may have unknown source after excluding direct traffic.
- Duplicate `order_completed` events must be below 0.5% of orders and deduplicated by `order_id`.

## Event Naming Standards

Use lowercase snake_case names. Keep event names verb-past-tense where possible.

Required common properties on every event:

| Property | Description |
| --- | --- |
| `event_version` | Version string, start with `1.0`. |
| `occurred_at` | ISO timestamp generated at capture time. |
| `environment` | `production`, `staging`, `development`. |
| `session_id` | Browser/session identifier. |
| `anonymous_id` | Pre-login anonymous visitor identifier where available. |
| `user_id` | Authenticated customer/admin/seller user id where available. |
| `role` | `guest`, `customer`, `seller`, `admin`, `system`. |
| `page_path` | Current route/path. |
| `referrer` | Browser referrer where available. |
| `utm_source` | Campaign source. |
| `utm_medium` | Campaign medium. |
| `utm_campaign` | Campaign name. |
| `utm_content` | Campaign content/creative. |
| `utm_term` | Search/ad term. |
| `device_type` | `desktop`, `mobile`, `tablet`, `unknown`. |

Required commerce properties where relevant:

| Property | Description |
| --- | --- |
| `product_id` | Product id. |
| `product_name` | Product title at event time. |
| `category_id` | Category id. |
| `category_name` | Category display name. |
| `seller_id` | Seller/vendor id. |
| `seller_status` | Seller approval state at event time. |
| `price` | Unit price at event time. |
| `quantity` | Item quantity. |
| `cart_id` | Cart id where available. |
| `cart_value` | Cart merchandise value. |
| `discount_value` | Applied discount amount. |
| `promotion_id` | Promotion/campaign id where applicable. |
| `payment_method` | `cod`, `manual_proof`, `stripe`, `unknown`. |
| `order_id` | Internal order id. |
| `order_number` | Buyer-visible order number. |
| `order_value` | Order total. |
| `currency` | Currency code. |

## Required Event Checklist

### Buyer Discovery

| Event | Trigger | Required Properties | Priority |
| --- | --- | --- | --- |
| `landing_page_viewed` | Homepage, deals page, category landing, seller landing or campaign landing loaded | `landing_type`, `page_path`, UTM fields | P0 |
| `category_viewed` | Category page loaded | `category_id`, `category_name`, `product_count`, `sort`, `filters` | P0 |
| `search_performed` | Search submitted | `query`, `result_count`, `filters`, `sort` | P0 |
| `search_result_clicked` | Search result product clicked | `query`, `position`, `product_id`, `category_id`, `seller_id` | P1 |
| `product_viewed` | Product detail page loaded | `product_id`, `category_id`, `seller_id`, `price`, `stock_status`, `promotion_id` | P0 |
| `seller_store_viewed` | Public seller page loaded | `seller_id`, `seller_status`, `product_count` | P1 |
| `deal_collection_viewed` | Deals or campaign collection loaded | `promotion_id`, `collection_name`, `product_count` | P1 |

### Buyer Conversion

| Event | Trigger | Required Properties | Priority |
| --- | --- | --- | --- |
| `add_to_cart` | Product added to cart | `product_id`, `seller_id`, `price`, `quantity`, `cart_id`, `cart_value` | P0 |
| `remove_from_cart` | Product removed from cart | `product_id`, `seller_id`, `price`, `quantity`, `cart_id`, `cart_value` | P1 |
| `cart_viewed` | Cart page or drawer opened | `cart_id`, `items_count`, `cart_value`, `seller_count` | P0 |
| `checkout_started` | Checkout page entered from cart | `cart_id`, `items_count`, `cart_value`, `seller_count` | P0 |
| `checkout_address_submitted` | Buyer submits shipping/contact information | `cart_id`, `has_saved_address`, `shipping_region` | P1 |
| `payment_method_selected` | Buyer chooses payment method | `cart_id`, `payment_method`, `cart_value` | P0 |
| `payment_proof_submitted` | Manual payment proof/reference submitted | `order_id`, `payment_method`, `proof_type`, `order_value` | P0 |
| `cod_selected` | COD selected where active | `cart_id`, `order_value`, `shipping_region` | P0 |
| `order_created` | Server creates order successfully | `order_id`, `order_number`, `order_value`, `payment_method`, `seller_count`, `items_count` | P0 server |
| `order_completed` | Buyer reaches confirmed order state or server confirms paid/accepted order | `order_id`, `order_number`, `order_value`, `payment_method`, `seller_count`, `items_count` | P0 server/client deduped |
| `checkout_failed` | Checkout API or validation failure | `cart_id`, `failure_stage`, `error_code`, `payment_method` | P0 |

### Buyer Retention And Trust

| Event | Trigger | Required Properties | Priority |
| --- | --- | --- | --- |
| `wishlist_added` | Product added to wishlist | `product_id`, `seller_id`, `category_id`, `price` | P1 |
| `wishlist_removed` | Product removed from wishlist | `product_id`, `seller_id`, `category_id` | P2 |
| `order_tracking_searched` | Public tracking form submitted | `tracking_result`, `order_number_present`, `email_present` | P1 |
| `support_ticket_created` | Buyer or seller creates support ticket | `ticket_id`, `topic`, `order_id`, `seller_id`, `role` | P0 server |
| `return_request_created` | Buyer opens return/refund request | `return_request_id`, `order_id`, `product_id`, `seller_id`, `reason` | P0 server |
| `review_submitted` | Product review submitted | `product_id`, `seller_id`, `rating`, `order_id` | P1 |

### Seller Acquisition And Activation

| Event | Trigger | Required Properties | Priority |
| --- | --- | --- | --- |
| `seller_landing_viewed` | Seller page loaded | `page_path`, UTM fields | P0 |
| `seller_registration_started` | Seller begins registration form | `source`, `category_interest` | P0 |
| `seller_registration_submitted` | Seller submits application | `seller_id`, `business_type`, `category_interest`, `source` | P0 server |
| `seller_application_approved` | Admin approves seller | `seller_id`, `reviewer_id`, `approval_time_hours` | P0 server |
| `seller_application_rejected` | Admin rejects seller | `seller_id`, `reviewer_id`, `reason`, `approval_time_hours` | P0 server |
| `seller_store_profile_completed` | Seller completes store profile essentials | `seller_id`, `has_logo`, `has_description`, `has_payout_info` | P1 |
| `seller_product_draft_created` | Seller starts product creation | `seller_id`, `category_id` | P1 |
| `seller_product_submitted` | Seller submits product for review | `seller_id`, `product_id`, `category_id`, `price`, `stock_quantity` | P0 server |
| `seller_product_approved` | Admin approves product | `seller_id`, `product_id`, `category_id`, `reviewer_id`, `moderation_time_hours` | P0 server |
| `seller_product_rejected` | Admin rejects product | `seller_id`, `product_id`, `category_id`, `reason`, `moderation_time_hours` | P0 server |
| `seller_first_product_live` | Seller reaches first approved in-stock product | `seller_id`, `product_id`, `category_id`, `days_since_approval` | P0 server |
| `seller_campaign_request_submitted` | Seller requests campaign/promotion | `seller_id`, `promotion_type`, `product_count` | P1 server |
| `seller_first_order_received` | First order item assigned to seller | `seller_id`, `order_id`, `days_since_first_product_live` | P0 server |

### Admin And Operations

| Event | Trigger | Required Properties | Priority |
| --- | --- | --- | --- |
| `admin_queue_viewed` | Admin opens seller/product/order/payment/return/support queue | `queue_type`, `open_count`, `oldest_age_hours` | P2 |
| `payment_review_completed` | Admin approves/rejects payment proof | `payment_id`, `order_id`, `decision`, `reviewer_id`, `review_time_hours` | P0 server |
| `order_status_changed` | Admin or seller changes order status | `order_id`, `seller_id`, `previous_status`, `new_status`, `actor_role` | P0 server |
| `fulfillment_tracking_added` | Seller/admin adds tracking number | `order_id`, `seller_id`, `carrier`, `actor_role` | P1 server |
| `support_ticket_status_changed` | Ticket status changes | `ticket_id`, `previous_status`, `new_status`, `actor_role` | P1 server |
| `return_request_status_changed` | Return/refund status changes | `return_request_id`, `order_id`, `previous_status`, `new_status`, `actor_role` | P0 server |
| `promotion_status_changed` | Admin approves/rejects/pauses promotion | `promotion_id`, `seller_id`, `previous_status`, `new_status`, `reason` | P1 server |

## Dashboard Metric Definitions

Use these formulas consistently across dashboard tabs.

| Metric | Formula |
| --- | --- |
| Product view rate | `product_viewed` / `landing_page_viewed` |
| Add-to-cart rate | `add_to_cart` / `product_viewed` |
| Cart start rate | `cart_viewed` / `add_to_cart` visitors |
| Checkout start rate | `checkout_started` / `cart_viewed` |
| Checkout completion rate | `order_completed` / `checkout_started` |
| Order creation failure rate | `checkout_failed` / (`checkout_started` + `checkout_failed`) |
| Seller application conversion | `seller_registration_submitted` / `seller_registration_started` |
| Seller approval rate | `seller_application_approved` / `seller_registration_submitted` |
| Seller activation rate | Sellers with `seller_first_product_live` / approved sellers |
| Product approval rate | `seller_product_approved` / `seller_product_submitted` |
| Campaign participation rate | Sellers with `seller_campaign_request_submitted` / approved sellers with live products |
| Support contact rate | Support tickets with order id / completed orders |
| Return request rate | Return requests / completed orders |
| Payment proof issue rate | Rejected or correction-needed payment reviews / payment proof submissions |

Deduplication rules:

- Deduplicate `order_created` and `order_completed` by `order_id`.
- Deduplicate seller first milestones by `seller_id`.
- Deduplicate product approval milestones by `product_id` and current approval cycle if product resubmission exists.
- Count anonymous buyer events by `anonymous_id` until login/registration, then merge using analytics identify calls.

## Implementation Requirements

### Client-Side Tracking

- Keep `src/lib/analytics.ts` as the client wrapper, but standardize event names and properties before expanding usage.
- Capture manual page views once per route change and include route, UTM fields and user role.
- Add event calls to homepage/deals/category/search/product/cart/checkout/wishlist/order tracking/seller registration flows.
- Persist UTM fields from first touch and expose both first-touch and last-touch values where feasible.
- Identify users after login/register and set stable user properties: role, seller_id, seller_status and customer lifecycle stage where known.

### Server-Side Tracking

Server events are required for any event that affects money, approval, moderation or support truth.

Implement server-side capture for:

- `order_created`
- `order_completed`
- `checkout_failed`
- `seller_registration_submitted`
- `seller_application_approved`
- `seller_application_rejected`
- `seller_product_submitted`
- `seller_product_approved`
- `seller_product_rejected`
- `seller_first_product_live`
- `seller_first_order_received`
- `payment_review_completed`
- `support_ticket_created`
- `return_request_created`
- `return_request_status_changed`
- `order_status_changed`

Server-side events should include an idempotency key such as `event_name:entity_id:state:timestamp_bucket` or a domain-specific event id so retries do not inflate metrics.

### Marketing Event Alignment

The existing `marketing_ad_events` table should remain the source for sponsored campaign impression, click and conversion economics. The launch dashboard should join or mirror those records into the broader event model with these mappings:

| Existing Type | Launch Event Mapping |
| --- | --- |
| `impression` | `sponsored_product_impression` |
| `click` | `sponsored_product_clicked` |
| `conversion` | `sponsored_product_converted` |

Required shared properties:

- `campaign_id`
- `product_id`
- `seller_id`
- `event_type`
- `cost`
- `revenue`
- `source`
- `placement`

## 30-Day Operating Cadence

### Days 0-2: Instrumentation Validation

Daily actions:

- Confirm P0 client events are visible in analytics.
- Confirm server order/seller/product/payment events are captured or logged for backfill.
- Run test buyer path: landing page, product view, cart, checkout, payment method, order.
- Run test seller path: registration, approval, product submit, product approval.
- Confirm dashboard filters work for source, category, seller and device.

Exit criteria:

- P0 buyer funnel events are received with required IDs.
- P0 seller funnel events are received with required IDs.
- At least one test order appears once in order metrics.
- At least one seller approval and one product approval appear in seller metrics.

### Days 3-7: Soft Launch Baseline

Daily actions:

- Review Executive Launch Pulse every morning.
- Review product-view-to-cart and checkout-start-to-order drop-offs.
- Watch seller/product approval SLA.
- Check unknown UTM share and missing ID rates.
- Flag categories with poor supply before any promotion.

Decision rules:

- Do not scale paid buyer spend until checkout completion and payment proof review are stable.
- Do not scale seller acquisition if approval queue age exceeds 48h.
- Promote only categories with at least 20 approved in-stock SKUs.

### Days 8-14: Campaign Activation

Daily actions:

- Review channel/campaign tab by source and category.
- Compare campaign products against stock, approval and seller status.
- Track cost per checkout start and cost per completed order for any paid tests.
- Track seller campaign request volume and product approval backlog.

Decision rules:

- Increase budget only for channels with product-view, cart and checkout signal.
- Pause campaigns where operational trust signals cross thresholds.
- Send seller activation nudges to approved sellers with no products after 48h.

### Days 15-21: Scale Proven Segments

Daily actions:

- Identify top converting categories and products by source.
- Review products with high views and low carts for price/image/listing quality issues.
- Review carts with no checkout start for shipping/payment friction.
- Review support and return reasons by seller/category.

Decision rules:

- Scale channels only if supply, checkout, support and payment review stay within guardrails.
- Create follow-up issues for category supply gaps, listing quality issues or checkout errors.

### Days 22-30: Month 2 Planning

Daily actions:

- Build launch report from dashboard exports.
- Identify channel/category/seller combinations for Month 2.
- List operational bottlenecks by severity and owner.
- Reconcile analytics totals against orders, payments and admin reports.

Exit deliverables:

- 30-day launch KPI summary.
- Month 2 channel allocation recommendation.
- Seller activation cohort report.
- Data quality exception list.
- Engineering backlog for missing or unreliable events.

## QA Checklist

Before dashboard launch:

- Verify every P0 event fires once and only once for a normal happy path.
- Verify required properties exist and use stable IDs.
- Verify failed checkout emits `checkout_failed` with non-sensitive error details.
- Verify manual payment proof flow emits submission and review outcome.
- Verify seller approval/rejection and product approval/rejection events are server-side.
- Verify anonymous user becomes identified after login/register without losing pre-login funnel.
- Verify UTM parameters persist from landing page through checkout.
- Verify dashboard totals match database order counts for a 24-hour sample.
- Verify no payment proof URLs, addresses, phone numbers, emails or other sensitive values are sent as analytics properties unless explicitly approved.

Post-launch daily QA:

- Check event volume by event name.
- Check missing required IDs.
- Check duplicate orders.
- Check unknown channel share.
- Compare order_completed count with database completed/accepted order count.
- Compare seller_application_approved count with admin seller status changes.

## Privacy And Compliance Constraints

- Do not send raw email addresses, phone numbers, street addresses, payment proof URLs, uploaded documents, government IDs, bank details or support message bodies into product analytics.
- Use internal IDs for joining. Hash only if required by the analytics provider and approved by engineering/security.
- Keep payment and finance analytics focused on status, method, amounts and timing. Do not send card, bank or document data.
- Support and return analytics should use controlled reason codes and topic labels, not free-text descriptions.

## Ownership

| Area | Owner | Responsibility |
| --- | --- | --- |
| Dashboard definitions | Data Analyst | Metric definitions, dashboard layout, QA checklist, daily review cadence |
| Client event wiring | Engineering | Browser event calls, UTM persistence, identify/alias behavior |
| Server event wiring | Engineering | Order, payment, seller, product, support and return truth events |
| Dashboard implementation | Data/Engineering | PostHog/SQL dashboard, filters, alerts and exports |
| Daily launch review | Growth/Ops/Data | Interpret metrics, recommend scale/pause decisions |
| Queue SLA interpretation | Operations | Seller approval, product moderation, support and payment review thresholds |
| Campaign economics | Marketing/Data | Channel cost, campaign performance and allocation recommendations |

## Recommended Implementation Child Issues

1. Wire P0 client launch events and normalize `src/lib/analytics.ts` event names/properties.
2. Add server-side analytics capture for order, checkout failure, payment review, seller approval, product moderation, support and return lifecycle events.
3. Build the six-tab Mercato 30-day launch dashboard with filters, deduplication and data quality cards.
4. Add launch analytics QA script/checklist execution before any paid demand scale-up.
5. Add alerting for checkout failure rate, seller/product SLA breach, support rate, return rate and missing critical event properties.

## Acceptance Criteria

- The dashboard specification defines executive, buyer, seller, channel, operations and data quality views.
- P0 event names, triggers, required properties and server/client ownership are specified.
- Launch metric formulas, deduplication rules and guardrail thresholds are documented.
- A 30-day analytics operating cadence is documented with daily actions and scale/pause rules.
- QA and privacy requirements are explicit enough for engineering and data implementation.

## Disposition

ECL-67 is complete as an analytics specification. Implementation should proceed through the child issues above or equivalent engineering/data execution tickets, with paid launch scaling gated on P0 event QA and dashboard data quality checks.
