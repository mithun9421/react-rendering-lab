"use client";

import { useEffect, useRef } from "react";
import clsx from "clsx";

/**
 * Google AdSense ad slot.
 *
 * Renders nothing visible if:
 *  - `NEXT_PUBLIC_ADSENSE_CLIENT_ID` is unset (dev / preview deploys)
 *  - the user blocks `adsbygoogle.js` (`window.adsbygoogle` is undefined)
 *  - the slot is mounted server-side (effect handles the push call on the client)
 *
 * The container preserves vertical space gracefully via `data-ad-format="fluid"` /
 * `"in-article"` — Google picks a width for the content area; we let the height grow.
 *
 * The `<small>` label is required by the AdSense user-experience guidelines —
 * ads on the page must be visually distinct from organic content.
 */
type AdFormat = "fluid" | "in-article" | "auto" | "vertical" | "horizontal";

type AdSlotProps = {
  /** From the AdSense dashboard. Each format type should get its own slot ID. */
  slotId: string;
  format?: AdFormat;
  /** Optional layout key for fluid native ads — also from the dashboard. */
  layoutKey?: string;
  className?: string;
  /** A reserved minimum height so the layout doesn't shift when the ad lands. */
  minHeight?: number;
};

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

export function AdSlot({ slotId, format = "fluid", layoutKey, className, minHeight = 96 }: AdSlotProps) {
  const ref = useRef<HTMLModElement>(null);
  const pushed = useRef(false);
  const client = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID;

  useEffect(() => {
    if (!client) return;
    if (pushed.current) return;
    if (typeof window === "undefined") return;
    // The adsbygoogle queue is created by the loader script.
    // Even if the script is blocked, this push is safe — it just no-ops.
    try {
      window.adsbygoogle = window.adsbygoogle ?? [];
      window.adsbygoogle.push({});
      pushed.current = true;
    } catch {
      // Ad blockers / privacy extensions throw; we swallow it.
    }
  }, [client, slotId]);

  // No client ID → render nothing. Keeps dev preview clean.
  if (!client) return null;

  return (
    <div className={clsx("ad-slot relative w-full", className)} style={{ minHeight }} aria-hidden>
      <small
        className="absolute -top-4 right-0 font-mono text-[9px] uppercase tracking-widest text-ink-dim"
        // Required label per AdSense policy
      >
        ad
      </small>
      <ins
        ref={ref}
        className="adsbygoogle"
        style={{ display: "block", textAlign: "center" }}
        data-ad-client={client}
        data-ad-slot={slotId}
        data-ad-format={format}
        data-full-width-responsive={format === "fluid" || format === "auto" ? "true" : undefined}
        data-ad-layout-key={layoutKey}
      />
    </div>
  );
}
