# ECL-66 Mercato Launch Lifecycle Messaging Specifications

Date: 2026-06-16
Issue: ECL-66
Project: Multivendor Website / Mercato marketplace
Owner: Customer Support Manager
Source plan: ECL-48 approved launch marketing plan, revision `45ac8a7d-1c5e-4200-9ae6-a9e652399884`

## Objective

Define implementation-ready lifecycle messaging specifications for Mercato launch readiness across buyers and sellers. The specifications are built for conservative launch operations: approved sellers, reviewed products, clear support paths, no unsupported payment or payout promises, and controlled marketing opt-in.

Primary launch positioning to preserve:

`Mercato helps shoppers discover deals from approved sellers with order tracking, returns and support built into the marketplace.`

Seller-facing positioning to preserve:

`Mercato gives growing retailers a managed storefront, product approval path, campaign tools and order/finance workflows in one Seller Center.`

## Source-Of-Truth Inputs

Repository and planning inputs reviewed:

- `docs/ecl-48-mercato-launch-positioning-funnel-vendor-kit-channel-plan.md`
- `docs/ecl-47-mercato-vendor-pipeline-onboarding-playbook.md`
- `docs/ecl-49-support-ops-runbooks-plan.md`
- `docs/ecl-50-finance-ops-plan.md`
- `docs/ecl-33-launch-growth-content-plan.md`
- `src/lib/email.ts`
- Existing buyer, seller, support, returns, order, wishlist, promotion and Seller Center pages under `src/pages`

Current implementation signal:

- `src/lib/email.ts` already has transactional email helpers for order confirmation, seller approval/rejection, payout notifications and new seller orders.
- The current email helper still uses generic sender domains and some marketplace-generic copy. Launch configuration should replace those with Mercato-specific sender identities, support addresses, unsubscribe handling for marketing messages and event-driven templates.
- Production email readiness depends on a verified sender/domain, template rendering, suppression/unsubscribe handling and event triggers.

## Messaging Principles

All launch lifecycle messages must:

- Use Mercato's own trust-first marketplace language.
- State only what operations can fulfill today.
- Separate transactional notifications from marketing messages.
- Explain approval, return, support, payment and payout states plainly.
- Route buyers and sellers to the correct product surface instead of asking them to reply to no-reply mailboxes.
- Avoid competitor comparisons or marketplace lookalike claims.
- Avoid "guaranteed", "instant", "fastest", "risk-free", "always refunded" and similar absolute claims unless Product, Finance and Support have approved the policy and operational proof.

Recommended sender identities:

| Message Family | Sender | Reply Handling |
| --- | --- | --- |
| Buyer account and orders | `Mercato Orders <orders@mercato.example>` | monitored support alias or order support form |
| Buyer support and returns | `Mercato Support <support@mercato.example>` | monitored support alias |
| Buyer marketing | `Mercato Deals <deals@mercato.example>` | no direct reply required, unsubscribe required |
| Seller onboarding | `Mercato Seller Team <sellers@mercato.example>` | monitored seller support alias |
| Seller operations | `Mercato Seller Operations <seller-ops@mercato.example>` | monitored seller operations alias |
| Seller finance | `Mercato Payouts <payouts@mercato.example>` | monitored finance/seller support alias |

Replace `mercato.example` with the approved launch domain before production.

## Channel Guidance

Email:

- Use email as the primary lifecycle channel for buyer and seller transactional messages.
- Transactional messages may be sent based on account, order, support, seller, product, campaign and finance events.
- Marketing messages require opt-in, unsubscribe link, sender identity and suppression list handling.
- Every email should include a clear subject, primary CTA, support path and the current Mercato legal footer.
- Do not send marketing content inside order, return, payout or seller approval messages unless Legal/Product approves the mixed-purpose template.

WhatsApp / DM:

