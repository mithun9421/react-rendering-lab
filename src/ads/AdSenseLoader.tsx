import Script from "next/script";

/**
 * Loads the AdSense client library once for the whole app.
 * Place in `app/layout.tsx`. Renders nothing if no publisher ID is configured.
 *
 * Uses Next's <Script strategy="afterInteractive"> so it doesn't block hydration —
 * critical given Module 6 spends a whole lesson on hydration cost.
 */
export function AdSenseLoader() {
  const client = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID;
  if (!client) return null;
  return (
    <Script
      id="adsense-loader"
      strategy="afterInteractive"
      crossOrigin="anonymous"
      src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${client}`}
    />
  );
}
