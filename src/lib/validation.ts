/**
 * Input validation helpers using Zod
 */

import { z } from "zod";

// =====================================================
// COMMON SCHEMAS
// =====================================================

export const emailSchema = z.string().email("Invalid email address");
export const phoneSchema = z.string().regex(/^\+?[\d\s\-()]+$/, "Invalid phone number");
export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  .regex(/[a-z]/, "Password must contain at least one lowercase letter")
  .regex(/[0-9]/, "Password must contain at least one number");

export const uuidSchema = z.string().uuid("Invalid ID format");

// =====================================================
// AUTH SCHEMAS
// =====================================================

export const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: emailSchema,
  phone: phoneSchema.optional(),
  password: passwordSchema,
});

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Password is required"),
});

// =====================================================
// PRODUCT SCHEMAS
// =====================================================

export const createProductSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  category_id: uuidSchema,
  price: z.number().positive("Price must be positive"),
  sale_price: z.number().positive().optional(),
  stock_quantity: z.number().int().nonnegative("Stock must be non-negative"),
  sku: z.string().min(1, "SKU is required"),
  images: z.array(z.string().url()).min(1, "At least one image is required"),
});

export const updateProductSchema = createProductSchema.partial();

// =====================================================
// ORDER SCHEMAS
// =====================================================

export const createOrderSchema = z.object({
  items: z.array(
    z.object({
      product_id: uuidSchema,
      variant_id: uuidSchema.optional(),
      quantity: z.number().int().positive(),
    })
  ).min(1, "At least one item is required"),
  
  shipping_full_name: z.string().min(2),
  shipping_email: emailSchema,
  shipping_phone: phoneSchema,
  shipping_street: z.string().min(5),
  shipping_city: z.string().min(2),
  shipping_state: z.string().min(2),
  shipping_zip_code: z.string().min(5),
  shipping_country: z.string().min(2),
  
  payment_method: z.enum([
    "card",
    "paypal",
    "bank_transfer",
    "jazzcash",
    "easypaisa",
    "cash_on_delivery",
  ]),
  payment_reference: z.string().max(191).optional(),
  payment_proof_url: z.string().optional(),
  customer_notes: z.string().optional(),
});

// =====================================================
// VENDOR SCHEMAS
// =====================================================

export const createVendorSchema = z.object({
  business_name: z.string().min(2, "Business name must be at least 2 characters"),
  description: z.string().min(20, "Description must be at least 20 characters"),
  business_address: z.string().min(10, "Business address must be at least 10 characters"),
  business_email: emailSchema,
  business_phone: phoneSchema,
  bank_account_name: z.string().min(2, "Account holder name is required"),
  bank_account_number: z.string().min(5, "Bank account number is required"),
  bank_name: z.string().min(2, "Bank name is required"),
});

export const sellerRegistrationSchema = createVendorSchema.extend({
  full_name: z.string().min(2, "Full name must be at least 2 characters"),
  email: emailSchema,
  phone: phoneSchema,
  password: passwordSchema,
});

// =====================================================
// REVIEW SCHEMAS
// =====================================================

export const createReviewSchema = z.object({
  product_id: uuidSchema,
  order_id: uuidSchema.optional(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().min(10, "Comment must be at least 10 characters"),
});

// =====================================================
// CART SCHEMAS
// =====================================================

export const addToCartSchema = z.object({
  product_id: uuidSchema,
  variant_id: uuidSchema.optional(),
  quantity: z.number().int().positive("Quantity must be positive"),
});

// =====================================================
// SUPPORT TICKET SCHEMAS
// =====================================================

export const createTicketSchema = z.object({
  subject: z.string().min(5, "Subject must be at least 5 characters"),
  message: z.string().min(20, "Message must be at least 20 characters"),
  category: z.enum(["order", "product", "payment", "shipping", "account", "seller", "technical", "other"]),
  related_order_id: uuidSchema.optional(),
  related_product_id: uuidSchema.optional(),
});

// =====================================================
// HELPER TO VALIDATE AND EXTRACT
// =====================================================

export function validateSchema<T>(schema: z.ZodSchema<T>, data: unknown): {
  success: boolean;
  data?: T;
  errors?: Array<{ field: string; message: string }>;
} {
  try {
    const validated = schema.parse(data);
    return { success: true, data: validated };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors = error.errors.map((err) => ({
        field: err.path.join("."),
        message: err.message,
      }));
      return { success: false, errors };
    }
    return {
      success: false,
      errors: [{ field: "unknown", message: "Validation failed" }],
    };
  }
}