- Use WhatsApp or DM only for opted-in support, seller onboarding, seller document follow-up and seller campaign coordination.
- Do not use WhatsApp/DM for broad buyer marketing unless the buyer explicitly opted in to that channel.
- Include a lightweight opt-out phrase in non-transactional WhatsApp/DM messages, such as `Reply STOP to stop launch updates.`
- Keep WhatsApp/DM copy shorter than email and link to the relevant Mercato page or Seller Center task.
- Never request passwords, full payment card details or sensitive buyer payment information through WhatsApp/DM.

SMS:

- Not in scope for launch unless the company selects an SMS provider and confirms consent capture. Do not reuse WhatsApp copy as SMS without compliance review.

## Buyer Lifecycle Specifications

### Buyer Welcome

Purpose: confirm account creation and introduce trusted discovery paths without overstating launch supply.

Trigger/event checklist:

- `buyer_registered` after successful buyer account creation.
- Include `user_id`, `email`, `first_name`, `created_at`, `source`, `marketing_opt_in`.
- Send once per account.

Channel:

- Email transactional/account.
- Optional WhatsApp only if account signup captured WhatsApp opt-in.

Subject options:

- `Welcome to Mercato`
- `Your Mercato account is ready`

Email copy:

```text
Hi {{first_name}},

Welcome to Mercato. You can now discover products from approved sellers, save items to your wishlist and track your orders from your account.

For launch, we are keeping the marketplace focused on reviewed listings, clear deals and practical support. If you need help, visit the Help Center or contact Mercato Support from your account.

CTA: Start shopping
Secondary CTA: View help and returns
```

WhatsApp/DM copy:

```text
Welcome to Mercato, {{first_name}}. Your account is ready. You can browse approved sellers, save wishlist items and track orders from your account: {{account_url}}
```

Guardrails:

- Do not promise all categories are fully stocked.
- Do not imply every seller has been identity-verified unless the seller verification policy is final.
- Do not include promotional offers unless marketing opt-in exists.

### Order Updates

Purpose: keep buyers informed from order creation through payment review, fulfillment, dispatch, delivery or cancellation.

Trigger/event checklist:

- `order_created`
- `payment_pending_review`
- `payment_confirmed`
- `order_processing`
- `order_partially_dispatched`
- `order_dispatched`
- `order_delivered`
- `order_cancelled`
- Include `order_id`, `order_number`, `buyer_id`, `email`, `order_total`, `currency`, `payment_method`, `payment_status`, `fulfillment_status`, `seller_count`, `items`, `tracking_url`, `support_url`.

Channel:

- Email transactional.
- In-account notification if available.
- WhatsApp only for buyer support escalation or explicit opt-in order updates.

Subject options by state:

| State | Subject |
| --- | --- |
| Created | `We received your Mercato order {{order_number}}` |
| Payment pending | `Payment review started for order {{order_number}}` |
| Payment confirmed | `Payment confirmed for order {{order_number}}` |
| Processing | `Your Mercato order is being prepared` |
| Dispatched | `Your Mercato order is on the way` |
| Delivered | `Your Mercato order was marked delivered` |
| Cancelled | `Update on your Mercato order {{order_number}}` |

Order created copy:

```text
Hi {{first_name}},

We received your Mercato order {{order_number}}.

Order total: {{currency}} {{order_total}}
Payment status: {{payment_status_label}}
Next step: {{next_step_summary}}

You can review order details, seller items and support options from your account.

CTA: Track order
Secondary CTA: Contact support
```

Payment pending copy:

```text
Hi {{first_name}},

We are reviewing the payment details for order {{order_number}}. We will update your order status after the payment is confirmed or if we need more information.

Please do not send card details or passwords by email, WhatsApp or DM. If we need payment proof, use the approved Mercato checkout or support path.

CTA: View order status
```

Dispatched copy:

```text
Hi {{first_name}},

Your Mercato order {{order_number}} has been dispatched.

Tracking: {{tracking_summary}}
Seller items: {{item_summary}}

If your order has items from more than one seller, they may arrive separately. You can follow each update from your order page.

CTA: Track order
```

Guardrails:

