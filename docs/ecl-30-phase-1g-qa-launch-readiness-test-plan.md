# ECL-30 Phase 1G QA Launch Readiness Test Plan

Prepared: June 15, 2026
Owner: QA
Application: Mercato multi-vendor marketplace
Target release: Amzn Phase 1G launch readiness

## Purpose

This plan defines the minimum QA coverage required before Phase 1G can be called launch-ready. It is scoped to the current Next.js marketplace application, its cPanel/MySQL production target, and the three primary user surfaces documented in the repo:

- Customer storefront
- Seller workspace
- Admin console

## Source Inputs

- `README.md`
- `CPANEL_DEPLOYMENT.md`
- `PROJECT_AUDIT_AND_DEPLOYMENT.md`
- `database/mysql/schema.sql`
- `database/mysql/upgrade-20260608-workflows.sql`
- `src/pages/**`
- `src/pages/api/**`
- `src/lib/server/**`
- `src/services/**`

## Planning Findings

- The current repo documentation and server code path describe a cPanel MySQL/MariaDB launch target, even though the project-level brief still references Supabase/PostgreSQL. QA should treat this stack mismatch as a release coordination risk and verify the chosen production backend before execution.
- The app has broad customer, seller, and admin page coverage, but the launch-critical areas remain role access, server-side checkout/order integrity, seller/product approval gates, payout balance handling, and cPanel environment readiness.
- The existing audit says local compile/build/page smoke passed earlier, but ECL-30 has not executed a fresh Phase 1G QA run. This plan is ready for execution against the selected release candidate.

## Launch Blockers To Treat As Immediate No-Go

- Production cannot start from `server.cjs` with `.next-build`.
- cPanel MySQL schema install or admin bootstrap fails.
- Customer checkout cannot create an order with server-validated totals and stock.
- Admin login or admin route protection fails.
- Seller approval/product approval gates allow pending or rejected data to become public.
- Customer, seller, or admin APIs expose cross-role or cross-account data.
- `/api/auth/dev-login` remains enabled in production mode.
- Payout approval/rejection corrupts available or reserved seller balances.

## Immediate Implementation Tasks From The Plan

- Create or confirm Phase 1G QA accounts for customer, approved seller, pending seller, suspended seller, and admin.
- Seed catalog/order data covering approved, pending, rejected, low-stock, and out-of-stock product states.
- Choose the release candidate URL and backend target before QA execution: local fallback, cPanel staging, or production-like cPanel.
- Run the regression smoke set and capture evidence in the format defined below.
- File child defect issues for every failed P0/P1 case with role, route/API, data setup, expected result, actual result, and screenshot/log evidence.

## Entry Criteria

QA execution can begin when all of the following are true:

- A release candidate branch or deployment URL is identified.
- `npm ci` completes with the committed `package-lock.json`.
- `npm run type-check` passes.
- `npm run lint` has no launch-blocking errors.
- `npm run build` passes and emits production output to `.next-build`.
- Local fallback data or cPanel MySQL credentials are available for test setup.
- Demo or test accounts exist for admin, seller, and customer roles.
- Production-like environment variables are available for deployment validation:
  - `NODE_ENV=production`
  - `PORT`
  - `NEXT_PUBLIC_APP_URL`
  - `AUTH_SECRET`
  - `DB_HOST`
  - `DB_PORT`
  - `DB_NAME`
  - `DB_USER`
  - `DB_PASSWORD`

## Test Data

Use isolated QA data unless validating a production migration.

| Role | Account | Required state |
| --- | --- | --- |
| Admin | `admin@marketplace.com` or QA admin | Active admin role |
| Seller | `seller@marketplace.com` or QA seller | Approved seller, active store, bank/business profile available |
| Pending seller | QA-generated | Registration submitted, not yet approved |
| Customer | `customer@marketplace.com` or QA customer | Active customer with shipping address |
| Guest | Anonymous browser session | No auth cookies |

Required catalog data:

- At least one approved in-stock product with seller and category.
- At least one pending product awaiting admin approval.
- At least one out-of-stock or low-stock product.
- At least one featured/deal/promoted product if promotions are enabled.
- At least one order in each critical status used by admin/seller workflows.

## Environment Readiness

