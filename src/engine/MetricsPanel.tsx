"use client";

import { useProfiler } from "@/profiler/store";
import clsx from "clsx";

/** Pulls specific render counters out of the global profiler store and shows them as cards. */
export function MetricsPanel({
  watch,
  showFps = true,
}: {
  watch: string[];
  showFps?: boolean;
}) {
  const renders = useProfiler((s) => s.renders);
  const fps = useProfiler((s) => s.fps);
  const commits = useProfiler((s) => s.commits);

  const avgCommit =
    commits.length === 0
      ? 0
      : commits.slice(-30).reduce((a, c) => a + c.dur, 0) / Math.min(30, commits.length);

  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      {showFps && (
        <Card
          label="FPS"
          value={fps}
          tone={fps >= 55 ? "good" : fps >= 40 ? "warn" : "bad"}
          hint="Frames/sec, EMA-smoothed"
        />
      )}
      <Card
        label="avg commit"
        value={`${avgCommit.toFixed(1)}ms`}
        tone={avgCommit < 8 ? "good" : avgCommit < 16 ? "warn" : "bad"}
        hint="Mean over last 30 commits"
      />
      {watch.map((label) => (
        <Card
          key={label}
          label={label}
          value={renders[label] ?? 0}
          tone={(renders[label] ?? 0) > 100 ? "bad" : (renders[label] ?? 0) > 30 ? "warn" : "good"}
          hint="Render invocations"
        />
      ))}
    </div>
  );
}

function Card({
  label,
  value,
  tone,
  hint,
}: {
  label: string;
  value: number | string;
  tone: "good" | "warn" | "bad";
  hint?: string;
}) {
  return (
    <div className="rounded-lg border border-bg-border bg-bg-panel p-3">
      <div className="flex items-center justify-between">
        <span className="font-mono text-[10px] uppercase tracking-widest text-ink-dim">{label}</span>
        <span
          className={clsx(
            "size-1.5 rounded-full",
            tone === "good" && "bg-accent-good",
            tone === "warn" && "bg-accent-warn",
            tone === "bad" && "bg-accent-bad"
          )}
        />
      </div>
      <div
        className={clsx(
          "mt-2 font-mono text-2xl tabular-nums",
          tone === "good" && "text-ink",
          tone === "warn" && "text-accent-warn",
          tone === "bad" && "text-accent-bad"
        )}
      >
        {value}
      </div>
      {hint && <div className="mt-1 text-[10px] text-ink-dim">{hint}</div>}
    </div>
  );
}
