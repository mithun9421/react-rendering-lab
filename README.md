# React Rendering Lab

> One intentionally-broken React dashboard. Ten architectural fixes. Every fix exposes the next bottleneck.

An interactive lab that teaches advanced React rendering, hydration, concurrency, and SSR through a single evolving codebase. You profile the symptoms, apply a pattern, watch the metrics change — and discover what scaling actually feels like.

This is not documentation. It is a debugging simulator + architecture lab + performance surgery tool.

## What's inside

Ten modules wired into a single bottleneck chain:

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
| 10 | Virtualization | Render visible rows only | which brings you back to reconciliation keys |

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

This is `v0.1`. All ten modules render and tell their story; deeper visualisations (full fiber walk replays, real streaming SSR demos, ReactFlow-based dependency graphs) are slated. See `PROGRESS.md` for the build log and the next pass.

## License

MIT.
