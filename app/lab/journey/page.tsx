"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import clsx from "clsx";
import { Dashboard, type DashboardProps } from "@/dashboard/Dashboard";
import { useProfiler } from "@/profiler/store";
import { CodeDiff } from "@/viz/CodeDiff";
import { StageTour, type TourStep } from "@/viz/StageTour";
import { ProfilerWrap } from "@/profiler/ProfilerWrap";

type Stage = {
  level: number;
  title: string;
  module: string;
  modules: string[];
  blurb: string;
  fixes: string[];
  patch: DashboardProps;
  /** GitHub-style diff describing the literal change vs. the previous stage. */
  diff?: { file: string; title: string; src: string };
  /** Numbered tour walking the reader through what to look at in this stage. */
  tour: TourStep[];
};

const STAGES: Stage[] = [
  {
    level: 0,
    title: "Day 1 — naive React",
    module: "Baseline",
    modules: [],
    blurb:
      "Index-as-key, fresh object props every render, heavy synchronous chart, no virtualisation. It works on your laptop and dies on a mid-tier phone.",
    fixes: ["index as key", "rowFlash on", "no useMemo anywhere", "200ms artificial chart work"],
    patch: { compose: "core", badKeys: true, rowFlash: true, chartHeavyMs: 8, tickMs: 800 },
    tour: [
      {
        title: "This is the starting point",
        body: "Every panel here renders the way a first-year React app would. Rows flash on every tick, charts redraw heavily, nothing is memoised.",
        pointAt: "right-panel",
      },
      {
        title: "Watch the rows flash",
        body: "The stock feed's `flash-on-render` class fires whenever a row re-renders. Right now you'll see ALL rows flash every second.",
        pointAt: "right-panel",
      },
      {
        title: "Open the profiler dock",
        body: "Tap the FPS pill at the bottom (or look at the desktop dock). The renders counter climbs by ~12 every tick — that's every row plus the parent, every time.",
        pointAt: "profiler",
      },
      {
        title: "Hit 'apply next fix'",
        body: "We'll change one thing — the key prop — and re-run with the same data. Watch the difference.",
        pointAt: "controls",
      },
    ],
  },
  {
    level: 1,
    title: "Reconciliation — stable keys",
    module: "Module 1 — Reconciliation",
    modules: ["01-reconciliation"],
    blurb:
      "Switch to key=sym, stop flashing every row, give object props stable identity. Per-row render counts drop to near zero on uneventful ticks.",
    fixes: ["key=sym", "no row flash", "stable refs for shared config"],
    patch: { compose: "core", badKeys: false, rowFlash: false, chartHeavyMs: 8, tickMs: 800 },
    diff: {
      file: "src/dashboard/StockFeed.tsx",
      title: "Use the symbol as the key instead of the array index",
      src: `  // Old: positional identity. React thinks the row at slot 0
  // is the same row across re-renders, even when the data
  // at slot 0 changed.
- {stocks.map((s, i) => (
-   <StockRow key={i} stock={s} flash />
- ))}

  // New: keyed by the symbol. When the data reorders, React
  // moves the matching fibers instead of mutating slots.
+ {stocks.map((s) => (
+   <StockRow key={s.sym} stock={s} />
+ ))}`,
    },
    tour: [
      {
        title: "Compare the two panels side-by-side",
        body: "Left is stage 0 (baseline). Right is stage 1 (this fix). Same data on both sides. The flashing on the right has stopped — that's all you needed to do.",
        pointAt: "right-panel",
      },
      {
        title: "Look at the code diff",
        body: "One line changed. `key={i}` → `key={s.sym}`. That's it. The pattern is small; the impact is huge.",
        pointAt: "diff",
      },
      {
        title: "Read the profiler",
        body: "Switch to the dock and watch the StockRow:* counters. They barely move on the right. Each tick, only the rows whose data ACTUALLY changed re-render.",
        pointAt: "profiler",
      },
      {
        title: "What just happened internally",
        body: "Reconciliation matched the new fibers to the old by `sym`. Identical fibers reused their state, refs, and DOM nodes. The diff did the work for free because we told it where to look.",
      },
    ],
  },
  {
    level: 2,
    title: "Diffing aware — same-type stable",
    module: "Module 2 — Diffing",
    modules: ["02-diffing"],
    blurb:
      "Same wrapper element type every render, so the diff reuses the entire subtree. No type-change tear-downs.",
    fixes: ["wrapper type stable", "no <section> → <div> switches"],
    patch: { compose: "core", badKeys: false, rowFlash: false, chartHeavyMs: 8, tickMs: 800 },
    diff: {
      file: "src/dashboard/StockFeed.tsx",
      title: "Keep the wrapper element type stable — don't conditionally switch <section> vs <div>",
      src: `  // Old: type changes when isExpanded flips. React tears
  // down the entire subtree because the root element type
  // changed.
- {isExpanded ? (
-   <section className="big"><Inner/></section>
- ) : (
-   <Inner/>
- )}

  // New: same wrapper type both branches. Toggle a class.
  // Diff reuses the subtree.
+ <section className={isExpanded ? "big" : "small"}>
+   <Inner/>
+ </section>`,
    },
    tour: [
      {
        title: "Same look, different rules",
        body: "The right panel looks identical to stage 1. But internally the diff is now guaranteed never to encounter a wrapper type-change in this subtree.",
        pointAt: "right-panel",
      },
      {
        title: "Why this matters at scale",
        body: "Conditional wrappers (`{condition ? <section/> : <Inner/>}`) silently destroy local state on every toggle. With a stable root type, that state is preserved.",
        pointAt: "diff",
      },
      {
        title: "Click into Module 2 for the full lesson",
        body: "The deep dive shows the two heuristics React uses (type-stable + key-stable) and what breaks when either assumption is violated.",
      },
    ],
  },
  {
    level: 3,
    title: "Concurrent + transitions",
    module: "Modules 3-4 — Fiber + Concurrent",
    modules: ["03-fiber", "04-concurrent"],
    blurb:
      "Add a search panel. Filter inputs run on the TransitionLane so typing stays at 60fps even with a real haystack.",
    fixes: ["useTransition for filter", "useDeferredValue on list", "lane-aware updates"],
    patch: {
      compose: "wider",
      badKeys: false,
      rowFlash: false,
      chartHeavyMs: 8,
      tickMs: 1000,
      searchDeferred: true,
      searchTransition: true,
    },
    diff: {
      file: "src/dashboard/SearchBar.tsx",
      title: "Tag the result-set update as a transition; defer the read",
      src: `  const [q, setQ] = useState("");
  const [filterQ, setFilterQ] = useState("");
+ const [isPending, startTransition] = useTransition();
+ const deferred = useDeferredValue(filterQ);

  <input
    value={q}
    onChange={(e) => {
      setQ(e.target.value);
-     setFilterQ(e.target.value);
+     // Mark the result update as interruptible.
+     // Keystrokes win against this in the scheduler.
+     startTransition(() => setFilterQ(e.target.value));
    }}
  />
- <Results q={filterQ} />
+ <Results q={deferred} />`,
    },
    tour: [
      {
        title: "A new panel appeared",
        body: "The surface just grew — a SearchBar is now rendered alongside stocks and charts. This is the same evolving dashboard, not a separate demo.",
        pointAt: "right-panel",
      },
      {
        title: "Type in the search box",
        body: "Try typing fast. On the right, the input stays responsive even though the list below is filtering 600+ items. The filter result is a transition; your keystroke is sync.",
        pointAt: "right-panel",
      },
      {
        title: "Why the same code stalls without the fix",
        body: "Without `startTransition`, the filter and the input share priority. A slow filter eats the keystroke's frame. The diff turns one into a deferrable lane the other can preempt.",
        pointAt: "diff",
      },
      {
        title: "Pending state matters too",
        body: "The right panel shows a `pending` badge when the deferred filter is catching up. That's how you tell users 'I heard you, the list is just stale for a beat.'",
      },
    ],
  },
  {
    level: 4,
    title: "Time slicing — small chunks",
    module: "Module 5 — Time slicing",
    modules: ["05-time-slicing"],
    blurb:
      "Heavy chart work split across frames; the search box's keystrokes hit input on time even if a chart re-renders mid-stroke.",
    fixes: ["chart memo with shallow deps", "chart work ≤ 4ms per slice"],
    patch: {
      compose: "wider",
      badKeys: false,
      rowFlash: false,
      chartHeavyMs: 4,
      tickMs: 1000,
      searchDeferred: true,
      searchTransition: true,
    },
    diff: {
      file: "src/dashboard/Chart.tsx",
      title: "Memoise the series; let the scheduler split the render into ≤ 4ms slices",
      src: `  function Chart({ heavyMs = 0 }) {
-   // Old: recompute on every render, blocking the frame.
-   const series = computeSeries(points, heavyMs);

+   // New: memoised by inputs — the only re-run is when data
+   // actually changes. And the heavy work is now sliced (4ms
+   // chunks) so the frame budget is respected.
+   const series = useMemo(
+     () => computeSeries(points, heavyMs),
+     [points, heavyMs]
+   );

    return <Sparkline series={series} />;
  }`,
    },
    tour: [
      {
        title: "Same surface, more headroom",
        body: "Right panel renders the same panels with reduced chart cost per render. Frame budget stays healthy even while the tick rate is unchanged.",
        pointAt: "right-panel",
      },
      {
        title: "Open the profiler timeline",
        body: "The commit timeline in the dock now shows shorter, more uniform bars. Long tasks (>50ms) should be gone from the chart band.",
        pointAt: "profiler",
      },
      {
        title: "Why slicing isn't the same as memoising",
        body: "Memoising stops the work from running. Slicing splits it into chunks the scheduler can yield between. Both apply here for different reasons — Module 5 unpacks the distinction.",
        pointAt: "diff",
      },
    ],
  },
  {
    level: 5,
    title: "Streaming SSR + suspense",
    module: "Modules 6-8 — Hydration / Streaming / Suspense",
    modules: ["06-hydration", "07-streaming-ssr", "08-suspense"],
    blurb:
      "Recommendations now arrive in streamed chunks; the surface paints before the recs land. Chat appears via a Suspense boundary. Selective hydration keeps the page interactive throughout.",
    fixes: ["recs streamed in 3 chunks", "chat under suspense", "selective hydration order"],
    patch: {
      compose: "full",
      badKeys: false,
      rowFlash: false,
      chartHeavyMs: 4,
      tickMs: 1100,
      searchDeferred: true,
      searchTransition: true,
      streamedRecs: true,
    },
    diff: {
      file: "app/page.tsx",
      title: "Wrap async panels in Suspense boundaries with the right fallback granularity",
      src: `  <Layout>
    <Nav/>
    <Hero/>
-   {/* Old: page can't render until ALL data resolves. */}
-   <StockFeed/>
-   <Recommendations/>
-   <Chat/>

+   {/* New: shell streams immediately. Each boundary fills in
+        as its data lands. */}
+   <Suspense fallback={<StockFeedSkeleton/>}>
+     <StockFeed/>
+   </Suspense>
+   <Suspense fallback={<RecsSkeleton/>}>
+     <Recommendations/>
+   </Suspense>
+   <Suspense fallback={<ChatSkeleton/>}>
+     <Chat/>
+   </Suspense>
  </Layout>`,
    },
    tour: [
      {
        title: "Four new panels just appeared",
        body: "Chat, products, settings, recommendations. The compose prop flipped from 'wider' to 'full' — these aren't separate demos, they're new panels on the same Dashboard.",
        pointAt: "right-panel",
      },
      {
        title: "Watch the recommendations panel",
        body: "It renders empty skeleton rows for a beat, then fills in 2 items at a time over ~1 second. That's streaming — the shell didn't wait for the data.",
        pointAt: "right-panel",
      },
      {
        title: "What changed in the code",
        body: "Each async panel got wrapped in its own Suspense boundary with a fallback skeleton. The boundary is what lets the rest of the page render before the data arrives.",
        pointAt: "diff",
      },
    ],
  },
  {
    level: 6,
    title: "Islands — drop the chart's JS",
    module: "Module 9 — Islands",
    modules: ["09-islands"],
    blurb:
      "Charts become static islands. The dashboard ships ~60% less JS. The interactive panels (stocks, search, chat, settings) stay interactive.",
    fixes: ["chart shells = SSR-only", "interactive islands only ship the JS they need"],
    patch: {
      compose: "full",
      badKeys: false,
      rowFlash: false,
      chartHeavyMs: 0,
      tickMs: 1100,
      islands: true,
      searchDeferred: true,
      searchTransition: true,
      streamedRecs: true,
    },
    diff: {
      file: "src/dashboard/Dashboard.tsx",
      title: "Render the chart as a server-only shell when the page doesn't need interactivity",
      src: `  function Dashboard({ islands }) {
    return (
      <Grid>
        <StockFeed/>
-       {/* Old: client component on every page, JS shipped. */}
-       <Chart/>
+       {/* New: static SSR'd shell — zero JS for the chart. */}
+       {islands ? <StaticChartShell/> : <Chart/>}
        <ActivityFeed/>
      </Grid>
    );
  }`,
    },
    tour: [
      {
        title: "The charts look different",
        body: "On the right, the chart slots render a static gradient — no JS, no canvas, just an SSR'd shell. Visual identity preserved, bytes shipped: zero.",
        pointAt: "right-panel",
      },
      {
        title: "What you gave up",
        body: "Live updates inside the chart. If users need real-time charts, they stay as client components. If charts only re-render on data-fetches (most product dashboards), they become islands.",
      },
      {
        title: "The bundle math",
        body: "On a real production dashboard you'd see something like 240KB → 100KB shipped JS. The charts often dominate the bundle. Audit your own treemap (Module 20) to find the candidates.",
        pointAt: "diff",
      },
    ],
  },
  {
    level: 7,
    title: "Virtualised — only the visible rows",
    module: "Module 10 — Virtualization",
    modules: ["10-virtualization"],
    blurb:
      "Activity feed (now 200 items) and product grid (50+) window to only the visible rows. Scroll FPS holds.",
    fixes: ["activity feed windowed", "products grid windowed", "fixed and dynamic heights"],
    patch: {
      compose: "full",
      badKeys: false,
      rowFlash: false,
      chartHeavyMs: 0,
      tickMs: 1100,
      islands: true,
      searchDeferred: true,
      searchTransition: true,
      streamedRecs: true,
      activitySize: 200,
      virtualisedActivity: true,
      virtualisedProducts: true,
    },
    diff: {
      file: "src/dashboard/ActivityFeed.tsx",
      title: "Render only the rows in the visible window; absolute-position by index × row height",
      src: `  function ActivityFeed({ items, virtualised }) {
-   // Old: 200 rows, all in the DOM.
-   return (
-     <ul>
-       {items.map((a) => <Row key={a.id} a={a}/>)}
-     </ul>
-   );

+   if (!virtualised) return <NaiveList items={items}/>;

+   // New: window the list. Only the visible rows live in the DOM.
+   const [scrollTop, setScrollTop] = useState(0);
+   const start = Math.max(0, Math.floor(scrollTop / ROW_H) - 4);
+   const end = Math.min(items.length, start + ROWS_VISIBLE + 8);
+   const slice = items.slice(start, end);

+   return (
+     <Scroller onScroll={(t) => setScrollTop(t)}>
+       <div style={{ height: items.length * ROW_H }}>
+         <div style={{ transform: \`translateY(\${start*ROW_H}px)\` }}>
+           {slice.map((a) => <Row key={a.id} a={a}/>)}
+         </div>
+       </div>
+     </Scroller>
+   );
  }`,
    },
    tour: [
      {
        title: "Activity feed grew to 200 items",
        body: "The right panel's activity list now has 200 items, up from 40. Without virtualisation that would mean 200 DOM rows.",
        pointAt: "right-panel",
      },
      {
        title: "Scroll the activity list and watch FPS",
        body: "FPS holds steady. Only ~12 rows are in the DOM at any time. The scroller's full height is reserved by a single spacer so the scrollbar is still accurate.",
        pointAt: "profiler",
      },
      {
        title: "The trick is the absolute-positioned slice",
        body: "Inside the scroller, an outer div reserves total height. An inner div is translated by `start × ROW_H`. Only the visible rows render — but the scrollbar behaves like all 200 exist.",
        pointAt: "diff",
      },
    ],
  },
  {
    level: 8,
    title: "Compiled — auto memo everywhere",
    module: "Module 11 — React Compiler",
    modules: ["11-react-compiler"],
    blurb:
      "React Compiler memoises every render automatically. Useless re-renders disappear without a single useMemo / useCallback / React.memo call from you.",
    fixes: [
      "no manual useMemo/useCallback",
      "ProductCatalog filter cached by compiler",
      "1.4s tick — nothing wants to update faster than data changes",
    ],
    patch: {
      compose: "full",
      badKeys: false,
      rowFlash: false,
      chartHeavyMs: 0,
      tickMs: 1400,
      islands: true,
      searchDeferred: true,
      searchTransition: true,
      streamedRecs: true,
      activitySize: 200,
      virtualisedActivity: true,
      virtualisedProducts: true,
      compiled: true,
    },
    diff: {
      file: "src/dashboard/ProductCatalog.tsx",
      title: "Drop all the manual memoisation — the compiler emits an equivalent useMemoCache",
      src: `  function ProductCatalog({ size }) {
    const [q, setQ] = useState("");
    const all = makeProducts(size);

-   // Old: every render rebuilt the filtered list (it's
-   //      conditional on q, which doesn't change every tick).
-   const products = q
-     ? all.filter((p) => p.name.toLowerCase().includes(q.toLowerCase()))
-     : all;

+   // New: same source code, but the compiler emits a
+   //      useMemoCache call equivalent to useMemo(..., [all, q]).
+   //      No wrapper required. Lint flags any pattern that
+   //      breaks the assumptions.
+   const products = q
+     ? all.filter((p) => p.name.toLowerCase().includes(q.toLowerCase()))
+     : all;

    return <ProductGrid items={products}/>;
  }`,
    },
    tour: [
      {
        title: "Same source, fewer renders",
        body: "The visible code is identical between stage 7 and stage 8. Only the Compiler is now on. Renders drop because the Compiler memoises every component's outputs by input identity.",
        pointAt: "right-panel",
      },
      {
        title: "Why this isn't 'free'",
        body: "It's free of API surface — you write no hooks. It's not free of cost — every component's render now stores a cache. For tiny components, the bookkeeping outweighs the savings.",
        pointAt: "diff",
      },
      {
        title: "When you should still memoise manually",
        body: "Refs, mutable globals, external stores — the Compiler can't reason about side effects. Anything genuinely impure stays manual. Module 11 has the full list.",
      },
    ],
  },
  {
    level: 9,
    title: "Server components + actions",
    module: "Modules 12-13 — RSC + Server Actions",
    modules: ["12-server-components", "13-server-actions"],
    blurb:
      "Chat and settings now POST via Server Actions; optimistic UI gives instant feedback while the server confirms. The chart and product list are RSC — zero JS for them on the wire.",
    fixes: [
      "chat send = useOptimistic + server action",
      "settings save = optimistic + server confirm",
      "static chart + product cells stay RSC",
    ],
    patch: {
      compose: "full",
      badKeys: false,
      rowFlash: false,
      chartHeavyMs: 0,
      tickMs: 1400,
      islands: true,
      searchDeferred: true,
      searchTransition: true,
      streamedRecs: true,
      activitySize: 200,
      virtualisedActivity: true,
      virtualisedProducts: true,
      compiled: true,
      optimisticChat: true,
      optimisticSave: true,
    },
    diff: {
      file: "src/dashboard/ChatPanel.tsx",
      title: "Mount the message immediately, reconcile with the server-confirmed ID",
      src: `  function ChatPanel() {
    const [messages, setMessages] = useState(SEED);
+   const [optimistic, addOptimistic] = useOptimistic(messages);

    const send = async (text) => {
-     // Old: wait for server before showing the message.
-     const saved = await postMessage({ text });
-     setMessages((m) => [...m, saved]);

+     // New: show the message instantly, reconcile when the
+     //      server returns. Failure swaps it back automatically.
+     const tempId = Math.random();
+     addOptimistic({ id: tempId, text, pending: true });
+     const saved = await postMessage({ text });
+     setMessages((m) => [...m, saved]);
    };

-   return <List items={messages}/>;
+   return <List items={optimistic}/>;
  }`,
    },
    tour: [
      {
        title: "The chat panel feels instant",
        body: "On the right, hit send. Your message appears immediately even though there's a 700ms round-trip simulated. That's `useOptimistic`.",
        pointAt: "right-panel",
      },
      {
        title: "What happens on failure",
        body: "If the server rejected the message, the optimistic entry would swap back automatically — `useOptimistic` is bound to the canonical state, not a separate copy.",
        pointAt: "diff",
      },
      {
        title: "And the chart + products are now RSC",
        body: "The chart and the product grid render on the server. Their JS isn't shipped to the client at all. This is the bottom of the JS-shipped-per-feature curve — there's nowhere lower to go on the client side.",
      },
    ],
  },
  {
    level: 10,
    title: "Partial prerender — the post-2026 baseline",
    module: "Module 15 — Partial Prerendering",
    modules: ["14-use-hook", "15-partial-prerendering"],
    blurb:
      "Static shell + dynamic Suspense holes. Edge serves the cached shell in ~30ms; the dynamic panels stream from origin in parallel. This is what shipping looks like today.",
    fixes: [
      "static shell at the edge",
      "dynamic boundaries stream into placeholders",
      "TTFB ~30ms, LCP anchored to shell paint",
    ],
    patch: {
      compose: "full",
      badKeys: false,
      rowFlash: false,
      chartHeavyMs: 0,
      tickMs: 1400,
      islands: true,
      searchDeferred: true,
      searchTransition: true,
      streamedRecs: true,
      activitySize: 200,
      virtualisedActivity: true,
      virtualisedProducts: true,
      compiled: true,
      optimisticChat: true,
      optimisticSave: true,
    },
    diff: {
      file: "next.config.ts",
      title: "Turn on partial prerendering; mark dynamic boundaries with the experimental directive",
      src: `  // next.config.ts
+ export default {
+   experimental: {
+     ppr: "incremental",
+   },
+ };

  // app/dashboard/page.tsx
  export default function Page() {
    return (
      <Shell>
        <Nav/>        {/* static — rendered at build */}
        <Hero/>       {/* static */}
+       <Suspense fallback={<UserGreetingSkeleton/>}>
+         {/* dynamic — uses cookies(), forced to render per-request */}
+         <UserGreeting/>
+       </Suspense>
+       <Suspense fallback={<StockFeedSkeleton/>}>
+         <StockFeed/>
+       </Suspense>
      </Shell>
    );
  }`,
    },
    tour: [
      {
        title: "End of the journey",
        body: "Same Dashboard you started with eleven stages ago. Every panel here either renders on the server, ships zero JS, or windows into a fraction of its data.",
        pointAt: "right-panel",
      },
      {
        title: "What you'd see on a real PPR deployment",
        body: "30ms TTFB from a CDN-cached shell. Dynamic panels stream in over the next half-second. LCP anchored to the shell paint, not the slow data.",
        pointAt: "diff",
      },
      {
        title: "Now go back and read it backward",
        body: "Module 1 reads completely differently when you've seen the full journey. Trade-offs you couldn't name on the first pass have names now. Tap 'back to Module 1' below.",
      },
    ],
  },
];

