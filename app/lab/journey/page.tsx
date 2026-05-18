"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import clsx from "clsx";
import { Dashboard } from "@/dashboard/Dashboard";
import { useProfiler } from "@/profiler/store";

/**
 * The "one evolving codebase" payoff route.
 *
 * Six instances of the SAME <Dashboard> rendered with progressively more of
 * the modules' fixes applied. The learner picks a level 0..5 with a slider;
 * the page renders that level + the level immediately before it so the
 * before/after delta is always on screen.
 *
 * This is the literal embodiment of the bottleneck-chain narrative.
 */

type Stage = {
  level: number;
  title: string;
  module: string;
  blurb: string;
  /** Props passed to Dashboard at this level. */
  patch: Parameters<typeof Dashboard>[0];
};

const STAGES: Stage[] = [
  {
    level: 0,
    title: "Baseline",
    module: "Day 1",
    blurb: "Index-as-key, heavy chart, no memo, no virtualisation. Naive React.",
    patch: { badKeys: true, rowFlash: true, chartHeavyMs: 0, tickMs: 800 },
  },
  {
    level: 1,
    title: "Stable keys, calm rows",
    module: "Module 1 — Reconciliation",
    patch: { badKeys: false, rowFlash: false, chartHeavyMs: 0, tickMs: 800 },
    blurb: "key=symbol, no flash. Per-row renders drop. Reconciliation no longer the bottleneck.",
  },
  {
    level: 2,
    title: "Concurrent + sliced",
    module: "Modules 4/5 — Concurrent + Time slicing",
    patch: { badKeys: false, rowFlash: false, chartHeavyMs: 4, tickMs: 1100 },
    blurb: "Slight CPU work is fine; transitions keep input responsive. The frame is mostly the chart's.",
  },
  {
    level: 3,
    title: "Islands — drop unused JS",
    module: "Module 9 — Islands",
    patch: {
      badKeys: false,
      rowFlash: false,
      chartHeavyMs: 0,
      tickMs: 1100,
      islands: true,
    },
    blurb: "Charts become static islands. No JS for them. Shipped bytes plummet.",
  },
  {
    level: 4,
    title: "Virtualised activity",
    module: "Module 10 — Virtualization",
    patch: {
      badKeys: false,
      rowFlash: false,
      chartHeavyMs: 0,
      tickMs: 1100,
      islands: true,
      activitySize: 200,
      virtualisedActivity: true,
    },
    blurb: "Same activity feed, 200 items. Only the visible window renders. Scroll FPS holds.",
  },
  {
    level: 5,
    title: "Compiled — the post-2025 baseline",
    module: "Module 11 — React Compiler",
    patch: {
      badKeys: false,
      rowFlash: false,
      chartHeavyMs: 0,
      tickMs: 1400,
      islands: true,
      activitySize: 200,
      virtualisedActivity: true,
    },
    blurb: "The Compiler memoises every render automatically. The tick rate eases because nothing needs to refresh more often than the data changes.",
  },
];

