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
- [x] Pull real long-task data via `longtask` PerformanceObserver — wired into `useFpsLoop` + surfaced in `ProfilerDock` (`de19c71`)
- [ ] `scheduler.postTask({ priority })` vs `requestIdleCallback` interactive comparison

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

- [x] **Real `<Profiler>` API** in the dock — `ProfilerWrap` exists; `actualDuration` / `baseDuration` / `phase` flow into the store and surface in the dock as memo savings %
- [x] **Real Long Tasks observer** — `PerformanceObserver({ type: 'longtask', buffered: true })` wired into `useFpsLoop`, dock stat shows count
- [x] **ProfilerDock route-scoping** — hidden on `/lab/daily`, `/lab/interview`, `/lab/journey` where it's noise rather than signal (`a1bb27c`)
- [ ] **Interview Mode route** — `/lab/interview` rubric-graded prompts on top of `ArchitectGate` and the 200-question bank. Should pick by `kind` (debug / design / tradeoff / internals), present scenario, accept free-text or MCQ, then reveal model answer with per-rationale diff.
- [ ] **Trace recorder** — capture a session's commits + renders + long tasks to JSON, replay deterministically; lets the lab assert "expected metrics" per module and ship golden traces.
- [ ] **ReactFlow** dependency graph for Module 8 (Suspense boundary tree).
- [ ] **Service Worker** for the streaming + offline modules; cache the lab shell + foundation routes for offline-first.
- [ ] **Playwright** smoke test that walks all 36 routes (11 foundations + 25 advanced) and screenshots the profiler dock at mobile + desktop widths. Quarantine flake; upload artefacts to PR comment.

---

## Module depth still pending

These ship at least one interactive demo each (so the module pages aren't empty), but the originally-spec'd richness isn't fully there yet:

### Module 18 — Network & Data
- [ ] Slow-network slider — `connection.downlink` simulator overlay so the existing `Waterfall` reflows under throttled bandwidth
- [ ] CDN POP heatmap — geographic cache HIT/MISS viz

### Module 19 — Microfrontends
- [ ] Version-mismatch sim — host v18 + remote v19 runtime contract failure with the actual "Invalid hook call" error path
- [ ] Shared event-bus demo — runtime vs build-time integration tradeoff visualised

### Module 22 — Observability
- [ ] Distributed trace graph — frontend span linked to a fake backend span via `traceparent`; render as a flame chart that crosses the service boundary
- [ ] Session-replay mini-impl — record DOM mutations + clicks, replay in a sandboxed iframe (rrweb-style)

### Module 23 — Memory
- [ ] GC timeline — synthetic visualisation of major vs minor collections (the API isn't exposed, so this is illustrative)

### Module 24 — Security
- [ ] Iframe sandbox interactive demo — toggle each `allow-*` flag and see what the embedded content can/can't do
- [ ] Hydration-time injection demo — show how a malicious `__NEXT_DATA__` payload lands between server and client

### Module 21 — Accessibility
- [ ] Screen-reader transcript timeline — render announcements as a chat-style log as the user tabs through the dashboard

### Modules 11–15 — Real toolchain integration
- [ ] Wire the real `babel-plugin-react-compiler` so Module 11's "compiled" toggle uses real output (currently illustrative)
- [ ] Two-page demo for Module 12 with real bundle bytes from the build output
- [ ] Module 13: keep typed text after a server rejection via `useActionState` (test the actual recovery path)
- [ ] Module 14: `cache()` pattern with shared promise demo
- [ ] Module 15: real PPR config (`experimental: { ppr: 'incremental' }`) — currently the module explains PPR without enabling it for the lab itself

---

## Stretch

- [ ] **Multi-tab consistency module** — BroadcastChannel + SharedWorker patterns (extends Module 25's stale-cache incident)
- [ ] **Edge runtime constraints module** — what's missing on Vercel Edge / Cloudflare Workers vs Node, with a side-by-side build-error demo
- [ ] **Bundle size budget UI** in the dock — show current route's bundle size vs budget, fail loud at thresholds
- [ ] **Light theme** — the lab is dark-mode-only; AdSense optimisation + accessibility audit may want light
- [ ] **MDX support** for step content authoring — currently steps are JSX, MDX would let non-engineers contribute lessons
- [ ] **i18n** via `next-intl` to demonstrate RSC + translations (and make the lab usable outside English)

---

## Documentation / polish

- [ ] Generate a per-module READme via `/update-docs` covering depth-level + what's missing
- [ ] Add a "skip to game" affordance from the boredom-buster pill since 10 games is enough to be its own feature
- [ ] Audit `/lab/journey` for the new long-task signal — likely worth surfacing there

---

## Suggested next session order

1. **Interview Mode route** — biggest interview-prep ROI; reuses the 200-question bank that was just expanded
2. **M18 slow-network slider** — small visible win that completes M18's interactive surface
3. **M22 distributed trace graph** — high interview-signal addition
4. **M24 iframe sandbox demo** — compact, instructive, completes M24's interactive surface
5. **M19 version-mismatch + event-bus** — completes M19's interactive surface
6. **Playwright smoke test** — locks the current state against regression before more module depth lands
7. **Trace recorder** — unblocks "golden trace" assertions in later modules
8. **M11–15 real toolchain integration** — biggest authenticity win; turns illustration into demonstration
9. **Stretch items** as time allows

## Sources

- [React v19 — React](https://react.dev/blog/2024/12/05/react-19)
- [Meta's React Compiler 1.0 (InfoQ, Dec 2025)](https://www.infoq.com/news/2025/12/react-compiler-meta/)
- [Next.js in 2026 — RSC + Server Actions](https://medium.com/@Samira8872/next-js-in-2026-exploring-react-server-components-rsc-and-server-actions-in-depth-60f0478830af)
- [React 19 Ref Updates — Saeloun Blog](https://blog.saeloun.com/2025/03/24/react-19-ref-as-prop/)
- [React 19 New Hooks and APIs Explained — Medium](https://medium.com/@szaranger/react-19-new-hooks-and-apis-explained-8612339ef0ef)
