export type ModuleDef = {
  slug: string;
  title: string;
  tag: string;
  hook: string;
  /** The new bottleneck that this module's fix exposes — wired into the "what's next" callout. */
  next: string;
};

export const MODULES: ModuleDef[] = [
  {
    slug: "01-reconciliation",
    title: "Reconciliation",
    tag: "renders",
    hook: "Bad keys and unstable references destroy and rebuild the world on every tick. Watch it happen.",
    next: "Diffing heuristics make these mistakes invisible — until they aren't.",
  },
  {
    slug: "02-diffing",
    title: "Diffing algorithm",
    tag: "tree-diff",
    hook: "Why React's O(n) diff is fast — and the structural assumptions that betray you when violated.",
    next: "Even a perfect diff still has to commit. The commit phase is the next wall.",
  },
  {
    slug: "03-fiber",
    title: "React Fiber",
    tag: "internals",
    hook: "Render phase, commit phase, work units, lanes. See the linked list traversed.",
    next: "Long fiber walks block input. Concurrency is the answer.",
  },
  {
    slug: "04-concurrent",
    title: "Concurrent rendering",
    tag: "scheduler",
    hook: "startTransition, deferred values, urgent vs non-urgent lanes — visualised as a queue.",
    next: "Concurrency yields between work units. But what about CPU-heavy units themselves?",
  },
  {
    slug: "05-time-slicing",
    title: "Time slicing",
    tag: "frame-budget",
    hook: "16ms is all you get. Watch React split work into chunks that respect the frame.",
    next: "Client-side scheduling can't help if the first paint is delayed by hydration.",
  },
  {
    slug: "06-hydration",
    title: "Hydration",
    tag: "ssr",
    hook: "Full → partial → progressive → selective. See interaction delays light up the overlay.",
    next: "Hydration order is still serial unless the HTML itself streams.",
  },
  {
    slug: "07-streaming-ssr",
    title: "Streaming SSR",
    tag: "stream",
    hook: "Shell first, then Suspense chunks arrive. Watch the byte stream paint the screen.",
    next: "Streaming reveals the data waterfall buried in your component tree.",
  },
  {
    slug: "08-suspense",
    title: "Suspense architecture",
    tag: "async",
    hook: "Coordinate async work without nested spinners. Backpressure becomes a first-class concept.",
    next: "Even with great async, hydrating non-interactive HTML is pure waste.",
  },
  {
    slug: "09-islands",
    title: "Island architecture",
    tag: "ship-less-js",
    hook: "What if 80% of the page never needed to be a component at all?",
    next: "Now your remaining interactive lists are huge. Time to virtualize.",
  },
  {
    slug: "10-virtualization",
    title: "Virtualization",
    tag: "windowing",
    hook: "Render 50 rows out of 50,000. DOM-node count, memory, scroll FPS — all measured live.",
    next: "All this hand-tuned memoization — what if the compiler did it for you?",
  },
  {
    slug: "11-react-compiler",
    title: "React Compiler",
    tag: "auto-memo",
    hook: "What useMemo, useCallback and React.memo become obsolete for — and where you still need to think.",
    next: "Even with perfect client renders, the network still owns first paint. Enter Server Components.",
  },
  {
    slug: "12-server-components",
    title: "Server Components",
    tag: "rsc",
    hook: "Zero-JS for the parts of your tree that don't need it. The `'use client'` line is the new architectural boundary.",
    next: "Read-only RSC is half the story. Mutations need a server boundary too.",
  },
  {
    slug: "13-server-actions",
    title: "Server Actions + Optimistic UI",
    tag: "actions",
    hook: "`'use server'`, `useActionState`, `useOptimistic`, `useFormStatus` — the new way to do mutations without an API layer.",
    next: "Server can produce data. The client needs a way to read it directly in render.",
  },
  {
    slug: "14-use-hook",
    title: "use() — read in render",
    tag: "use-api",
    hook: "Reading promises and context inline. The building block that makes Suspense and RSC click.",
    next: "And the cap on the streaming story: static shell + dynamic holes, prerendered.",
  },
  {
    slug: "15-partial-prerendering",
    title: "Partial Prerendering",
    tag: "ppr",
    hook: "Streaming SSR + ISR + edge cache rolled into one shipping model. The far end of the journey.",
    next: "And now: where does state actually live across all this? Welcome to systems engineering.",
  },

  // ─── Staff+ / Principal-level frontend systems modules ───
  {
    slug: "16-state-architecture",
    title: "State Architecture at Scale",
    tag: "state",
    hook: "Prop drilling → context explosion → store split → server cache. Why state management is the first thing to break at 1000 components.",
    next: "Even perfect state still triggers paints. Time to look at the browser pipeline.",
  },
  {
    slug: "17-browser-pipeline",
    title: "Browser Rendering Pipeline",
    tag: "pipeline",
    hook: "Style → layout → paint → composite. The four phases your framework can't hide from. Layout thrashing surgery.",
    next: "Pipeline is fast when assets arrive. Now: the network.",
  },
  {
    slug: "18-network-data",
    title: "Network & Data Fetching",
    tag: "network",
    hook: "Waterfalls, dedup, retry storms, CDN misses. Frontend networking as a queueing problem.",
    next: "One team's app is solvable. A hundred teams isn't. Welcome to microfrontends.",
  },
  {
    slug: "19-microfrontends",
    title: "Microfrontend Architecture",
    tag: "mfe",
    hook: "Module Federation, runtime contracts, shared deps, duplicate React. The org chart leaks into the bundle.",
    next: "And speaking of bundles — that's where the cost lives.",
  },
  {
    slug: "20-build-bundle",
    title: "Build Systems & Bundling",
    tag: "build",
    hook: "Tree shaking, chunk splits, dynamic imports. Why your 12MB bundle has 30KB of code that matters.",
    next: "All this shipping is invisible if blind users can't reach it.",
  },
  {
    slug: "21-accessibility",
    title: "Accessibility Engineering",
    tag: "a11y",
    hook: "Focus traps, async hydration states, screen-reader traversal. Accessibility as architecture, not a checklist.",
    next: "Working in prod ≠ working everywhere. Observability tells you when reality drifts.",
  },
  {
    slug: "22-observability",
    title: "Observability & Diagnostics",
    tag: "otel",
    hook: "RUM, OpenTelemetry, distributed traces, session replay. How frontends get observed at scale.",
    next: "Observability surfaces leaks. Now you have to fix them.",
  },
  {
    slug: "23-memory-leaks",
    title: "Memory & Leak Detection",
    tag: "memory",
    hook: "Detached DOM, stale closures, timer leaks, infinite caches. Heap growth, retention paths, GC timelines.",
    next: "Leaks are accidental. Security threats aren't.",
  },
  {
    slug: "24-security",
    title: "Frontend Security",
    tag: "security",
    hook: "XSS, hydration injection, CSP, iframe isolation, dependency compromise. Attack surfaces of a modern SPA.",
    next: "Things still break in production. The simulator teaches the muscle memory.",
  },
  {
    slug: "25-incident-simulator",
    title: "Production Incident Simulator",
    tag: "oncall",
    hook: "A live incident engine: CPU spike, hydration storm, retry feedback loop, memory leak. Inspect, hypothesise, fix, validate.",
    next: "End of the journey. Take Architect Mode into your next interview.",
  },
];

export const moduleBySlug = (slug: string) => MODULES.find((m) => m.slug === slug);
