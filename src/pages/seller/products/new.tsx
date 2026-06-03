import { SellerLayout } from "@/components/SellerLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useRouter } from "next/router";
import { useState, useEffect } from "react";
import { Upload, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Category {
  id: string;
  name: string;
}

export default function AddProduct() {
  const { user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [images, setImages] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category_id: "",
    price: "",
    compare_at_price: "",
    stock_quantity: "",
    sku: "",
  });

  useEffect(() => {
    async function fetchCategories() {
      const { data } = await supabase
        .from("categories")
        .select("id, name")
        .is("parent_id", null)
        .order("name");

      setCategories(data || []);
    }

    fetchCategories();
  }, []);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImages((prev) => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .substring(0, 100);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);

    try {
      const { data: sellerProfile } = await supabase
        .from("seller_profiles")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (!sellerProfile) {
        toast({
          title: "Error",
          description: "Seller profile not found",
          variant: "destructive",
        });
        return;
      }

      const slug = generateSlug(formData.title);

      const { data: product, error: productError } = await supabase
        .from("products")
        .insert({
          seller_id: sellerProfile.id,
          title: formData.title,
          slug,
          description: formData.description,
          category_id: formData.category_id,
          price: parseFloat(formData.price),
          compare_at_price: formData.compare_at_price ? parseFloat(formData.compare_at_price) : null,
          stock_quantity: parseInt(formData.stock_quantity),
          sku: formData.sku,
          status: "pending",
        })
        .select()
        .single();

      if (productError) throw productError;

      if (images.length > 0) {
        const imageInserts = images.map((url, index) => ({
          product_id: product.id,
          url,
          display_order: index,
        }));

        const { error: imagesError } = await supabase
          .from("product_images")
          .insert(imageInserts);

        if (imagesError) throw imagesError;
      }

      toast({
        title: "Success",
        description: "Product created and submitted for approval",
      });

      router.push("/seller/products");
    } catch (error) {
      console.error("Error creating product:", error);
      toast({
        title: "Error",
        description: "Failed to create product",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <SellerLayout>
      <div className="max-w-4xl">
        <h1 className="text-3xl font-bold mb-8">Add New Product</h1>

        <form onSubmit={handleSubmit}>
          <Card className="p-6 mb-6">
            <h2 className="text-xl font-semibold mb-6">Product Information</h2>

            <div className="space-y-4">
              <div>
                <Label htmlFor="title">Product Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>

              <div>
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={5}
                  required
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="category">Category *</Label>
                  <Select
                    value={formData.category_id}
                    onValueChange={(value) => setFormData({ ...formData, category_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="sku">SKU *</Label>
                  <Input
                    id="sku"
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    required
                  />
                </div>
              </div>
            </div>
          </Card>

          <Card className="p-6 mb-6">
            <h2 className="text-xl font-semibold mb-6">Pricing & Inventory</h2>

            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="price">Price *</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  required
                />
              </div>

              <div>
                <Label htmlFor="compare_at_price">Compare at Price</Label>
                <Input
                  id="compare_at_price"
                  type="number"
                  step="0.01"
                  value={formData.compare_at_price}
                  onChange={(e) => setFormData({ ...formData, compare_at_price: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="stock_quantity">Stock Quantity *</Label>
                <Input
                  id="stock_quantity"
                  type="number"
                  value={formData.stock_quantity}
                  onChange={(e) => setFormData({ ...formData, stock_quantity: e.target.value })}
                  required
                />
              </div>
            </div>
          </Card>

          <Card className="p-6 mb-6">
            <h2 className="text-xl font-semibold mb-6">Product Images</h2>

            <div className="space-y-4">
              <div>
                <Label htmlFor="images">Upload Images (Base64 for MVP)</Label>
                <div className="mt-2">
                  <Input
                    id="images"
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageUpload}
                  />
                </div>
              </div>

              {images.length > 0 && (
                <div className="grid grid-cols-4 gap-4">
                  {images.map((img, index) => (
                    <div key={index} className="relative aspect-square rounded-lg overflow-hidden bg-muted">
                      <img src={img} alt={`Product ${index + 1}`} className="object-cover w-full h-full" />
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        className="absolute top-2 right-2"
                        onClick={() => removeImage(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>

          <div className="flex gap-4">
            <Button type="submit" disabled={loading} className="bg-accent hover:bg-accent/90">
              {loading ? "Creating..." : "Create Product"}
            </Button>
            <Button type="button" variant="outline" onClick={() => router.back()}>
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </SellerLayout>
  );
}