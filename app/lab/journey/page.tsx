"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import clsx from "clsx";
import { Dashboard, type DashboardProps } from "@/dashboard/Dashboard";
import { useProfiler } from "@/profiler/store";

type Stage = {
  level: number;
  title: string;
  module: string;
  modules: string[]; // multi-module reference for cross-linking
  blurb: string;
  /** Bullet points pinned on the right rail. */
  fixes: string[];
  patch: DashboardProps;
};

const STAGES: Stage[] = [
  {
    level: 0,
    title: "Day 1 — naive React",
    module: "Baseline",
    modules: [],
    blurb:
      "Index-as-key, fresh object props every render, heavy synchronous chart, no virtualisation. It works on your laptop and dies on a mid-tier phone.",
    fixes: ["index as key", "rowFlash on", "no useMemo anywhere", "200ms artificial chart work"],
    patch: { compose: "core", badKeys: true, rowFlash: true, chartHeavyMs: 8, tickMs: 800 },
  },
  {
    level: 1,
    title: "Reconciliation — stable keys",
    module: "Module 1 — Reconciliation",
    modules: ["01-reconciliation"],
    blurb:
      "Switch to key=sym, stop flashing every row, give object props stable identity. Per-row render counts drop to near zero on uneventful ticks.",
    fixes: ["key=sym", "no row flash", "stable refs for shared config"],
    patch: { compose: "core", badKeys: false, rowFlash: false, chartHeavyMs: 8, tickMs: 800 },
  },
  {
    level: 2,
    title: "Diffing aware — same-type stable",
    module: "Module 2 — Diffing",
    modules: ["02-diffing"],
    blurb:
      "Same wrapper element type every render, so the diff reuses the entire subtree. No type-change tear-downs.",
    fixes: ["wrapper type stable", "no <section> → <div> switches"],
    patch: { compose: "core", badKeys: false, rowFlash: false, chartHeavyMs: 8, tickMs: 800 },
  },
  {
    level: 3,
    title: "Concurrent + transitions",
    module: "Modules 3-4 — Fiber + Concurrent",
    modules: ["03-fiber", "04-concurrent"],
    blurb:
      "Add a search panel. Filter inputs run on the TransitionLane so typing stays at 60fps even with a real haystack.",
    fixes: ["useTransition for filter", "useDeferredValue on list", "lane-aware updates"],
    patch: {
      compose: "wider",
      badKeys: false,
      rowFlash: false,
      chartHeavyMs: 8,
      tickMs: 1000,
      searchDeferred: true,
      searchTransition: true,
    },
  },
  {
    level: 4,
    title: "Time slicing — small chunks",
    module: "Module 5 — Time slicing",
    modules: ["05-time-slicing"],
    blurb:
      "Heavy chart work split across frames; the search box's keystrokes hit input on time even if a chart re-renders mid-stroke.",
    fixes: ["chart memo with shallow deps", "chart work ≤ 4ms per slice"],
    patch: {
      compose: "wider",
      badKeys: false,
      rowFlash: false,
      chartHeavyMs: 4,
      tickMs: 1000,
      searchDeferred: true,
      searchTransition: true,
    },
  },
  {
    level: 5,
    title: "Streaming SSR + suspense",
    module: "Modules 6-8 — Hydration / Streaming / Suspense",
    modules: ["06-hydration", "07-streaming-ssr", "08-suspense"],
    blurb:
      "Recommendations now arrive in streamed chunks; the surface paints before the recs land. Chat appears via a Suspense boundary. Selective hydration keeps the page interactive throughout.",
    fixes: ["recs streamed in 3 chunks", "chat under suspense", "selective hydration order"],
    patch: {
      compose: "full",
      badKeys: false,
      rowFlash: false,
      chartHeavyMs: 4,
      tickMs: 1100,
      searchDeferred: true,
      searchTransition: true,
      streamedRecs: true,
    },
  },
  {
    level: 6,
    title: "Islands — drop the chart's JS",
    module: "Module 9 — Islands",
    modules: ["09-islands"],
    blurb:
      "Charts become static islands. The dashboard ships ~60% less JS. The interactive panels (stocks, search, chat, settings) stay interactive.",
    fixes: ["chart shells = SSR-only", "interactive islands only ship the JS they need"],
    patch: {
      compose: "full",
      badKeys: false,
      rowFlash: false,
      chartHeavyMs: 0,
      tickMs: 1100,
      islands: true,
      searchDeferred: true,
      searchTransition: true,
      streamedRecs: true,
    },
  },
  {
    level: 7,
    title: "Virtualised — only the visible rows",
    module: "Module 10 — Virtualization",
    modules: ["10-virtualization"],
    blurb:
      "Activity feed (now 200 items) and product grid (50+) window to only the visible rows. Scroll FPS holds.",
    fixes: ["activity feed windowed", "products grid windowed", "fixed and dynamic heights"],
    patch: {
      compose: "full",
      badKeys: false,
      rowFlash: false,
      chartHeavyMs: 0,
      tickMs: 1100,
      islands: true,
      searchDeferred: true,
      searchTransition: true,
      streamedRecs: true,
      activitySize: 200,
      virtualisedActivity: true,
      virtualisedProducts: true,
    },
  },
  {
    level: 8,
    title: "Compiled — auto memo everywhere",
    module: "Module 11 — React Compiler",
    modules: ["11-react-compiler"],
    blurb:
      "React Compiler memoises every render automatically. Useless re-renders disappear without a single useMemo / useCallback / React.memo call from you.",
    fixes: [
      "no manual useMemo/useCallback",
      "ProductCatalog filter cached by compiler",
      "1.4s tick — nothing wants to update faster than data changes",
    ],
    patch: {
      compose: "full",
      badKeys: false,
      rowFlash: false,
      chartHeavyMs: 0,
      tickMs: 1400,
      islands: true,
      searchDeferred: true,
      searchTransition: true,
      streamedRecs: true,
      activitySize: 200,
      virtualisedActivity: true,
      virtualisedProducts: true,
      compiled: true,
    },
  },
  {
    level: 9,
    title: "Server components + actions",
    module: "Modules 12-13 — RSC + Server Actions",
    modules: ["12-server-components", "13-server-actions"],
    blurb:
      "Chat and settings now POST via Server Actions; optimistic UI gives instant feedback while the server confirms. The chart and product list are RSC — zero JS for them on the wire.",
    fixes: [
      "chat send = useOptimistic + server action",
      "settings save = optimistic + server confirm",
      "static chart + product cells stay RSC",
    ],
    patch: {
      compose: "full",
      badKeys: false,
      rowFlash: false,
      chartHeavyMs: 0,
      tickMs: 1400,
      islands: true,
      searchDeferred: true,
      searchTransition: true,
      streamedRecs: true,
      activitySize: 200,
      virtualisedActivity: true,
      virtualisedProducts: true,
      compiled: true,
      optimisticChat: true,
      optimisticSave: true,
    },
  },
  {
    level: 10,
    title: "Partial prerender — the post-2026 baseline",
    module: "Module 15 — Partial Prerendering",
    modules: ["14-use-hook", "15-partial-prerendering"],
    blurb:
      "Static shell + dynamic Suspense holes. Edge serves the cached shell in ~30ms; the dynamic panels stream from origin in parallel. This is what shipping looks like today.",
    fixes: [
      "static shell at the edge",
      "dynamic boundaries stream into placeholders",
      "TTFB ~30ms, LCP anchored to shell paint",
    ],
    patch: {
      compose: "full",
      badKeys: false,
      rowFlash: false,
      chartHeavyMs: 0,
      tickMs: 1400,
      islands: true,
      searchDeferred: true,
      searchTransition: true,
      streamedRecs: true,
      activitySize: 200,
      virtualisedActivity: true,
      virtualisedProducts: true,
      compiled: true,
      optimisticChat: true,
      optimisticSave: true,
    },
  },
];