export default function JourneyPage() {
  const [level, setLevel] = useState(0);
  const reset = useProfiler((s) => s.reset);

  // Reset profiler counters whenever the level changes — so render counts reflect THIS stage only.
  useEffect(() => {
    reset();
  }, [level, reset]);

  const stage = STAGES[level];
  const prev = STAGES[Math.max(0, level - 1)];

  return (
    <article className="mx-auto w-full max-w-6xl px-4 pb-24 pt-6 sm:px-6 sm:pt-10">
      <header className="mb-8">
        <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-ink-dim sm:text-[11px]">
          <span>journey</span>
          <span>·</span>
          <span className="text-accent">one codebase, six fixes</span>
        </div>
        <h1 className="mt-2 text-2xl font-medium tracking-tight sm:text-3xl md:text-4xl">
          The same dashboard, evolving.
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-ink-muted sm:text-base">
          Every module&apos;s fix applied to the <em>same</em> Dashboard surface, in order. Slide
          to a level: you see that stage and the one right before it, so the delta is on screen at
          all times. The profiler dock at the bottom reads live from both panels.
        </p>
      </header>

      <div className="mb-6 rounded-lg border border-bg-border bg-bg-panel p-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="font-mono text-[10px] uppercase tracking-widest text-ink-dim">level</span>
            <input
              type="range"
              min={0}
              max={STAGES.length - 1}
              step={1}
              value={level}
              onChange={(e) => setLevel(+e.target.value)}
              className="w-48 accent-accent sm:w-72"
            />
            <span className="font-mono text-sm tabular-nums text-accent">
              {level} / {STAGES.length - 1}
            </span>
          </div>
          <div className="flex gap-2 text-xs">
            <button
              onClick={() => setLevel((l) => Math.max(0, l - 1))}
              disabled={level === 0}
              className="rounded-md border border-bg-border bg-bg-elevated px-3 py-1.5 font-mono active:scale-95 disabled:opacity-50"
            >
              ← prev fix
            </button>
            <button
              onClick={() => setLevel((l) => Math.min(STAGES.length - 1, l + 1))}
              disabled={level === STAGES.length - 1}
              className="rounded-md bg-accent px-3 py-1.5 font-mono text-white active:scale-95 disabled:opacity-50"
            >
              apply next fix →
            </button>
          </div>
        </div>
        <ol className="mt-3 flex flex-wrap gap-1">
          {STAGES.map((s) => (
            <li key={s.level}>
              <button
                onClick={() => setLevel(s.level)}
                className={clsx(
                  "rounded-md px-2 py-1 font-mono text-[10px] uppercase tracking-widest",
                  level === s.level
                    ? "bg-accent text-white"
                    : level > s.level
                    ? "border border-accent-good/40 bg-accent-good/10 text-accent-good"
                    : "border border-bg-border text-ink-muted"
                )}
              >
                {String(s.level).padStart(2, "0")} · {s.title}
              </button>
            </li>
          ))}
        </ol>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <StagePanel stage={prev} dimmed={prev.level === stage.level} />
        <StagePanel stage={stage} highlighted />
      </div>

      <div className="mt-6 rounded-lg border border-accent/30 bg-accent/5 p-4">
        <div className="mb-1 font-mono text-[10px] uppercase tracking-widest text-accent">
          stage {String(stage.level).padStart(2, "0")} · {stage.module}
        </div>
        <p className="text-sm text-ink">{stage.blurb}</p>
      </div>

      <nav className="mt-12 flex flex-wrap items-center justify-between gap-3 border-t border-bg-border pt-6 text-sm">
        <Link href="/lab/01-reconciliation" className="text-ink-muted hover:text-ink">
          ← back to Module 1
        </Link>
        <Link
          href="/lab/25-incident-simulator"
          className="rounded-lg border border-bg-border bg-bg-panel px-4 py-3 hover:border-accent/50 hover:bg-bg-elevated"
        >
          <span className="block font-mono text-[10px] uppercase tracking-widest text-accent/80">end of journey</span>
          <span className="block">Production incident simulator →</span>
        </Link>
      </nav>
    </article>
  );
}

function StagePanel({ stage, dimmed, highlighted }: { stage: Stage; dimmed?: boolean; highlighted?: boolean }) {
  return (
    <div
      className={clsx(
        "rounded-xl border bg-bg-panel transition",
        highlighted ? "border-accent/40" : "border-bg-border",
        dimmed && "opacity-60"
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-bg-border px-3 py-2">
        <div className="flex items-center gap-2">
          <span className="font-mono text-[10px] uppercase tracking-widest text-ink-dim">
            stage {String(stage.level).padStart(2, "0")}
          </span>
          <span className="font-mono text-xs text-ink">{stage.title}</span>
        </div>
        <span className="font-mono text-[10px] text-accent">{stage.module}</span>
      </div>
      <div className="p-3">
        <Dashboard {...stage.patch} />
      </div>
    </div>
  );
}
