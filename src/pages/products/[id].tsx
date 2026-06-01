import { CustomerLayout } from "@/components/CustomerLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Heart, ShoppingCart, Star, Shield, Truck, RotateCcw, Store } from "lucide-react";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { supabase } from "@/integrations/supabase/client";
import { ProductCard } from "@/components/ProductCard";

interface ProductDetail {
  id: string;
  name: string;
  description: string;
  price: number;
  compare_at_price: number | null;
  stock: number;
  sku: string;
  rating: number;
  total_reviews: number;
  images: { id: string; image_url: string; display_order: number }[];
  category: { id: string; name: string; slug: string };
  seller: { id: string; business_name: string; rating: number; total_reviews: number };
}

interface Review {
  id: string;
  rating: number;
  comment: string;
  created_at: string;
  user: { full_name: string };
}

export default function ProductDetailPage() {
  const router = useRouter();
  const { id } = router.query;
  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [relatedProducts, setRelatedProducts] = useState<any[]>([]);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;

    async function fetchProduct() {
      const { data: productData } = await supabase
        .from("products")
        .select(`
          *,
          images:product_images(id, image_url, display_order),
          category:categories(id, name, slug),
          seller:seller_profiles(id, business_name, rating, total_reviews)
        `)
        .eq("id", id)
        .eq("status", "approved")
        .single();

      if (productData) {
        setProduct(productData);

        const { data: reviewsData } = await supabase
          .from("reviews")
          .select(`
            id,
            rating,
            comment,
            created_at,
            user:profiles(full_name)
          `)
          .eq("product_id", id)
          .order("created_at", { ascending: false })
          .limit(10);

        setReviews(reviewsData || []);

        const { data: relatedData } = await supabase
          .from("products")
          .select(`
            id,
            name,
            price,
            compare_at_price,
            rating,
            total_reviews,
            images:product_images(image_url),
            seller:seller_profiles(business_name)
          `)
          .eq("category_id", productData.category.id)
          .eq("status", "approved")
          .neq("id", id)
          .limit(4);

        setRelatedProducts(relatedData || []);
      }
      setLoading(false);
    }

    fetchProduct();
  }, [id]);

  if (loading) {
    return (
      <CustomerLayout>
        <div className="container py-8">
          <div className="grid md:grid-cols-2 gap-8">
            <div className="aspect-square bg-muted animate-pulse rounded-lg" />
            <div className="space-y-4">
              <div className="h-8 w-3/4 bg-muted animate-pulse rounded" />
              <div className="h-6 w-1/2 bg-muted animate-pulse rounded" />
              <div className="h-12 w-1/3 bg-muted animate-pulse rounded" />
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
          <h1 className="text-2xl font-bold mb-4">Product Not Found</h1>
          <Button onClick={() => router.push("/")}>Go Home</Button>
        </div>
      </CustomerLayout>
    );
  }

  const discount = product.compare_at_price
    ? Math.round(((product.compare_at_price - product.price) / product.compare_at_price) * 100)
    : 0;

  const images = product.images.sort((a, b) => a.display_order - b.display_order);

  return (
    <CustomerLayout>
      <div className="container py-8">
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
            <BreadcrumbItem>
              <BreadcrumbPage>{product.name}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div className="grid md:grid-cols-2 gap-12 mb-16">
          <div>
            <div className="aspect-square rounded-lg overflow-hidden bg-muted mb-4 relative">
              <Image
                src={images[selectedImage]?.image_url || "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&h=800&fit=crop"}
                alt={product.name}
                fill
                className="object-cover"
                priority
              />
              {discount > 0 && (
                <Badge className="absolute top-4 right-4 bg-destructive text-destructive-foreground">
                  -{discount}%
                </Badge>
              )}
            </div>

            {images.length > 1 && (
              <div className="grid grid-cols-4 gap-4">
                {images.map((img, idx) => (
                  <button
                    key={img.id}
                    onClick={() => setSelectedImage(idx)}
                    className={`aspect-square rounded-lg overflow-hidden bg-muted border-2 transition-colors ${
                      selectedImage === idx ? "border-accent" : "border-transparent hover:border-border"
                    }`}
                  >
                    <Image
                      src={img.image_url}
                      alt={`${product.name} ${idx + 1}`}
                      width={200}
                      height={200}
                      className="object-cover w-full h-full"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div>
            <h1 className="text-3xl font-bold mb-4">{product.name}</h1>

            <div className="flex items-center gap-4 mb-4">
              <div className="flex items-center gap-1">
                <Star className="h-5 w-5 fill-warning text-warning" />
                <span className="font-medium font-mono">{product.rating.toFixed(1)}</span>
              </div>
              <span className="text-muted-foreground">({product.total_reviews} reviews)</span>
            </div>

            <Link href={`/sellers/${product.seller.id}`}>
              <div className="flex items-center gap-2 mb-6 text-sm text-muted-foreground hover:text-foreground transition-colors">
                <Store className="h-4 w-4" />
                <span>{product.seller.business_name}</span>
                <span>•</span>
                <div className="flex items-center gap-1">
                  <Star className="h-3 w-3 fill-warning text-warning" />
                  <span>{product.seller.rating.toFixed(1)}</span>
                </div>
              </div>
            </Link>

            <Separator className="mb-6" />

            <div className="mb-6">
              <div className="flex items-baseline gap-3 mb-2">
                <span className="text-4xl font-bold font-mono">${product.price.toFixed(2)}</span>
                {product.compare_at_price && (
                  <span className="text-xl text-muted-foreground line-through font-mono">
                    ${product.compare_at_price.toFixed(2)}
                  </span>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                Stock: <span className="font-medium">{product.stock} units available</span>
              </p>
            </div>

            <div className="flex items-center gap-4 mb-8">
              <div className="flex items-center border border-border rounded-md">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  disabled={quantity <= 1}
                >
                  -
                </Button>
                <span className="px-4 font-mono">{quantity}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                  disabled={quantity >= product.stock}
                >
                  +
                </Button>
              </div>
              <Button size="lg" className="flex-1 bg-accent hover:bg-accent/90">
                <ShoppingCart className="mr-2 h-5 w-5" />
                Add to Cart
              </Button>
              <Button size="lg" variant="outline">
                <Heart className="h-5 w-5" />
              </Button>
            </div>

            <Card className="p-6 bg-muted/50">
              <div className="grid gap-4">
                <div className="flex items-center gap-3">
                  <Shield className="h-5 w-5 text-accent" />
                  <div>
                    <p className="font-medium">Buyer Protection</p>
                    <p className="text-sm text-muted-foreground">Money-back guarantee</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Truck className="h-5 w-5 text-accent" />
                  <div>
                    <p className="font-medium">Fast Shipping</p>
                    <p className="text-sm text-muted-foreground">Free delivery on orders over $50</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <RotateCcw className="h-5 w-5 text-accent" />
                  <div>
                    <p className="font-medium">Easy Returns</p>
                    <p className="text-sm text-muted-foreground">30-day return policy</p>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>

        <Tabs defaultValue="description" className="mb-16">
          <TabsList>
            <TabsTrigger value="description">Description</TabsTrigger>
            <TabsTrigger value="reviews">Reviews ({product.total_reviews})</TabsTrigger>
          </TabsList>
          <TabsContent value="description" className="mt-6">
            <div className="prose max-w-none">
              <p className="text-muted-foreground leading-relaxed">{product.description}</p>
            </div>
          </TabsContent>
          <TabsContent value="reviews" className="mt-6">
            {reviews.length > 0 ? (
              <div className="space-y-6">
                {reviews.map((review) => (
                  <Card key={review.id} className="p-6">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <p className="font-medium">{review.user?.full_name || "Anonymous"}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(review.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 fill-warning text-warning" />
                        <span className="font-medium font-mono">{review.rating.toFixed(1)}</span>
                      </div>
                    </div>
                    <p className="text-muted-foreground">{review.comment}</p>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No reviews yet. Be the first to review this product!
              </div>
            )}
          </TabsContent>
        </Tabs>

        {relatedProducts.length > 0 && (
          <section>
            <h2 className="text-2xl font-bold mb-6">You May Also Like</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {relatedProducts.map((relatedProduct) => (
                <ProductCard
                  key={relatedProduct.id}
                  id={relatedProduct.id}
                  title={relatedProduct.name}
                  price={relatedProduct.price}
                  compareAtPrice={relatedProduct.compare_at_price || undefined}
                  image={relatedProduct.images[0]?.image_url || "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&h=600&fit=crop"}
                  rating={relatedProduct.rating}
                  reviewCount={relatedProduct.total_reviews}
                  sellerName={relatedProduct.seller?.business_name || "Unknown"}
                />
              ))}
            </div>
          </section>
        )}
      </div>
    </CustomerLayout>
  );
}