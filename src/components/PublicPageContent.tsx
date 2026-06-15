import { Card } from "@/components/ui/card";
import type { PublicPageDefinition } from "@/lib/public-pages";

export function PublicPageHeader({ page }: { page: PublicPageDefinition }) {
  return (
    <div className="mb-8">
      <h1 className="mb-4 text-4xl font-bold">{page.title}</h1>
      {page.summary && (
        <p className="max-w-3xl text-lg text-muted-foreground">{page.summary}</p>
      )}
      {page.lastUpdated && (
        <p className="mt-4 text-sm text-muted-foreground">Last updated: {page.lastUpdated}</p>
      )}
    </div>
  );
}

export function PublicPageSections({ page }: { page: PublicPageDefinition }) {
  return (
    <Card className="space-y-6 p-8">
      {page.sections.map((section, index) => (
        <section key={`${section.heading}-${index}`}>
          <h2 className="mb-4 text-2xl font-bold">{section.heading}</h2>
          <p className="whitespace-pre-line leading-relaxed text-muted-foreground">
            {section.body || "Content will be updated soon."}
          </p>
        </section>
      ))}
    </Card>
  );
}
