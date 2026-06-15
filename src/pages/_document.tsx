import { cn } from "@/lib/utils";
import { Html, Head, Main, NextScript } from "next/document";
import { SEOElements } from "@/components/SEO";

export default function Document() {
  const enableSoftgenScripts =
    process.env.NEXT_PUBLIC_ENABLE_SOFTGEN_SCRIPTS === "true";

  return (
    <Html lang="en">
      <Head>
        <SEOElements />
        {enableSoftgenScripts && (
          <script
            src="https://cdn.softgen.ai/script.js"
            async
            data-softgen-monitoring="true"
          />
        )}
      </Head>
      <body
        className={cn(
          "min-h-screen w-full scroll-smooth bg-background text-foreground antialiased"
        )}
        style={{ display: "block" }}
      >
        <Main />
        <NextScript />

        {/* Visual Editor Script */}
        {process.env.NODE_ENV === "development" && enableSoftgenScripts && (
          <script
            src="https://cdn.softgen.dev/visual-editor.min.js"
            async
            data-softgen-visual-editor="true"
          />
        )}
      </body>
    </Html>
  );
}
