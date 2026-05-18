# React Rendering Lab — Coverage Gaps & TODO

> Audit done 2026-05-18 against React 19 (stable Dec 2024 + 19.1 Mar 2025), React Compiler 1.0 (stable Dec 2025), and Next.js 15/16 patterns. **Update 2026-05-18 evening:** Modules 11-15 now landed — Compiler, RSC, Server Actions, `use()`, and PPR. The remaining items below are medium-priority polish.

---

## What the lab now covers

✅ Reconciliation · Diffing · Fiber · Concurrent rendering · Time slicing
✅ Hydration modes · Streaming SSR · Suspense architecture · Islands · Virtualization
✅ **React Compiler** (auto memoization, when manual is still needed)
✅ **Server Components** (interactive `'use client'` boundary toggler + bundle math)
✅ **Server Actions + Optimistic UI** (`useActionState`, `useFormStatus`, `useOptimistic` — real server action wired)
✅ **`use()` hook** (suspend on promise + conditional context, ErrorBoundary retry)
✅ **Partial Prerendering** (request-timeline animation, static-shell + dynamic-hole story)

---

## Remaining medium-priority gaps

### F. Ref as a prop (forwardRef deprecation)
- [ ] Add a sub-step in **Module 1** showing `forwardRef` → plain prop refactor.

### G. Improved error reporting
- [ ] Sub-step in **Module 8** demonstrating `onCaughtError` / `onUncaughtError` / `onRecoverableError` (React 19 createRoot options).

### H. Document Metadata
- [ ] Mini-module or sub-step: `<title>`, `<meta>`, `<link>` rendered inside components — React 19 hoists them. Replaces `next/head` / `react-helmet`.

### I. Stylesheet precedence + async scripts
- [ ] Sub-step under **Module 7** — `<link rel="stylesheet" precedence="high">` and `<script async>` as components.

### J. Asset Loading APIs
- [ ] Sub-step under **Module 7** — `preload`, `preinit`, `preloadModule`.

### K. Custom Elements / Web Components
- [ ] Brief callout in **Module 2** — React 19 finally handles custom-element props/attrs/events correctly.

### L. `Context` as a provider (no `.Provider`)
- [ ] Sub-step in **Module 1** identity demo — `<MyContext value={...}>` vs `<MyContext.Provider>`.

---

## Quality improvements to existing modules

