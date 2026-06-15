# ECL-33 Launch Growth And Content Plan

Date: 2026-06-15
Issue: ECL-33
Project: Amzn Project / Mercato Multi-Vendor Marketplace
Owner: Marketing Manager

## Source Of Truth

This plan was created from the current Amzn Project codebase, not from a generic Amazon clone brief.

Verified implementation signals:

- The product is branded in-app as `Mercato Multi-Vendor Marketplace`.
- The active stack is Next.js Pages Router, TypeScript, Tailwind CSS, shadcn/Radix primitives, lucide-react icons, MySQL, cPanel deployment helpers and a `.localdb/marketplace.json` local fallback.
- The issue text mentions Supabase/PostgreSQL, but the repository README and implementation plan show the current backend is MySQL with a Supabase-shaped compatibility client.
- Public growth surfaces already exist: homepage hero, deals, best sellers, new arrivals, featured sellers, service trust highlights, seller registration CTA and CMS-controlled banners/settings.
- Seller growth surfaces already exist: Seller Center marketing, campaigns, flash deals, promotions, program requests, seller learning, assortment growth, account health, analytics and support.
- Admin moderation/control is core to launch positioning: seller approval, product approval, banners, CMS, promotions, marketing, payouts, support and settings.

## Positioning

Recommended launch positioning:

`Mercato is a trusted multi-vendor marketplace for approved sellers, admin-reviewed products, clear deals and buyer protection.`

Do not copy protected Amazon, eBay, Walmart, Alibaba, Daraz or other marketplace branding, copy, logos, visual layouts or campaign names. Use those companies only as business-model inspiration. Customer-facing copy should emphasize Mercato's own trust promise:

- Approved sellers.
- Reviewed listings.
- Deal discovery.
- Transparent order tracking.
- Easy returns and support.
- Seller growth tools.
- Admin-controlled marketplace quality.

Core message pillars:

1. Trust first: verified sellers, admin-approved listings, buyer protection and support workflows.
2. Value discovery: daily deals, best sellers, new arrivals, vouchers, bundles and campaign slots.
3. Seller opportunity: fast onboarding, campaign participation, product growth guidance and clear marketplace controls.
4. Local commerce readiness: cPanel/MySQL deployment path, manual payment/payout MVP path and practical marketplace operations.

## Launch Audience Segments

### Buyers

Primary buyer segments:

- Deal seekers looking for discounts, bundles and campaign offers.
- Category shoppers in electronics, home, fashion, beauty and wellness.
- Trust-sensitive first-time buyers who need clear seller, return and support messaging.
- Repeat customers who respond to order updates, wishlist reminders and new-arrival emails.

Buyer conversion promises:

- Shop products from approved sellers.
- Track orders from checkout to delivery.
- Use support and returns when something goes wrong.
- Discover daily deals and new arrivals without marketplace clutter.

### Sellers

Primary seller segments:

- Small retailers with ready inventory.
- Category specialists in electronics, fashion, home and beauty.
- Sellers already familiar with marketplace campaigns and voucher mechanics.
- Local businesses that need a managed storefront without building their own ecommerce stack.

Seller conversion promises:

- Register, create a store and submit products for approval.
- Join marketplace campaigns and promotions from Seller Center.
- Track orders, reviews, account health, finance and growth recommendations.
- Use learning resources to improve listing quality and fulfillment readiness.

## Growth Channel Plan

### 1. SEO And Content

Priority pages to optimize:

- Homepage: unique Mercato value proposition, approved sellers, buyer protection, daily deals and seller CTA.
- Category pages: electronics, home and kitchen, fashion, beauty and health, plus any seeded category from the database.
- Deal pages: daily deals, flash deals, voucher-led landing pages and campaign pages.
- Seller info/register pages: seller onboarding, approval process, fees, requirements and growth tools.
- Trust pages: buyer protection, returns, shipping, support, seller policies and privacy.

SEO implementation tasks:

- Add metadata templates for homepage, category, product, seller profile and CMS pages.
- Add schema.org Product, BreadcrumbList, Organization and FAQ structured data where the page data supports it.
- Create an SEO content calendar with 2 category buying guides per week for the first 6 weeks.
- Add internal links from homepage cards to category pages, deals, featured sellers and seller registration.
- Make each public trust page indexable, specific and brand-owned instead of generic policy filler.

Initial content calendar:

| Week | Buyer Content | Seller Content | Trust Content |
| --- | --- | --- | --- |
| 1 | Launch announcement, daily deals guide | How to start selling on Mercato | Buyer protection overview |
| 2 | Electronics buying guide | Product photo checklist | Returns and support guide |
| 3 | Home essentials guide | Campaign readiness checklist | Verified seller standards |
| 4 | Fashion value picks | Voucher and bundle guide | Order tracking explainer |
| 5 | Beauty and wellness guide | Account health basics | Safe checkout explainer |
| 6 | Best sellers roundup | Fulfillment readiness guide | Marketplace policy summary |