- Do not say payment is successful until the payment status is confirmed.
- For multi-seller orders, avoid implying every seller item has shipped when only one seller item moved.
- Do not promise delivery dates unless a delivery SLA is present for the order.
- If tracking is manual or unavailable, say `Tracking will be updated when the seller provides it.`

### Review Prompt

Purpose: request product and seller feedback after delivery while avoiding pressure or incentives that distort reviews.

Trigger/event checklist:

- `order_delivered`
- Delay: send 3 days after delivered status or after support confirms delivery, whichever is safer.
- Suppress if active return, refund, dispute, support escalation or cancellation exists.
- Include `order_id`, `order_number`, `buyer_id`, `items`, `seller_id`, `delivery_confirmed_at`, `review_url`, `support_url`.

Channel:

- Email transactional/service.
- In-account notification if available.

Subject options:

- `How was your Mercato order?`
- `Review your recent Mercato purchase`

Email copy:

```text
Hi {{first_name}},

Your Mercato order {{order_number}} was marked delivered. If everything arrived as expected, your review can help other shoppers understand the product and seller experience.

If something is wrong with the order, contact support instead so we can review the issue.

CTA: Leave a review
Secondary CTA: Get order help
```

Guardrails:

- Do not offer rewards for positive reviews.
- Do not ask for a review while a return, refund, dispute or delivery issue is open.
- Include a support path for negative order experiences.

### Wishlist / Deal Reminder

Purpose: remind opted-in buyers about saved items, price drops, back-in-stock items or launch deals.

Trigger/event checklist:

- `wishlist_item_price_dropped`
- `wishlist_item_back_in_stock`
- `wishlist_item_in_campaign`
- `buyer_deal_reminder_eligible`
- Include `buyer_id`, `email`, `marketing_opt_in`, `item_id`, `price_before`, `price_now`, `campaign_id`, `campaign_end_at`, `stock_status`, `unsubscribe_url`.

Channel:

- Email marketing or service-marketing hybrid. Treat as marketing unless strictly requested by the buyer.
- WhatsApp only with marketing opt-in for the channel.

Subject options:

- `A saved Mercato item has a new price`
- `Your saved item is part of a Mercato deal`

Email copy:

```text
Hi {{first_name}},

One of your saved Mercato items has an update:

{{product_name}}
Current price: {{currency}} {{price_now}}
Availability: {{stock_status_label}}

Deals and stock can change while sellers update inventory.

CTA: View saved item
Footer: You are receiving this because you opted in to Mercato deal updates. Unsubscribe: {{unsubscribe_url}}
```

Guardrails:

- Do not imply price lock unless checkout supports it.
- Do not show expired campaign pricing.
- Suppress if item is unapproved, seller is not approved or stock is unavailable.

### Weekly Deals Digest

Purpose: send a curated weekly launch digest to opted-in buyers using only approved sellers and approved products.

Trigger/event checklist:

- `weekly_deals_digest_scheduled`
- Include `buyer_id`, `email`, `marketing_opt_in`, `category_preferences`, `approved_products`, `approved_sellers`, `unsubscribe_url`.
- Suppress if no marketing opt-in, email bounced, user unsubscribed, or category supply is too thin.

Channel:

- Email marketing.
- WhatsApp broadcast only with explicit WhatsApp marketing opt-in and approved broadcast tooling.

Subject options:

- `This week's Mercato deals`
- `Fresh Mercato finds from approved sellers`

Email copy:

```text
Hi {{first_name}},

Here are this week's Mercato picks from approved sellers:

{{deal_block_1}}
{{deal_block_2}}
{{deal_block_3}}

Every promoted item should be approved, in stock and linked to a seller that is eligible for launch campaigns.

CTA: Shop weekly deals
Footer: You are receiving this because you opted in to Mercato marketing emails. Unsubscribe: {{unsubscribe_url}}
```

Guardrails:

- Only include products with approved product status and approved seller status.
- Do not promote categories with fewer than 20 approved live SKUs unless Product/Marketing approves the exception.
- Every digest needs a working unsubscribe link and suppression enforcement.

### Support Follow-Up

Purpose: close the loop after a support ticket receives a response or resolution.

