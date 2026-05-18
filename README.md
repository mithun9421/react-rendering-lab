# React Rendering Lab

> One intentionally-broken React dashboard. Ten architectural fixes. Every fix exposes the next bottleneck.

An interactive lab that teaches advanced React rendering, hydration, concurrency, and SSR through a single evolving codebase. You profile the symptoms, apply a pattern, watch the metrics change — and discover what scaling actually feels like.

This is not documentation. It is a debugging simulator + architecture lab + performance surgery tool.

## What's inside

Twenty-five modules wired into a single bottleneck chain — extending from React rendering internals all the way to production incident response:

| # | Module | What you fix | The next bottleneck it exposes |
|---|---|---|---|
| 01 | Reconciliation | Bad keys, unstable refs, identity-by-position | "the diff itself" |
| 02 | Diffing algorithm | Same-type vs different-type subtree teardown | the commit phase |
| 03 | Fiber internals | Render vs commit, work-units, lanes | long fiber walks block input |
| 04 | Concurrent rendering | `useTransition`, `useDeferredValue`, lane priority | yielding between fibers ≠ yielding inside one |
| 05 | Time slicing | 16ms frame budget, blocking vs chunked | client work waits for paint |
| 06 | Hydration | Full → progressive → selective → islands | hydration waits for HTML to arrive |
| 07 | Streaming SSR | Shell first, Suspense chunks streamed in | data waterfalls in your tree |
| 08 | Suspense architecture | Boundary placement & backpressure | hydrating non-interactive HTML is waste |
| 09 | Island architecture | Ship JS only for interactive pieces | remaining lists are still huge |
| 10 | Virtualization | Render visible rows only | hand-tuned memo — what if the compiler did it? |
| 11 | React Compiler | Auto memoization, the death of `useMemo`/`useCallback` | client renders are free, but you still ship the code |
| 12 | Server Components | The `'use client'` boundary, zero-JS subtrees | reads done; what about writes? |
| 13 | Server Actions + Optimistic UI | `useActionState`, `useFormStatus`, `useOptimistic` | reading resources directly in render |
| 14 | `use()` hook | Suspending on a promise, conditional context | the cap on the streaming story |
| 15 | Partial Prerendering | Static shell from CDN + dynamic Suspense holes | where state lives across all this |
| 16 | State Architecture at Scale | Prop drilling → context → split context → external store + selector | state changes still trigger paints |
| 17 | Browser Rendering Pipeline | Phases viz, layout-thrashing demo, transform vs top/left, layer count | pipeline is fast — when assets arrive |
| 18 | Network & Data Fetching | Live waterfall chart, dedup, retry backoff + circuit breaker | one team is solvable, a hundred isn't |
| 19 | Microfrontend Architecture | Federation dep graph, version mismatch simulator, runtime contracts | the bundle is where the cost lives |
| 20 | Build Systems & Bundling | Interactive treemap with tree-shake / split / swap / dead-code toggles | invisible if blind users can't reach it |
| 21 | Accessibility Engineering | Live focus path, DOM-vs-AOM, focus-trap modal demo | reality drifts — observability tells you |
| 22 | Observability & Diagnostics | Live Web Vitals from PerformanceObserver, distributed trace flame | observability surfaces leaks |
| 23 | Memory & Leak Detection | Live heap chart, 4 leak triggers, retention-path diagram | leaks are accidental, threats aren't |
| 24 | Frontend Security | XSS playground, CSP comparison, secure-by-construction patterns | things still break in prod |
| 25 | Production Incident Simulator | Live on-call playbook — diagnose, fix, validate, postmortem | take Architect Mode into your next interview |

The cycle is the point. Frontend scaling isn't a ladder; it's the same five trade-offs, surfaced one at a time.

## Stack

- **Next.js 15** App Router (for streaming SSR / Suspense / hydration modules)
- **React 19**
- **TypeScript** strict
- **Tailwind CSS** for the dev-tool aesthetic
- **Framer Motion** for the visualisation transitions
- **Zustand** for the global profiler store
- Custom profiler — FPS, render counts, commit timeline — built into a sticky bottom dock

