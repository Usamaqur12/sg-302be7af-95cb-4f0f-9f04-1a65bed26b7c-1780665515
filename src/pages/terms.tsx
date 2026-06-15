"use client";

import { CustomerLayout } from "@/components/CustomerLayout";
import { PublicPageHeader, PublicPageSections } from "@/components/PublicPageContent";
import { usePublicPage } from "@/hooks/usePublicPage";
import { getDefaultPublicPage } from "@/lib/public-pages";

const fallback = getDefaultPublicPage("terms");

export default function TermsPage() {
  const { page } = usePublicPage("terms", fallback);

  return (
    <CustomerLayout>
      <div className="container py-12">
        <div className="mx-auto max-w-4xl">
          <PublicPageHeader page={page || fallback} />
          <PublicPageSections page={page || fallback} />
        </div>
      </div>
    </CustomerLayout>
  );
}
