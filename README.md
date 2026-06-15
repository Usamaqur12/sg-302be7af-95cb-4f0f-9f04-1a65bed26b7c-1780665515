# Mercato Multi-Vendor Marketplace

Amazon/Daraz-style marketplace with customer storefront, seller workspace, and admin console. The app is built with Next.js Pages Router, TypeScript, Tailwind CSS, shadcn/ui, and a cPanel-ready MySQL backend.

## Portals

- Customer storefront: Amazon-style menu, category browsing, cart, wishlist, checkout, order tracking and product discovery.
- Seller workspace: Daraz-style sidebar modules for products, orders, reviews, account health, marketing, analytics, learning, store, finance, support and account settings.
- Admin console: users, sellers, product moderation, categories, orders, payments, payouts, reports, support, settings and Seller Center controls.

## Local Development

```bash
npm install
npm run dev
```

Open:

```text
http://localhost:3000
```

Local development can run without MySQL. It uses `.localdb/marketplace.json` as a real local database fallback.

Local demo accounts:

```text
Admin:    admin@marketplace.com / Admin12345
Seller:   seller@marketplace.com / Seller12345
Customer: customer@marketplace.com / Customer12345
```

## Production Build

```bash
npm run build
npm run start
```

Production output is written to `.next-build` via `next.config.mjs`. This avoids the local `.next` cache permission lock that happened during earlier failed builds.

## cPanel Deployment

Use `CPANEL_DEPLOYMENT.md` for the full deployment checklist.

Minimum cPanel Node.js settings:

```text
Application startup file: server.cjs
Application mode: Production
Application root: uploaded project folder
```

Required environment variables:

```env
NODE_ENV=production
PORT=3000
NEXT_PUBLIC_APP_URL=https://your-domain.com
AUTH_SECRET=replace-with-a-long-random-secret-at-least-32-characters
DB_HOST=localhost
DB_PORT=3306
DB_NAME=cpaneluser_marketplace
DB_USER=cpaneluser_marketplace
DB_PASSWORD=your_mysql_password
```

Database setup:

```bash
npm run db:install
npm run setup:admin -- admin@example.com "StrongAdminPassword" "Admin Name"
```

The MySQL schema is in `database/mysql/schema.sql`.

## Useful Commands

```bash
npm run dev
npm run build
npm run start
npm run type-check
npm run lint
npm run db:install
npm run setup:admin -- admin@example.com "StrongAdminPassword" "Admin Name"
```

## Notes

- `/api/auth/dev-login` is local-development only and disabled in production.
- Seller product creation is approval-gated; seller products are created as pending and must be approved by admin before becoming public.
- Admin Seller Center controls can enable/disable seller sidebar options, learning cards, toolkit shortcuts, notifications, holiday mode, order volume limit and account health values.
- File uploads are URL-field ready; production upload storage can be added with cPanel file storage, S3-compatible storage, Cloudinary, or another CDN.