Trigger/event checklist:

- `support_ticket_created`
- `support_ticket_first_response_sent`
- `support_ticket_resolved`
- `support_ticket_reopened`
- Include `ticket_id`, `buyer_id`, `order_id`, `category`, `priority`, `status`, `resolution_summary`, `support_url`, `sla_due_at`.

Channel:

- Email transactional/service.
- In-account notification if available.
- WhatsApp only if support conversation was opened there or buyer opted in.

Subject options:

- `Mercato Support received your request`
- `Update on your Mercato support request`
- `Your Mercato support request was marked resolved`

Email copy:

```text
Hi {{first_name}},

We updated your Mercato support request {{ticket_number}}.

Status: {{ticket_status}}
Summary: {{resolution_summary}}

If the issue is not resolved, reopen the request from your support page so the team can review it with the order details attached.

CTA: View support request
```

Guardrails:

- Do not promise a resolution before evidence and policy review are complete.
- Use SLA language from the approved support plan only.
- Do not expose seller internal notes to the buyer.

### Return Resolution Follow-Up

Purpose: notify the buyer of return, refund, replacement or rejection outcomes with clear next steps.

Trigger/event checklist:

- `return_requested`
- `return_under_review`
- `return_approved`
- `return_rejected`
- `return_item_received`
- `refund_pending`
- `refund_completed`
- `return_closed`
- Include `return_id`, `order_id`, `order_item_id`, `buyer_id`, `seller_id`, `return_reason`, `decision`, `refund_amount`, `payment_method`, `next_step`, `deadline`, `support_url`.

Channel:

- Email transactional/service.
- In-account notification if available.

Subject options:

- `Update on your Mercato return request`
- `Return decision for order {{order_number}}`
- `Refund update for order {{order_number}}`

Approved copy:

```text
Hi {{first_name}},

Your return request for order {{order_number}} has been approved.

Next step: {{return_next_step}}
Deadline: {{return_deadline}}

After the return is received and checked, Mercato will update the refund or replacement status according to the approved return policy.

CTA: View return details
```

Rejected copy:

```text
Hi {{first_name}},

We reviewed your return request for order {{order_number}} and cannot approve it based on the current return policy.

Reason: {{decision_reason}}

If you believe information is missing, contact support from the return page and include any relevant evidence.

CTA: View return decision
```

Guardrails:

- Do not say a refund has been issued until Finance/payment status confirms it.
- Do not promise refund timing without Finance approval and provider capability.
- Keep decision reasons factual and policy-based.

## Seller Lifecycle Specifications

### Registration Received

Purpose: confirm seller application receipt and set realistic approval expectations.

Trigger/event checklist:

- `seller_registration_submitted`
- Include `seller_id`, `business_name`, `contact_name`, `email`, `phone`, `category`, `submitted_at`, `application_status`, `seller_center_url`.

Channel:

- Email transactional.
- WhatsApp/DM optional for seller onboarding if opted in or if registration originated from that channel.

Subject options:

- `Mercato received your seller application`
- `Your Mercato seller application is under review`

Email copy:

```text
Hi {{contact_name}},

Mercato received the seller application for {{business_name}}.

Our team reviews seller details, product fit and launch readiness before approving stores. If we need documents, payout details or catalog updates, we will contact you through the Seller Center or the approved seller support channel.

CTA: View application status
```

WhatsApp/DM copy:

```text
Mercato received the seller application for {{business_name}}. We will review your details and contact you if documents or catalog updates are needed. Check status here: {{seller_center_url}}
```

Guardrails:

- Do not promise approval.
- Do not promise a fixed approval SLA unless Operations confirms it is active.
- Do not request sensitive documents over open DM unless Operations has approved the channel.

### Approval

Purpose: notify a seller that their account is approved and give the first activation steps.

Trigger/event checklist:

- `seller_approved`
- Include `seller_id`, `business_name`, `approval_status`, `approved_at`, `approved_categories`, `seller_center_url`, `listing_guide_url`, `support_url`.

Channel:

