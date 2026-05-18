"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import clsx from "clsx";
import { useRenderCount } from "@/profiler/useRenderCount";
import { makeProducts } from "./data";

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
    <div className="flex flex-col overflow-hidden rounded-lg border border-bg-border bg-bg-panel">
      <header className="flex items-center justify-between border-b border-bg-border px-3 py-2 text-xs">
        <span className="font-mono uppercase tracking-widest text-ink-dim">products</span>
        <span className="font-mono text-ink-dim">
          {products.length}
          {virtualised && " · virt"}
        </span>
      </header>
      <div className="border-b border-bg-border bg-bg-subtle px-3 py-2">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="filter…"
          className="w-full rounded-md border border-bg-border bg-bg-elevated px-2 py-1 font-mono text-[11px] placeholder:text-ink-dim focus:outline-none focus:ring-2 focus:ring-accent/40"
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
    </div>
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
              className={clsx("flex items-center justify-between border-b border-bg-border/40 px-3 text-xs")}
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
