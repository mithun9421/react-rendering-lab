export type Track = "foundations" | "core";

export type ModuleDef = {
  slug: string;
  title: string;
  tag: string;
  hook: string;
  /** The new bottleneck that this module's fix exposes — wired into the "what's next" callout. */
  next: string;
  /** Which track this module belongs to. Defaults to "core". */
  track?: Track;
};

/** Foundations — the prerequisites for the rest of the lab. */
export const FOUNDATIONS: ModuleDef[] = [
  {
    slug: "f01-components",
    title: "Components & JSX",
    tag: "jsx",
    hook: "Function components, JSX compiles to React.createElement, Fragments, and why <App/> is a value, not an instance.",
    next: "Components alone are static. They need inputs.",
    track: "foundations",
  },
  {
    slug: "f02-props",
    title: "Props & composition",
    tag: "props",
    hook: "Pass data down. Pass children through. Composition over configuration — the React way to extend a component.",
    next: "Props change from above; what about state that lives inside?",
    track: "foundations",
  },
  {
    slug: "f03-state",
    title: "State with useState",
    tag: "state",
    hook: "Where state lives, why setState is async, the stale-closure trap, lazy init, and the right level to put each piece.",
    next: "State drives renders. But some work has to happen outside render.",
    track: "foundations",
  },
  {
    slug: "f04-effects",
    title: "Effects with useEffect",
    tag: "effects",
    hook: "When effects run, why the deps array matters, cleanup, the StrictMode double-fire, and the patterns that aren't effects.",
    next: "Effects react to changes. The user reacts to clicks.",
    track: "foundations",
  },
  {
    slug: "f05-events",
    title: "Events & handlers",
    tag: "events",
    hook: "Synthetic events, event delegation, passing args to handlers, why React doesn't need addEventListener.",
    next: "Events trigger renders. Renders produce UI from data shapes.",
    track: "foundations",
  },
  {
    slug: "f06-rendering",
    title: "Rendering — conditional + lists",
    tag: "render",
    hook: "Short-circuit && pitfalls, the ternary, list keys (a teaser for Module 1), Fragments in lists.",
    next: "Lists need stable, focused inputs. Forms are how we get them.",
    track: "foundations",
  },
  {
    slug: "f07-forms",
    title: "Forms — controlled inputs",
    tag: "forms",
    hook: "Controlled vs uncontrolled, the value/onChange contract, working with checkboxes/selects/radios.",
    next: "Some state isn't UI state — it's a value you read but don't render.",
    track: "foundations",
  },
  {
    slug: "f08-refs",
    title: "Refs with useRef",
    tag: "refs",
    hook: "Mutable values that don't trigger re-renders. DOM access. Why a ref isn't state.",
    next: "Drilling values through props gets ugly. Context flattens the path.",
    track: "foundations",
  },
  {
    slug: "f09-context",
    title: "Context — passing data through the tree",
    tag: "context",
    hook: "createContext + Provider + useContext. The 're-renders all consumers' trap. The new <Context value> shorthand.",
    next: "Once you reuse logic, you reach for hooks of your own.",
    track: "foundations",
  },
  {
    slug: "f10-custom-hooks",
    title: "Custom hooks — extract & compose logic",
    tag: "hooks",
    hook: "When to extract a hook, naming (use-prefix), composition, returning tuples vs objects, generic typing.",
    next: "All of this only works if your components obey the Rules of React.",
    track: "foundations",
  },
  {
    slug: "f11-rules",
    title: "The Rules of React",
    tag: "rules",
    hook: "Pure renders, immutable state, hook order, no side effects in render. The contract the Compiler enforces statically.",
    next: "You now have everything you need for Module 1 — Reconciliation.",
    track: "foundations",
  },
];

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

/** All modules, foundations first, then core. */
export const ALL_MODULES: ModuleDef[] = [...FOUNDATIONS, ...MODULES];

export const moduleBySlug = (slug: string) =>
  ALL_MODULES.find((m) => m.slug === slug);
