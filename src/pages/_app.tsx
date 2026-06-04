import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/contexts/ThemeProvider";
import { AuthProvider } from "@/contexts/AuthContext";
import { CartProvider } from "@/contexts/CartContext";
import { SEO } from "@/components/SEO";

export default function App({ Component, pageProps }: AppProps) {
  return (
    <AuthProvider>
      <ThemeProvider>
        <CartProvider>
          <SEO />
          <Component {...pageProps} />
          <Toaster />
        </CartProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}