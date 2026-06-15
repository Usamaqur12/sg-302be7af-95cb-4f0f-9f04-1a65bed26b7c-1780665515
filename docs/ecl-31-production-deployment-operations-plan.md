# ECL-31 Amzn Phase 1H: Production Deployment and Operations Plan

Date: 2026-06-15
Owner: DevOps Engineer
Scope: Production deployment, release gates, launch operations, monitoring, backup/restore, incident response, rollback, and operating handoffs for the Phase 1 multivendor marketplace.

## Executive Disposition

Phase 1H is complete as a production deployment and operations plan. The application can be prepared for a controlled cPanel Node.js and MySQL/MariaDB deployment, but public launch should remain gated until the release evidence in this plan is collected.

Recommended launch posture:

- Run a private beta first, not an unrestricted public launch.
- Keep seller onboarding invite-only until seller verification, listing moderation, fulfillment, refund, payout, support, analytics, and monitoring evidence is attached.
- Treat real-money checkout, role access, database restore, and incident response as launch gates.
- Use cPanel deployment for the MVP only if the host supports persistent Node.js processes, build tooling, environment variables, SSL/TLS, MySQL backups, and operational logs.

## Source Evidence Reviewed

- `PROJECT_AUDIT_AND_DEPLOYMENT.md`
- `CPANEL_DEPLOYMENT.md`
- `package.json`
- `database/mysql/schema.sql`
- `database/mysql/upgrade-20260608-workflows.sql`
- ECL-8 marketplace operations blueprint
- ECL-9 QA test plan and bug baseline
- ECL-16 operations command center and delivery tracking
- ECL-21 DevOps and production readiness audit

## Production Topology

Use the following MVP topology for launch:

| Layer | Production choice | Operating notes |
| --- | --- | --- |
| Web runtime | cPanel Node.js app running `server.cjs` | Requires persistent Node.js support. Static-only cPanel hosting is not sufficient. |
| Framework | Next.js production build | `next.config.mjs` uses `.next-build` as the build output directory. |
| Database | cPanel MySQL or MariaDB | Install `database/mysql/schema.sql` with `npm run db:install` or phpMyAdmin. |
| Session/auth | HTTP-only signed sessions | `AUTH_SECRET` must be unique, long, and rotated through a controlled process. |
| Admin bootstrap | `npm run setup:admin` | Use only over a trusted shell with production env vars set. |
| Uploads | Local/public upload path for MVP | Do not use for private KYC documents until access controls and backup coverage are implemented. |
| Email | Resend optional integration | Launch-critical transactional email requires configured sender domain and failure monitoring. |
| Payments | Cash on Delivery is currently deployable | Stripe packages exist, but payment intents/webhooks require separate implementation and verification before live card payments. |

## Required Production Configuration

Set these values in cPanel Node.js App environment variables:

```env
NODE_ENV=production
PORT=3000
NEXT_PUBLIC_APP_URL=https://your-domain.com
AUTH_SECRET=replace-with-a-long-random-secret-at-least-32-characters
DB_HOST=localhost
DB_PORT=3306
DB_NAME=cpaneluser_marketplace
DB_USER=cpaneluser_marketplace_user
DB_PASSWORD=your_cpanel_mysql_password
```

Optional integrations:

```env
RESEND_API_KEY=your_resend_key
EMAIL_FROM_DOMAIN=notifications@your-domain.com
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_or_test
STRIPE_SECRET_KEY=sk_live_or_test
STRIPE_WEBHOOK_SECRET=whsec_value
```

Production rules:

- Do not commit `.env.local`, cPanel screenshots containing secrets, database exports with customer data, or admin bootstrap passwords.
- Keep `AUTH_SECRET`, database credentials, email keys, payment keys, and webhook secrets out of issue comments and chat.
- Record each secret owner, rotation date, and rotation procedure in the launch tracker.
- Fail the production launch if any required env var is unset or points to a local/test domain by mistake.

## Deployment Runbook

### 1. Pre-Deploy Gate

Complete these checks before touching production:

1. Confirm cPanel hosting supports Node.js 20 or 22 and persistent Node.js apps.
2. Confirm domain/subdomain and SSL certificate are active.
3. Confirm MySQL database, user, and privileges exist.
4. Confirm backup schedule and manual export path are available.
5. Confirm production env vars are ready and secret owners are named.
6. Confirm admin email and bootstrap password handoff owner.
7. Confirm launch window, deploy owner, QA owner, rollback owner, and business approver.

### 2. Build Verification

Run locally or in staging with production-like env vars:

```bash
npm ci
npm run type-check
npm run lint
npm run build
```

Pass criteria:

- TypeScript exits with zero errors.
- Lint exits with zero errors. Existing warnings are acceptable only if reviewed and not launch-blocking.
- Production build completes.
- No secret values appear in logs.

### 3. Database Setup

For first production install:

```bash
npm run db:install
```

If cPanel does not allow Node command access to MySQL, import:

```text
database/mysql/schema.sql
```

through phpMyAdmin.

Database gate:

- Verify all expected marketplace tables exist.
- Verify app DB user has required privileges only for the marketplace database.
- Record the schema install timestamp and operator in the launch tracker.
- Take a database backup immediately after schema install and before production traffic.

