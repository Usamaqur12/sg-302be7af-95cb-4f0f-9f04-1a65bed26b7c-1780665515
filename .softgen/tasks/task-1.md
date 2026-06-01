---
title: Database Schema & Authentication
status: done
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
- [x] Create users table with role enum
- [x] Create seller_profiles table (KYC, verification status, commission)
- [x] Create categories and subcategories tables
- [x] Create products table (seller FK, category FK, approval status)
- [x] Create product_images table
- [x] Create cart and cart_items tables
- [x] Create orders table with status tracking
- [x] Create order_items table
- [x] Create payments table
- [x] Create seller_earnings and withdrawal_requests tables
- [x] Create reviews and ratings table
- [x] Create wishlists table
- [x] Create coupons, banners, support_tickets tables
- [x] Set up RLS policies for all tables (role-based access)
- [x] Create auth triggers for user profile creation
- [x] Generate TypeScript types

## Acceptance
- All tables exist with proper relationships and constraints
- RLS policies enforce role-based access (admin sees all, sellers see own, customers see approved)
- Auth flow creates user profiles automatically