"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import clsx from "clsx";

/**
 * Animated Fiber traversal — a linked-list walk that React performs during the render phase.
 * We visualise: parent → firstChild → sibling → return, with each "unit of work" being one node.
 *
 * Press play to step through. Long-press / hold to see the interruption (Module 4 builds on this).
 */
type Node = { id: string; label: string; kind?: "host" | "fn" | "memo"; child?: Node[] };

const TREE: Node = {
  id: "root",
  label: "App",
  kind: "fn",
  child: [
    {
      id: "header",
      label: "Header",
      kind: "fn",
      child: [
        { id: "logo", label: "Logo", kind: "host" },
        { id: "nav", label: "Nav", kind: "fn" },
      ],
    },
    {
      id: "main",
      label: "Main",
      kind: "fn",
      child: [
        {
          id: "feed",
          label: "StockFeed",
          kind: "memo",
          child: [
            { id: "r1", label: "Row(AAPL)", kind: "fn" },
            { id: "r2", label: "Row(MSFT)", kind: "fn" },
            { id: "r3", label: "Row(GOOG)", kind: "fn" },
          ],
        },
        { id: "chart", label: "Chart", kind: "memo" },
      ],
    },
    { id: "footer", label: "Footer", kind: "host" },
  ],
};

function flatten(n: Node, depth = 0, acc: Array<{ n: Node; depth: number }> = []) {
  acc.push({ n, depth });
  (n.child ?? []).forEach((c) => flatten(c, depth + 1, acc));
  return acc;
}

export function FiberTrace() {
  const nodes = flatten(TREE);
  const [cursor, setCursor] = useState(-1);
  const [playing, setPlaying] = useState(false);
  const raf = useRef<number>(0);
  const last = useRef<number>(0);

  useEffect(() => {
    if (!playing) return;
    const step = (t: number) => {
      if (t - last.current > 280) {
        setCursor((c) => {
          const next = c + 1;
          if (next >= nodes.length) {
            setPlaying(false);
            return c;
          }
          return next;
        });
        last.current = t;
      }
      raf.current = requestAnimationFrame(step);
    };
    raf.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf.current);
  }, [playing, nodes.length]);

  return (
    <div className="rounded-lg border border-bg-border bg-bg-panel">
      <header className="flex flex-col gap-2 border-b border-bg-border px-3 py-2 text-xs sm:flex-row sm:items-center sm:justify-between">
        <span className="font-mono uppercase tracking-widest text-ink-dim">fiber traversal · render phase</span>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => {
              setCursor(-1);
              setPlaying(true);
            }}
            className="rounded-md bg-accent px-2 py-1 font-mono text-[11px] text-white"
          >
            ▶ play
          </button>
          <button
            onClick={() => setPlaying(false)}
            className="rounded-md border border-bg-border px-2 py-1 font-mono text-[11px] text-ink-muted"
          >
            ❚❚ pause
          </button>
          <button
            onClick={() => setCursor(-1)}
            className="rounded-md border border-bg-border px-2 py-1 font-mono text-[11px] text-ink-muted"
          >
            ↺ reset
          </button>
        </div>
      </header>
      <ul className="space-y-1 p-3 font-mono text-xs">
        {nodes.map((row, i) => {
          const done = i < cursor;
          const active = i === cursor;
          return (
            <motion.li
              key={row.n.id}
              animate={{
                backgroundColor: active ? "rgba(124,92,255,0.20)" : done ? "rgba(61,220,151,0.06)" : "transparent",
              }}
              transition={{ duration: 0.18 }}
              className={clsx(
                "flex items-center gap-2 rounded px-2 py-1",
                done ? "text-ink-muted" : active ? "text-ink" : "text-ink-dim"
              )}
              style={{ paddingLeft: 8 + row.depth * 14 }}
            >
              <span
                className={clsx(
                  "size-1.5 rounded-full",
                  active ? "bg-accent animate-pulse_dot" : done ? "bg-accent-good" : "bg-bg-border"
                )}
              />
              <span>{row.n.label}</span>
              <span className="text-[10px] text-ink-dim">{row.n.kind}</span>
            </motion.li>
          );
        })}
      </ul>
      <footer className="border-t border-bg-border px-3 py-2 font-mono text-[10px] text-ink-dim">
        order: parent → firstChild → ... → sibling → return (linked-list walk, one work-unit per node)
      </footer>
    </div>
  );
}
