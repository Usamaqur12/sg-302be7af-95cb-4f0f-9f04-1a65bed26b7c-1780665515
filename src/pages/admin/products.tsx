import { AdminLayout } from "@/components/AdminLayout";
import { RoleGuard } from "@/components/RoleGuard";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useAuthContext } from "@/contexts/AuthContext";
import { useMarketplaceSettings } from "@/contexts/MarketplaceSettingsContext";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/database.types";
import { useCallback, useEffect, useState } from "react";
import { AlertTriangle, ArchiveRestore, Ban, CheckCircle, Search, XCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Image from "next/image";

type ProductStatus = Database["public"]["Enums"]["product_status"];

interface Product {
  id: string;
  title: string;
  description: string | null;
  sku: string | null;
  price: number;
  stock_quantity: number | null;
  status: ProductStatus;
  is_featured: boolean | null;
  is_deal: boolean | null;
  deal_expires_at: string | null;
  rejection_reason: string | null;
  specifications: Record<string, unknown> | string | null;
  created_at: string | null;
  images: { url: string }[];
  seller: { business_name: string } | null;
  category: { name: string; slug: string } | null;
}

interface ProductAttribute {
  label?: unknown;
  value?: unknown;
  unit?: unknown;
}

function statusBadgeClass(status: ProductStatus) {
  if (status === "approved") return "bg-green-500/10 text-green-700";
  if (status === "pending") return "bg-amber-500/10 text-amber-700";
  if (status === "inactive") return "bg-slate-500/10 text-slate-700";
  if (status === "rejected") return "bg-destructive/10 text-destructive";
  return "bg-muted text-muted-foreground";
}

function parseSpecifications(value: Product["specifications"]) {
  if (!value) return {} as Record<string, unknown>;
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return parsed && typeof parsed === "object" ? parsed as Record<string, unknown> : {};
    } catch {
      return {};
    }
  }
  return value;
}

function displayValue(value: unknown) {
  if (value === true) return "Yes";
  if (value === false) return "No";
  if (Array.isArray(value)) return value.filter(Boolean).join(", ");
  return String(value ?? "").trim();
}

