import { CustomerLayout } from "@/components/CustomerLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useCart } from "@/contexts/CartContext";
import { Trash2, Plus, Minus, ShoppingBag } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/router";

export default function CartPage() {
  const { items, itemCount, total, updateQuantity, removeFromCart } = useCart();
  const router = useRouter();

  if (items.length === 0) {
    return (
      <CustomerLayout>
        <div className="container py-16">
          <div className="max-w-md mx-auto text-center">
            <ShoppingBag className="h-16 w-16 mx-auto mb-6 text-muted-foreground" />
            <h1 className="text-2xl font-bold mb-3">Your cart is empty</h1>
            <p className="text-muted-foreground mb-8">
              Start shopping to add items to your cart
            </p>
            <Button size="lg" onClick={() => router.push("/")}>
              Browse Products
            </Button>
          </div>
        </div>
      </CustomerLayout>
    );
  }

  return (
    <CustomerLayout>
      <div className="container py-8">
        <h1 className="text-3xl font-bold mb-8">Shopping Cart ({itemCount} items)</h1>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            {items.map((item) => (
              <Card key={item.id} className="p-6">
                <div className="flex gap-6">
                  <div className="relative w-24 h-24 flex-shrink-0 rounded-lg overflow-hidden bg-muted">
                    <Image
                      src={item.product.images[0]?.url || "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=200&h=200&fit=crop"}
                      alt={item.product.title}
                      fill
                      className="object-cover"
                    />
                  </div>

                  <div className="flex-1">
                    <Link href={`/products/${item.product_id}`}>
                      <h3 className="font-semibold mb-1 hover:text-accent transition-colors">
                        {item.product.title}
                      </h3>
                    </Link>
                    <p className="text-sm text-muted-foreground mb-3">
                      Sold by {item.product.seller?.business_name}
                    </p>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center border border-border rounded-md">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          disabled={item.quantity <= 1}
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                        <span className="px-4 font-mono">{item.quantity}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          disabled={item.quantity >= item.product.stock_quantity}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>

                      <div className="flex items-center gap-4">
                        <span className="text-xl font-bold font-mono">
                          ${(item.product.price * item.quantity).toFixed(2)}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFromCart(item.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    {item.quantity >= item.product.stock_quantity && (
                      <p className="text-sm text-warning mt-2">
                        Maximum stock reached ({item.product.stock_quantity} available)
                      </p>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>

          <div className="lg:col-span-1">
            <Card className="p-6 sticky top-20">
              <h3 className="font-semibold text-lg mb-4">Order Summary</h3>

              <div className="space-y-3 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal ({itemCount} items)</span>
                  <span className="font-mono">${total.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Shipping</span>
                  <span className="font-mono">
                    {total >= 50 ? "FREE" : "$5.00"}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Tax</span>
                  <span className="font-mono">${(total * 0.08).toFixed(2)}</span>
                </div>
              </div>

              <Separator className="my-4" />

              <div className="flex justify-between text-lg font-bold mb-6">
                <span>Total</span>
                <span className="font-mono">
                  ${(total + (total >= 50 ? 0 : 5) + total * 0.08).toFixed(2)}
                </span>
              </div>

              <Button
                size="lg"
                className="w-full bg-accent hover:bg-accent/90 mb-3"
                onClick={() => router.push("/checkout")}
              >
                Proceed to Checkout
              </Button>

              <Button
                variant="outline"
                size="lg"
                className="w-full"
                onClick={() => router.push("/")}
              >
                Continue Shopping
              </Button>

              {total < 50 && (
                <p className="text-sm text-muted-foreground text-center mt-4">
                  Add ${(50 - total).toFixed(2)} more for FREE shipping
                </p>
              )}
            </Card>
          </div>
        </div>
      </div>
    </CustomerLayout>
  );
}