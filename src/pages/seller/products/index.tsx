import { SellerLayout } from "@/components/SellerLayout";
import { RoleGuard } from "@/components/RoleGuard";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useAuthContext } from "@/contexts/AuthContext";
import { useMarketplaceSettings } from "@/contexts/MarketplaceSettingsContext";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/database.types";
import { sellerCenterModules } from "@/lib/seller-center";
import { useCallback, useEffect, useState } from "react";
import { Plus, Search, Edit, Trash2 } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/router";

type ProductStatus = Database["public"]["Enums"]["product_status"];

interface Product {
  id: string;
  title: string;
  price: number;
  stock_quantity: number;
  status: ProductStatus;
  images: { url: string }[];
}

export default function SellerProducts() {
  const { user, loading: authLoading } = useAuthContext();
  const { formatPrice } = useMarketplaceSettings();
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<ProductStatus | "all">("all");

  const fetchProducts = useCallback(async () => {
    if (!user) return;

    const { data: sellerProfile } = await supabase
      .from("seller_profiles")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (!sellerProfile) {
      setProducts([]);
      setLoading(false);
      return;
    }

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

    const products = ((productsData ?? []) as unknown as Product[]).map((product) => ({
      ...product,
      images: product.images ?? [],
      status: product.status ?? "pending",
      stock_quantity: product.stock_quantity ?? 0,
    }));

    setProducts(products);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    if (authLoading || !user) return;

    fetchProducts();
  }, [authLoading, fetchProducts, user]);

  useEffect(() => {
    if (!router.isReady) return;

    const status = Array.isArray(router.query.status) ? router.query.status[0] : router.query.status;
    if (["draft", "pending", "approved", "rejected", "inactive"].includes(String(status))) {
      setStatusFilter(status as ProductStatus);
    } else {
      setStatusFilter("all");
    }
  }, [router.isReady, router.query.status]);

  const deleteProduct = async (productId: string) => {
    if (!confirm("Are you sure you want to delete this product?")) return;

    await supabase.from("products").delete().eq("id", productId);
    fetchProducts();
  };

  const setProductStatusFilter = (status: ProductStatus | "all") => {
    setStatusFilter(status);
    void router.replace(
      {
        pathname: "/seller/products",
        query: status === "all" ? {} : { status },
      },
      undefined,
      { shallow: true }
    );
  };

  const activeView = Array.isArray(router.query.view) ? router.query.view[0] : router.query.view;
  const productModule = sellerCenterModules.find((module) => module.href === "/seller/products");
  const activeTool = productModule?.options.find((option) => option.href.includes(`view=${activeView}`));

  const filteredProducts = products.filter((product) => {
    const matchesSearch = product.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || product.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (authLoading || (user && loading)) {
    return (
      <RoleGuard allowedRoles={["seller"]}>
        <SellerLayout>
          <div className="text-center py-16">
            <p className="text-muted-foreground">Loading products...</p>
          </div>
        </SellerLayout>
      </RoleGuard>
    );
  }

  return (
    <RoleGuard allowedRoles={["seller"]}>
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
          {activeTool && (
            <div className="mb-4 rounded-md border bg-muted/50 p-4">
              <p className="font-semibold">{activeTool.title}</p>
              <p className="mt-1 text-sm text-muted-foreground">{activeTool.description}</p>
            </div>
          )}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {(["all", "pending", "approved", "rejected", "draft", "inactive"] as Array<ProductStatus | "all">).map((status) => (
              <Button
                key={status}
                type="button"
                size="sm"
                variant={statusFilter === status ? "default" : "outline"}
                onClick={() => setProductStatusFilter(status)}
              >
                {status === "all" ? "All" : status}
              </Button>
            ))}
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
                        <p className="text-xl font-bold font-mono">{formatPrice(product.price)}</p>
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
    </RoleGuard>
  );
}
