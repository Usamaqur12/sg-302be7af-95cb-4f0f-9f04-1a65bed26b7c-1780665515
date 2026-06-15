import { randomUUID } from "node:crypto";
import type { NextApiRequest, NextApiResponse } from "next";
import type { ResultSetHeader, RowDataPacket } from "mysql2";
import { createOrderSchema, validateSchema } from "@/lib/validation";
import { emailService } from "@/lib/email";
import { getErrorMessage } from "@/lib/errors";
import { calculatePromotionSummary, type PromotionLike } from "@/lib/promotions";
import { canUseLocalDevAuthFallback, withTransaction } from "@/lib/server/db";
import { createLocalOrder, type LocalOrderInput } from "@/lib/server/local-db";
import { enforceRateLimit } from "@/lib/server/rate-limit";
import { readSession } from "@/lib/server/session";

interface ProductForOrder extends RowDataPacket {
  id: string;
  title: string;
  price: number;
  seller_id: string;
  stock_quantity: number;
  commission_rate: number | null;
  holiday_mode: number;
  business_name: string | null;
  image_url: string | null;
}

interface PromotionForOrder extends RowDataPacket, PromotionLike {}

interface OrderApiResponse {
  order?: {
    id: string;
    orderNumber: string;
    total: number;
    items?: Array<{ title: string; quantity: number; price: number }>;
  };
  error?: string;
  errors?: Array<{ field: string; message: string }>;
}

