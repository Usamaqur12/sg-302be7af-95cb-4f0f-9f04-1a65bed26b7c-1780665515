"use client";

import { CustomerLayout } from "@/components/CustomerLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProductCard } from "@/components/ProductCard";
import { ReviewForm } from "@/components/ReviewForm";
import { ReviewList } from "@/components/ReviewList";
import { useCart } from "@/contexts/CartContext";
import { useWishlist } from "@/hooks/useWishlist";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import Image from "next/image";
import { 
  Star, Heart, ShoppingCart, TruckIcon, Package, 
  ShieldCheck, RefreshCcw, Share2, Minus, Plus, Store, ChevronLeft, Loader2
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export default function ProductDetailPage() {
  const router = useRouter();
  const { id } = router.query;
  const { addToCart } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const { toast } = useToast();

  const [product, setProduct] = useState<any>(null);
  const [relatedProducts, setRelatedProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);

  useEffect(() => {
    if (!id) return;
    fetchProduct();
  }, [id]);

  const fetchProduct = async () => {
    if (!id) return;
    
    setLoading(true);
    setNotFound(false);

    try {
      // Fetch product by ID
      const { data: productData, error: productError } = await supabase
        .from("products")
        .select(`
          *,
          images:product_images(id, url, display_order),
          category:categories(id, name, slug),
          seller:seller_profiles!seller_id(id, business_name, logo_url)
        `)
        .eq("id", id as string)
        .eq("status", "approved")
        .single();

      if (productError || !productData) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      // Sort images by display_order
      if (productData.images) {
        productData.images.sort((a: any, b: any) => (a.display_order || 0) - (b.display_order || 0));
      }

      setProduct(productData);

      // Fetch related products from same category
      if (productData.category_id) {
        const { data: relatedData } = await supabase
          .from("products")
          .select(`
            id,
            title,
            price,
            compare_at_price,
            rating,
            total_reviews,
            images:product_images(url),
            seller:seller_profiles!seller_id(id, business_name)
          `)
          .eq("category_id", productData.category_id)
          .eq("status", "approved")
          .neq("id", id as string)
          .limit(4);

        setRelatedProducts(relatedData || []);
      }
    } catch (error) {
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = async () => {
    if (!product) return;

    await addToCart(product.id, quantity);

    toast({
      title: "Added to Cart",
      description: `${quantity}x ${product.title} added to your cart.`,
    });
  };

  const handleToggleWishlist = () => {
    if (!product) return;
    toggleWishlist(product.id);
  };

  const incrementQuantity = () => {
    if (quantity < (product?.stock_quantity || 99)) {
      setQuantity(quantity + 1);
    }
  };

  const decrementQuantity = () => {
    if (quantity > 1) {
      setQuantity(quantity - 1);
    }
  };

  if (loading) {
    return (
      <CustomerLayout>
        <div className="container py-16 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-muted-foreground">Loading product details...</p>
          </div>
        </div>
      </CustomerLayout>
    );
  }

  if (notFound || !product) {
    return (
      <CustomerLayout>
        <div className="container py-16 text-center">
          <Package className="h-16 w-16 mx-auto text-muted-foreground mb-4"/>
          <h2 className="text-2xl font-bold mb-2">Product Not Found</h2>
          <p className="text-muted-foreground mb-8">The product you're looking for doesn't exist or is no longer available.</p>
          <div className="flex gap-4 justify-center">
            <Button onClick={() => router.back()} variant="outline">
              Go Back
            </Button>
            <Button asChild>
              <Link href="/products">Browse Products</Link>
            </Button>
          </div>
        </div>
      </CustomerLayout>
    );
  }

  const discount = product.compare_at_price && product.compare_at_price > product.price
    ? Math.round(((product.compare_at_price - product.price) / product.compare_at_price) * 100)
    : 0;

  const images = product.images || [];
  const selectedImageUrl = images[selectedImage]?.url || "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800";

  return (
    <CustomerLayout>
      <div className="container py-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
          <Link href="/" className="hover:text-foreground">Home</Link>
          <span>/</span>
          <Link href="/categories" className="hover:text-foreground">Categories</Link>
          {product.category && (
            <>
              <span>/</span>
              <Link href={`/categories/${product.category.slug}`} className="hover:text-foreground">
                {product.category.name}
              </Link>
            </>
          )}
          <span>/</span>
          <span className="text-foreground truncate">{product.title}</span>
        </div>

        <Button variant="ghost" size="sm" className="mb-4" onClick={() => router.back()}>
          <ChevronLeft className="h-4 w-4 mr-1" />
          Back
        </Button>

        {/* Product Main Section */}
        <div className="grid lg:grid-cols-2 gap-12 mb-16">
          {/* Image Gallery */}
          <div className="space-y-4">
            <div className="relative aspect-square rounded-xl overflow-hidden bg-muted border">
              <Image
                src={selectedImageUrl}
                alt={product.title}
                fill
                className="object-cover"
                priority
              />
              {discount > 0 && (
                <Badge className="absolute top-4 left-4 bg-destructive text-destructive-foreground">
                  -{discount}% OFF
                </Badge>
              )}
            </div>

            {/* Thumbnail Gallery */}
            {images.length > 1 && (
              <div className="grid grid-cols-4 gap-2">
                {images.map((img: any, idx: number) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImage(idx)}
                    className={`relative aspect-square rounded-lg overflow-hidden border-2 transition ${
                      selectedImage === idx ? "border-primary" : "border-transparent hover:border-muted-foreground/50"
                    }`}
                  >
                    <Image src={img.url} alt={`View ${idx + 1}`} fill className="object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            <div>
              {product.seller && (
                <div className="flex items-center gap-2 mb-2">
                  <Link href={`/sellers/${product.seller.id}`} className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1">
                    <Store className="h-3.5 w-3.5" />
                    {product.seller.business_name}
                  </Link>
                </div>
              )}

              <h1 className="text-3xl font-bold font-serif mb-3">{product.title}</h1>

              <div className="flex items-center gap-3 mb-4">
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`h-4 w-4 ${
                        i < Math.floor(product.rating || 0)
                          ? "fill-amber-400 text-amber-400"
                          : "text-muted-foreground"
                      }`}
                    />
                  ))}
                </div>
                <span className="text-sm font-medium">{product.rating?.toFixed(1) || "4.5"}</span>
                <span className="text-sm text-muted-foreground">({product.total_reviews || 0} reviews)</span>
              </div>
            </div>

            <Separator />

            {/* Pricing */}
            <div className="space-y-2">
              <div className="flex items-baseline gap-3">
                <span className="text-4xl font-bold font-mono text-destructive">
                  ${product.price.toFixed(2)}
                </span>
                {product.compare_at_price && product.compare_at_price > product.price && (
                  <>
                    <span className="text-xl text-muted-foreground line-through font-mono">
                      ${product.compare_at_price.toFixed(2)}
                    </span>
                    <Badge variant="destructive">Save {discount}%</Badge>
                  </>
                )}
              </div>
              {product.stock_quantity > 0 && product.stock_quantity < 10 && (
                <p className="text-sm text-amber-600 font-medium">
                  Only {product.stock_quantity} left in stock - order soon!
                </p>
              )}
            </div>

            <Separator />

            {/* Description Preview */}
            {product.description && (
              <div>
                <p className="text-muted-foreground line-clamp-3">{product.description}</p>
              </div>
            )}

            <Separator />

            {/* Quantity & Actions */}
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <span className="text-sm font-medium">Quantity:</span>
                <div className="flex items-center border rounded-lg">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={decrementQuantity}
                    disabled={quantity <= 1}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <span className="px-6 py-2 font-mono font-medium">{quantity}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={incrementQuantity}
                    disabled={quantity >= (product.stock_quantity || 99)}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                {product.stock_quantity > 0 && (
                  <span className="text-sm text-muted-foreground">
                    {product.stock_quantity} available
                  </span>
                )}
              </div>

              <div className="flex gap-3">
                <Button
                  size="lg"
                  className="flex-1"
                  onClick={handleAddToCart}
                  disabled={product.stock_quantity === 0}
                >
                  <ShoppingCart className="h-5 w-5 mr-2" />
                  {product.stock_quantity > 0 ? "Add to Cart" : "Out of Stock"}
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={handleToggleWishlist}
                >
                  <Heart className={`h-5 w-5 ${isInWishlist(product.id) ? "fill-destructive text-destructive" : ""}`} />
                </Button>
                <Button size="lg" variant="outline">
                  <Share2 className="h-5 w-5" />
                </Button>
              </div>

              <Button variant="outline" size="lg" className="w-full" asChild>
                <Link href="/checkout">
                  Buy Now
                </Link>
              </Button>
            </div>

            {/* Features */}
            <Card>
              <CardContent className="p-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-start gap-3">
                    <TruckIcon className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-sm">Free Shipping</p>
                      <p className="text-xs text-muted-foreground">On orders over $50</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <RefreshCcw className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-sm">Easy Returns</p>
                      <p className="text-xs text-muted-foreground">30-day return policy</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <ShieldCheck className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-sm">Secure Payment</p>
                      <p className="text-xs text-muted-foreground">100% secure checkout</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Package className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-sm">Warranty</p>
                      <p className="text-xs text-muted-foreground">1 Year</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Product Details Tabs */}
        <Card className="mb-16">
          <Tabs defaultValue="description" className="w-full">
            <TabsList className="w-full justify-start rounded-none border-b bg-transparent p-0">
              <TabsTrigger value="description" className="rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary">
                Description
              </TabsTrigger>
              <TabsTrigger value="specifications" className="rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary">
                Specifications
              </TabsTrigger>
              <TabsTrigger value="shipping" className="rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary">
                Shipping & Returns
              </TabsTrigger>
              <TabsTrigger value="reviews" className="rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary">
                Reviews ({product.total_reviews || 0})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="description" className="p-6">
              <div className="prose max-w-none">
                {product.description ? (
                  <p className="text-muted-foreground leading-relaxed whitespace-pre-line">{product.description}</p>
                ) : (
                  <p className="text-muted-foreground">No description available.</p>
                )}
              </div>
            </TabsContent>

            <TabsContent value="specifications" className="p-6">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="flex justify-between py-3 border-b">
                  <span className="font-medium">SKU</span>
                  <span className="text-muted-foreground">{product.sku || "N/A"}</span>
                </div>
                <div className="flex justify-between py-3 border-b">
                  <span className="font-medium">Brand</span>
                  <span className="text-muted-foreground">{product.brand || "N/A"}</span>
                </div>
                <div className="flex justify-between py-3 border-b">
                  <span className="font-medium">Condition</span>
                  <span className="text-muted-foreground">New</span>
                </div>
                <div className="flex justify-between py-3 border-b">
                  <span className="font-medium">Stock</span>
                  <span className="text-muted-foreground">{product.stock_quantity || 0} units</span>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="shipping" className="p-6">
              <div className="space-y-6">
                <div>
                  <h3 className="font-semibold text-lg mb-3">Shipping Information</h3>
                  <ul className="space-y-2 text-muted-foreground">
                    <li>• Free standard shipping on orders over $50</li>
                    <li>• Express shipping available at checkout</li>
                    <li>• Estimated delivery: 3-5 business days</li>
                    <li>• International shipping available to select countries</li>
                    <li>• Track your order in real-time</li>
                  </ul>
                </div>
                <Separator />
                <div>
                  <h3 className="font-semibold text-lg mb-3">Return Policy</h3>
                  <ul className="space-y-2 text-muted-foreground">
                    <li>• 30-day money-back guarantee</li>
                    <li>• Free returns on all orders</li>
                    <li>• Items must be unused and in original packaging</li>
                    <li>• Refund processed within 5-7 business days</li>
                    <li>• Contact support for return authorization</li>
                  </ul>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="reviews" className="p-6">
              <div className="space-y-8">
                <ReviewList productId={product.id} />
                <Separator />
                <div>
                  <h3 className="font-semibold text-lg mb-4">Write a Review</h3>
                  <ReviewForm productId={product.id} productTitle={product.title} />
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </Card>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold font-serif mb-6">Related Products</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {relatedProducts.map((relatedProduct) => (
                <ProductCard 
                  key={relatedProduct.id} 
                  id={relatedProduct.id}
                  title={relatedProduct.title}
                  price={relatedProduct.price}
                  compareAtPrice={relatedProduct.compare_at_price}
                  image={relatedProduct.images?.[0]?.url || "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600"}
                  rating={relatedProduct.rating || 4.5}
                  reviewCount={relatedProduct.total_reviews || 0}
                  sellerName={relatedProduct.seller?.business_name || "Unknown Seller"}
                  sellerId={relatedProduct.seller?.id}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </CustomerLayout>
  );
}