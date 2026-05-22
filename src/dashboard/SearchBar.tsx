"use client";

import { useDeferredValue, useEffect, useMemo, useState, useTransition } from "react";
import { useRenderCount } from "@/profiler/useRenderCount";
import { busy } from "@/lib/sim";
import { initialStocks } from "./data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

/**
 * Search across stocks + activities. Demonstrates the transition story end-to-end.
 *
 * Props let each module's fix patch in:
 *   - deferred: uses useDeferredValue for the filter (Module 4 fix)
 *   - transition: wraps the result update in startTransition (Module 4 fix)
 *   - heavyMs:    fake work per render (Module 5 — see what time slicing fixes)
 *   - compact:    smaller surface for use inside Journey grid
 */
export function SearchBar({
  deferred = false,
  transition = false,
  heavyMs = 0,
  compact = false,
}: {
  deferred?: boolean;
  transition?: boolean;
  heavyMs?: number;
  compact?: boolean;
}) {
  useRenderCount("SearchBar");
  const [q, setQ] = useState("");
  const [filterQ, setFilterQ] = useState("");
  const [isPending, startTransition] = useTransition();
  const deferredQ = useDeferredValue(filterQ);
  const used = deferred ? deferredQ : filterQ;

  // Build a 600-row haystack from the stocks data so the filter has real weight.
  const haystack = useMemo(() => {
    const stocks = initialStocks();
    const out: { id: string; label: string }[] = [];
    for (let i = 0; i < 600; i++) {
      const s = stocks[i % stocks.length];
      out.push({ id: `${i}-${s.sym}`, label: `${s.sym} · ${s.name} · ${(s.price + (i % 30)).toFixed(2)}` });
    }
    return out;
  }, []);

  const results = useMemo(() => {
    if (heavyMs > 0) busy(heavyMs);
    const needle = used.toLowerCase();
    return haystack.filter((r) => r.label.toLowerCase().includes(needle)).slice(0, compact ? 6 : 14);
  }, [haystack, used, heavyMs, compact]);

  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 border-b border-bg-border px-3 py-2">
        <CardTitle className="font-mono text-xs uppercase tracking-widest text-ink-dim">search</CardTitle>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="font-mono text-[10px] text-ink-dim">
            {results.length} / {haystack.length}
          </Badge>
          {isPending && (
            <Badge variant="warn" className="font-mono text-[10px]">
              pending
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-2 p-3">
        <Input
          value={q}
          onChange={(e) => {
            const v = e.target.value;
            setQ(v);
            if (transition) startTransition(() => setFilterQ(v));
            else setFilterQ(v);
          }}
          placeholder="filter ticker…"
          className="font-mono"
        />
        <ul
          className={cn(
            "divide-y divide-bg-border rounded-md border border-bg-border bg-bg-elevated",
            compact ? "max-h-40" : "max-h-56",
            "overflow-y-auto"
          )}
        >
          {results.length === 0 ? (
            <li className="px-3 py-2 font-mono text-[11px] text-ink-dim">no matches</li>
          ) : (
            results.map((r) => (
              <li key={r.id} className="px-3 py-1.5 font-mono text-[11px] text-ink-muted">
                {r.label}
              </li>
            ))
          )}
        </ul>
      </CardContent>
    </Card>
  );
}
