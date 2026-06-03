# Production Deployment Guide

## Overview
This guide walks you through deploying the Multi-Vendor Marketplace to production using Vercel (frontend) and Supabase (backend/database).

---

## Prerequisites

### Required Accounts
1. **Vercel Account** - [Sign up](https://vercel.com/signup)
2. **Supabase Account** - [Sign up](https://supabase.com)
3. **Resend Account** - [Sign up](https://resend.com) (for email notifications)
4. **GitHub Account** - For CI/CD integration
5. **Domain** (optional but recommended) - Your custom domain

### Local Setup
- Node.js 18+ installed
- Git installed
- Project cloned and working locally

---

## Step 1: Supabase Production Setup

### 1.1 Create Production Project
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Click "New Project"
3. Choose organization
4. Fill in project details:
   - **Name**: Your marketplace name (e.g., "marketplace-prod")
   - **Database Password**: Generate a strong password (save this!)
   - **Region**: Choose closest to your users
   - **Pricing Plan**: Pro recommended for production

### 1.2 Run Database Migrations
1. Navigate to SQL Editor in Supabase dashboard
2. Copy the contents of `supabase/migrations/` files
3. Execute each migration in order
4. Verify all tables are created correctly

### 1.3 Configure Auth Settings
1. Go to Authentication → Settings
2. **Site URL**: Set to your production domain (e.g., `https://yourmarketplace.com`)
3. **Redirect URLs**: Add:
   - `https://yourmarketplace.com/*`
   - `https://yourmarketplace.com/auth/callback`
4. **Email Auth**: Ensure it's enabled
5. **Email Templates**: Customize if needed

### 1.4 Configure Storage
1. Go to Storage
2. Create buckets:
   - `product-images` (public)
   - `vendor-documents` (private)
3. Set up bucket policies for access control

### 1.5 Get API Keys
1. Go to Settings → API
2. Copy these values (you'll need them for Vercel):
   - **Project URL**: `https://your-project.supabase.co`
   - **anon/public key**: Safe for browser
   - **service_role key**: Server-side only, keep secret

---

## Step 2: Email Setup (Resend)

### 2.1 Create Resend Account
1. Sign up at [resend.com](https://resend.com)
2. Verify your email

### 2.2 Add Domain
1. Go to Domains → Add Domain
2. Enter your domain (e.g., `yourmarketplace.com`)
3. Add DNS records shown by Resend to your domain provider
4. Wait for verification (usually 5-15 minutes)

### 2.3 Get API Key
1. Go to API Keys
2. Create new API key
3. Copy the key (you'll need it for Vercel)
4. Save it securely

### 2.4 Update Email Templates
1. Open `src/lib/email.ts`
2. Replace all instances of `yourdomain.com` with your actual domain
3. Customize email templates if needed

---

## Step 3: Vercel Deployment

### 3.1 Prepare Repository
```bash
# Commit all changes
git add .
git commit -m "Prepare for production deployment"
git push origin main
```

### 3.2 Import Project to Vercel
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "Add New Project"
3. Import your GitHub repository
4. Configure project:
   - **Framework Preset**: Next.js
   - **Root Directory**: `./`
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next`

### 3.3 Configure Environment Variables
In Vercel project settings → Environment Variables, add:

```bash
# Application
NEXT_PUBLIC_APP_URL=https://yourmarketplace.com
NODE_ENV=production

# Supabase (from Step 1.5)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Email (from Step 2.3)
RESEND_API_KEY=your_resend_api_key
EMAIL_FROM_DOMAIN=yourmarketplace.com
```

**Important**: 
- Set environment for: Production, Preview, Development (check all three)
- Never expose `SUPABASE_SERVICE_ROLE_KEY` or `RESEND_API_KEY` to the browser

### 3.4 Deploy
1. Click "Deploy"
2. Wait for build to complete (usually 2-3 minutes)
3. Visit your deployment URL: `https://your-project.vercel.app`

---

## Step 4: Custom Domain Setup

### 4.1 Add Domain to Vercel
1. Go to Project Settings → Domains
2. Add your domain: `yourmarketplace.com`
3. Add `www` subdomain: `www.yourmarketplace.com`

### 4.2 Configure DNS
Add these records to your domain provider:

**For root domain:**
```
Type: A
Name: @
Value: 76.76.21.21
```

**For www subdomain:**
```
Type: CNAME
Name: www
Value: cname.vercel-dns.com
```

### 4.3 Enable HTTPS
1. Vercel automatically provisions SSL certificates
2. Wait for DNS propagation (can take up to 48 hours)
3. Verify HTTPS is working: `https://yourmarketplace.com`

### 4.4 Update Environment Variables
1. Go to Vercel project settings → Environment Variables
2. Update `NEXT_PUBLIC_APP_URL` to your custom domain
3. Redeploy the application

---

## Step 5: Post-Deployment Configuration

### 5.1 Update Supabase Auth URLs
1. Go to Supabase Dashboard → Authentication → URL Configuration
2. Update Site URL to `https://yourmarketplace.com`
3. Update Redirect URLs to include your domain

### 5.2 Seed Initial Data
Run these in Supabase SQL Editor:

```sql
-- Create default admin user (update email/password)
INSERT INTO auth.users (id, email) 
VALUES (gen_random_uuid(), 'admin@yourmarketplace.com');

-- Assign admin role
INSERT INTO profiles (id, email, role, full_name)
VALUES (
  (SELECT id FROM auth.users WHERE email = 'admin@yourmarketplace.com'),
  'admin@yourmarketplace.com',
  'admin',
  'Admin User'
);

-- Create sample categories
INSERT INTO categories (name, slug, is_active) VALUES
('Electronics', 'electronics', true),
('Fashion', 'fashion', true),
('Home & Garden', 'home-garden', true),
('Sports', 'sports', true);

-- Set commission rate
INSERT INTO system_settings (key, value, description) VALUES
('commission_rate', '10.00', 'Default platform commission percentage'),
('tax_rate', '0.00', 'Default tax rate'),
('shipping_rate', '0.00', 'Default shipping cost');
```

### 5.3 Test Critical Flows
1. **User Registration**: Create a customer account
2. **Seller Registration**: Create a seller account
3. **Admin Login**: Log in as admin
4. **Seller Approval**: Admin approves seller
5. **Product Creation**: Seller adds a product
6. **Product Approval**: Admin approves product
7. **Purchase Flow**: Customer buys a product
8. **Email Delivery**: Verify all emails are sent
9. **Payout Request**: Seller requests withdrawal

---

## Step 6: Monitoring & Analytics

### 6.1 Vercel Analytics
1. Go to Project Settings → Analytics
2. Enable Vercel Analytics (free tier included)
3. Monitor performance metrics

### 6.2 Supabase Monitoring
1. Supabase Dashboard → Database → Reports
2. Monitor query performance
3. Check API usage and rate limits

### 6.3 Error Tracking (Recommended)
Set up Sentry:
```bash
npm install @sentry/nextjs
npx @sentry/wizard@latest -i nextjs
```

Add to environment variables:
```bash
NEXT_PUBLIC_SENTRY_DSN=your_sentry_dsn
SENTRY_AUTH_TOKEN=your_auth_token
```

### 6.4 Uptime Monitoring
Use services like:
- UptimeRobot (free)
- Pingdom
- StatusCake

Configure alerts for downtime.

---

## Step 7: Security Hardening

### 7.1 Enable Rate Limiting (Recommended)
Set up Upstash rate limiting:
```bash
npm install @upstash/ratelimit @upstash/redis
```

Create `src/lib/rate-limit.ts`:
```typescript
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

export const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, "10 s"),
  analytics: true,
});
```

### 7.2 Security Headers
Vercel automatically adds security headers. Verify in `vercel.json`:
```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "Referrer-Policy",
          "value": "origin-when-cross-origin"
        }
      ]
    }
  ]
}
```

### 7.3 Database Backups
1. Supabase Pro includes daily backups
2. Go to Database → Backups
3. Enable Point-in-Time Recovery (PITR)
4. Test restore process

### 7.4 Secrets Rotation
Schedule regular rotation:
- Supabase service role key: Every 90 days
- Resend API key: Every 90 days
- Admin passwords: Every 60 days

---

## Step 8: Performance Optimization

### 8.1 Enable Caching
Add Redis for caching (Upstash recommended):
```bash
REDIS_URL=your_upstash_redis_url
REDIS_TOKEN=your_token
```

### 8.2 Image Optimization
Already configured with Next.js Image component. Verify:
- Images are using Next.js `<Image />` component
- Lazy loading is enabled
- WebP format is served automatically

### 8.3 Database Optimization
Run these commands in Supabase SQL Editor:
```sql
-- Analyze tables for query optimization
ANALYZE products;
ANALYZE orders;
ANALYZE order_items;

-- Check missing indexes
SELECT schemaname, tablename, attname, n_distinct
FROM pg_stats
WHERE schemaname = 'public'
ORDER BY n_distinct DESC;
```

---

## Step 9: Maintenance & Updates

### 9.1 Regular Updates
```bash
# Update dependencies monthly
npm update
npm audit fix

# Test locally
npm run build
npm run start

# Commit and push (triggers auto-deploy)
git add package*.json
git commit -m "Update dependencies"
git push
```

### 9.2 Database Migrations
For schema changes:
1. Test migration in staging first
2. Create new migration file
3. Run in production during low-traffic hours
4. Verify with test queries

### 9.3 Monitoring Checklist (Daily)
- [ ] Check error logs in Sentry
- [ ] Verify email delivery rates in Resend
- [ ] Monitor database performance in Supabase
- [ ] Check API usage and rate limits
- [ ] Review Vercel deployment logs

---

## Troubleshooting

### Common Issues

**1. Build fails on Vercel**
- Check Node.js version in `package.json` (should be 18+)
- Verify all environment variables are set
- Check for TypeScript errors: `npm run build` locally

**2. Database connection issues**
- Verify Supabase URL and keys are correct
- Check RLS policies are enabled
- Ensure project is not paused (Free tier auto-pauses)

**3. Emails not sending**
- Verify Resend domain is verified
- Check API key is correct
- Look for errors in Vercel logs
- Test with Resend's test mode

**4. 500 Internal Server Error**
- Check Vercel function logs
- Verify environment variables
- Look for database query errors
- Check Supabase service status

**5. Slow page loads**
- Enable Vercel Analytics to identify bottlenecks
- Check database query performance
- Optimize images
- Enable caching

---

## Rollback Procedure

If deployment breaks production:

### Quick Rollback (Vercel)
1. Go to Vercel Dashboard → Deployments
2. Find last working deployment
3. Click three dots → Promote to Production
4. Site reverts in ~30 seconds

### Database Rollback (Supabase)
1. Go to Database → Backups
2. Select restore point
3. Create new branch or restore in place
4. Verify data integrity

---

## Support & Resources

### Documentation
- [Next.js Docs](https://nextjs.org/docs)
- [Supabase Docs](https://supabase.com/docs)
- [Vercel Docs](https://vercel.com/docs)
- [Resend Docs](https://resend.com/docs)

### Community
- [Marketplace GitHub Issues](https://github.com/yourusername/marketplace/issues)
- [Supabase Discord](https://discord.supabase.com/)
- [Vercel Discord](https://vercel.com/discord)

### Professional Support
- Supabase Pro Support: support@supabase.io
- Vercel Enterprise Support: vercel.com/support
- Custom Development: [Your contact]

---

## Checklist: Pre-Launch

Before going live to customers:

### Infrastructure
- [ ] Production Supabase project created
- [ ] All database migrations applied
- [ ] RLS policies tested and working
- [ ] Supabase backups enabled
- [ ] Custom domain configured
- [ ] SSL certificate active
- [ ] All environment variables set

### Functionality
- [ ] User registration working
- [ ] Seller onboarding tested
- [ ] Product creation and approval tested
- [ ] Cart and checkout working
- [ ] Payment flow tested (with test cards)
- [ ] Email notifications sending
- [ ] Order tracking working
- [ ] Admin dashboard functional

### Security
- [ ] All secrets rotated from development
- [ ] Rate limiting enabled
- [ ] Security headers configured
- [ ] CORS properly configured
- [ ] Admin account secured with strong password
- [ ] Service role keys not exposed to browser

### Performance
- [ ] Images optimized
- [ ] Database indexes created
- [ ] Caching configured
- [ ] Page load times < 3 seconds
- [ ] Mobile performance tested

### Monitoring
- [ ] Error tracking setup (Sentry)
- [ ] Uptime monitoring configured
- [ ] Analytics enabled
- [ ] Logs accessible and searchable

### Legal & Compliance
- [ ] Privacy policy published
- [ ] Terms of service published
- [ ] Cookie consent implemented (if EU)
- [ ] GDPR compliance reviewed (if EU)
- [ ] Refund policy published

### Content
- [ ] Sample products added
- [ ] Categories populated
- [ ] Homepage content finalized
- [ ] About page created
- [ ] Contact page created
- [ ] FAQ section added

---

## Success! 🎉

Your multi-vendor marketplace is now live in production!

Next steps:
1. Announce launch to your network
2. Onboard first sellers
3. Monitor metrics daily
4. Gather user feedback
5. Iterate and improve

For questions or issues, refer to the troubleshooting section or contact support.