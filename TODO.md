# React Rendering Lab — Coverage Gaps & TODO

> Audit done 2026-05-18 against React 19 (stable Dec 2024 + 19.1 Mar 2025), React Compiler 1.0 (stable Dec 2025), and Next.js 15/16 patterns. The lab covers the core *rendering & scheduling* story well. The biggest gap is the modern **Server Components + Actions + Compiler** layer, which is now the default mental model in 2026.

---

## What the lab already covers

✅ Reconciliation (keys, identity, reference stability)
✅ Diffing algorithm (O(n) heuristics, same-type vs different-type)
✅ Fiber internals (render vs commit, lanes — at conceptual level)
✅ Concurrent rendering (`useTransition`, `useDeferredValue`)
✅ Time slicing (frame budget, blocking vs chunked)
✅ Hydration modes (full, progressive, selective, islands)
✅ Streaming SSR (Suspense boundaries, shell-first)
✅ Suspense architecture (boundary placement, backpressure)
✅ Island architecture (ship-less-JS, parallel hydration)
✅ Virtualization (windowing)

---

## High-priority gaps (the "must add" set)

These are the React 19 / 2026 concepts every senior dev now expects to see in a "rendering lab":

### A. React Compiler (1.0 stable, Dec 2025)
The compiler auto-memoizes — it's the biggest mental-model shift since Hooks. The lab teaches manual identity work in Module 1; it should *also* show what the compiler now does automatically and where you still need to think.

- [ ] **Module 11 — React Compiler**
  - Side-by-side: same component, `react-compiler-runtime` on vs off
  - Show inserted `useMemoCache` hook in the compiled output
  - "When you still need to think manually" — refs, non-pure functions, libraries that bust the compiler
  - Reuse the `Dashboard` surface — compile a "before" and "after" tree

### B. Server Components (RSC)
The lab is 100% client-side. RSC is the default in Next 15+ — it deserves its own module.

- [ ] **Module 12 — Server Components**
  - The render boundary visualised: a tree where green = RSC, purple = Client
  - Real demo: a page that fetches `db.query()` directly in a server component, streams to a `<Suspense>` boundary, hands a Client Component for interactivity
  - "Push `use client` to the leaves" — interactive map showing bundle size impact (extends the Module 9 islands viz with a real number)

### C. Server Actions
The `'use server'` boundary, form `action={...}`, progressive enhancement.

- [ ] **Module 13 — Server Actions + Optimistic UI**
  - Form that posts via Server Action, no client JS to manage state
  - `useActionState` showing pending + error + return value
  - `useFormStatus` from a deep child of `<form>`
  - `useOptimistic` to show instant feedback before the server settles
  - "Why this replaces 80% of Redux/RTK Query boilerplate"

### D. The `use()` hook
Reading promises/context in render is *the* new RSC building block.

- [ ] **Module 14 — `use()`: read resources in render**
  - Suspense boundary that resolves a promise via `use(promise)`
  - Conditional `use()` of context (legal! unlike hooks)
  - Compare to the old `useEffect(() => fetch())` waterfall
  - Tie into Module 7 (streaming) — `use()` is what makes the boundary actually pause

### E. Partial Prerendering (PPR)
Next.js 15 graduates PPR. It's the natural step after Module 7 (streaming SSR).

- [ ] **Module 15 — Partial Prerendering**
  - Static shell + dynamic Suspense holes
  - Visualize CDN cache hit vs origin streaming for the dynamic chunk
  - Why this is "streaming SSR + ISR + edge cache" rolled together

---

## Medium-priority gaps (the "ergonomics + correctness" set)

### F. Ref as a prop (forwardRef deprecation)
- [ ] Add a sub-step in **Module 1** showing `forwardRef` → plain prop refactor. It's a tiny refactor but it changes how every design-system component is written in 2026.

