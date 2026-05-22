"use client";

import { useEffect, useState } from "react";
import { TrendingUp, TrendingDown } from "lucide-react";
import { initialStocks, tickStocks, type Stock } from "./data";
import { useRenderCount } from "@/profiler/useRenderCount";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

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
    <Card className="overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 border-b border-bg-border px-3 py-2">
        <CardTitle className="font-mono text-xs uppercase tracking-widest text-ink-dim">
          stock feed
        </CardTitle>
        <Badge variant="outline" className="font-mono text-[10px] text-ink-dim">
          tick {tickMs}ms · key={badKeys ? "index" : "sym"}
        </Badge>
      </CardHeader>
      <CardContent className="p-0">
        <ul className="divide-y divide-bg-border">
          {stocks.map((s, i) => (
            <Row key={badKeys ? i : s.sym} stock={s} flash={rowFlash} />
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

function Row({ stock, flash }: { stock: Stock; flash: boolean }) {
  useRenderCount(`StockRow:${stock.sym}`);
  const up = stock.change >= 0;
  return (
    <li className={cn("flex items-center justify-between px-3 py-2 text-sm", flash && "flash-on-render")}>
      <div className="flex items-center gap-3">
        <span className="font-mono text-xs text-ink-dim">{stock.sym}</span>
        <span className="text-ink-muted">{stock.name}</span>
      </div>
      <div className="flex items-center gap-3 font-mono tabular-nums">
        <span>${stock.price.toFixed(2)}</span>
        <span className={cn("flex items-center gap-0.5 text-xs", up ? "text-accent-good" : "text-accent-bad")}>
          {up ? <TrendingUp className="size-3" aria-hidden /> : <TrendingDown className="size-3" aria-hidden />}
          {Math.abs(stock.change).toFixed(2)}
        </span>
      </div>
    </li>
  );
}
