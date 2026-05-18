"use client";

import { useEffect, useState } from "react";
import clsx from "clsx";
import { useRenderCount } from "@/profiler/useRenderCount";

type Rec = { id: string; title: string; score: number };

const TITLES = [
  "Switch Chart to memo",
  "Move StockFeed under <Suspense>",
  "Virtualise the activity list",
  "Defer search filter via useDeferredValue",
  "Hoist formatter out of render",
  "Add a circuit breaker to /api/feed",
  "Split provider for theme vs cart",
];

/**
 * Async "recommendations" panel — Suspense-style late arrival.
 * `streamed` flag shows the chunked-arrival pattern (Module 7).
 */
export function Recommendations({ streamed = false }: { streamed?: boolean }) {
  useRenderCount("Recommendations");
  const [recs, setRecs] = useState<Rec[]>([]);

  useEffect(() => {
    setRecs([]);
    if (streamed) {
      // Arrive in 3 chunks
      [0, 500, 1000].forEach((delay, idx) => {
        setTimeout(() => {
          setRecs((prev) => [
            ...prev,
            ...buildBatch(idx * 2, 2),
          ]);
        }, delay);
      });
    } else {
      // Single late drop after 1300ms
      setTimeout(() => setRecs(buildBatch(0, 6)), 1300);
    }
  }, [streamed]);

  return (
    <div className="overflow-hidden rounded-lg border border-bg-border bg-bg-panel">
      <header className="flex items-center justify-between border-b border-bg-border px-3 py-2 text-xs">
        <span className="font-mono uppercase tracking-widest text-ink-dim">recommendations</span>
        <span className="font-mono text-ink-dim">{streamed ? "streamed" : "all-or-nothing"}</span>
      </header>
      <ul className="max-h-56 divide-y divide-bg-border overflow-y-auto">
        {recs.length === 0 &&
          Array.from({ length: 4 }).map((_, i) => (
            <li key={i} className="flex items-center justify-between px-3 py-2 text-xs">
              <span className="h-3 w-2/3 animate-pulse rounded bg-bg-border" />
              <span className="h-3 w-8 animate-pulse rounded bg-bg-border" />
            </li>
          ))}
        {recs.map((r) => (
          <li key={r.id} className="flex items-center justify-between px-3 py-2 text-xs">
            <span className="truncate text-ink">{r.title}</span>
            <span
              className={clsx(
                "rounded px-1.5 py-0.5 font-mono text-[10px]",
                r.score > 80 ? "bg-accent-good/15 text-accent-good" : r.score > 50 ? "bg-accent-warn/15 text-accent-warn" : "bg-bg-elevated text-ink-muted"
              )}
            >
              {r.score}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function buildBatch(start: number, n: number): Rec[] {
  return Array.from({ length: n }, (_, i) => {
    const idx = (start + i) % TITLES.length;
    return { id: `r-${start + i}`, title: TITLES[idx], score: 30 + ((idx * 17) % 70) };
  });
}
