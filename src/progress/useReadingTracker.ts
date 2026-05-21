"use client";

import { useEffect, useRef } from "react";
import { useProgress } from "./store";

/**
 * Track scroll position inside a lesson + restore it on next visit.
 *
 * Mount once per lesson with `useReadingTracker(slug)`. Behaviour:
 *  - SAVE: throttled to once per 1.2 seconds while the user is scrolling. We
 *    save scroll-as-fraction-of-page so the resume position works even if the
 *    page grows or shrinks between visits.
 *  - RESTORE: on mount, after store hydrates, if `resumeAt[slug]` is between
 *    5% and 92%, scroll to that fraction. We give the page a beat to settle
 *    (rAF + 50ms) so any image / iframe lazy-loads don't fight the jump.
 *
 * Skips entirely if the lesson is already complete OR if the user is coming
 * back within 60 seconds (avoid the jolt on a quick back→forward).
 */
const SAVE_INTERVAL_MS = 1200;
const FRESH_RETURN_MS = 60_000;

export function useReadingTracker(slug: string) {
  const trackReading = useProgress((s) => s.trackReading);
  const hydrated = useProgress((s) => s.hydrated);
  const resumeAt = useProgress((s) => s.resumeAt);
  const completedLessons = useProgress((s) => s.completedLessons);
  const lastReading = useProgress((s) => s.lastReading);

  const lastSave = useRef(0);
  const restoredRef = useRef(false);

  // Restore on first paint after hydration.
  useEffect(() => {
    if (!hydrated || restoredRef.current) return;
    restoredRef.current = true;

    if (completedLessons[slug]) return; // already done; no resume
    const pct = resumeAt[slug];
    if (typeof pct !== "number" || pct < 0.05 || pct > 0.92) return;

    // Skip restore if the last save was very recent — looks like a same-session bounce.
    if (lastReading?.slug === slug && Date.now() - lastReading.ts < FRESH_RETURN_MS) {
      return;
    }

    // Defer a couple of frames so the article has its real scrollHeight.
    requestAnimationFrame(() => {
      setTimeout(() => {
        const target = Math.max(
          0,
          Math.floor(document.documentElement.scrollHeight * pct) - 80 // -80px to land slightly above
        );
        window.scrollTo({ top: target, behavior: "auto" });
      }, 60);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, slug]);

  // Save on scroll (throttled).
  useEffect(() => {
    if (!hydrated) return;
    if (completedLessons[slug]) return;

    const onScroll = () => {
      const now = Date.now();
      if (now - lastSave.current < SAVE_INTERVAL_MS) return;
      lastSave.current = now;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      if (max <= 0) return;
      const pct = Math.min(1, Math.max(0, window.scrollY / max));
      trackReading(slug, pct);
    };

    // Save once on mount so the lastReading record updates even if the user
    // doesn't scroll (e.g. they just opened the lesson and went away).
    requestAnimationFrame(() => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      if (max > 0) {
        const pct = Math.min(1, Math.max(0, window.scrollY / max));
        if (pct >= 0.05) trackReading(slug, pct);
      }
    });

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, slug]);
}
