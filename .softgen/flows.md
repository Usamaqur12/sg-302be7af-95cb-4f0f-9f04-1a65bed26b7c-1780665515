# User Flows & System Workflows

## 1. Customer Purchase Flow

### Complete Journey
```
┌──────────────────┐
│  Browse Homepage │
│  - Hero Banner   │
│  - Categories    │
│  - Featured      │
└────────┬─────────┘
         ↓
┌──────────────────┐
│  Product Search  │
│  - Filters       │
│  - Sort Options  │
│  - Categories    │
└────────┬─────────┘
         ↓
┌──────────────────┐
│ Product Details  │
│  - Images        │
│  - Price         │
│  - Reviews       │
│  - Seller Info   │
└────────┬─────────┘
         ↓
┌──────────────────┐
│   Add to Cart    │
│  - Quantity      │
│  - Validation    │
└────────┬─────────┘
         ↓
┌──────────────────┐
│   View Cart      │
│  - Update Qty    │
│  - Remove Items  │
│  - See Total     │
└────────┬─────────┘
         ↓
┌──────────────────┐
│    Checkout      │
│  - Login/Signup  │
│  - Shipping      │
│  - Payment       │
└────────┬─────────┘
         ↓
┌──────────────────┐
│ Order Created    │
│  - Order Number  │
│  - Confirmation  │
│  - Email Sent    │
└────────┬─────────┘
         ↓
┌──────────────────┐
│ Order Tracking   │
│  - Status        │
│  - Timeline      │
│  - Updates       │
└──────────────────┘
```

### Step-by-Step Details

#### Step 1: Discovery
- Customer lands on homepage
- Views featured products and categories
- Clicks on category or search

#### Step 2: Browse & Filter
- Views product listing page
- Applies filters (price, rating, category)
- Sorts results (price, rating, newest)
- Clicks on product for details

#### Step 3: Product Page
- Views product images (gallery)
- Reads description and specifications
- Checks seller rating and reviews
- Verifies stock availability
- Selects quantity
- Clicks "Add to Cart"

#### Step 4: Cart Management
- Views cart with all items
- Updates quantities
- Removes unwanted items
- Sees price breakdown
- Proceeds to checkout

#### Step 5: Checkout
- Logs in or signs up
- Enters shipping address
- Selects payment method
- Reviews order summary
- Confirms order

#### Step 6: Order Placement
- Order created with "pending" status
- Payment processed
- Order items split by seller
- Commission calculated
- Seller notified
- Customer receives confirmation

#### Step 7: Post-Purchase
- Tracks order status
- Receives status updates
- Leaves review after delivery
- Requests return if needed

---

## 2. Vendor Onboarding Flow

### Registration to First Sale
```
┌──────────────────┐
│ Vendor Signup    │
│  - Email         │
│  - Password      │
│  - Role: Seller  │
└────────┬─────────┘
         ↓
┌──────────────────┐
│ Profile Setup    │
│  - Business Name │
│  - Description   │
│  - Contact Info  │
└────────┬─────────┘
         ↓
┌──────────────────┐
│ KYC Submission   │
│  - Tax ID        │
│  - Bank Details  │
│  - Documents     │
└────────┬─────────┘
         ↓
┌──────────────────┐
│ Admin Review     │
│  - Verify Docs   │
│  - Check Info    │
│  - Decision      │
└────────┬─────────┘
         ↓
    ┌────┴────┐
    │         │
  Approved  Rejected
    │         │
    ↓         ↓
┌─────────┐ ┌─────────┐
│ Activate│ │ Notify  │
│ Account │ │ Vendor  │
└────┬────┘ └─────────┘
     ↓
┌──────────────────┐
│ Add Products     │
│  - Details       │
│  - Images        │
│  - Pricing       │
│  - Inventory     │
└────────┬─────────┘
         ↓
┌──────────────────┐
│ Product Review   │
│  - Admin Check   │
│  - Approval      │
└────────┬─────────┘
         ↓
┌──────────────────┐
│ Go Live          │
│  - Products      │
│  - Visible       │
│  - Searchable    │
└────────┬─────────┘
         ↓
┌──────────────────┐
│ First Order      │
│  - Process       │
│  - Ship          │
│  - Earn          │
└──────────────────┘
```

