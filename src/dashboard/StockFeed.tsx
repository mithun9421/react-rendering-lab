"use client";

import { useEffect, useState } from "react";
import { initialStocks, tickStocks, type Stock } from "./data";
import { useRenderCount } from "@/profiler/useRenderCount";
import clsx from "clsx";

/**
 * Intentionally bad baseline:
 *   - The whole list lives in one component, so the entire list re-renders on every tick.
 *   - The `key` is array index (set via `index` when iterating without explicit key) — used in `bad` mode.
 *   - `tickMs` is configurable so we can show pressure.
 */
export function StockFeed({
  tickMs = 800,
  badKeys = true,
  rowFlash = true,
}: {
  tickMs?: number;
  badKeys?: boolean;
  rowFlash?: boolean;
}) {
  useRenderCount("StockFeed");
  const [stocks, setStocks] = useState<Stock[]>(() => initialStocks());

  useEffect(() => {
    const i = setInterval(() => setStocks((s) => tickStocks(s)), tickMs);
    return () => clearInterval(i);
  }, [tickMs]);

  return (
    <div className="overflow-hidden rounded-lg border border-bg-border bg-bg-panel">
      <header className="flex items-center justify-between border-b border-bg-border px-3 py-2 text-xs">
        <span className="font-mono uppercase tracking-widest text-ink-dim">stock feed</span>
        <span className="font-mono text-ink-dim">
          tick {tickMs}ms · key={badKeys ? "index" : "sym"}
        </span>
      </header>
      <ul className="divide-y divide-bg-border">
        {stocks.map((s, i) => (
          <Row key={badKeys ? i : s.sym} stock={s} flash={rowFlash} />
        ))}
      </ul>
    </div>
  );
}

function Row({ stock, flash }: { stock: Stock; flash: boolean }) {
  useRenderCount(`StockRow:${stock.sym}`);
  const up = stock.change >= 0;
  return (
    <li className={clsx("flex items-center justify-between px-3 py-2 text-sm", flash && "flash-on-render")}>
      <div className="flex items-center gap-3">
        <span className="font-mono text-xs text-ink-dim">{stock.sym}</span>
        <span className="text-ink-muted">{stock.name}</span>
      </div>
      <div className="flex items-center gap-3 font-mono tabular-nums">
        <span>${stock.price.toFixed(2)}</span>
        <span className={clsx("text-xs", up ? "text-accent-good" : "text-accent-bad")}>
          {up ? "▲" : "▼"} {Math.abs(stock.change).toFixed(2)}
        </span>
      </div>
    </li>
  );
}
