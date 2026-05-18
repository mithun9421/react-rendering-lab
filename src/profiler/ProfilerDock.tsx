"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import clsx from "clsx";
import { useProfiler } from "./store";
import { useFpsLoop } from "./useFpsLoop";
import { CommitTimeline } from "./CommitTimeline";

export function ProfilerDock() {
  useFpsLoop();
  const fps = useProfiler((s) => s.fps);
  const dropped = useProfiler((s) => s.droppedFrames);
  const renders = useProfiler((s) => s.renders);
  const mem = useProfiler((s) => s.mem);
  const recording = useProfiler((s) => s.recording);
  const toggle = useProfiler((s) => s.toggleRecord);
  const reset = useProfiler((s) => s.reset);

  // Mobile: collapsed by default. On lg+ the desktop layout always shows the full dock.
  const [mobileOpen, setMobileOpen] = useState(false);

  const totalRenders = Object.values(renders).reduce((a, b) => a + b, 0);
  const topOffenders = Object.entries(renders)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4);
  const fpsColor = fps >= 55 ? "text-accent-good" : fps >= 40 ? "text-accent-warn" : "text-accent-bad";

  return (
    <aside className="glass sticky bottom-0 left-0 right-0 z-30 mt-auto border-t border-bg-border">
      {/* ─── Mobile compact pill (always interactive) ─── */}
      <div className="flex items-center gap-2 px-3 py-2 text-xs lg:hidden">
        <button
          onClick={() => setMobileOpen((v) => !v)}
          className="flex items-center gap-2 rounded-full border border-bg-border bg-bg-elevated px-3 py-1.5 active:scale-95"
          aria-expanded={mobileOpen}
          aria-controls="profiler-mobile-detail"
        >
          <span className={clsx("size-1.5 rounded-full", recording ? "bg-accent-bad animate-pulse_dot" : "bg-ink-dim")} />
          <span className={clsx("font-mono", fpsColor)}>{fps}</span>
          <span className="font-mono text-[10px] text-ink-dim">fps</span>
          <span className="font-mono text-[10px] text-ink-dim">·</span>
          <span className="font-mono text-ink-muted">{totalRenders}</span>
          <span className="font-mono text-[10px] text-ink-dim">renders</span>
          <span aria-hidden className="ml-1 text-ink-dim">{mobileOpen ? "▾" : "▴"}</span>
        </button>
        <span className="ml-auto font-mono text-[10px] text-ink-dim">profiler</span>
      </div>

      <AnimatePresence initial={false}>
        {mobileOpen && (
          <motion.div
            id="profiler-mobile-detail"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="overflow-hidden border-t border-bg-border lg:hidden"
          >
            <div className="space-y-3 px-3 py-3">
              <div className="grid grid-cols-2 gap-2 text-xs">
                <DockStat label="FPS" value={fps} className={fpsColor} />
                <DockStat label="Dropped" value={dropped} className={dropped > 0 ? "text-accent-warn" : "text-ink-muted"} />
                <DockStat label="Renders" value={totalRenders} />
                <DockStat label="Mem" value={mem ? `${mem}MB` : "—"} />
              </div>
              {topOffenders.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5 font-mono text-[10px]">
                  <span className="text-ink-dim">top:</span>
                  {topOffenders.map(([k, v]) => (
                    <span key={k} className="rounded bg-bg-elevated px-1.5 py-0.5 text-ink-muted">
                      {k} <span className="text-accent-warn">{v}</span>
                    </span>
                  ))}
                </div>
              )}
              <div className="flex items-center gap-2">
                <button
                  onClick={toggle}
                  className={clsx(
                    "flex items-center gap-1.5 rounded border border-bg-border px-2.5 py-1.5 text-xs font-mono",
                    recording ? "text-accent-bad" : "text-ink-muted"
                  )}
                >
                  <span className={clsx("size-1.5 rounded-full", recording ? "bg-accent-bad animate-pulse_dot" : "bg-ink-dim")} />
                  {recording ? "REC" : "PAUSED"}
                </button>
                <button
                  onClick={reset}
                  className="rounded border border-bg-border px-2.5 py-1.5 text-xs font-mono text-ink-muted"
                >
                  reset
                </button>
              </div>
              <CommitTimeline />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Desktop full dock (lg+) ─── */}
      <div className="hidden items-center gap-6 px-4 py-2 text-xs lg:flex">
        <div className="flex items-center gap-2">
          <button
            onClick={toggle}
            className={clsx(
              "flex items-center gap-1.5 rounded border border-bg-border px-2 py-1 font-mono",
              recording ? "text-accent-bad" : "text-ink-muted"
            )}
            title={recording ? "Recording — click to pause" : "Paused — click to record"}
          >
            <span className={clsx("size-1.5 rounded-full", recording ? "bg-accent-bad animate-pulse_dot" : "bg-ink-dim")} />
            {recording ? "REC" : "OFF"}
          </button>
          <button onClick={reset} className="rounded border border-bg-border px-2 py-1 font-mono text-ink-muted hover:text-ink">
            Reset
          </button>
        </div>

        <DockStat label="FPS" value={fps} className={fpsColor} />
        <DockStat label="Dropped" value={dropped} className={dropped > 0 ? "text-accent-warn" : "text-ink-muted"} />
        <DockStat label="Renders" value={totalRenders} />
        <DockStat label="Mem" value={mem ? `${mem}MB` : "—"} />

        <div className="ml-auto flex items-center gap-3">
          {topOffenders.length > 0 && (
            <div className="flex items-center gap-2 font-mono text-[11px] text-ink-muted">
              <span className="text-ink-dim">top:</span>
              {topOffenders.map(([k, v]) => (
                <span key={k} className="rounded bg-bg-elevated px-1.5 py-0.5">
                  {k} <span className="text-accent-warn">{v}</span>
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
      <div className="hidden border-t border-bg-border px-4 py-2 lg:block">
        <CommitTimeline />
      </div>
    </aside>
  );
}

function DockStat({ label, value, className }: { label: string; value: number | string; className?: string }) {
  return (
    <div className="flex items-baseline gap-1.5 font-mono">
      <span className="text-[10px] uppercase tracking-wider text-ink-dim">{label}</span>
      <span className={clsx("text-sm tabular-nums", className ?? "text-ink")}>{value}</span>
    </div>
  );
}
