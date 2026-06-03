import { CustomerLayout } from "@/components/CustomerLayout";
import { ProductCard } from "@/components/ProductCard";
import { Badge } from "@/components/ui/badge";

const MOCK_NEW_PRODUCTS = [
  {
    id: "new-1",
    title: "Ultra HD Webcam Pro",
    price: 129.99,
    compare_at_price: 179.99,
    rating: 4.8,
    total_reviews: 234,
    image: "https://images.unsplash.com/photo-1588423771073-b8903fbb85b5?w=400",
    seller: "TechWorld Store",
  },
  {
    id: "new-2",
    title: "Ergonomic Office Chair",
    price: 299.99,
    rating: 4.7,
    total_reviews: 456,
    image: "https://images.unsplash.com/photo-1580480055273-228ff5388ef8?w=400",
    seller: "ComfortHome",
  },
  {
    id: "new-3",
    title: "Smart LED Light Bulbs (4-Pack)",
    price: 39.99,
    compare_at_price: 59.99,
    rating: 4.6,
    total_reviews: 789,
    image: "https://images.unsplash.com/photo-1550985543-49bee3167284?w=400",
    seller: "SmartLiving",
  },
  {
    id: "new-4",
    title: "Wireless Charging Pad",
    price: 24.99,
    rating: 4.5,
    total_reviews: 321,
    image: "https://images.unsplash.com/photo-1591290619762-9b04f6d4e3d5?w=400",
    seller: "TechAccessories",
  },
];

export default function NewArrivalsPage() {
  return (
    <CustomerLayout>
      <div className="container py-12">
        <div className="mb-8">
          <Badge className="mb-4">Just Launched</Badge>
          <h1 className="text-4xl font-bold mb-3">New Arrivals</h1>
          <p className="text-muted-foreground text-lg">
            Discover the latest products from our sellers
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {MOCK_NEW_PRODUCTS.map((product) => (
            <ProductCard
              key={product.id}
              id={product.id}
              title={product.title}
              price={product.price}
              compareAtPrice={product.compare_at_price}
              image={product.image}
              rating={product.rating}
              reviewCount={product.total_reviews}
              sellerName={product.seller}
            />
          ))}
        </div>
      </div>
    </CustomerLayout>
  );
}