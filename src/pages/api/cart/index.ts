import { randomUUID } from "node:crypto";
import type { NextApiRequest, NextApiResponse } from "next";
import type { ResultSetHeader, RowDataPacket } from "mysql2";
import { errorResponse, successResponse, unauthorizedResponse } from "@/lib/api-response";
import { canUseLocalDevAuthFallback, queryRows, withTransaction } from "@/lib/server/db";
import {
  addLocalCartItem,
  clearLocalCart,
  getLocalCartItems,
  removeLocalCartItem,
  updateLocalCartItem,
} from "@/lib/server/local-db";
import { readSession } from "@/lib/server/session";

interface CartRow extends RowDataPacket {
  id: string;
}

interface ProductRow extends RowDataPacket {
  id: string;
  seller_id: string;
  price: number;
  stock_quantity: number;
  holiday_mode: number;
  business_name: string | null;
}

interface CartItemRow extends RowDataPacket {
  id: string;
  product_id: string;
  quantity: number;
  product_title: string;
  product_price: number;
  stock_quantity: number;
  image_url: string | null;
  seller_id: string;
  business_name: string | null;
}

async function getCartItems(userId: string) {
  const rows = await queryRows<CartItemRow[]>(
    `SELECT
       ci.id,
       ci.product_id,
       ci.quantity,
       p.title AS product_title,
       p.price AS product_price,
       p.stock_quantity,
       p.seller_id,
       (
         SELECT pi.url
         FROM product_images pi
         WHERE pi.product_id = p.id
         ORDER BY pi.display_order ASC
         LIMIT 1
       ) AS image_url,
       sp.business_name
     FROM carts c
     INNER JOIN cart_items ci ON ci.cart_id = c.id
     INNER JOIN products p ON p.id = ci.product_id
     INNER JOIN seller_profiles sp ON sp.id = p.seller_id
     WHERE c.user_id = ?
     ORDER BY ci.created_at DESC`,
    [userId]
  );

  return rows.map((item) => ({
    id: item.id,
    product_id: item.product_id,
    quantity: item.quantity,
    product: {
      id: item.product_id,
      title: item.product_title,
      price: Number(item.product_price),
      stock_quantity: item.stock_quantity,
      images: item.image_url ? [{ url: item.image_url }] : [],
      seller: { id: item.seller_id, business_name: item.business_name || "Seller" },
    },
  }));
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const session = await readSession(req);
    if (!session) {
      return res.status(401).json(unauthorizedResponse());
    }

    if (req.method === "GET") {
      if (canUseLocalDevAuthFallback()) {
        const items = await getLocalCartItems(session.id);
        return res.status(200).json(successResponse("Cart retrieved successfully", { items }));
      }

      const items = await getCartItems(session.id);
      return res.status(200).json(successResponse("Cart retrieved successfully", { items }));
    }

    if (req.method === "POST") {
      const productId = typeof req.body.productId === "string"
        ? req.body.productId
        : req.body.product_id;
      const quantity = Number(req.body.quantity || 1);

      if (!productId || !Number.isInteger(quantity) || quantity < 1) {
        return res.status(400).json({ error: "Product ID and quantity required" });
      }

      if (canUseLocalDevAuthFallback()) {
        const items = await addLocalCartItem(session.id, productId, quantity);
        return res.status(200).json(successResponse("Cart updated successfully", { items }));
      }

      await withTransaction(async (connection) => {
        const [products] = await connection.execute<ProductRow[]>(
          `SELECT p.id, p.seller_id, p.price, p.stock_quantity, sp.holiday_mode, sp.business_name
           FROM products p
           INNER JOIN seller_profiles sp ON sp.id = p.seller_id
           WHERE p.id = ? AND p.status = 'approved' AND sp.status = 'approved'
           LIMIT 1`,
          [productId]
        );
        const product = products[0];
        if (!product) throw new Error("Product not found");
        if (Number(product.holiday_mode) === 1) {
          throw new Error(`${product.business_name || "Seller"} is currently in holiday mode`);
        }
        if (Number(product.stock_quantity) < quantity) {
          throw new Error("Product does not have enough stock");
        }

        const [carts] = await connection.execute<CartRow[]>(
          "SELECT id FROM carts WHERE user_id = ? LIMIT 1",
          [session.id]
        );
        const cartId = carts[0]?.id || randomUUID();
        if (!carts[0]) {
          await connection.execute("INSERT INTO carts (id, user_id) VALUES (?, ?)", [
            cartId,
            session.id,
          ]);
        }

        const [update] = await connection.execute<ResultSetHeader>(
          `UPDATE cart_items
           SET quantity = quantity + ?
           WHERE cart_id = ? AND product_id = ?`,
          [quantity, cartId, productId]
        );

        if (update.affectedRows === 0) {
          await connection.execute(
            `INSERT INTO cart_items
             (id, cart_id, product_id, quantity, price_at_addition)
             VALUES (?, ?, ?, ?, ?)`,
            [randomUUID(), cartId, productId, quantity, product.price]
          );
        }
      });

      const items = await getCartItems(session.id);
      return res.status(200).json(successResponse("Cart updated successfully", { items }));
    }

    if (req.method === "PATCH") {
      const itemId = typeof req.body.itemId === "string" ? req.body.itemId : req.body.id;
      const quantity = Number(req.body.quantity);
      if (!itemId || !Number.isInteger(quantity)) {
        return res.status(400).json({ error: "Cart item and quantity required" });
      }

      if (canUseLocalDevAuthFallback()) {
        const items = await updateLocalCartItem(session.id, itemId, quantity);
        return res.status(200).json(successResponse("Cart updated successfully", { items }));
      }

      if (quantity <= 0) {
        await queryRows<RowDataPacket[]>(
          `DELETE ci
           FROM cart_items ci
           INNER JOIN carts c ON c.id = ci.cart_id
           WHERE ci.id = ? AND c.user_id = ?`,
          [itemId, session.id]
        );
      } else {
        await queryRows<RowDataPacket[]>(
          `UPDATE cart_items ci
           INNER JOIN carts c ON c.id = ci.cart_id
           SET ci.quantity = ?
           WHERE ci.id = ? AND c.user_id = ?`,
          [quantity, itemId, session.id]
        );
      }

      const items = await getCartItems(session.id);
      return res.status(200).json(successResponse("Cart updated successfully", { items }));
    }

    if (req.method === "DELETE") {
      const itemId = typeof req.query.itemId === "string" ? req.query.itemId : "";
      const clear = req.query.clear === "true";

      if (clear) {
        if (canUseLocalDevAuthFallback()) {
          const items = await clearLocalCart(session.id);
          return res.status(200).json(successResponse("Cart updated successfully", { items }));
        }

        await queryRows<RowDataPacket[]>(
          `DELETE ci
           FROM cart_items ci
           INNER JOIN carts c ON c.id = ci.cart_id
           WHERE c.user_id = ?`,
          [session.id]
        );
      } else if (itemId) {
        if (canUseLocalDevAuthFallback()) {
          const items = await removeLocalCartItem(session.id, itemId);
          return res.status(200).json(successResponse("Cart updated successfully", { items }));
        }

        await queryRows<RowDataPacket[]>(
          `DELETE ci
           FROM cart_items ci
           INNER JOIN carts c ON c.id = ci.cart_id
           WHERE ci.id = ? AND c.user_id = ?`,
          [itemId, session.id]
        );
      } else {
        return res.status(400).json({ error: "Cart item is required" });
      }

      const items = await getCartItems(session.id);
      return res.status(200).json(successResponse("Cart updated successfully", { items }));
    }

    return res.status(405).json(errorResponse("Method not allowed"));
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return res.status(500).json(errorResponse(message));
  }
}
