"use client";

import { useRef, useState } from "react";
import { useProfiler } from "./store";

/**
 * Tiny save/load controls for the profiler. Exports the current store to JSON
 * (down to the last 240 commit events the store retains) and lets the user
 * load a prior trace back in for inspection.
 *
 * Trace shape — keep stable so old files keep working:
 *   {
 *     version: 1,
 *     savedAt: number (epoch ms),
 *     route: string,
 *     fps, droppedFrames, renders, commits, cpu, mem
 *   }
 */
type Trace = {
  version: 1;
  savedAt: number;
  route: string;
  fps: number;
  droppedFrames: number;
  renders: Record<string, number>;
  commits: ReturnType<typeof useProfiler.getState>["commits"];
};

export function TraceTools() {
  const fileRef = useRef<HTMLInputElement>(null);
  const [loaded, setLoaded] = useState<Trace | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const fps = useProfiler((s) => s.fps);
  const droppedFrames = useProfiler((s) => s.droppedFrames);
  const renders = useProfiler((s) => s.renders);
  const commits = useProfiler((s) => s.commits);

  const save = () => {
    const trace: Trace = {
      version: 1,
      savedAt: Date.now(),
      route: typeof window === "undefined" ? "" : window.location.pathname,
      fps,
      droppedFrames,
      renders,
      commits,
    };
    const blob = new Blob([JSON.stringify(trace, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `rrl-trace-${new Date().toISOString().replace(/[:.]/g, "-")}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const load = async (f: File) => {
    setErr(null);
    try {
      const text = await f.text();
      const parsed = JSON.parse(text) as Trace;
      if (parsed.version !== 1 || !Array.isArray(parsed.commits)) {
        throw new Error("not a recognised trace file");
      }
      setLoaded(parsed);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "could not parse file");
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        onClick={save}
        title="Download current profiler state as JSON"
        className="rounded border border-bg-border bg-bg-elevated px-2 py-1 font-mono text-[10px] text-ink-muted hover:text-ink"
      >
        ↓ trace
      </button>
      <input
        ref={fileRef}
        type="file"
        accept="application/json"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) load(f);
          e.target.value = "";
        }}
      />
      <button
        onClick={() => fileRef.current?.click()}
        title="Load a previously saved trace JSON to inspect"
        className="rounded border border-bg-border bg-bg-elevated px-2 py-1 font-mono text-[10px] text-ink-muted hover:text-ink"
      >
        ↑ load
      </button>
      {loaded && (
        <TraceSummary
          trace={loaded}
          onClose={() => setLoaded(null)}
        />
      )}
      {err && <span className="font-mono text-[10px] text-accent-bad">{err}</span>}
    </div>
  );
}

function TraceSummary({ trace, onClose }: { trace: Trace; onClose: () => void }) {
  const totalRenders = Object.values(trace.renders).reduce((a, b) => a + b, 0);
  const profiledCommits = trace.commits.filter((c) => c.actualDuration != null);
  const avgActual =
    profiledCommits.length === 0
      ? null
      : profiledCommits.reduce((a, c) => a + (c.actualDuration ?? 0), 0) / profiledCommits.length;
  const top = Object.entries(trace.renders)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);
  return (
    <div className="fixed inset-x-2 bottom-24 z-50 sm:inset-x-auto sm:right-4 sm:max-w-md">
      <div className="glass overflow-hidden rounded-lg border border-accent/40 shadow-glass">
        <header className="flex items-center justify-between border-b border-bg-border bg-bg-subtle px-3 py-2 text-xs">
          <span className="font-mono uppercase tracking-widest text-accent">loaded trace</span>
          <button onClick={onClose} className="font-mono text-ink-dim hover:text-ink">
            close ✕
          </button>
        </header>
        <dl className="grid grid-cols-2 gap-3 p-3 text-xs">
          <Item label="saved" value={new Date(trace.savedAt).toLocaleString()} />
          <Item label="route" value={trace.route || "—"} />
          <Item label="fps at save" value={trace.fps.toString()} />
          <Item label="dropped" value={trace.droppedFrames.toString()} />
          <Item label="total renders" value={totalRenders.toString()} />
          <Item label="commits captured" value={trace.commits.length.toString()} />
          {avgActual != null && <Item label="avg actual dur" value={`${avgActual.toFixed(2)}ms`} />}
          <Item label="top offender" value={top[0] ? `${top[0][0]} (${top[0][1]})` : "—"} />
        </dl>
        {top.length > 0 && (
          <div className="border-t border-bg-border px-3 py-2 font-mono text-[10px] text-ink-dim">
            top renderers: {top.map(([k, v]) => `${k}=${v}`).join(" · ")}
          </div>
        )}
      </div>
    </div>
  );
}

function Item({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="font-mono text-[10px] uppercase tracking-widest text-ink-dim">{label}</dt>
      <dd className="mt-0.5 truncate font-mono text-ink">{value}</dd>
    </div>
  );
}
