# API Planning Documentation

## Overview
This document outlines the API structure for the multi-vendor marketplace. All APIs are accessed via Supabase client with automatic Row-Level Security enforcement.

## Authentication APIs

### POST /auth/signup
Register a new user account.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "role": "customer" // or "seller"
}
```

**Response:**
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com"
  },
  "session": {
    "access_token": "jwt_token",
    "refresh_token": "refresh_token"
  }
}
```

---

### POST /auth/signin
Login to existing account.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

**Response:**
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "role": "customer"
  },
  "session": {
    "access_token": "jwt_token",
    "refresh_token": "refresh_token"
  }
}
```

---

### POST /auth/signout
Logout user and invalidate session.

**Response:**
```json
{
  "message": "Successfully logged out"
}
```

---

## Product APIs

### GET /api/products
List all approved products with filtering and pagination.

**Query Parameters:**
- `category_id` (optional) - Filter by category
- `seller_id` (optional) - Filter by seller
- `search` (optional) - Search in title/description
- `min_price` (optional) - Minimum price filter
- `max_price` (optional) - Maximum price filter
- `sort` (optional) - Sort by: price_asc, price_desc, rating, newest
- `limit` (default: 20) - Items per page
- `offset` (default: 0) - Pagination offset

**Response:**
```json
{
  "products": [
    {
      "id": "uuid",
      "title": "Product Name",
      "slug": "product-name",
      "price": 29.99,
      "compare_at_price": 39.99,
      "rating": 4.5,
      "total_reviews": 23,
      "images": [
        {
          "url": "https://...",
          "alt_text": "Product image"
        }
      ],
      "seller": {
        "business_name": "Seller Name",
        "rating": 4.8
      }
    }
  ],
  "total": 150,
  "hasMore": true
}
```

---

### GET /api/products/:id
Get product details by ID.

**Response:**
```json
{
  "id": "uuid",
  "title": "Product Name",
  "description": "Detailed description...",
  "price": 29.99,
  "compare_at_price": 39.99,
  "stock_quantity": 45,
  "sku": "SKU-123",
  "rating": 4.5,
  "total_reviews": 23,
  "images": [...],
  "category": {
    "id": "uuid",
    "name": "Electronics",
    "slug": "electronics"
  },
  "seller": {
    "id": "uuid",
    "business_name": "Seller Name",
    "rating": 4.8,
    "total_reviews": 156
  }
}
```

---

### POST /api/products (Seller Only)
Create a new product.

**Request Body:**
```json
{
  "title": "New Product",
  "description": "Product description",
  "category_id": "uuid",
  "price": 29.99,
  "compare_at_price": 39.99,
  "stock_quantity": 100,
  "sku": "SKU-123",
  "images": ["base64_image_1", "base64_image_2"]
}
```

**Response:**
```json
{
  "id": "uuid",
  "title": "New Product",
  "status": "pending",
  "created_at": "2024-01-01T00:00:00Z"
}
```

---

### PATCH /api/products/:id (Seller Only)
Update product details.

**Request Body:**
```json
{
  "title": "Updated Title",
  "price": 34.99,
  "stock_quantity": 150
}
```

---

### DELETE /api/products/:id (Seller Only)
Delete a product.

**Response:**
```json
{
  "message": "Product deleted successfully"
}
```

---

## Cart APIs

### GET /api/cart
Get user's cart with items.

**Response:**
```json
{
  "id": "uuid",
  "items": [
    {
      "id": "uuid",
      "product_id": "uuid",
      "quantity": 2,
      "price_at_addition": 29.99,
      "product": {
        "title": "Product Name",
        "image": "https://...",
        "stock_quantity": 45
      }
    }
  ],
  "subtotal": 59.98
}
```

---

### POST /api/cart/items
Add item to cart.

**Request Body:**
```json
{
  "product_id": "uuid",
  "quantity": 2
}
```

---

### PATCH /api/cart/items/:id
Update item quantity.

**Request Body:**
```json
{
  "quantity": 3
}
```

---

### DELETE /api/cart/items/:id
Remove item from cart.

---

### DELETE /api/cart
Clear entire cart.

---

## Order APIs

### POST /api/orders
Create new order from cart.

**Request Body:**
```json
{
  "shipping_full_name": "John Doe",
  "shipping_phone": "+1234567890",
  "shipping_address": "123 Main St",
  "shipping_city": "New York",
  "shipping_state": "NY",
  "shipping_postal_code": "10001",
  "shipping_country": "USA",
  "payment_method": "card",
  "notes": "Please deliver before 5 PM"
}
```

**Response:**
```json
{
  "order": {
    "id": "uuid",
    "order_number": "ORD-1234567890",
    "total": 59.98,
    "status": "pending",
    "created_at": "2024-01-01T00:00:00Z"
  }
}
```

---

### GET /api/orders
List user's orders (Customer) or seller's orders (Seller).

**Query Parameters:**
- `status` (optional) - Filter by status
- `limit` (default: 20)
- `offset` (default: 0)

**Response:**
```json
{
  "orders": [
    {
      "id": "uuid",
      "order_number": "ORD-1234567890",
      "total": 59.98,
      "status": "delivered",
      "created_at": "2024-01-01T00:00:00Z",
      "items": [...]
    }
  ]
}
```

---

### GET /api/orders/:id
Get order details.

**Response:**
```json
{
  "id": "uuid",
  "order_number": "ORD-1234567890",
  "status": "processing",
  "subtotal": 59.98,
  "tax": 5.40,
  "shipping_cost": 9.99,
  "total": 75.37,
  "shipping_full_name": "John Doe",
  "shipping_address": "123 Main St, New York, NY 10001, USA",
  "items": [
    {
      "product_title": "Product Name",
      "quantity": 2,
      "price": 29.99,
      "subtotal": 59.98
    }
  ],
  "created_at": "2024-01-01T00:00:00Z"
}
```

---

### PATCH /api/orders/:id/status (Seller Only)
Update order status.

**Request Body:**
```json
{
  "status": "shipped"
}
```

---

## Seller APIs

### GET /api/seller/dashboard
Get seller dashboard statistics.

**Response:**
```json
{
  "totalProducts": 45,
  "activeOrders": 12,
  "totalEarnings": 5432.10,
  "pendingWithdrawals": 1,
  "recentOrders": [...],
  "topProducts": [...]
}
```

---

### GET /api/seller/earnings
Get earnings breakdown.

**Response:**
```json
{
  "totalSales": 10000.00,
  "totalCommission": 1000.00,
  "netEarnings": 9000.00,
  "availableBalance": 5000.00,
  "pendingBalance": 2000.00,
  "withdrawnBalance": 2000.00,
  "earnings": [
    {
      "order_id": "uuid",
      "amount": 100.00,
      "commission": 10.00,
      "net_amount": 90.00,
      "created_at": "2024-01-01T00:00:00Z"
    }
  ]
}
```

---

### POST /api/seller/withdrawals
Request a withdrawal.

**Request Body:**
```json
{
  "amount": 1000.00,
  "notes": "First withdrawal request"
}
```

---

### GET /api/seller/withdrawals
List withdrawal requests.

**Response:**
```json
{
  "withdrawals": [
    {
      "id": "uuid",
      "amount": 1000.00,
      "status": "pending",
      "created_at": "2024-01-01T00:00:00Z"
    }
  ]
}
```

---

## Admin APIs

### GET /api/admin/dashboard
Get platform statistics.

**Response:**
```json
{
  "totalUsers": 1250,
  "totalSellers": 85,
  "totalProducts": 3420,
  "totalOrders": 8934,
  "totalRevenue": 125000.00,
  "pendingSellers": 12,
  "pendingProducts": 45,
  "pendingWithdrawals": 8
}
```

---

### GET /api/admin/sellers
List all sellers with filtering.

**Query Parameters:**
- `status` (optional) - pending, approved, rejected, suspended

**Response:**
```json
{
  "sellers": [
    {
      "id": "uuid",
      "business_name": "Seller Name",
      "email": "seller@example.com",
      "status": "pending",
      "rating": 4.8,
      "total_reviews": 156,
      "created_at": "2024-01-01T00:00:00Z"
    }
  ]
}
```

---

### PATCH /api/admin/sellers/:id/status
Approve or reject seller.

**Request Body:**
```json
{
  "status": "approved"
}
```

---

### GET /api/admin/products
List all products for moderation.

**Query Parameters:**
- `status` (optional) - pending, approved, rejected

---

### PATCH /api/admin/products/:id/status
Approve or reject product.

**Request Body:**
```json
{
  "status": "approved"
}
```

---

### GET /api/admin/withdrawals
List all withdrawal requests.

---

### PATCH /api/admin/withdrawals/:id
Process withdrawal request.

**Request Body:**
```json
{
  "status": "completed",
  "admin_notes": "Payment processed via bank transfer"
}
```

---

## Review APIs

### POST /api/reviews
Create product review.

**Request Body:**
```json
{
  "product_id": "uuid",
  "order_id": "uuid",
  "rating": 5,
  "comment": "Great product!"
}
```

---

### GET /api/products/:id/reviews
Get product reviews.

**Response:**
```json
{
  "reviews": [
    {
      "id": "uuid",
      "rating": 5,
      "comment": "Great product!",
      "user": {
        "full_name": "John Doe"
      },
      "created_at": "2024-01-01T00:00:00Z"
    }
  ]
}
```

---

## Wishlist APIs

### POST /api/wishlist
Add product to wishlist.

**Request Body:**
```json
{
  "product_id": "uuid"
}
```

---

### GET /api/wishlist
Get user's wishlist.

---

### DELETE /api/wishlist/:product_id
Remove from wishlist.

---

## Category APIs

### GET /api/categories
List all categories (hierarchical).

**Response:**
```json
{
  "categories": [
    {
      "id": "uuid",
      "name": "Electronics",
      "slug": "electronics",
      "image_url": "https://...",
      "children": [
        {
          "id": "uuid",
          "name": "Laptops",
          "slug": "laptops"
        }
      ]
    }
  ]
}
```

---

## Error Responses

All APIs follow consistent error format:

```json
{
  "error": {
    "code": "PRODUCT_NOT_FOUND",
    "message": "The requested product does not exist",
    "details": {}
  }
}
```

**Common Error Codes:**
- `UNAUTHORIZED` - Not authenticated
- `FORBIDDEN` - Insufficient permissions
- `NOT_FOUND` - Resource not found
- `VALIDATION_ERROR` - Invalid input data
- `INSUFFICIENT_STOCK` - Product out of stock
- `PAYMENT_FAILED` - Payment processing error

---

## Rate Limiting (Future)

### Limits
- Authentication endpoints: 5 requests/minute
- Product listing: 60 requests/minute
- Order creation: 10 requests/minute
- Admin endpoints: 120 requests/minute

### Headers
```
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 45
X-RateLimit-Reset: 1640995200
```

---

## Pagination

All list endpoints support pagination:

**Request:**
```
GET /api/products?limit=20&offset=40
```

**Response Headers:**
```
X-Total-Count: 150
Link: <https://api.example.com/products?limit=20&offset=60>; rel="next"
```