# Multi-Vendor Marketplace Platform

Amazon-style marketplace connecting customers, sellers, and platform admin. Built with Next.js, TypeScript, Supabase, and shadcn/ui.

## Features

### Customer Portal
- Browse products by category
- Search and advanced filtering
- Product details with reviews and ratings
- Shopping cart and wishlist
- Checkout with Cash on Delivery
- Order tracking and history
- Return/refund requests
- Seller directory

### Seller Dashboard
- Seller registration and KYC verification
- Product management (CRUD)
- Inventory and pricing control
- Order processing and fulfillment
- Earnings dashboard
- Payout requests
- Customer reviews and messages
- Analytics and reports

### Admin Dashboard
- User management
- Seller approval and verification
- Product moderation
- Category management
- Order management
- Payment and payout oversight
- Commission settings
- Reports and analytics
- Support ticket system

## Tech Stack

- **Framework:** Next.js 15 (Pages Router)
- **Language:** TypeScript
- **Database:** Supabase (PostgreSQL)
- **Authentication:** Supabase Auth
- **Storage:** Supabase Storage (upload-ready)
- **UI:** shadcn/ui + Tailwind CSS
- **Icons:** Lucide React

## Prerequisites

- Node.js 18+ and npm
- Supabase account
- (Optional) Cloudinary account for additional image hosting

## Environment Variables

Create a `.env.local` file in the root directory:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=your_upload_preset

EMAIL_SERVER_HOST=smtp.example.com
EMAIL_SERVER_PORT=587
EMAIL_FROM=noreply@marketplace.com
```

**Important Security Notes:**
- Never expose `SUPABASE_SERVICE_ROLE_KEY` in client-side code
- Keep all secrets in `.env.local` (never commit to git)
- Use environment variables in deployment platforms

## Installation

```bash
npm install

npm run dev
```

Visit `http://localhost:3000`

## Deployment

### Softgen Preview

The app is configured to run on Softgen's sandboxed preview environment:

1. Environment variables are managed via Softgen settings
2. Supabase connection is configured via the integration panel
3. Live preview updates automatically on file changes

### cPanel Hosting

#### Option 1: Node.js App (if cPanel supports Node.js)

1. **Build the application:**
   ```bash
   npm run build
   ```

2. **Upload files to cPanel:**
   - Upload all files except `node_modules/` and `.next/`
   - Use File Manager or FTP

3. **Install dependencies on server:**
   ```bash
   npm install --production
   ```

4. **Set environment variables:**
   - Add environment variables via cPanel Node.js app settings
   - Or create `.env.local` file on server (less secure)

5. **Start the application:**
   ```bash
   npm run start
   ```

6. **Configure cPanel:**
   - Set application URL
   - Set entry point to `npm run start` or `node server.js`
   - Ensure port is correctly mapped

#### Option 2: Static Export (NOT RECOMMENDED)

This marketplace requires server-side features (API routes, SSR), so static export will break functionality.

### Vercel (Recommended Alternative)

For easier deployment with full Next.js support:

```bash
npm install -g vercel
vercel
```

Vercel automatically handles:
- Environment variables
- API routes
- SSR/ISR
- Image optimization
- Serverless functions

## Database Setup

### Supabase Schema

The database schema is defined in `supabase/migrations/`. Key tables:

- `profiles` - User profiles with roles (customer, seller, admin)
- `seller_profiles` - Seller-specific data and verification
- `categories` - Product categories
- `products` - Product listings
- `product_images` - Product image URLs
- `orders` - Customer orders
- `order_items` - Order line items
- `carts` - Shopping carts
- `cart_items` - Cart line items
- `reviews` - Product reviews
- `wishlists` - Customer wishlists
- `payouts` - Seller payout requests

### Row Level Security (RLS)

RLS policies are configured for multi-tenant security:

- Customers can only see their own orders and cart
- Sellers can only manage their own products and orders
- Admins have full access to manage all data
- Public can view approved products and categories

### Helper Functions

- `is_admin()` - Check if current user is admin (SECURITY DEFINER)
- Profile creation triggers on user signup

## File Uploads

The app is configured for **Supabase Storage** with upload-ready URL fields:

- Product images: stored as URLs in `product_images` table
- Seller logos: `logo_url` field in `seller_profiles`
- KYC documents: URL fields in `seller_profiles`

**To enable uploads:**

1. Create Supabase Storage buckets:
   - `product-images` (public)
   - `seller-documents` (private)
   - `seller-logos` (public)

2. Implement upload in product/seller forms (placeholder UI exists)

3. Alternative: Use Cloudinary by setting env vars and updating upload logic

## Demo Accounts

Seed data includes test accounts:

- **Admin:** admin@marketplace.com / Admin@123
- **Seller (Approved):** seller@marketplace.com / Seller@123
- **Seller (Pending):** pending@marketplace.com / Seller@123
- **Customer:** customer@marketplace.com / Customer@123

## Payment Integration

Currently configured for **Cash on Delivery (COD)** as a demo payment method.

**To integrate Stripe:**

1. Install Stripe:
   ```bash
   npm install stripe @stripe/stripe-js
   ```

2. Add environment variables:
   ```env
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_key
   STRIPE_SECRET_KEY=your_secret_key
   ```

3. Update checkout flow in `src/pages/checkout.tsx`
4. Add Stripe webhook handler in `src/pages/api/webhooks/stripe.ts`
5. Update order creation to wait for payment confirmation

## Commission System

Admin commission is configured per seller in `seller_profiles.commission_rate` (default 12%).

When orders are created:
- Total amount is stored in `orders.total`
- Commission calculation is ready for payout processing
- Sellers can request payouts via dashboard
- Admin approves/rejects payout requests

## Known Limitations

- **Payment:** Only Cash on Delivery is implemented (Stripe ready for integration)
- **Shipping:** Manual status updates (no carrier API integration)
- **Split Payments:** Commission calculated but auto-payout not implemented
- **File Uploads:** URL fields ready, but file upload UI needs Supabase Storage or Cloudinary integration
- **Email Notifications:** Email templates exist but SMTP not configured
- **Search:** Basic search implemented, full-text search needs Supabase extension
- **Real-time:** WebSocket features (order updates, messages) not implemented

## Development

```bash
npm run dev

npm run type-check

npm run lint

npm run build

npm run start
```

## Project Structure

```
src/
├── components/       # Reusable UI components
│   ├── ui/          # shadcn/ui components
│   ├── CustomerLayout.tsx
│   ├── SellerLayout.tsx
│   └── AdminLayout.tsx
├── contexts/        # React contexts (Auth, Cart)
├── hooks/           # Custom React hooks
├── integrations/    # Supabase client and types
├── lib/             # Utilities and helpers
├── pages/           # Next.js pages (routes)
│   ├── api/        # API routes
│   ├── admin/      # Admin portal
│   ├── seller/     # Seller portal
│   └── ...         # Customer pages
├── services/        # Supabase service layer
└── styles/          # Global styles
```

## Support

For issues or questions:
- Check existing GitHub issues
- Create new issue with reproduction steps
- Contact support@marketplace.com

## License

Proprietary - All rights reserved