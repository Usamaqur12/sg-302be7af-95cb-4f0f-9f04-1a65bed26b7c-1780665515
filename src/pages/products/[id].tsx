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
  ShieldCheck, RefreshCcw, Share2, Minus, Plus, Store, ChevronLeft
} from "lucide-react";

// Mock product data
const MOCK_PRODUCTS: Record<string, any> = {
  "1": {
    id: "1",
    title: "Premium Wireless Headphones",
    slug: "premium-wireless-headphones",
    description: "Experience studio-quality sound with our premium wireless headphones. Featuring active noise cancellation, 30-hour battery life, and premium leather cushions for all-day comfort.",
    price: 299.99,
    salePrice: 249.99,
    images: [
      { url: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800" },
      { url: "https://images.unsplash.com/photo-1484704849700-f032a568e944?w=800" },
      { url: "https://images.unsplash.com/photo-1524678606370-a47ad25cb82a?w=800" },
    ],
    rating: 4.8,
    totalReviews: 248,
    stock: 42,
    category: { name: "Electronics", slug: "electronics" },
    seller: {
      id: "seller-1",
      business_name: "AudioTech Store",
      rating: 4.9,
      total_products: 156,
    },
    specifications: {
      "Brand": "AudioTech",
      "Model": "AT-PRO500",
      "Battery Life": "30 hours",
      "Noise Cancellation": "Active ANC",
      "Connectivity": "Bluetooth 5.2, 3.5mm AUX",
      "Weight": "250g",
      "Warranty": "2 Years",
    },
  },
  "2": {
    id: "2",
    title: "Smart Watch Series X",
    slug: "smart-watch-series-x",
    description: "Stay connected and healthy with our latest smartwatch. Track your fitness, monitor your heart rate, receive notifications, and enjoy a stunning AMOLED display with customizable watch faces.",
    price: 399.99,
    salePrice: 349.99,
    images: [
      { url: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800" },
      { url: "https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=800" },
    ],
    rating: 4.6,
    totalReviews: 182,
    stock: 28,
    category: { name: "Wearables", slug: "wearables" },
    seller: {
      id: "seller-2",
      business_name: "TechGear Plus",
      rating: 4.7,
      total_products: 89,
    },
    specifications: {
      "Display": "1.4\" AMOLED",
      "Battery": "Up to 7 days",
      "Water Resistance": "5ATM (50m)",
      "Sensors": "Heart rate, GPS, Accelerometer",
      "Compatibility": "iOS & Android",
      "Warranty": "1 Year",
    },
  },
};

export default function ProductDetailPage() {
  const router = useRouter();
  const { id } = router.query;
  const { addToCart } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const { toast } = useToast();

  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);

  useEffect(() => {
    if (!id) return;

    // Simulate API call with instant mock data
    const loadProduct = () => {
      setLoading(true);
      
      // Use mock data
      const mockProduct = MOCK_PRODUCTS[id as string] || MOCK_PRODUCTS["1"];
      
      setTimeout(() => {
        setProduct(mockProduct);
        setLoading(false);
      }, 100);
    };

    loadProduct();
  }, [id]);

  const handleAddToCart = () => {
    if (!product) return;

    addToCart({
      id: `cart-${product.id}`,
      product_id: product.id,
      quantity,
      product: {
        id: product.id,
        title: product.title,
        price: product.salePrice || product.price,
        images: product.images,
        slug: product.slug,
      },
    });

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
    if (quantity < (product?.stock || 99)) {
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
        <div className="container py-16">
          <div className="animate-pulse space-y-8">
            <div className="h-8 w-48 bg-muted rounded"/>
            <div className="grid md:grid-cols-2 gap-8">
              <div className="aspect-square bg-muted rounded-lg"/>
              <div className="space-y-4">
                <div className="h-8 w-3/4 bg-muted rounded"/>
                <div className="h-6 w-1/2 bg-muted rounded"/>
                <div className="h-24 bg-muted rounded"/>
              </div>
            </div>
          </div>
        </div>
      </CustomerLayout>
    );
  }

  if (!product) {
    return (
      <CustomerLayout>
        <div className="container py-16 text-center">
          <Package className="h-16 w-16 mx-auto text-muted-foreground mb-4"/>
          <h2 className="text-2xl font-bold mb-2">Product Not Found</h2>
          <p className="text-muted-foreground mb-8">The product you're looking for doesn't exist.</p>
          <Button asChild>
            <Link href="/">Back to Home</Link>
          </Button>
        </div>
      </CustomerLayout>
    );
  }

  const discount = product.salePrice 
    ? Math.round(((product.price - product.salePrice) / product.price) * 100)
    : 0;

  const relatedProducts = Object.values(MOCK_PRODUCTS).filter(p => p.id !== product.id).slice(0, 4);

  return (
    <CustomerLayout>
      <div className="container py-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
          <Link href="/" className="hover:text-foreground">Home</Link>
          <span>/</span>
          <Link href="/categories" className="hover:text-foreground">Categories</Link>
          <span>/</span>
          <Link href={`/categories/${product.category.slug}`} className="hover:text-foreground">
            {product.category.name}
          </Link>
          <span>/</span>
          <span className="text-foreground">{product.title}</span>
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
                src={product.images[selectedImage]?.url || "/placeholder.png"}
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
            {product.images.length > 1 && (
              <div className="grid grid-cols-4 gap-2">
                {product.images.map((img: any, idx: number) => (
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
              <div className="flex items-center gap-2 mb-2">
                <Link href={`/sellers/${product.seller.id}`} className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1">
                  <Store className="h-3.5 w-3.5" />
                  {product.seller.business_name}
                </Link>
                <span className="text-muted-foreground">•</span>
                <div className="flex items-center gap-1 text-sm">
                  <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                  <span className="font-medium">{product.seller.rating}</span>
                </div>
              </div>

              <h1 className="text-3xl font-bold font-serif mb-3">{product.title}</h1>

              <div className="flex items-center gap-3 mb-4">
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`h-4 w-4 ${
                        i < Math.floor(product.rating)
                          ? "fill-amber-400 text-amber-400"
                          : "text-muted-foreground"
                      }`}
                    />
                  ))}
                </div>
                <span className="text-sm font-medium">{product.rating}</span>
                <span className="text-sm text-muted-foreground">({product.totalReviews} reviews)</span>
              </div>
            </div>

            <Separator />

            {/* Pricing */}
            <div className="space-y-2">
              <div className="flex items-baseline gap-3">
                <span className="text-4xl font-bold font-mono text-destructive">
                  ${(product.salePrice || product.price).toFixed(2)}
                </span>
                {product.salePrice && (
                  <>
                    <span className="text-xl text-muted-foreground line-through font-mono">
                      ${product.price.toFixed(2)}
                    </span>
                    <Badge variant="destructive">Save {discount}%</Badge>
                  </>
                )}
              </div>
              {product.stock > 0 && product.stock < 10 && (
                <p className="text-sm text-amber-600 font-medium">
                  Only {product.stock} left in stock - order soon!
                </p>
              )}
            </div>

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
                    disabled={quantity >= (product.stock || 99)}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                {product.stock > 0 && (
                  <span className="text-sm text-muted-foreground">
                    {product.stock} available
                  </span>
                )}
              </div>

              <div className="flex gap-3">
                <Button
                  size="lg"
                  className="flex-1"
                  onClick={handleAddToCart}
                  disabled={product.stock === 0}
                >
                  <ShoppingCart className="h-5 w-5 mr-2" />
                  {product.stock > 0 ? "Add to Cart" : "Out of Stock"}
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
                      <p className="text-xs text-muted-foreground">
                        {product.specifications?.Warranty || "1 Year"}
                      </p>
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
                Reviews ({product.totalReviews})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="description" className="p-6">
              <div className="prose max-w-none">
                <p className="text-muted-foreground leading-relaxed">{product.description}</p>
                
                <h3 className="mt-6 mb-3 font-semibold text-lg">Key Features:</h3>
                <ul className="space-y-2 text-muted-foreground">
                  <li>Premium build quality with attention to detail</li>
                  <li>Latest technology for optimal performance</li>
                  <li>Ergonomic design for comfort during extended use</li>
                  <li>Compatible with multiple devices and platforms</li>
                  <li>Energy efficient with long-lasting durability</li>
                </ul>
              </div>
            </TabsContent>

            <TabsContent value="specifications" className="p-6">
              <div className="grid sm:grid-cols-2 gap-4">
                {Object.entries(product.specifications).map(([key, value]) => (
                  <div key={key} className="flex justify-between py-3 border-b">
                    <span className="font-medium">{key}</span>
                    <span className="text-muted-foreground">{value as string}</span>
                  </div>
                ))}
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
                  <ReviewForm productId={product.id} />
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </Card>

        {/* Related Products */}
        <div>
          <h2 className="text-2xl font-bold font-serif mb-6">Related Products</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {relatedProducts.map((relatedProduct) => (
              <ProductCard key={relatedProduct.id} product={relatedProduct} />
            ))}
          </div>
        </div>
      </div>
    </CustomerLayout>
  );
}