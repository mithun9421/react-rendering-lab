# React Rendering Lab — Build Progress

> Source of truth for the build. Update on every major step so the next session can resume cold.

## Vision (1-liner)
A single intentionally-flawed React dashboard that the learner evolves step-by-step — at each step they SEE the broken behavior, profile it, apply a pattern, watch the metrics improve, and discover the new bottleneck the fix exposes.

## Phase status

| # | Phase | Status | Notes |
|---|---|---|---|
| 0 | Project bootstrap (Next.js 15, TS, Tailwind, deps, theme) | ☐ | |
| 1 | App shell — sidebar, module nav, profiler dock | ☐ | |
| 2 | Teaching engine — `<Lesson/>`, `<Step/>`, `<BeforeAfter/>`, `<TryIt/>` | ☐ | The reusable framework all modules consume |
| 3 | Profiler infrastructure — FPS, render counter, commit timeline, scheduler trace | ☐ | Custom; not React DevTools |
| 4 | Shared "Dashboard" surface — stock feed, activity, charts, chat, products (intentionally bad baseline) | ☐ | The ONE codebase everything evolves around |
| 5 | Module 1 — Reconciliation (keys, identity, remounts) | ☐ | Reference module — full template |
| 6 | Module 2 — Diffing algorithm | ☐ | |
| 7 | Module 3 — Fiber internals | ☐ | |
| 8 | Module 4 — Concurrent rendering | ☐ | |
| 9 | Module 5 — Time slicing | ☐ | |
| 10 | Module 6 — Hydration | ☐ | |
| 11 | Module 7 — Streaming SSR | ☐ | |
| 12 | Module 8 — Suspense architecture | ☐ | |
| 13 | Module 9 — Island architecture | ☐ | |
| 14 | Module 10 — Virtualization | ☐ | |

## Architectural decisions
- **Next.js 15 App Router** — required for streaming SSR / Suspense / hydration modules.
- **Custom profiler instead of React DevTools** — we need overlays the learner can't get from devtools (Fiber traversal animation, scheduler queue viz).
- **Single evolving codebase** — every module lives in `app/lab/*` and toggles the SAME dashboard surface via a `<PatchProvider>` that swaps implementations. This is what makes the "fix one thing, expose the next" feeling real.
- **Visualizations** — Framer Motion for transitions, ReactFlow for tree diagrams, custom canvas for timelines.
- **State** — Zustand for profiler/store, React Query for the simulated stock feed.

## File map (target)
```
app/
  layout.tsx                 # dark theme, fonts
  page.tsx                   # landing — "Start the Lab"
  lab/
    layout.tsx               # sidebar + profiler dock
    [module]/page.tsx        # dynamic module renderer
  api/feed/route.ts          # simulated stock feed (streaming)
src/
  engine/                    # teaching engine
    Lesson.tsx
    Step.tsx
    BeforeAfter.tsx
    TryIt.tsx
    MetricsPanel.tsx
    PatchProvider.tsx
  profiler/                  # custom profiler
    FpsMeter.tsx
    RenderCounter.tsx
    CommitTimeline.tsx
    SchedulerTrace.tsx
    useRenderCount.ts
    useCommitTimer.ts
  dashboard/                 # the evolving surface
    StockFeed.tsx
    ActivityFeed.tsx
    Chart.tsx
    Chat.tsx
    ProductCatalog.tsx
  viz/                       # reusable visual primitives
    FiberTree.tsx
    DiffTree.tsx
    FrameBudget.tsx
    HydrationOverlay.tsx
  modules/
    01-reconciliation/
    02-diffing/
    ...
  lib/
    rng.ts                   # deterministic random for reproducible "experiments"
    sim.ts                   # frame-budget / heavy-work simulator
```

## Open questions / TODO
- [ ] Decide: ship a real Service Worker for the streaming SSR module or simulate visually? (Lean: real, since Next supports it natively.)
- [ ] Should we record render traces and let learners "replay"? (Yes — design `TraceRecorder` in profiler.)

## Session log
- 2026-05-18 — Project scaffolded. PROGRESS.md created. Bootstrapped Next.js 15 + React 19, custom profiler dock, teaching engine, 10 modules wired (Module 1 deep, 2-10 narrative). Pushed to GitHub `mithun9421/react-rendering-lab`.
- 2026-05-18 (cont.) — Added Modules 11-15: React Compiler (auto memoization sim), Server Components (interactive `'use client'` toggler), Server Actions + useOptimistic/useActionState/useFormStatus (real wired action), `use()` hook (Suspense + conditional context + ErrorBoundary), Partial Prerendering (request-timeline animation). All 15 routes green. TODO.md updated with remaining polish items.