### Detailed Steps

#### Step 1: Registration
- Vendor visits signup page
- Selects "Seller" role
- Provides email and password
- Account created with "pending" status

#### Step 2: Business Information
- Completes business profile
- Provides business name, description
- Adds contact details
- Sets up basic store info

#### Step 3: KYC & Verification
- Uploads required documents:
  * Tax ID / Business License
  * Bank account details
  * Identity proof
  * Address proof
- Submits for admin review

#### Step 4: Admin Verification
- Admin reviews documents
- Checks business legitimacy
- Verifies bank details
- Approves or rejects with reason

#### Step 5: Product Addition
- Vendor adds first products
- Fills product details
- Uploads images
- Sets pricing and inventory
- Product status: "pending"

#### Step 6: Product Moderation
- Admin reviews product listings
- Checks for policy violations
- Approves legitimate products
- Product becomes "approved" and visible

#### Step 7: Active Selling
- Products appear in marketplace
- Receives orders from customers
- Processes and ships orders
- Earns commission-deducted revenue

---

## 3. Admin Approval Workflow

### Seller Approval Process
```
┌──────────────────┐
│ New Seller       │
│ Registration     │
└────────┬─────────┘
         ↓
┌──────────────────┐
│ Notification     │
│ to Admin         │
└────────┬─────────┘
         ↓
┌──────────────────┐
│ Admin Dashboard  │
│ - Pending List   │
└────────┬─────────┘
         ↓
┌──────────────────┐
│ Document Review  │
│  - Tax ID        │
│  - Bank Info     │
│  - Business Proof│
└────────┬─────────┘
         ↓
    ┌────┴────┐
    │         │
  Valid    Invalid
    │         │
    ↓         ↓
┌─────────┐ ┌─────────┐
│ Approve │ │ Reject  │
│ Seller  │ │ + Notes │
└────┬────┘ └────┬────┘
     ↓           ↓
┌─────────┐ ┌─────────┐
│ Notify  │ │ Notify  │
│ Success │ │ Reason  │
└─────────┘ └─────────┘
```

### Product Approval Process
```
┌──────────────────┐
│ Seller Adds      │
│ Product          │
└────────┬─────────┘
         ↓
┌──────────────────┐
│ Status: Pending  │
└────────┬─────────┘
         ↓
┌──────────────────┐
│ Admin Queue      │
│ - New Products   │
└────────┬─────────┘
         ↓
┌──────────────────┐
│ Quality Check    │
│  - Images OK?    │
│  - Details OK?   │
│  - Policy OK?    │
└────────┬─────────┘
         ↓
    ┌────┴────┐
    │         │
  Pass     Fail
    │         │
    ↓         ↓
┌─────────┐ ┌─────────┐
│ Approve │ │ Reject  │
│         │ │ + Reason│
└────┬────┘ └────┬────┘
     ↓           ↓
┌─────────┐ ┌─────────┐
│ Go Live │ │ Notify  │
│         │ │ Seller  │
└─────────┘ └─────────┘
```

---

## 4. Payment & Commission Flow

### Order Payment Split
```
Customer Payment
      ↓
┌─────────────────────────┐
│ Platform Receives       │
│ Full Payment: $100      │
└───────────┬─────────────┘
            ↓
      ┌─────┴─────┐
      │ Split by  │
      │ Sellers   │
      └─────┬─────┘
            ↓
    ┌───────┴───────┐
    │               │
Seller A        Seller B
 $40             $60
    │               │
    ↓               ↓
┌───────┐       ┌───────┐
│ 10%   │       │ 10%   │
│ Comm. │       │ Comm. │
│ $4    │       │ $6    │
└───┬───┘       └───┬───┘
    ↓               ↓
┌───────┐       ┌───────┐
│ Net:  │       │ Net:  │
│ $36   │       │ $54   │
└───────┘       └───────┘
```

