# Marketplace Audit And Deployment Guide

Last audited: June 6, 2026

## Current Status

This repository is being migrated into a cPanel-owned multi-vendor marketplace MVP built with Next.js 15, TypeScript, MySQL/MariaDB, and Tailwind/shadcn UI.

Verified locally:

- TypeScript: 0 errors
- Updated cPanel database/auth files: 0 ESLint errors
- Full repository lint: 0 errors, non-blocking legacy warnings remain
- Next.js production build with cPanel MySQL environment variables: passed
- Critical route smoke test: 11/11 routes returned HTTP 200
- Local test URL: `http://localhost:3000`

The remaining lint warnings are primarily loose legacy types, unused imports, and hook dependency warnings in older catalog/marketing components. They do not block deployment.

The previous Softgen/Supabase project was `hnzsdofaoiaaiwgmodew`. The new target requested on June 6, 2026 is **cPanel for both application hosting and database hosting**, so authentication, cart, order, seller registration, admin bootstrap, and the legacy Supabase-style query layer now route through cPanel MySQL/MariaDB APIs instead of Supabase Auth/RLS.

Live database runtime verification still requires the real cPanel MySQL database name, user, password, and `AUTH_SECRET`. Without those credentials, local verification can confirm compile/build and page rendering, but cannot create the real admin account or exercise live database reads/writes.

## Working Customer Flows

- cPanel MySQL-backed email registration, login, logout, and signed HTTP-only sessions
- Product browsing, search suggestions, category pages, deals, and seller pages
- Persistent cPanel MySQL cart
- Server-validated Cash on Delivery checkout using MySQL transactions
- Secure server-side price, seller, commission, and stock validation
- Order history and order detail pages
- Public order tracking using order number plus customer email
- Customer profile and default shipping address storage
- Product reviews for eligible delivered purchases

## Working Seller Flows

- Secure server-side seller registration using MySQL transactions
- Admin approval status and role-based route protection
- Live dashboard, analytics, products, orders, reviews, and settings
- Product create/update/delete and moderation status
- Order fulfillment status updates
- Delivered-order earnings and available balance
- Withdrawal requests with balance reservation
- Bank and business profile updates

## Working Admin Flows

- Role-protected admin login and navigation using cPanel MySQL sessions
- Immediate role verification during admin and seller sign-in
- Responsive shared desktop/mobile portal navigation
- Live dashboard metrics and recent orders
- User activation, seller approval/suspension, and product moderation
- Category create/update/delete
- Order status management
- Payment records and payout approval/rejection
- Live reports with CSV export
- Support ticket conversations and resolution
- Persisted platform name, contact email, and default seller commission

## Database Setup

For cPanel database hosting, use:

```text
database/mysql/schema.sql
```

In cPanel:

1. Open **MySQL Database Wizard**.
2. Create a database, for example `cpaneluser_marketplace`.
3. Create a database user, for example `cpaneluser_marketplace_user`.
4. Give that user **All Privileges** on the marketplace database.
5. Add the database credentials to `.env.local` locally and to cPanel **Setup Node.js App > Environment Variables** in production.
6. Install the schema:

```bash
npm run db:install
```

For hosts that do not allow Node command access to MySQL, import `database/mysql/schema.sql` through phpMyAdmin.

## Required Environment

Set these in `.env.local`, Softgen environment settings, or cPanel Node.js environment variables:

```env
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://your-domain.com
DB_HOST=localhost
DB_PORT=3306
DB_NAME=cpaneluser_marketplace
DB_USER=cpaneluser_marketplace_user
DB_PASSWORD=your_cpanel_mysql_password
AUTH_SECRET=generate_a_32_byte_random_secret
```

Optional integrations:

```env
RESEND_API_KEY=your_resend_key
EMAIL_FROM_DOMAIN=notifications@your-domain.com
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_or_test
STRIPE_SECRET_KEY=sk_live_or_test
STRIPE_WEBHOOK_SECRET=whsec_value
```

Never expose `DB_PASSWORD` or `AUTH_SECRET` in browser code or commit real secrets.

## Admin Login Recovery

The admin login now uses a cPanel MySQL profile, verifies the `admin` role, and rejects customer or seller accounts before opening the console.

