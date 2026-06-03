import { CustomerLayout } from "@/components/CustomerLayout";
import { ProductCard } from "@/components/ProductCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Zap, Clock, TrendingDown } from "lucide-react";

const flashDeals = [
  {
    id: "1",
    title: "Wireless Noise Cancelling Headphones",
    price: 149.99,
    compareAtPrice: 299.99,
    image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&h=600&fit=crop",
    rating: 4.8,
    reviewCount: 1234,
    sellerName: "TechPro Store",
  },
  {
    id: "2",
    title: "4K Ultra HD Smart TV 55\"",
    price: 499.99,
    compareAtPrice: 899.99,
    image: "https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=600&h=600&fit=crop",
    rating: 4.7,
    reviewCount: 789,
    sellerName: "Home Electronics",
  },
  {
    id: "3",
    title: "Gaming Laptop RTX 4070",
    price: 1699.99,
    compareAtPrice: 2299.99,
    image: "https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=600&h=600&fit=crop",
    rating: 4.9,
    reviewCount: 432,
    sellerName: "Gaming Gear",
  },
  {
    id: "4",
    title: "Professional DSLR Camera",
    price: 999.99,
    compareAtPrice: 1599.99,
    image: "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=600&h=600&fit=crop",
    rating: 4.8,
    reviewCount: 567,
    sellerName: "Photo Masters",
  },
  {
    id: "5",
    title: "Ergonomic Office Chair",
    price: 279.99,
    compareAtPrice: 499.99,
    image: "https://images.unsplash.com/photo-1580480055273-228ff5388ef8?w=600&h=600&fit=crop",
    rating: 4.5,
    reviewCount: 321,
    sellerName: "Office Plus",
  },
  {
    id: "6",
    title: "Bluetooth Speaker Waterproof",
    price: 69.99,
    compareAtPrice: 129.99,
    image: "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=600&h=600&fit=crop",
    rating: 4.6,
    reviewCount: 1456,
    sellerName: "Sound Solutions",
  },
  {
    id: "7",
    title: "Smart Watch Series 7",
    price: 299.99,
    compareAtPrice: 449.99,
    image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&h=600&fit=crop",
    rating: 4.7,
    reviewCount: 892,
    sellerName: "Wearable Tech",
  },
  {
    id: "8",
    title: "Mechanical Gaming Keyboard RGB",
    price: 129.99,
    compareAtPrice: 229.99,
    image: "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=600&h=600&fit=crop",
    rating: 4.8,
    reviewCount: 654,
    sellerName: "Gaming Gear",
  },
];

export default function DealsPage() {
  return (
    <CustomerLayout>
      {/* Hero Banner */}
      <div className="bg-gradient-to-r from-warning/20 via-warning/10 to-transparent border-b">
        <div className="container py-12">
          <div className="flex items-center gap-4 mb-4">
            <Zap className="h-12 w-12 text-warning" />
            <div>
              <h1 className="text-4xl font-bold mb-2">Today's Flash Deals</h1>
              <p className="text-lg text-muted-foreground">
                Limited time offers — up to 70% off on selected products
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-4 text-sm">
            <Badge className="bg-destructive text-destructive-foreground">
              <Clock className="h-3 w-3 mr-1" />
              Ends in 6h 32m
            </Badge>
            <span className="text-muted-foreground">
              New deals added daily at 12:00 AM
            </span>
          </div>
        </div>
      </div>

      {/* Deal Stats */}
      <div className="border-b bg-muted/30">
        <div className="container py-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="p-4 text-center">
              <TrendingDown className="h-8 w-8 text-accent mx-auto mb-2" />
              <p className="text-2xl font-bold font-mono">70%</p>
              <p className="text-sm text-muted-foreground">Max Discount</p>
            </Card>
            <Card className="p-4 text-center">
              <Zap className="h-8 w-8 text-warning mx-auto mb-2" />
              <p className="text-2xl font-bold font-mono">1,234</p>
              <p className="text-sm text-muted-foreground">Active Deals</p>
            </Card>
            <Card className="p-4 text-center">
              <Clock className="h-8 w-8 text-green-500 mx-auto mb-2" />
              <p className="text-2xl font-bold font-mono">6h 32m</p>
              <p className="text-sm text-muted-foreground">Time Left</p>
            </Card>
            <Card className="p-4 text-center">
              <div className="h-8 w-8 bg-primary rounded-full mx-auto mb-2 flex items-center justify-center text-primary-foreground font-bold">
                $
              </div>
              <p className="text-2xl font-bold font-mono">$450K</p>
              <p className="text-sm text-muted-foreground">Total Savings</p>
            </Card>
          </div>
        </div>
      </div>

      {/* Flash Deals Grid */}
      <div className="container py-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">Lightning Deals</h2>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              All Categories
            </Button>
            <Button variant="outline" size="sm">
              Price: Low to High
            </Button>
            <Button variant="outline" size="sm">
              Discount %
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {flashDeals.map((product) => (
            <ProductCard key={product.id} {...product} />
          ))}
        </div>

        <div className="text-center mt-12">
          <Button size="lg">Load More Deals</Button>
        </div>
      </div>
    </CustomerLayout>
  );
}