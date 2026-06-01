---
title: Admin Dashboard & Platform Management
status: todo
priority: medium
type: feature
tags: [frontend, admin, dashboard]
created_by: agent
created_at: 2026-06-01T13:07:17Z
position: 5
---

## Notes
Admin control panel: approve sellers/products, manage categories, oversee orders/payments, configure commission, handle withdrawals, manage content (banners, coupons, pages), analytics.

## Checklist
- [ ] Admin dashboard: key metrics cards, recent activity feed, charts (sales, orders, users)
- [ ] User management table: filter by role, view details, ban/activate accounts
- [ ] Seller approval queue: review KYC docs, approve/reject with reason
- [ ] Product approval queue: review product details, approve/reject
- [ ] Category management: add/edit/delete categories and subcategories, reorder
- [ ] Orders overview: filter by status, search, view details, update status, process refunds
- [ ] Payments list: transaction history, filter by type, export
- [ ] Commission settings: set global percentage, per-category overrides
- [ ] Withdrawal requests queue: approve/reject, mark as paid
- [ ] Coupons management: create codes, set discount rules, usage limits
- [ ] Banners management: upload images, set links, order, active toggle
- [ ] Content pages: create/edit FAQ, blog posts, testimonials
- [ ] Analytics dashboard: revenue charts, top products, top sellers, conversion metrics
- [ ] Support tickets: view, assign, respond, close
- [ ] Notification system: broadcast announcements to roles
- [ ] Shipping settings: zones, rates, carriers
- [ ] Tax settings: rates by region

## Acceptance
- Admin can approve sellers (triggers email, unlocks seller dashboard)
- Product approvals make items visible on customer frontend
- Commission calculates automatically on new orders
- Withdrawal approvals update seller balances, mark as completed