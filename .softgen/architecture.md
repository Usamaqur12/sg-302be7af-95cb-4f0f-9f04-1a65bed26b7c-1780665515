# Multi-Vendor Marketplace - System Architecture

## Overview
This is a complete Amazon-style multi-vendor ecommerce marketplace with three separate portals: Customer Frontend, Seller Dashboard, and Admin Dashboard.

## Technology Stack

### Frontend
- **Framework**: Next.js 15.5 (Page Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS + shadcn/ui components
- **State Management**: React Context API (CartContext, ThemeProvider)
- **Authentication**: Supabase Auth with JWT tokens
- **Image Optimization**: Next.js Image component
- **Icons**: Lucide React

### Backend
- **Database**: PostgreSQL (via Supabase)
- **Authentication**: Supabase Auth (email/password, OAuth ready)
- **Storage**: Supabase Storage (for product images, vendor documents)
- **API**: Supabase Client (REST + Real-time subscriptions)
- **Row-Level Security**: PostgreSQL RLS policies for role-based access

### Infrastructure
- **Hosting**: Vercel (frontend) + Supabase (backend)
- **CDN**: Vercel Edge Network
- **Database**: Supabase PostgreSQL with connection pooling
- **File Storage**: Supabase Storage with CDN

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     CLIENT LAYER                             │
├─────────────────────────────────────────────────────────────┤
│  Customer Frontend    │  Seller Dashboard  │  Admin Panel   │
│  (Next.js Pages)      │  (Next.js Pages)   │  (Next.js)     │
│  - Homepage           │  - Dashboard       │  - Dashboard   │
│  - Product Catalog    │  - Products        │  - Sellers     │
│  - Cart/Checkout      │  - Orders          │  - Products    │
│  - Orders             │  - Earnings        │  - Payouts     │
│  - Account            │  - Withdrawals     │  - Analytics   │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                   APPLICATION LAYER                          │
├─────────────────────────────────────────────────────────────┤
│  Supabase Client Library                                     │
│  - Authentication Service                                    │
│  - Database Queries (with RLS)                              │
│  - Real-time Subscriptions                                   │
│  - Storage Operations                                        │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                     DATA LAYER                               │
├─────────────────────────────────────────────────────────────┤
│  PostgreSQL Database (Supabase)                              │
│  - 20+ Tables with relationships                             │
│  - Row-Level Security policies                              │
│  - Triggers and Functions                                   │
│  - Indexes for performance                                   │
│                                                              │
│  Supabase Storage                                            │
│  - Product images                                            │
│  - Vendor documents                                          │
│  - User avatars                                              │
└─────────────────────────────────────────────────────────────┘
```

## Role-Based Access Control

### Customer Role
- Browse and search products
- Add to cart and checkout
- Track orders
- Leave reviews
- Manage wishlist
- View order history

### Seller Role
- Manage products (CRUD)
- Process orders
- Track earnings
- Request withdrawals
- View analytics
- Manage shop profile

### Admin Role
- Approve/reject sellers
- Moderate products
- Manage all orders
- Process payouts
- Configure commission rates
- View platform analytics
- Manage categories

## Security Architecture

### Authentication Flow
```
1. User Registration/Login
   ↓
2. Supabase Auth validates credentials
   ↓
3. JWT token issued (stored in httpOnly cookie)
   ↓
4. Profile created with role assignment
   ↓
5. RLS policies enforce role-based access
```

### Row-Level Security (RLS)
- All tables have RLS enabled
- Policies check `auth.uid()` for user context
- Role-based policies for customer/seller/admin
- Sellers can only access their own products/orders
- Customers can only access their own carts/orders
- Admins have full access to all data

### Data Protection
- Passwords hashed by Supabase Auth
- JWT tokens with short expiration
- HTTPS-only connections
- CORS configured properly
- Input validation on all forms
- SQL injection prevention via parameterized queries

## Database Architecture

### Core Tables
1. **profiles** - User profiles with role
2. **seller_profiles** - Extended seller information
3. **categories** - Product categories (hierarchical)
4. **products** - Product listings
5. **product_images** - Product image gallery
6. **carts** - Shopping carts
7. **cart_items** - Items in carts
8. **orders** - Customer orders
9. **order_items** - Line items in orders
10. **payments** - Payment records
11. **reviews** - Product reviews
12. **wishlists** - Saved products
13. **withdrawal_requests** - Seller payout requests
14. **seller_earnings** - Earnings tracking
15. **support_tickets** - Customer support
16. **coupons** - Discount codes
17. **banners** - Homepage promotions
18. **system_settings** - Platform configuration

### Relationships
- One-to-Many: categories → products, sellers → products
- One-to-Many: orders → order_items, products → images
- Many-to-Many: users ↔ wishlists ↔ products
- Foreign Keys with CASCADE/RESTRICT as appropriate

## Payment Architecture

### Order Flow
```
1. Customer adds products to cart
   ↓
2. Proceeds to checkout
   ↓
3. Order created with "pending" status
   ↓
4. Payment record created
   ↓
5. Commission calculated and deducted
   ↓
6. Seller earnings recorded
   ↓
7. Order status updated to "processing"
```

### Commission Calculation
- Platform commission rate stored in system_settings
- Commission calculated per order item
- `seller_earnings = item_subtotal - (item_subtotal × commission_rate / 100)`
- Commission tracked in order_items table

### Payout Flow
```
1. Seller requests withdrawal
   ↓
2. Withdrawal request created with "pending" status
   ↓
3. Admin reviews in payout dashboard
   ↓
4. Admin approves/rejects
   ↓
5. Status updated with completed_at/rejected_at timestamp
   ↓
6. Seller notified of payout status
```

## File Upload Architecture

### Product Images
- Uploaded via Supabase Storage
- Multiple images per product
- Display order tracked in product_images table
- Optimized with Next.js Image component
- Base64 encoding for preview (MVP phase)

### Vendor Documents
- KYC documents uploaded to Supabase Storage
- Stored securely with access controls
- Admin-only access for verification
- Document type and verification status tracked

## Scalability Considerations

### Database Optimization
- Indexes on frequently queried columns (seller_id, category_id, status)
- Foreign key indexes for join optimization
- Pagination implemented on product/order lists
- Database connection pooling via Supabase

### Caching Strategy (Future)
- Redis for session management
- Product catalog caching
- Search results caching
- User cart caching

### Performance Optimization
- Next.js Static Generation for product pages
- Image optimization with Next.js Image
- Lazy loading for product grids
- Client-side caching with React Query (future)

## Deployment Architecture

### Production Environment
```
┌─────────────────┐
│   Vercel        │
│   (Frontend)    │
└────────┬────────┘
         │
         ↓
┌─────────────────┐
│   Supabase      │
│   - PostgreSQL  │
│   - Auth        │
│   - Storage     │
└─────────────────┘
```

### CI/CD Pipeline
- GitHub integration with Vercel
- Automatic deployments on push to main
- Preview deployments for pull requests
- Environment variables managed in Vercel dashboard

## Monitoring & Logging

### Application Monitoring
- Vercel Analytics for performance
- Supabase Dashboard for database metrics
- Error tracking with console.error (production logging to be added)

### Security Monitoring
- Supabase Auth logs
- Database audit logs for admin actions
- Failed authentication attempts tracked

## API Design

### RESTful Endpoints (via Supabase)
- GET `/api/products` - List products
- GET `/api/products/:id` - Product details
- POST `/api/cart` - Add to cart
- POST `/api/orders` - Create order
- GET `/api/orders/:id` - Order details
- All endpoints secured with RLS policies

### Real-time Features (Future)
- Order status updates via Supabase Realtime
- New order notifications for sellers
- Stock level updates

## Future Enhancements

### Phase 2
- Advanced search with filters
- Product variants (size, color)
- Bulk product upload
- Email notifications
- SMS notifications

### Phase 3
- Real-time chat support
- Advanced analytics dashboard
- AI-powered recommendations
- Multi-currency support
- Internationalization (i18n)

### Phase 4
- Mobile apps (React Native)
- Seller mobile app
- Push notifications
- Offline support
- Progressive Web App (PWA)