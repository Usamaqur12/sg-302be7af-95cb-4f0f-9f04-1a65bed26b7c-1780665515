---
title: Database Schema & Authentication
status: in_progress
priority: urgent
type: feature
tags: [backend, database, auth]
created_by: agent
created_at: 2026-06-01T13:07:17Z
position: 1
---

## Notes
Foundation layer: complete database schema with all tables, relationships, RLS policies, and role-based authentication system. Three user roles (customer, seller, admin) with proper permissions.

## Checklist
- [ ] Create users table with role enum
- [ ] Create seller_profiles table (KYC, verification status, commission)
- [ ] Create categories and subcategories tables
- [ ] Create products table (seller FK, category FK, approval status)
- [ ] Create product_images table
- [ ] Create cart and cart_items tables
- [ ] Create orders table with status tracking
- [ ] Create order_items table
- [ ] Create payments table
- [ ] Create seller_earnings and withdrawal_requests tables
- [ ] Create reviews and ratings table
- [ ] Create wishlists table
- [ ] Create coupons, banners, support_tickets tables
- [ ] Set up RLS policies for all tables (role-based access)
- [ ] Create auth triggers for user profile creation
- [ ] Generate TypeScript types

## Acceptance
- All tables exist with proper relationships and constraints
- RLS policies enforce role-based access (admin sees all, sellers see own, customers see approved)
- Auth flow creates user profiles automatically