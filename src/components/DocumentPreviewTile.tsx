import Image from "next/image";
import { ExternalLink, FileCheck2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function isPreviewableImage(url: string) {
  const cleanUrl = url.split("?")[0].toLowerCase();
  return cleanUrl.startsWith("data:image/") || /\.(png|jpe?g|webp|gif|avif|bmp)$/.test(cleanUrl);
}

export function DocumentPreviewTile({
  url,
  label,
  detail = "Open document",
  className,
}: {
  url: string;
  label: string;
  detail?: string;
  className?: string;
}) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      className={cn("group overflow-hidden rounded-md border bg-background transition hover:border-primary", className)}
    >
      <div className="relative flex aspect-[5/3] items-center justify-center bg-muted">
        {isPreviewableImage(url) ? (
          <Image src={url} alt={label} fill className="object-cover" unoptimized />
        ) : (
          <FileCheck2 className="h-10 w-10 text-muted-foreground" />
        )}
      </div>
      <div className="flex items-center justify-between gap-3 p-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium group-hover:text-primary">{label}</p>
          <p className="mt-1 truncate text-xs text-muted-foreground">{detail}</p>
        </div>
        <ExternalLink className="h-4 w-4 shrink-0 text-muted-foreground" />
      </div>
    </a>
  );
}
