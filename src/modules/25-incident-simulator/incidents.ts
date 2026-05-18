/**
 * Incident catalogue. Each incident describes:
 *  - what symptoms the dashboard exhibits
 *  - what the metrics look like in the dock
 *  - the candidate hypotheses (the learner picks one)
 *  - the actual root cause (what they'd see in a postmortem)
 *  - the fix description
 *  - the new bottleneck the fix exposes
 *
 * The lab is data-driven from here — adding an incident is one object.
 */
export type IncidentKind =
  | "cpu-spike"
  | "render-loop"
  | "memory-leak"
  | "hydration-mismatch"
  | "retry-storm"
  | "websocket-storm"
  | "scheduler-overload"
  | "stale-cache";

export type Hypothesis = { id: string; text: string; correct?: boolean; why?: string };

export type Incident = {
  kind: IncidentKind;
  title: string;
  /** What the dock + dashboard show while the incident is live. */
  symptoms: string[];
  /** Numeric snapshot the dashboard pretends to read. */
  metrics: { fps: number; renderRate: number; mem: number; jsErr: number; lcpMs?: number };
  hypotheses: Hypothesis[];
  rootCause: string;
  fix: string;
  /** The new bottleneck the fix exposes — keeps the lab's narrative loop alive. */
  nextBottleneck: string;
  /** Difficulty 1..5 — affects the score. */
  difficulty: 1 | 2 | 3 | 4 | 5;
};