- Email transactional.
- Optional WhatsApp for high-touch launch cohort sellers.

Subject options:

- `Your Mercato seller account is approved`
- `{{business_name}} is approved to sell on Mercato`

Email copy:

```text
Hi {{contact_name}},

{{business_name}} has been approved to sell on Mercato.

Next steps:
1. Complete your store profile.
2. Submit launch-ready products for review.
3. Confirm stock, dispatch time and return handling for each product.
4. Watch for campaign invitations after products are approved.

Products must be reviewed before they appear publicly on Mercato.

CTA: Open Seller Center
Secondary CTA: View product listing guide
```

Guardrails:

- Approval of the seller does not mean approval of every product.
- Do not promise featured placement, traffic, sales or campaign acceptance.
- Do not say payouts are instant or automatic unless Finance confirms the workflow.

### Rejection / Missing Documents

Purpose: request missing information or communicate launch rejection with a clear correction path.

Trigger/event checklist:

- `seller_missing_documents`
- `seller_application_needs_revision`
- `seller_rejected`
- Include `seller_id`, `business_name`, `status`, `missing_items`, `reason_code`, `revision_due_at`, `seller_center_url`, `support_url`.

Channel:

- Email transactional/service.
- WhatsApp/DM optional for high-touch launch cohort document follow-up.

Subject options:

- `Mercato needs more details for your seller application`
- `Update on your Mercato seller application`

Missing documents copy:

```text
Hi {{contact_name}},

We need more information before we can continue reviewing {{business_name}} for Mercato.

Required items:
{{missing_items}}

Please upload or update these details through Seller Center. Do not send passwords, full card details or unrelated personal information by email or DM.

CTA: Complete seller details
```

Rejection copy:

```text
Hi {{contact_name}},

Thank you for applying to sell on Mercato. We cannot approve {{business_name}} for the launch cohort right now.

Reason: {{decision_reason}}

You may be reconsidered after launch if {{improvement_needed}}.

CTA: View application status
```

Guardrails:

- Use specific, non-accusatory decision reasons.
- Do not disclose internal risk scoring.
- Keep counterfeit, restricted goods and identity mismatch wording factual and escalation-safe.

### Product Submitted

Purpose: confirm product submission and set moderation expectations.

Trigger/event checklist:

- `seller_product_submitted`
- Include `seller_id`, `product_id`, `product_name`, `submitted_at`, `category`, `review_status`, `seller_center_url`.

Channel:

- Email transactional or in-app Seller Center notification.
- Batch digest preferred if seller submits many products in one session.

Subject options:

- `Mercato received your product submission`
- `{{product_name}} is queued for review`

Email copy:

```text
Hi {{contact_name}},

Mercato received your product submission: {{product_name}}.

The product will be reviewed for category fit, listing quality, images, price, stock and policy compliance before it can go live.

CTA: View product status
```

Guardrails:

- Do not imply the product is live or campaign-eligible.
- If moderation SLA is not approved, do not include a turnaround promise.
- Ask for corrections through Seller Center, not ad hoc email threads.

### Product Approved / Rejected

Purpose: notify sellers of listing review outcomes and next steps.

Trigger/event checklist:

- `seller_product_approved`
- `seller_product_rejected`
- `seller_product_needs_revision`
- Include `seller_id`, `product_id`, `product_name`, `status`, `decision_reason`, `required_changes`, `product_url`, `seller_center_url`, `campaign_eligibility`.

Channel:

- Email transactional or Seller Center notification.
- Batch product review digest if many products are reviewed together.

Approved subject:

- `{{product_name}} is approved on Mercato`

Rejected/revision subject:

- `Product review update: {{product_name}}`

Approved copy:

```text
Hi {{contact_name}},

{{product_name}} has been approved on Mercato.

Keep price, stock and dispatch information current. If the product is selected for a launch campaign, we will send a separate campaign invitation with eligibility details.

CTA: View product
Secondary CTA: Manage products
```

Rejected/revision copy:

