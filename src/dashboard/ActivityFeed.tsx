"use client";

import { useEffect, useState } from "react";
import { makeActivity, type Activity } from "./data";
import { useRenderCount } from "@/profiler/useRenderCount";

export function ActivityFeed({ size = 50 }: { size?: number }) {
  useRenderCount("ActivityFeed");
  const [items, setItems] = useState<Activity[]>(() => makeActivity(size));

  // Push a new item every ~2s.
  useEffect(() => {
    const i = setInterval(() => {
      setItems((prev) => [...makeActivity(1, Math.floor(Math.random() * 1e6)), ...prev].slice(0, size + 50));
    }, 2000);
    return () => clearInterval(i);
  }, [size]);

  return (
    <div className="overflow-hidden rounded-lg border border-bg-border bg-bg-panel">
      <header className="flex items-center justify-between border-b border-bg-border px-3 py-2 text-xs">
        <span className="font-mono uppercase tracking-widest text-ink-dim">activity</span>
        <span className="font-mono text-ink-dim">{items.length} items</span>
      </header>
      <ul className="max-h-72 divide-y divide-bg-border overflow-y-auto">
        {items.map((a) => (
          <li key={a.id} className="px-3 py-1.5 text-xs">
            <span className="font-mono text-accent">{a.user}</span>{" "}
            <span className="text-ink-muted">{a.action}</span>
            <span className="ml-2 font-mono text-ink-dim">{rel(a.t)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function rel(t: number) {
  const s = Math.max(0, Math.floor((Date.now() - t) / 1000));
  if (s < 60) return `${s}s`;
  if (s < 3600) return `${Math.floor(s / 60)}m`;
  return `${Math.floor(s / 3600)}h`;
}
