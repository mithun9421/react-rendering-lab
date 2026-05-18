# React Rendering Lab — Coverage Gaps & TODO

> **v0.3 status (2026-05-18 eve):** Registry expanded 15 → 25 modules. The lab is now the "Staff+/Principal frontend systems simulator" the prompt called for. Deep impls: 1, 4, 8, 10-16, 25. Scaffolded (ComingSoon fallback): 17-24. Architect Mode primitive shipped. The remaining work is fleshing out the scaffolded modules with their full interactive demos.

---

## What the lab now covers

✅ Reconciliation · Diffing · Fiber · Concurrent rendering (now with scheduler queue viz) · Time slicing
✅ Hydration modes · Streaming SSR (with metadata + preloading) · Suspense (with cache() + retry) · Islands · Virtualization
✅ React Compiler · Server Components · Server Actions · `use()` · PPR
✅ State Architecture at Scale (4 strategies live)
✅ Production Incident Simulator (intake → diagnose → fix → validate → postmortem · 6 incidents)
✅ Architect Mode (reflection gate before every fix reveal)
✅ Mobile-first responsive across all 25 routes

---

## Scaffolded modules to flesh out

These exist in the registry, link in the bottleneck chain, and route to a ComingSoon fallback. Each is queued with a sketch of the interactive demo:

### Module 17 — Browser Rendering Pipeline
- [ ] **Pipeline timeline viz**: style → layout → paint → composite phases as horizontal bars; show which CSS properties land in which phase.
- [ ] **Layout thrashing demo**: alternating read/write loop vs batched read-then-write. FPS diverges visibly.
- [ ] **Composite layer viewer**: toggle `transform: translateZ(0)` and watch the layer tree explode.
- [ ] **Transform vs top/left animation**: side-by-side card animating with each strategy.

### Module 18 — Network & Data Fetching
- [ ] **Request waterfall graph** (canvas) — colored bars per request, dependencies as arrows.
- [ ] **Slow-network simulator** — `connection.downlink` override, watch fetch start times shift.
- [ ] **Dedup vs no-dedup** toggle — fire 5 components requesting the same key, count actual network calls.
- [ ] **Retry/backoff demo** — drive Module 25's retry-storm incident from this UI.
- [ ] **CDN edge viz** — map of POPs, cache HIT/MISS heatmap.

### Module 19 — Microfrontend Architecture
- [ ] **Module Federation dependency graph** — three "teams" sharing React. Visualise duplicate-React via bundle viewer.
- [ ] **Version mismatch simulator** — host expects `v18.2.x`, remote ships `v19.0.x` — show the runtime contract failure.
- [ ] **Shared store / event bus** demo — runtime integration vs build-time integration.

### Module 20 — Build Systems & Bundling
- [ ] **Interactive bundle analyzer** — treemap of the lab's own production bundle.
- [ ] **Tree-shaking demo** — same import statement, two patterns (`import *` vs named), show the chunk size delta.
- [ ] **Dynamic import playback** — animate which chunk loads when, on which interaction.
- [ ] **Webpack vs Turbopack vs Vite** mental model viz (no real compile — just the differences in how chunks resolve).

### Module 21 — Accessibility Engineering
- [ ] **Accessibility tree viewer** — same DOM, AOM side by side.
- [ ] **Keyboard navigation map** — animated focus path through the dashboard.
- [ ] **Screen-reader transcript** — render the announcements as a chat-style timeline as you tab through.
- [ ] **Async hydration a11y** — what `aria-busy` looks like during Suspense fallback.
- [ ] **Focus trap demo** — modal that traps focus correctly vs one that doesn't.

### Module 22 — Observability & Diagnostics
- [ ] **Span timeline viewer** — capture `performance.mark()` + `performance.measure()` in the dashboard surface and render as a flame chart.
- [ ] **Distributed trace graph** — frontend span linked to a fake backend span via traceparent.
- [ ] **RUM dashboard** — LCP, FID, CLS, INP gauges that read from the PerformanceObserver.
- [ ] **Session replay** mini-impl — record DOM mutations + clicks, replay in a sandboxed iframe.