export default function JourneyPage() {
  const [level, setLevel] = useState(0);
  const reset = useProfiler((s) => s.reset);

  useEffect(() => {
    reset();
  }, [level, reset]);

  const stage = STAGES[level];
  const prev = STAGES[Math.max(0, level - 1)];

  return (
    <article className="mx-auto w-full max-w-6xl px-4 pb-24 pt-6 sm:px-6 sm:pt-10">
      <Header level={level} />

      <Controls level={level} setLevel={setLevel} />

      <div className="grid gap-4 lg:grid-cols-2">
        <StagePanel stage={prev} dimmed={prev.level === stage.level} />
        <StagePanel stage={stage} highlighted />
      </div>

      <StageNotes stage={stage} />

      <Footer level={level} />
    </article>
  );
}

function Header({ level }: { level: number }) {
  return (
    <header className="mb-6">
      <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-ink-dim sm:text-[11px]">
        <span>journey</span>
        <span>·</span>
        <span className="text-accent">one codebase, eleven fixes</span>
      </div>
      <h1 className="mt-2 text-2xl font-medium tracking-tight sm:text-3xl md:text-4xl">
        The same dashboard, evolving.
      </h1>
      <p className="mt-3 max-w-3xl text-sm leading-relaxed text-ink-muted sm:text-base">
        Every module&apos;s fix applied to the <em>same</em> Dashboard surface, in order. The
        surface grows: stocks → search → notifications → chat → products → settings →
        recommendations. The profiler dock at the bottom of the page reads live from both
        panels — flip stages and watch render counters reset and recover.
      </p>
      <p className="mt-2 max-w-3xl text-sm leading-relaxed text-ink-dim">
        <span className="font-mono text-[10px] uppercase tracking-widest text-accent">tip:</span>{" "}
        the dock&apos;s Architect Mode (the &quot;arch&quot; pill) turns this into a reflection
        exercise — predict what each fix will do <em>before</em> sliding to it.
      </p>
      <p className="mt-1 font-mono text-[11px] text-ink-dim">
        current stage: <span className="text-accent">{String(level).padStart(2, "0")}</span> /{" "}
        {STAGES.length - 1}
      </p>
    </header>
  );
}

