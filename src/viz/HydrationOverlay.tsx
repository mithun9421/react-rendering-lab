"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import clsx from "clsx";

type Island = { id: string; label: string; ms: number; priority: number };

const PAGE: Island[] = [
  { id: "shell", label: "Shell + Nav", ms: 30, priority: 1 },
  { id: "hero", label: "Hero (static)", ms: 0, priority: 1 },
  { id: "search", label: "Search box", ms: 60, priority: 1 },
  { id: "feed", label: "Stock feed", ms: 240, priority: 2 },
  { id: "chart", label: "Chart", ms: 380, priority: 2 },
  { id: "comments", label: "Comments", ms: 180, priority: 3 },
  { id: "footer", label: "Footer", ms: 20, priority: 4 },
];

type Mode = "full" | "progressive" | "selective" | "islands";

export function HydrationOverlay() {
  const [mode, setMode] = useState<Mode>("full");
  const [tick, setTick] = useState(0);
  const [hydrated, setHydrated] = useState<Set<string>>(new Set());
  const [running, setRunning] = useState(false);

  // Run on press; show order based on mode.
  const run = () => {
    setHydrated(new Set());
    setRunning(true);
    const order =
      mode === "full"
        ? PAGE.slice()
        : mode === "progressive"
        ? PAGE.slice().sort((a, b) => a.priority - b.priority)
        : mode === "selective"
        ? // selective only hydrates interactive bits (priority 1-2)
          PAGE.filter((p) => p.priority <= 2)
        : // islands: only the truly interactive islands
          PAGE.filter((p) => ["search", "feed"].includes(p.id));

    let elapsed = 0;
    order.forEach((p) => {
      setTimeout(() => {
        setHydrated((s) => new Set([...s, p.id]));
        setTick((t) => t + 1);
      }, elapsed + 100);
      // in `full` and `progressive`, hydration is sequential; in `selective`/`islands`, in parallel
      if (mode === "full" || mode === "progressive") elapsed += p.ms;
    });

    const totalMs =
      mode === "full" || mode === "progressive"
        ? order.reduce((a, p) => a + p.ms, 0)
        : Math.max(...order.map((p) => p.ms));
    setTimeout(() => setRunning(false), totalMs + 200);
  };

  useEffect(() => {
    setHydrated(new Set());
  }, [mode]);

  return (
    <div className="rounded-lg border border-bg-border bg-bg-panel">
      <header className="flex flex-wrap items-center justify-between gap-2 border-b border-bg-border px-3 py-2 text-xs">
        <span className="font-mono uppercase tracking-widest text-ink-dim">hydration mode</span>
        <div className="flex flex-wrap gap-1">
          {(["full", "progressive", "selective", "islands"] as Mode[]).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={clsx(
                "rounded-md px-2 py-1 font-mono text-[11px]",
                mode === m ? "bg-accent text-white" : "border border-bg-border text-ink-muted hover:text-ink"
              )}
            >
              {m}
            </button>
          ))}
          <button
            disabled={running}
            onClick={run}
            className="ml-1 rounded-md border border-bg-border bg-bg-elevated px-2 py-1 font-mono text-[11px] disabled:opacity-50"
          >
            ▶ replay
          </button>
        </div>
      </header>
      <div className="grid grid-cols-2 gap-3 p-3 md:grid-cols-4">
        {PAGE.map((p) => {
          const isHydrated = hydrated.has(p.id);
          const wouldHydrate =
            mode === "full" ||
            (mode === "progressive" && true) ||
            (mode === "selective" && p.priority <= 2) ||
            (mode === "islands" && ["search", "feed"].includes(p.id));
          return (
            <motion.div
              key={p.id + tick}
              initial={false}
              animate={{
                borderColor: isHydrated ? "rgba(61,220,151,0.6)" : "rgba(255,255,255,0.06)",
                backgroundColor: isHydrated ? "rgba(61,220,151,0.10)" : "rgba(21,21,26,1)",
              }}
              className={clsx(
                "rounded-md border p-3",
                !wouldHydrate && "opacity-50"
              )}
            >
              <div className="font-mono text-xs">{p.label}</div>
              <div className="mt-1 font-mono text-[10px] text-ink-dim">
                {wouldHydrate ? `${p.ms}ms` : "(not hydrated)"}
                {isHydrated && <span className="ml-2 text-accent-good">✓ interactive</span>}
              </div>
            </motion.div>
          );
        })}
      </div>
      <footer className="border-t border-bg-border px-3 py-2 font-mono text-[10px] text-ink-dim">
        full = blocking serial · progressive = priority-ordered · selective = only interactive ·
        islands = only interactive + parallel
      </footer>
    </div>
  );
}
