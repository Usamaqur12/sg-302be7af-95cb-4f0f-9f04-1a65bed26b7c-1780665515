"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { CustomerLayout } from "@/components/CustomerLayout";
import { ProductCard } from "@/components/ProductCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  ArrowRight,
  Award,
  DollarSign,
  RefreshCw,
  ShieldCheck,
  ShoppingBag,
  Star,
  Store,
  TruckIcon,
  Users,
  Zap,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

type SellerSummary = {
  id: string;
  business_name: string;
};

type ProductQueryRow = {
  id: string;
  title: string;
  price: number;
  compare_at_price?: number | null;
  deal_expires_at?: string | null;
  rating?: number | null;
  total_reviews?: number | null;
  images?: { url: string }[] | null;
  seller?: SellerSummary | SellerSummary[] | null;
};

type HomepageProduct = {
  id: string;
  title: string;
  price: number;
  compareAtPrice?: number;
  image: string;
  rating: number;
  reviewCount: number;
  sellerName: string;
  sellerId?: string;
  dealExpiresAt?: string | null;
};

type FeaturedVendor = {
  id: string;
  name: string;
  logo: string;
  rating: number;
  products: number;
  verified: boolean;
};

type HomeBanner = {
  id: string;
  title: string;
  image_url: string;
  link_url?: string | null;
};

type HeroSettings = {
  title: string;
  subtitle: string;
  ctaLabel: string;
  ctaHref: string;
};

type VendorQueryRow = {
  id: string;
  business_name: string;
  logo_url?: string | null;
};

function toHomepageProduct(product: ProductQueryRow, fallbackImage: string): HomepageProduct {
  const seller = Array.isArray(product.seller) ? product.seller[0] : product.seller;

  return {
    id: product.id,
    title: product.title,
    price: product.price,
    compareAtPrice: product.compare_at_price ?? undefined,
    dealExpiresAt: product.deal_expires_at ?? null,
    image: product.images?.[0]?.url || fallbackImage,
    rating: product.rating ?? 0,
    reviewCount: product.total_reviews ?? 0,
    sellerName: seller?.business_name || "Unknown Seller",
    sellerId: seller?.id,
  };
}

const shoppingCards = [
  {
    title: "Refresh your home",
    image: "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=700&h=520&fit=crop",
    href: "/categories/home-kitchen",
    links: ["Kitchen", "Furniture", "Storage", "Decor"],
  },
  {
    title: "Tech deals for every desk",
    image: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=700&h=520&fit=crop",
    href: "/categories/electronics",
    links: ["Laptops", "Audio", "Gaming", "Smart devices"],
  },
  {
    title: "Style picks under budget",
    image: "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=700&h=520&fit=crop",
    href: "/categories/fashion",
    links: ["Women", "Men", "Shoes", "Watches"],
  },
  {
    title: "Beauty and wellness",
    image: "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=700&h=520&fit=crop",
    href: "/categories/beauty-health",
    links: ["Skincare", "Grooming", "Vitamins", "Personal care"],
  },
];

const serviceHighlights = [
  {
    icon: ShieldCheck,
    title: "Buyer Protection",
    description: "Secure checkout, dispute support and money-back coverage on eligible orders.",
  },
  {
    icon: Award,
    title: "Verified Sellers",
    description: "Seller approval, verified stores and reviewed product publishing.",
  },
  {
    icon: TruckIcon,
    title: "Fast Delivery",
    description: "Track orders from checkout to doorstep with clear delivery status updates.",
  },
  {
    icon: RefreshCw,
    title: "Easy Returns",
    description: "Simple return requests and support workflows for customer confidence.",
  },
];

const defaultHeroSettings: HeroSettings = {
  title: "Everything your customers search for, all in one marketplace",
  subtitle: "Discover trusted sellers, daily deals, fast order tracking and admin-approved products built for a serious multivendor store.",
  ctaLabel: "Shop Today's Deals",
  ctaHref: "/deals",
};

const defaultHeroImage = "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=1800&h=820&fit=crop";