```text
Hi {{contact_name}},

We reviewed {{product_name}} and it needs changes before it can be approved.

Required changes:
{{required_changes}}

Update the listing in Seller Center so the team can review it again.

CTA: Edit product
```

Guardrails:

- Do not promise campaign eligibility from product approval alone.
- Rejection reasons should be tied to listing quality, policy, stock, category or compliance.
- Avoid legal accusations unless leadership/support has approved the wording.

### Campaign Invitation

Purpose: invite eligible sellers to submit launch deals, bundles, vouchers or featured products.

Trigger/event checklist:

- `seller_campaign_invitation_eligible`
- `campaign_invitation_sent`
- Include `seller_id`, `business_name`, `campaign_id`, `campaign_name`, `eligible_product_ids`, `submission_deadline`, `campaign_rules_url`, `seller_center_url`.

Channel:

- Email marketing/service to sellers.
- WhatsApp/DM for high-touch approved launch sellers who opted into seller updates.

Subject options:

- `Mercato launch campaign invitation for {{business_name}}`
- `Submit approved products for {{campaign_name}}`

Email copy:

```text
Hi {{contact_name}},

{{business_name}} is invited to submit eligible products for {{campaign_name}}.

Campaign products must be approved, in stock and priced according to the campaign rules. Submitting a product does not guarantee featured placement; the Mercato team reviews every campaign request before it goes live.

Deadline: {{submission_deadline}}

CTA: Submit campaign products
Secondary CTA: View campaign rules
```

Guardrails:

- Do not guarantee placement, traffic, impressions, orders or sales.
- Only invite approved sellers with approved products.
- Do not promote products that cannot support the stated discount or stock.

### Account Health Alert

Purpose: notify sellers of fulfillment, cancellation, complaint, return, policy or document issues that require action.

Trigger/event checklist:

- `seller_account_health_warning`
- `seller_late_dispatch_warning`
- `seller_cancellation_rate_warning`
- `seller_support_nonresponse_warning`
- `seller_policy_review_required`
- Include `seller_id`, `business_name`, `alert_type`, `severity`, `evidence_summary`, `required_action`, `deadline`, `seller_center_url`, `support_url`.

Channel:

- Email transactional/service.
- Seller Center notification.
- WhatsApp/DM only for urgent launch cohort follow-up after email.

Subject options:

- `Action needed on your Mercato seller account`
- `Mercato account health alert for {{business_name}}`

Email copy:

```text
Hi {{contact_name}},

Mercato needs action on your seller account.

Issue: {{alert_summary}}
Required action: {{required_action}}
Deadline: {{deadline}}

Repeated late dispatch, avoidable cancellations, unresolved buyer complaints or policy issues can affect product visibility, campaign eligibility or seller status.

CTA: Review account health
Secondary CTA: Contact seller support
```

Guardrails:

- Use evidence-based summaries and avoid inflammatory language.
- Do not threaten suspension unless the suspension policy and owner are approved.
- Never disclose buyer private data beyond what the seller needs for fulfillment/support.

### Seller Tips

Purpose: educate approved and onboarding sellers on listing quality, fulfillment readiness and campaign preparation.

Trigger/event checklist:

- `seller_tips_digest_scheduled`
- `seller_onboarding_stage_changed`
- `seller_first_product_approved`
- `seller_campaign_readiness_needed`
- Include `seller_id`, `stage`, `approved_product_count`, `campaign_eligible`, `topic`, `unsubscribe_preferences_url`.

Channel:

- Email marketing/education to sellers.
- Seller Center learning module.
- WhatsApp/DM only for opted-in seller education snippets.

Subject options:

- `Mercato seller tip: improve your launch listings`
- `Prepare your Mercato store for launch orders`

Email copy:

```text
Hi {{contact_name}},

This week's Mercato seller tip:

{{tip_title}}
{{tip_body}}

Recommended action: {{recommended_action}}

CTA: Open Seller Center
Footer: Manage seller communication preferences: {{preferences_url}}
```

Guardrails:

- Keep education practical and tied to seller activation.
- Do not imply following the tip guarantees campaign selection or sales.
- Include communication preference controls for recurring education messages.

