# React Rendering Lab — Build Progress

> Source of truth for the build. Update on every major step so the next session can resume cold.

## Vision (1-liner)
A single intentionally-flawed React dashboard that the learner evolves step-by-step — at each step they SEE the broken behavior, profile it, apply a pattern, watch the metrics improve, and discover the new bottleneck the fix exposes.

## Phase status (current: v0.4 — 2026-05-24)

All 36 modules implemented (11 foundations + 25 advanced). Quiz bank at 200+ questions across all modules. Profiler scoped to lesson routes.

| # | Phase | Status | Notes |
|---|---|---|---|
| 0 | Project bootstrap (Next.js 15, TS, Tailwind, deps, theme) | ✅ | |
| 1 | App shell — sidebar, module nav, profiler dock | ✅ | Profiler hidden on quiz/journey routes |
| 2 | Teaching engine — `<Lesson/>`, `<Step/>`, `<BeforeAfter/>`, `<TryIt/>`, `<ArchitectNotes/>`, `<ArchitectGate/>` | ✅ | All modules consume it |
| 3 | Profiler infrastructure — FPS, render counter, commit timeline, scheduler trace, Long Tasks API, real Profiler-API wrap | ✅ | Custom; not React DevTools |
| 4 | Shared "Dashboard" surface — stock feed, activity, charts, chat, products | ✅ | The ONE codebase modules evolve around |
| 5 | Foundations F01–F11 (components → rules of React) | ✅ | 11 foundation modules ship |
| 6 | Modules 01–10 (reconciliation → virtualization) | ✅ | Deep impls |
| 7 | Modules 11–16 (compiler → state architecture) | ✅ | Deep impls |
| 8 | Modules 17–24 (browser pipeline → security) | ✅ | All ship interactive demos; some have depth-gaps tracked in TODO.md |
| 9 | Module 25 — Production Incident Simulator | ✅ | 6 incidents · intake → diagnose → fix → validate → postmortem |
| 10 | Architect Mode primitive (reflection gate before fix reveal) | ✅ | |
| 11 | Interview Quiz bank — 200+ questions covering all 36 modules | ✅ | Powers `/lab/daily` and the upcoming `/lab/interview` route |
| 12 | Mobile-first responsive across all 36 routes | ✅ | |
| 13 | Boredom-buster — 10 micro-games during slow loads | ✅ | Picks: tic-tac-toe, 2048, memory, mine, slide, connect4, lights-out, scramble, simon, stroop |
| 14 | Monetisation scaffolding (AdSense readiness, Pro tier) | ✅ | See `MONETISATION.md`, `ADSENSE_READINESS.md` |
| 15 | Interview Mode route — rubric-graded prompts | ☐ | Backlog: see TODO.md |
| 16 | Trace recorder — JSON snapshots + deterministic replay | ☐ | Backlog: see TODO.md |
| 17 | Service Worker + offline shell | ☐ | Backlog: see TODO.md |
| 18 | Playwright smoke test — all 36 routes, mobile + desktop | ☐ | Backlog: see TODO.md |
| 19 | Real toolchain integration for M11–15 (Compiler plugin, PPR, cache()) | ☐ | Currently illustrative; backlog: see TODO.md |

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
- 2026-05-19 (cont.) — **v0.6 — content depth pass**. Five new shared dashboard components (`SearchBar`, `NotificationsPanel`, `ChatPanel`, `ProductCatalog`, `SettingsForm`, `Recommendations`) all wired into a `compose` prop on `<Dashboard>` so the surface grows from 4 → 9 panels. `/lab/journey` expanded from 6 → 11 stages, each with applied-fix bullets in a side rail and cross-links to the deep-dive modules. Landing page rebuilt: nav with GitHub link, hero with usage stats (25/9/6/100%), three "ways to read it" learning paths (linear / journey / incident-sim), "how a module works" 6-beat explainer, FAQ section. Per-module elaboration: Module 1 added anti-patterns + when-NOT-to-memoize; Module 2 added conditional-wrapper trap + two-heuristics deep dive; Module 3 added 5 interview Qs; Module 4 added "when transitions don't help"; Module 6 added the 4 classic hydration mismatch causes; Module 9 added the cross-island state trap; Module 11 added compiler escape hatches; Module 12 added the children-pass-through pattern + RSC limits; Module 15 added PPR-vs-SSG-vs-ISR-vs-SSR + the cookie/searchParams pitfalls. Build clean, 210KB First Load on `/lab/[module]`, 153KB on `/lab/journey`.
- 2026-05-19 — **v0.5 — vision audit + polish**. Honest audit doc (`VISION.md`) acknowledging we drifted from the "one evolving codebase" promise: only Module 1 actually touches the shared `/dashboard/` surface, every other module built isolated demos. Course-corrected with a new `/lab/journey` route — six instances of the SAME `<Dashboard>` rendered with progressively more fixes applied (level slider 0..5). Extended `<Dashboard>` to accept all the levers each module's fix toggles (badKeys, rowFlash, chartHeavyMs, tickMs, activitySize, islands, virtualisedActivity); `ActivityFeed` got a real windowed mode (Module 10's fix applied to the shared surface). Polish: Module 3 now shows the full render → before-mutation → mutation → layout commit phase progression with sub-phase highlights, plus a 31-bit `LaneBitmask` viz; Module 5 reads real `longtask` PerformanceObserver entries on this very page; Module 10 now supports dynamic row heights via prefix-sum binary-search indexing. Journey link added to landing + sidebar + mobile drawer. Build clean, 205KB First Load on `/lab/[module]`, 111KB on `/lab/journey`.
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