### G. Improved error reporting
- [ ] Add a sub-step in **Module 8** demonstrating `onCaughtError` / `onUncaughtError` / `onRecoverableError` (React 19's new createRoot options). Show that Suspense + ErrorBoundary now has finer-grained hooks.

### H. Document Metadata
- [ ] Mini-module or sub-step: `<title>`, `<meta>`, `<link>` rendered directly inside components — React 19 hoists them to `<head>`. Replaces `next/head` / `react-helmet`.

### I. Stylesheet precedence + async scripts
- [ ] Sub-step under **Module 7** — `<link rel="stylesheet" precedence="high">` and `<script async>` as components. Affects FOUC + waterfall.

### J. Asset Loading APIs
- [ ] Sub-step under **Module 7** — `preload`, `preinit`, `preloadModule`. These are how you tell the streaming renderer to push assets *before* the boundary resolves.

### K. Custom Elements / Web Components
- [ ] Brief callout in **Module 2** — React 19 finally handles custom-element props/attrs/events correctly. Diff implications.

### L. `Context` as a provider (no `.Provider`)
- [ ] Sub-step in **Module 1** identity demo — `<MyContext value={...}>` vs `<MyContext.Provider>`. Tiny but ubiquitous.

---

## Quality improvements to existing modules

### Module 1 — Reconciliation
- [ ] Render heatmap overlay: per-node tint that fades as render count grows
- [ ] Show alternate-tree (double-buffer) animation, not just diff columns
- [ ] Add `React.memo` and `useMemo` interactive toggle (and *then* show how the compiler subsumes both)

### Module 3 — Fiber
- [ ] Real fiber walk that *includes the commit phase* (currently shows render only)
- [ ] Lane priority queue visualisation — 31-bit bitmask, animated
- [ ] Click a fiber to inspect its `pendingProps` / `memoizedProps` / `effectTag`

### Module 4 — Concurrent
- [ ] Scheduler queue visualisation (urgent / continuous / default / transition / idle stacks)
- [ ] Interrupt animation: high-priority update arrives mid-transition, transition restarts

### Module 5 — Time slicing
- [ ] Pull real long-task data via the `longtask` PerformanceObserver
- [ ] Show `scheduler.postTask({priority})` vs `requestIdleCallback`

### Module 6 — Hydration
- [ ] Real `<Suspense>` selective hydration demo (currently simulated)
- [ ] Click-during-hydration capture: show the queued event firing post-hydration

### Module 7 — Streaming SSR
- [ ] Use Next.js's actual `app/api/stream/route.ts` with a `ReadableStream` you can watch byte-by-byte
- [ ] Out-of-order chunk replay — Suspense boundaries that resolve in non-source order

### Module 8 — Suspense
- [ ] Cache-aware demo (`cache()` from React) — same data fetched twice, only one network request
- [ ] Error boundaries paired with Suspense; demonstrate `<ErrorBoundary>` retry pattern

### Module 9 — Islands
- [ ] Make this RSC-real (not simulated): use actual `'use client'` boundaries and measure bundle bytes via build output

### Module 10 — Virtualization
- [ ] Dynamic row heights (current demo uses fixed `ROW_H`)
- [ ] Switch to `react-virtuoso` or `@tanstack/virtual` for the "production" toggle
- [ ] Horizontal virtualization for the chart in Module 4

---

## Infrastructure / engine TODOs

- [ ] **Trace recorder**: capture a session's commits + renders to JSON, then replay deterministically. Lets us write "expected metrics" assertions per module — turns the lab into an eval harness.
- [ ] **Real `<Profiler>` API** wiring inside the dock (we currently use manual `useRenderCount`; React's `<Profiler>` would give us actual `actualDuration` / `baseDuration`).
- [ ] **ReactFlow** dependency graph component (we listed it in deps but didn't use it). Good fit for Module 8's data-dependency view.
- [ ] **Service Worker** for the streaming demo so we can simulate slow networks deterministically.
- [ ] **Playwright** smoke test that walks all module routes and screenshots the profiler dock.

---

## Stretch / nice-to-have

- [ ] **Module 16 — Mobile / RN parallels**: how Fabric / TurboModules map to Fiber concepts.
- [ ] **Module 17 — Edge runtime constraints**: what React APIs work on the edge vs node.
- [ ] **Bundle size budget UI**: per-module shipped JS, with a "compile with React Compiler" toggle to show the difference.
- [ ] **Dark/light toggle**: currently dark-only.
- [ ] **MDX support** for steps so explanations can be authored in markdown.
- [ ] **i18n**: ship the strings through `next-intl` to demonstrate Server Components + translations.

---

## Suggested order to tackle (for tomorrow's session)

1. **Module 11 (Compiler)** — small, high-impact, doesn't require backend wiring.
2. **Sub-step in Module 1** for ref-as-prop + Context-as-provider (15 min).
3. **Module 12 (RSC)** — converts the lab from "client demo" to "modern Next.js demo". Bigger lift but defining.
4. **Module 13 (Server Actions + useOptimistic + useFormStatus)** — pairs naturally with Module 12.
5. **Module 14 (`use()` hook)** — small once Module 12 exists.
6. **Module 15 (PPR)** — caps off the SSR arc.
7. Loop back and upgrade Modules 3, 4, 6, 7 with the richer visualisations listed above.

## Sources used for this audit

- [React v19 — React](https://react.dev/blog/2024/12/05/react-19)
- [Meta's React Compiler 1.0 (InfoQ, Dec 2025)](https://www.infoq.com/news/2025/12/react-compiler-meta/)
- [React Compiler Stable in Next.js 16](https://www.digitalapplied.com/blog/react-compiler-stable-nextjs-16-automatic-memoization)
- [Next.js in 2026 — RSC + Server Actions](https://medium.com/@Samira8872/next-js-in-2026-exploring-react-server-components-rsc-and-server-actions-in-depth-60f0478830af)
- [React Server Components Complete 2026 Guide](https://muhammadarslan.codes/blog/react-server-components-complete-guide)
- [React 19 Ref Updates — Saeloun Blog](https://blog.saeloun.com/2025/03/24/react-19-ref-as-prop/)
- [React 19 New Hooks and APIs Explained — Medium](https://medium.com/@szaranger/react-19-new-hooks-and-apis-explained-8612339ef0ef)