export default function JourneyPage() {
  const [level, setLevel] = useState(0);
  const reset = useProfiler((s) => s.reset);

  useEffect(() => {
    reset();
  }, [level, reset]);

  const stage = STAGES[level];
  const prev = STAGES[Math.max(0, level - 1)];

  return (
    <article className="mx-auto w-full max-w-6xl px-4 pb-24 pt-6 sm:px-6 sm:pt-10">
      <Header level={level} />
      <Controls level={level} setLevel={setLevel} />

      {/* Tour — sits ABOVE the dashboards so a new reader sees it first */}
      <div className="mb-4">
        <StageTour stageKey={stage.level} steps={stage.tour} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <StagePanel stage={prev} dimmed={prev.level === stage.level} />
        <StagePanel stage={stage} highlighted />
      </div>

      {/* Diff sits BELOW the dashboards so the reader has the visual context first */}
      {stage.diff && (
        <div className="mt-4">
          <CodeDiff file={stage.diff.file} title={stage.diff.title} diff={stage.diff.src} />
        </div>
      )}

      <StageNotes stage={stage} />
      <Footer level={level} />
    </article>
  );
}

function Header({ level }: { level: number }) {
  return (
    <header className="mb-6">
      <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-ink-dim sm:text-[11px]">
        <span>journey</span>
        <span>·</span>
        <span className="text-accent">one codebase, eleven fixes</span>
      </div>
      <h1 className="mt-2 text-2xl font-medium tracking-tight sm:text-3xl md:text-4xl">
        The same dashboard, evolving.
      </h1>
      <p className="mt-3 max-w-3xl text-sm leading-relaxed text-ink-muted sm:text-base">
        Every module&apos;s fix applied to the <em>same</em> Dashboard surface, in order. The
        surface grows: stocks → search → notifications → chat → products → settings →
        recommendations. The profiler dock at the bottom of the page reads live from both
        panels — flip stages and watch render counters reset and recover.
      </p>
      <p className="mt-2 max-w-3xl text-sm leading-relaxed text-ink-dim">
        <span className="font-mono text-[10px] uppercase tracking-widest text-accent">tip:</span>{" "}
        open the <strong>guided tour</strong> below the controls for a step-by-step walkthrough
        of what to look at in each stage.
      </p>
      <p className="mt-1 font-mono text-[11px] text-ink-dim">
        current stage: <span className="text-accent">{String(level).padStart(2, "0")}</span> /{" "}
        {STAGES.length - 1}
      </p>
    </header>
  );
}