### Module 23 — Memory & Leak Detection
- [ ] **Heap growth chart** — `performance.memory.usedJSHeapSize` over time, sampled.
- [ ] **Leak triggers**: detached DOM (orphan ref), stale closure (interval not cleared), event listener leak (window listener added in effect with no cleanup).
- [ ] **Retention path viewer** — show the chain from a leaked object back to GC root.
- [ ] **GC timeline** — visualise major vs minor collections (synthetic, since the API isn't exposed).

### Module 24 — Frontend Security
- [ ] **XSS playground** — input that's rendered three ways (dangerouslySetInnerHTML, JSX, sanitized) — only one detonates.
- [ ] **Hydration-time injection** — show how a malicious `__NEXT_DATA__` payload can land between server and client.
- [ ] **CSP enforcement graph** — same script tag, four CSP policies, four outcomes.
- [ ] **Iframe isolation** — sandbox attribute comparison, `postMessage` boundary.
- [ ] **Dependency compromise** — npm install graph, highlight the package most-likely-to-be-typosquatted.

---

## Polish carried over from v0.2

### Module 1 — Reconciliation
- [ ] Render heatmap overlay
- [ ] Alternate-tree (double-buffer) animation
- [ ] `React.memo` + `useMemo` interactive toggle (then show how Module 11's Compiler subsumes both)

### Module 3 — Fiber
- [ ] Real fiber walk that includes commit phase
- [ ] Lane priority queue viz — partly done via Module 4's `SchedulerQueue`; do the 31-bit bitmask version here.
- [ ] Click a fiber to inspect its `pendingProps` / `memoizedProps` / `effectTag`

### Module 5 — Time slicing
- [ ] Pull real long-task data via `longtask` PerformanceObserver
- [ ] `scheduler.postTask({ priority })` vs `requestIdleCallback`

### Module 6 — Hydration
- [ ] Real `<Suspense>` selective hydration demo
- [ ] Click-during-hydration capture

### Module 7 — Streaming SSR
- [ ] Real `app/api/stream/route.ts` with `ReadableStream` you can watch byte-by-byte
- [ ] Out-of-order chunk replay

### Module 10 — Virtualization
- [ ] Dynamic row heights
- [ ] `@tanstack/react-virtual` "production" toggle

### Modules 11-15
- [ ] Wire the real `babel-plugin-react-compiler` so Module 11's "compiled" toggle uses real output
- [ ] Two-page demo for Module 12 with real bundle bytes from the build output
- [ ] Module 13: keep typed text after a server rejection via `useActionState`
- [ ] Module 14: `cache()` pattern with shared promise
- [ ] Module 15: real PPR config (`experimental: { ppr: 'incremental' }`)

---

## Infrastructure / engine TODOs

- [ ] **Interview Mode route** — `/lab/interview` that draws a question (debugging, sys-design, perf, decision) and grades the answer against rubrics. Builds on `ArchitectGate`.
- [ ] **Trace recorder** — capture a session's commits + renders to JSON, replay deterministically. Lets the lab assert "expected metrics" per module.
- [ ] **Real `<Profiler>` API** in the dock to expose `actualDuration` / `baseDuration` per commit.
- [ ] **ReactFlow** dependency graph for Module 8 and Module 19.
- [ ] **Service Worker** for the streaming + offline modules.
- [ ] **Playwright** smoke test that walks all 25 routes and screenshots the profiler dock at mobile + desktop widths.

---

## Stretch

- [ ] **Multi-tab consistency module** — BroadcastChannel + SharedWorker patterns (extends Module 25's stale-cache incident).
- [ ] **Edge runtime constraints module**
- [ ] **Bundle size budget UI** in the dock
- [ ] **Light theme**
- [ ] **MDX support** for step content authoring
- [ ] **i18n** via `next-intl` to demonstrate RSC + translations

---

## Suggested next session order

1. **Module 22 — Observability**: huge interview signal, wraps existing profiler infra. Build the RUM dashboard first.
2. **Module 17 — Browser Pipeline**: paint flashing + layout thrashing — visually striking, reuses the existing dashboard surface.
3. **Module 23 — Memory**: drives the existing Incident Simulator's memory-leak entry.
4. **Module 21 — A11y**: keyboard nav map + screen-reader transcript.
5. **Module 18 — Network**: request waterfall.
6. **Module 24 — Security**: XSS playground.
7. **Module 19 — Microfrontends**: Module Federation graph.
8. **Module 20 — Build**: bundle analyzer treemap.
9. **Interview Mode** route.
10. Loop back and polish Modules 3, 5-7, 10-15 with the items listed above.

## Sources

- [React v19 — React](https://react.dev/blog/2024/12/05/react-19)
- [Meta's React Compiler 1.0 (InfoQ, Dec 2025)](https://www.infoq.com/news/2025/12/react-compiler-meta/)
- [Next.js in 2026 — RSC + Server Actions](https://medium.com/@Samira8872/next-js-in-2026-exploring-react-server-components-rsc-and-server-actions-in-depth-60f0478830af)
- [React 19 Ref Updates — Saeloun Blog](https://blog.saeloun.com/2025/03/24/react-19-ref-as-prop/)
- [React 19 New Hooks and APIs Explained — Medium](https://medium.com/@szaranger/react-19-new-hooks-and-apis-explained-8612339ef0ef)
