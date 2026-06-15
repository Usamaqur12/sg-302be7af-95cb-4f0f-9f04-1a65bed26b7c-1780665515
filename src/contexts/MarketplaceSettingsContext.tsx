"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  currencyOptions,
  defaultFooterSections,
  pakistanMajorCities,
  type FooterSectionConfig,
} from "@/lib/marketplace-config";

interface MarketplaceSettingsContextValue {
  siteName: string;
  currencyCode: string;
  currencySymbol: string;
  currencyRate: number;
  deliveryCity: string;
  setDeliveryCity: (city: string) => void;
  footerAboutText: string;
  footerSections: FooterSectionConfig[];
  formatPrice: (amount: number | null | undefined) => string;
}

const MarketplaceSettingsContext = createContext<MarketplaceSettingsContextValue | undefined>(undefined);

const SETTINGS_KEYS = [
  "site_name",
  "site_currency_code",
  "site_currency_symbol",
  "site_currency_rate",
  "default_delivery_city",
  "footer_about_text",
  "footer_links_json",
] as const;

function parseFooterSections(value: unknown): FooterSectionConfig[] {
  if (!value) return defaultFooterSections;

  try {
    const parsed = typeof value === "string" ? JSON.parse(value) : value;
    if (!Array.isArray(parsed)) return defaultFooterSections;

    const sections = parsed
      .map((section) => ({
        title: String(section?.title ?? "").trim(),
        links: Array.isArray(section?.links)
          ? section.links
              .map((link: { label?: unknown; href?: unknown }) => ({
                label: String(link?.label ?? "").trim(),
                href: String(link?.href ?? "#").trim() || "#",
              }))
              .filter((link: { label: string }) => link.label)
          : [],
      }))
      .filter((section) => section.title && section.links.length);

    return sections.length ? sections : defaultFooterSections;
  } catch {
    return defaultFooterSections;
  }
}

function cleanRate(value: unknown) {
  const numeric = Number(value);
  return Number.isFinite(numeric) && numeric > 0 ? numeric : 1;
}

const DEFAULT_SITE_NAME = "Mercato";
const DEFAULT_FOOTER_ABOUT =
  "Mercato connects customers with verified sellers, curated products, secure checkout and reliable support.";

export function MarketplaceSettingsProvider({ children }: { children: ReactNode }) {
  const [siteName, setSiteName] = useState(DEFAULT_SITE_NAME);
  const [currencyCode, setCurrencyCode] = useState("PKR");
  const [currencySymbol, setCurrencySymbol] = useState("Rs");
  const [currencyRate, setCurrencyRate] = useState(1);
  const [defaultCity, setDefaultCity] = useState("Karachi");
  const [deliveryCity, setDeliveryCityState] = useState("Karachi");
  const [footerAboutText, setFooterAboutText] = useState(DEFAULT_FOOTER_ABOUT);
  const [footerSections, setFooterSections] = useState<FooterSectionConfig[]>(defaultFooterSections);

  useEffect(() => {
    const storedCity = window.localStorage.getItem("mercato_delivery_city");
    if (storedCity && pakistanMajorCities.includes(storedCity)) {
      setDeliveryCityState(storedCity);
    }

    let active = true;
    const loadSettings = () => {
      supabase
        .from("system_settings")
        .select("key, value")
        .in("key", [...SETTINGS_KEYS])
        .then(({ data }) => {
          if (!active) return;
          const values = new Map((data ?? []).map((row) => [String(row.key), row.value]));
          const nextCode = String(values.get("site_currency_code") ?? "PKR").toUpperCase();
          const option = currencyOptions.find((item) => item.code === nextCode);
          const nextSymbol = String(values.get("site_currency_symbol") ?? option?.symbol ?? "Rs");
          const nextCity = String(values.get("default_delivery_city") ?? "Karachi");
          const nextSiteName = String(values.get("site_name") ?? DEFAULT_SITE_NAME).trim() || DEFAULT_SITE_NAME;

          setSiteName(nextSiteName);
          setCurrencyCode(option?.code ?? nextCode);
          setCurrencySymbol(nextSymbol);
          setCurrencyRate(cleanRate(values.get("site_currency_rate")));
          setDefaultCity(pakistanMajorCities.includes(nextCity) ? nextCity : "Karachi");
          setFooterAboutText(String(values.get("footer_about_text") ?? DEFAULT_FOOTER_ABOUT));
          setFooterSections(parseFooterSections(values.get("footer_links_json")));

          const stored = window.localStorage.getItem("mercato_delivery_city");
          if (!stored || !pakistanMajorCities.includes(stored)) {
            setDeliveryCityState(pakistanMajorCities.includes(nextCity) ? nextCity : "Karachi");
          }
        });
    };

    loadSettings();
    window.addEventListener("marketplace-settings-updated", loadSettings);

    return () => {
      active = false;
      window.removeEventListener("marketplace-settings-updated", loadSettings);
    };
  }, []);

  const setDeliveryCity = useCallback((city: string) => {
    const nextCity = pakistanMajorCities.includes(city) ? city : defaultCity;
    setDeliveryCityState(nextCity);
    window.localStorage.setItem("mercato_delivery_city", nextCity);
  }, [defaultCity]);

  const value = useMemo<MarketplaceSettingsContextValue>(() => ({
    siteName,
    currencyCode,
    currencySymbol,
    currencyRate,
    deliveryCity,
    setDeliveryCity,
    footerAboutText,
    footerSections,
    formatPrice(amount) {
      const converted = (Number(amount) || 0) * currencyRate;
      const rounded = converted.toLocaleString("en-US", {
        minimumFractionDigits: converted >= 1000 ? 0 : 2,
        maximumFractionDigits: converted >= 1000 ? 0 : 2,
      });
      return `${currencySymbol} ${rounded}`;
    },
  }), [currencyCode, currencyRate, currencySymbol, deliveryCity, footerAboutText, footerSections, setDeliveryCity, siteName]);

  return (
    <MarketplaceSettingsContext.Provider value={value}>
      {children}
    </MarketplaceSettingsContext.Provider>
  );
}

export function useMarketplaceSettings() {
  const context = useContext(MarketplaceSettingsContext);
  if (!context) {
    throw new Error("useMarketplaceSettings must be used within MarketplaceSettingsProvider");
  }
  return context;
}