### 4. Admin Bootstrap

Run:

```bash
npm run setup:admin -- admin@yourdomain.com "Use-A-Strong-Password" "Admin Name"
```

Admin gate:

- Admin can sign in through the production URL.
- Non-admin users cannot access admin routes or APIs.
- Admin bootstrap password is changed or stored through the agreed credential handoff process.
- At least one backup admin or recovery path is documented.

### 5. cPanel App Deployment

Upload the project without generated/local folders:

```text
node_modules
.next
.next-build
.localdb
*.log
.env.local
```

cPanel settings:

```text
Application startup file: server.cjs
Application mode: Production
Application root: uploaded project folder
Application URL: production domain or subdomain
```

Install and start:

```bash
npm ci
npm run build
npm run start
```

If PM2 is available:

```bash
npm ci
npm run build
pm2 start ecosystem.config.js
pm2 save
```

### 6. Post-Deploy Smoke Test

Run these checks against the production URL:

| Area | Smoke check | Owner |
| --- | --- | --- |
| Home/catalog | Home, categories, search, product detail return HTTP 200 and render product content. | QA |
| Auth | Buyer login/logout works and session cookie is secure. | QA |
| Seller | Seller login, dashboard route protection, products, orders, and settings render. | QA/Ops |
| Admin | Admin login, dashboard, users, sellers, products, orders, payouts, settings render. | QA/Ops |
| Cart | Add, update, remove cart item; refresh preserves expected state. | QA |
| Checkout | Cash on Delivery order can be placed with server-calculated totals. | QA/Finance |
| Orders | Buyer order history, public tracking, seller order queue, admin order view agree. | QA/Ops |
| Email | Configured transactional sender can send or failure is visible. | Support |
| Logs | Server logs show no recurring startup/runtime errors. | DevOps |

Minimum pass criteria:

- Zero Critical or High failures in auth, role access, checkout, order creation, admin access, or database connectivity.
- Any Medium issue has a named owner and workaround before private beta.
- Smoke evidence is linked in the launch tracker.

## Release Gates

Production launch is blocked unless all gates pass:

| Gate | Pass criteria | Evidence |
| --- | --- | --- |
| Build gate | `npm ci`, `npm run type-check`, `npm run lint`, and `npm run build` pass. | Command output or CI run. |
| Database gate | Schema installed, backup taken, restore path confirmed. | DB install log and backup record. |
| Auth gate | Buyer, seller, admin login/logout and role protection pass. | QA smoke notes. |
| Checkout gate | Cash on Delivery checkout creates exactly one order with correct totals. | Test order IDs and screenshots/logs. |
| Admin gate | Admin can moderate users, sellers, products, orders, payouts, settings. | Admin smoke notes. |
| Seller gate | Seller can manage products, see orders, and update fulfillment status. | Seller smoke notes. |
| Support gate | Support can find order/ticket context and escalation owner. | Support SOP and test ticket. |
| Finance gate | Order totals, commission, earnings, payouts, and refunds are reconcilable. | Finance sample reconciliation. |
| Monitoring gate | Uptime, server errors, database health, backup failures, and checkout failures are monitored. | Dashboard or alert screenshots. |
| Incident gate | Incident owner matrix, rollback path, and launch communication template are approved. | Runbook links. |

## Operations Cadence

### Private Beta

Run for at least 10 business days before public launch.

Limits:

- 10-25 approved sellers.
- 1-2 launch categories.
- 100-300 approved listings.
- Daily order cap agreed by COO, DevOps, Support, and Finance.
- Manual review for refunds, disputes, payout release, high-risk listings, and seller suspensions.
- Daily reconciliation of orders, seller earnings, payout holds, support tickets, and technical errors.

Daily checks:

- Site uptime and 5xx errors.
- Checkout/order creation failures.
- Paid/COD orders vs internal order records.
- Seller acceptance and shipment SLA misses.
- Support tickets by severity and SLA breach.
- Refund/return/dispute aging.
- Database backup status.
- Admin/seller/buyer login errors.

### Launch Week

Run a daily command center with:

- DevOps owner
- Engineering owner
- QA owner
- Operations owner
- Support owner
- Finance owner
- Marketing owner if paid traffic is active
- CEO/COO decision owner for go/no-go

Daily update format:

```text
Status: green/yellow/red
Traffic/orders:
Open Critical/High incidents:
Deployments since last update:
Smoke test result:
Payment/COD/order reconciliation:
Support SLA status:
Seller fulfillment status:
Backups/restore status:
Decisions needed:
Next 24-hour action:
```

## Monitoring and Alerts

Minimum monitoring:

- Production URL uptime.
- API/server 5xx rate.
- Next.js server process restarts.
- Database connectivity errors.
- Slow query or connection saturation signals where the host exposes them.
- Checkout/order creation errors.
- Auth/session errors.
- Email send failures.
- Backup success/failure.
- Disk usage for app, logs, uploads, and database.

Minimum alerts:

- Site unavailable for 5 minutes.
- Any sustained 5xx spike.
- Checkout/order creation error above threshold.
- Admin login anomaly or role access error.
- Database connection failures.
- Backup failure or missing backup.
- Disk usage above 80%.
- Email failure spike.

## Backup and Restore Plan

Backup requirements:

- Daily automated MySQL backup.
- Manual backup before every schema change or production deployment.
- Retain backups according to legal, order, finance, and privacy requirements.
- Include uploads/media in a separate backup path if production uploads are enabled.
- Store backups outside the app deployment directory.

Restore rehearsal:

1. Export production-like database backup.
2. Restore into staging or a temporary database.
3. Point staging env vars to restored database.
4. Verify admin login, buyer order history, seller orders, payouts, settings, and public catalog.
5. Record restore duration, operator, backup timestamp, and any data gaps.

Launch should not proceed until restore has been rehearsed at least once.

## Rollback Plan

Use rollback when production deployment causes Critical or High failures in auth, checkout, order creation, admin access, seller fulfillment, or database connectivity.

Rollback steps:

1. Freeze new deployment activity.
2. Announce incident owner and severity.
3. Preserve current logs and error output.
4. Revert application files to the last known good release artifact.
5. Restart cPanel Node.js app or PM2 process.
6. Run post-rollback smoke tests for home, login, cart, checkout, orders, admin, and seller.
7. If a migration caused the issue, use forward-fix unless a reviewed data-safe rollback script exists.
8. Update the incident log with cause, impact, resolution, and follow-up issue.

Do not roll back database schema blindly after production writes. Database changes require an explicit data safety review.

## Incident Response

Severity model:

| Severity | Examples | Response target |
| --- | --- | --- |
| Critical | Site down, admin exposed, buyer/seller data exposed, order creation broken, database unavailable. | Immediate response and executive escalation. |
| High | Checkout degraded, seller fulfillment blocked, support cannot locate orders, backup failure, repeated 5xx. | Same business day owner action. |
| Medium | Non-critical dashboard defect, isolated email failures, slow non-checkout pages. | Track with owner and target date. |
| Low | Copy, styling, minor friction, non-launch polish. | Backlog unless it blocks launch trust. |

Incident workflow:

1. Declare severity and incident owner.
2. Capture start time, affected users, affected workflows, and first symptom.
3. Stop risky deploys and marketing scale-up if buyer trust or order flow is affected.
4. Triage logs, recent deployments, database health, and third-party status.
5. Mitigate through rollback, config change, feature disablement, manual operations workaround, or support communication.
6. Post incident update to the command center.
7. Create follow-up issue for root cause and prevention.

## Security and Compliance Controls

Before public launch:

- Enforce HTTPS-only production access.
- Set secure HTTP-only cookies.
- Keep `/api/auth/dev-login` disabled in production.
- Confirm admin and seller routes verify role server-side.
- Add rate limits to auth, checkout, uploads, support, and admin-sensitive endpoints.
- Review upload handling before accepting product media or private KYC documents.
- Run dependency audit and decide on remediation for high/critical advisories.
- Confirm privacy, terms, returns, disputes, prohibited items, seller terms, and contact pages are launch-visible.
- Keep admin credentials and production database access limited to named operators.

## Go/No-Go Criteria

Recommend "go" for private beta only when:

- All release gates pass.
- Zero Critical blockers remain.
- Zero High blockers remain in auth, checkout, role access, order creation, database, admin moderation, seller fulfillment, support escalation, backup/restore, or finance reconciliation.
- QA has attached smoke evidence for buyer, seller, admin, checkout, mobile, and role access.
- Operations has assigned seller/order/return/dispute SOP owners.
- Support has launch ticket taxonomy, SLAs, and escalation contacts.
- Finance has reconciled at least one full order lifecycle sample.
- DevOps has monitoring, backup, restore, incident, and rollback evidence.

Recommend "no-go" for public launch if any of these remain true:

- Restore has not been rehearsed.
- Production monitoring/alerts are not active.
- Admin or seller role protection is unverified.
- Checkout or order creation has unclosed Critical/High defects.
- Support cannot link buyer issues to order/seller/payment context.
- Finance cannot reconcile orders, commissions, refunds, earnings, and payout holds.
- Seller quality, listing moderation, and fulfillment exception handling are manual and ownerless.

## Immediate Follow-Up Issues

Create or keep open separate implementation issues for:

1. Production monitoring and alert dashboard setup.
2. Database backup automation and restore rehearsal evidence.
3. P0 production smoke test execution and evidence capture.
4. Dependency audit remediation for high/critical advisories.
5. Upload hardening for product media and private seller/KYC documents.
6. Stripe PaymentIntent and webhook implementation if live card payments are required.
7. Resend transactional email configuration and deliverability monitoring.
8. Launch command center tracker with owners, blockers, gates, and daily cadence.

## Final Handoff

This plan is the Phase 1H production deployment and operations baseline. It is sufficient to guide a controlled cPanel MVP deployment and private beta, but it is not a substitute for actual production evidence. The next operational step is to execute the gates above, attach evidence in the launch tracker, and keep public launch blocked until buyer trust, money movement, role access, backups, monitoring, support, and incident response are proven.
