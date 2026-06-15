"use client";

import { CustomerLayout } from "@/components/CustomerLayout";
import { PublicPageHeader, PublicPageSections } from "@/components/PublicPageContent";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { usePublicPage } from "@/hooks/usePublicPage";
import { FileText } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/router";

export default function CustomPublicPage() {
  const router = useRouter();
  const slug = typeof router.query.slug === "string" ? router.query.slug : undefined;
  const { page, loading } = usePublicPage(slug, null);

  if (loading) {
    return (
      <CustomerLayout>
        <div className="container py-16 text-center text-muted-foreground">Loading page...</div>
      </CustomerLayout>
    );
  }

  if (!page) {
    return (
      <CustomerLayout>
        <div className="container py-16">
          <Card className="mx-auto max-w-xl p-10 text-center">
            <FileText className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
            <h1 className="mb-2 text-2xl font-bold">Page not found</h1>
            <p className="mb-6 text-muted-foreground">This public page is not available.</p>
            <Button asChild>
              <Link href="/">Go Home</Link>
            </Button>
          </Card>
        </div>
      </CustomerLayout>
    );
  }

  return (
    <CustomerLayout>
      <div className="container py-12">
        <div className="mx-auto max-w-4xl">
          <PublicPageHeader page={page} />
          <PublicPageSections page={page} />
        </div>
      </div>
    </CustomerLayout>
  );
}
