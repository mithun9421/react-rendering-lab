"use client";

import Link from "next/link";
import { useEntitlement } from "./store";

/**
 * <Premium fallback={...}>content</Premium>
 *
 * Renders children for Pro/Team users; renders fallback (or the default teaser)
 * for Free users. Used to gate Core modules M09-M25 + premium tooling.
 *
 * The default fallback is a soft paywall — shows the title and a "unlock" CTA,
 * NEVER a hard wall. Soft paywalls preserve SEO indexing and let the curious
 * sample the value.
 */
export function Premium({
  fallback,
  children,
  pitch,
}: {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  /** Short marketing line for the default teaser. */
  pitch?: string;
}) {
  const tier = useEntitlement((s) => s.tier);
  const hydrated = useEntitlement((s) => s.hydrated);

  // Before hydration, render the gated content optimistically. This avoids the
  // jolt of "content visible → vanished → CTA" on Pro users with localStorage
  // override. The server-rendered DOM matches the optimistic state.
  if (!hydrated) return <>{children}</>;
  if (tier === "pro" || tier === "team") return <>{children}</>;

  if (fallback) return <>{fallback}</>;
  return <PremiumTeaser pitch={pitch} />;
}

function PremiumTeaser({ pitch }: { pitch?: string }) {
  return (
    <div className="relative my-6 overflow-hidden rounded-xl border border-accent/30 bg-gradient-to-b from-accent/[0.06] to-transparent p-6">
      <div className="font-mono text-[10px] uppercase tracking-widest text-accent">
        ◆ pro · advanced content
      </div>
      <h3 className="mt-2 text-lg font-medium text-ink">
        {pitch ?? "This section is part of Pro"}
      </h3>
      <p className="mt-2 max-w-prose text-sm text-ink-muted">
        Foundations + the first eight Core modules stay free forever. Modules 09–25 (Islands
        through Incident Simulator), the full 200-question interview bank, unlimited streak
        freezes, and LinkedIn-shareable certificates are part of Pro.
      </p>
      <div className="mt-4 flex flex-wrap items-center gap-3 text-sm">
        <Link
          href="/pricing"
          className="rounded-md bg-accent px-4 py-2 font-medium text-white shadow-glass hover:brightness-110"
        >
          See Pro pricing →
        </Link>
        <span className="font-mono text-[11px] text-ink-dim">
          $39 lifetime · or $19/mo · no subscription required
        </span>
      </div>
    </div>
  );
}
