import { CustomerLayout } from "@/components/CustomerLayout";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Star, Award, Package, Search } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

const featuredSellers = [
  {
    id: "1",
    name: "TechPro Store",
    logo: "https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?w=200&h=200&fit=crop",
    banner: "https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=1200&h=400&fit=crop",
    rating: 4.9,
    totalReviews: 2341,
    products: 342,
    verified: true,
    category: "Electronics",
  },
  {
    id: "2",
    name: "Fashion Hub",
    logo: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=200&h=200&fit=crop",
    banner: "https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?w=1200&h=400&fit=crop",
    rating: 4.8,
    totalReviews: 1876,
    products: 567,
    verified: true,
    category: "Fashion",
  },
  {
    id: "3",
    name: "Home Essentials",
    logo: "https://images.unsplash.com/photo-1484101403633-562f891dc89a?w=200&h=200&fit=crop",
    banner: "https://images.unsplash.com/photo-1556912173-46c336c7fd55?w=1200&h=400&fit=crop",
    rating: 4.7,
    totalReviews: 1432,
    products: 289,
    verified: true,
    category: "Home & Garden",
  },
  {
    id: "4",
    name: "Gaming Gear",
    logo: "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=200&h=200&fit=crop",
    banner: "https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=1200&h=400&fit=crop",
    rating: 4.9,
    totalReviews: 2103,
    products: 421,
    verified: true,
    category: "Electronics",
  },
  {
    id: "5",
    name: "Sports World",
    logo: "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=200&h=200&fit=crop",
    banner: "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=1200&h=400&fit=crop",
    rating: 4.6,
    totalReviews: 987,
    products: 234,
    verified: true,
    category: "Sports & Outdoors",
  },
  {
    id: "6",
    name: "Beauty Box",
    logo: "https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=200&h=200&fit=crop",
    banner: "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=1200&h=400&fit=crop",
    rating: 4.8,
    totalReviews: 1654,
    products: 345,
    verified: true,
    category: "Beauty & Health",
  },
];

export default function SellersPage() {
  return (
    <CustomerLayout>
      <div className="container py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-4">Featured Sellers</h1>
          <p className="text-muted-foreground text-lg">
            Discover top-rated verified sellers offering quality products
          </p>
        </div>

        <div className="mb-8">
          <div className="relative max-w-2xl">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search sellers by name or category..."
              className="pl-10 h-12"
            />
          </div>
        </div>

        <div className="grid gap-6">
          {featuredSellers.map((seller) => (
            <Card key={seller.id} className="overflow-hidden group hover:shadow-lg transition-shadow">
              <div className="relative h-32 bg-gradient-to-r from-primary/10 to-accent/10">
                <Image
                  src={seller.banner}
                  alt={seller.name}
                  fill
                  className="object-cover opacity-50 group-hover:opacity-60 transition-opacity"
                />
              </div>
              
              <div className="p-6">
                <div className="flex gap-6">
                  <div className="relative h-24 w-24 rounded-lg overflow-hidden border-4 border-card -mt-16 flex-shrink-0 bg-card">
                    <Image
                      src={seller.logo}
                      alt={seller.name}
                      fill
                      className="object-cover"
                    />
                  </div>

                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-2xl font-bold">{seller.name}</h3>
                          {seller.verified && (
                            <Award className="h-6 w-6 text-accent" />
                          )}
                        </div>
                        <Badge variant="outline">{seller.category}</Badge>
                      </div>
                      <Link href={`/sellers/${seller.id}`}>
                        <Button>Visit Store</Button>
                      </Link>
                    </div>

                    <div className="flex items-center gap-6 text-sm text-muted-foreground mb-4">
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 fill-warning text-warning" />
                        <span className="font-mono font-semibold">{seller.rating}</span>
                        <span>({seller.totalReviews} reviews)</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Package className="h-4 w-4" />
                        <span>{seller.products} products</span>
                      </div>
                    </div>

                    <p className="text-sm text-muted-foreground">
                      Trusted seller with thousands of satisfied customers. Fast shipping, quality products, and excellent customer service.
                    </p>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>

        <div className="text-center mt-12">
          <Button size="lg">Load More Sellers</Button>
        </div>
      </div>
    </CustomerLayout>
  );
}