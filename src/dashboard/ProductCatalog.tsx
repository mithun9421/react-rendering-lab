"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRenderCount } from "@/profiler/useRenderCount";
import { makeProducts } from "./data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

/**
 * Grid of products. Demonstrates list pressure + virtualisation potential.
 * `virtualised` flag windows the grid (Module 10 fix).
 * `compiled` flag means we don't recompute filter on every render (Module 11 mental model).
 */
export function ProductCatalog({
  size = 60,
  virtualised = false,
  compiled = false,
}: {
  size?: number;
  virtualised?: boolean;
  compiled?: boolean;
}) {
  useRenderCount("ProductCatalog");
  const [q, setQ] = useState("");
  const [tick, setTick] = useState(0);

  // Force re-render every 1s so we can SEE if compile-equivalent memo is doing its job
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, []);

  const all = useMemo(() => makeProducts(size), [size]);

  // The "compiled" toggle simulates what React Compiler emits — memo by inputs.
  // Without it, every external `tick` rebuilds the filtered array.
  const products = useMemo(() => {
    if (!compiled) {
      // intentionally include `tick` so it re-runs every interval
      void tick;
    }
    if (!q) return all;
    const needle = q.toLowerCase();
    return all.filter((p) => p.name.toLowerCase().includes(needle));
  }, [all, q, tick, compiled]);

  return (
    <Card className="flex flex-col overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 border-b border-bg-border px-3 py-2">
        <CardTitle className="font-mono text-xs uppercase tracking-widest text-ink-dim">products</CardTitle>
        <Badge variant="outline" className="font-mono text-[10px] text-ink-dim">
          {products.length}
          {virtualised && " · virt"}
        </Badge>
      </CardHeader>
      <CardContent className="flex flex-col gap-0 p-0">
        <div className="border-b border-bg-border bg-bg-subtle px-3 py-2">
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="filter…"
            className="h-7 font-mono text-[11px]"
          />
        </div>
        {virtualised ? (
          <Windowed products={products} />
        ) : (
          <ul className="grid max-h-60 grid-cols-2 gap-1 overflow-y-auto p-2 sm:grid-cols-3">
            {products.map((p) => (
              <Cell key={p.id} p={p} />
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

function Cell({ p }: { p: { id: string; name: string; cat: string; price: number } }) {
  return (
    <li className="rounded-md border border-bg-border bg-bg-elevated p-2">
      <div className="font-mono text-[10px] uppercase tracking-widest text-ink-dim">{p.cat}</div>
      <div className="mt-0.5 truncate text-xs text-ink">{p.name}</div>
      <div className="mt-1 font-mono text-[11px] text-accent">${p.price}</div>
    </li>
  );
}

const ROW_H = 52;

function Windowed({ products }: { products: { id: string; name: string; cat: string; price: number }[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [vh, setVh] = useState(240);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    setVh(el.clientHeight);
    const on = () => setScrollTop(el.scrollTop);
    el.addEventListener("scroll", on, { passive: true });
    return () => el.removeEventListener("scroll", on);
  }, []);
  const start = Math.max(0, Math.floor(scrollTop / ROW_H) - 2);
  const end = Math.min(products.length, start + Math.ceil(vh / ROW_H) + 4);
  const visible = products.slice(start, end);
  return (
    <div ref={ref} className="max-h-60 overflow-y-auto">
      <div style={{ height: products.length * ROW_H, position: "relative" }}>
        <div style={{ transform: `translateY(${start * ROW_H}px)`, position: "absolute", inset: 0 }}>
          {visible.map((p) => (
            <div
              key={p.id}
              style={{ height: ROW_H }}
              className={cn("flex items-center justify-between border-b border-bg-border/40 px-3 text-xs")}
            >
              <span className="truncate text-ink">{p.name}</span>
              <span className="ml-2 font-mono text-[11px] text-accent">${p.price}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
