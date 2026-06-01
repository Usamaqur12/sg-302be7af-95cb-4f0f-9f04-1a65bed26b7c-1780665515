import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { ThemeProvider } from "@/contexts/ThemeProvider";
import { CartProvider } from "@/contexts/CartContext";
import { Toaster } from "@/components/ui/toaster";

export default function App({ Component, pageProps }: AppProps) {
  return (
    <ThemeProvider>
      <CartProvider>
        <Component {...pageProps} />
        <Toaster />
      </CartProvider>
    </ThemeProvider>
  );
}