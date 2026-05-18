"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import clsx from "clsx";

type Phase = "request" | "edge-cache-hit" | "shell-streamed" | "dynamic-arrived" | "done";

const STORY: { phase: Phase; t: number; label: string }[] = [
  { phase: "request", t: 0, label: "GET /dashboard" },
  { phase: "edge-cache-hit", t: 30, label: "edge cache → prerendered shell · 30ms TTFB" },
  { phase: "shell-streamed", t: 60, label: "shell painted (nav, hero, layout, fallbacks)" },
  { phase: "dynamic-arrived", t: 540, label: "dynamic Suspense holes resolved · streamed" },
  { phase: "done", t: 600, label: "fully interactive" },
];

export function PprDiagram() {
  const [t, setT] = useState(0);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    if (!running) return;
    const start = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const el = now - start;
      setT(el);
      if (el < 700) raf = requestAnimationFrame(tick);
      else setRunning(false);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [running]);

  const replay = () => {
    setT(0);
    setRunning(true);
  };

  return (
    <div className="rounded-lg border border-bg-border bg-bg-panel">
      <header className="flex items-center justify-between border-b border-bg-border px-3 py-2 text-xs">
        <span className="font-mono uppercase tracking-widest text-ink-dim">PPR · request timeline</span>
        <div className="flex items-center gap-2">
          <span className="font-mono text-ink-dim">t = {Math.round(t)}ms</span>
          <button
            disabled={running}
            onClick={replay}
            className="rounded-md border border-bg-border bg-bg-elevated px-2 py-1 font-mono text-[11px] disabled:opacity-50"
          >
            ▶ replay
          </button>
        </div>
      </header>

      <div className="grid grid-cols-2 gap-px bg-bg-border">
        <div className="bg-bg-panel p-3">
          <p className="mb-2 font-mono text-[10px] uppercase tracking-widest text-ink-dim">events</p>
          <ul className="space-y-1 font-mono text-[11px]">
            {STORY.map((s) => {
              const done = t >= s.t;
              return (
                <motion.li
                  key={s.phase}
                  animate={{ opacity: done ? 1 : 0.35 }}
                  className={clsx(
                    "flex items-center gap-2 rounded px-2 py-1",
                    done ? "bg-accent/10 text-ink" : "text-ink-dim"
                  )}
                >
                  <span className={clsx("size-1.5 rounded-full", done ? "bg-accent" : "bg-bg-border")} />
                  <span className="w-12 text-ink-dim">{s.t}ms</span>
                  <span>{s.label}</span>
                </motion.li>
              );
            })}
          </ul>
        </div>

        <div className="bg-bg-panel p-3">
          <p className="mb-2 font-mono text-[10px] uppercase tracking-widest text-ink-dim">page</p>
          <div className="space-y-2 rounded-md border border-bg-border bg-bg-elevated p-3">
            <Region label="<Nav> (static · prerendered)" ok={t >= 60} />
            <Region label="<Hero> (static · prerendered)" ok={t >= 60} />
            <Region
              label="<UserGreeting/> — dynamic"
              ok={t >= 540}
              fallback={t >= 60 && t < 540}
            />
            <Region
              label="<StockFeed/> — dynamic"
              ok={t >= 540}
              fallback={t >= 60 && t < 540}
            />
            <Region label="<Footer> (static)" ok={t >= 60} />
          </div>
        </div>
      </div>
      <footer className="border-t border-bg-border px-3 py-2 font-mono text-[10px] text-ink-dim">
        cyan = static prerender from CDN · purple = dynamic stream from origin · grey =
        fallback placeholder
      </footer>
    </div>
  );
}

function Region({ label, ok, fallback }: { label: string; ok: boolean; fallback?: boolean }) {
  return (
    <div
      className={clsx(
        "rounded border px-2 py-2 font-mono text-[11px] transition",
        ok
          ? "border-accent/40 bg-accent/10 text-ink"
          : fallback
          ? "border-accent-warn/30 bg-accent-warn/5 text-accent-warn animate-pulse"
          : "border-bg-border bg-bg-panel text-ink-dim"
      )}
    >
      <div className="flex items-center justify-between">
        <span>{label}</span>
        <span className="text-[10px] opacity-70">
          {ok ? "rendered" : fallback ? "fallback" : "—"}
        </span>
      </div>
    </div>
  );
}