function Controls({ level, setLevel }: { level: number; setLevel: (n: number) => void }) {
  return (
    <div className="mb-6 rounded-lg border border-bg-border bg-bg-panel p-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="font-mono text-[10px] uppercase tracking-widest text-ink-dim">level</span>
          <input
            type="range"
            min={0}
            max={STAGES.length - 1}
            step={1}
            value={level}
            onChange={(e) => setLevel(+e.target.value)}
            className="w-48 accent-accent sm:w-72"
          />
          <span className="font-mono text-sm tabular-nums text-accent">
            {level} / {STAGES.length - 1}
          </span>
        </div>
        <div className="flex gap-2 text-xs">
          <button
            onClick={() => setLevel(Math.max(0, level - 1))}
            disabled={level === 0}
            className="rounded-md border border-bg-border bg-bg-elevated px-3 py-1.5 font-mono active:scale-95 disabled:opacity-50"
          >
            ← prev fix
          </button>
          <button
            onClick={() => setLevel(Math.min(STAGES.length - 1, level + 1))}
            disabled={level === STAGES.length - 1}
            className="rounded-md bg-accent px-3 py-1.5 font-mono text-white active:scale-95 disabled:opacity-50"
          >
            apply next fix →
          </button>
        </div>
      </div>
      <ol className="mt-3 flex flex-wrap gap-1">
        {STAGES.map((s) => (
          <li key={s.level}>
            <button
              onClick={() => setLevel(s.level)}
              className={clsx(
                "rounded-md px-2 py-1 font-mono text-[10px] uppercase tracking-widest",
                level === s.level
                  ? "bg-accent text-white"
                  : level > s.level
                  ? "border border-accent-good/40 bg-accent-good/10 text-accent-good"
                  : "border border-bg-border text-ink-muted"
              )}
            >
              {String(s.level).padStart(2, "0")} · {s.title}
            </button>
          </li>
        ))}
      </ol>
    </div>
  );
}