| ID | Area | Steps | Expected result | Priority |
| --- | --- | --- | --- | --- |
| ENV-01 | Install | Run `npm ci`. | Dependencies install from lockfile without manual edits. | P0 |
| ENV-02 | TypeScript | Run `npm run type-check`. | No TypeScript errors. | P0 |
| ENV-03 | Lint | Run `npm run lint`. | No launch-blocking lint errors; known non-blocking warnings are documented. | P0 |
| ENV-04 | Build | Run `npm run build`. | Production build succeeds using `.next-build`. | P0 |
| ENV-05 | Start | Run `npm run start` with production-like env. | Server starts and responds on configured `PORT`. | P0 |
| ENV-06 | cPanel config | Compare deployment settings with `CPANEL_DEPLOYMENT.md`. | Startup file, app mode, app root, env vars, and database settings match deployment guide. | P0 |
| ENV-07 | Local fallback | Start without MySQL in local dev. | App uses `.localdb/marketplace.json` fallback and remains usable for local smoke checks. | P1 |
| ENV-08 | Production dev-login guard | Hit `/api/auth/dev-login` with `NODE_ENV=production`. | Endpoint is disabled in production. | P0 |

## Customer Storefront Coverage

| ID | Area | Steps | Expected result | Priority |
| --- | --- | --- | --- | --- |
| CUS-01 | Home page | Open `/`. | Page loads, key navigation is visible, no console-blocking runtime error. | P0 |
| CUS-02 | Catalog browse | Open `/products`, `/categories`, `/deals`, `/new-arrivals`. | Product lists render, empty states are graceful, filters/search controls do not break layout. | P0 |
| CUS-03 | Product detail | Open `/products/[id]` for approved product. | Product data, price, stock, seller, review section, and add-to-cart affordance are correct. | P0 |
| CUS-04 | Category detail | Open `/categories/[slug]`. | Category products render and invalid slugs show safe fallback or 404. | P1 |
| CUS-05 | Search | Search from header and `/search`. | Matching products display; no-results state is clear. | P0 |
| CUS-06 | Registration | Register a new customer. | Account is created, session starts or clear next step is shown, duplicate email is rejected safely. | P0 |
| CUS-07 | Login/logout | Log in and log out as customer. | HTTP-only session works; protected customer pages require auth after logout. | P0 |
| CUS-08 | Cart | Add item, update quantity, remove item, reload page. | Cart totals and persistence are correct; stock limits are enforced. | P0 |
| CUS-09 | Checkout COD | Complete Cash on Delivery checkout with shipping data. | Order is created using server-side prices, stock is reserved/decremented as designed, order confirmation is shown. | P0 |
| CUS-10 | Order history | Open `/orders` and `/orders/[id]`. | Customer only sees own orders and correct line items/statuses. | P0 |
| CUS-11 | Public tracking | Use `/track-order` with order number and email. | Valid pair returns order status; invalid pair does not leak data. | P0 |
| CUS-12 | Wishlist | Add/remove product from `/wishlist`. | Wishlist requires customer auth and persists correctly. | P1 |
| CUS-13 | Public pages | Open `/about`, `/help`, `/contact`, `/terms`, `/privacy`, `/returns`, `/shipping`, `/cookies`. | Content renders without broken navigation or layout collapse. | P1 |
| CUS-14 | Seller discovery | Open `/sellers` and `/sellers/[id]`. | Approved seller profiles display public information only. | P1 |

## Seller Workspace Coverage

| ID | Area | Steps | Expected result | Priority |
| --- | --- | --- | --- | --- |
| SEL-01 | Seller registration | Submit `/seller/register`. | Registration creates pending seller state and does not grant approved seller access prematurely. | P0 |
| SEL-02 | Seller login | Log in at `/seller/login`. | Approved seller reaches seller workspace; pending/suspended seller is routed to the correct status page. | P0 |
| SEL-03 | Route protection | Open seller routes as guest/customer/admin. | Unauthorized roles are denied or redirected consistently. | P0 |
| SEL-04 | Dashboard | Open `/seller/dashboard` and `/seller`. | Metrics render from seller-scoped data only. | P0 |
| SEL-05 | Product create | Create a product from `/seller/products/add` or `/seller/products/new`. | Product is saved as pending and not public until admin approval. | P0 |
| SEL-06 | Product management | Edit/delete seller-owned product in `/seller/products`. | Seller can manage own products only; moderation status remains correct. | P0 |
| SEL-07 | Orders | Open `/seller/orders` and update fulfillment status where allowed. | Seller only sees own order lines and allowed status transitions. | P0 |
| SEL-08 | Reviews | Open `/seller/reviews`. | Seller sees reviews for own products only. | P1 |
| SEL-09 | Earnings/payouts | Open `/seller/earnings`, `/seller/payouts`, `/seller/finance`. | Delivered-order earnings and withdrawal requests use correct balances and reservation behavior. | P0 |
| SEL-10 | Store/settings | Update store/business/bank profile in `/seller/store` and `/seller/settings`. | Changes persist and validation catches missing required fields. | P1 |
| SEL-11 | Account health | Open `/seller/account-health`. | Values match admin Seller Center settings or safe defaults. | P1 |
| SEL-12 | Support/messages | Open `/seller/support` and `/seller/messages`. | Seller can view/create support context without cross-seller leakage. | P1 |
| SEL-13 | Seller modules | Open marketing, analytics, learning, pricing, guidelines, assortment pages. | Enabled modules render; disabled modules follow admin configuration. | P2 |