### Commission Calculation
```sql
-- Per order item:
item_subtotal = price × quantity
commission_amount = item_subtotal × (commission_rate / 100)
seller_earnings = item_subtotal - commission_amount

-- Example:
-- Product: $50, Quantity: 2, Commission: 10%
item_subtotal = $100
commission_amount = $100 × 0.10 = $10
seller_earnings = $100 - $10 = $90
```

### Withdrawal Request Flow
```
┌──────────────────┐
│ Seller Checks    │
│ Available Balance│
└────────┬─────────┘
         ↓
┌──────────────────┐
│ Request          │
│ Withdrawal       │
│ - Amount         │
│ - Bank Details   │
└────────┬─────────┘
         ↓
┌──────────────────┐
│ Status: Pending  │
└────────┬─────────┘
         ↓
┌──────────────────┐
│ Admin Reviews    │
│  - Verify Amount │
│  - Check Balance │
└────────┬─────────┘
         ↓
    ┌────┴────┐
    │         │
  Approve  Reject
    │         │
    ↓         ↓
┌─────────┐ ┌─────────┐
│ Process │ │ Return  │
│ Payment │ │ Balance │
└────┬────┘ └─────────┘
     ↓
┌──────────────────┐
│ Mark Complete    │
│ - Timestamp      │
│ - Notification   │
└──────────────────┘
```

---

## 5. Order Status Workflow

### Order Lifecycle
```
┌──────────┐
│ Pending  │ ← Order created, payment processing
└────┬─────┘
     ↓
┌──────────┐
│Processing│ ← Payment confirmed, seller notified
└────┬─────┘
     ↓
┌──────────┐
│ Shipped  │ ← Seller marked as shipped, tracking added
└────┬─────┘
     ↓
┌──────────┐
│Delivered │ ← Courier confirmed delivery
└────┬─────┘
     ↓
┌──────────┐
│Completed │ ← Customer can review, order closed
└──────────┘

Special Cases:
┌──────────┐
│Cancelled │ ← Customer/Seller cancels before shipping
└──────────┘

┌──────────┐
│ Refunded │ ← Return processed, money returned
└──────────┘

┌──────────┐
│  Failed  │ ← Payment failed
└──────────┘
```

### Status Transitions
```
pending → processing → shipped → delivered → completed
pending → cancelled (before shipping)
delivered → refunded (after return approval)
pending → failed (payment error)
```

---

## 6. Product Search & Filter Flow

### Search Journey
```
Customer Input
     ↓
┌─────────────────┐
│ Search Query    │
│ "laptop"        │
└────────┬────────┘
         ↓
┌─────────────────┐
│ Database Query  │
│ - Match Title   │
│ - Match Desc    │
│ - Status=       │
│   approved      │
└────────┬────────┘
         ↓
┌─────────────────┐
│ Apply Filters   │
│ - Price Range   │
│ - Category      │
│ - Rating        │
│ - Seller        │
└────────┬────────┘
         ↓
┌─────────────────┐
│ Apply Sorting   │
│ - Price Asc/Desc│
│ - Rating        │
│ - Newest        │
│ - Popular       │
└────────┬────────┘
         ↓
┌─────────────────┐
│ Paginate        │
│ - Limit: 20     │
│ - Offset: 0     │
└────────┬────────┘
         ↓
┌─────────────────┐
│ Return Results  │
│ with Images     │
└─────────────────┘
```

---

## 7. Review & Rating Flow

