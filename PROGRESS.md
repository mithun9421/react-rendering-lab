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
- 2026-05-18 (cont.) — Mobile-first refactor: `shell/MobileNav.tsx` drawer, profiler dock split into compact mobile pill + full desktop dock, viz primitives reflow to single-column under `sm`. Viewport meta + touch-action manipulation. All 15 routes 200 with iPhone UA.
- 2026-05-18 (late) — **v0.4 — Modules 17-24 fleshed out**. All 25 module routes now ship real interactive content (no more ComingSoon placeholders):
  - Module 17 (Browser Pipeline): pipeline phases viz, CSS-property → phase table, layout thrashing demo with real timing, `transform` vs `top/left` animation comparison, composite-layer counter.
  - Module 18 (Network): request waterfall chart with sequential/parallel/dedup/slow-3G toggles, retry simulator with naive/backoff/circuit-breaker strategies.
  - Module 19 (Microfrontends): Module Federation dep graph with shared-singleton toggle, version-mismatch simulator (host=19, team-C=18 triggers runtime contract failure with shipped-bytes math).
  - Module 20 (Build): interactive bundle treemap with tree-shake / code-split / lib-swap / dead-code toggles, real KB math.
  - Module 21 (A11y): live focus-path tracker, DOM-vs-AOM side-by-side, modal focus-trap demo with proper restore.
  - Module 22 (Observability): live Web Vitals dashboard pulling LCP/CLS/FCP/TTFB/INP from real PerformanceObserver, distributed-trace flamegraph.
  - Module 23 (Memory): live heap chart from `performance.memory`, 4 leak triggers (interval / listener / closure / cache) with cleanup button, retention-path diagram.
  - Module 24 (Security): XSS playground rendering same input as JSX / sanitised / raw, CSP comparison (none / `default-src 'self'` / strict-dynamic + nonce), token-storage + SafeLink snippets.
  - Fixed: DOMParser SSR gate in Module 24, ts-expect-error in Module 23 leak gc(). All 25 routes 200 (iPhone UA), production build clean (201KB first-load on `/lab/[module]`).
- 2026-05-18 (eve) — **v0.3 Staff+ extension**: registry grew from 15 → 25 modules. New chain: 16 (state architecture) → 17 (pipeline) → 18 (network) → 19 (microfrontends) → 20 (build) → 21 (a11y) → 22 (observability) → 23 (memory) → 24 (security) → 25 (incident simulator). Deep impls: 16 (4 state strategies with live render counters) and 25 (6-incident catalogue + intake/diagnose/fix/validate/postmortem playbook with scoring). Modules 17-24 use ComingSoon fallback. New global primitives: `ArchitectGate` (gate fixes behind reflection prompts) + `ArchitectModeToggle` in the profiler dock. Module 4 got a real `SchedulerQueue` viz with 5 lanes + interrupt animation. Module 1 added ref-as-prop + `<Context value>` shorthand sub-steps. Module 2 added custom-elements callout. Module 7 added document-metadata + stylesheet-precedence + asset-preloading sub-steps. Module 8 added cache() demo + ErrorBoundary retry + React 19 error callbacks. All 25 routes green.