function uniqueStrings(values: string[]) {
  return [...new Set(values.filter(Boolean))];
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<OrderApiResponse>
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }
  if (enforceRateLimit(req, res, { key: "orders", limit: 20, windowMs: 10 * 60_000 })) {
    return;
  }

  const session = await readSession(req);
  if (!session) {
    return res.status(401).json({ error: "Authentication required" });
  }

  const validation = validateSchema(createOrderSchema, req.body);
  if (!validation.success || !validation.data) {
    return res.status(400).json({
      error: "Invalid order details",
      errors: validation.errors,
    });
  }

  const orderInput = validation.data as LocalOrderInput;
  const productIds = [...new Set(orderInput.items.map((item) => item.product_id))];

  try {
    if (canUseLocalDevAuthFallback()) {
      const order = await createLocalOrder(session.id, orderInput);
      void emailService
        .sendOrderConfirmation({
          to: orderInput.shipping_email,
          customerName: orderInput.shipping_full_name,
          orderNumber: order.orderNumber,
          orderTotal: order.total,
          orderItems: order.items || [],
          orderDate: new Date().toISOString(),
        })
        .catch((emailError) => {
          console.error("Order email failed:", emailError);
        });
      return res.status(201).json({ order });
    }

    const order = await withTransaction(async (connection) => {
      const placeholders = productIds.map(() => "?").join(", ");
      const [productsData] = await connection.execute<ProductForOrder[]>(
        `SELECT
           p.id,
           p.title,
           p.price,
           p.seller_id,
           p.stock_quantity,
           sp.commission_rate,
           sp.holiday_mode,
           sp.business_name,
           (
             SELECT pi.url
             FROM product_images pi
             WHERE pi.product_id = p.id
             ORDER BY pi.display_order ASC
             LIMIT 1
           ) AS image_url
         FROM products p
         INNER JOIN seller_profiles sp ON sp.id = p.seller_id
         WHERE p.status = 'approved'
           AND sp.status = 'approved'
           AND p.id IN (${placeholders})
         FOR UPDATE`,
        productIds
      );

      if (productsData.length !== productIds.length) {
        throw new Error("One or more products are unavailable");
      }

      const productMap = new Map(productsData.map((product) => [product.id, product]));
      let subtotal = 0;
      const orderItems = orderInput.items.map((item) => {
        const product = productMap.get(item.product_id);
        if (!product) throw new Error("Product unavailable");
        if (Number(product.holiday_mode) === 1) {
          throw new Error(`${product.business_name || "Seller"} is currently in holiday mode`);
        }
        if ((product.stock_quantity ?? 0) < item.quantity) {
          throw new Error(`${product.title} does not have enough stock`);
        }

        const itemSubtotal = Number(product.price) * item.quantity;
        const commissionRate = Number(product.commission_rate ?? 15);
        const commissionAmount = itemSubtotal * (commissionRate / 100);
        subtotal += itemSubtotal;

        return {
          id: randomUUID(),
          product_id: product.id,
          product_title: product.title,
          product_image: product.image_url,
          quantity: item.quantity,
          price: Number(product.price),
          subtotal: itemSubtotal,
          seller_id: product.seller_id,
          commission_rate: commissionRate,
          commission_amount: commissionAmount,
          seller_earnings: itemSubtotal - commissionAmount,
        };
      });

      const sellerIds = uniqueStrings(orderItems.map((item) => item.seller_id));
      const sellerPlaceholders = sellerIds.map(() => "?").join(", ");
      const productPlaceholders = productIds.map(() => "?").join(", ");
      const [promotionRows] = await connection.execute<PromotionForOrder[]>(
        `SELECT
           id, seller_id, product_id, request_type, title, discount_type,
           discount_value, min_order_amount, max_discount_amount, budget_amount,
           start_at, end_at, status
         FROM promotion_requests
         WHERE seller_id IN (${sellerPlaceholders})
           AND (product_id IS NULL OR product_id IN (${productPlaceholders}))
           AND status IN ('approved', 'active')
           AND (start_at IS NULL OR start_at <= NOW())
           AND (end_at IS NULL OR end_at >= NOW())`,
        [...sellerIds, ...productIds]
      );
      const promotionSummary = calculatePromotionSummary(
        orderItems.map((item) => ({
          product_id: item.product_id,
          seller_id: item.seller_id,
          price: item.price,
          quantity: item.quantity,
          title: item.product_title,
        })),
        promotionRows
      );
      const discountRatio = subtotal > 0 ? promotionSummary.productDiscount / subtotal : 0;
      for (const item of orderItems) {
        const itemDiscount = Number((item.subtotal * discountRatio).toFixed(2));
        const netSubtotal = Math.max(0, Number((item.subtotal - itemDiscount).toFixed(2)));
        item.commission_amount = Number((netSubtotal * (item.commission_rate / 100)).toFixed(2));
        item.seller_earnings = Number((netSubtotal - item.commission_amount).toFixed(2));
      }

      const shippingCost = promotionSummary.shipping;
      const tax = promotionSummary.tax;
      const total = promotionSummary.total;
      const orderId = randomUUID();
      const orderNumber = `ORD-${Date.now()}-${randomUUID().slice(0, 8).toUpperCase()}`;

      await connection.execute<ResultSetHeader>(
        `INSERT INTO orders
         (
           id, customer_id, order_number, status, subtotal, tax, shipping_cost, discount, total,
           shipping_full_name, shipping_phone, shipping_address, shipping_city,
           shipping_state, shipping_postal_code, shipping_country, notes
         )
         VALUES (?, ?, ?, 'pending', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          orderId,
          session.id,
          orderNumber,
          subtotal,
          tax,
          shippingCost,
          promotionSummary.totalDiscount,
          total,
          orderInput.shipping_full_name,
          orderInput.shipping_phone,
          orderInput.shipping_street,
          orderInput.shipping_city,
          orderInput.shipping_state,
          orderInput.shipping_zip_code,
          orderInput.shipping_country,
          orderInput.customer_notes || null,
        ]
      );

      for (const item of orderItems) {
        const [stockUpdate] = await connection.execute<ResultSetHeader>(
          `UPDATE products
           SET stock_quantity = stock_quantity - ?, sales_count = sales_count + ?
           WHERE id = ? AND stock_quantity >= ?`,
          [item.quantity, item.quantity, item.product_id, item.quantity]
        );

        if (stockUpdate.affectedRows !== 1) {
          throw new Error(`${item.product_title} does not have enough stock`);
        }

        await connection.execute(
          `INSERT INTO order_items
           (
             id, order_id, product_id, seller_id, product_title, product_image,
             quantity, price, subtotal, commission_rate, commission_amount, seller_earnings
           )
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            item.id,
            orderId,
            item.product_id,
            item.seller_id,
            item.product_title,
            item.product_image,
            item.quantity,
            item.price,
            item.subtotal,
            item.commission_rate,
            item.commission_amount,
            item.seller_earnings,
          ]
        );

        await connection.execute(
          `INSERT INTO seller_earnings
           (id, seller_id, order_item_id, amount, commission_amount, status)
           VALUES (?, ?, ?, ?, ?, 'pending')`,
          [randomUUID(), item.seller_id, item.id, item.seller_earnings, item.commission_amount]
        );
      }

      await connection.execute(
        `INSERT INTO payments
         (id, order_id, amount, payment_method, transaction_id, payment_proof_url, status)
         VALUES (?, ?, ?, ?, ?, ?, 'pending')`,
        [
          randomUUID(),
          orderId,
          total,
          orderInput.payment_method || "cash_on_delivery",
          orderInput.payment_reference || null,
          orderInput.payment_proof_url || null,
        ]
      );

      await connection.execute(
        `DELETE ci
         FROM cart_items ci
         INNER JOIN carts c ON c.id = ci.cart_id
         WHERE c.user_id = ?`,
        [session.id]
      );

      return {
        id: orderId,
        orderNumber,
        total,
        items: orderItems.map((item) => ({
          title: item.product_title,
          quantity: item.quantity,
          price: item.price,
        })),
      };
    });

    void emailService
      .sendOrderConfirmation({
        to: orderInput.shipping_email,
        customerName: orderInput.shipping_full_name,
        orderNumber: order.orderNumber,
        orderTotal: order.total,
        orderItems: order.items || [],
        orderDate: new Date().toISOString(),
      })
      .catch((emailError) => {
        console.error("Order email failed:", emailError);
      });

    return res.status(201).json({ order });
  } catch (error) {
    return res.status(400).json({
      error: getErrorMessage(error, "Could not place order"),
    });
  }
}
