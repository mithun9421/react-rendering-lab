"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

/**
 * Top-of-page progress bar that fires the instant a user clicks a <Link/>.
 *
 * Why this is necessary: the lab's module routes are `dynamic = "force-dynamic"`
 * because two demos throw inside Suspense at prerender time. Dynamic routes have
 * no SSG cache, so the click-to-paint delay is real — usually 200-600ms on a
 * cold edge. Without feedback the UI feels frozen.
 *
 * Strategy:
 *   1. Capture clicks on any same-origin <a> in the document. Start the bar.
 *   2. Watch `usePathname()` — when it changes, finish the bar.
 *   3. Auto-cancel if 5s pass with no nav (the click was suppressed somewhere).
 *
 * We deliberately don't use a router event API — Next.js App Router doesn't
 * expose stable navigation events. The "click + pathname-watch" pair is the
 * official workaround the docs recommend.
 */
export function RouteProgress() {
  const pathname = usePathname();
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);

  // Animation interval (when in flight) + last-seen pathname to detect arrivals.
  const intervalRef = useRef<number | null>(null);
  const cancelRef = useRef<number | null>(null);
  const lastPath = useRef<string | null>(pathname);

  const start = () => {
    clearTimers();
    setVisible(true);
    setProgress(8);
    intervalRef.current = window.setInterval(() => {
      setProgress((p) => {
        // Ease toward 90% — we don't know the real progress, only that work is happening.
        if (p < 70) return p + 6;
        if (p < 90) return p + 1.2;
        return p;
      });
    }, 120);
    // If navigation never completes, retire the bar so it doesn't hang.
    cancelRef.current = window.setTimeout(() => finish(), 5000);
  };

  const finish = () => {
    clearTimers();
    setProgress(100);
    // Hide after the fill animation completes.
    window.setTimeout(() => {
      setVisible(false);
      setProgress(0);
    }, 220);
  };

  const clearTimers = () => {
    if (intervalRef.current != null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (cancelRef.current != null) {
      clearTimeout(cancelRef.current);
      cancelRef.current = null;
    }
  };

  // Detect arrivals by watching the pathname.
  useEffect(() => {
    if (lastPath.current !== pathname) {
      lastPath.current = pathname;
      if (visible) finish();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  // Listen for any same-origin <a> click — this captures all <Link/> navigations.
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      // Respect modifier keys (open in new tab / window) — don't show the bar in those cases.
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      if (e.button !== 0) return;
      const target = e.target as HTMLElement | null;
      if (!target) return;
      const a = target.closest("a");
      if (!a) return;
      // Skip external links, downloads, mailto:, javascript:, fragment-only nav.
      const href = a.getAttribute("href");
      if (!href) return;
      if (href.startsWith("http") && !href.includes(location.host)) return;
      if (
        href.startsWith("mailto:") ||
        href.startsWith("tel:") ||
        href.startsWith("javascript:") ||
        href.startsWith("#")
      )
        return;
      if (a.target === "_blank") return;
      if (a.hasAttribute("download")) return;
      // Same path? No navigation happens.
      if (href === pathname || href === location.pathname) return;
      start();
    };
    document.addEventListener("click", onClick, { capture: true });
    return () => document.removeEventListener("click", onClick, { capture: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, visible]);

  // Cleanup on unmount.
  useEffect(() => clearTimers, []);

  if (!visible) return null;
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-x-0 top-0 z-[100] h-0.5"
      style={{ contain: "layout style paint" }}
    >
      <div
        className="h-full bg-accent shadow-[0_0_12px_rgba(124,92,255,0.6)] transition-[width] duration-200 ease-out"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}