function Controls({ level, setLevel }: { level: number; setLevel: (n: number) => void }) {
  return (
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
            onClick={() => setLevel(Math.max(0, level - 1))}
            disabled={level === 0}
            className="rounded-md border border-bg-border bg-bg-elevated px-3 py-1.5 font-mono active:scale-95 disabled:opacity-50"
          >
            ← prev fix
          </button>
          <button
            onClick={() => setLevel(Math.min(STAGES.length - 1, level + 1))}
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

function StageNotes({ stage }: { stage: Stage }) {
  return (
    <div className="mt-6 grid gap-4 lg:grid-cols-3">
      <div className="rounded-lg border border-accent/30 bg-accent/5 p-4 lg:col-span-2">
        <div className="mb-1 font-mono text-[10px] uppercase tracking-widest text-accent">
          stage {String(stage.level).padStart(2, "0")} · {stage.module}
        </div>
        <p className="text-sm text-ink">{stage.blurb}</p>
        {stage.modules.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {stage.modules.map((slug) => (
              <Link
                key={slug}
                href={`/lab/${slug}`}
                className="rounded-md border border-bg-border bg-bg-elevated px-2 py-1 font-mono text-[10px] uppercase tracking-widest text-ink-muted hover:text-ink"
              >
                deep dive · {slug}
              </Link>
            ))}
          </div>
        )}
      </div>
      <div className="rounded-lg border border-bg-border bg-bg-panel p-4">
        <p className="mb-2 font-mono text-[10px] uppercase tracking-widest text-ink-dim">applied fixes</p>
        <ul className="space-y-1 text-xs">
          {stage.fixes.map((f, i) => (
            <li key={i} className="flex items-start gap-2 text-ink-muted">
              <span className="mt-0.5 text-accent-good">✓</span>
              <span>{f}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function Footer({ level }: { level: number }) {
  const completed = level === STAGES.length - 1;
  return (
    <nav className="mt-12 flex flex-wrap items-center justify-between gap-3 border-t border-bg-border pt-6 text-sm">
      <Link href="/lab/01-reconciliation" className="text-ink-muted hover:text-ink">
        ← back to Module 1
      </Link>
      <Link
        href="/lab/25-incident-simulator"
        className={clsx(
          "rounded-lg border px-4 py-3",
          completed
            ? "border-accent-good/40 bg-accent-good/5 text-accent-good"
            : "border-bg-border bg-bg-panel hover:border-accent/50 hover:bg-bg-elevated"
        )}
      >
        <span className="block font-mono text-[10px] uppercase tracking-widest">
          {completed ? "you finished the journey" : "end of journey"}
        </span>
        <span className="block">Take it to the incident simulator →</span>
      </Link>
    </nav>
  );
}
