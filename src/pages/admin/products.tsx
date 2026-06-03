import { AdminLayout } from "@/components/AdminLayout";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { Search, CheckCircle, XCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Image from "next/image";

interface Product {
  id: string;
  title: string;
  price: number;
  status: string;
  created_at: string;
  images: { url: string }[];
  seller: { business_name: string };
}

export default function AdminProducts() {
  const { user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (!user) {
      router.push("/");
      return;
    }

    fetchProducts();
  }, [user, router]);

  const fetchProducts = async () => {
    const { data } = await supabase
      .from("products")
      .select(`
        id,
        title,
        price,
        status,
        created_at,
        images:product_images(url),
        seller:seller_profiles(business_name)
      `)
      .order("created_at", { ascending: false });

    setProducts((data as any) || []);
    setLoading(false);
  };

  const updateProductStatus = async (productId: string, status: string) => {
    const { error } = await supabase
      .from("products")
      .update({ status: status as any })
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
      description: `Product ${status}`,
    });

    fetchProducts();
  };

  const filteredProducts = products.filter((product) =>
    product.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <AdminLayout>
        <div className="text-center py-16">
          <p className="text-muted-foreground">Loading products...</p>
        </div>
      </AdminLayout>
    );
  }

  return (
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
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-lg">{product.title}</h3>
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
                      <p className="text-sm text-muted-foreground mb-1">
                        Seller: {product.seller?.business_name}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Price: ${product.price.toFixed(2)}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Listed: {new Date(product.created_at).toLocaleDateString()}
                      </p>
                    </div>

                    {product.status === "pending" && (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => updateProductStatus(product.id, "approved")}
                          className="bg-green-500 hover:bg-green-600"
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => updateProductStatus(product.id, "rejected")}
                        >
                          <XCircle className="h-4 w-4 mr-2" />
                          Reject
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          ))}

          {filteredProducts.length === 0 && (
            <Card className="p-12 text-center">
              <p className="text-muted-foreground">No products found</p>
            </Card>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}