1. Copy `.env.example` to `.env.local`.
2. Fill `DB_HOST`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`, and `AUTH_SECRET`.
3. Run the database installer:

```bash
npm run db:install
```

4. Create or repair the administrator account:

```bash
npm run setup:admin -- admin@yourdomain.com "Use-A-Strong-Password" "Admin Name"
```

The setup command loads `.env.local`, hashes the password with bcrypt, and upserts the `profiles` row with the `admin` role. It is safe to rerun for the same email.

## cPanel Deployment

The hosting plan must support persistent Node.js applications. Static-only cPanel hosting is not sufficient because checkout, tracking, and seller registration use API routes.

1. Upload the project without `node_modules`, `.next`, or local env files.
2. Select Node.js 20 or 22.
3. Set the application root to this project directory.
4. Add the required cPanel MySQL and auth environment variables.
5. Run:

```bash
npm ci
npm run db:install
npm run setup:admin -- admin@yourdomain.com "Use-A-Strong-Password" "Admin Name"
npm run type-check
npm run build
npm run start
```

For PM2:

```bash
npm ci
npm run build
pm2 start ecosystem.config.js
pm2 save
```

Point the cPanel application URL/reverse proxy to the assigned Node port. If the host does not support persistent Node processes, deploy to Vercel or a Node-capable VPS instead.

## GitHub Status

The current workspace came from an extracted archive and does not contain a `.git` directory. The local changes therefore cannot be committed or pushed from this folder until it is replaced by, or copied into, a real clone of:

`https://github.com/Usamaqur12/sg-302be7af-95cb-4f0f-9f04-1a65bed26b7c-1780665515`

The current machine also does not expose `git` on PATH.

## Production Limitations

- Checkout currently supports Cash on Delivery only. Stripe packages are installed, but payment intents and webhooks still require live Stripe credentials and implementation.
- Shipping status and tracking numbers are managed manually; no carrier API is connected.
- Seller-customer direct chat is not implemented. Customer support tickets are working.
- Product and KYC fields accept URLs; cPanel file upload handling is not yet connected.
- Transactional email delivery requires Resend/domain configuration.
- Dependency audit previously reported 28 packages with advisories; review upgrades before handling real payments.
- This is a deployable marketplace MVP, not feature parity with Amazon's global logistics, recommendations, fraud, tax, and advertising systems.

## Softgen One-Shot Prompt

Use this only if continuing the same repository in Softgen:

```text
Continue the existing Next.js 15 Pages Router + TypeScript + cPanel MySQL/MariaDB multi-vendor marketplace in this repository. Preserve the current cPanel MySQL schema in database/mysql/schema.sql, UI system, and role names customer, seller, admin. Do not replace working code, do not introduce mock data, and do not create a new project.

First run npm ci, npm run type-check, npm run lint, and npm run build. Inspect PROJECT_AUDIT_AND_DEPLOYMENT.md, database/mysql/schema.sql, src/lib/server/db.ts, src/lib/server/session.ts, src/pages/api/data/query.ts, and src/integrations/supabase/client.ts. Fix only verified remaining issues. Keep customer, seller, and admin routes protected with cPanel MySQL-backed HTTP-only sessions and server-side role checks.

Complete the next production integrations in this order: (1) cPanel-safe uploads for product images, seller logos, and private KYC documents; (2) Stripe PaymentIntent checkout and webhook-confirmed payments without accepting raw card fields; (3) Resend order, seller approval, payout, and support notifications; (4) carrier-ready shipment tracking interface; (5) remove all remaining ESLint warnings without changing behavior; (6) harden src/pages/api/data/query.ts policies table-by-table after live cPanel DB verification.

Keep Cash on Delivery working as a fallback. Never trust client prices, seller IDs, commission, stock, roles, payment status, or payout balances. Preserve atomic inventory/order/earnings behavior in server-side MySQL transactions. Ensure schema changes are idempotent where practical. Finish only when npm run type-check, npm run lint, and npm run build complete with zero errors, then update PROJECT_AUDIT_AND_DEPLOYMENT.md with exact changes and cPanel Node.js deployment steps. Do all work in this single prompt.
```