function ProductShelf({
  title,
  eyebrow,
  href,
  products,
  loading,
}: {
  title: string;
  eyebrow: string;
  href: string;
  products: HomepageProduct[];
  loading: boolean;
}) {
  return (
    <section className="py-10">
      <div className="container">
        <div className="mb-5 flex items-center justify-between gap-4">
          <div>
            <Badge className="mb-2 bg-accent text-accent-foreground">{eyebrow}</Badge>
            <h2 className="text-2xl font-bold md:text-3xl">{title}</h2>
          </div>
          <Button asChild variant="ghost" className="hidden sm:inline-flex">
            <Link href={href}>
              See more
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <Card key={index} className="h-80 animate-pulse rounded-md bg-muted/60" />
            ))}
          </div>
        ) : products.length > 0 ? (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {products.map((product) => (
              <ProductCard key={product.id} {...product} />
            ))}
          </div>
        ) : (
          <Card className="rounded-md border-dashed p-8 text-center">
            <p className="font-medium">Products will appear here after admin approval.</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Seller listings stay hidden until the admin panel approves them.
            </p>
          </Card>
        )}
      </div>
    </section>
  );
}

export default function HomePage() {
  const [bestSellers, setBestSellers] = useState<HomepageProduct[]>([]);
  const [flashDeals, setFlashDeals] = useState<HomepageProduct[]>([]);
  const [newArrivals, setNewArrivals] = useState<HomepageProduct[]>([]);
  const [featuredVendors, setFeaturedVendors] = useState<FeaturedVendor[]>([]);
  const [heroSettings, setHeroSettings] = useState<HeroSettings>(defaultHeroSettings);
  const [heroBanner, setHeroBanner] = useState<HomeBanner | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHomepageData();
  }, []);

  const fetchHomepageData = async () => {
    try {
      const [{ data: cmsSettingsData }, { data: bannersData }] = await Promise.all([
        supabase
          .from("system_settings")
          .select("key, value")
          .in("key", [
            "homepage_hero_title",
            "homepage_hero_subtitle",
            "homepage_hero_cta_label",
            "homepage_hero_cta_href",
          ]),
        supabase
          .from("banners")
          .select("id, title, image_url, link_url")
          .eq("is_active", true)
          .order("display_order", { ascending: true })
          .limit(1),
      ]);

      const cmsSettings = new Map<string, string>(
        (cmsSettingsData ?? []).map((item) => [String(item.key), String(item.value ?? "")])
      );
      setHeroSettings({
        title: cmsSettings.get("homepage_hero_title") || defaultHeroSettings.title,
        subtitle: cmsSettings.get("homepage_hero_subtitle") || defaultHeroSettings.subtitle,
        ctaLabel: cmsSettings.get("homepage_hero_cta_label") || defaultHeroSettings.ctaLabel,
        ctaHref: cmsSettings.get("homepage_hero_cta_href") || defaultHeroSettings.ctaHref,
      });
      setHeroBanner(((bannersData ?? [])[0] as HomeBanner | undefined) ?? null);

      const { data: bestSellersData } = await supabase
        .from("products")
        .select(`
          id,
          title,
          price,
          compare_at_price,
          deal_expires_at,
          rating,
          total_reviews,
          images:product_images(url),
          seller:seller_profiles!seller_id(id, business_name)
        `)
        .eq("status", "approved")
        .order("total_reviews", { ascending: false })
        .limit(8);

      if (bestSellersData) {
        setBestSellers(
          ((bestSellersData ?? []) as unknown as ProductQueryRow[]).map((product) =>
            toHomepageProduct(
              product,
              "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&h=600&fit=crop"
            )
          )
        );
      }

      const { data: flashDealsData } = await supabase
        .from("products")
        .select(`
          id,
          title,
          price,
          compare_at_price,
          deal_expires_at,
          rating,
          total_reviews,
          images:product_images(url),
          seller:seller_profiles!seller_id(id, business_name)
        `)
        .eq("status", "approved")
        .eq("is_deal", true)
        .gte("deal_expires_at", new Date().toISOString())
        .limit(8);

      if (flashDealsData) {
        setFlashDeals(
          ((flashDealsData ?? []) as unknown as ProductQueryRow[]).map((product) =>
            toHomepageProduct(
              product,
              "https://images.unsplash.com/photo-1580480055273-228ff5388ef8?w=600&h=600&fit=crop"
            )
          )
        );
      }

      const { data: newArrivalsData } = await supabase
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
        .eq("status", "approved")
        .order("created_at", { ascending: false })
        .limit(8);

      if (newArrivalsData) {
        setNewArrivals(
          ((newArrivalsData ?? []) as unknown as ProductQueryRow[]).map((product) =>
            toHomepageProduct(
              product,
              "https://images.unsplash.com/photo-1627123424574-724758594e93?w=600&h=600&fit=crop"
            )
          )
        );
      }

      const { data: vendorsData } = await supabase
        .from("seller_profiles")
        .select("id, business_name, logo_url")
        .eq("status", "approved")
        .not("verified_at", "is", null)
        .limit(4);

      if (vendorsData) {
        setFeaturedVendors(
          ((vendorsData ?? []) as unknown as VendorQueryRow[]).map((vendor) => ({
            id: vendor.id,
            name: vendor.business_name,
            logo: vendor.logo_url || "https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?w=200&h=200&fit=crop",
            rating: 4.5,
            products: 0,
            verified: true,
          }))
        );
      }
    } catch {
      // Homepage sections remain usable with local fallback cards when API data is unavailable.
    } finally {
      setLoading(false);
    }
  };

  const heroImage = heroBanner?.image_url || defaultHeroImage;
  const heroTitle = heroBanner?.title || heroSettings.title;
  const heroHref = heroBanner?.link_url || heroSettings.ctaHref || "/deals";

  return (
    <CustomerLayout>
      <section className="bg-[#e7edf3]">
        <div className="relative min-h-[430px] overflow-hidden md:min-h-[500px]">
          <Image
            src={heroImage}
            alt={heroTitle}
            fill
            priority
            className="object-cover"
            unoptimized={heroImage.startsWith("/uploads/")}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0b172a]/95 via-[#0b172a]/70 to-[#0b172a]/15" />
          <div className="container relative z-10 flex min-h-[430px] items-center py-12 text-white md:min-h-[500px]">
            <div className="max-w-2xl">
              <Badge className="mb-4 bg-accent text-accent-foreground">
                <ShoppingBag className="mr-1 h-3.5 w-3.5" />
                Mercato Mega Market
              </Badge>
              <h1 className="mb-5 text-4xl font-bold leading-tight md:text-6xl">
                {heroTitle}
              </h1>
              <p className="mb-7 max-w-xl text-base text-white/85 md:text-lg">
                {heroSettings.subtitle}
              </p>
              <div className="flex flex-wrap gap-3">
                <Button asChild size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90">
                  <Link href={heroHref}>
                    {heroSettings.ctaLabel}
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="border-white/30 bg-white/10 text-white hover:bg-white/20 hover:text-white"
                >
                  <Link href="/seller-info">Start Selling</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="container relative z-20 -mt-4 pb-8 lg:-mt-6">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {shoppingCards.map((card) => (
              <Card key={card.href} className="overflow-hidden rounded-md border-0 bg-card shadow-lg">
                <div className="p-4">
                  <h2 className="mb-3 text-xl font-bold">{card.title}</h2>
                  <Link href={card.href} className="group block">
                    <div className="relative mb-4 aspect-[4/3] overflow-hidden rounded-md bg-muted">
                      <Image
                        src={card.image}
                        alt={card.title}
                        fill
                        className="object-cover transition duration-300 group-hover:scale-105"
                      />
                    </div>
                  </Link>
                  <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                    {card.links.map((item) => (
                      <span key={item}>{item}</span>
                    ))}
                  </div>
                  <Link href={card.href} className="mt-4 inline-flex text-sm font-semibold text-primary hover:underline">
                    Shop now
                  </Link>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <ProductShelf
        title="Today's deals"
        eyebrow="Limited time"
        href="/deals"
        products={flashDeals}
        loading={loading}
      />

      <section className="bg-muted/40 py-10">
        <div className="container">
          <div className="grid gap-4 md:grid-cols-4">
            {serviceHighlights.map((item) => (
              <Card key={item.title} className="rounded-md p-5">
                <item.icon className="mb-4 h-8 w-8 text-accent" />
                <h3 className="font-semibold">{item.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{item.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <ProductShelf
        title="Best selling products"
        eyebrow="Hot picks"
        href="/best-sellers"
        products={bestSellers}
        loading={loading}
      />

      <section className="bg-background py-10">
        <div className="container">
          <div className="mb-6 flex items-center justify-between gap-4">
            <div>
              <Badge className="mb-2 bg-primary text-primary-foreground">
                <Store className="mr-1 h-3.5 w-3.5" />
                Verified stores
              </Badge>
              <h2 className="text-2xl font-bold md:text-3xl">Featured sellers</h2>
              <p className="mt-1 text-muted-foreground">Top vendors approved by the marketplace admin.</p>
            </div>
            <Button asChild variant="ghost" className="hidden sm:inline-flex">
              <Link href="/sellers">
                View sellers
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {featuredVendors.length > 0 ? (
              featuredVendors.map((vendor) => (
                <Card key={vendor.id} className="group overflow-hidden rounded-md transition hover:shadow-lg">
                  <div className="p-5">
                    <div className="relative mb-4 aspect-[4/3] overflow-hidden rounded-md bg-muted">
                      <Image
                        src={vendor.logo}
                        alt={vendor.name}
                        fill
                        className="object-cover transition duration-300 group-hover:scale-105"
                      />
                    </div>
                    <div className="mb-2 flex items-start justify-between gap-3">
                      <h3 className="text-lg font-semibold">{vendor.name}</h3>
                      {vendor.verified && <Award className="h-5 w-5 shrink-0 text-accent" />}
                    </div>
                    <div className="mb-4 flex items-center gap-3 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Star className="h-4 w-4 fill-warning text-warning" />
                        {vendor.rating}
                      </span>
                      <span className="h-1 w-1 rounded-full bg-muted-foreground/50" />
                      <span>{vendor.products} products</span>
                    </div>
                    <Button asChild variant="outline" size="sm" className="w-full">
                      <Link href={`/sellers/${vendor.id}`}>Visit Store</Link>
                    </Button>
                  </div>
                </Card>
              ))
            ) : (
              <Card className="rounded-md border-dashed p-8 text-center lg:col-span-4">
                <p className="font-medium">Verified sellers will appear here after approval.</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Admin approval controls which seller stores are featured publicly.
                </p>
              </Card>
            )}
          </div>
        </div>
      </section>

      <ProductShelf
        title="New arrivals"
        eyebrow="Fresh stock"
        href="/new-arrivals"
        products={newArrivals}
        loading={loading}
      />

      <section className="bg-[#131921] py-14 text-white">
        <div className="container">
          <div className="grid gap-10 md:grid-cols-[1.1fr_0.9fr] md:items-center">
            <div>
              <Badge className="mb-4 bg-accent text-accent-foreground">
                <Zap className="mr-1 h-3.5 w-3.5" />
                Seller growth
              </Badge>
              <h2 className="mb-5 text-3xl font-bold md:text-4xl">Build a real multivendor business on Mercato</h2>
              <p className="mb-7 max-w-2xl text-white/80">
                Sellers can apply, admins approve stores and products, and customers only see approved live listings.
              </p>
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-md bg-white/10 p-4">
                  <Users className="mb-3 h-6 w-6 text-accent" />
                  <h3 className="font-semibold">Customer reach</h3>
                  <p className="mt-1 text-sm text-white/70">Dedicated seller storefronts and product discovery.</p>
                </div>
                <div className="rounded-md bg-white/10 p-4">
                  <DollarSign className="mb-3 h-6 w-6 text-accent" />
                  <h3 className="font-semibold">Clear fees</h3>
                  <p className="mt-1 text-sm text-white/70">Transparent marketplace operations for cPanel hosting.</p>
                </div>
                <div className="rounded-md bg-white/10 p-4">
                  <ShieldCheck className="mb-3 h-6 w-6 text-accent" />
                  <h3 className="font-semibold">Admin control</h3>
                  <p className="mt-1 text-sm text-white/70">Approval gates for sellers, products and public content.</p>
                </div>
              </div>
              <div className="mt-7 flex flex-wrap gap-3">
                <Button asChild size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90">
                  <Link href="/seller/register">
                    Register as Seller
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="border-white/30 bg-transparent text-white hover:bg-white/10 hover:text-white"
                >
                  <Link href="/seller-info">Learn More</Link>
                </Button>
              </div>
            </div>

            <div className="relative hidden aspect-[4/3] overflow-hidden rounded-md md:block">
              <Image
                src="https://images.unsplash.com/photo-1556740758-90de374c12ad?w=900&h=700&fit=crop"
                alt="Seller managing marketplace dashboard"
                fill
                className="object-cover"
              />
            </div>
          </div>
        </div>
      </section>
    </CustomerLayout>
  );
}
