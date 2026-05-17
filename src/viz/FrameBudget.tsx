"use client";

import { useEffect, useRef, useState } from "react";
import clsx from "clsx";

/**
 * A 16.67ms frame visualised as a horizontal bar.
 * Each work-unit fills a slice. If the cumulative width exceeds the bar, the frame is dropped.
 */
export function FrameBudget({
  chunks,
  budgetMs = 16.67,
}: {
  chunks: { label: string; ms: number; kind: "work" | "yield" }[];
  budgetMs?: number;
}) {
  const total = chunks.reduce((a, c) => a + c.ms, 0);
  const over = total > budgetMs;
  return (
    <div className="rounded-lg border border-bg-border bg-bg-panel p-3">
      <div className="mb-2 flex items-center justify-between text-xs">
        <span className="font-mono uppercase tracking-widest text-ink-dim">frame · {budgetMs}ms budget</span>
        <span className={clsx("font-mono", over ? "text-accent-bad" : "text-accent-good")}>
          {total.toFixed(1)}ms {over ? "· OVER" : "· ok"}
        </span>
      </div>
      <div className="relative h-7 w-full overflow-hidden rounded border border-bg-border bg-bg-subtle">
        <div className="absolute left-0 top-0 flex h-full">
          {chunks.map((c, i) => (
            <div
              key={i}
              title={`${c.label} · ${c.ms.toFixed(1)}ms`}
              style={{ width: `${(c.ms / budgetMs) * 100}%` }}
              className={clsx(
                "flex h-full items-center overflow-hidden border-r border-bg-subtle px-1 text-[9px] font-mono whitespace-nowrap",
                c.kind === "work" ? "bg-accent/40 text-white" : "bg-accent-good/30 text-accent-good"
              )}
            >
              {c.label}
            </div>
          ))}
        </div>
        <div
          className="pointer-events-none absolute top-0 h-full w-px bg-accent-bad/60"
          style={{ left: `100%` }}
          title="budget cutoff"
        />
      </div>
    </div>
  );
}

/** Interactive: drag the slider to set work-amount and see if chunked work beats the budget. */
export function TimeSlicingDemo() {
  const [work, setWork] = useState(40); // total ms of work
  const [chunk, setChunk] = useState(4); // ms per slice
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const raf = useRef<number>(0);

  const run = (yielding: boolean) => {
    setRunning(true);
    setProgress(0);
    let done = 0;
    const step = () => {
      const slice = yielding ? chunk : work;
      const end = performance.now() + slice;
      while (performance.now() < end) Math.sqrt(Math.random() * 1e6);
      done += slice;
      setProgress(Math.min(work, done));
      if (done < work) raf.current = requestAnimationFrame(step);
      else setRunning(false);
    };
    raf.current = requestAnimationFrame(step);
  };

  // shape the visualisation
  const chunksBlocking = [{ label: `work ${work}ms`, ms: work, kind: "work" as const }];
  const chunksSliced: { label: string; ms: number; kind: "work" | "yield" }[] = [];
  let remaining = work;
  while (remaining > 0) {
    const s = Math.min(chunk, remaining);
    chunksSliced.push({ label: `${s.toFixed(0)}`, ms: s, kind: "work" });
    chunksSliced.push({ label: "yield", ms: 1, kind: "yield" });
    remaining -= s;
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <label className="text-xs">
          <span className="block font-mono uppercase tracking-widest text-ink-dim">total work</span>
          <input
            type="range"
            min={5}
            max={80}
            value={work}
            onChange={(e) => setWork(+e.target.value)}
            className="w-full accent-accent"
          />
          <span className="font-mono">{work}ms</span>
        </label>
        <label className="text-xs">
          <span className="block font-mono uppercase tracking-widest text-ink-dim">chunk size</span>
          <input
            type="range"
            min={1}
            max={16}
            value={chunk}
            onChange={(e) => setChunk(+e.target.value)}
            className="w-full accent-accent"
          />
          <span className="font-mono">{chunk}ms / yield</span>
        </label>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <div>
          <p className="mb-1 font-mono text-[10px] uppercase tracking-widest text-ink-dim">blocking</p>
          <FrameBudget chunks={chunksBlocking} />
        </div>
        <div>
          <p className="mb-1 font-mono text-[10px] uppercase tracking-widest text-ink-dim">time-sliced</p>
          <FrameBudget chunks={chunksSliced} />
        </div>
      </div>

      <div className="flex items-center gap-2 text-xs">
        <button
          disabled={running}
          onClick={() => run(false)}
          className="rounded-md border border-bg-border bg-bg-elevated px-3 py-1.5 font-mono text-ink hover:bg-bg-panel disabled:opacity-50"
        >
          ▶ run blocking
        </button>
        <button
          disabled={running}
          onClick={() => run(true)}
          className="rounded-md bg-accent px-3 py-1.5 font-mono text-white disabled:opacity-50"
        >
          ▶ run sliced
        </button>
        <span className="font-mono text-ink-muted">progress: {progress.toFixed(0)} / {work}ms</span>
      </div>
    </div>
  );
}
