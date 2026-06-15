import { SellerLayout } from "@/components/SellerLayout";
import { RoleGuard } from "@/components/RoleGuard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuthContext } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useRouter } from "next/router";
import { useState, useEffect, useMemo } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { CheckCircle2, Info, Layers3, Timer, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Image from "next/image";
import { uploadFile } from "@/lib/uploads";
import { getErrorMessage } from "@/lib/errors";
import {
  getProductAttributeTemplate,
  type ProductAttributeDefinition,
} from "@/lib/product-attributes";

interface Category {
  id: string;
  name: string;
  slug?: string;
  description?: string | null;
  parent_id?: string | null;
}

export default function AddProduct() {
  const { user } = useAuthContext();
  const router = useRouter();
  const { toast } = useToast();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [images, setImages] = useState<string[]>([]);
  const [categoryAttributes, setCategoryAttributes] = useState<Record<string, string | boolean>>({});
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category_id: "",
    price: "",
    compare_at_price: "",
    cost_per_item: "",
    stock_quantity: "",
    low_stock_threshold: "5",
    sku: "",
    barcode: "",
    brand: "",
    model: "",
    condition: "new",
    warranty_type: "seller_warranty",
    warranty_period: "",
    package_weight: "",
    package_length: "",
    package_width: "",
    package_height: "",
    package_contents: "",
    key_features: "",
    color_family: "",
    size_chart: "",
    dangerous_goods: false,
    is_deal: false,
    deal_expires_at: "",
  });

  useEffect(() => {
    async function fetchCategories() {
      const { data } = await supabase
        .from("categories")
        .select("id, name, slug, description, parent_id")
        .order("display_order", { ascending: true })
        .order("name", { ascending: true });

      setCategories(data || []);
    }

    fetchCategories();
  }, []);

  const categoryMap = new Map(categories.map((category) => [category.id, category]));
  const childrenByParent = categories.reduce((map, category) => {
    const key = category.parent_id || "root";
    const current = map.get(key) ?? [];
    current.push(category);
    map.set(key, current);
    return map;
  }, new Map<string, Category[]>());

  const getCategoryPath = (categoryId: string) => {
    const path: Category[] = [];
    const visited = new Set<string>();
    let current = categoryMap.get(categoryId);

    while (current && !visited.has(current.id)) {
      path.unshift(current);
      visited.add(current.id);
      current = current.parent_id ? categoryMap.get(current.parent_id) : undefined;
    }

    return path;
  };

  const selectedCategoryPath = formData.category_id ? getCategoryPath(formData.category_id) : [];
  const selectedCategory = selectedCategoryPath[selectedCategoryPath.length - 1] ?? null;
  const selectedCategorySlugs = selectedCategoryPath
    .map((category) => category.slug)
    .filter((slug): slug is string => Boolean(slug));
  const attributeTemplate = getProductAttributeTemplate(selectedCategorySlugs);
  const selectedCategoryHasChildren = Boolean(
    formData.category_id && (childrenByParent.get(formData.category_id)?.length ?? 0) > 0
  );
  const isFinalCategorySelected = Boolean(formData.category_id && !selectedCategoryHasChildren);
  const selectedCategoryPathLabel = selectedCategoryPath.map((category) => category.name).join(" / ");
  const leafCategories = categories.filter((category) => (childrenByParent.get(category.id)?.length ?? 0) === 0);
  const categoryLevels: Array<{ levelIndex: number; options: Category[]; selectedId: string }> = [];
  let categoryLevelParentId: string | null = null;

  for (let levelIndex = 0; levelIndex < 6; levelIndex += 1) {
    const options = childrenByParent.get(categoryLevelParentId || "root") ?? [];
    if (options.length === 0) break;

    const selectedId = selectedCategoryPath[levelIndex]?.id ?? "";
    categoryLevels.push({ levelIndex, options, selectedId });

    if (!selectedId) break;
    categoryLevelParentId = selectedId;
  }

  const readinessItems = useMemo(
    () => [
      { label: "Final category", ready: isFinalCategorySelected },
      { label: "Required attributes", ready: isFinalCategorySelected && attributeTemplate.attributes.every((attribute) => {
        if (!attribute.required) return true;
        const value = categoryAttributes[attribute.key];
        return value !== undefined && value !== false && String(value).trim() !== "";
      }) },
      { label: "Product images", ready: images.length > 0 },
      { label: "Price and stock", ready: Number(formData.price) > 0 && Number(formData.stock_quantity) > 0 },
    ],
    [attributeTemplate.attributes, categoryAttributes, formData.price, formData.stock_quantity, images.length, isFinalCategorySelected]
  );

  const selectCategory = (categoryId: string) => {
    setFormData((current) => ({ ...current, category_id: categoryId }));
    setCategoryAttributes({});
  };

  const updateCategoryAttribute = (key: string, value: string | boolean) => {
    setCategoryAttributes((current) => ({ ...current, [key]: value }));
  };

  const renderCategoryAttributeField = (attribute: ProductAttributeDefinition) => {
    const value = categoryAttributes[attribute.key];
    const label = `${attribute.label}${attribute.required ? " *" : ""}`;

    if (attribute.type === "select") {
      return (
        <div key={attribute.key}>
          <Label htmlFor={`attribute-${attribute.key}`}>{label}</Label>
          <Select
            value={typeof value === "string" ? value : ""}
            onValueChange={(nextValue) => updateCategoryAttribute(attribute.key, nextValue)}
          >
            <SelectTrigger id={`attribute-${attribute.key}`}>
              <SelectValue placeholder={attribute.placeholder || `Select ${attribute.label.toLowerCase()}`} />
            </SelectTrigger>
            <SelectContent>
              {(attribute.options ?? []).map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      );
    }

    if (attribute.type === "textarea") {
      return (
        <div key={attribute.key} className="md:col-span-2">
          <Label htmlFor={`attribute-${attribute.key}`}>{label}</Label>
          <Textarea
            id={`attribute-${attribute.key}`}
            value={typeof value === "string" ? value : ""}
            onChange={(event) => updateCategoryAttribute(attribute.key, event.target.value)}
            placeholder={attribute.placeholder}
            rows={3}
            required={attribute.required}
          />
        </div>
      );
    }

    if (attribute.type === "boolean") {
      return (
        <label key={attribute.key} className="flex items-start gap-3 rounded-md border p-4">
          <Checkbox
            checked={value === true}
            onCheckedChange={(checked) => updateCategoryAttribute(attribute.key, checked === true)}
          />
          <span>
            <span className="block font-medium">{label}</span>
            {attribute.placeholder && (
              <span className="text-sm text-muted-foreground">{attribute.placeholder}</span>
            )}
          </span>
        </label>
      );
    }

    return (
      <div key={attribute.key}>
        <Label htmlFor={`attribute-${attribute.key}`}>{label}</Label>
        <div className="flex">
          <Input
            id={`attribute-${attribute.key}`}
            type={attribute.type === "number" ? "number" : attribute.type === "date" ? "date" : "text"}
            value={typeof value === "string" ? value : ""}
            onChange={(event) => updateCategoryAttribute(attribute.key, event.target.value)}
            placeholder={attribute.placeholder}
            required={attribute.required}
            step={attribute.type === "number" ? "0.01" : undefined}
            className={attribute.unit ? "rounded-r-none" : undefined}
          />
          {attribute.unit && (
            <span className="flex items-center rounded-r-md border border-l-0 px-3 text-sm text-muted-foreground">
              {attribute.unit}
            </span>
          )}
        </div>
      </div>
    );
  };

  const handleImageUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    setUploadingImages(true);
    try {
      const uploadedUrls = await Promise.all(
        Array.from(files).map((file) => uploadFile(file, "product"))
      );
      setImages((prev) => [...prev, ...uploadedUrls]);
      toast({
        title: "Images uploaded",
        description: `${uploadedUrls.length} product image${uploadedUrls.length === 1 ? "" : "s"} saved.`,
      });
    } catch (error) {
      toast({
        title: "Upload failed",
        description: getErrorMessage(error, "Could not upload product images."),
        variant: "destructive",
      });
    } finally {
      setUploadingImages(false);
      e.target.value = "";
    }
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

  const handleSubmit = async (e: FormEvent) => {
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

      if (!formData.category_id || selectedCategoryHasChildren) {
        toast({
          title: "Select final category",
          description: "Please choose the deepest subcategory before submitting this product.",
          variant: "destructive",
        });
        return;
      }

      const price = Number(formData.price);
      const stock = Number(formData.stock_quantity);
      if (!Number.isFinite(price) || price <= 0 || !Number.isFinite(stock) || stock <= 0) {
        toast({
          title: "Price and stock required",
          description: "Enter a valid price and available stock quantity before submitting.",
          variant: "destructive",
        });
        return;
      }

      const missingAttributes = attributeTemplate.attributes.filter((attribute) => {
        if (!attribute.required) return false;
        const value = categoryAttributes[attribute.key];
        return value === undefined || value === false || String(value).trim() === "";
      });

      if (missingAttributes.length) {
        toast({
          title: "Required attributes missing",
          description: `Please complete: ${missingAttributes.map((attribute) => attribute.label).join(", ")}.`,
          variant: "destructive",
        });
        return;
      }

      if (images.length === 0) {
        toast({
          title: "Product images required",
          description: "Upload at least one real product image before submitting for approval.",
          variant: "destructive",
        });
        return;
      }

      const slug = generateSlug(formData.title);
      const categoryAttributeValues = attributeTemplate.attributes.map((attribute) => ({
        key: attribute.key,
        label: attribute.label,
        type: attribute.type,
        unit: attribute.unit ?? null,
        value: categoryAttributes[attribute.key] ?? "",
      }));
      const specifications = {
        category_path: selectedCategoryPathLabel || selectedCategory?.name || "",
        category_attribute_group: attributeTemplate.id,
        category_attribute_title: attributeTemplate.title,
        category_attributes: categoryAttributeValues,
        brand: formData.brand,
        model: formData.model,
        condition: formData.condition,
        warranty_type: formData.warranty_type,
        warranty_period: formData.warranty_period,
        package_weight: formData.package_weight,
        package_length: formData.package_length,
        package_width: formData.package_width,
        package_height: formData.package_height,
        package_contents: formData.package_contents,
        key_features: formData.key_features
          .split("\n")
          .map((feature) => feature.trim())
          .filter(Boolean),
        color_family: formData.color_family,
        size_chart: formData.size_chart,
        dangerous_goods: formData.dangerous_goods,
      };

      const { data: product, error: productError } = await supabase
        .from("products")
        .insert({
          seller_id: sellerProfile.id,
          title: formData.title,
          slug,
          description: formData.description,
          specifications,
          category_id: formData.category_id,
          price: parseFloat(formData.price),
          compare_at_price: formData.compare_at_price ? parseFloat(formData.compare_at_price) : null,
          cost_per_item: formData.cost_per_item ? parseFloat(formData.cost_per_item) : null,
          stock_quantity: parseInt(formData.stock_quantity, 10),
          low_stock_threshold: parseInt(formData.low_stock_threshold || "5", 10),
          sku: formData.sku,
          barcode: formData.barcode || null,
          is_deal: formData.is_deal,
          deal_expires_at: formData.is_deal && formData.deal_expires_at
            ? new Date(formData.deal_expires_at).toISOString()
            : null,
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
        description: getErrorMessage(error, "Failed to create product"),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <RoleGuard allowedRoles={["seller"]}>
      <SellerLayout>
      <div className="max-w-4xl">
        <div className="mb-8">
          <div className="mb-2 text-sm text-muted-foreground">
            Homepage / Manage Products / Add Product
          </div>
          <h1 className="text-3xl font-bold">Add Product</h1>
          <p className="mt-2 text-muted-foreground">
            Create a listing for admin approval before it appears on the storefront.
          </p>
        </div>

        <Card className="mb-6 p-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 className="flex items-center gap-2 text-lg font-semibold">
                <Layers3 className="h-5 w-5 text-accent" />
                Listing Readiness
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Complete each item before sending the product to admin moderation.
              </p>
            </div>
            <Badge variant={readinessItems.every((item) => item.ready) ? "default" : "secondary"}>
              {readinessItems.filter((item) => item.ready).length}/{readinessItems.length} ready
            </Badge>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-4">
            {readinessItems.map((item) => (
              <div key={item.label} className="flex items-center gap-2 rounded-md border bg-muted/30 p-3 text-sm">
                <CheckCircle2 className={`h-4 w-4 ${item.ready ? "text-green-600" : "text-muted-foreground"}`} />
                <span className={item.ready ? "font-medium" : "text-muted-foreground"}>{item.label}</span>
              </div>
            ))}
          </div>
        </Card>

        <form onSubmit={handleSubmit}>
          <Card className="p-6 mb-6">
            <h2 className="text-xl font-semibold mb-6">Basic Information</h2>

            <div className="space-y-4">
              <div>
                <Label htmlFor="title">Product Name *</Label>
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
                  <Label>Category *</Label>
                  <div className="mt-2 grid gap-3">
                    {categoryLevels.map((level) => (
                      <Select
                        key={level.levelIndex}
                        value={level.selectedId}
                        onValueChange={selectCategory}
                      >
                        <SelectTrigger id={`category-level-${level.levelIndex}`}>
                          <SelectValue
                            placeholder={
                              level.levelIndex === 0
                                ? "Main category"
                                : level.levelIndex === 1
                                  ? "Sub category"
                                  : level.levelIndex === 2
                                    ? "Sub-sub category"
                                    : `Level ${level.levelIndex + 1} category`
                            }
                          />
                        </SelectTrigger>
                        <SelectContent>
                          {level.options.map((cat) => {
                            const childCount = childrenByParent.get(cat.id)?.length ?? 0;
                            return (
                              <SelectItem key={cat.id} value={cat.id}>
                                {cat.name}{childCount > 0 ? ` (${childCount})` : ""}
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                    ))}
                    <Select
                      value={isFinalCategorySelected ? formData.category_id : ""}
                      onValueChange={selectCategory}
                    >
                      <SelectTrigger id="category-final-picker">
                        <SelectValue placeholder="Quick pick final category" />
                      </SelectTrigger>
                      <SelectContent>
                        {leafCategories.map((category) => (
                          <SelectItem key={category.id} value={category.id}>
                            {getCategoryPath(category.id).map((item) => item.name).join(" / ")}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">
                    {selectedCategoryPathLabel
                      ? `Selected: ${selectedCategoryPathLabel}${selectedCategoryHasChildren ? " - choose one more level to reach a final category." : ""}`
                      : "Choose the most accurate final category before submitting for admin approval."}
                  </p>
                  {isFinalCategorySelected && (
                    <Badge className="mt-3 bg-green-500/10 text-green-700">
                      Final category selected
                    </Badge>
                  )}
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

            <div className="mt-6 grid gap-4 md:grid-cols-3">
              <div>
                <Label htmlFor="brand">Brand</Label>
                <Input
                  id="brand"
                  value={formData.brand}
                  onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                  placeholder="e.g. HP, Samsung, Local Brand"
                />
              </div>
              <div>
                <Label htmlFor="model">Model</Label>
                <Input
                  id="model"
                  value={formData.model}
                  onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                  placeholder="Model number / variant"
                />
              </div>
              <div>
                <Label htmlFor="condition">Condition</Label>
                <Select
                  value={formData.condition}
                  onValueChange={(value) => setFormData({ ...formData, condition: value })}
                >
                  <SelectTrigger id="condition">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="new">New</SelectItem>
                    <SelectItem value="used_like_new">Used - Like New</SelectItem>
                    <SelectItem value="used_good">Used - Good</SelectItem>
                    <SelectItem value="refurbished">Refurbished</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="color_family">Color Family</Label>
                <Input
                  id="color_family"
                  value={formData.color_family}
                  onChange={(e) => setFormData({ ...formData, color_family: e.target.value })}
                  placeholder="Black, White, Blue..."
                />
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="key_features">Key Features</Label>
                <Textarea
                  id="key_features"
                  value={formData.key_features}
                  onChange={(e) => setFormData({ ...formData, key_features: e.target.value })}
                  rows={3}
                  placeholder="One feature per line"
                />
              </div>
              <div className="md:col-span-3">
                <Label htmlFor="size_chart">Size Chart / Variation Notes</Label>
                <Textarea
                  id="size_chart"
                  value={formData.size_chart}
                  onChange={(e) => setFormData({ ...formData, size_chart: e.target.value })}
                  rows={2}
                  placeholder="Sizes, colors, compatibility notes, or variant guidance"
                />
              </div>
            </div>

            <div className="mt-5 flex gap-2 rounded-md border bg-muted/40 p-4 text-sm text-muted-foreground">
              <Info className="h-4 w-4 shrink-0 text-accent" />
              Product name, category, images, price and stock must be clear before admin approval.
            </div>
          </Card>

          <Card className="p-6 mb-6">
            <h2 className="text-xl font-semibold">Category Requirements</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              {formData.category_id && !selectedCategoryHasChildren
                ? attributeTemplate.description
                : "Select the final subcategory to load required product attributes for approval."}
            </p>

            {formData.category_id && !selectedCategoryHasChildren ? (
              <div className="mt-6">
                <div className="mb-4 rounded-md border bg-muted/40 p-4">
                  <p className="text-sm font-medium">{attributeTemplate.title}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{selectedCategoryPathLabel}</p>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  {attributeTemplate.attributes.map((attribute) => renderCategoryAttributeField(attribute))}
                </div>
              </div>
            ) : (
              <div className="mt-6 rounded-md border border-dashed p-6 text-sm text-muted-foreground">
                Category-specific fields such as RAM, size, expiry, warranty, capacity or compatibility will appear here.
              </div>
            )}
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
                  min="0.01"
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
                  min="0"
                  value={formData.compare_at_price}
                  onChange={(e) => setFormData({ ...formData, compare_at_price: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="cost_per_item">Cost Per Item</Label>
                <Input
                  id="cost_per_item"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.cost_per_item}
                  onChange={(e) => setFormData({ ...formData, cost_per_item: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="stock_quantity">Stock Quantity *</Label>
                <Input
                  id="stock_quantity"
                  type="number"
                  min="1"
                  value={formData.stock_quantity}
                  onChange={(e) => setFormData({ ...formData, stock_quantity: e.target.value })}
                  required
                />
              </div>

              <div>
                <Label htmlFor="low_stock_threshold">Low Stock Alert</Label>
                <Input
                  id="low_stock_threshold"
                  type="number"
                  min="0"
                  value={formData.low_stock_threshold}
                  onChange={(e) => setFormData({ ...formData, low_stock_threshold: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="barcode">Barcode / GTIN</Label>
                <Input
                  id="barcode"
                  value={formData.barcode}
                  onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                />
              </div>
            </div>
          </Card>

          <Card className="p-6 mb-6">
            <h2 className="text-xl font-semibold mb-6">Warranty, Package & Compliance</h2>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="warranty_type">Warranty Type</Label>
                <Select
                  value={formData.warranty_type}
                  onValueChange={(value) => setFormData({ ...formData, warranty_type: value })}
                >
                  <SelectTrigger id="warranty_type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="seller_warranty">Seller Warranty</SelectItem>
                    <SelectItem value="brand_warranty">Brand Warranty</SelectItem>
                    <SelectItem value="international_warranty">International Warranty</SelectItem>
                    <SelectItem value="no_warranty">No Warranty</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="warranty_period">Warranty Period</Label>
                <Input
                  id="warranty_period"
                  value={formData.warranty_period}
                  onChange={(e) => setFormData({ ...formData, warranty_period: e.target.value })}
                  placeholder="7 days, 6 months, 1 year"
                />
              </div>
              <div>
                <Label htmlFor="package_weight">Package Weight</Label>
                <Input
                  id="package_weight"
                  value={formData.package_weight}
                  onChange={(e) => setFormData({ ...formData, package_weight: e.target.value })}
                  placeholder="kg"
                />
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <Label htmlFor="package_length">Length</Label>
                  <Input
                    id="package_length"
                    value={formData.package_length}
                    onChange={(e) => setFormData({ ...formData, package_length: e.target.value })}
                    placeholder="cm"
                  />
                </div>
                <div>
                  <Label htmlFor="package_width">Width</Label>
                  <Input
                    id="package_width"
                    value={formData.package_width}
                    onChange={(e) => setFormData({ ...formData, package_width: e.target.value })}
                    placeholder="cm"
                  />
                </div>
                <div>
                  <Label htmlFor="package_height">Height</Label>
                  <Input
                    id="package_height"
                    value={formData.package_height}
                    onChange={(e) => setFormData({ ...formData, package_height: e.target.value })}
                    placeholder="cm"
                  />
                </div>
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="package_contents">What's in the box</Label>
                <Textarea
                  id="package_contents"
                  value={formData.package_contents}
                  onChange={(e) => setFormData({ ...formData, package_contents: e.target.value })}
                  rows={3}
                  placeholder="Product, charger, manual, warranty card..."
                />
              </div>
              <label className="md:col-span-2 flex items-start gap-3 rounded-md border p-4">
                <Checkbox
                  checked={formData.dangerous_goods}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, dangerous_goods: checked === true })
                  }
                />
                <span>
                  <span className="block font-medium">Contains restricted or dangerous goods</span>
                  <span className="text-sm text-muted-foreground">
                    Batteries, liquids, chemicals or regulated products need admin review before approval.
                  </span>
                </span>
              </label>
            </div>
          </Card>

          <Card className="p-6 mb-6">
            <h2 className="mb-6 flex items-center gap-2 text-xl font-semibold">
              <Timer className="h-5 w-5 text-accent" />
              Sale Countdown
            </h2>

            <div className="space-y-4">
              <label className="flex items-start gap-3 rounded-md border p-4">
                <Checkbox
                  checked={formData.is_deal}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, is_deal: checked === true })
                  }
                />
                <span>
                  <span className="block font-medium">Request deal placement</span>
                  <span className="text-sm text-muted-foreground">
                    Admin approval is still required before the sale appears on customer pages.
                  </span>
                </span>
              </label>

              <div>
                <Label htmlFor="deal_expires_at">Sale End Date & Time</Label>
                <Input
                  id="deal_expires_at"
                  type="datetime-local"
                  value={formData.deal_expires_at}
                  onChange={(e) => setFormData({ ...formData, deal_expires_at: e.target.value })}
                  disabled={!formData.is_deal}
                />
              </div>
            </div>
          </Card>

          <Card className="p-6 mb-6">
            <h2 className="text-xl font-semibold mb-6">Product Images</h2>

            <div className="space-y-4">
              <div>
                <Label htmlFor="images">Upload Images</Label>
                <div className="mt-2">
                  <Input
                    id="images"
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageUpload}
                    disabled={uploadingImages}
                  />
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  Images are stored in public uploads and linked to the product after admin approval.
                </p>
              </div>

              {images.length > 0 && (
                <div className="grid grid-cols-4 gap-4">
                  {images.map((img, index) => (
                    <div key={index} className="relative aspect-square rounded-lg overflow-hidden bg-muted">
                      <Image
                        src={img}
                        alt={`Product ${index + 1}`}
                        fill
                        className="object-cover"
                        unoptimized
                      />
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
            <Button
              type="submit"
              disabled={loading || uploadingImages}
              className="bg-accent hover:bg-accent/90"
            >
              {loading ? "Creating..." : uploadingImages ? "Uploading..." : "Submit for Approval"}
            </Button>
            <Button type="button" variant="outline" onClick={() => router.back()}>
              Cancel
            </Button>
          </div>
        </form>
      </div>
      </SellerLayout>
    </RoleGuard>
  );
}