## Trigger And Event Checklist

Recommended canonical event names:

| Event | Audience | Required Data | Primary Template |
| --- | --- | --- | --- |
| `buyer_registered` | Buyer | user, email, account URL, marketing opt-in | Buyer welcome |
| `order_created` | Buyer | order, buyer, items, payment status, support URL | Order received |
| `payment_pending_review` | Buyer | order, payment method, next step | Payment pending |
| `payment_confirmed` | Buyer | order, payment status, receipt/order URL | Payment confirmed |
| `order_processing` | Buyer | order, seller item status | Order processing |
| `order_dispatched` | Buyer | order, tracking, shipped items | Dispatch update |
| `order_delivered` | Buyer | order, delivered items, support URL | Delivery / review prompt |
| `order_cancelled` | Buyer | order, reason, refund/payment state | Cancellation update |
| `wishlist_item_price_dropped` | Buyer | item, price, opt-in, unsubscribe | Wishlist reminder |
| `wishlist_item_back_in_stock` | Buyer | item, stock, opt-in, unsubscribe | Wishlist reminder |
| `weekly_deals_digest_scheduled` | Buyer | opt-in, approved products, unsubscribe | Weekly deals digest |
| `support_ticket_created` | Buyer/Seller | ticket, requester, priority, SLA | Support receipt |
| `support_ticket_resolved` | Buyer/Seller | ticket, resolution summary | Support follow-up |
| `return_requested` | Buyer | return, order item, support URL | Return received |
| `return_approved` | Buyer | return, next step, deadline | Return approved |
| `return_rejected` | Buyer | return, policy reason | Return decision |
| `refund_completed` | Buyer | return/order, amount, method | Refund update |
| `seller_registration_submitted` | Seller | seller, status, Seller Center URL | Registration received |
| `seller_missing_documents` | Seller | seller, missing items, deadline | Missing documents |
| `seller_approved` | Seller | seller, approved categories | Seller approval |
| `seller_rejected` | Seller | seller, reason, reconsideration path | Seller rejection |
| `seller_product_submitted` | Seller | product, review status | Product submitted |
| `seller_product_approved` | Seller | product, product URL | Product approved |
| `seller_product_rejected` | Seller | product, required changes | Product rejected |
| `seller_campaign_invitation_eligible` | Seller | campaign, eligible products, rules | Campaign invitation |
| `seller_account_health_warning` | Seller | severity, evidence, required action | Account health alert |
| `seller_tips_digest_scheduled` | Seller | stage, topic, preferences URL | Seller tips |

Implementation notes for Engineering:

- Build an event-to-template registry so each event has one approved template, required fields, suppression rules and channel eligibility.
- Include idempotency keys for event sends: `{{event_name}}:{{entity_id}}:{{state}}:{{template_version}}`.
- Store send status, template version, recipient, channel, provider message ID and failure reason for auditability.
- Marketing messages must check opt-in status and suppression lists at send time, not only at schedule time.
- Transactional messages should still respect bounced/invalid addresses and account-level safety suppression.

## Copy Guardrails

Payment:

- Say `payment pending review`, `payment confirmed`, `payment failed` or `payment action needed` based only on source-of-truth status.
- Do not ask buyers to send card details by email, WhatsApp or DM.
- Do not call an order paid until payment confirmation is recorded.
- If manual payment proof is used, direct buyers to the approved checkout/support path.

Payout:

- Say `payout request received`, `payout under review`, `payout approved`, `payout processed` or `payout rejected` based only on Finance status.
- Do not promise instant payouts.
- Do not promise bank arrival timing unless Finance and the provider approve that wording.
- Include support routing for payout questions.

Approval:

- Seller approval does not equal product approval.
- Product approval does not equal campaign approval.
- Campaign invitation does not guarantee placement, traffic, orders or revenue.
- Missing-document messages should request specific items without implying rejection.

Support:

- Use `we are reviewing`, `we need more information`, `we updated your request` and `this request was resolved` instead of premature resolution promises.
- Use approved first-response targets only where support staffing confirms coverage.
- Do not expose internal seller, buyer, risk or finance notes.