function StagePanel({ stage, dimmed, highlighted }: { stage: Stage; dimmed?: boolean; highlighted?: boolean }) {
  return (
    <div
      className={clsx(
        "rounded-xl border bg-bg-panel transition",
        highlighted ? "border-accent/40" : "border-bg-border",
        dimmed && "opacity-60"
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-bg-border px-3 py-2">
        <div className="flex items-center gap-2">
          <span className="font-mono text-[10px] uppercase tracking-widest text-ink-dim">
            stage {String(stage.level).padStart(2, "0")}
          </span>
          <span className="font-mono text-xs text-ink">{stage.title}</span>
        </div>
        <span className="font-mono text-[10px] text-accent">{stage.module}</span>
      </div>
      <div className="p-3">
        <ProfilerWrap id={`journey:${stage.level.toString().padStart(2, "0")}`}>
          <Dashboard {...stage.patch} />
        </ProfilerWrap>
      </div>
    </div>
  );
}

function StageNotes({ stage }: { stage: Stage }) {
  return (
    <div className="mt-6 grid gap-4 lg:grid-cols-3">
      <div className="rounded-lg border border-accent/30 bg-accent/5 p-4 lg:col-span-2">
        <div className="mb-1 font-mono text-[10px] uppercase tracking-widest text-accent">
          stage {String(stage.level).padStart(2, "0")} · {stage.module}
        </div>
        <p className="text-sm text-ink">{stage.blurb}</p>
        {stage.modules.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {stage.modules.map((slug) => (
              <Link
                key={slug}
                href={`/lab/${slug}`}
                className="rounded-md border border-bg-border bg-bg-elevated px-2 py-1 font-mono text-[10px] uppercase tracking-widest text-ink-muted hover:text-ink"
              >
                deep dive · {slug}
              </Link>
            ))}
          </div>
        )}
      </div>
      <div className="rounded-lg border border-bg-border bg-bg-panel p-4">
        <p className="mb-2 font-mono text-[10px] uppercase tracking-widest text-ink-dim">applied fixes</p>
        <ul className="space-y-1 text-xs">
          {stage.fixes.map((f, i) => (
            <li key={i} className="flex items-start gap-2 text-ink-muted">
              <span className="mt-0.5 text-accent-good">✓</span>
              <span>{f}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function Footer({ level }: { level: number }) {
  const completed = level === STAGES.length - 1;
  return (
    <nav className="mt-12 flex flex-wrap items-center justify-between gap-3 border-t border-bg-border pt-6 text-sm">
      <Link href="/lab/01-reconciliation" className="text-ink-muted hover:text-ink">
        ← back to Module 1
      </Link>
      <Link
        href="/lab/25-incident-simulator"
        className={clsx(
          "rounded-lg border px-4 py-3",
          completed
            ? "border-accent-good/40 bg-accent-good/5 text-accent-good"
            : "border-bg-border bg-bg-panel hover:border-accent/50 hover:bg-bg-elevated"
        )}
      >
        <span className="block font-mono text-[10px] uppercase tracking-widest">
          {completed ? "you finished the journey" : "end of journey"}
        </span>
        <span className="block">Take it to the incident simulator →</span>
      </Link>
    </nav>
  );
}
