/**
 * Staff+/Principal interview question bank.
 *
 * Each question is a small judgment call dressed up as a multi-choice. The
 * goal isn't to test memorisation — it's to surface the conceptual trap each
 * question hides, with the model answer doing the actual teaching.
 *
 * Adding questions: append to QUESTIONS. Each question MUST have exactly one
 * `correct: true` option. The lab UI sorts/picks by difficulty.
 */

export type QuestionKind =
  | "debug" //  here's a symptom — find the cause
  | "design" //  how would you build X
  | "tradeoff" //  pick A or B and defend it
  | "internals"; //  React mechanism question

export type Choice = {
  id: string;
  text: string;
  correct?: true;
  /** Why this is right or wrong. Renders after the user commits. */
  rationale: string;
};

export type Question = {
  id: string;
  kind: QuestionKind;
  difficulty: 1 | 2 | 3 | 4 | 5;
  /** Short, scannable. */
  title: string;
  /** The setup — 1-3 sentences max. */
  scenario: string;
  /** Optional code block to inline. */
  code?: string;
  choices: Choice[];
  /** Model answer narrative — the "if you were sitting across from someone" version. */
  modelAnswer: string;
  /** Which module(s) this echoes — links displayed after the reveal. */
  modules?: string[];
};

export const QUESTIONS: Question[] = [
  {
    id: "q-rerender-storm",
    kind: "debug",
    difficulty: 2,
    title: "Why does this list re-render every tick?",
    scenario:
      "A 50-row stock feed re-renders every row every second, even when only one symbol's price changes. State updates land via setStocks(newArray).",
    code: `function StockFeed({ stocks }) {
  return stocks.map((s, i) => (
    <StockRow key={i} stock={s} style={{ padding: 8 }} />
  ));
}`,
    choices: [
      {
        id: "a",
        text: "key={i} — React reuses fibers positionally; when the array re-renders the new s at slot i looks like the old s.",
        correct: true,
        rationale:
          "Index keys are the classic. Two problems compound: identity-by-position prevents real fiber reuse on reorders, and style={{padding:8}} creates a new object identity every render which busts memoisation if rows are wrapped in React.memo.",
      },
      {
        id: "b",
        text: "Parent re-renders too often. Add useMemo around stocks.",
        rationale:
          "Wrong target. The parent re-rendering with the same stocks is what *should* happen. The issue is the children don't reuse — that's a key problem, not a parent problem.",
      },
      {
        id: "c",
        text: "stocks is mutated in place. State equality check sees the same reference and forces re-render.",
        rationale:
          "Backwards — if the reference were the same, React would NOT re-render. The setStocks(newArray) creates a new array on every tick, which is correct.",
      },
      {
        id: "d",
        text: "StockRow isn't wrapped in memo. Wrap it.",
        rationale:
          "Wrapping in memo without fixing the key + inline style identity gains you almost nothing. memo's shallow compare sees a new style object and a new key-derived prop chain. Fix the inputs first.",
      },
    ],
    modelAnswer:
      "Two compounding issues. The key={i} bug is bigger: positional identity means a reorder is invisible to React, so a row that moved doesn't reuse its fiber, focus, or scroll position. Fix it with key={s.sym}. Then the inline style object — every render produces a new {padding:8} — busts shallow memo. Hoist it to a module constant or styling system. After both fixes, only rows whose data actually changed re-render.",
    modules: ["01-reconciliation"],
  },
  {
    id: "q-hydration-iOS",
    kind: "debug",
    difficulty: 3,
    title: "Hydration warning storm — only on iOS",
    scenario:
      "Production shows 'Text content did not match' warnings on every page load. 30% of iOS sessions affected; desktop Safari is fine. The page renders new Date().toLocaleTimeString() in the header.",
    choices: [
      {
        id: "a",
        text: "Server clock drift. Sync the server's NTP.",
        rationale:
          "Plausible but not the root cause. Even a perfectly-NTP'd server formats Date in UTC unless you set a TZ; the client uses the user's local. The mismatch is locale + timezone, not clock drift.",
      },
      {
        id: "b",
        text: "toLocaleTimeString() — server uses UTC, browser uses the device's tz. iOS users in non-UTC tz see different strings.",
        correct: true,
        rationale:
          "Exactly. The function depends on the runtime's locale and timezone. Server-side Node uses UTC; iOS Safari uses the device tz. The fix: render a stable placeholder on the server, swap to the localised string after mount via useEffect.",
      },
      {
        id: "c",
        text: "iOS Safari hydration is just slower; React gives up.",
        rationale:
          "Not how React 19 handles hydration. It will retry the affected boundary, not 'give up'. The warning is content-mismatch, not timeout.",
      },
      {
        id: "d",
        text: "A third-party script ran before hydration finished.",
        rationale:
          "Worth investigating in general, but the specific warning here is text-content mismatch — exactly the shape of locale/tz-dependent rendering. Not a third-party script.",
      },
    ],
    modelAnswer:
      "Locale-sensitive Date formatting is the #1 source of platform-specific hydration mismatches. The fix has two parts: (1) render a stable placeholder server-side (e.g. an ISO string or an empty span); (2) replace with toLocaleTimeString in a useEffect after mount. As a last resort you can mark the boundary with suppressHydrationWarning — but only if both sides are deliberately allowed to diverge and you've thought through what users see during hydration.",
    modules: ["06-hydration"],
  },
  {
    id: "q-retry-storm",
    kind: "debug",
    difficulty: 4,
    title: "Origin restarted; frontend fired 9000 req/sec",
    scenario:
      "An origin service blipped for 4 seconds during deploy. The frontend's fetch wrapper retried 5xx responses immediately and kept refiring. Origin recovery took 6 minutes instead of the deploy's 30s.",
    choices: [
      {
        id: "a",
        text: "React Query's refetchInterval was too low.",
        rationale:
          "Not the cause — refetchInterval triggers polling on a clock, not on 5xx. 9000 req/sec means each component refired on each failure, not on the interval.",
      },
      {
        id: "b",
        text: "Retry on 5xx with delay:0 + shared cache key. Every component retried in the same microtask, multiplying with each render.",
        correct: true,
        rationale:
          "The amplifier. Linear retry × shared cache invalidation × component re-renders = exponential req rate. Without backoff/jitter/circuit breaker, the frontend is a load amplifier during exactly the moment the origin is fragile.",
      },
      {
        id: "c",
        text: "Service worker bypassed the fresh cache.",
        rationale:
          "Possible in some apps but won't drive a 9000 req/sec spike on its own. The retry strategy IS the cause.",
      },
      {
        id: "d",
        text: "Browser HTTP/2 connection coalescing tried too many concurrent streams.",
        rationale:
          "Browser connection management would limit concurrency, not increase it. Misattribution — the cause is the application-layer retry.",
      },
    ],
    modelAnswer:
      "Frontends without retry backoff are amplifiers during incidents. Production-grade retry needs four things: exponential backoff (delay = base * 2^attempt), jitter (delay *= 0.5 + random), a max-retry cap, and a circuit breaker that opens for N seconds after K consecutive failures across the shared cache key. The circuit breaker is the key one — it stops the herd at the source. Module 18 has a working simulator.",
    modules: ["18-network-data", "25-incident-simulator"],
  },
  {
    id: "q-suspense-boundary-placement",
    kind: "design",
    difficulty: 3,
    title: "Profile + Orders + Recs each take 300ms / 600ms / 900ms",
    scenario:
      "You're rendering a dashboard. Three async components fetch in parallel. Where do you put Suspense boundaries?",
    choices: [
      {
        id: "a",
        text: "One boundary above all three. Show one skeleton until the slowest finishes.",
        rationale:
          "Coherent but pessimistic. The user waits 900ms even though profile + orders were ready at 600. Use only when the trio is a 'card' that semantically appears together.",
      },
      {
        id: "b",
        text: "One boundary per component. Each finishes independently.",
        rationale:
          "Fastest perceived latency but flickery — three skeletons replace independently. Right when each component is genuinely independent.",
      },
      {
        id: "c",
        text: "Boundary above profile (urgent) + one above orders+recs. Profile shows fast; the other two share a boundary.",
        correct: true,
        rationale:
          "The judgment call. Group related slow things behind one boundary; the fastest, most critical thing gets its own. This is the 'designer-y' Suspense layout — most production apps end up here after iteration.",
      },
      {
        id: "d",
        text: "No boundaries — wait for everything before rendering anything.",
        rationale:
          "Defeats the point of Suspense. Without boundaries you're back to all-or-nothing rendering, which is what Suspense exists to fix.",
      },
    ],
    modelAnswer:
      "Suspense boundaries are a UX decision, not a performance toggle. The right placement balances 'how independent is this data?' against 'how distracting is it if these things appear at different times?'. Mark the *critical* path with its own boundary (profile here — users want to know who they are first), then group the auxiliary data behind a shared boundary so the UI doesn't flicker.",
    modules: ["08-suspense"],
  },
  {
    id: "q-rsc-vs-client",
    kind: "design",
    difficulty: 3,
    title: "Server Component or Client Component?",
    scenario:
      "You're building a product detail page with an image gallery, a 'related products' carousel, and an 'add to cart' button. Which parts should be Client vs Server Components?",
    choices: [
      {
        id: "a",
        text: "All Client — easier to reason about.",
        rationale:
          "Ships unnecessary JS for static parts. The image gallery markup, the page layout, the related-products data — all of that is server-renderable and doesn't need to hydrate.",
      },
      {
        id: "b",
        text: "All Server — RSC is the default.",
        rationale:
          "Doesn't work: 'add to cart' needs interactivity. Server Components can't have onClick handlers or useState.",
      },
      {
        id: "c",
        text: "Page is Server. Carousel + add-to-cart are tiny Client leaves. Carousel receives image data as props from the server.",
        correct: true,
        rationale:
          "The 'push 'use client' to the leaves' rule. The page composition, data fetching, and most rendering stays server-side. Only the genuinely interactive bits cross the boundary, and they take their data as props from the server.",
      },
      {
        id: "d",
        text: "Make the whole page a Client Component but lazy-load the add-to-cart.",
        rationale:
          "Lazy loading is orthogonal — you'd still ship the page's JS, just split across chunks. The point is to not write that JS at all where you don't need it.",
      },
    ],
    modelAnswer:
      "The default should be Server. Drop 'use client' only where you need state, effects, browser APIs, or event handlers — and put it on the smallest possible component. A common pattern is a Server page rendering a static layout, with one or two Client leaves embedded for interactivity. Bonus: a Server Component can render a Client Component AND pass another Server Component as that Client's children — the Client wrapper provides interactivity without dragging its content client-side.",
    modules: ["12-server-components"],
  },
  {
    id: "q-when-not-memo",
    kind: "tradeoff",
    difficulty: 2,
    title: "When is React.memo NOT worth it?",
    scenario:
      "A junior engineer wraps every component in React.memo 'because it's free perf'. What do you tell them?",
    choices: [
      {
        id: "a",
        text: "Always wrap — memo is genuinely free.",
        rationale:
          "Wrong on both counts. memo has bookkeeping cost (the shallow comparison runs every render) and an opportunity cost (it can mask real issues like unstable prop identity).",
      },
      {
        id: "b",
        text: "Skip for tiny components, components whose parent renders less than the child, or when props are objects/functions created inline.",
        correct: true,
        rationale:
          "The full answer. memo costs a comparison every render — for a one-line component, the comparison is more expensive than the render itself. And if props are inline objects, memo's comparison always returns 'changed' so you pay the cost without the benefit.",
      },
      {
        id: "c",
        text: "Only skip memo on form inputs.",
        rationale:
          "Too narrow. The principle generalises.",
      },
      {
        id: "d",
        text: "Always skip memo if you ship React Compiler.",
        rationale:
          "Closer to right but oversimplified. The Compiler memoises automatically — manual memo on top is redundant but not actively harmful. The 'when not to memo' question is more interesting in non-compiled codebases.",
      },
    ],
    modelAnswer:
      "memo has a real cost — the shallow prop comparison runs every render. For cheap components, that cost exceeds the work memo saves. Memo earns its keep when (a) the component is expensive AND (b) its parent re-renders much more often than its props change AND (c) the props have stable identity. Violating any condition makes memo dead weight. React Compiler subsumes all of this — when shipping the Compiler, treat manual memo as a smell.",
    modules: ["01-reconciliation", "11-react-compiler"],
  },
  {
    id: "q-state-where",
    kind: "design",
    difficulty: 3,
    title: "Where does the cart count live?",
    scenario:
      "A 50-component e-commerce app has a header showing cart count, a checkout page that mutates the cart, and many components reading from the cart. Where does cart state live?",
    choices: [
      {
        id: "a",
        text: "Top-level useState in App, drilled through props.",
        rationale:
          "Works but every state change re-renders App, which re-renders every child. At 50 components this thrashes the tree on every cart action.",
      },
      {
        id: "b",
        text: "React Context with the cart object as the value.",
        rationale:
          "Slightly better than drilling but every consumer re-renders on any cart change — even ones reading only count, not the items. Context fans out indiscriminately.",
      },
      {
        id: "c",
        text: "External store (Zustand/Redux/Jotai). Components subscribe via selectors that only re-render when their slice changes.",
        correct: true,
        rationale:
          "The production answer. Selectors via useSyncExternalStore guarantee the header re-renders only on count change, not item-detail change. Tree-wide propagation cost disappears.",
      },
      {
        id: "d",
        text: "URL params — encode cart count in the query string.",
        rationale:
          "Persists across reloads but creates absurd navigation history and round-trips every state change through the router. Not a state layer.",
      },
    ],
    modelAnswer:
      "Cross-cutting client state belongs in a store with selector-based reads. Context is for stable values that rarely change (theme, locale, auth user). For frequently-changing shared state, an external store with useSyncExternalStore gives you fine-grained subscriptions — components re-render only when their specific slice changes. Server data, separately, belongs in React Query / SWR / RSC — not in the same store as client state.",
    modules: ["16-state-architecture"],
  },
  {
    id: "q-fiber-yield",
    kind: "internals",
    difficulty: 4,
    title: "Why is React Fiber interruptible but the commit phase isn't?",
    scenario:
      "Explain why React can yield mid-render but not mid-commit.",
    choices: [
      {
        id: "a",
        text: "Render phase mutates the alternate fiber tree (a copy). Commit phase mutates the live DOM. You can't half-mutate the DOM and yield to the browser.",
        correct: true,
        rationale:
          "The whole answer. Render works against the work-in-progress alternate tree; if the scheduler yields, no user-visible state was changed. Commit applies the changes to the real DOM, refs, and effects — these can't be 'half-applied' without leaving the UI in an inconsistent state.",
      },
      {
        id: "b",
        text: "The commit phase doesn't have shouldYield() checks. The render phase does.",
        rationale:
          "True but circular — that just restates the design. The question is why React's authors made it that way. The answer is the answer above.",
      },
      {
        id: "c",
        text: "The commit phase is too short to bother yielding.",
        rationale:
          "It's often short, not always. A commit with many DOM mutations and effects can blow the frame budget. The reason it's uninterruptible isn't duration — it's atomicity.",
      },
      {
        id: "d",
        text: "Effects need to run synchronously in commit.",
        rationale:
          "useLayoutEffect runs in layout sub-phase, yes. But useEffect runs in passive phase, which is scheduled async. Effects aren't the constraint — DOM atomicity is.",
      },
    ],
    modelAnswer:
      "React keeps two trees: current (what's on screen) and the work-in-progress alternate. The render phase mutates the alternate. If the scheduler interrupts mid-render, the alternate is discarded and started fresh — the current tree is untouched. The commit phase swaps the alternate in by applying DOM mutations, refs, and layout effects. Once that begins, you can't partially apply changes and leave — the DOM and the React tree would diverge. So render = interruptible (mutates only a buffer); commit = atomic (mutates user-visible state).",
    modules: ["03-fiber"],
  },
  {
    id: "q-virtualisation-cost",
    kind: "tradeoff",
    difficulty: 3,
    title: "Cost of virtualisation",
    scenario:
      "You're virtualising a list. What do you give up?",
    choices: [
      {
        id: "a",
        text: "Nothing — virtualisation is strictly better.",
        rationale:
          "Not free. You give up several things (see correct answer). Many lists shouldn't be virtualised.",
      },
      {
        id: "b",
        text: "In-page Cmd+F search of off-screen content, screen-reader traversal of the full list, anchor-link navigation, simple CSS that assumes contiguous siblings, and accurate page-down scrolling.",
        correct: true,
        rationale:
          "All real. Off-screen rows don't exist in the DOM, so they don't show up in find, AT traversal, anchor links, or :nth-child selectors. Accurate scrollbar position requires extra work (heights API or pre-measured).",
      },
      {
        id: "c",
        text: "Only memory.",
        rationale:
          "Memory is what you gain, not what you lose.",
      },
      {
        id: "d",
        text: "Cross-row drag-and-drop.",
        rationale:
          "Drag-and-drop libraries usually handle this. Not the main cost.",
      },
    ],
    modelAnswer:
      "Virtualisation trades correctness on rare paths for performance on the hot path. The biggest casualty in production is accessibility — screen readers traverse the DOM, so they only 'see' what's currently mounted. The fix is to expose the virtualised list via aria-rowcount + aria-rowindex and to ensure your virtualiser updates these. Don't virtualise unless the list is large enough to need it (~200+ rows or expensive-per-row components).",
    modules: ["10-virtualization", "21-accessibility"],
  },
  {
    id: "q-csp-strict",
    kind: "design",
    difficulty: 4,
    title: "Strict CSP — what's the right starting policy?",
    scenario:
      "You're hardening a React app with Content-Security-Policy. Which header is most defensible against XSS while still letting the app work?",
    choices: [
      {
        id: "a",
        text: "default-src 'self'; script-src 'self' 'unsafe-inline'",
        rationale:
          "'unsafe-inline' on script-src is the same as no CSP for XSS purposes. Any injected <script> runs.",
      },
      {
        id: "b",
        text: "default-src 'self'",
        rationale:
          "Better, but inline scripts are still allowed (default-src governs only the resources without their own directive). If a Next.js page has inline initialisation scripts, they need an explicit policy.",
      },
      {
        id: "c",
        text: "default-src 'self'; script-src 'nonce-r4Nd0m' 'strict-dynamic'; object-src 'none'; base-uri 'none'",
        correct: true,
        rationale:
          "Strict CSP with nonces + strict-dynamic. Only scripts your server explicitly nonces will run; transitively-imported scripts inherit trust. object-src 'none' kills Flash-era vectors; base-uri 'none' prevents <base> hijacking.",
      },
      {
        id: "d",
        text: "Content-Security-Policy-Report-Only: default-src 'self'",
        rationale:
          "Report-Only is for monitoring — it doesn't enforce anything. Useful while rolling out, not a final policy.",
      },
    ],
    modelAnswer:
      "The 2026 best practice is strict CSP with nonces + strict-dynamic. Your server generates a fresh nonce per response; only scripts with that nonce run. strict-dynamic means a script that *did* get loaded (matching the nonce) can dynamically import other scripts without each needing its own nonce. Next.js 13+ supports this natively via middleware. The directives object-src 'none' + base-uri 'none' close two more historical XSS vectors that 'self' alone doesn't.",
    modules: ["24-security"],
  },
  {
    id: "q-optimistic-failure",
    kind: "tradeoff",
    difficulty: 3,
    title: "Optimistic UI fails — what do you show?",
    scenario:
      "useOptimistic showed the user's message instantly. The server rejected it 800ms later. What's the best UX recovery?",
    choices: [
      {
        id: "a",
        text: "Quietly remove the message from the chat.",
        rationale:
          "Worst option — user thinks their message went through, sees it vanish later, has no idea why. Trust is destroyed.",
      },
      {
        id: "b",
        text: "Toast with 'Message failed' but leave the message in place.",
        rationale:
          "Better, but the message still looks shipped in the chat. Easy to miss the toast on mobile.",
      },
      {
        id: "c",
        text: "Restyle the message in-place (red border, 'tap to retry'). State the failure on the message itself, give a retry action.",
        correct: true,
        rationale:
          "Locates the failure where the user expects to see it (the chat bubble), gives them a clear next action (retry), and preserves the typed content so it's not lost.",
      },
      {
        id: "d",
        text: "Redirect to an error page.",
        rationale:
          "Catastrophic for a single message failure. Loses the user's context entirely.",
      },
    ],
    modelAnswer:
      "Optimistic UI's contract is 'instant feedback, eventual consistency.' Failure has to be visible at the same surface where the optimistic state was shown — that's why useOptimistic ties the optimistic value to the canonical state (when the action errors or the action returns a contradicting value, the optimistic mount is replaced). The UI should reflect the new state via styling on the offending item plus an obvious retry affordance. Toasts are for context-free notifications, not for surface-specific failures.",
    modules: ["13-server-actions"],
  },
  {
    id: "q-bundle-budget",
    kind: "design",
    difficulty: 3,
    title: "Your initial bundle is 600KB. How do you cut it in half?",
    scenario:
      "Lighthouse blames JS execution. Bundle analyzer shows: react+react-dom 142KB, moment 67KB, lodash full 71KB, framer-motion 58KB, two route-level components 130KB total, the rest is leaf logic.",
    choices: [
      {
        id: "a",
        text: "Tree-shake — switch named imports, drop full moment + lodash for date-fns + lodash-es.",
        rationale:
          "Significant but won't halve. The non-tree-shakeable bundles (react itself) are ~150KB you can't easily cut.",
      },
      {
        id: "b",
        text: "Code-split the two route-level components behind dynamic import().",
        rationale:
          "Helps a lot — 130KB out of the initial bundle if those routes aren't on the critical path. But this alone won't halve either.",
      },
      {
        id: "c",
        text: "Both — tree-shake the libraries (~100KB out) AND code-split the routes (~130KB out). Then audit polyfills and switch to a modern browserslist target.",
        correct: true,
        rationale:
          "The realistic plan. Single levers don't halve a bundle; combining the top 2-3 levers usually does. Polyfills are the secret 3rd lever — modernizr-style transforms can drop ~30KB by themselves.",
      },
      {
        id: "d",
        text: "Migrate to Preact.",
        rationale:
          "Drops react+react-dom by ~120KB but is a multi-week migration with compatibility risk. Used as a last resort.",
      },
    ],
    modelAnswer:
      "Bundle reduction is rarely one lever. The order of payoff is usually: tree-shake (named imports, sideEffects:false, ESM-only deps), code-split (dynamic import for non-critical-path routes), library swaps (moment → date-fns, lodash → es-toolkit), dead-code elimination (knip/depcheck), modern polyfill target (browserslist tight). Combining the top three usually halves the bundle. The fourth and fifth save 5-10% each — meaningful but not transformative.",
    modules: ["20-build-bundle"],
  },
];

export function pickByCategory(kind: QuestionKind | "all", seed: number): Question {
  const pool = kind === "all" ? QUESTIONS : QUESTIONS.filter((q) => q.kind === kind);
  return pool[seed % pool.length];
}
