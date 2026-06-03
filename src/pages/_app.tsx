import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { ThemeProvider } from "@/contexts/ThemeProvider";
import { CartProvider } from "@/contexts/CartContext";
import { Toaster } from "@/components/ui/toaster";
import { useEffect } from "react";
import { useRouter } from "next/router";
import { initAnalytics, analytics } from "@/lib/analytics";

export default function App({ Component, pageProps }: AppProps) {
  const router = useRouter();

  useEffect(() => {
    // Initialize PostHog
    initAnalytics();
  }, []);

  useEffect(() => {
    // Track page views on route change
    const handleRouteChange = (url: string) => {
      analytics.pageView(url);
    };

    router.events.on("routeChangeComplete", handleRouteChange);

    // Track initial page view
    analytics.pageView(router.pathname);

    return () => {
      router.events.off("routeChangeComplete", handleRouteChange);
    };
  }, [router]);

  return (
    <ThemeProvider>
      <CartProvider>
        <Component {...pageProps} />
        <Toaster />
      </CartProvider>
    </ThemeProvider>
  );
}