## Admin Console Coverage

| ID | Area | Steps | Expected result | Priority |
| --- | --- | --- | --- | --- |
| ADM-01 | Admin login | Log in at `/admin/login`. | Admin session starts; non-admin roles cannot access admin console. | P0 |
| ADM-02 | Route protection | Open admin routes as guest/customer/seller. | Access is denied and no admin data is exposed. | P0 |
| ADM-03 | Dashboard | Open `/admin`. | Metrics and recent activity render without API errors. | P0 |
| ADM-04 | Users | Open `/admin/users`; activate/deactivate QA user. | User state updates and is reflected in auth behavior. | P0 |
| ADM-05 | Sellers | Open `/admin/sellers`; approve, suspend, or reject QA seller. | Seller access and public seller visibility match status. | P0 |
| ADM-06 | Product moderation | Open `/admin/products`; approve/reject pending product. | Approval makes product public; rejection remains non-public with reason if supported. | P0 |
| ADM-07 | Categories | Create/edit/delete QA category in `/admin/categories`. | Category changes persist and public category pages remain stable. | P1 |
| ADM-08 | Orders | Open `/admin/orders`; update order status. | Status updates persist and are reflected for customer/seller views. | P0 |
| ADM-09 | Payments | Open `/admin/payments`. | Payment records render and sensitive data is limited to authorized admin. | P1 |
| ADM-10 | Payouts | Approve/reject QA withdrawal in `/admin/payouts`. | Balance reservation is released or completed correctly. | P0 |
| ADM-11 | Reports | Open `/admin/reports`; export CSV. | Report data is accurate for QA dataset and CSV downloads cleanly. | P1 |
| ADM-12 | Support | Open `/admin/support`; update support ticket status. | Conversations persist and route by role correctly. | P1 |
| ADM-13 | CMS/settings | Edit public content and settings in `/admin/cms` and `/admin/settings`. | Public pages/settings update without breaking layout or auth. | P1 |
| ADM-14 | Seller Center controls | Open `/admin/seller-center`; toggle a seller module or setting. | Seller workspace reflects configuration changes. | P1 |
| ADM-15 | Marketing/promotions/vendors/returns | Open remaining admin modules. | Pages load, authorization holds, and empty states are acceptable. | P2 |

## API And Data Integrity Coverage

| ID | Endpoint area | Checks | Expected result | Priority |
| --- | --- | --- | --- | --- |
| API-01 | `/api/auth/*` | Register, login, logout, session, invalid credentials, duplicate email. | Secure errors, correct cookies, no credential leakage. | P0 |
| API-02 | `/api/cart` | Add/update/remove cart items with guest and customer contexts where supported. | Correct totals, stock validation, no cross-user cart access. | P0 |
| API-03 | `/api/orders` | Create order and reject invalid cart/address/payment payloads. | Server recomputes totals and validates ownership/stock. | P0 |
| API-04 | `/api/orders/track` | Valid and invalid tracking pairs. | No data leakage for invalid order/email pair. | P0 |
| API-05 | `/api/products` | List/detail products by approved and non-approved status. | Public APIs expose approved products only. | P0 |
| API-06 | `/api/vendors/register` | Submit seller/vendor registration payload. | Validation errors are clear and stored records are pending. | P0 |
| API-07 | `/api/promotions/*` | Active promotions and cart summary. | Discounts/promos calculate consistently with checkout expectations. | P1 |
| API-08 | `/api/uploads` | Upload accepted and rejected file types/sizes. | Validation protects server and returns usable URLs where supported. | P1 |
| API-09 | `/api/data/query` | Legacy query compatibility paths. | Only intended data is returned; auth-sensitive data stays protected. | P1 |
| API-10 | Error handling | Send malformed payloads to key APIs. | 4xx errors are structured; no stack traces or secrets in response. | P0 |

## Security And Access Control Gates

These checks are launch blockers if they fail:

