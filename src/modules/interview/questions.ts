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

  /* ───────── Foundations-level questions ───────── */

  {
    id: "q-useeffect-deps",
    kind: "debug",
    difficulty: 2,
    title: "Why does this effect run every render?",
    scenario: "An effect should run once when `userId` changes. Instead it runs every render.",
    code: `useEffect(() => {
  fetchUser({ id: userId });
}, [{ id: userId }]);`,
    choices: [
      {
        id: "a",
        text: "Inline object in the deps array creates a new identity every render; the deps comparison sees it as 'changed' every time.",
        correct: true,
        rationale:
          "React compares deps with Object.is. A fresh object literal is never === to the previous one. Depend on the primitive `userId` instead of an object containing it.",
      },
      {
        id: "b",
        text: "Effect callbacks always run every render.",
        rationale: "Not true — they run when deps change. The deps array exists to control this.",
      },
      {
        id: "c",
        text: "fetchUser triggers a re-render and the effect re-runs in a loop.",
        rationale:
          "A separate possible bug, but doesn't explain why the FIRST render's effect alone is replayed every render. The deps-identity bug is the cause here.",
      },
      {
        id: "d",
        text: "userId is a string and React requires numbers in deps.",
        rationale: "Deps can be any type. React just uses Object.is to compare.",
      },
    ],
    modelAnswer:
      "Object literals are identity traps. Every render produces a fresh object, so React's Object.is check on the deps array always reports 'changed.' Fix: depend on the primitive (`[userId]`). If you really need an object, useMemo it with primitive deps so its identity is stable.",
    modules: ["f04-effects", "01-reconciliation"],
  },
  {
    id: "q-state-async",
    kind: "internals",
    difficulty: 2,
    title: "console.log after setState shows the OLD value. Why?",
    scenario: "You call setCount(count + 1); then console.log(count). The log shows the previous count, not the incremented one.",
    code: `const [count, setCount] = useState(0);
function increment() {
  setCount(count + 1);
  console.log(count);  // logs 0 even after click
}`,
    choices: [
      {
        id: "a",
        text: "setState is asynchronous in the sense that it schedules a re-render. `count` here is the value captured by this render's closure — it doesn't change mid-handler.",
        correct: true,
        rationale:
          "Closures freeze the value at render time. The next render will see the new count, but the currently-executing handler holds the old one. This is a feature, not a bug — it keeps your handlers consistent.",
      },
      {
        id: "b",
        text: "setCount is broken; use the imperative API.",
        rationale: "There is no imperative API in function components. This is by design.",
      },
      {
        id: "c",
        text: "React batches setState calls and applies them later.",
        rationale:
          "True about batching, but not why `count` is stale. Even if React applied the update immediately, the local `count` variable was captured at render and won't change.",
      },
      {
        id: "d",
        text: "console.log is asynchronous in React.",
        rationale: "console.log runs synchronously. Nothing magical here.",
      },
    ],
    modelAnswer:
      "Two concepts conflated: setState schedules a new render (you'll see the new value in the next render's closure), and closures capture values at render time (the current handler's `count` is frozen). To use the latest value mid-handler, either compute it locally (`const next = count + 1; setCount(next); log(next);`) or use the updater form (`setCount(c => c + 1)`) which receives the latest pending value.",
    modules: ["f03-state"],
  },
  {
    id: "q-key-vs-id",
    kind: "internals",
    difficulty: 2,
    title: "Can the `key` prop be read inside the component?",
    scenario: "You pass `<Row key={user.id} user={user}/>`. Inside Row, can you read `props.key`?",
    choices: [
      {
        id: "a",
        text: "Yes — props.key is just a normal prop.",
        rationale: "It is not. React strips `key` from props before passing them down.",
      },
      {
        id: "b",
        text: "No — key is special. React uses it for reconciliation and doesn't forward it as a prop. Pass `id={user.id}` if you also need to read it.",
        correct: true,
        rationale:
          "key + ref are the two 'special' props React intercepts. Their job is identity/scheduling, not data. To use the same value inside the component, pass it as a separate prop.",
      },
      {
        id: "c",
        text: "Only if you use forwardRef.",
        rationale: "forwardRef is for refs, not keys. Keys are unrelated.",
      },
      {
        id: "d",
        text: "Yes, but only in class components.",
        rationale: "False in both class and function components.",
      },
    ],
    modelAnswer:
      "`key` and `ref` are the two reserved props React strips before forwarding. They serve framework-internal purposes (identity for reconciliation; imperative handle for refs). Common gotcha: you have a stable id you also want to render — pass it twice: `<Row key={id} id={id}/>`. Awkward but explicit, and it's the documented pattern.",
    modules: ["f01-components", "01-reconciliation"],
  },
  {
    id: "q-state-vs-ref",
    kind: "tradeoff",
    difficulty: 2,
    title: "State or ref?",
    scenario:
      "You need to hold a value that changes over time but the UI doesn't display it. (Examples: an interval id, a previous-render snapshot for comparison, a DOM element reference.)",
    choices: [
      {
        id: "a",
        text: "useState — always. State is React's mental model.",
        rationale:
          "useState triggers a re-render on update. If the value isn't displayed, you're causing useless re-renders for a value the UI doesn't care about.",
      },
      {
        id: "b",
        text: "useRef — its `.current` is mutable and doesn't trigger renders. Perfect for values the UI doesn't read.",
        correct: true,
        rationale:
          "A ref is React's escape hatch for 'I need a place to put this between renders, no rendering implications.' Don't write `ref.current` during render — that's impure — but reading + writing it in handlers / effects is fine.",
      },
      {
        id: "c",
        text: "A module-level variable — fastest.",
        rationale: "Module variables are shared across components and tabs. Refs are per-instance.",
      },
      {
        id: "d",
        text: "useReducer with a no-op action.",
        rationale: "Solves the wrong problem and still triggers renders.",
      },
    ],
    modelAnswer:
      "If the UI displays it → state. If the UI doesn't display it → ref. State triggers re-renders by design; ref doesn't. Common ref use cases: interval/timeout ids you want to clear in cleanup, the latest version of a value inside a stable callback, DOM element references via the `ref` prop. Rule: never mutate or read ref.current during render — only in effects or handlers.",
    modules: ["f08-refs"],
  },
  {
    id: "q-lift-state",
    kind: "design",
    difficulty: 2,
    title: "Two siblings need to share the same value. Where does it live?",
    scenario:
      "A search input and a results list. Typing in the input filters the list. The state currently lives in the input.",
    choices: [
      {
        id: "a",
        text: "Lift the state to their common parent. Parent owns the search string; passes it down to both as a prop / via callbacks.",
        correct: true,
        rationale:
          "The 'lifting state up' pattern. The parent becomes the single source of truth. Both children become controlled by props.",
      },
      {
        id: "b",
        text: "Put a context at the root and read it from both.",
        rationale:
          "Works but is overkill for two siblings. Context shines when the value crosses many layers. Save it for when prop drilling becomes a literal problem.",
      },
      {
        id: "c",
        text: "Use a global store like Zustand.",
        rationale:
          "Same overkill argument. A 50-line component doesn't need a store. Add stores when state needs to be addressed from multiple non-parent-child paths.",
      },
      {
        id: "d",
        text: "Synchronize the state via useEffect.",
        rationale:
          "An effect to sync two pieces of state in the same direction is almost always a sign the state should be lifted up instead.",
      },
    ],
    modelAnswer:
      "Lifting state up is React's default answer to sibling coordination. The parent owns the state, both children become 'controlled' by props from above. This stays clean up to ~3 levels. When the prop-drilling gets painful (passing the same value through 4+ components that don't use it), then reach for context. When components in different subtrees need it, reach for a store.",
    modules: ["f03-state", "16-state-architecture"],
  },
  {
    id: "q-controlled-input",
    kind: "design",
    difficulty: 1,
    title: "Controlled or uncontrolled input?",
    scenario: "A signup form's email field.",
    choices: [
      {
        id: "a",
        text: "Controlled — `value={email}` + `onChange={...setEmail(e.target.value)}`. State drives the input.",
        correct: true,
        rationale:
          "Controlled is the default for most product code. You can validate on every keystroke, format/transform, disable submit when invalid, and the value is always in sync with state.",
      },
      {
        id: "b",
        text: "Uncontrolled — let the DOM hold the value; read it via a ref on submit.",
        rationale:
          "Uncontrolled is useful for very large forms (every keystroke re-rendering a tree gets expensive) or when integrating with a library that needs the DOM as source of truth. Default to controlled.",
      },
      {
        id: "c",
        text: "Use both — bind value and read via ref.",
        rationale: "Confusing and unnecessary. Pick one.",
      },
      {
        id: "d",
        text: "Always controlled — React doesn't support uncontrolled.",
        rationale: "React does support uncontrolled (defaultValue + refs). Choose deliberately.",
      },
    ],
    modelAnswer:
      "Default to controlled — state drives the input, every keystroke goes through React. You get instant validation, formatting, conditional disable, the works. Reach for uncontrolled when you have many fields and re-rendering on every keystroke costs more than the validation/sync benefit — or when interfacing with imperative third-party widgets.",
    modules: ["f07-forms"],
  },
  {
    id: "q-custom-hook-naming",
    kind: "design",
    difficulty: 1,
    title: "Why must custom hooks start with `use`?",
    scenario: "You wrote a helper `function getUserStatus(id) { ... }` that calls useState inside. ESLint refuses to compile.",
    choices: [
      {
        id: "a",
        text: "The `use` prefix is how React's linter knows a function might call hooks. Without it, the linter can't enforce the Rules of Hooks (no conditional calls, etc.).",
        correct: true,
        rationale:
          "Naming is a tooling contract. ESLint's react-hooks rule scans for `use*` callers and verifies hook order. Non-`use*` functions get treated as regular functions, and the linter assumes they DON'T call hooks.",
      },
      {
        id: "b",
        text: "React's runtime checks the function name and throws.",
        rationale: "React doesn't inspect names at runtime. The convention is enforced at lint-time.",
      },
      {
        id: "c",
        text: "It's just a style preference; you can ignore it.",
        rationale:
          "It's enforced by the lint rule. Disabling the rule disables Rules-of-Hooks checking — at which point you're driving without seatbelts.",
      },
      {
        id: "d",
        text: "It's required for tree-shaking.",
        rationale: "Tree-shaking is unrelated.",
      },
    ],
    modelAnswer:
      "Hooks have a runtime order contract — every render must call the same hooks in the same order. The `use` prefix is how the linter knows which functions are hooks (or hook callers) and tracks the order through your call tree. If a function calling useState isn't prefixed `use`, the linter can't see the order, can't enforce the rules, and you get subtle bugs that only appear under conditional execution.",
    modules: ["f10-custom-hooks", "f11-rules"],
  },
  {
    id: "q-effect-cleanup",
    kind: "debug",
    difficulty: 2,
    title: "Memory leak after navigating away. Why?",
    scenario: "Component A starts a setInterval in useEffect. The user navigates away. The interval keeps firing forever.",
    code: `useEffect(() => {
  setInterval(tick, 1000);
}, []);`,
    choices: [
      {
        id: "a",
        text: "useEffect missing the cleanup function. Return a function that calls clearInterval(id).",
        correct: true,
        rationale:
          "The cleanup runs before the next effect AND on unmount. Without it, the interval reference outlives the component, and the closure keeps the entire component subtree alive — classic detached-DOM leak.",
      },
      {
        id: "b",
        text: "setInterval is broken in React; use setTimeout in a recursive call.",
        rationale: "setInterval works fine. The issue is cleanup.",
      },
      {
        id: "c",
        text: "useEffect with [] should be useLayoutEffect.",
        rationale: "useLayoutEffect runs synchronously; doesn't fix the leak.",
      },
      {
        id: "d",
        text: "Wrap the effect in startTransition.",
        rationale: "startTransition is for state updates, not effects. Doesn't apply.",
      },
    ],
    modelAnswer:
      "Effect cleanup is the contract: the function you return from useEffect runs before the next effect run AND once on unmount. Anything that creates ongoing work (intervals, listeners, subscriptions, fetch in-flight) must be paired with a cleanup. Subtle version: even with cleanup, you'll see the effect run twice in StrictMode dev — that's intentional, to catch missing cleanups. Don't disable StrictMode just to silence it.",
    modules: ["f04-effects", "23-memory-leaks"],
  },
  {
    id: "q-context-rerender",
    kind: "debug",
    difficulty: 3,
    title: "Why does a component using only `theme` re-render when `cart.count` changes?",
    scenario:
      "Single context provides `{ theme, cart }`. A header that reads only `theme` re-renders on every cart update.",
    choices: [
      {
        id: "a",
        text: "useContext doesn't select — every consumer re-renders whenever the context value changes (by Object.is). The value object is recreated, so identity changes, so all consumers re-render.",
        correct: true,
        rationale:
          "Context is a coarse broadcast. The fix: split into two contexts (Theme + Cart) so theme consumers don't subscribe to cart updates; or use an external store with selectors via useSyncExternalStore.",
      },
      {
        id: "b",
        text: "The cart triggered a state update, which always re-renders all children.",
        rationale: "Children only re-render if their parent's render reaches them. The context broadcast is the actual mechanism.",
      },
      {
        id: "c",
        text: "Wrap the header in React.memo and it won't re-render.",
        rationale:
          "memo's comparison runs on props, not context reads. If the header USES context, memo's compare won't save it. You need selector-style subscription, not memo.",
      },
      {
        id: "d",
        text: "Use useReducer instead of useState in the provider.",
        rationale: "Reducer vs setter doesn't change broadcast semantics. The shape of the context value is what matters.",
      },
    ],
    modelAnswer:
      "Context fans out to every consumer on every value change. There's no selector. For coarse, slow-changing values (theme, locale, auth user) context is great. For frequently-changing or compound values, split the context into one provider per slice — or switch to an external store with useSyncExternalStore for true selector-style reads.",
    modules: ["f09-context", "16-state-architecture"],
  },
  {
    id: "q-prop-drilling",
    kind: "design",
    difficulty: 2,
    title: "When does prop drilling stop being fine?",
    scenario: "A piece of state needs to be available 4 levels deep. Currently passed prop-by-prop.",
    choices: [
      {
        id: "a",
        text: "When the intermediate components don't use the value, only forward it.",
        correct: true,
        rationale:
          "The pain test is whether the intermediates care. If they pass it through unchanged, you're adding props to components that don't need them — which forces them to re-render on changes they don't care about and clutters the type signature.",
      },
      {
        id: "b",
        text: "Always — prop drilling is an antipattern.",
        rationale: "Two or three levels is often fine, and explicit. Beats hidden context for component-local concerns.",
      },
      {
        id: "c",
        text: "Never — prop drilling is React's intended mechanism for sharing.",
        rationale: "At scale (4-6+ levels through uninterested components) the cost compounds.",
      },
      {
        id: "d",
        text: "When the value type contains a function.",
        rationale: "Type doesn't matter; the question is whether intermediates use the value.",
      },
    ],
    modelAnswer:
      "The pragmatic line: 1-3 levels of useful drilling is fine and often clearer than context. 4+ levels through components that DON'T use the value is the moment to reach for context (for tree-wide values) or a store (for state addressed from multiple subtrees). Composition (pass children) sometimes flattens it without adding any context.",
    modules: ["f02-props", "f09-context"],
  },
  {
    id: "q-render-pure",
    kind: "internals",
    difficulty: 3,
    title: "Why must render be pure?",
    scenario: "Explain the Rules of React's purity requirement to a junior engineer.",
    choices: [
      {
        id: "a",
        text: "Because React calls render multiple times for the same inputs (StrictMode, transitions that abort, time-slicing) and assumes each call produces the same output. Side effects in render would fire unpredictable numbers of times.",
        correct: true,
        rationale:
          "Concurrent React relies on this. The scheduler may discard an in-progress render and re-run; transitions may interrupt; StrictMode double-renders in dev. If render mutates state, calls setTimeout, or logs to analytics, you get duplicated effects.",
      },
      {
        id: "b",
        text: "Because React is functional programming and pure functions are a style preference.",
        rationale: "Not stylistic — it's a contract the runtime depends on.",
      },
      {
        id: "c",
        text: "Because JavaScript engines optimise pure functions better.",
        rationale: "Engine optimisation is real but irrelevant to React's purity rule. The reason is React's own re-render semantics.",
      },
      {
        id: "d",
        text: "Because hooks order would break otherwise.",
        rationale: "Hook order is a separate rule. Purity and hook order are both required but different.",
      },
    ],
    modelAnswer:
      "Purity is the foundation everything else stands on. The Compiler memoises only pure components; transitions can abort and re-run; StrictMode double-renders in dev to catch impurities; time-slicing can pause a render mid-way. All of these assume the same inputs produce the same output. The corollary: don't mutate state in render, don't call setState in render, don't perform I/O. Use effects or handlers for any of that.",
    modules: ["f11-rules", "11-react-compiler"],
  },
  {
    id: "q-batching",
    kind: "internals",
    difficulty: 3,
    title: "How many renders for 3 setState calls in a handler?",
    scenario: "An onClick handler calls setA(1), setB(2), setC(3). How many renders happen?",
    choices: [
      {
        id: "a",
        text: "One — React 18+ batches all updates in a handler into a single render.",
        correct: true,
        rationale:
          "Automatic batching covers event handlers, effects, promises, setTimeout, and native event handlers as of React 18. Pre-18, only React event handlers batched; native handlers + promises did not.",
      },
      {
        id: "b",
        text: "Three — each setState causes a render.",
        rationale: "Was true in some pre-18 contexts (e.g., inside setTimeout callbacks). Not in modern React.",
      },
      {
        id: "c",
        text: "Two — first state-tick + a cleanup tick.",
        rationale: "Not how batching works.",
      },
      {
        id: "d",
        text: "It depends on whether you wrap in startTransition.",
        rationale: "startTransition affects priority, not batching count. Batching is unconditional in React 18+.",
      },
    ],
    modelAnswer:
      "React 18 made batching automatic everywhere — handlers, effects, promises, timeouts, native events. Three setStates in the same synchronous block produce one render. Two practical implications: (1) you can't read state synchronously between setStates because they're all queued, and (2) if you need to force a flush between updates, flushSync wraps the boundary.",
    modules: ["f03-state"],
  },
  {
    id: "q-strictmode",
    kind: "internals",
    difficulty: 2,
    title: "Why does StrictMode double-render in dev?",
    scenario: "A junior asks why their useEffect logs twice in dev but once in prod.",
    choices: [
      {
        id: "a",
        text: "StrictMode dev-only intentionally mounts → unmounts → remounts to catch missing cleanups and impure renders. Prod runs each effect once.",
        correct: true,
        rationale:
          "The double-mount is React poking at you: 'if your cleanup is wrong, you'll see it now.' It's not a bug; it's a feature-flag for development correctness.",
      },
      {
        id: "b",
        text: "React 19 broke StrictMode.",
        rationale: "StrictMode behaves the same in React 19 as 18.",
      },
      {
        id: "c",
        text: "console.log is unreliable; trust your eyes.",
        rationale: "Logs are reliable. The double-fire is intentional StrictMode behavior.",
      },
      {
        id: "d",
        text: "Turn StrictMode off to fix it.",
        rationale:
          "Turning it off hides the symptom but keeps the underlying cleanup bug. The correct fix is to write a cleanup that handles the double-mount idempotently.",
      },
    ],
    modelAnswer:
      "StrictMode in development intentionally invokes effects twice (mount → cleanup → mount again) to surface missing cleanups. The fix is never to disable StrictMode — it's to make every effect idempotent: pair every subscription with an unsubscription, every interval with a clearInterval, every fetch with an AbortController.signal check. If your code survives StrictMode, it'll survive React's future schedulers that might re-mount components for real.",
    modules: ["f04-effects"],
  },

  /* ───────── More performance / systems questions ───────── */

  {
    id: "q-suspend-list",
    kind: "debug",
    difficulty: 4,
    title: "List flicker after pagination",
    scenario:
      "Clicking 'next page' shows the old list, then a loading spinner, then the new list. The user sees the spinner appear *after* the click.",
    choices: [
      {
        id: "a",
        text: "Wrap the navigation in startTransition. Suspense will keep the old list visible while the new one loads; no flash to fallback.",
        correct: true,
        rationale:
          "This is the canonical reason to use transitions with Suspense. Without it, the new pending state shows the fallback immediately. With it, React keeps the previous content mounted until the new one is ready.",
      },
      {
        id: "b",
        text: "Use useDeferredValue on the page number.",
        rationale: "Helps but is the wrong primary lever. startTransition expresses the intent at the navigation site, not the read site.",
      },
      {
        id: "c",
        text: "Add an explicit loading state and conditionally render.",
        rationale:
          "Reimplements Suspense by hand. Works but loses the 'don't show fallback during transition' behavior.",
      },
      {
        id: "d",
        text: "Move the fetch to useEffect.",
        rationale: "Effect-driven fetching just changes where the loading state is, not whether the user sees a flash.",
      },
    ],
    modelAnswer:
      "startTransition + Suspense is one of the most useful pairings React 18+ ships. Inside the transition, React knows the new render is 'deferrable' — if it hits a Suspense boundary, instead of showing the fallback, it keeps the previous content visible until the new tree is ready. This is what 'no spinner flicker on navigation' looks like under the hood.",
    modules: ["04-concurrent", "08-suspense"],
  },
  {
    id: "q-rsc-client-boundary",
    kind: "design",
    difficulty: 4,
    title: "RSC tree calls a hook from a Client Component. Where does the error throw?",
    scenario:
      "A Server Component imports a Client Component that calls useState. Where can this go wrong?",
    choices: [
      {
        id: "a",
        text: "If the Client Component's file is missing 'use client', the bundler tries to treat it as RSC and useState throws at build/runtime because hooks don't exist on the server.",
        correct: true,
        rationale:
          "The 'use client' directive is what marks a module as a Client Component. Without it, even importing useState in that file is a server-side error.",
      },
      {
        id: "b",
        text: "It throws at the network layer.",
        rationale: "Network is for transport. The error is at the boundary itself.",
      },
      {
        id: "c",
        text: "Browsers reject the bundle.",
        rationale: "The error is upstream — at SSR or build time, depending on Next config.",
      },
      {
        id: "d",
        text: "It works fine; React 19 hooks are universal.",
        rationale: "Hooks remain client-only. RSC has its own primitives (use, fetch, etc.).",
      },
    ],
    modelAnswer:
      "'use client' isn't decorative — it tells the bundler this module is a Client Component boundary. Server Components run once per request and don't have a hook lifecycle. If you import useState in a file missing 'use client', the build either errors or the file gets RSC-treated and crashes server-side. The remedy: put 'use client' at the top of the file. The cost: that module + its imports get shipped to the browser bundle.",
    modules: ["12-server-components"],
  },
  {
    id: "q-img-cls",
    kind: "design",
    difficulty: 2,
    title: "How do you prevent CLS from an unsized image?",
    scenario:
      "An `<img src={url}/>` without dimensions causes layout shift when it loads on a slow connection.",
    choices: [
      {
        id: "a",
        text: "Set width + height attributes (or aspect-ratio CSS). The browser reserves space before the bytes arrive.",
        correct: true,
        rationale:
          "Sizing tells the layout engine the box dimensions before the image is fetched. The image then paints into that reserved slot — no shift.",
      },
      {
        id: "b",
        text: "Lazy-load all images.",
        rationale: "Lazy loading still shifts when the image enters the viewport. Sizing is the actual fix.",
      },
      {
        id: "c",
        text: "Use a fixed-pixel container and overflow:hidden.",
        rationale: "Works but is heavy-handed and doesn't scale responsively. width + height + aspect-ratio is cleaner.",
      },
      {
        id: "d",
        text: "Preload the image with `<link rel='preload'>`.",
        rationale:
          "Preloading helps with LCP but doesn't change layout reservation. You still need dimensions.",
      },
    ],
    modelAnswer:
      "CLS is layout's promise vs. reality. The fix is to commit to the dimensions before the bytes arrive — either explicit width/height attributes, or CSS aspect-ratio. next/image automates this by requiring you to pass width + height (or fill mode + a sized parent). Skip this and CLS becomes the most-flagged Lighthouse issue you have.",
    modules: ["17-browser-pipeline"],
  },
  {
    id: "q-suspense-list-key",
    kind: "design",
    difficulty: 3,
    title: "Suspense + keyed list — what swap pattern is safe?",
    scenario:
      "You render a list of user cards inside a Suspense boundary. When the user changes, you want the boundary to suspend without showing the previous user's data.",
    choices: [
      {
        id: "a",
        text: "Use a key prop that includes the user id on the Suspense (or its parent). When key changes, the boundary remounts and shows fallback instead of stale content.",
        correct: true,
        rationale:
          "Key-based remount is React's tool for 'force a clean slate.' Putting it on (or above) the Suspense forces re-suspension on identity change.",
      },
      {
        id: "b",
        text: "Set a 'loading' state in the parent and conditionally render fallback.",
        rationale:
          "Works but bypasses Suspense's coordinated behavior. You're reimplementing what Suspense already does.",
      },
      {
        id: "c",
        text: "Always show the fallback before fetching by setting state.",
        rationale: "Adds a flicker that Suspense was supposed to eliminate.",
      },
      {
        id: "d",
        text: "Wrap in startTransition to force a re-suspend.",
        rationale: "startTransition does the OPPOSITE — keeps previous content visible during the transition.",
      },
    ],
    modelAnswer:
      "Key-based remount is a powerful but rarely-mentioned pattern. When you want a Suspense boundary to 'reset' (show fallback again because the identity of what it's rendering changed), put a key on the boundary (or its parent) that incorporates the identity. React unmounts the subtree, mounts a fresh one, suspense fires again. Cleaner than effect-driven loading flags.",
    modules: ["08-suspense"],
  },
  {
    id: "q-error-boundary-where",
    kind: "design",
    difficulty: 3,
    title: "How granular should error boundaries be?",
    scenario:
      "Your app has a top-level layout, a sidebar, a main panel with three widgets. Where do you put error boundaries?",
    choices: [
      {
        id: "a",
        text: "One at the root (last-resort), one around the main panel, one per widget. Failures contained to the smallest reasonable surface.",
        correct: true,
        rationale:
          "The 'smallest-reasonable-surface' rule. Per-widget boundaries mean one chart crashing doesn't kill the dashboard. The root boundary handles truly catastrophic errors gracefully.",
      },
      {
        id: "b",
        text: "One at the root. Simplicity > granularity.",
        rationale:
          "A single root boundary turns any error into a full-page crash. Acceptable for tiny apps; harsh UX otherwise.",
      },
      {
        id: "c",
        text: "One per component, automatically.",
        rationale: "Overhead and noise. Granularity should match user-visible groupings.",
      },
      {
        id: "d",
        text: "No boundaries — let errors crash so they're loud.",
        rationale: "Loud in dev is fine; loud in prod loses users.",
      },
    ],
    modelAnswer:
      "Error boundaries should mirror the user's mental model of 'sections that fail independently.' A widget crashing should keep the rest of the app usable, so the widget gets its own boundary. The main content area gets one as a safety net. The root gets one as the last-resort catch-all that shows 'something went wrong' before the page goes blank. React 19 added per-boundary callbacks (onCaughtError, onUncaughtError, onRecoverableError) for monitoring.",
    modules: ["08-suspense", "22-observability"],
  },
  {
    id: "q-perf-list-stable-callback",
    kind: "debug",
    difficulty: 3,
    title: "Memo'd row still re-renders on every parent tick",
    scenario:
      "<Row> is wrapped in React.memo. The parent re-renders every second (timer). Even when no Row's data changed, every Row re-renders.",
    code: `<Row onSelect={(id) => setSelected(id)} item={x}/>`,
    choices: [
      {
        id: "a",
        text: "The arrow function for onSelect is recreated every parent render. memo's shallow compare sees a new function reference and treats it as 'changed'. Wrap with useCallback or hoist out.",
        correct: true,
        rationale:
          "Inline arrows in JSX = identity churn. React.memo's compare is shallow Object.is on each prop. New function reference → 'props changed' → re-render. The Compiler memoises this automatically — manual codebases need useCallback.",
      },
      {
        id: "b",
        text: "memo doesn't work on rows.",
        rationale: "It does — when props are stable.",
      },
      {
        id: "c",
        text: "Wrap Row in another memo.",
        rationale: "Double-memo doesn't help; the inputs are the issue.",
      },
      {
        id: "d",
        text: "Use a class component.",
        rationale: "Same issue — shouldComponentUpdate would see new function refs too.",
      },
    ],
    modelAnswer:
      "React.memo is only as effective as the stability of its inputs. Inline functions, inline objects, and inline arrays are the three things that bust it. The Compiler in React 19 handles these automatically. Without the Compiler, useCallback for handlers (with stable deps), useMemo for inline objects, and module-level constants where possible.",
    modules: ["01-reconciliation", "11-react-compiler"],
  },
  {
    id: "q-network-waterfall",
    kind: "design",
    difficulty: 3,
    title: "A page renders three sequential fetches. How do you parallelise?",
    scenario:
      "Component A fetches user. Component B (rendered inside A) fetches user's orders. Component C (rendered inside B) fetches order details.",
    choices: [
      {
        id: "a",
        text: "Hoist all three fetches to the top of the page (RSC) or in a single Promise.all. Pass the data down as props. The components no longer fetch.",
        correct: true,
        rationale:
          "The waterfall is the rendering order itself. Hoist the data fetching above the component tree so all three requests fire in parallel; the components become pure renderers of given data.",
      },
      {
        id: "b",
        text: "Use Suspense everywhere.",
        rationale:
          "Suspense lets you render fallbacks gracefully but doesn't itself parallelise. The underlying fetches still happen in order.",
      },
      {
        id: "c",
        text: "Use React Query — it caches.",
        rationale:
          "React Query's cache helps with re-visits but the FIRST page load still has the waterfall if the queries are nested.",
      },
      {
        id: "d",
        text: "Increase server thread count.",
        rationale: "Frontend ordering isn't a server issue.",
      },
    ],
    modelAnswer:
      "Waterfalls are a rendering-order problem masquerading as a network problem. The cure is to hoist data-fetching above the components that consume it. In RSC: kick off all queries at the page level, await them in parallel via Promise.all, pass results to children. In client code: lift the fetches to the route loader and share via context or props. Sometimes the right answer is a single backend endpoint that returns the full aggregate.",
    modules: ["07-streaming-ssr", "18-network-data"],
  },
  {
    id: "q-cdn-vs-origin",
    kind: "tradeoff",
    difficulty: 3,
    title: "When does the CDN cache HURT you?",
    scenario:
      "Your blog page is cached on Vercel's CDN with revalidate: 3600. You discover a typo and ship a fix.",
    choices: [
      {
        id: "a",
        text: "The CDN serves the old version to most users for up to an hour. Trigger an explicit revalidation (revalidatePath / revalidateTag).",
        correct: true,
        rationale:
          "Long revalidate windows trade freshness for performance. The escape hatch is on-demand invalidation — Next.js exposes this via revalidatePath/Tag.",
      },
      {
        id: "b",
        text: "The cache always reflects the latest deploy.",
        rationale: "Only static-on-deploy assets do. Cached page bodies have their own TTL.",
      },
      {
        id: "c",
        text: "Force-refresh from the browser fixes it for everyone.",
        rationale: "Fixes it for one user. Other users still hit the cached version.",
      },
      {
        id: "d",
        text: "Add cache-control no-store.",
        rationale: "Defeats the purpose of caching. Use on-demand revalidation instead.",
      },
    ],
    modelAnswer:
      "Long revalidate windows are a deal you struck for speed. Breaking the deal (deploying a fix that needs to land NOW) is what revalidatePath / revalidateTag exist for. Tag pages by content type and trigger revalidation from your CMS webhook or admin action. Don't set no-store reflexively — you lose the speed benefit for the 99% of changes that are fine waiting.",
    modules: ["15-partial-prerendering", "18-network-data"],
  },
  {
    id: "q-deps-rule-eslint",
    kind: "internals",
    difficulty: 3,
    title: "Why is exhaustive-deps a strict ESLint rule?",
    scenario:
      "A senior dev disables react-hooks/exhaustive-deps to 'simplify the code.'",
    choices: [
      {
        id: "a",
        text: "Missing deps create stale closures — the effect uses an old value of a state/prop. Bugs are intermittent and hard to reproduce. The lint rule catches them at write time.",
        correct: true,
        rationale:
          "The rule encodes the closure capture mechanism. Every value referenced inside the effect must be in deps, or the effect captures a frozen version of it. Disabling the rule = trading rare visible bugs now for intermittent rare bugs later.",
      },
      {
        id: "b",
        text: "It's purely stylistic.",
        rationale: "It encodes a correctness invariant.",
      },
      {
        id: "c",
        text: "Disabling speeds up the linter.",
        rationale: "Disable a rule for hot perf wins is misleading; the cost is mostly the work the rule catches.",
      },
      {
        id: "d",
        text: "It's wrong half the time.",
        rationale:
          "It's right almost all the time. The cases where it complains incorrectly almost always reveal genuine confusion about closure capture.",
      },
    ],
    modelAnswer:
      "The exhaustive-deps lint rule is a correctness check, not a style suggestion. Disabling it means accepting silent staleness — your effect closes over old values and you find out months later when a user reports something weird. If the rule complains and you DON'T want to add the dep (e.g. you only want the effect to run once), the correct response is to refactor (move the value to a ref, hoist outside, etc.), not to silence the linter.",
    modules: ["f04-effects"],
  },

  /* ───────── Architecture + judgment ───────── */

  {
    id: "q-css-strategy",
    kind: "tradeoff",
    difficulty: 3,
    title: "CSS-in-JS vs Tailwind vs CSS Modules — pick one for a new app.",
    scenario: "You're starting fresh. The app will grow to 50+ components, mixed React + RSC.",
    choices: [
      {
        id: "a",
        text: "Tailwind for utility scaffolding + CSS Modules for component-scoped styles. Both ship as plain CSS, both RSC-compatible, neither runs in the browser.",
        correct: true,
        rationale:
          "Plain CSS at the end of the toolchain. No runtime, no RSC compatibility issues, both work in Server Components. Tailwind handles the 80% of utility-style needs; CSS Modules cover the bespoke 20%.",
      },
      {
        id: "b",
        text: "styled-components for everything.",
        rationale:
          "Runtime cost + RSC incompatibility (styled-components requires a Client boundary). Was the right answer in 2019; the math has changed.",
      },
      {
        id: "c",
        text: "Plain global CSS.",
        rationale: "Doesn't scale. Class collisions, no scoping, painful refactors.",
      },
      {
        id: "d",
        text: "Inline styles everywhere.",
        rationale:
          "Loses media queries, pseudo-classes, scales poorly. Useful for one-off dynamic values, not as a strategy.",
      },
    ],
    modelAnswer:
      "Post-RSC, the CSS strategy converges. Runtime CSS-in-JS (styled-components, emotion classic) is awkward in Server Components because it needs the client. Zero-runtime CSS-in-JS (vanilla-extract, panda CSS) works but adds compile complexity. Tailwind + CSS Modules is the pragmatic default — Tailwind for utility composition, Modules for component-scoped rules, both are just CSS at the end. The remaining decision is whether you like Tailwind's class-soup vs Modules' separate-file ergonomics.",
    modules: ["20-build-bundle"],
  },
  {
    id: "q-microfrontend-readiness",
    kind: "design",
    difficulty: 4,
    title: "When does microfrontend architecture pay off?",
    scenario: "A 5-person team is choosing between a monorepo monolith and Module Federation.",
    choices: [
      {
        id: "a",
        text: "Microfrontends pay off at 3+ teams, independent deploys, and a shared runtime contract you're willing to govern. Below that, the integration cost exceeds the autonomy benefit.",
        correct: true,
        rationale:
          "MFE shines when team-level autonomy is the constraint. For a 5-person team, a well-structured monorepo gives you the same modularity without the runtime contract overhead.",
      },
      {
        id: "b",
        text: "Always — it's the future.",
        rationale: "Pre-mature adoption tax is high. Many teams who reached for MFE in 2021 walked it back.",
      },
      {
        id: "c",
        text: "Never — it's always worse than a monolith.",
        rationale: "At org scale (50+ engineers, 5+ teams) MFE is the only sensible answer.",
      },
      {
        id: "d",
        text: "Only if you use Webpack 5.",
        rationale: "Module Federation 2.0 supports other bundlers (rspack, Vite via plugins). Webpack isn't a constraint.",
      },
    ],
    modelAnswer:
      "Microfrontends are an organisational tool, not a perf tool. They solve 'three teams want to deploy on different cadences without coordinating.' At 1-2 teams a monorepo is faster, simpler, and gives you the same modular layout via package boundaries. Reach for MFE when team-level deploy independence is the actual constraint, AND you're willing to invest in versioning, contract testing, and shared dependency governance.",
    modules: ["19-microfrontends"],
  },
  {
    id: "q-test-pyramid",
    kind: "design",
    difficulty: 3,
    title: "What's the right ratio of unit / integration / e2e tests?",
    scenario: "A 100-component React app. The team has time to write tests but no plan.",
    choices: [
      {
        id: "a",
        text: "Lots of integration (testing-library style — render a component, simulate user interaction), some unit (pure utility functions), few e2e (critical paths only: login, checkout).",
        correct: true,
        rationale:
          "The 'testing trophy' shape. Integration tests catch the bugs users actually hit; unit tests catch logic bugs in extracted utilities; e2e tests guard the conversion-critical user journeys.",
      },
      {
        id: "b",
        text: "Lots of unit tests, no integration, no e2e.",
        rationale: "The 'testing pyramid' from the Mocha era. Doesn't catch integration bugs which are the bulk of real React bugs.",
      },
      {
        id: "c",
        text: "Lots of e2e, no integration, no unit.",
        rationale: "E2E is slow + flaky at scale. Use sparingly.",
      },
      {
        id: "d",
        text: "Snapshot tests, every component.",
        rationale: "Snapshots break on every UI change without telling you whether the change was intentional. Useful in narrow cases (rendering invariants), not as a strategy.",
      },
    ],
    modelAnswer:
      "Kent C. Dodds's 'testing trophy' has aged well for React: lots of integration tests using @testing-library/react that verify user-visible behavior; a layer of unit tests for pure logic (formatters, validators, reducers); a small layer of e2e (Playwright/Cypress) on the truly critical paths. The reason integration is the bulk: it catches the 'this state plus this prop plus this user input produces this UI' interactions that are where real React bugs hide.",
    modules: [],
  },

  /* ───────── Internals deep dives ───────── */

  {
    id: "q-react-element-shape",
    kind: "internals",
    difficulty: 2,
    title: "What is a React element, literally?",
    scenario: "Describe the structure of `<Component foo={'bar'} />` after JSX compilation.",
    choices: [
      {
        id: "a",
        text: "A plain JS object: { $$typeof: REACT_ELEMENT, type: Component, props: { foo: 'bar' }, key, ref }.",
        correct: true,
        rationale:
          "Just an object. The $$typeof symbol is a Symbol-based marker to defend against forged elements. Plain object semantics; cheap to create.",
      },
      {
        id: "b",
        text: "An instance of a React.Element class.",
        rationale: "No such class. Plain object literal.",
      },
      {
        id: "c",
        text: "A function that returns DOM nodes.",
        rationale: "That's a component. An element is the result of calling JSX (or createElement).",
      },
      {
        id: "d",
        text: "A virtual DOM node — what React diffs against the real DOM.",
        rationale:
          "Vague. The element is the input; the fiber tree is the working structure; the real DOM is the output. The element itself is just a description object.",
      },
    ],
    modelAnswer:
      "An element is a plain JS object: { $$typeof, type, props, key, ref }. It's the declarative description of what to render — cheap, throwaway, garbage-collected every render. The reconciler turns elements into fibers, which are the persistent records that survive re-renders. The DOM is the eventual output of the renderer applying commits to fibers. Element → Fiber → DOM.",
    modules: ["f01-components", "03-fiber"],
  },
  {
    id: "q-portals-when",
    kind: "design",
    difficulty: 2,
    title: "When do you need a Portal?",
    scenario: "You're building a tooltip / modal / autocomplete dropdown.",
    choices: [
      {
        id: "a",
        text: "When the visual position needs to escape its parent's overflow/z-index but the React tree should still place it logically. Portals render to a different DOM node while staying in the React tree (for context, events).",
        correct: true,
        rationale:
          "Portals decouple the DOM position from the React tree position. The React tree (and therefore context, event bubbling, etc.) sees the portal where its JSX is written; the DOM sees it where its container says.",
      },
      {
        id: "b",
        text: "When you want to share state across a portal boundary.",
        rationale: "Portals don't help with state sharing — they help with DOM placement.",
      },
      {
        id: "c",
        text: "Whenever you use Suspense.",
        rationale: "Unrelated. Portals work fine without Suspense.",
      },
      {
        id: "d",
        text: "Never — they're deprecated.",
        rationale: "Not deprecated. Active and recommended for modals/tooltips.",
      },
    ],
    modelAnswer:
      "Portals exist because the DOM tree and the React tree can disagree about where a thing should be. A modal logically belongs as a child of the component that opens it (for context, ownership, event bubbling), but visually it needs to escape its parent's overflow:hidden and stacking context. Portal: render(<Modal/>, document.body) while the JSX still nests it inside the parent. The event from a button click inside the modal still bubbles up through the React tree, not the DOM tree.",
    modules: ["21-accessibility"],
  },
  {
    id: "q-effects-vs-events",
    kind: "design",
    difficulty: 3,
    title: "useEffect or event handler?",
    scenario: "User clicks 'Submit'. You want to: (a) send a POST request, (b) show a success toast on success.",
    choices: [
      {
        id: "a",
        text: "Event handler — useEffect is for syncing with external systems based on state/props, not for handling user intent. Effects on click are an anti-pattern.",
        correct: true,
        rationale:
          "The 'You Might Not Need an Effect' rule. Click → handler → fetch → toast. No effect needed. Effects are for derived state that should sync to something external (subscribe to a store, set the document title, attach a listener).",
      },
      {
        id: "b",
        text: "useEffect with [submitClicked] as the dep.",
        rationale: "Reactive style for an imperative event. The handler is more direct and avoids the extra state variable.",
      },
      {
        id: "c",
        text: "useEffect with [] (run once).",
        rationale: "Wrong — that runs at mount, not on click.",
      },
      {
        id: "d",
        text: "useLayoutEffect for the toast.",
        rationale: "Layout effects are for measuring DOM before paint. Unrelated to user intent.",
      },
    ],
    modelAnswer:
      "Effects are for SYNCING with external systems — the document title, a subscription, an analytics SDK. User intent (click, submit, type) belongs in event handlers, full stop. The pattern of 'set a state on click, run an effect on that state change to do the work' is round-about and creates bugs (the effect runs in StrictMode-double-fire, runs on re-mount, has stale closure issues). Handler does the work directly.",
    modules: ["f04-effects", "f05-events"],
  },
  {
    id: "q-render-vs-effect-fetch",
    kind: "internals",
    difficulty: 3,
    title: "Why is fetching in render a bug?",
    scenario: "A junior writes `const data = await fetch(url)` directly in a component body.",
    choices: [
      {
        id: "a",
        text: "Render must be pure. Side effects (fetch, console.log, mutation) in render fire unpredictable numbers of times under StrictMode, transitions, and Concurrent React. Use an effect or Suspense's use() instead.",
        correct: true,
        rationale:
          "Render runs more than once for the same inputs (StrictMode dev double-render, transition aborts, time-slicing). Anything that talks to the network from render fires extra requests.",
      },
      {
        id: "b",
        text: "Fetch returns a Promise; you can't await in render.",
        rationale:
          "Top-level await isn't supported; that's the syntax error. But the BIGGER issue is purity. With use() you CAN suspend on a promise, but the call site is still expected to be pure-conceptually.",
      },
      {
        id: "c",
        text: "Network calls in render are flagged by ESLint.",
        rationale: "Not by default. The rule is conceptual: render = pure.",
      },
      {
        id: "d",
        text: "It's fine in React 19.",
        rationale: "It's not — the purity contract didn't change.",
      },
    ],
    modelAnswer:
      "Render is the pure-function part. Side effects belong in event handlers, useEffect, or — for data — Server Components or libraries that handle the fetching outside render (React Query, SWR, Suspense + use()). The reason isn't dogma; it's that React calls your render function many times for the same inputs (StrictMode, transitions, time-slicing) and assumes pure outputs. Any I/O in render fires multiple times.",
    modules: ["f04-effects", "f11-rules"],
  },
  {
    id: "q-controlled-form-batch",
    kind: "tradeoff",
    difficulty: 3,
    title: "Forms with 30 fields — should each input have its own useState?",
    scenario: "A signup form has 30 fields. The naïve approach is 30 useState calls.",
    choices: [
      {
        id: "a",
        text: "Group fields into one useReducer with a shape like { [fieldName]: value }, OR use react-hook-form which keeps state outside React render entirely. Either way avoids 30 re-renders per keystroke.",
        correct: true,
        rationale:
          "30 useState calls means each keystroke triggers 30 setStates → one render with the whole form's state. Not catastrophic, but a useReducer with a single state object renders fewer fibers. react-hook-form keeps the values in refs, only renders changed fields.",
      },
      {
        id: "b",
        text: "30 useState calls is fine.",
        rationale: "It's acceptable for small forms, gets clunky at 30. Multiple state slices and updaters litter the component.",
      },
      {
        id: "c",
        text: "Put each field in its own context.",
        rationale: "30 contexts is dramatically worse.",
      },
      {
        id: "d",
        text: "Make every field uncontrolled.",
        rationale: "Loses easy validation. react-hook-form is the production version of 'mostly-uncontrolled' done cleanly.",
      },
    ],
    modelAnswer:
      "Above ~10 fields, switch from useState-per-field to useReducer with a single state object, or adopt react-hook-form / formik / a similar library that keeps values in refs. The big perf win isn't fewer renders per keystroke (React batches anyway) — it's that with a library, only the changed field's component renders, not the entire form. For a 30-field form that matters.",
    modules: ["f07-forms"],
  },
  {
    id: "q-keyed-list-reorder",
    kind: "debug",
    difficulty: 3,
    title: "Reorder a list — child state goes to the wrong row",
    scenario:
      "A list of edit-in-place items. Each item has its own local 'isEditing' state. After sorting the list, the wrong items appear as 'editing.'",
    choices: [
      {
        id: "a",
        text: "Keys are wrong (probably index-based). After reorder, the new item at slot 3 reuses slot 3's fiber including its isEditing state. Use a stable key like item.id.",
        correct: true,
        rationale:
          "Keys ARE identity. Reordering with index keys means React sees no movement and reuses the wrong fibers. Stable id-based keys tell React 'this item moved' so the editing state moves with it.",
      },
      {
        id: "b",
        text: "useState doesn't persist across re-renders.",
        rationale: "It does, attached to the fiber. The issue is which fiber gets reused.",
      },
      {
        id: "c",
        text: "Lift the isEditing state to the parent.",
        rationale: "Workaround that hides the bug. The keys are still wrong.",
      },
      {
        id: "d",
        text: "Wrap the list in startTransition.",
        rationale: "Transitions don't affect keys.",
      },
    ],
    modelAnswer:
      "This is the canonical 'why keys matter' moment — keys aren't a perf optimization, they're an identity contract. With index keys, after a sort, position-3's local state stays with position-3 — but the data at position-3 changed. Result: someone else's edit state appears on the wrong row. With stable id keys, React migrates the fiber (and its state) with the data, and the editing flag follows the row that's actually being edited.",
    modules: ["f06-rendering", "01-reconciliation"],
  },

  /* ───────── Modern React 19 specifics ───────── */

  {
    id: "q-use-vs-useeffect",
    kind: "design",
    difficulty: 3,
    title: "use(promise) or useEffect + setState?",
    scenario: "You want to render data from an async source.",
    choices: [
      {
        id: "a",
        text: "use(promise) — suspends on the promise, integrates with Suspense, no loading-state plumbing. Pair with cache() to dedupe.",
        correct: true,
        rationale:
          "The React-19 way. The reading code doesn't manage loading or error state explicitly; Suspense + ErrorBoundary handle those. use() also works conditionally and inside loops.",
      },
      {
        id: "b",
        text: "useEffect + setState — universal.",
        rationale:
          "Pre-19 pattern. Still works but you write more boilerplate (isLoading, error, race-condition guards via abort signals).",
      },
      {
        id: "c",
        text: "useMemo around the fetch.",
        rationale: "useMemo doesn't handle promises; would just memoise the promise itself, not its result.",
      },
      {
        id: "d",
        text: "Both — for redundancy.",
        rationale: "Pick one. Mixing creates double-fetch bugs.",
      },
    ],
    modelAnswer:
      "use(promise) is the modern recipe. Combined with cache() (or your data library's cache), the fetch dedupes naturally, Suspense renders the fallback, ErrorBoundary catches rejections. The code is 'const data = use(fetchUser(id))' — a single line, no state machine. useEffect-based fetching remains valid but is the older pattern with more moving parts.",
    modules: ["14-use-hook"],
  },
  {
    id: "q-useoptimistic-tx",
    kind: "design",
    difficulty: 3,
    title: "When does useOptimistic shine?",
    scenario: "User-facing mutations where instant feedback matters.",
    choices: [
      {
        id: "a",
        text: "Mutations where the server confirms or denies and you want to show the result instantly. Comments, likes, vote casts, in-place edits. The optimistic state auto-reverts on rejection.",
        correct: true,
        rationale:
          "useOptimistic is bound to the canonical state and shows the optimistic value until the action resolves. If the action throws or returns contradicting state, React replaces it with reality.",
      },
      {
        id: "b",
        text: "Long-form forms with validation.",
        rationale:
          "Validation is per-field; you already see immediate feedback via render. useOptimistic is about mutation outcomes.",
      },
      {
        id: "c",
        text: "Pagination.",
        rationale: "Pagination is read-side. useOptimistic is for writes.",
      },
      {
        id: "d",
        text: "Anywhere you have a Server Component.",
        rationale: "RSC is read-side rendering. Mutations are where useOptimistic helps.",
      },
    ],
    modelAnswer:
      "useOptimistic shines for any mutation where 'feels instant' beats 'is correct in 200ms.' Comments, hearts, vote casts, drag-reorder, status toggles. Tie it to the canonical state (the server-confirmed list). On rejection, useOptimistic swaps the optimistic value out automatically — no manual rollback code. Surface failure visibly at the same UI surface (red border, retry button), not as a toast.",
    modules: ["13-server-actions"],
  },
  {
    id: "q-server-action-progressive",
    kind: "internals",
    difficulty: 3,
    title: "Server Actions work without JavaScript. How?",
    scenario: "Explain why <form action={serverAction}> works even with JS disabled.",
    choices: [
      {
        id: "a",
        text: "The browser submits the form via a standard HTTP POST. The Server Action is reachable as a server endpoint and runs. The HTML response is the new page. JS adds the optimistic + pending UX on top.",
        correct: true,
        rationale:
          "Server Actions compile down to POST endpoints. Without JS, the form submits, the server runs the action, returns HTML, the browser navigates. Classic HTML form submission with React-level ergonomics on top.",
      },
      {
        id: "b",
        text: "There's a service worker that intercepts the submission.",
        rationale: "No service worker required. It's a direct POST.",
      },
      {
        id: "c",
        text: "It actually doesn't work without JS.",
        rationale: "It does — that's the headline feature. Progressive enhancement is the design goal.",
      },
      {
        id: "d",
        text: "The form is a websocket.",
        rationale: "No websocket. Standard HTTP form submission.",
      },
    ],
    modelAnswer:
      "Server Actions are the React-19 take on progressive enhancement. The form posts to the server even with JS off; the action runs server-side; the response is HTML; the page navigates. With JS, the same form's action is intercepted client-side: useActionState gives you pending/error/return value, useOptimistic gives you instant feedback, useFormStatus gives you the submit-button state. The base case (no JS) works because under the hood it's HTML.",
    modules: ["13-server-actions"],
  },
  {
    id: "q-compiler-rules",
    kind: "internals",
    difficulty: 4,
    title: "What gives the React Compiler permission to memoise your code?",
    scenario: "Why isn't the Compiler 'just optional useMemo for everything'?",
    choices: [
      {
        id: "a",
        text: "It assumes the Rules of React: pure renders, no mutation of props/state, immutable update patterns, hooks in stable order. If your code obeys those rules, it can reorder reads and cache values safely.",
        correct: true,
        rationale:
          "The Compiler is a static analysis that relies on the runtime invariants. Code that breaks the rules opts out of compilation (via the linter detecting it).",
      },
      {
        id: "b",
        text: "It memoises everything regardless of code quality.",
        rationale: "It silently skips files with rule violations. The lint is the contract.",
      },
      {
        id: "c",
        text: "It uses a runtime check before each cache hit.",
        rationale: "No runtime check. Decisions are made at compile time.",
      },
      {
        id: "d",
        text: "It only works with React Server Components.",
        rationale: "Works on Client Components. RSC has different rendering semantics.",
      },
    ],
    modelAnswer:
      "The Compiler can memoise only because the Rules of React are enforced. Pure renders mean the same inputs produce the same outputs; immutability means cached references stay valid; stable hook order means the cache slots align across renders. Code that breaks these rules can't be memoised correctly, so the Compiler quietly skips it and the linter flags it. The deal: obey the rules, get auto-memo; break them, get nothing changed.",
    modules: ["11-react-compiler", "f11-rules"],
  },
];

export function pickByCategory(kind: QuestionKind | "all", seed: number): Question {
  const pool = kind === "all" ? QUESTIONS : QUESTIONS.filter((q) => q.kind === kind);
  return pool[seed % pool.length];
}