## Get started

```bash
npm install
npm run dev
# → http://localhost:3000
```

Click **Start the Lab** on the landing page and begin Module 1.

## Architecture notes

- **`src/engine/`** — reusable teaching primitives: `<Lesson>`, `<Step>`, `<TryIt>`, `<BeforeAfter>`, `<MetricsPanel>`, `<Callout>`. Every module composes these.
- **`src/profiler/`** — the always-on dock. `useRenderCount`, `useCommitTimer`, `useFpsLoop`, plus a canvas-rendered `<CommitTimeline>` showing the last 6s of commits coloured by lane.
- **`src/dashboard/`** — the single evolving dashboard surface that modules patch into.
- **`src/viz/`** — visualisation primitives shared across modules: `<DiffTree>`, `<FiberTrace>`, `<FrameBudget>`, `<HydrationOverlay>`, `<StreamChunks>`.
- **`src/modules/`** — one folder per module, each consuming the engine.
- **`src/lib/sim.ts`** — `busy(ms)` and `busyAsync(ms)`: real CPU burners so the profiler reads true.

## Why a custom profiler

React DevTools shows render reasons after the fact. The lab needs overlays you can't get from devtools — animated Fiber traversal, scheduler-queue snapshots, hydration order — driven from the same store the metrics dock reads. Everything in the dock is wired live: turn a knob, watch the counters react.

## Status

This is `v0.6`. All 25 modules + the Journey + landing page are elaborated for depth. The `/lab/journey` route walks the same dashboard through **eleven** evolving stages with growing surface area — stocks → search → notifications → chat → products → settings → recommendations. Each module has anti-patterns, interview-grade depth, and worked examples. See `VISION.md` for the honest audit.

### Global features

- **Architect Mode** — toggle in the profiler dock. Gates each module's "fix reveal" behind a reflection prompt (why, tradeoffs, next bottleneck). Persists in localStorage.
- **Custom profiler dock** — FPS, render counts, commit timeline, top offenders. Collapsible on mobile.
- **Mobile-first responsive** — drawer nav, collapsible dock, viz stacking, viewport meta.

## Google AdSense (optional)

The lab is monetisable without touching code. Placement is policy-safe and analysed in [`AD_PLACEMENT.md`](./AD_PLACEMENT.md) — TL;DR: the navbar is **not** an ad surface. Three slots only:

- **Landing in-feed** — between the module grid and the FAQ.
- **Lab sidebar (lg+)** — sticky vertical, never on mobile.
- **In-article + end-of-lesson** — inside `<Lesson>`, after step 4 and after the navigation.

### Setup

1. Apply at [google.com/adsense](https://www.google.com/adsense). The lab&apos;s content (technical, original) is the kind AdSense approves quickly.
2. Once approved, create four ad units in the dashboard:
   - **Display · Fluid (in-feed)** — for the landing slot
   - **Display · Vertical** — for the sidebar slot
   - **In-article · Native** — for the in-article slot
   - **In-article · Native** — for the end-of-lesson slot
3. Copy your publisher ID + the four slot IDs into `.env.local`:

   ```bash
   cp .env.example .env.local
   # then fill in NEXT_PUBLIC_ADSENSE_CLIENT_ID and the four slot IDs
   ```

4. Update `public/ads.txt` with the same publisher ID. Without ads.txt at the site root, AdSense down-bids your inventory.

5. Deploy. The `<AdSenseLoader/>` only fires the AdSense script when the env var is present, so dev / preview deploys stay clean.

### What you get

| Page         | Slot                  | Format          | Expected share of revenue |
| ------------ | --------------------- | --------------- | ------------------------- |
| Landing      | in-feed (fluid)       | native          | ~70%                      |
| Lab sidebar  | vertical (lg+ only)   | responsive      | ~25%                      |
| Module page  | in-article + end      | native in-article | ~5%                     |

## License

MIT.