export const INCIDENTS: Incident[] = [
  {
    kind: "cpu-spike",
    title: "Sustained CPU spike on the dashboard route",
    symptoms: [
      "FPS dropped from 60 → 22 after the feature flag rollout",
      "p95 INP > 800ms",
      "Renders/sec for `StockRow:*` quadrupled",
    ],
    metrics: { fps: 22, renderRate: 4200, mem: 184, jsErr: 0 },
    hypotheses: [
      { id: "a", text: "Server is slow — frontend is starved waiting on data." },
      {
        id: "b",
        text: "A new prop on `StockRow` lost reference stability; every row re-renders every tick.",
        correct: true,
        why: "Render rate scaled with the list, not with payload size — the work is per-row in render, not per-fetch.",
      },
      { id: "c", text: "Garbage collection pause." },
      { id: "d", text: "Animation library competing with React for the frame." },
    ],
    rootCause:
      "A formatter prop was changed from a module-level constant to an arrow function created inside the parent. Every render produced a new function identity, busting `React.memo`.",
    fix: "Hoist the formatter back out of render (or wrap with `useCallback` / let the Compiler memoize it). Pair with `React.memo` on `StockRow`.",
    nextBottleneck:
      "Per-row work is cheap again, but the dashboard still re-renders the whole list on each tick — virtualization (Module 10) is the next lever.",
    difficulty: 2,
  },
  {
    kind: "render-loop",
    title: "Tab freezes within 4 seconds of mount",
    symptoms: [
      "Renders/sec climbing to 10,000+ then crashing the tab",
      "JS heap doubling every second",
      "Sentry shows `Maximum update depth exceeded`",
    ],
    metrics: { fps: 4, renderRate: 12400, mem: 980, jsErr: 1 },
    hypotheses: [
      { id: "a", text: "useEffect with no dependency array updates state that the effect depends on." },
      {
        id: "b",
        text: "useEffect lists a new object literal in its deps array, so the effect runs every render — and the effect calls setState.",
        correct: true,
        why: "Render rate and heap both climb infinitely. Classic deps-identity bug — the loop is render→effect→state→render.",
      },
      { id: "c", text: "React Query refetch interval too low." },
      { id: "d", text: "WebSocket flooding the store." },
    ],
    rootCause:
      "`useEffect(() => fetchUser(opts), [opts])` where `opts = { id }` is rebuilt inline on every render. Identity churn triggers the effect, the effect calls `setState`, the state change re-renders, repeat.",
    fix: "Memoize `opts` (or destructure to a primitive `id` and depend on that). If you ship the Compiler, this becomes a non-issue.",
    nextBottleneck:
      "Even with stable deps, network-driven setState still propagates across the tree — back to Module 16 (state architecture) for selectors.",
    difficulty: 3,
  },
  {
    kind: "memory-leak",
    title: "Browser tab grows to 1.6 GB over a 4-hour session",
    symptoms: [
      "Heap grows linearly, never drops after GC",
      "Detached DOM nodes climb in the heap snapshot",
      "Performance degrades steadily over time",
    ],
    metrics: { fps: 42, renderRate: 90, mem: 1620, jsErr: 0 },
    hypotheses: [
      { id: "a", text: "A long-lived event listener keeps the component instance retained." },
      {
        id: "b",
        text: "`setInterval` started in a useEffect never gets cleared on unmount.",
        correct: true,
        why: "Detached DOM + linear heap growth + steady (not spiking) renders = a recurring callback closing over an unmounted tree.",
      },
      { id: "c", text: "Image cache too aggressive." },
      { id: "d", text: "React DevTools profiler left on." },
    ],
    rootCause:
      "`useEffect(() => { setInterval(tick, 1000); }, [])` — no cleanup. On every route change, a new interval starts, and the closure pins the previous component subtree.",
    fix: "Return a cleanup from the effect: `return () => clearInterval(id);`. Module 23 (Memory) builds a leak detector that finds these.",
    nextBottleneck:
      "Leak gone, but the dashboard still mounts hundreds of components per route change — too much subscription churn.",
    difficulty: 4,
  },
  {
    kind: "hydration-mismatch",
    title: "Hydration warning storm in prod, only on Safari/iOS",
    symptoms: [
      "`Text content did not match` warnings on every page load",
      "Some interactive elements unresponsive for ~2s after paint",
      "Sentry shows 30% of iOS sessions affected",
    ],
    metrics: { fps: 60, renderRate: 12, mem: 88, jsErr: 0, lcpMs: 1400 },
    hypotheses: [
      {
        id: "a",
        text: "Rendering `new Date().toLocaleTimeString()` directly in JSX — server and client locale differ.",
        correct: true,
        why: "Locale-sensitive Date formatting is the #1 source of platform-specific hydration mismatches.",
      },
      { id: "b", text: "Server returning a different user than the client cookie thinks." },
      { id: "c", text: "Hydration root mounted on the wrong DOM node." },
      { id: "d", text: "A11y label changed by a third-party script." },
    ],
    rootCause:
      "A timestamp in the header renders via `toLocaleTimeString()`. Node uses UTC, the browser uses the user's tz; the mismatch invalidates the entire shell's hydration.",
    fix: "Render a stable placeholder on the server, swap to the locale-formatted string after mount (`useEffect`). Or pass the timestamp through a `<ClientOnly>` / `suppressHydrationWarning` (last-resort).",
    nextBottleneck:
      "Hydration is clean now, but the placeholder→swap creates a visible CLS. Module 17 (browser pipeline) covers the cost.",
    difficulty: 3,
  },
  {
    kind: "retry-storm",
    title: "After origin restart, frontend fires 9000 req/sec",
    symptoms: [
      "Network panel: identical request to /api/feed firing constantly",
      "503s coming back from origin",
      "Frontend keeps retrying, making the outage worse",
    ],
    metrics: { fps: 58, renderRate: 60, mem: 110, jsErr: 0 },
    hypotheses: [
      { id: "a", text: "React Query refetchInterval too low." },
      {
        id: "b",
        text: "Retry policy has no backoff — every failure re-fires immediately, and the cache is shared so all components stampede.",
        correct: true,
        why: "9000 req/sec means the retry rate is exponential, not linear with components. Classic missing-jitter-backoff.",
      },
      { id: "c", text: "Stale-while-revalidate misconfigured." },
      { id: "d", text: "Service worker bypassing the cache." },
    ],
    rootCause:
      "Custom fetch wrapper retried on 5xx but with `delay: 0`. When origin returned 503, every component retried in the same microtask, multiplying with each render.",
    fix: "Exponential backoff with jitter, max-retry cap, and circuit-breaker: stop retrying for N seconds after K consecutive failures across the shared cache key.",
    nextBottleneck:
      "Retries are tame, but observability didn't catch this — Module 22 covers RUM dashboards that page on retry-rate spikes.",
    difficulty: 4,
  },
  {
    kind: "stale-cache",
    title: "User edits a row, sees old value reappear 200ms later",
    symptoms: [
      "Optimistic write succeeds visually",
      "After a refetch, the old server value flashes back",
      "Only reproducible when two tabs are open",
    ],
    metrics: { fps: 60, renderRate: 30, mem: 100, jsErr: 0 },
    hypotheses: [
      { id: "a", text: "WebSocket from the other tab is overwriting state." },
      {
        id: "b",
        text: "Optimistic update succeeded but the invalidation refetched before the server had committed the write.",
        correct: true,
        why: "The 200ms gap = round-trip latency. The refetch raced the write's persistence.",
      },
      { id: "c", text: "useState was reset by a parent re-render." },
      { id: "d", text: "useTransition deferred the update." },
    ],
    rootCause:
      "`mutate.onSuccess: () => qc.invalidateQueries(key)` triggers an immediate refetch. The mutation returned 200 before the DB replication caught up; the refetch reads the read-replica's stale value.",
    fix: "Either (a) wait for replica lag with a small client delay before invalidate, (b) trust the mutation's returned value via `setQueryData`, or (c) use `useOptimistic` with server-confirm.",
    nextBottleneck:
      "Single-tab consistency is fixed. Two-tab consistency now needs broadcast / shared-worker. That's the next layer.",
    difficulty: 5,
  },
];

export function pickIncident(seed: number): Incident {
  return INCIDENTS[seed % INCIDENTS.length];
}
