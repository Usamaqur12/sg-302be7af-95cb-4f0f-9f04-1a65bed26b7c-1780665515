import { SellerLayout } from "@/components/SellerLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { Plus, Search, Edit, Trash2 } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

interface Product {
  id: string;
  title: string;
  price: number;
  stock_quantity: number;
  status: string;
  images: { url: string }[];
}

export default function SellerProducts() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/");
      return;
    }

    if (user) {
      fetchProducts();
    }
  }, [user, authLoading, router]);

  const fetchProducts = async () => {
    if (!user) return;

    const { data: sellerProfile } = await supabase
      .from("seller_profiles")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (!sellerProfile) return;

    const { data: productsData } = await supabase
      .from("products")
      .select(`
        id,
        title,
        price,
        stock_quantity,
        status,
        images:product_images(url)
      `)
      .eq("seller_id", sellerProfile.id)
      .order("created_at", { ascending: false });

    setProducts((productsData as any) || []);
    setLoading(false);
  };

  const deleteProduct = async (productId: string) => {
    if (!confirm("Are you sure you want to delete this product?")) return;

    await supabase.from("products").delete().eq("id", productId);
    fetchProducts();
  };

  const filteredProducts = products.filter((product) =>
    product.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (authLoading || loading) {
    return (
      <SellerLayout>
        <div className="text-center py-16">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </SellerLayout>
    );
  }

  return (
    <SellerLayout>
      <div>
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">Products</h1>
          <Button asChild className="bg-accent hover:bg-accent/90">
            <Link href="/seller/products/new">
              <Plus className="h-4 w-4 mr-2" />
              Add Product
            </Link>
          </Button>
        </div>

        <Card className="p-4 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </Card>

        {filteredProducts.length === 0 ? (
          <Card className="p-12 text-center">
            <p className="text-muted-foreground mb-4">No products found</p>
            <Button asChild>
              <Link href="/seller/products/new">Add Your First Product</Link>
            </Button>
          </Card>
        ) : (
          <div className="grid gap-4">
            {filteredProducts.map((product) => (
              <Card key={product.id} className="p-6">
                <div className="flex gap-6">
                  <div className="relative w-24 h-24 flex-shrink-0 rounded-lg overflow-hidden bg-muted">
                    <Image
                      src={product.images[0]?.url || "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=200&h=200&fit=crop"}
                      alt={product.title}
                      fill
                      className="object-cover"
                    />
                  </div>

                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="font-semibold text-lg mb-1">{product.title}</h3>
                        <p className="text-sm text-muted-foreground">
                          Stock: {product.stock_quantity} units
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-bold font-mono">${product.price.toFixed(2)}</p>
                        <Badge
                          className={
                            product.status === "approved"
                              ? "bg-green-500"
                              : product.status === "pending"
                              ? "bg-warning"
                              : "bg-muted"
                          }
                        >
                          {product.status}
                        </Badge>
                      </div>
                    </div>

                    <div className="flex gap-2 mt-4">
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/seller/products/edit/${product.id}`}>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </Link>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deleteProduct(product.id)}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </SellerLayout>
  );
}