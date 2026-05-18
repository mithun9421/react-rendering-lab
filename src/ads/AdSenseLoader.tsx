import Script from "next/script";

/**
 * Loads the AdSense client library and the AdSense site-verification meta tag.
 *
 * Two env vars matter:
 *   NEXT_PUBLIC_ADSENSE_CLIENT_ID         — your "ca-pub-…" ID. Loads the script + sets the meta tag.
 *   NEXT_PUBLIC_ADSENSE_VERIFICATION_TAG  — Google's site-ownership meta value during AdSense application.
 *     (Often the same value as CLIENT_ID; AdSense's verification flow may also give a separate token.)
 *
 * Consent Mode v2 default-denied is installed by CookieConsent before this script
 * runs, so EEA visitors get non-personalized ads until they consent.
 */
export function AdSenseLoader() {
  const client = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID;
  const verification = process.env.NEXT_PUBLIC_ADSENSE_VERIFICATION_TAG ?? client;

  return (
    <>
      {/* Site verification meta tag — survives the AdSense application crawl. */}
      {verification && <meta name="google-adsense-account" content={verification} />}

      {/* Bootstrap Consent Mode v2 default-denied BEFORE the AdSense script. */}
      <Script id="consent-default-denied" strategy="beforeInteractive">
        {`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
window.gtag = gtag;
(function() {
  try {
    var raw = localStorage.getItem('rrl:consent');
    if (raw) { gtag('consent','default', JSON.parse(raw)); return; }
  } catch (e) {}
  gtag('consent','default', {
    ad_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied',
    analytics_storage: 'denied'
  });
})();`}
      </Script>

      {/* The AdSense client. Only loads when CLIENT_ID is configured. */}
      {client && (
        <Script
          id="adsense-loader"
          strategy="afterInteractive"
          crossOrigin="anonymous"
          src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${client}`}
        />
      )}
    </>
  );
}
