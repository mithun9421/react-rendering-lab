"use client";

import { useProfiler } from "./store";
import { useFpsLoop } from "./useFpsLoop";
import { CommitTimeline } from "./CommitTimeline";
import clsx from "clsx";

export function ProfilerDock() {
  useFpsLoop();
  const fps = useProfiler((s) => s.fps);
  const dropped = useProfiler((s) => s.droppedFrames);
  const renders = useProfiler((s) => s.renders);
  const mem = useProfiler((s) => s.mem);
  const recording = useProfiler((s) => s.recording);
  const toggle = useProfiler((s) => s.toggleRecord);
  const reset = useProfiler((s) => s.reset);

  const totalRenders = Object.values(renders).reduce((a, b) => a + b, 0);
  const topOffenders = Object.entries(renders)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4);

  const fpsColor = fps >= 55 ? "text-accent-good" : fps >= 40 ? "text-accent-warn" : "text-accent-bad";

  return (
    <aside className="glass sticky bottom-0 left-0 right-0 z-30 mt-auto border-t border-bg-border">
      <div className="flex items-center gap-6 px-4 py-2 text-xs">
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

        <Stat label="FPS" value={fps} className={fpsColor} />
        <Stat label="Dropped" value={dropped} className={dropped > 0 ? "text-accent-warn" : "text-ink-muted"} />
        <Stat label="Renders" value={totalRenders} />
        <Stat label="Mem" value={mem ? `${mem}MB` : "—"} />

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
      <div className="border-t border-bg-border px-4 py-2">
        <CommitTimeline />
      </div>
    </aside>
  );
}

function Stat({ label, value, className }: { label: string; value: number | string; className?: string }) {
  return (
    <div className="flex items-baseline gap-1.5 font-mono">
      <span className="text-[10px] uppercase tracking-wider text-ink-dim">{label}</span>
      <span className={clsx("text-sm tabular-nums", className ?? "text-ink")}>{value}</span>
    </div>
  );
}
