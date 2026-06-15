"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  defaultPublicPages,
  findPublicPage,
  parsePublicPages,
  type PublicPageDefinition,
} from "@/lib/public-pages";

export function usePublicPages() {
  const [pages, setPages] = useState<PublicPageDefinition[]>(defaultPublicPages);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function loadPages() {
      const { data } = await supabase
        .from("system_settings")
        .select("key, value")
        .eq("key", "public_pages_json")
        .maybeSingle();
      if (!active) return;
      setPages(parsePublicPages(data?.value));
      setLoading(false);
    }

    loadPages().catch(() => {
      if (active) {
        setPages(defaultPublicPages);
        if (active) setLoading(false);
      }
    });

    return () => {
      active = false;
    };
  }, []);

  return { pages, loading };
}

export function usePublicPage(slug: string | undefined, fallback?: PublicPageDefinition | null) {
  const { pages, loading } = usePublicPages();

  const page = useMemo(() => {
    if (!slug) return fallback ?? null;
    return findPublicPage(pages, slug) ?? fallback ?? null;
  }, [fallback, pages, slug]);

  return { page, loading };
}
