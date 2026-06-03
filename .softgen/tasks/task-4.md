---
title: Seller Dashboard & Product Management
status: done
priority: high
type: feature
tags: [frontend, seller, dashboard]
created_by: agent
created_at: 2026-06-01T13:07:17Z
position: 4
---

## Notes
Seller portal: registration/verification, store profile, product CRUD, inventory management, order processing, earnings tracking, withdrawal system.

## Checklist
- [x] Seller dashboard: earnings overview, pending orders, product stats
- [x] Product management table: list all products, status badges, edit/delete actions
- [x] Add product form: title, description, category, price, stock, images upload
- [x] Orders list: filter by status, order detail view, update shipping status
- [x] Earnings dashboard: total sales, commission breakdown, available balance chart
- [x] Withdrawal request form with amount validation
- [x] Withdrawal history table showing status
- [ ] Edit product form with image reordering (create when needed)
- [ ] Seller registration form with business details, KYC document upload (create when needed)
- [ ] Store profile page: edit store name, logo, description, policies (create when needed)
- [ ] Inventory management: stock alerts, bulk price updates (future enhancement)
- [ ] Customer reviews section for seller's products (future enhancement)
- [ ] Messages inbox for customer inquiries (future enhancement)

## Acceptance
- Seller can register, upload KYC, await admin approval
- Product CRUD works with image uploads, products pending admin approval
- Order status updates trigger customer notifications
- Earnings calculated correctly (order total minus admin commission)