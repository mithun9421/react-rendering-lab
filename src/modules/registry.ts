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
    next: "And now you're back to thinking about reconciliation keys. The loop closes.",
  },
];

export const moduleBySlug = (slug: string) => MODULES.find((m) => m.slug === slug);