### 2. Paid Acquisition

Launch paid media should stay small until checkout, payment proof, support, seller approval and product approval flows are verified in production.

Recommended first 30 days:

- Search ads: bid on category and deal intent terms, not competitor trademarks.
- Social ads: promote product/category value and seller onboarding.
- Retargeting: cart abandoners, product viewers and seller registration starters.
- Seller acquisition ads: target small retailers and ecommerce operators with direct Seller Center benefits.

Budget split for pilot:

- 40% buyer search/category ads.
- 25% social product/deal campaigns.
- 20% seller acquisition campaigns.
- 10% retargeting.
- 5% creative testing.

Pause rules:

- Pause buyer ads if checkout/payment confirmation is not production-ready.
- Pause seller acquisition ads if approval SLA exceeds 48 hours or product moderation backlog exceeds 72 hours.
- Pause category ads when approved live products are below 20 SKUs in that category.

### 3. Social Media

Channels:

- Facebook and Instagram for buyers, deals, seller stories and retargeting.
- TikTok/Reels for short product demos, unboxings and deal alerts.
- LinkedIn/Facebook groups for seller acquisition and business credibility.
- WhatsApp or email broadcast only after explicit opt-in.

Cadence:

- 1 daily deal/product post.
- 3 short videos per week.
- 2 seller education posts per week.
- 1 trust/support explainer per week.
- 1 featured seller story per week once seller quality is verified.

Creative rules:

- Show real products or real UI screenshots once production data is ready.
- Avoid generic warehouse or ecommerce stock claims that the platform cannot yet prove.
- Use Mercato branding and plain marketplace language.
- Do not use competitor logos, names in ad copy, or confusing lookalike marketplace graphics.

### 4. Email And Lifecycle

Buyer email flows:

- Welcome email after registration.
- Cart abandonment reminder.
- Wishlist price/drop reminder.
- Order confirmation and status updates.
- Review request after delivered order.
- Return/support confirmation.
- Weekly deals digest.

Seller email flows:

- Seller registration received.
- Seller approval/rejection.
- KYC/document request.
- Product submitted/pending/approved/rejected.
- Campaign invitation.
- Promotion request status.
- Order action required.
- Payout/withdrawal updates.
- Account health warning.

Implementation note: `resend` is present in dependencies, but production email workflows need verified sender/domain, templates, unsubscribe handling for marketing messages and transactional event triggers.

### 5. Promotions And Campaigns

Use the existing Seller Center marketing tools as the operational base:

- Campaign submissions.
- Flash deal submissions.
- Seller vouchers.
- Free shipping requests.
- Bundle deals.
- Coin-style loyalty discounts.
- Seller programs.
- Submission history.

Launch campaign framework:

- `Grand Opening Deals`: first 14 days, limited to approved products and sellers.
- `New Seller Spotlight`: weekly collection of recently approved quality sellers.
- `Category Week`: rotate electronics, home, fashion, beauty and health.
- `Payday Value Picks`: 5-day monthly campaign around salary cycles.
- `Bundle And Save`: AOV growth campaign for sellers with complementary products.

Campaign eligibility:

- Product status approved.
- Seller status approved.
- Stock above campaign minimum.
- Product has at least one valid image.
- Price and discount meet admin policy.
- Seller account health is not high-risk.

## Marketplace Trust Plan

Trust content must be prominent because the marketplace is new.

Trust assets to publish before buyer acquisition:

- Buyer protection page.
- Returns and refund policy.
- Shipping and tracking explainer.
- Seller verification standards.
- Product approval standards.
- Support response expectations.
- Privacy and terms pages.

Trust UX recommendations:

- Keep homepage service highlights: Buyer Protection, Verified Sellers, Fast Delivery, Easy Returns.
- Add trust links near checkout, order detail and product detail.
- Show product approval and verified seller signals only when backed by real data.
- Avoid promises such as guaranteed fastest delivery or guaranteed refunds unless operations can fulfill them.

## Content And Creative Requirements

Brand voice:

- Direct, practical and trust-building.
- Marketplace-specific, not corporate fluff.
- Clear about approval gates and buyer/seller responsibilities.
- Benefits first, but no unsupported claims.

Homepage copy refresh suggestions:

- Hero headline: `Shop approved sellers, fresh deals and trusted marketplace finds.`
- Hero subcopy: `Mercato brings verified stores, reviewed listings, order tracking and support into one multi-vendor marketplace.`
- Buyer CTA: `Shop Deals`
- Seller CTA: `Start Selling`
- Seller section headline: `Grow your store with campaigns, promotions and marketplace tools.`

Seller acquisition copy:

- `Open your Mercato store, submit products for approval and join marketplace campaigns from Seller Center.`
- `Use product, order, finance, marketing and learning tools in one seller workspace.`
- `Keep your account healthy with fulfillment, policy and listing-quality guidance.`

Buyer acquisition copy:

- `Find deals from approved sellers with order tracking and support.`
- `Discover new arrivals, best sellers and featured stores in one marketplace.`
- `Shop with clear returns, product reviews and seller visibility.`

## Analytics And KPIs

`posthog-js` is present in dependencies, but events must be explicitly wired.

Launch dashboard KPIs:

- Sessions by channel.
- Product detail views.
- Add-to-cart rate.
- Checkout start rate.
- Order completion rate.
- Cart abandonment rate.
- Average order value.
- Repeat purchase rate.
- Seller registration starts.
- Seller registration completions.
- Seller approval rate.
- Product submission count.
- Product approval rate.
- Campaign submissions.
- Promotion request approval rate.
- Support ticket volume and first response time.
- Return/refund request rate.

Recommended event instrumentation:

- `homepage_cta_clicked`
- `category_viewed`
- `product_viewed`
- `add_to_cart_clicked`
- `checkout_started`
- `order_created`
- `seller_registration_started`
- `seller_registration_submitted`
- `seller_product_submitted`
- `seller_campaign_submitted`
- `promotion_request_submitted`
- `support_ticket_created`

## Launch Blockers

These blockers must be cleared before scaling paid growth:

- Stack mismatch in planning material: issue says Supabase/PostgreSQL while repo is currently MySQL/cPanel with a Supabase-shaped compatibility client. Marketing and implementation plans should use the real stack.
- Payment processing is not confirmed as production-ready. Paid buyer acquisition should not scale until checkout/payment confirmation is verified.
- Production upload/storage provider is not finalized. Product images and seller assets need a durable storage policy before broad seller onboarding.
- Email sender/domain and lifecycle templates are not confirmed. Transactional email is required for order, support, seller approval and product moderation communications.
- Marketplace policies need final CEO/product approval: buyer protection, returns/refunds, seller verification, product approval, campaign eligibility and payout timing.
- Product/category supply depth is unknown. Category ads should wait until each promoted category has enough approved SKUs.
- Analytics instrumentation is not confirmed. Growth spend needs event tracking before optimization.

## Immediate Implementation Tasks

P0 - Before launch announcement:

- Confirm final brand name, launch geography, currency, payment model, fulfillment model and returns policy.
- Update all planning references to the actual MySQL/cPanel source of truth unless the engineering roadmap intentionally migrates backend stack.
- Finalize buyer protection, returns, seller standards and product approval pages in CMS.
- Configure production email sender and transactional templates.
- Verify checkout/order/payment proof flow end to end in production-like environment.
- Confirm seller approval and product approval SLAs.

P1 - First launch sprint:

- Add SEO metadata and structured data to homepage, category, product, seller and policy pages.
- Add PostHog or equivalent event tracking for the launch KPI events.
- Create launch campaign landing page using approved products and campaign data.
- Create seller onboarding page content with requirements, approval process, fees and Seller Center feature overview.
- Prepare email templates for buyer welcome, cart reminder, order confirmation, seller approval and product approval.
- Create admin-ready campaign calendar and seller eligibility rules for launch promotions.

P2 - First 30 days:

- Publish six-week SEO content calendar.
- Run small-budget buyer acquisition tests only on categories with adequate approved SKU depth.
- Run seller acquisition campaign targeting local merchants with ready inventory.
- Launch weekly featured seller and category deal content.
- Review support, return, checkout and seller approval metrics twice weekly.
- Create follow-up tasks for creative production, analytics wiring, email automation and CMS policy page completion.

## Recommended Follow-Up Issues

- Engineering: Wire launch analytics events and dashboard for buyer/seller funnels.
- Engineering: Confirm production email sender, templates and transactional event triggers.
- Content: Create buyer trust/policy pages and six-week SEO content set.
- Marketing: Produce launch ad creative set for buyer deals, seller onboarding and trust explainer campaigns.
- Operations: Finalize seller approval, product approval, returns, support and campaign eligibility SOPs.

## Final Recommendation

ECL-33 is complete as a Phase 1J launch growth and content plan. The plan is ready for CEO/product review and downstream execution. Do not scale paid buyer acquisition until checkout/payment, trust policies, email lifecycle, analytics and category supply depth are verified.

## Wake Recovery Note (2026-06-15)

Latest inline payload status:
- Previous automation run (ID `37862941-88c6-4f5d-ae0a-2657ca517759`) ended at `adapter_failed` due to usage-limit restrictions from the Paperclip runtime, not a repository content failure.
- The source-of-truth artifact for ECL-33 was already present in this workspace at `docs/ecl-33-launch-growth-content-plan.md`; no code-path blockers were introduced by the failure.
- Concrete next action is resumed by validating current scope against the codebase, confirming blockers and immediate implementation tasks in this same document, and handing off for CEO/product approval.

Issue disposition from this wake:
- Status: `done` (artifact is complete and actionable; only external credit replenishment or manual rerun is needed to post/update any external attachment channel).
