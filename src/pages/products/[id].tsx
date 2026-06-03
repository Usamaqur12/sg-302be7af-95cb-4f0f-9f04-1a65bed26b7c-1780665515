"use client";

import { CustomerLayout } from "@/components/CustomerLayout";
import { ProductCard } from "@/components/ProductCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { ReviewForm } from "@/components/ReviewForm";
import { ReviewList } from "@/components/ReviewList";
import { useAuth } from "@/hooks/useAuth";
import { useCart } from "@/contexts/CartContext";
import { useWishlist } from "@/hooks/useWishlist";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import Image from "next/image";
import { Star, ShoppingCart, Heart, Package, Shield, TruckIcon, Store, ChevronLeft, ChevronRight, Minus, Plus } from "lucide-react";
import { analytics } from "@/lib/analytics";

// Mock data fallback
const MOCK_PRODUCT = {
  id: "mock-1",
  title: "Premium Wireless Headphones",
  description: "Experience superior sound quality with our premium wireless headphones. Featuring active noise cancellation, 30-hour battery life, and comfortable over-ear design.",
  price: 199.99,
  compare_at_price: 299.99,
  stock_quantity: 50,
  sku: "WH-1000XM4",
  rating: 4.8,
  total_reviews: 1247,
  images: [
    { id: "1", url: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800", display_order: 0 },
    { id: "2", url: "https://images.unsplash.com/photo-1484704849700-f032a568e944?w=800", display_order: 1 },
    { id: "3", url: "https://images.unsplash.com/photo-1545127398-14699f92334b?w=800", display_order: 2 },
  ],
  category: { id: "electronics", name: "Electronics", slug: "electronics" },
  seller: { id: "seller-1", business_name: "TechWorld Store", rating: 4.9, total_reviews: 3421 },
  specifications: {
    "Brand": "AudioMax",
    "Model": "WH-1000XM4",
    "Connectivity": "Bluetooth 5.0",
    "Battery Life": "30 hours",
    "Noise Cancellation": "Active ANC",
    "Weight": "254g",
  },
};

const MOCK_RELATED = [
  {
    id: "related-1",
    title: "Portable Bluetooth Speaker",
    price: 79.99,
    compare_at_price: 99.99,
    rating: 4.6,
    total_reviews: 892,
    images: [{ url: "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=400" }],
    seller: { business_name: "AudioHub" },
  },
  {
    id: "related-2",
    title: "USB-C Charging Cable",
    price: 19.99,
    rating: 4.4,
    total_reviews: 567,
    images: [{ url: "https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=400" }],
    seller: { business_name: "TechAccessories" },
  },
  {
    id: "related-3",
    title: "Wireless Earbuds Pro",
    price: 149.99,
    compare_at_price: 199.99,
    rating: 4.7,
    total_reviews: 1034,
    images: [{ url: "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=400" }],
    seller: { business_name: "AudioMax" },
  },
  {
    id: "related-4",
    title: "Premium Headphone Case",
    price: 29.99,
    rating: 4.5,
    total_reviews: 423,
    images: [{ url: "https://images.unsplash.com/photo-1625948515291-69613efd103f?w=400" }],
    seller: { business_name: "TechWorld Store" },
  },
];

interface ProductDetail {
  id: string;
  title: string;
  description: string;
  price: number;
  compare_at_price: number | null;
  stock_quantity: number;
  sku: string;
  rating: number;
  total_reviews: number;
  images: { id: string; url: string; display_order: number }[];
  category: { id: string; name: string; slug: string };
  seller: { id: string; business_name: string; rating: number; total_reviews: number };
  specifications?: Record<string, string>;
}

export default function ProductDetailPage() {
  const { user } = useAuth();
  const { addToCart } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const { toast } = useToast();
  const router = useRouter();
  const { id } = router.query;

  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<any[]>([]);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [reviewRefreshTrigger, setReviewRefreshTrigger] = useState(0);

  useEffect(() => {
    if (!id || typeof id !== 'string') return;

    async function fetchProduct() {
      try {
        // Try to fetch real data with timeout
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('timeout')), 3000)
        );

        const dataPromise = supabase
          .from("products")
          .select(`
            *,
            images:product_images(id, url, display_order),
            category:categories(id, name, slug),
            seller:seller_profiles(id, business_name, rating, total_reviews)
          `)
          .eq("id", id as string)
          .eq("status", "approved")
          .single();

        const { data: productData, error } = await Promise.race([
          dataPromise,
          timeoutPromise,
        ]) as any;

        if (error || !productData) {
          throw new Error('Product not found');
        }

        setProduct(productData as any);

        // Track product view
        analytics.productViewed({
          id: productData.id,
          name: productData.title,
          price: productData.price,
          category: productData.category?.name,
          seller: productData.seller?.business_name,
        });

        // Fetch related products
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
            seller:seller_profiles(business_name)
          `)
          .eq("category_id", productData.category.id)
          .eq("status", "approved")
          .neq("id", id as string)
          .limit(4);

        setRelatedProducts(relatedData || MOCK_RELATED);
      } catch (error) {
        // Use mock data on error or timeout
        console.log("Using mock product data");
        setProduct(MOCK_PRODUCT);
        setRelatedProducts(MOCK_RELATED);
      } finally {
        setLoading(false);
      }
    }

    fetchProduct();
  }, [id]);

  const handleAddToCart = async () => {
    if (!product) return;

    await addToCart(product.id, quantity);
    toast({
      title: "Added to Cart",
      description: `${quantity} × ${product.title} added to your cart`,
    });

    // Track add to cart
    analytics.addToCart({
      id: product.id,
      name: product.title,
      price: product.price,
      quantity,
    });
  };

  const handleWishlistToggle = async () => {
    if (!product) return;
    await toggleWishlist(product.id, product.title, product.price);
  };

  const handleReviewSubmitted = () => {
    setReviewRefreshTrigger((prev) => prev + 1);
  };

  const discount = product?.compare_at_price
    ? Math.round(((product.compare_at_price - product.price) / product.compare_at_price) * 100)
    : 0;

  const inWishlist = product ? isInWishlist(product.id) : false;

  if (loading) {
    return (
      <CustomerLayout>
        <div className="container py-16 text-center">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded w-1/2 mx-auto"></div>
            <div className="h-4 bg-muted rounded w-1/3 mx-auto"></div>
          </div>
        </div>
      </CustomerLayout>
    );
  }

  if (!product) {
    return (
      <CustomerLayout>
        <div className="container py-16 text-center">
          <h1 className="text-2xl font-bold mb-4">Product Not Found</h1>
          <p className="text-muted-foreground mb-6">The product you're looking for doesn't exist or has been removed.</p>
          <Button onClick={() => router.push("/")}>Back to Home</Button>
        </div>
      </CustomerLayout>
    );
  }

  return (
    <CustomerLayout>
      <div className="container py-8">
        {/* Breadcrumb */}
        <Breadcrumb className="mb-6">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/">Home</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href={`/categories/${product.category.slug}`}>
                {product.category.name}
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbPage>{product.title}</BreadcrumbPage>
          </BreadcrumbList>
        </Breadcrumb>

        {/* Product Details */}
        <div className="grid md:grid-cols-2 gap-8 mb-12">
          {/* Image Gallery */}
          <div>
            <div className="relative aspect-square rounded-lg overflow-hidden bg-muted mb-4">
              <Image
                src={product.images[selectedImage]?.url || product.images[0]?.url}
                alt={product.title}
                fill
                className="object-cover"
                priority
              />
              {discount > 0 && (
                <Badge className="absolute top-4 right-4 bg-destructive text-destructive-foreground">
                  -{discount}% OFF
                </Badge>
              )}
            </div>

            {/* Thumbnails */}
            {product.images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto">
                {product.images.map((img, idx) => (
                  <button
                    key={img.id}
                    onClick={() => setSelectedImage(idx)}
                    className={`relative w-20 h-20 rounded-lg overflow-hidden border-2 transition-colors ${
                      selectedImage === idx ? "border-primary" : "border-transparent"
                    }`}
                  >
                    <Image src={img.url} alt={`View ${idx + 1}`} fill className="object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div>
            <Link
              href={`/sellers/${product.seller.id}`}
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-accent mb-2"
            >
              <Store className="h-4 w-4" />
              {product.seller.business_name}
            </Link>

            <h1 className="text-3xl font-bold mb-4">{product.title}</h1>

            {/* Rating */}
            <div className="flex items-center gap-4 mb-4">
              <div className="flex items-center gap-2">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`h-5 w-5 ${
                      i < Math.floor(product.rating)
                        ? "fill-warning text-warning"
                        : "text-muted-foreground"
                    }`}
                  />
                ))}
              </div>
              <span className="text-sm text-muted-foreground">
                {product.rating} ({product.total_reviews} reviews)
              </span>
            </div>

            {/* Price */}
            <div className="flex items-baseline gap-3 mb-6">
              <span className="text-4xl font-bold font-mono">${product.price.toFixed(2)}</span>
              {product.compare_at_price && (
                <span className="text-xl text-muted-foreground line-through font-mono">
                  ${product.compare_at_price.toFixed(2)}
                </span>
              )}
            </div>

            {/* Stock Status */}
            <div className="mb-6">
              {product.stock_quantity > 0 ? (
                <Badge variant="secondary" className="gap-2">
                  <Package className="h-4 w-4" />
                  In Stock ({product.stock_quantity} available)
                </Badge>
              ) : (
                <Badge variant="destructive">Out of Stock</Badge>
              )}
            </div>

            {/* Quantity Selector */}
            <div className="mb-6">
              <label className="text-sm font-medium mb-2 block">Quantity</label>
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  disabled={quantity <= 1}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <span className="text-lg font-mono font-medium w-12 text-center">{quantity}</span>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setQuantity(Math.min(product.stock_quantity, quantity + 1))}
                  disabled={quantity >= product.stock_quantity}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4 mb-6">
              <Button
                size="lg"
                className="flex-1"
                onClick={handleAddToCart}
                disabled={product.stock_quantity === 0}
              >
                <ShoppingCart className="mr-2 h-5 w-5" />
                Add to Cart
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={handleWishlistToggle}
              >
                <Heart className={`h-5 w-5 ${inWishlist ? "fill-destructive text-destructive" : ""}`} />
              </Button>
            </div>

            {/* Trust Badges */}
            <div className="grid grid-cols-3 gap-4">
              <Card className="p-4 text-center">
                <Shield className="h-6 w-6 mx-auto mb-2 text-primary" />
                <p className="text-xs text-muted-foreground">Buyer Protection</p>
              </Card>
              <Card className="p-4 text-center">
                <TruckIcon className="h-6 w-6 mx-auto mb-2 text-primary" />
                <p className="text-xs text-muted-foreground">Free Shipping</p>
              </Card>
              <Card className="p-4 text-center">
                <Package className="h-6 w-6 mx-auto mb-2 text-primary" />
                <p className="text-xs text-muted-foreground">Easy Returns</p>
              </Card>
            </div>
          </div>
        </div>

        {/* Product Details Tabs */}
        <Tabs defaultValue="description" className="mb-12">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="description">Description</TabsTrigger>
            <TabsTrigger value="specifications">Specifications</TabsTrigger>
            <TabsTrigger value="reviews">Reviews ({product.total_reviews})</TabsTrigger>
          </TabsList>

          <TabsContent value="description" className="mt-6">
            <Card className="p-6">
              <p className="text-muted-foreground leading-relaxed whitespace-pre-line">
                {product.description}
              </p>
            </Card>
          </TabsContent>

          <TabsContent value="specifications" className="mt-6">
            <Card className="p-6">
              <dl className="space-y-4">
                {product.specifications && Object.entries(product.specifications).map(([key, value]) => (
                  <div key={key} className="flex border-b pb-4 last:border-0">
                    <dt className="font-medium w-1/3">{key}</dt>
                    <dd className="text-muted-foreground w-2/3">{value}</dd>
                  </div>
                ))}
                <div className="flex border-b pb-4">
                  <dt className="font-medium w-1/3">SKU</dt>
                  <dd className="text-muted-foreground w-2/3 font-mono">{product.sku}</dd>
                </div>
              </dl>
            </Card>
          </TabsContent>

          <TabsContent value="reviews" className="mt-6">
            <div className="space-y-8">
              <ReviewForm
                productId={product.id}
                productTitle={product.title}
                onReviewSubmitted={handleReviewSubmitted}
              />

              <Separator />

              <ReviewList
                productId={product.id}
                refreshTrigger={reviewRefreshTrigger}
              />
            </div>
          </TabsContent>
        </Tabs>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <section>
            <h2 className="text-2xl font-bold mb-6">Related Products</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {relatedProducts.map((relatedProduct) => (
                <ProductCard
                  key={relatedProduct.id}
                  id={relatedProduct.id}
                  title={relatedProduct.title}
                  price={relatedProduct.price}
                  compareAtPrice={relatedProduct.compare_at_price}
                  image={relatedProduct.images?.[0]?.url || ""}
                  rating={relatedProduct.rating}
                  reviewCount={relatedProduct.total_reviews}
                  sellerName={relatedProduct.seller?.business_name || ""}
                />
              ))}
            </div>
          </section>
        )}
      </div>
    </CustomerLayout>
  );
}