### Customer Review Journey
```
┌──────────────────┐
│ Order Delivered  │
└────────┬─────────┘
         ↓
┌──────────────────┐
│ Review Prompt    │
│ (in dashboard)   │
└────────┬─────────┘
         ↓
┌──────────────────┐
│ Customer Writes  │
│  - Rating (1-5)  │
│  - Comment       │
└────────┬─────────┘
         ↓
┌──────────────────┐
│ Submit Review    │
└────────┬─────────┘
         ↓
┌──────────────────┐
│ Update Product   │
│  - Avg Rating    │
│  - Review Count  │
└────────┬─────────┘
         ↓
┌──────────────────┐
│ Update Seller    │
│  - Avg Rating    │
│  - Review Count  │
└────────┬─────────┘
         ↓
┌──────────────────┐
│ Display on       │
│ Product Page     │
└──────────────────┘
```

---

## 8. Inventory Management Flow

### Stock Update Process
```
┌──────────────────┐
│ Product Created  │
│ stock_qty: 100   │
└────────┬─────────┘
         ↓
┌──────────────────┐
│ Customer Orders  │
│ quantity: 3      │
└────────┬─────────┘
         ↓
┌──────────────────┐
│ Stock Check      │
│ Available?       │
└────────┬─────────┘
         ↓
    ┌────┴────┐
    │         │
   Yes       No
    │         │
    ↓         ↓
┌─────────┐ ┌─────────┐
│ Deduct  │ │ Error   │
│ Stock   │ │ "Out of │
│ to 97   │ │ Stock"  │
└────┬────┘ └─────────┘
     ↓
┌──────────────────┐
│ Create Order     │
└────────┬─────────┘
         ↓
┌──────────────────┐
│ If Cancelled     │
│ Restore Stock    │
│ back to 100      │
└──────────────────┘
```

### Low Stock Alert (Future)
```
stock_quantity < threshold
         ↓
┌──────────────────┐
│ Generate Alert   │
└────────┬─────────┘
         ↓
┌──────────────────┐
│ Notify Seller    │
│ "Low Stock"      │
└──────────────────┘
```

---

## 9. Return & Refund Flow

### Customer Initiates Return
```
┌──────────────────┐
│ Order Delivered  │
└────────┬─────────┘
         ↓
┌──────────────────┐
│ Customer Creates │
│ Support Ticket   │
│ Type: Return     │
└────────┬─────────┘
         ↓
┌──────────────────┐
│ Admin Reviews    │
│  - Order Valid?  │
│  - Return Window?│
└────────┬─────────┘
         ↓
    ┌────┴────┐
    │         │
  Approve  Reject
    │         │
    ↓         ↓
┌─────────┐ ┌─────────┐
│ Issue   │ │ Notify  │
│ Return  │ │ Reason  │
│ Label   │ └─────────┘
└────┬────┘
     ↓
┌──────────────────┐
│ Customer Ships   │
│ Back to Seller   │
└────────┬─────────┘
         ↓
┌──────────────────┐
│ Seller Confirms  │
│ Receipt          │
└────────┬─────────┘
         ↓
┌──────────────────┐
│ Refund Processed │
│  - Payment       │
│  - Commission    │
└────────┬─────────┘
         ↓
┌──────────────────┐
│ Order Status:    │
│ Refunded         │
└──────────────────┘
```

---

## 10. Notification Flow (Future Implementation)

### Event-Driven Notifications
```
Order Placed
     ↓
┌─────────────────────────────────────┐
│ Trigger Notifications               │
├─────────────────────────────────────┤
│ Customer: Order Confirmation Email  │
│ Seller: New Order Email             │
│ Admin: Platform Activity Log        │
└─────────────────────────────────────┘

Order Shipped
     ↓
┌─────────────────────────────────────┐
│ Customer: Shipping Notification     │
│ + Tracking Number                   │
└─────────────────────────────────────┘

Seller Approved
     ↓
┌─────────────────────────────────────┐
│ Seller: Welcome Email               │
│ + Dashboard Access Instructions     │
└─────────────────────────────────────┘
```