export default function AdminProducts() {
  const { user, loading: authLoading } = useAuthContext();
  const { formatPrice } = useMarketplaceSettings();
  const { toast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusNotes, setStatusNotes] = useState<Record<string, string>>({});

  const fetchProducts = useCallback(async () => {
    const { data } = await supabase
      .from("products")
      .select(`
        id,
        title,
        description,
        sku,
        price,
        stock_quantity,
        status,
        is_featured,
        is_deal,
        deal_expires_at,
        rejection_reason,
        specifications,
        created_at,
        images:product_images(url),
        seller:seller_profiles(business_name),
        category:categories(name, slug)
      `)
      .order("created_at", { ascending: false });

    const products = ((data ?? []) as unknown as Product[]).map((product) => ({
      ...product,
      images: product.images ?? [],
      status: product.status ?? "pending",
    }));

    setProducts(products);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (authLoading || !user) return;

    fetchProducts();
  }, [authLoading, fetchProducts, user]);

  const updateProductStatus = useCallback(async (productId: string, status: ProductStatus, note = "") => {
    const cleanNote = note.trim();
    const updates: Database["public"]["Tables"]["products"]["Update"] = {
      status,
      approved_at: status === "approved" ? new Date().toISOString() : null,
      rejection_reason:
        status === "approved" || status === "pending"
          ? null
          : cleanNote || (status === "inactive" ? "Delisted by admin" : "Rejected by admin"),
    };

    const { error } = await supabase
      .from("products")
      .update(updates)
      .eq("id", productId);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to update product status",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Success",
      description: `Product moved to ${status}`,
    });

    setStatusNotes((current) => ({ ...current, [productId]: "" }));
    fetchProducts();
  }, [fetchProducts, toast]);

  const toggleProductPlacement = useCallback(async (
    product: Product,
    key: "is_featured" | "is_deal"
  ) => {
    const enabled = !product[key];
    const update: Record<string, unknown> = { [key]: enabled };
    if (key === "is_deal") {
      update.deal_expires_at = enabled
        ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
        : null;
    }

    const { error } = await supabase
      .from("products")
      .update(update)
      .eq("id", product.id);

    if (error) {
      toast({
        title: "Update failed",
        description: "Could not update homepage placement.",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Product updated",
      description: `${product.title} homepage placement changed.`,
    });
    fetchProducts();
  }, [fetchProducts, toast]);

  const filteredProducts = products.filter((product) =>
    product.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (authLoading || (user && loading)) {
    return (
      <RoleGuard allowedRoles={["admin"]}>
        <AdminLayout>
          <div className="text-center py-16">
            <p className="text-muted-foreground">Loading products...</p>
          </div>
        </AdminLayout>
      </RoleGuard>
    );
  }

  return (
    <RoleGuard allowedRoles={["admin"]}>
      <AdminLayout>
      <div>
        <h1 className="text-3xl font-bold mb-8">Product Moderation</h1>

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

        <div className="space-y-4">
          {filteredProducts.map((product) => {
            const specs = parseSpecifications(product.specifications);
            const attributes = Array.isArray(specs.category_attributes)
              ? specs.category_attributes as ProductAttribute[]
              : [];
            const productNote = statusNotes[product.id] || "";
            const categoryPath = displayValue(specs.category_path) || product.category?.name || "Uncategorized";

            return (
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
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-lg">{product.title}</h3>
                        <Badge
                          className={statusBadgeClass(product.status)}
                        >
                          {product.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-1">
                        Seller: {product.seller?.business_name}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Price: {formatPrice(product.price)}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        SKU: {product.sku || "Not provided"} - Stock: {product.stock_quantity ?? 0}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Category: {categoryPath}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Listed:{" "}
                        {product.created_at
                          ? new Date(product.created_at).toLocaleDateString()
                          : "Unknown"}
                      </p>
                    </div>

                    <div className="min-w-64 space-y-2">
                      <Textarea
                        rows={2}
                        value={productNote}
                        onChange={(event) =>
                          setStatusNotes((current) => ({ ...current, [product.id]: event.target.value }))
                        }
                        placeholder="Admin note for rejection or delist"
                      />
                      <div className="flex flex-wrap gap-2">
                        <Button
                          size="sm"
                          onClick={() => updateProductStatus(product.id, "approved")}
                          className="bg-green-600 hover:bg-green-700"
                          disabled={product.status === "approved"}
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => updateProductStatus(product.id, "rejected", productNote)}
                          disabled={product.status === "rejected"}
                        >
                          <XCircle className="h-4 w-4 mr-2" />
                          Reject
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateProductStatus(product.id, "inactive", productNote)}
                          disabled={product.status === "inactive"}
                        >
                          <Ban className="h-4 w-4 mr-2" />
                          Delist
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateProductStatus(product.id, "pending")}
                          disabled={product.status === "pending"}
                        >
                          <ArchiveRestore className="h-4 w-4 mr-2" />
                          Pending
                        </Button>
                      </div>
                    </div>
                  </div>
                  {product.rejection_reason && (
                    <div className="mt-3 flex gap-2 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                      <span>{product.rejection_reason}</span>
                    </div>
                  )}
                  <div className="mt-4 grid gap-3 rounded-md border bg-muted/30 p-4 text-sm md:grid-cols-3">
                    <div>
                      <p className="text-xs font-semibold uppercase text-muted-foreground">Brand / Model</p>
                      <p>{displayValue(specs.brand) || "Not provided"} {displayValue(specs.model) && `/ ${displayValue(specs.model)}`}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase text-muted-foreground">Condition / Warranty</p>
                      <p>{displayValue(specs.condition) || "Not provided"} {displayValue(specs.warranty_period) && `/ ${displayValue(specs.warranty_period)}`}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase text-muted-foreground">Package</p>
                      <p>{displayValue(specs.package_weight) || "No weight"} - {displayValue(specs.package_contents) || "No contents"}</p>
                    </div>
                    {attributes.slice(0, 9).map((attribute) => {
                      const value = displayValue(attribute.value);
                      if (!value) return null;
                      return (
                        <div key={`${product.id}-${String(attribute.label)}`}>
                          <p className="text-xs font-semibold uppercase text-muted-foreground">{String(attribute.label || "Attribute")}</p>
                          <p>{value}{attribute.unit ? ` ${String(attribute.unit)}` : ""}</p>
                        </div>
                      );
                    })}
                    {product.description && (
                      <div className="md:col-span-3">
                        <p className="text-xs font-semibold uppercase text-muted-foreground">Description</p>
                        <p className="line-clamp-3 text-muted-foreground">{product.description}</p>
                      </div>
                    )}
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      variant={product.is_featured ? "default" : "outline"}
                      onClick={() => toggleProductPlacement(product, "is_featured")}
                    >
                      {product.is_featured ? "Featured" : "Set Featured"}
                    </Button>
                    <Button
                      size="sm"
                      variant={product.is_deal ? "default" : "outline"}
                      onClick={() => toggleProductPlacement(product, "is_deal")}
                    >
                      {product.is_deal ? "Deal Active" : "Set Deal"}
                    </Button>
                    {product.deal_expires_at && (
                      <span className="self-center text-xs text-muted-foreground">
                        Deal ends {new Date(product.deal_expires_at).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </Card>
            );
          })}

          {filteredProducts.length === 0 && (
            <Card className="p-12 text-center">
              <p className="text-muted-foreground">No products found</p>
            </Card>
          )}
        </div>
      </div>
      </AdminLayout>
    </RoleGuard>
  );
}