- Admin routes cannot be accessed by guest, customer, seller, pending seller, or suspended seller.
- Seller routes cannot be accessed by guest/customer/admin unless explicitly intended.
- Customer order and account pages cannot expose another customer's data by changing IDs.
- Seller product/order/review APIs cannot expose another seller's data by changing IDs.
- Public product and seller pages do not expose pending, rejected, suspended, or private records.
- Sessions use HTTP-only cookies and logout invalidates access.
- `AUTH_SECRET` is set to a strong production value.
- Production environment disables `/api/auth/dev-login`.
- API errors do not return stack traces, database credentials, JWT secrets, or raw SQL.
- Uploads reject unsafe file types and path traversal attempts.

## Responsive And Browser Coverage

Minimum manual coverage:

| Browser/device | Viewports | Required areas |
| --- | --- | --- |
| Chrome desktop | 1440x900, 1280x720 | Customer, seller, admin P0 flows |
| Chrome mobile emulation | 390x844 | Customer checkout, seller nav, admin nav smoke |
| Safari or WebKit equivalent | Desktop or mobile | Customer P0 browse/cart/checkout smoke |
| Edge or Chromium equivalent | Desktop | Admin and seller P0 smoke |

Responsive acceptance:

- Header, sidebars, dialogs, forms, tables, and menus remain usable on mobile.
- No critical button text is clipped.
- Tables either wrap, scroll, or collapse intentionally.
- Modals and dropdowns remain inside the viewport.
- Keyboard focus is visible for primary forms and menus.

## cPanel Launch Validation

Execute after deployment to a staging or production-like cPanel app:

| ID | Steps | Expected result | Priority |
| --- | --- | --- | --- |
| CP-01 | Confirm Node.js startup file is `server.cjs`. | cPanel app starts the Next server. | P0 |
| CP-02 | Confirm `.next-build` exists after build. | Production server uses committed Next config output path. | P0 |
| CP-03 | Run or import `database/mysql/schema.sql`. | Schema installs without manual SQL edits. | P0 |
| CP-04 | Run `npm run setup:admin -- admin@example.com "StrongAdminPassword" "Admin Name"`. | Admin account is created or updated cleanly. | P0 |
| CP-05 | Run customer, seller, admin login smoke on deployed URL. | Role sessions work against MySQL database. | P0 |
| CP-06 | Create checkout order on deployed URL. | MySQL transaction completes and order appears in admin/seller/customer views. | P0 |
| CP-07 | Restart cPanel app. | Existing data persists; app recovers without manual repair. | P0 |
| CP-08 | Check server logs after smoke. | No recurring unhandled exceptions or database connection failures. | P0 |

## Regression Smoke Set

Use this as the minimum rerun set for any Phase 1G hotfix candidate:

1. `npm run type-check`
2. `npm run build`
3. Customer: browse product -> add to cart -> checkout -> view order.
4. Seller: login -> create pending product -> view seller orders.
5. Admin: login -> approve seller/product -> update order -> approve/reject payout.
6. Access control: attempt admin and seller protected routes from unauthorized roles.
7. Production guard: verify `/api/auth/dev-login` disabled in production mode.

## Evidence To Capture

For each QA execution cycle, attach or record:

- Build/type-check/lint command output summary.
- Deployment URL and commit/release candidate identifier.
- Browser/device matrix used.
- Test data account list with passwords stored outside the issue if sensitive.
- Screenshots for checkout confirmation, seller product moderation, admin approval, and cPanel startup.
- API response examples for one successful and one rejected request in each P0 API area.
- Defect links for every failed P0/P1 case.
- Final go/no-go recommendation with unresolved risk list.

## Exit Criteria

Phase 1G is launch-ready when all of the following are true:

- All P0 test cases pass.
- P1 failures are either fixed or explicitly accepted by product/engineering with owner and launch impact.
- No unresolved security/access-control blocker remains.
- No unresolved checkout, order, seller approval, product approval, payout, or admin-login blocker remains.
- cPanel staging or production-like validation passes.
- Release evidence has been attached to the issue or release record.
- QA has posted a go/no-go recommendation.

## Go/No-Go Template

Use this format in the final QA execution comment:

```text
Recommendation: GO | NO-GO
Build: pass/fail
Environment: local/staging/production-like cPanel URL
P0: x/y passed
P1: x/y passed
Known accepted risks:
- ...
Launch blockers:
- ...
Evidence:
- ...
```

## Current Plan Status

This document is a launch readiness test plan, not an execution result. As of June 15, 2026, no Phase 1G QA run has been executed under this issue. The next QA issue should execute this plan against the chosen release candidate and attach the evidence listed above.
