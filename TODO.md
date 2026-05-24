# React Rendering Lab — Coverage Gaps & TODO

> **v0.4 status (2026-05-24):** All 36 modules implemented (11 foundations + 25 advanced). No ComingSoon fallbacks remain. Modules 17–24 each ship at least one real interactive demo. Quiz bank expanded to 200+ judgment-call questions across all modules. Profiler hidden on non-module routes (daily/interview/journey) where it's noise rather than signal. The remaining work is depth-polish on specific module demos and engine-level extras (interview mode, trace recorder, service worker, Playwright).

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

## Module status — all 25 advanced + 11 foundations implemented

### Module 17 — Browser Rendering Pipeline ✅
- [x] Pipeline phases viz (`PipelinePhases`)
- [x] Layout thrashing demo (`ThrashDemo`)
- [x] Composite layer viewer (`LayerCount`)
- [x] Transform vs top/left animation (`TransformVsTopLeft`)
- [x] Property → phase table (`PropertyTable`)

### Module 18 — Network & Data Fetching ✅ (mostly)
- [x] Request waterfall graph (`Waterfall`)
- [x] Dedup toggle (`NetworkLab` with `dedup` flag)
- [x] Retry/backoff visualiser (`RetrySim`, `RetryViz`)
- [x] Parallel vs serial toggle (`NetworkLab` with `parallel` flag)
- [ ] Slow-network slider — `connection.downlink` simulator overlay
- [ ] CDN POP heatmap — geographic cache HIT/MISS viz

### Module 19 — Microfrontend Architecture ✅ (mostly)
- [x] React Flow federation topology (shipped `54bc032`)
- [ ] Version-mismatch sim — host v18 + remote v19 runtime failure
- [ ] Shared event-bus demo — runtime vs build-time integration

### Module 20 — Build Systems & Bundling ✅
- [x] Interactive bundle treemap (`Treemap`)
- [x] Tree-shake/split/swap/deadcode toggles (`BundleViz`)
- [x] Webpack vs Turbopack vs Vite mental model section

### Module 21 — Accessibility Engineering ✅
- [x] Focus path demo (`FocusPathDemo`)
- [x] AOM-vs-DOM side-by-side (`AccessibilityTree`)
- [x] Focus trap demo (`ModalDemo`)
- [x] Hydration a11y section
- [ ] Screen-reader transcript timeline (nice-to-have)

### Module 22 — Observability & Diagnostics ✅ (mostly)
- [x] Real RUM Web Vitals dashboard (`WebVitalsDashboard`) — uses PerformanceObserver
- [x] Span flame chart (in module surface)
- [ ] Distributed trace graph — frontend ↔ backend span linkage
- [ ] Session-replay mini-impl

### Module 23 — Memory & Leak Detection ✅
- [x] Heap growth chart (`HeapMonitor`) — `performance.memory.usedJSHeapSize`
- [x] Four leak triggers (`LeakTriggers`): interval, listener, closure, cache
- [x] Retention path viewer (`RetentionPath`)
- [ ] GC timeline (synthetic, low priority)

### Module 24 — Frontend Security ✅
- [x] XSS playground (`XssPlayground`) — 3-way render comparison
- [x] CSP comparison (`CspComparison`)
- [x] Secure-by-construction patterns
- [ ] Iframe sandbox interactive demo
- [ ] Hydration-time injection demo

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