Returns and refunds:

- Do not promise automatic refunds.
- Keep return outcomes tied to order status, item condition, evidence and policy.
- Only say `refund completed` after payment/finance status confirms completion.
- Explain next steps and deadlines clearly.

Campaigns and deals:

- Only promote approved sellers and approved products.
- Deal messages must use enforceable prices, real stock and active campaign windows.
- Do not say `best price`, `lowest price`, `limited guaranteed stock` or similar unsupported claims.

WhatsApp/DM:

- Do not request passwords, full card details or unnecessary identity data.
- Use secure Seller Center or support links for document uploads and sensitive cases.
- Include opt-out language for non-transactional updates.

## Suppression Rules

Suppress buyer marketing when:

- Buyer has not opted into marketing.
- Buyer unsubscribed or bounced.
- Product is unapproved, out of stock, seller is unapproved or campaign is expired.
- Category supply is below launch promotion threshold unless Product/Marketing approves exception.

Suppress review prompts when:

- Return, refund, dispute, cancellation or unresolved support ticket exists for the order.
- Delivery has not been confirmed.
- The order was cancelled or payment failed.

Suppress seller campaign invitations when:

- Seller is not approved.
- Seller has no approved products.
- Seller is under high-severity account health review.
- Campaign rules are not configured or submission deadline has passed.

Suppress seller tips when:

- Seller opted out of education/marketing messages where required.
- Seller is rejected or suspended, unless the message is a required account notice.

## Launch Readiness Checklist

Content readiness:

- Buyer templates approved for welcome, order updates, review prompt, wishlist/deal reminder, weekly deals digest, support follow-up and return resolution.
- Seller templates approved for registration received, approval, rejection/missing documents, product submitted, product approved/rejected, campaign invitation, account health alert and seller tips.
- Sender identities and footer text replaced with final Mercato launch domain.
- Support, return, payment, payout and campaign guardrails approved by responsible owners.

Engineering readiness:

- Event names mapped to source-of-truth status changes.
- Template registry has required fields and fallback text.
- Marketing opt-in, unsubscribe and suppression checks exist before send.
- Transactional templates have idempotency and audit logging.
- Provider message IDs, failures and retries are observable.
- Existing `src/lib/email.ts` generic marketplace copy is replaced or wrapped by launch-specific templates before production use.

Support/Ops readiness:

- Support team owns reply handling for buyer support and return messages.
- Seller operations owns seller onboarding and account health follow-up.
- Finance owns payout and refund wording.
- Marketing owns weekly deals digest and campaign invitation wording.
- Engineering owns event wiring and deliverability monitoring.

## Recommended Handoff

Create one engineering implementation issue from this spec if automation is required:

Title: `Engineering: Wire Mercato launch lifecycle messaging templates and event triggers`

Scope:

- Replace generic email templates with approved Mercato template registry.
- Wire canonical events from account, order, payment, seller, product, campaign, support and return state changes.
- Add opt-in/unsubscribe/suppression handling for marketing messages.
- Add idempotency and send audit logging.
- Verify all templates in staging with buyer and seller test accounts.

No additional planning is required before implementation, but Product/Support/Finance should approve the policy-sensitive wording before production sends.

## Verification

This specification covers every required ECL-66 output:

- Buyer messaging specs: welcome, order updates, review prompt, wishlist/deal reminder, weekly deals digest, support follow-up and return resolution follow-up.
- Seller messaging specs: registration received, approval, rejection/missing documents, product submitted, product approved/rejected, campaign invitation, account health alert and seller tips.
- Channel guidance: email, WhatsApp/DM and SMS out-of-scope note, with opt-in/unsubscribe requirements.
- Trigger/event checklist: canonical event table and per-message event fields.
- Copy guardrails: payment, payout, approval, support, return/refund, campaign and WhatsApp/DM rules.
- Implementation handoff: event registry, idempotency, audit logging, suppression and template replacement notes for Engineering.
