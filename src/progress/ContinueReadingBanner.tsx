"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import clsx from "clsx";
import { useProgress } from "./store";
import { moduleBySlug } from "@/modules/registry";

/**
 * Sticky-top dismissable banner that resurfaces the most recently in-progress
 * lesson. Shown on landing + /lab hub.
 *
 * Visibility rules:
 *  - Only after hydration (avoid SSR/hydration mismatch flash).
 *  - Only if `lastReading` exists, the lesson isn't complete, and we have a
 *    real progress percentage to report.
 *  - Suppressed if `continueDismissed` is true OR the saved record is older
 *    than 30 days (likely stale).
 */
const STALE_MS = 30 * 24 * 60 * 60 * 1000;

export function ContinueReadingBanner({ variant = "inline" }: { variant?: "inline" | "sticky" }) {
  const hydrated = useProgress((s) => s.hydrated);
  const lastReading = useProgress((s) => s.lastReading);
  const completedLessons = useProgress((s) => s.completedLessons);
  const continueDismissed = useProgress((s) => s.continueDismissed);
  const dismiss = useProgress((s) => s.dismissContinue);
  const [closing, setClosing] = useState(false);

  const visible =
    hydrated &&
    !closing &&
    !continueDismissed &&
    lastReading &&
    !completedLessons[lastReading.slug] &&
    lastReading.scrollPct >= 0.05 &&
    Date.now() - lastReading.ts < STALE_MS;

  // ESC closes the sticky variant.
  useEffect(() => {
    if (!visible || variant !== "sticky") return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setClosing(true);
        setTimeout(dismiss, 200);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [visible, variant, dismiss]);

  return (
    <AnimatePresence>
      {visible && lastReading && (
        <motion.div
          initial={{ opacity: 0, y: variant === "sticky" ? -16 : 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: variant === "sticky" ? -16 : 4 }}
          transition={{ duration: 0.18 }}
          className={clsx(
            variant === "sticky"
              ? "sticky top-0 z-40 border-b border-accent/30 bg-bg-subtle/80 backdrop-blur"
              : "mb-4 rounded-xl border border-accent/40 bg-accent/[0.06]"
          )}
          role="dialog"
          aria-label="Continue reading"
        >
          <div
            className={clsx(
              "mx-auto flex max-w-6xl flex-wrap items-center gap-3 px-4 py-3 sm:px-6",
              variant === "inline" && "p-4"
            )}
          >
            <span className="font-mono text-[10px] uppercase tracking-widest text-accent">
              ⟲ pick up where you left off
            </span>
            <BannerBody slug={lastReading.slug} pct={lastReading.scrollPct} />
            <div className="ml-auto flex flex-wrap items-center gap-2">
              <Link
                href={`/lab/${lastReading.slug}`}
                className="rounded-md bg-accent px-3 py-1.5 text-xs font-medium text-white shadow-glass active:scale-95 hover:brightness-110"
              >
                Resume →
              </Link>
              <button
                type="button"
                onClick={() => {
                  setClosing(true);
                  setTimeout(dismiss, 200);
                }}
                className="rounded-md border border-bg-border bg-bg-elevated px-2.5 py-1.5 font-mono text-[11px] text-ink-muted hover:text-ink"
                aria-label="Dismiss continue reading"
              >
                dismiss
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function BannerBody({ slug, pct }: { slug: string; pct: number }) {
  const def = moduleBySlug(slug);
  const title = def?.title ?? slug;
  const percent = Math.round(pct * 100);
  return (
    <div className="min-w-0 flex-1">
      <div className="truncate text-sm font-medium text-ink">{title}</div>
      <div className="mt-0.5 flex items-center gap-2 font-mono text-[11px] text-ink-dim">
        <span>{percent}% in</span>
        <span className="h-1 w-24 overflow-hidden rounded-full bg-bg-elevated">
          <span
            className="block h-full bg-accent"
            style={{ width: `${percent}%` }}
          />
        </span>
      </div>
    </div>
  );
}