### Module 1 — Reconciliation
- [ ] Render heatmap overlay: per-node tint that fades as render count grows
- [ ] Show alternate-tree (double-buffer) animation, not just diff columns
- [ ] Add `React.memo` + `useMemo` toggle (then show how Module 11's Compiler subsumes both)

### Module 3 — Fiber
- [ ] Real fiber walk that *includes the commit phase* (currently shows render only)
- [ ] Lane priority queue visualisation — 31-bit bitmask, animated
- [ ] Click a fiber to inspect its `pendingProps` / `memoizedProps` / `effectTag`

### Module 4 — Concurrent
- [ ] Scheduler queue visualisation (urgent / continuous / default / transition / idle stacks)
- [ ] Interrupt animation: high-priority update arrives mid-transition, transition restarts

### Module 5 — Time slicing
- [ ] Pull real long-task data via `longtask` PerformanceObserver
- [ ] Show `scheduler.postTask({ priority })` vs `requestIdleCallback`

### Module 6 — Hydration
- [ ] Real `<Suspense>` selective hydration demo (currently simulated)
- [ ] Click-during-hydration capture: show the queued event firing post-hydration

### Module 7 — Streaming SSR
- [ ] Use Next.js's actual `app/api/stream/route.ts` with a real `ReadableStream`
- [ ] Out-of-order chunk replay — Suspense boundaries that resolve in non-source order

### Module 8 — Suspense
- [ ] Cache-aware demo (`cache()` from React) — same data fetched twice, only one network request
- [ ] Pair Suspense with ErrorBoundary retry pattern (Module 14 has a starting point)

### Module 9 — Islands
- [ ] Make this RSC-real (not simulated): use actual `'use client'` boundaries and measure bundle bytes via build output. Pair with Module 12.

### Module 10 — Virtualization
- [ ] Dynamic row heights (current demo uses fixed `ROW_H`)
- [ ] Swap in `@tanstack/virtual` for the "production" toggle
- [ ] Horizontal virtualization for the chart in Module 4

### Module 11 — React Compiler
- [ ] Actually wire `babel-plugin-react-compiler` in a side bundle so the "compiled" toggle uses the real output (currently simulated via a WeakMap)
- [ ] Show the ESLint plugin warnings inline

### Module 12 — Server Components
- [ ] Replace the simulated tree with a real two-page demo (`/lab/12/rsc-on` vs `/lab/12/rsc-off`) and show real bundle bytes from the build output

### Module 13 — Server Actions
- [ ] Add an error-recovery flow that uses `useActionState` to keep the user's typed text after a server rejection
- [ ] Show the network panel: HTML form post → 200 with action-result payload, no JSON API

### Module 14 — use()
- [ ] Resource cache pattern with `cache()` so the same promise is shared across renders
- [ ] `use(context)` from within a server component (requires Module 12 wiring)

### Module 15 — PPR
- [ ] Wire it for real with `experimental: { ppr: 'incremental' }` and a `<Suspense>` boundary that reads `headers()`

---

## Infrastructure / engine TODOs

- [ ] **Trace recorder**: capture a session's commits + renders to JSON, replay deterministically. Lets the lab assert "expected metrics" per module.
- [ ] **Real `<Profiler>` API** in the dock (currently uses manual `useRenderCount`; React's `<Profiler>` would expose `actualDuration` / `baseDuration`).
- [ ] **ReactFlow** dependency graph for Module 8.
- [ ] **Service Worker** for the streaming demo so we can simulate slow networks deterministically.
- [ ] **Playwright** smoke test that walks all module routes and screenshots the profiler dock.

---

## Stretch

- [ ] **Module 16 — RN / Fabric parallels**
- [ ] **Module 17 — Edge runtime constraints**
- [ ] **Bundle size budget UI**: per-module shipped JS, with a "compile with React Compiler" toggle
- [ ] **Light theme**
- [ ] **MDX support** for step content authoring
- [ ] **i18n** via `next-intl` to demonstrate RSC + translations

---

## Suggested next session order

1. Wire the **real** React Compiler (Module 11) and **real** PPR config (Module 15) so the demos aren't simulated.
2. Module 1 sub-steps: ref-as-prop + `<Context value>` shorthand (~30 min total).
3. Module 7 polish: real ReadableStream demo + asset preloading sub-step.
4. Module 8 polish: `cache()` + error boundary retry.
5. Trace recorder + Playwright — these unlock the eval harness and let the lab self-test.

## Sources

- [React v19 — React](https://react.dev/blog/2024/12/05/react-19)
- [Meta's React Compiler 1.0 (InfoQ, Dec 2025)](https://www.infoq.com/news/2025/12/react-compiler-meta/)
- [React Compiler Stable in Next.js 16](https://www.digitalapplied.com/blog/react-compiler-stable-nextjs-16-automatic-memoization)
- [Next.js in 2026 — RSC + Server Actions](https://medium.com/@Samira8872/next-js-in-2026-exploring-react-server-components-rsc-and-server-actions-in-depth-60f0478830af)
- [React Server Components Complete 2026 Guide](https://muhammadarslan.codes/blog/react-server-components-complete-guide)
- [React 19 Ref Updates — Saeloun Blog](https://blog.saeloun.com/2025/03/24/react-19-ref-as-prop/)
- [React 19 New Hooks and APIs Explained — Medium](https://medium.com/@szaranger/react-19-new-hooks-and-apis-explained-8612339ef0ef)
