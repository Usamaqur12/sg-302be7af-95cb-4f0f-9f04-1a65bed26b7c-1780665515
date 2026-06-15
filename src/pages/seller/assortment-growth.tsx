"use client";

import Link from "next/link";
import { useRouter } from "next/router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { BarChart3, Boxes, CheckCircle2, Filter, PackagePlus, RefreshCw, Upload } from "lucide-react";
import { RoleGuard } from "@/components/RoleGuard";
import { SellerLayout } from "@/components/SellerLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuthContext } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface ProductRow {
  id: string;
  title: string;
  stock_quantity: number | null;
  status: string | null;
}

const opportunityRows = [
  {
    id: "opp-1",
    type: "High Demand Low Supply",
    title: "Wireless hybrid earbuds with ANC and gaming mode",
    category: "Electronics > Audio > Headphones & Headsets",
    price: "Rs.4,995-6,795",
    sale: "0-250",
    benefit: "Up to 3X Exposure uplift",
  },
  {
    id: "opp-2",
    type: "Top Product",
    title: "Brightening face wash for all skin types",
    category: "Beauty & Personal Care > Skin Care",
    price: "Rs.1,750",
    sale: "250-500",
    benefit: "Effective New Boost",
  },
  {
    id: "opp-3",
    type: "Marketplace Trending",
    title: "Liquid silicone protective phone case",
    category: "Mobiles & Accessories > Phone Cases",
    price: "Rs.549-799",
    sale: "0-250",
    benefit: "Traffic boost for 60 days",
  },
  {
    id: "opp-4",
    type: "High Demand Low Supply",
    title: "Energy efficient inverter split AC",
    category: "Home Appliances > Cooling & Heating",
    price: "Rs.194,700",
    sale: "0-250",
    benefit: "Category demand gap",
  },
];

const viewNav = [
  { href: "/seller/assortment-growth", value: "growth-center", label: "Growth Center" },
  { href: "/seller/assortment-growth?view=opportunity-center", value: "opportunity-center", label: "Opportunity Center" },
  { href: "/seller/assortment-growth?view=uploaded-products", value: "uploaded-products", label: "Uploaded Products" },
  { href: "/seller/assortment-growth?view=high-demand-low-supply", value: "high-demand-low-supply", label: "High Demand Low Supply" },
  { href: "/seller/assortment-growth?view=top-product", value: "top-product", label: "Top Product" },
];

function normalizeView(value: unknown) {
  const view = String(value || "growth-center");
  if (["growth-center", "opportunity-center", "uploaded-products", "high-demand-low-supply", "top-product"].includes(view)) {
    return view;
  }
  return "growth-center";
}

export default function SellerAssortmentGrowthPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuthContext();
  const { toast } = useToast();
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [collectedIds, setCollectedIds] = useState<string[]>([]);
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const activeView = normalizeView(router.query.view);

  const loadData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data: seller } = await supabase.from("seller_profiles").select("id").eq("user_id", user.id).maybeSingle();
    if (!seller) {
      setProducts([]);
      setLoading(false);
      return;
    }
    const { data } = await supabase
      .from("products")
      .select("id, title, stock_quantity, status")
      .eq("seller_id", seller.id)
      .order("created_at", { ascending: false });
    setProducts((data ?? []) as ProductRow[]);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    if (!authLoading && user) loadData();
  }, [authLoading, loadData, user]);

  const filteredOpportunities = useMemo(() => {
    return opportunityRows.filter((item) => {
      const matchesSearch = item.title.toLowerCase().includes(query.toLowerCase()) || item.category.toLowerCase().includes(query.toLowerCase());
      const matchesType = typeFilter === "all" || item.type === typeFilter;
      const matchesView =
        activeView === "high-demand-low-supply" ? item.type === "High Demand Low Supply" :
        activeView === "top-product" ? item.type === "Top Product" :
        true;
      return matchesSearch && matchesType && matchesView;
    });
  }, [activeView, query, typeFilter]);

  const uploadOpportunity = async (title: string) => {
    await supabase.from("support_tickets").insert({
      subject: `assortment opportunity: ${title}`,
      description: `Seller wants to upload or source this opportunity: ${title}. Admin should review category, price band and listing readiness.`,
      category: "seller",
      priority: "medium",
    });
    toast({ title: "Opportunity submitted", description: "Admin can review it from support tickets." });
  };

  const collectedCount = collectedIds.length;
  const uploadedCount = products.filter((product) => product.title.toLowerCase().includes("opportunity")).length;

  return (
    <RoleGuard allowedRoles={["seller"]}>
      <SellerLayout>
        <div className="space-y-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <Badge className="mb-3 bg-accent text-accent-foreground">Assortment Growth</Badge>
              <h1 className="text-3xl font-bold">Assortment Growth Center</h1>
              <p className="mt-2 max-w-3xl text-muted-foreground">
                Find high-demand products, collect opportunities and upload listings with marketplace growth guidance.
              </p>
            </div>
            <Button asChild>
              <Link href="/seller/products/new">
                <PackagePlus className="mr-2 h-4 w-4" />
                Add Products
              </Link>
            </Button>
          </div>

          <div className="space-y-3">
            <p className="text-sm font-semibold">Available Options</p>
            <div className="grid gap-2 md:grid-cols-5">
              {viewNav.map((item) => (
                <Button key={item.value} variant={activeView === item.value ? "default" : "outline"} asChild className="justify-start">
                  <Link href={item.href}>{item.label}</Link>
                </Button>
              ))}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-4">
            <Card><CardContent className="p-5"><p className="text-sm text-muted-foreground">Uploaded Products</p><p className="mt-2 text-2xl font-bold">{products.length}</p></CardContent></Card>
            <Card><CardContent className="p-5"><p className="text-sm text-muted-foreground">Collected Opportunities</p><p className="mt-2 text-2xl font-bold">{collectedCount}</p></CardContent></Card>
            <Card><CardContent className="p-5"><p className="text-sm text-muted-foreground">Opportunity Uploads</p><p className="mt-2 text-2xl font-bold">{uploadedCount}</p></CardContent></Card>
            <Card><CardContent className="p-5"><p className="text-sm text-muted-foreground">Eligible Benefits</p><p className="mt-2 text-2xl font-bold">3X</p></CardContent></Card>
          </div>

          <Card>
            <CardContent className="grid gap-4 p-5 md:grid-cols-[1fr_220px_auto]">
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input className="pl-10" placeholder="Product/style keyword or category..." value={query} onChange={(event) => setQuery(event.target.value)} />
              </div>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All opportunity types</SelectItem>
                  <SelectItem value="High Demand Low Supply">High Demand Low Supply</SelectItem>
                  <SelectItem value="Top Product">Top Product</SelectItem>
                  <SelectItem value="Marketplace Trending">Marketplace Trending</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" onClick={() => { setQuery(""); setTypeFilter("all"); }}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Reset
              </Button>
            </CardContent>
          </Card>

          {loading ? (
            <p className="py-16 text-center text-muted-foreground">Loading assortment growth...</p>
          ) : activeView === "uploaded-products" ? (
            <Card>
              <CardHeader><CardTitle>Uploaded Products</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {products.length ? products.map((product) => (
                  <div key={product.id} className="flex flex-wrap items-center justify-between gap-3 rounded-md border p-4">
                    <div>
                      <p className="font-semibold">{product.title}</p>
                      <p className="text-sm text-muted-foreground">{product.stock_quantity ?? 0} stock</p>
                    </div>
                    <Badge variant="outline">{product.status || "pending"}</Badge>
                  </div>
                )) : <p className="py-8 text-center text-muted-foreground">No uploaded products yet.</p>}
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Boxes className="h-5 w-5 text-accent" />
                  Opportunity Center
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {filteredOpportunities.map((item) => {
                  const collected = collectedIds.includes(item.id);
                  return (
                    <div key={item.id} className="rounded-md border p-4">
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                        <div className="min-w-0 flex-1">
                          <Badge variant="outline">{item.type}</Badge>
                          <h2 className="mt-3 font-semibold">{item.title}</h2>
                          <p className="mt-1 text-sm text-muted-foreground">{item.category}</p>
                          <div className="mt-4 grid gap-3 text-sm md:grid-cols-3">
                            <div className="rounded-md bg-muted p-3"><p className="text-muted-foreground">Price</p><p className="font-medium">{item.price}</p></div>
                            <div className="rounded-md bg-muted p-3"><p className="text-muted-foreground">Sale</p><p className="font-medium">{item.sale}</p></div>
                            <div className="rounded-md bg-muted p-3"><p className="text-muted-foreground">Qualified Benefit</p><p className="font-medium">{item.benefit}</p></div>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <Button variant={collected ? "secondary" : "outline"} onClick={() => setCollectedIds((current) => current.includes(item.id) ? current : [...current, item.id])}>
                            <CheckCircle2 className="mr-2 h-4 w-4" />
                            {collected ? "Collected" : "Collect"}
                          </Button>
                          <Button onClick={() => uploadOpportunity(item.title)}>
                            <Upload className="mr-2 h-4 w-4" />
                            Upload
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><BarChart3 className="h-5 w-5 text-accent" /> Growth Checklist</CardTitle></CardHeader>
            <CardContent className="grid gap-3 md:grid-cols-3">
              {["Collect high demand opportunities", "Upload matching products", "Track admin approval and stock readiness"].map((item) => (
                <div key={item} className="rounded-md border p-4 text-sm font-medium">{item}</div>
              ))}
            </CardContent>
          </Card>
        </div>
      </SellerLayout>
    </RoleGuard>
  );
}
