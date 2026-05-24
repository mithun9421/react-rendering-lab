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
  // ─── Batch 1: Modules 01–08 deep dives ───────────────────────────────────
  {
    id: "q-sortable-list-key",
    kind: "debug",
    difficulty: 3,
    title: "Drag-sortable list loses input focus after reorder",
    scenario:
      "A reorderable list of editable cards loses the active text-input's focus every time the user drags a card. The list uses key={index} and each card has a controlled <input>.",
    choices: [
      { id: "a", text: "key={index} makes React think the focused card was destroyed and a new one mounted in its place. Switch to a stable id-based key.", correct: true, rationale: "Index keys map fibers to positions; reorder = teardown + remount of every shifted card, which kills focus, selection, and any DOM state." },
      { id: "b", text: "Add autoFocus on the input.", rationale: "autoFocus only fires on mount — and the mount is the bug. You'd re-grab focus but lose typed characters." },
      { id: "c", text: "Use onBlur to remember focus and restore it.", rationale: "Treating the symptom. The underlying remount is wasted work and breaks selection, IME composition, and any uncontrolled DOM state." },
      { id: "d", text: "Wrap each card in React.memo.", rationale: "memo doesn't help — the props (the data at the new index) actually changed, so memo would pass the compare and re-render anyway." },
    ],
    modelAnswer: "Stable, unique keys are the whole game for reorderable lists. With key={index}, React identifies cards by slot, not identity — so reordering looks like every card changed, which means fiber teardown and remount. That destroys focus, selection, IME state, scroll position, and any uncontrolled DOM. The fix is one character: key={card.id}.",
    modules: ["01-reconciliation"],
  },
  {
    id: "q-conditional-wrapper-remount",
    kind: "debug",
    difficulty: 3,
    title: "Modal child remounts every time the modal opens",
    scenario:
      "A heavy <Editor> remounts (losing its draft) whenever its parent modal opens. The parent renders {open ? <div className='modal'><Editor/></div> : <Editor/>} to share Editor between modal and inline modes.",
    choices: [
      { id: "a", text: "Different parent element types in the two branches force React to tear down the subtree on every toggle.", correct: true, rationale: "Same-position, different-type subtrees are destroyed. The branch swap changes Editor's parent from a div to nothing (or vice versa), so its fiber gets recreated." },
      { id: "b", text: "Editor's state isn't lifted, so React can't preserve it.", rationale: "Local state survives re-renders fine — the issue is remounts, which always wipe local state regardless of where state lives." },
      { id: "c", text: "The modal uses a portal, which always remounts children.", rationale: "Portals don't remount children. Whether you portal or not, identity is determined by the React tree shape." },
      { id: "d", text: "React doesn't memoise Editor.", rationale: "memo controls re-render, not mount/unmount. The Editor is being unmounted, not just re-rendered." },
    ],
    modelAnswer: "The conditional branches render Editor at different tree positions with different parents, which is a different-type subtree to the reconciler — it unmounts the old and mounts a new one. Either always render Editor at the same position (e.g. <Editor wrappedInModal={open}/>), or lift Editor's draft state to a parent that doesn't remount.",
    modules: ["01-reconciliation", "02-diffing"],
  },
  {
    id: "q-fragment-key-stability",
    kind: "internals",
    difficulty: 4,
    title: "When does <Fragment key=...> matter vs a bare <>...</>?",
    scenario:
      "You're rendering a list where each item produces two sibling elements. When does the key-able Fragment matter?",
    choices: [
      { id: "a", text: "When the list is reorderable: only the long-form <Fragment key={id}> can hold a key; <>…</> cannot.", correct: true, rationale: "Short fragment syntax doesn't accept attributes. If you need a stable identity for a pair of siblings in a list, you must use the long form." },
      { id: "b", text: "Always — short fragments are deprecated.", rationale: "They aren't. Short fragments are fine when no key is needed." },
      { id: "c", text: "Never — React inlines fragments at compile time.", rationale: "Fragments still participate in reconciliation; they just don't produce DOM." },
      { id: "d", text: "Only in Suspense boundaries.", rationale: "Suspense is unrelated to fragment keying." },
    ],
    modelAnswer: "Short fragments (<>…</>) are syntactic sugar that can't carry a key. In a list where each item renders multiple siblings, you need <Fragment key={id}> from React to give the pair stable identity; otherwise positional keys leak in and reorders trigger remounts.",
    modules: ["01-reconciliation"],
  },
  {
    id: "q-strict-mode-double",
    kind: "internals",
    difficulty: 3,
    title: "StrictMode is double-invoking my effect — is that a bug?",
    scenario:
      "In dev, an effect runs twice on mount. The team's instinct is to suppress it with a ref guard.",
    choices: [
      { id: "a", text: "It's a feature: StrictMode mounts, unmounts, and re-mounts to surface effects that don't clean up properly. Make the effect idempotent and cleanup-correct instead of guarding it.", correct: true, rationale: "The double-invoke is checking your invariants. Adding a ref guard hides the real bug — that your effect lacks proper cleanup or assumes single execution." },
      { id: "b", text: "It's a bug in React 18+ — pin to 17.", rationale: "Intended behaviour since 18. Downgrading is a worse bug than the symptom." },
      { id: "c", text: "Use useLayoutEffect instead; it doesn't double-invoke.", rationale: "Both useEffect and useLayoutEffect double-invoke under StrictMode dev." },
      { id: "d", text: "Guard with a useRef so the body only runs once.", rationale: "This hides the design issue and ships a brittle effect to prod, where remounts (Fast Refresh, route revisits, future features) will bite." },
    ],
    modelAnswer: "StrictMode dev double-invoke is a stress test: mount, unmount, remount. Effects that subscribe, set timers, or post to an API must be safe to run, clean up, and run again. If yours isn't, the answer is to fix the cleanup, not to guard. The same robustness pays off when route transitions, Fast Refresh, or future selective hydration cause real-world remounts.",
    modules: ["01-reconciliation", "f04-effects"],
  },
  {
    id: "q-portal-event-bubbling",
    kind: "internals",
    difficulty: 4,
    title: "Click events from a portal bubble through which tree?",
    scenario:
      "A toast lives in a portal mounted at document.body. A click on the toast unexpectedly closes a modal whose React parent has a click-outside handler — even though DOM-wise the toast isn't a child of the modal.",
    choices: [
      { id: "a", text: "React events bubble through the React tree, not the DOM tree, so the toast's click propagates to its React parent — the modal.", correct: true, rationale: "Portals preserve the React parent-child relationship for synthetic events; that's why context works through portals and event bubbling does too." },
      { id: "b", text: "Portals are sandboxed; events do not bubble out.", rationale: "Portals are the opposite — they explicitly preserve React-level event propagation." },
      { id: "c", text: "It's a bug in the toast library.", rationale: "It's documented React behaviour, not a library bug." },
      { id: "d", text: "The click-outside handler uses document.body, which is the portal's parent.", rationale: "The behaviour holds even with a tighter handler attached only to the modal's React subtree — that's the point." },
    ],
    modelAnswer: "React synthetic events bubble through the React tree, not the live DOM tree. Portals preserve that React-parent relationship by design — that's also why context flows through them. Click-outside handlers in particular need to special-case the portal root or use stopPropagation inside the portalled component.",
    modules: ["01-reconciliation"],
  },
  {
    id: "q-diffing-component-type",
    kind: "internals",
    difficulty: 3,
    title: "Switching tag from <Button> to <a> wipes child state — why?",
    scenario:
      "A button-or-link component swaps its root element between <button> and <a> based on whether an href prop is present. State inside its children resets on every prop change that flips this.",
    choices: [
      { id: "a", text: "Different element types at the same tree position mean the diff algorithm tears down the entire subtree.", correct: true, rationale: "React's heuristic: type changed ⇒ unmount old, mount new. Even children that look identical are recreated because they hang off a freshly-mounted parent fiber." },
      { id: "b", text: "Inline event handlers create new identities every render.", rationale: "Handler identity affects memo, not remounts. The remount is caused by the parent type change." },
      { id: "c", text: "Refs forwarded incorrectly.", rationale: "Ref handling doesn't trigger subtree teardown." },
      { id: "d", text: "React batches updates differently for anchors.", rationale: "No special-case for anchors." },
    ],
    modelAnswer: "The diff algorithm short-circuits on type change: if the element type at a position differs, the entire subtree is unmounted and a fresh one is mounted. Even visually-identical children are new fibers. The fix is to use a single element (e.g. always render an <a> styled as a button, or use the new as=… pattern with a stable wrapper).",
    modules: ["02-diffing"],
  },
  {
    id: "q-text-node-diffing",
    kind: "internals",
    difficulty: 2,
    title: "When does updating a text node skip the commit phase?",
    scenario: "Pure text-only change inside an element — does React commit?",
    choices: [
      { id: "a", text: "Never skips. React still commits a text-update mutation; only the work is tiny compared to subtree teardown.", correct: true, rationale: "Text changes go through the same render+commit phases, but the commit work is one node.characterData = … op rather than a tree rebuild." },
      { id: "b", text: "Skips if the text length is identical.", rationale: "No length-based optimisation; React doesn't compare text lengths." },
      { id: "c", text: "Skips if wrapped in React.memo.", rationale: "memo controls the render phase, not commit phase." },
      { id: "d", text: "Always skips because text nodes don't have fibers.", rationale: "Text nodes do participate in reconciliation — they're a fiber tag of their own." },
    ],
    modelAnswer: "Text nodes flow through render and commit like any other fiber, but the commit is a single character-data mutation. The takeaway: cheap commits are why you can render at 60fps with thousands of text updates per frame, provided the surrounding tree isn't being torn down.",
    modules: ["02-diffing", "03-fiber"],
  },
  {
    id: "q-fiber-alternate-tree",
    kind: "internals",
    difficulty: 5,
    title: "Why does each fiber have an alternate pointer?",
    scenario: "Inspecting a fiber in dev tools, you see fiber.alternate referring to a near-duplicate node.",
    choices: [
      { id: "a", text: "Double-buffering: React maintains a 'current' tree (on screen) and a 'work-in-progress' tree (being rendered). The alternate pointer lets render reuse fiber objects without allocations.", correct: true, rationale: "The alternate enables the commit to be a pointer swap from WIP → current, and lets the next render reuse the old current as the new WIP." },
      { id: "b", text: "It's the parent fiber.", rationale: "Parent is fiber.return, not alternate." },
      { id: "c", text: "Backup for time-travel debugging.", rationale: "React doesn't keep history for debugging. The alternate is one-deep." },
      { id: "d", text: "Used for hydration matching.", rationale: "Hydration uses different machinery." },
    ],
    modelAnswer: "Fiber uses two trees: current (committed, on-screen) and work-in-progress (being rendered). Each fiber in current has an alternate pointer to its WIP counterpart. After commit, the WIP becomes current, and the old current is reused as the next WIP — that recycling is why renders don't allocate a fresh tree of fiber objects every time.",
    modules: ["03-fiber"],
  },
  {
    id: "q-lane-priority-mechanism",
    kind: "internals",
    difficulty: 5,
    title: "How does React choose what to render first?",
    scenario:
      "Multiple state updates land in the same tick from different sources (input change, network response, transition). What decides the render order?",
    choices: [
      { id: "a", text: "Each update is tagged with a lane (a bit in a 31-bit mask). The scheduler picks the highest-priority subset of lanes for the current render pass.", correct: true, rationale: "Lanes are React 18's priority system — they replace the linear expiration timestamps of older Fiber. The scheduler batches all updates in the chosen lane set into one render." },
      { id: "b", text: "FIFO from the update queue.", rationale: "React explicitly does NOT use FIFO; that's why transitions can be interrupted by typing." },
      { id: "c", text: "Highest-up subtree first.", rationale: "Tree position doesn't dictate priority — the update's lane does." },
      { id: "d", text: "Microtask order.", rationale: "Scheduling is React-controlled; microtasks are how it yields, not how it prioritises." },
    ],
    modelAnswer: "Every update gets a lane: SyncLane (urgent input), DefaultLane, TransitionLane, IdleLane. The scheduler picks the highest-priority pending lanes and renders only those updates together; lower-priority work waits. That's how typing inside a startTransition can interrupt the in-flight transition render — a sync-priority update bumps it.",
    modules: ["03-fiber", "04-concurrent"],
  },
  {
    id: "q-transition-vs-deferred",
    kind: "tradeoff",
    difficulty: 4,
    title: "useTransition or useDeferredValue?",
    scenario:
      "A search input filters a 10k-row list. You can't slow the typing experience. Which API fits?",
    choices: [
      { id: "a", text: "useDeferredValue on the filtered-list input — you don't own the setState that causes the slow render.", correct: true, rationale: "useTransition is for when YOU call setState. useDeferredValue wraps a value, returning a lagged copy that follows behind — perfect when the slow downstream isn't a setState you control." },
      { id: "b", text: "useTransition wrapping setQuery.", rationale: "Reasonable if you own the input's onChange — but if the slow consumer is a child reading a prop, useDeferredValue at the boundary is more direct." },
      { id: "c", text: "Always use both together.", rationale: "Stacking is wasteful — they're complementary tools, not additive." },
      { id: "d", text: "Neither — use debounce.", rationale: "Debounce drops keystrokes; transitions let React render every keystroke at high priority while deferring expensive consumers." },
    ],
    modelAnswer: "useTransition is for state YOU update — wrap setState in startTransition. useDeferredValue is for state you READ — pass a value in, get a lagged copy out. If you own the input's onChange, useTransition is fine. If the slow render is downstream of a value you only receive as a prop, useDeferredValue is the cleaner fit because it puts the lag at the consumer.",
    modules: ["04-concurrent"],
  },
  {
    id: "q-transition-interrupted",
    kind: "internals",
    difficulty: 4,
    title: "Why can typing interrupt an in-flight transition?",
    scenario:
      "A heavy chart re-renders inside startTransition. The user types into a separate input and the chart's render pauses, then resumes.",
    choices: [
      { id: "a", text: "Input setState lands on SyncLane (higher priority than TransitionLane). React abandons the in-progress WIP, renders the input synchronously, then restarts the transition.", correct: true, rationale: "Transition renders are interruptible. A sync update with higher lane priority causes React to discard the partial WIP and restart from current after the urgent update commits." },
      { id: "b", text: "The browser pauses React's work and JS execution.", rationale: "JS is single-threaded; the browser can't suspend a running JS task. React's own scheduler yields between fibers, which is what makes interruption possible." },
      { id: "c", text: "The chart uses Suspense.", rationale: "Suspense isn't required for interruption — concurrency is the mechanism." },
      { id: "d", text: "It doesn't actually interrupt — it just looks that way.", rationale: "It really does discard the partial WIP and restart." },
    ],
    modelAnswer: "Transitions are interruptible because React yields between fibers and inspects the scheduler each yield. A higher-priority lane (sync) means: throw away the partial WIP, commit the urgent update from a fresh render, then restart the transition. This is what concurrent rendering bought — the ability to keep typing fluid even when something heavy is mid-render.",
    modules: ["04-concurrent", "05-time-slicing"],
  },
  {
    id: "q-time-slice-budget",
    kind: "internals",
    difficulty: 3,
    title: "Why 5ms, not 16ms?",
    scenario:
      "React's scheduler yields back to the browser roughly every 5ms during a long render, even though the frame budget is 16ms.",
    choices: [
      { id: "a", text: "The frame budget includes browser paint, style, layout, and other event handlers — not just React. Yielding earlier leaves headroom for everything else.", correct: true, rationale: "If React used the full 16ms it would crowd out paint and input handlers, dropping frames. 5ms is a heuristic that leaves room." },
      { id: "b", text: "Browsers cap setTimeout to 5ms.", rationale: "The 4ms minimum is for nested setTimeouts and doesn't apply here." },
      { id: "c", text: "MessageChannel callbacks fire every 5ms.", rationale: "MessageChannel is the scheduling mechanism but doesn't impose a 5ms cap." },
      { id: "d", text: "It's tuned to the React profiler.", rationale: "The yield interval predates and is independent of the profiler." },
    ],
    modelAnswer: "60fps means 16.6ms per frame, but that budget covers everything the browser does — input handlers, style recalc, layout, paint, composite, and any non-React JS. React yields after ~5ms of fiber work to leave headroom; the rest of the frame budget belongs to the browser. Without yielding, even a fast render starves paint and feels janky.",
    modules: ["05-time-slicing", "17-browser-pipeline"],
  },
  {
    id: "q-longtask-observer",
    kind: "design",
    difficulty: 3,
    title: "What's the best way to detect blocking JS in production?",
    scenario:
      "You want to measure how often long tasks block the main thread for real users.",
    choices: [
      { id: "a", text: "PerformanceObserver({ type: 'longtask' }) — reports any task over 50ms with attribution to a frame.", correct: true, rationale: "Long Tasks API is the standard signal. 50ms is the W3C threshold for 'this blocks user input perceptibly'." },
      { id: "b", text: "requestAnimationFrame loop measuring frame deltas.", rationale: "Tells you about FPS but not what blocked. Long Tasks gives you durations and (sometimes) source attribution." },
      { id: "c", text: "console.time around every component.", rationale: "Doesn't generalise and isn't a prod-safe pattern." },
      { id: "d", text: "Bundle size analyzers.", rationale: "Static analysis; tells you nothing about runtime blocking." },
    ],
    modelAnswer: "The Long Tasks API (PerformanceObserver with entryType 'longtask') is the cleanest signal in production. It reports any main-thread task exceeding 50ms — the threshold above which users perceive input lag. Pair it with the newer Long Animation Frames (LoAF) API for richer attribution: which script triggered, which CSS recalc, which paint.",
    modules: ["05-time-slicing", "22-observability"],
  },
  {
    id: "q-hydration-mismatch-causes",
    kind: "debug",
    difficulty: 3,
    title: "Top three causes of hydration mismatch?",
    scenario: "You're auditing a Next.js app that throws 'hydration failed' warnings sporadically.",
    choices: [
      { id: "a", text: "Locale/timezone in server vs client formatting; user-agent-conditional rendering; third-party scripts mutating DOM before hydration.", correct: true, rationale: "These are the three classics: Intl differs by locale; UA strings differ; injected scripts (analytics, ad networks) modify the DOM between SSR and hydration." },
      { id: "b", text: "Forgetting to call ReactDOM.render.", rationale: "Wrong API and not a hydration concern." },
      { id: "c", text: "Using Suspense.", rationale: "Suspense is designed to work with hydration — boundaries hydrate independently." },
      { id: "d", text: "Slow networks.", rationale: "Latency doesn't cause mismatch; content divergence does." },
    ],
    modelAnswer: "The three pragmatic culprits: (1) Intl/Date formatting — server and client locales differ; (2) UA sniffing — different markup for mobile vs desktop; (3) third-party scripts mutating the DOM between server send and client hydrate. Fix with useEffect for client-only, suppressHydrationWarning sparingly, or move dynamic markup behind <ClientOnly>.",
    modules: ["06-hydration"],
  },
  {
    id: "q-selective-hydration",
    kind: "internals",
    difficulty: 4,
    title: "What does 'selective hydration' actually pick?",
    scenario: "Someone says React 18 hydrates 'selectively'. Selectively by what criterion?",
    choices: [
      { id: "a", text: "By Suspense boundary AND by user interaction: a click inside an un-hydrated boundary prioritises that boundary's hydration over others.", correct: true, rationale: "Selective hydration uses Suspense boundaries as units AND lets click events bump hydration priority for the boundary the user is interacting with." },
      { id: "b", text: "By viewport position only.", rationale: "Viewport intersection is one heuristic for islands but isn't how selective hydration works." },
      { id: "c", text: "By component depth.", rationale: "Depth isn't a priority signal." },
      { id: "d", text: "By bundle size.", rationale: "Bundle size doesn't drive hydration order." },
    ],
    modelAnswer: "Selective hydration uses Suspense boundaries as hydration units. Boundaries hydrate independently as their JS arrives — and if a user clicks on an un-hydrated boundary, React replays the event and prioritises that boundary's hydration. It's the answer to 'I clicked but nothing happened during hydration': React catches the click and bumps the work.",
    modules: ["06-hydration", "08-suspense"],
  },
  {
    id: "q-streaming-shell-strategy",
    kind: "design",
    difficulty: 4,
    title: "Where do you put the Suspense boundary in a streaming SSR app?",
    scenario:
      "An e-commerce product page has a shell (header, nav), product detail (needs DB), reviews (needs another service, often slow), and recommendations (separate ML service).",
    choices: [
      { id: "a", text: "Stream the shell + product detail together; wrap reviews and recommendations each in their own <Suspense>.", correct: true, rationale: "The shell + the LCP candidate (product) go first for fast paint and SEO; secondary content streams in as it's ready, independently." },
      { id: "b", text: "Wrap everything in a single top-level Suspense.", rationale: "Defeats streaming: nothing renders until the slowest resolves." },
      { id: "c", text: "No Suspense — let everything block until ready.", rationale: "Worst TTFB. The entire point of streaming is partial responses." },
      { id: "d", text: "Wrap each individual element separately.", rationale: "Over-granularity creates fallback flicker and many waterfalls without benefit." },
    ],
    modelAnswer: "Boundary placement is a CLS/UX choice. Shell + LCP go in the first chunk for fast paint and to give the crawler real content. Each independent slow source (reviews, recs) gets its own boundary so one slow upstream doesn't gate the others. Avoid wrapping individual elements — fallback flicker becomes the new jank.",
    modules: ["07-streaming-ssr", "08-suspense"],
  },
  {
    id: "q-streaming-vs-csr",
    kind: "tradeoff",
    difficulty: 3,
    title: "Is streaming SSR strictly better than client-side rendering?",
    scenario: "A team is debating switching their CSR SPA to streaming SSR.",
    choices: [
      { id: "a", text: "Better for first paint, SEO, and slow devices; worse for server cost, complexity, and stateful client interactions that survive navigation.", correct: true, rationale: "Streaming SSR shifts work to the server. The trade is faster TTFB and crawl-ability vs higher infra cost and harder client-state continuity." },
      { id: "b", text: "Strictly better — always migrate.", rationale: "Server cost, hosting constraints, and stateful clients can all argue against." },
      { id: "c", text: "Worse — CSR is faster.", rationale: "CSR has worse TTFB and FCP; streaming wins on those." },
      { id: "d", text: "They're equivalent.", rationale: "They have fundamentally different cost profiles." },
    ],
    modelAnswer: "Streaming SSR trades server cost and complexity for fast TTFB, SEO content on first byte, and offloaded work from slow devices. Don't migrate a stateful SPA wholesale — pick the routes where first-paint and crawlability matter (landing, product, content) and leave heavily-interactive app routes as CSR.",
    modules: ["07-streaming-ssr"],
  },
  {
    id: "q-suspense-fallback-storm",
    kind: "debug",
    difficulty: 4,
    title: "Why is my page flashing six different skeletons?",
    scenario:
      "A dashboard with six widgets, each wrapped in its own <Suspense fallback={<Skeleton/>}>, shows a chaotic flash of skeletons appearing and disappearing as the page loads.",
    choices: [
      { id: "a", text: "Granular fallbacks cause six independent loading states. Coalesce with a parent Suspense boundary OR use startTransition to keep the previous content during refetches.", correct: true, rationale: "Fallbacks fire per boundary. Either group them (one fallback for the whole zone) or use transitions to suppress fallbacks when there's prior content." },
      { id: "b", text: "The skeletons are too tall.", rationale: "Height affects CLS but not the flash count." },
      { id: "c", text: "React schedules fallbacks last.", rationale: "Fallbacks render immediately on suspension." },
      { id: "d", text: "Add a useEffect to delay them.", rationale: "Treating the symptom; the boundary topology is the actual problem." },
    ],
    modelAnswer: "Fallback storms come from one of two design mistakes: too many independent boundaries, or showing fallbacks during refetches that have prior data. Coalesce small widgets under a single boundary if they belong together visually, and wrap state changes in startTransition so React keeps showing the last good content while the new one streams in.",
    modules: ["08-suspense"],
  },
  {
    id: "q-suspense-with-transition",
    kind: "design",
    difficulty: 4,
    title: "useTransition + Suspense — what's the magic?",
    scenario: "A tab switcher fetches new data on click. Without transitions, the whole panel goes back to its skeleton. With useTransition, it doesn't. Why?",
    choices: [
      { id: "a", text: "Transitions tell React: 'this state change is non-urgent — keep showing the previous UI until the new one is ready'. Suspense respects that by not falling back if there's existing content.", correct: true, rationale: "Suspense's behaviour during a transition is to retain the prior committed UI instead of unmounting it for the fallback." },
      { id: "b", text: "Transitions cache previous renders.", rationale: "No caching is involved — the prior commit just stays on screen." },
      { id: "c", text: "Suspense only respects transitions in concurrent mode.", rationale: "React 18+ always runs concurrently; transitions always work with Suspense." },
      { id: "d", text: "useTransition wraps state in a promise.", rationale: "Not a promise wrapper — it tags the update with TransitionLane priority." },
    ],
    modelAnswer: "Transitions tell Suspense: 'don't show the fallback if you already have committed content for this boundary'. Without a transition, the suspended child unmounts to show the skeleton; with one, the previous committed UI stays mounted and visible until the new render is ready. That's the difference between a skeleton flash and a smooth content swap on tab change.",
    modules: ["04-concurrent", "08-suspense"],
  },
  // ─── Batch 1 end (20 questions: 01-08 deep dives) ───
  // ─── Batch 2: Modules 09–16 ──────────────────────────────────────────────
  {
    id: "q-island-vs-rsc",
    kind: "tradeoff",
    difficulty: 4,
    title: "Islands or RSC — when to pick which?",
    scenario: "You're shipping a content-heavy marketing site with a few interactive widgets. Astro-style islands or Next.js RSC?",
    choices: [
      { id: "a", text: "Islands when most of the page is static and interactivity is sparse, isolated, and small-bundle. RSC when the app shares data flow with the interactive parts.", correct: true, rationale: "Islands suit sprinkle-on interactivity. RSC fits when interactive components consume server-derived data woven through their tree." },
      { id: "b", text: "Always RSC — it's newer.", rationale: "Newer ≠ better; Astro/Qwik islands are often a cleaner fit for content sites." },
      { id: "c", text: "Always islands.", rationale: "Islands struggle when shared state crosses many widgets." },
      { id: "d", text: "They're identical at runtime.", rationale: "RSC ships zero JS for server components; islands selectively ship JS per widget." },
    ],
    modelAnswer: "Islands ship JS per interactive widget, everything else as static HTML — perfect for sparse interactivity. RSC pushes more componentry to the server and lets client components compose naturally with server-derived data. Picking: content site with three widgets → islands. App with server data threaded through interactive trees → RSC.",
    modules: ["09-islands", "12-server-components"],
  },
  {
    id: "q-island-shared-state",
    kind: "design",
    difficulty: 4,
    title: "Two islands need to share state — how?",
    scenario: "A cart-count island in the header and an 'add to cart' island on the product page need to share the cart count.",
    choices: [
      { id: "a", text: "External store or BroadcastChannel — islands are independent React trees and can't share context.", correct: true, rationale: "Each island is its own React root. Cross-island state requires a non-React channel: external store, storage events, or BroadcastChannel." },
      { id: "b", text: "Lift state to a common Provider above both islands.", rationale: "There is no common React tree — that's the definition of islands." },
      { id: "c", text: "URL state — push to query params.", rationale: "Works for some flows but causes navigation churn for ephemeral cart state." },
      { id: "d", text: "Don't — make them one island.", rationale: "Defeats the architecture; sometimes valid but not the general answer." },
    ],
    modelAnswer: "Islands are independent React roots — no shared providers. Cross-island state needs an out-of-React channel: an external store (Zustand reading from localStorage), a BroadcastChannel, or postMessage. The cleanest pattern is a tiny shared store module both islands import that syncs to localStorage + emits storage events.",
    modules: ["09-islands", "16-state-architecture"],
  },
  {
    id: "q-virtualization-find",
    kind: "tradeoff",
    difficulty: 3,
    title: "Virtualization breaks Cmd-F. Worth it?",
    scenario: "Your virtualised 50k-row table loses browser find-in-page — only rendered rows are findable.",
    choices: [
      { id: "a", text: "No clean fix — choose: keep virtualization and offer in-app search; render all rows and accept the perf hit; or detect find-in-page activation.", correct: true, rationale: "Browsers find only in DOM; virtualization deliberately omits non-visible rows. The realistic answer is in-app search." },
      { id: "b", text: "Use CSS to hide rows instead of unmounting.", rationale: "Then you've rendered all of them — same as not virtualising." },
      { id: "c", text: "React.memo solves it.", rationale: "memo controls re-render, not whether rows are in the DOM." },
      { id: "d", text: "Use a service worker to intercept Ctrl-F.", rationale: "Service workers don't intercept keyboard shortcuts." },
    ],
    modelAnswer: "Browser find operates on live DOM, so virtualization breaks it by design. Options: ship in-app search over the full dataset; render all rows with cheaper markup; or detect find-in-page where supported. No free lunch — you're trading one thing for another.",
    modules: ["10-virtualization", "21-accessibility"],
  },
  {
    id: "q-dynamic-row-heights",
    kind: "design",
    difficulty: 4,
    title: "Dynamic row heights with virtualization — strategy?",
    scenario: "Your virtualised list has rows of variable height. How do you compute the total scroll height and offsets?",
    choices: [
      { id: "a", text: "Estimate heights, measure as rows render, cache by id, update the offset table; recompute when contents change.", correct: true, rationale: "react-virtual uses exactly this: estimated initial height, ResizeObserver-based measurement, id-keyed cache." },
      { id: "b", text: "Set all rows to max-content and let the browser layout.", rationale: "Defeats virtualization — layout requires the row to be in the DOM." },
      { id: "c", text: "Use a fixed height for all rows.", rationale: "Works only if rows actually have a fixed height — which the question rules out." },
      { id: "d", text: "Always render the next 100 rows.", rationale: "Doesn't solve the offset problem — only delays it." },
    ],
    modelAnswer: "Dynamic heights need three things: an estimated initial height for the scroll spacer, a measurement step (ResizeObserver) that records actual heights into an id-keyed cache, and an offset table recomputed on measurement arrival. @tanstack/react-virtual is the reference impl.",
    modules: ["10-virtualization"],
  },
  {
    id: "q-compiler-opt-out",
    kind: "internals",
    difficulty: 4,
    title: "When does the React Compiler skip a function?",
    scenario: "You're auditing which components got auto-memoised. Some did, some didn't. What causes a skip?",
    choices: [
      { id: "a", text: "Rules-of-React violations: mutation, hooks called conditionally, refs used incorrectly — anything the linter would flag.", correct: true, rationale: "The compiler is conservative: if it can't prove purity and stable hook order, it leaves the function alone." },
      { id: "b", text: "Components with useState.", rationale: "useState is fine — the compiler memoises around it." },
      { id: "c", text: "Server Components.", rationale: "Server components don't need client-side memoisation." },
      { id: "d", text: "Components with more than 100 lines.", rationale: "No line-count threshold." },
    ],
    modelAnswer: "The compiler only memoises code it can prove safe — pure renders, stable hook order, no mutation. Any rules-of-React violation makes it skip; the ESLint plugin flags the same violations. Clean code gets auto-memo, sloppy code gets nothing changed and a lint warning.",
    modules: ["11-react-compiler", "f11-rules"],
  },
  {
    id: "q-compiler-vs-memo",
    kind: "tradeoff",
    difficulty: 3,
    title: "Delete useMemo/useCallback after enabling the Compiler?",
    scenario: "Your codebase has thousands of useMemo and useCallback calls. The Compiler is on.",
    choices: [
      { id: "a", text: "Yes, gradually — the Compiler subsumes them. Manual memo becomes noise and sometimes blocks better caching.", correct: true, rationale: "Manual memo predates the Compiler. Once it's on, hand-written memoisation is redundant and occasionally counterproductive." },
      { id: "b", text: "No — keep them as safety nets.", rationale: "They aren't safety nets; the Compiler is a strict superset for performance." },
      { id: "c", text: "Yes immediately — global codemod and ship.", rationale: "Gradual is safer; mass deletes can surface coincidental dependencies." },
      { id: "d", text: "Delete useMemo but keep useCallback.", rationale: "They serve symmetric purposes; either both stay or both go." },
    ],
    modelAnswer: "Once the Compiler is on, manual useMemo/useCallback are largely obsolete. Gradual removal is safer than a codemod: some manual memo masks dependency bugs (a useEffect depending on a memoised callback might fire less than it should). Remove file-by-file, run tests, watch for behaviour changes.",
    modules: ["11-react-compiler"],
  },
  {
    id: "q-server-component-async",
    kind: "internals",
    difficulty: 3,
    title: "Why can a Server Component be an async function?",
    scenario: "Server Components support async function components. Client components don't. Why the asymmetry?",
    choices: [
      { id: "a", text: "Server Components run once during the server render and can await; client components render many times and would re-await on every render.", correct: true, rationale: "Async on the client would mean re-fetching on every render. Server runs once per request, so awaiting is safe." },
      { id: "b", text: "The runtime is different — server uses an async-capable React.", rationale: "It's not runtime asymmetry; it's lifecycle asymmetry." },
      { id: "c", text: "Client components can be async with use().", rationale: "use() reads a promise; the component itself isn't async." },
      { id: "d", text: "It's a syntax convenience only.", rationale: "It's a semantic difference — one-shot server render vs repeated client render." },
    ],
    modelAnswer: "Server Components render once per request, so they await freely — fetch in render, return JSX, done. Client components re-render on state changes; if they were async, every render would re-await and you'd have a fetch storm. use() bridges the gap: client components suspend on a promise passed in or cached.",
    modules: ["12-server-components", "14-use-hook"],
  },
  {
    id: "q-rsc-import-boundary",
    kind: "debug",
    difficulty: 4,
    title: "Why does 'use server' code show up in my client bundle?",
    scenario: "A server-only utility file ended up in the client bundle, leaking secrets. Imports look fine.",
    choices: [
      { id: "a", text: "A Client Component imported the server file directly. Imports cross the boundary unless the file has 'server-only'.", correct: true, rationale: "Boundary enforcement is per-import. Importing a server-only module from a client component pulls it into the client bundle." },
      { id: "b", text: "Next.js leaks all server code by default.", rationale: "It doesn't — the boundary is real, but per-import, not global." },
      { id: "c", text: "process.env values are inlined.", rationale: "Env inlining is a separate concern from module boundary leaks." },
      { id: "d", text: "The bundler ignored the 'use server' directive.", rationale: "'use server' marks Server Actions, not server-only modules; you want the 'server-only' package." },
    ],
    modelAnswer: "Boundaries are enforced per import. A Client Component that imports a server-only file pulls that file into the client bundle. The fix is the 'server-only' package: importing it throws at build time if any client component pulls it transitively. Use it for anything that touches secrets, DB drivers, or server APIs.",
    modules: ["12-server-components"],
  },
  {
    id: "q-server-action-revalidate",
    kind: "design",
    difficulty: 3,
    title: "After a Server Action mutates data, how do you refresh the UI?",
    scenario: "A delete-comment Server Action runs. The list of comments needs to update.",
    choices: [
      { id: "a", text: "revalidatePath or revalidateTag in the action — Next.js re-renders affected routes / cache tags on the next request.", correct: true, rationale: "Tag-based or path-based invalidation is the React-Next idiom. It marks the cache stale; the next read refreshes." },
      { id: "b", text: "Manually setState with the new list.", rationale: "Works for optimistic UI but doesn't replace the cache invalidation." },
      { id: "c", text: "Refetch by reloading the route.", rationale: "Crude; loses scroll, focus, and other UX state." },
      { id: "d", text: "Server Actions auto-refresh everything.", rationale: "They don't — you have to declare what's stale via revalidate APIs." },
    ],
    modelAnswer: "Server Actions are mutations; you have to tell the framework what's now stale. In Next.js: revalidateTag for cache-tagged reads, revalidatePath for whole routes. Combine with useOptimistic for instant feedback and useActionState for pending/error state.",
    modules: ["13-server-actions"],
  },
  {
    id: "q-use-optimistic-rollback",
    kind: "debug",
    difficulty: 3,
    title: "useOptimistic shows the change, then snaps back. Why?",
    scenario: "An optimistic 'like' button shows the incremented count, then reverts before the server response arrives.",
    choices: [
      { id: "a", text: "The base state used by useOptimistic comes from a parent that re-renders with stale data after submit, wiping the optimistic value.", correct: true, rationale: "useOptimistic merges over a base state. If base state re-renders with old data, the optimistic layer is recomputed and may briefly show pre-optimistic values." },
      { id: "b", text: "Optimistic state always reverts on submit.", rationale: "It doesn't — proper wiring shows optimistic state until the action resolves." },
      { id: "c", text: "The Server Action returns null.", rationale: "Return value doesn't cause flicker; base state turbulence does." },
      { id: "d", text: "useTransition is missing.", rationale: "useTransition affects pending UI but isn't the cause of snapback." },
    ],
    modelAnswer: "useOptimistic computes from (baseState, optimisticUpdate). If baseState identity changes during the action — e.g. parent re-renders with pre-mutation data — the optimistic value recomputes and you see a flash. Stabilise the base state (memoise, hoist) to fix.",
    modules: ["13-server-actions"],
  },
  {
    id: "q-use-hook-conditional",
    kind: "internals",
    difficulty: 4,
    title: "Why can use() be called conditionally when hooks can't?",
    scenario: "use(promise) and use(context) can be inside an if-statement. useState cannot. Why?",
    choices: [
      { id: "a", text: "use() doesn't store in the hook-slot array, so ordering isn't position-based.", correct: true, rationale: "Classic hooks rely on call order matching the slot index. use() is a new primitive that doesn't break on conditional ordering." },
      { id: "b", text: "It actually can't — that's a bug in React.", rationale: "It's documented and intentional." },
      { id: "c", text: "Promises remember their caller.", rationale: "Promises don't track callers — the React runtime does." },
      { id: "d", text: "use() compiles to useEffect.", rationale: "use() is its own primitive, not a useEffect alias." },
    ],
    modelAnswer: "Classic hooks rely on call order — slot N this render must align to slot N the previous render. use() is a new primitive that doesn't use slot-based storage; it can appear in conditionals or loops. use() in an if-branch is fine; useState in an if-branch is still a Rules-of-Hooks violation.",
    modules: ["14-use-hook", "f11-rules"],
  },
  {
    id: "q-use-suspending-twice",
    kind: "debug",
    difficulty: 4,
    title: "Does use(somePromise) re-await on every render?",
    scenario: "A component calls use(fetchUser(userId)) inline. Concerned about re-fetching.",
    choices: [
      { id: "a", text: "If fetchUser creates a new promise per call, yes — it'll suspend and fetch every render. Cache the promise (cache() in RSC, or pass a stable promise from the parent).", correct: true, rationale: "use() reads whatever promise you hand it. Deduping must come from a stable promise reference." },
      { id: "b", text: "use() automatically dedupes.", rationale: "It doesn't dedupe by URL or args — only by promise identity." },
      { id: "c", text: "Suspense boundaries cache the result.", rationale: "Suspense doesn't cache; it just shows fallback while you suspend." },
      { id: "d", text: "Re-render only fires use() once.", rationale: "Re-renders re-run the function body, which re-calls fetchUser and re-passes a new promise." },
    ],
    modelAnswer: "use() is dumb: it reads the promise you pass. If your render calls fetchUser(userId) inline, you get a new promise every render and a new fetch. Hand use() a stable promise: cache() in RSC dedupes by argument; on the client you create the promise once and pass it in.",
    modules: ["14-use-hook"],
  },
  {
    id: "q-ppr-shell-strategy",
    kind: "design",
    difficulty: 4,
    title: "What goes in the PPR static shell vs the dynamic holes?",
    scenario: "You're configuring Partial Prerendering for a product page. Most of it is static; some of it is user-specific.",
    choices: [
      { id: "a", text: "Static: layout, product detail, reviews, footer. Dynamic Suspense holes: user greeting, cart count, personalised recommendations.", correct: true, rationale: "Static shell = CDN-cacheable for everyone. Dynamic holes = anything per-request." },
      { id: "b", text: "Everything static — PPR doesn't allow dynamic.", rationale: "PPR's whole point is allowing dynamic Suspense holes inside a static shell." },
      { id: "c", text: "Everything dynamic — PPR is just SSR with a fancy name.", rationale: "PPR explicitly separates the static prerender from dynamic streaming." },
      { id: "d", text: "Only the header static.", rationale: "Too conservative — most of a product page is shareable." },
    ],
    modelAnswer: "Mental model: the static shell is HTML identical for every user, cacheable at the edge. Dynamic holes are anything per-request — auth, cart, personalisation. Wrap each dynamic hole in <Suspense fallback>. Result: fast TTFB from a CDN-cached shell, personalised parts streaming in.",
    modules: ["15-partial-prerendering"],
  },
  {
    id: "q-ppr-vs-isr",
    kind: "tradeoff",
    difficulty: 4,
    title: "PPR or ISR for an e-commerce product page?",
    scenario: "Pages need fast LCP, near-real-time inventory, and personalised recommendations.",
    choices: [
      { id: "a", text: "PPR — static shell at edge, inventory + personalisation in Suspense holes.", correct: true, rationale: "ISR rebuilds whole pages periodically; PPR mixes static and dynamic per request — better for mixed content." },
      { id: "b", text: "ISR — simpler and proven.", rationale: "Doesn't get you per-request personalisation cleanly." },
      { id: "c", text: "Plain SSR — re-render every request.", rationale: "Loses the CDN-cache benefit; worse TTFB." },
      { id: "d", text: "Plain SSG — rebuild on inventory changes.", rationale: "Loses personalisation; rebuild storms on inventory churn." },
    ],
    modelAnswer: "ISR re-renders the whole page on a schedule; PPR caches the static shell forever and re-renders only dynamic Suspense holes per request. For mixed-content pages with personalisation, PPR wins.",
    modules: ["15-partial-prerendering"],
  },
  {
    id: "q-context-rerender-fanout",
    kind: "debug",
    difficulty: 3,
    title: "Every component re-renders when I change one context value",
    scenario: "A global Context holds {user, theme, cart}. Updating cart re-renders every consumer.",
    choices: [
      { id: "a", text: "Context re-renders all consumers when value identity changes. Split into multiple contexts or move to an external store with selectors.", correct: true, rationale: "Context fan-out is by reference — any change to the provider value re-renders every consumer." },
      { id: "b", text: "Wrap each consumer in React.memo.", rationale: "memo doesn't help; context updates skip memo." },
      { id: "c", text: "Use useReducer in the provider.", rationale: "Doesn't change the fan-out — same reference change." },
      { id: "d", text: "Use useMemo to memoise the context value.", rationale: "Helps avoid spurious updates from parent re-renders but doesn't change fan-out when value genuinely changes." },
    ],
    modelAnswer: "Context fans out to every consumer on value change. Real fixes: (1) split by concern — UserContext, ThemeContext, CartContext. (2) Move to an external store with selector subscriptions — consumers re-render only when their slice changes.",
    modules: ["16-state-architecture", "f09-context"],
  },
  {
    id: "q-selector-identity",
    kind: "debug",
    difficulty: 4,
    title: "Zustand selector returns a new array, re-renders every tick",
    scenario: "useStore((s) => s.items.filter(i => i.active)) re-renders on every store change.",
    choices: [
      { id: "a", text: "The selector returns a new array reference every call. Use a shallow-compare equality function or memoise the derivation.", correct: true, rationale: "Default selectors compare by Object.is; a new array always trips it." },
      { id: "b", text: "Move filter to the component body.", rationale: "Same problem — new array each render." },
      { id: "c", text: "Filter on every render is required.", rationale: "Filtering is fine; the issue is identity-based change detection." },
      { id: "d", text: "Use useMemo in the store.", rationale: "Stores don't render; memo in a store has no effect." },
    ],
    modelAnswer: "Selectors are compared by Object.is by default. A selector returning a new object or array always trips. Two fixes: pass the shallow equality function, or maintain the derived value in the store itself for stable identity.",
    modules: ["16-state-architecture"],
  },
  {
    id: "q-state-where-to-live",
    kind: "design",
    difficulty: 4,
    title: "Where should this state live: local, context, or store?",
    scenario: "A 'show inactive items' toggle is used by a sidebar, a table header, and a row count. Not persisted.",
    choices: [
      { id: "a", text: "External store — shared across non-sibling components, lightweight, no persistence needed.", correct: true, rationale: "External store fits multi-consumer ephemeral state without provider gymnastics or context fan-out." },
      { id: "b", text: "Lift to the closest common ancestor and prop-drill.", rationale: "Works but adds rendering pressure on the ancestor and drilling overhead for deep trees." },
      { id: "c", text: "Context.", rationale: "For one toggle a whole Provider is overkill, and fan-out caveat applies." },
      { id: "d", text: "URL query param.", rationale: "Wrong fit — toggle isn't navigable state." },
    ],
    modelAnswer: "Heuristic: single-component → useState. parent + a few children → lift and prop-drill. cross-cutting, multi-consumer, non-persisted → external store. URL-shareable → URL params. per-user persisted → server.",
    modules: ["16-state-architecture"],
  },
  {
    id: "q-sync-external-store",
    kind: "internals",
    difficulty: 4,
    title: "Why does useSyncExternalStore exist?",
    scenario: "Why not just subscribe in useEffect and call setState?",
    choices: [
      { id: "a", text: "Concurrent rendering can tear: a render starts with one external value, the store updates mid-render, the next read sees a different value. useSyncExternalStore guarantees a consistent snapshot.", correct: true, rationale: "Tearing is the formal concurrency hazard. The hook ensures the value used during render is stable until commit." },
      { id: "b", text: "useEffect is too slow.", rationale: "Performance isn't the motivation; correctness under concurrency is." },
      { id: "c", text: "It removes the need for a store.", rationale: "It's the API stores use to integrate safely — not a replacement." },
      { id: "d", text: "It works without subscriptions.", rationale: "It requires a subscribe function." },
    ],
    modelAnswer: "Tearing: under concurrent rendering, a render can yield, an external store updates, and a later read in the same render sees a different value — inconsistency on screen. useSyncExternalStore solves this with subscribe, getSnapshot, getServerSnapshot. Every external-store library is built on it now.",
    modules: ["16-state-architecture"],
  },
  // ─── Batch 2 end (19 questions: 09-16) ───
  // ─── Batch 3: Modules 17–24 ──────────────────────────────────────────────
  {
    id: "q-layout-thrash",
    kind: "debug",
    difficulty: 4,
    title: "Why does this measurement loop drop frames?",
    scenario: "Code reads element.offsetHeight, writes element.style.height, reads next element's offsetHeight, writes its style.height, in a loop. FPS tanks.",
    choices: [
      { id: "a", text: "Forced synchronous layout: each read after a write flushes layout. Batch all reads first, then all writes.", correct: true, rationale: "Read → write → read forces the browser to recompute layout mid-loop. Read-all-then-write-all coalesces into a single layout pass." },
      { id: "b", text: "JavaScript is too slow.", rationale: "The JS itself is fine — it's the browser's layout work being forced repeatedly that costs." },
      { id: "c", text: "GPU compositing fails.", rationale: "This is a CPU-side layout problem, not GPU." },
      { id: "d", text: "Use requestAnimationFrame.", rationale: "rAF helps if you can defer; it doesn't fix the read-write-read pattern itself." },
    ],
    modelAnswer: "Layout thrashing: each style read after a write forces the browser to flush pending layout to give you an accurate value. In a loop, you pay layout N times instead of once. Fix by separating phases: read every measurement into an array first, then write every style change. fastdom and similar libraries automate this.",
    modules: ["17-browser-pipeline"],
  },
  {
    id: "q-transform-vs-top",
    kind: "internals",
    difficulty: 3,
    title: "Animate with transform: translateX or with left?",
    scenario: "Two ways to move a card across the screen. Which is jank-free?",
    choices: [
      { id: "a", text: "transform: translateX — composited on the GPU, skips layout and paint. left triggers layout on every frame.", correct: true, rationale: "transform and opacity are the only mainstream properties that hit composite-only. Position properties trigger layout + paint per frame." },
      { id: "b", text: "left — better browser support.", rationale: "Both have universal support; transform is dramatically cheaper." },
      { id: "c", text: "Both perform identically.", rationale: "transform is composited; left is laid out — order of magnitude difference at 60fps." },
      { id: "d", text: "Depends on the element type.", rationale: "Element type doesn't change the rendering-pipeline cost of these properties." },
    ],
    modelAnswer: "transform and opacity are the composite-only properties — they skip style, layout, and paint, going straight to the compositor (often on the GPU). Animating left, top, width, height triggers layout per frame, which is hundreds of times more expensive. Rule: if you're animating it, use transform.",
    modules: ["17-browser-pipeline"],
  },
  {
    id: "q-composite-layer-bloat",
    kind: "debug",
    difficulty: 4,
    title: "will-change everywhere — memory blew up. Why?",
    scenario: "Team added will-change: transform to every interactive element. Mobile devices started crashing.",
    choices: [
      { id: "a", text: "will-change promotes elements to their own compositor layer — GPU memory cost. Use it sparingly and remove it once the animation is done.", correct: true, rationale: "Each layer has memory cost proportional to its pixel area. Indiscriminate use exhausts GPU memory, especially on mobile." },
      { id: "b", text: "Browser bug — file an issue.", rationale: "It's documented behaviour, not a bug." },
      { id: "c", text: "will-change is a no-op modern browsers ignore.", rationale: "It's actively used as a layer-promotion hint." },
      { id: "d", text: "Memory is unrelated to layers.", rationale: "Layer count is one of the largest GPU memory drivers on the web." },
    ],
    modelAnswer: "will-change is a hint to the browser to pre-promote an element to its own layer. Each layer holds a bitmap in GPU memory — roughly width × height × 4 bytes. Sprinkling it everywhere creates dozens of layers, blowing past GPU budget especially on mobile. Use only on elements that will animate imminently, and remove it (or set to auto) after.",
    modules: ["17-browser-pipeline"],
  },
  {
    id: "q-paint-vs-layout",
    kind: "internals",
    difficulty: 3,
    title: "Which CSS property change triggers layout, not just paint?",
    scenario: "background-color vs width — which is cheaper?",
    choices: [
      { id: "a", text: "background-color is paint-only; width triggers layout AND paint AND composite.", correct: true, rationale: "Geometry-affecting properties (width, height, top, margin, etc.) require layout recalc. Visual-only properties (color, background) skip layout." },
      { id: "b", text: "Both trigger layout.", rationale: "Color changes don't change geometry, so no layout." },
      { id: "c", text: "Both trigger composite only.", rationale: "Paint is required when colors change." },
      { id: "d", text: "Width is cheaper because it's a number.", rationale: "Geometry properties are categorically more expensive than color properties." },
    ],
    modelAnswer: "Pipeline: style → layout → paint → composite. Property categories: geometry (width, top) hits layout + paint + composite. Visual (color, background) hits paint + composite. Compositor-only (transform, opacity) hits just composite. Cheaper-to-more-expensive: transform < color < width.",
    modules: ["17-browser-pipeline"],
  },
  {
    id: "q-waterfall-vs-parallel",
    kind: "debug",
    difficulty: 3,
    title: "Why is my page slow even though each fetch is fast?",
    scenario: "Three fetches each take 100ms, but the page takes 350ms to render.",
    choices: [
      { id: "a", text: "Fetches are serialised — each awaited before the next starts. Run in parallel with Promise.all.", correct: true, rationale: "300ms serial vs 100ms parallel. The classic waterfall: each await blocks the next request." },
      { id: "b", text: "Network is slow.", rationale: "The fetches themselves are fast — the bug is the request topology." },
      { id: "c", text: "React is slow.", rationale: "Render time is not the bottleneck per the numbers given." },
      { id: "d", text: "Use Server Components.", rationale: "Server Components don't automatically parallelise — same awaits, same waterfall." },
    ],
    modelAnswer: "Three serial fetches = sum of latencies (300ms). Promise.all([a, b, c]) parallelises = max of latencies (100ms). RSC has the same trap — if you await one fetch before kicking off the next, you serialise. Kick off all fetches up front, then await in parallel.",
    modules: ["18-network-data"],
  },
  {
    id: "q-request-dedup",
    kind: "design",
    difficulty: 3,
    title: "Five components ask for the same user — five fetches?",
    scenario: "Each component calls fetchUser(123) in render. Network panel shows 5 identical requests.",
    choices: [
      { id: "a", text: "Dedup via cache() (RSC) or React Query — return the same in-flight promise to all callers for the same key.", correct: true, rationale: "Dedup at the data-layer is the standard fix. RSC's cache() does it for one render; React Query / SWR do it across the app." },
      { id: "b", text: "Lift the fetch to the root.", rationale: "Possible but rigid; dedup at the data-layer is more composable." },
      { id: "c", text: "Use Server-Sent Events.", rationale: "Wrong tool — SSE is for streams, not request dedup." },
      { id: "d", text: "Browser caches identical requests automatically.", rationale: "HTTP cache only kicks in for cacheable responses with appropriate headers; you can't rely on it for app-level dedup." },
    ],
    modelAnswer: "Dedup by key at the data layer. RSC: cache(fetchUser) wraps the function so identical args return the same promise within one render. Client: React Query / SWR keyed cache returns the in-flight promise for the same key. Either way, components stay declarative — fetch what you need; the layer dedupes.",
    modules: ["18-network-data"],
  },
  {
    id: "q-retry-backoff",
    kind: "design",
    difficulty: 4,
    title: "Server is degraded. Your retry made it worse. Why?",
    scenario: "Auth service returned 503. Client retried every 500ms. The retry storm took down the service.",
    choices: [
      { id: "a", text: "Constant-interval retries cause synchronised waves. Use exponential backoff with jitter and a circuit breaker.", correct: true, rationale: "All clients retry at the same offsets — a synchronised wave. Exponential backoff spreads the retries; jitter desynchronises them; circuit breaker stops retries when the service is clearly down." },
      { id: "b", text: "Retry frequency was too low.", rationale: "Higher frequency would make it worse, not better." },
      { id: "c", text: "Servers can't fail.", rationale: "They always can." },
      { id: "d", text: "Add more retries.", rationale: "More retries amplifies the storm." },
    ],
    modelAnswer: "Retry storms come from synchronised clients all retrying on the same cadence. Three mitigations stack: (1) exponential backoff — each retry doubles the wait; (2) jitter — randomise the wait so clients desynchronise; (3) circuit breaker — after N consecutive failures, stop retrying for a window. Together they let a degraded service recover instead of being kept down by retry traffic.",
    modules: ["18-network-data", "25-incident-simulator"],
  },
  {
    id: "q-prefetch-vs-preload",
    kind: "tradeoff",
    difficulty: 4,
    title: "<link rel='preload'> or rel='prefetch'?",
    scenario: "You want the JS bundle for the next likely route to be ready when the user clicks.",
    choices: [
      { id: "a", text: "prefetch — low-priority, future navigation. preload is high-priority for the current page.", correct: true, rationale: "preload is 'I need this for THIS page, fetch now'. prefetch is 'I'll probably need this for a future page, fetch when idle'." },
      { id: "b", text: "preload — it's higher priority.", rationale: "Higher priority means it competes with current-page assets and hurts LCP." },
      { id: "c", text: "Neither — use Service Worker.", rationale: "SW is a separate strategy; link hints are the lighter-touch default." },
      { id: "d", text: "Both, together.", rationale: "Doubles bandwidth; one or the other is the right answer." },
    ],
    modelAnswer: "preload = 'this page needs it, high priority' — for fonts, hero images, critical scripts. prefetch = 'a future navigation probably needs it, low priority' — for next-route bundles. Mixing them wrong hurts current-page LCP. Next.js Link auto-prefetches the linked route's bundle as it scrolls into view.",
    modules: ["18-network-data"],
  },
  {
    id: "q-mfe-shared-react",
    kind: "debug",
    difficulty: 5,
    title: "Microfrontend mount throws 'Invalid hook call'. Why?",
    scenario: "Host (React 18) loads a remote MFE (also React 18). Mount fails: 'Invalid hook call'.",
    choices: [
      { id: "a", text: "Two copies of React are loaded — one in the host bundle, one in the remote. Hooks check React identity, not version. Mark React as a singleton shared dependency in Module Federation.", correct: true, rationale: "Hooks rely on the React object's internal dispatcher. Two copies = two dispatchers = invariant violation. Federation shared:{react:{singleton:true}} fixes it." },
      { id: "b", text: "React versions differ.", rationale: "Same version; the issue is two copies of the SAME version." },
      { id: "c", text: "The remote forgot to bundle React.", rationale: "Bundling React redundantly is the cause, not omitting it." },
      { id: "d", text: "Hooks don't work in microfrontends.", rationale: "They work fine when React is properly shared." },
    ],
    modelAnswer: "Hooks require all React calls to go through the same React module instance — there's a global dispatcher inside the React object that hooks rely on. Module Federation shares React as a singleton: shared: { react: { singleton: true, requiredVersion: '^18' } }. Both host and remote import the same React, hooks work. Without singleton, each bundle ships its own React and you get the invariant violation.",
    modules: ["19-microfrontends"],
  },
  {
    id: "q-mfe-version-mismatch",
    kind: "design",
    difficulty: 4,
    title: "How do you enforce runtime contracts between MFEs?",
    scenario: "Host expects v2 of a shared design-system API. Remote ships v1. What's the safe pattern?",
    choices: [
      { id: "a", text: "Declare semver range in Module Federation shared config + runtime version check on init that warns or falls back if mismatched.", correct: true, rationale: "Federation can enforce ranges at load; complement with a runtime probe that confirms exported API surface and degrades gracefully." },
      { id: "b", text: "Always pin exact versions.", rationale: "Brittle — breaks any independent deploys, defeats federation." },
      { id: "c", text: "Re-bundle the design system in every MFE.", rationale: "Defeats federation; bundle bloat returns." },
      { id: "d", text: "Trust the remote.", rationale: "MFE failures in prod are usually contract failures; trust without verification is the problem." },
    ],
    modelAnswer: "Federation can declare shared ranges and ship multiple compatible versions side-by-side when allowed. For stricter guarantees, ship a tiny version probe: on init, each MFE verifies the shared API exposes the expected surface (function presence, semver check) and either renders or shows a degraded UI. Pair with feature-flag-driven rollouts so version-mismatch incidents are isolated to a cohort.",
    modules: ["19-microfrontends"],
  },
  {
    id: "q-tree-shake-pattern",
    kind: "debug",
    difficulty: 3,
    title: "Importing lodash from 'lodash' vs 'lodash/get' — why does it matter?",
    scenario: "import _ from 'lodash' inflates the bundle by 70kB. import get from 'lodash/get' adds 2kB.",
    choices: [
      { id: "a", text: "lodash's main entry has side effects flagged in package.json, so bundlers conservatively include the whole package; per-method imports skip that.", correct: true, rationale: "Side-effects flag controls tree-shaking aggressiveness. Lodash's CJS entry is non-tree-shakable; lodash-es is, and per-method imports avoid the issue entirely." },
      { id: "b", text: "Lodash is bloated.", rationale: "Lodash is fine — your import pattern is the lever." },
      { id: "c", text: "Bundlers can't tree-shake any library.", rationale: "They tree-shake aggressively when sideEffects:false is set." },
      { id: "d", text: "Use webpack instead of Vite.", rationale: "Bundler choice doesn't change the import-pattern principle." },
    ],
    modelAnswer: "Tree-shaking requires the bundler to prove nothing else in the module was needed. Lodash's main entry is CJS with side-effect statements, so bundlers include all of it to be safe. Per-method imports (lodash/get) or the ES build (lodash-es) skip that — bundlers can drop unused code. The cure for any library: check sideEffects in its package.json and prefer named imports from the ES build.",
    modules: ["20-build-bundle"],
  },
  {
    id: "q-dynamic-import-pattern",
    kind: "design",
    difficulty: 3,
    title: "Modal weighs 80kB. Lazy-load it?",
    scenario: "A rarely-opened settings modal is 80kB. It's in the main bundle.",
    choices: [
      { id: "a", text: "Dynamic import + React.lazy + Suspense. Split off the rarely-used chunk; load on click.", correct: true, rationale: "Dynamic imports create a new chunk that loads on demand. lazy + Suspense wraps the React side with a fallback during the network fetch." },
      { id: "b", text: "Move it to a separate route.", rationale: "Works if route makes sense, but lazy-loading in place is simpler for modal flows." },
      { id: "c", text: "Compress the bundle.", rationale: "Compression helps overall but doesn't address 'why ship 80kB to users who never open the modal'." },
      { id: "d", text: "Convert to a Server Component.", rationale: "Modals are inherently interactive client components." },
    ],
    modelAnswer: "Anything that's rarely needed and substantial should be a separate chunk. const Settings = lazy(() => import('./Settings')) + <Suspense fallback>. The 80kB doesn't ship to users who never open it; users who do see a tiny loading state while the chunk fetches. Prefetch the chunk on link/button hover for instant-feeling opens.",
    modules: ["20-build-bundle"],
  },
  {
    id: "q-side-effects-flag",
    kind: "internals",
    difficulty: 4,
    title: "What does sideEffects:false in package.json do?",
    scenario: "A new library shipped sideEffects:false. Bundler removed half of it. Why is that safe?",
    choices: [
      { id: "a", text: "It promises that importing the package has no observable side effects (no global mutations, no polyfills). Bundlers can drop unused exports safely.", correct: true, rationale: "Without the flag, bundlers must include modules whose mere evaluation might cause effects. With it, they can prune aggressively." },
      { id: "b", text: "It disables polyfills.", rationale: "It signals there ARE no polyfills (or other top-level effects) — different statement." },
      { id: "c", text: "It compresses the bundle.", rationale: "It's a tree-shake hint, not compression." },
      { id: "d", text: "It improves runtime perf.", rationale: "Bundle size, not runtime perf directly." },
    ],
    modelAnswer: "sideEffects:false is the library author saying 'evaluating any of my files has no observable effects beyond their named exports'. With that promise, bundlers can drop modules whose exports aren't imported. Without it, bundlers must keep them in case they registered a polyfill, mutated a global, etc. The flag can also be an array listing the files that DO have side effects.",
    modules: ["20-build-bundle"],
  },
  {
    id: "q-aria-busy-hydration",
    kind: "design",
    difficulty: 4,
    title: "How does a screen reader experience a Suspense fallback?",
    scenario: "A skeleton fallback shows for 200ms. What does a screen-reader user hear?",
    choices: [
      { id: "a", text: "Without aria-busy='true' + aria-live, nothing useful — the fallback may be announced as decorative text or silence. Mark the boundary aria-busy until content arrives.", correct: true, rationale: "Skeletons are visual-only by default. AT users need a semantic 'loading' signal and an announcement when content is ready." },
      { id: "b", text: "Screen readers automatically know it's loading.", rationale: "They don't infer 'loading' from visual skeletons." },
      { id: "c", text: "Suspense handles it.", rationale: "Suspense is a rendering primitive — accessibility semantics are your responsibility." },
      { id: "d", text: "Doesn't matter — the wait is short.", rationale: "Even short waits can be confusing if the user gets silence then sudden new content." },
    ],
    modelAnswer: "Suspense doesn't add a11y semantics. The pattern: wrap the boundary's container with aria-busy='true' role='status' during fallback; aria-live='polite' on the content area so the screen reader announces when content arrives. Or, more pragmatically, give the skeleton itself a visible 'Loading…' label that AT will read.",
    modules: ["21-accessibility", "08-suspense"],
  },
  {
    id: "q-focus-on-route-change",
    kind: "design",
    difficulty: 3,
    title: "What should focus do on client-side route change?",
    scenario: "SPA navigates to a new page. Where does focus go?",
    choices: [
      { id: "a", text: "Move focus to the new page's H1 (or main landmark). Otherwise screen-reader users stay where they were — invisible to them that the page changed.", correct: true, rationale: "Native MPA browsers move focus to the new document on navigation. SPA navigation skips that, so we replicate it manually." },
      { id: "b", text: "Leave focus alone.", rationale: "AT users won't know the page changed; sighted users may not notice the URL change either." },
      { id: "c", text: "Focus the back button.", rationale: "Wrong target — H1/main is the standard." },
      { id: "d", text: "Focus body.", rationale: "Body has no semantic meaning; nothing is announced." },
    ],
    modelAnswer: "Native browser navigation moves focus to the new document — SPA routing must replicate that. After route change, .focus() the H1 (or the main landmark with tabindex='-1'). Some frameworks (Remix, Next.js) ship route-change focus management; if not, do it in a layout-level effect tied to pathname.",
    modules: ["21-accessibility"],
  },
  {
    id: "q-semantic-html-vs-aria",
    kind: "tradeoff",
    difficulty: 2,
    title: "<button> or <div role='button'>?",
    scenario: "Designer wants a custom-styled button. Which markup?",
    choices: [
      { id: "a", text: "<button> — it brings keyboard, focus, ARIA semantics, and form integration for free. Style with CSS.", correct: true, rationale: "Native semantics > ARIA replacement. You'd have to reimplement keyboard, focus, role, and disabled state manually with the div." },
      { id: "b", text: "<div role='button'> for full styling control.", rationale: "You can fully style a <button> too — and you skip having to reimplement keyboard activation, focus styles, and disabled state." },
      { id: "c", text: "<a> styled as button.", rationale: "Anchors have navigation semantics; assistive tech announces them as links, not buttons." },
      { id: "d", text: "<span onclick>.", rationale: "Zero semantics; unreachable by keyboard; AT skips it." },
    ],
    modelAnswer: "First rule of ARIA: don't use ARIA when a native element fits. <button> handles Enter/Space activation, focus ring, role announcement, disabled state, and form submission. Anything you replace it with means re-implementing all of that — and most replacements miss something.",
    modules: ["21-accessibility"],
  },
  {
    id: "q-accessible-name",
    kind: "internals",
    difficulty: 4,
    title: "An icon-only button is read 'button'. Why no name?",
    scenario: "A close-button with just an X icon is announced as 'button' with no further label.",
    choices: [
      { id: "a", text: "The icon is decorative SVG with no accessible text. Add aria-label='Close' or visually-hidden text inside.", correct: true, rationale: "Accessible name comes from text content, aria-label, aria-labelledby, or alt. Icon-only buttons have none of these by default." },
      { id: "b", text: "Add a title attribute.", rationale: "title is unreliably announced and never the right primary mechanism." },
      { id: "c", text: "Use a real X character instead of an SVG.", rationale: "An X character still wouldn't be meaningful; the issue is semantic labelling, not glyph choice." },
      { id: "d", text: "Screen readers can read SVG.", rationale: "Only if it has role='img' + accessible name; not by default." },
    ],
    modelAnswer: "Accessible name calculation walks: aria-labelledby → aria-label → text content → title (fallback). An icon-only button hits the text-content step empty. Fix: aria-label='Close' on the button, OR <span className='sr-only'>Close</span> inside. The SVG should be aria-hidden='true' so it's not announced as 'image' on top.",
    modules: ["21-accessibility"],
  },
  {
    id: "q-lcp-element",
    kind: "internals",
    difficulty: 4,
    title: "What element does LCP measure?",
    scenario: "Lighthouse flags a 4s LCP. You need to know what element it's timing.",
    choices: [
      { id: "a", text: "The largest content element visible in the viewport — text block, image, or video poster — whichever is biggest by render area.", correct: true, rationale: "LCP picks the largest element in the viewport at paint time. It can change as larger elements appear; the final value is the last largest before user input." },
      { id: "b", text: "The page's <h1>.", rationale: "Often is, but not by definition." },
      { id: "c", text: "The whole page.", rationale: "Element-specific, not page-wide." },
      { id: "d", text: "The first element painted.", rationale: "That's FCP, not LCP." },
    ],
    modelAnswer: "LCP = Largest Contentful Paint = time the largest visible element renders. Candidates: <img>, <image> inside SVG, video poster, background image, or block-level text. The value updates as larger elements appear, finalising at the last largest before user input. Inspect the LCP candidate in DevTools Performance panel under 'Timings'.",
    modules: ["22-observability"],
  },
  {
    id: "q-performance-observer-buffer",
    kind: "internals",
    difficulty: 4,
    title: "Why does PerformanceObserver miss early entries?",
    scenario: "Subscribing to LCP via PerformanceObserver returns nothing. The page already loaded.",
    choices: [
      { id: "a", text: "Pass { buffered: true } when subscribing — picks up entries that fired before the observer attached.", correct: true, rationale: "Without buffered, you only see entries that arrive after subscription. RUM scripts often miss the LCP entry that fires before the script parses." },
      { id: "b", text: "PerformanceObserver doesn't support LCP.", rationale: "It does — buffered: true is the missing piece." },
      { id: "c", text: "Reload the page in the observer callback.", rationale: "Hacky and unnecessary." },
      { id: "d", text: "LCP only fires after user interaction.", rationale: "LCP fires on paint and finalises at first input." },
    ],
    modelAnswer: "PerformanceObserver only delivers entries that occur after subscription unless you opt into the buffered queue with { buffered: true }. For LCP, FCP, and other early-page metrics, always use buffered — the entry typically fires before any analytics script has had a chance to subscribe.",
    modules: ["22-observability"],
  },
  {
    id: "q-rum-vs-synthetic",
    kind: "tradeoff",
    difficulty: 3,
    title: "RUM or synthetic monitoring?",
    scenario: "Pick a perf monitoring strategy for a global product.",
    choices: [
      { id: "a", text: "Both — RUM for real-world distribution, synthetic for reproducibility and regression detection.", correct: true, rationale: "RUM tells you what users actually experience; synthetic tells you what changed between deploys. They answer different questions." },
      { id: "b", text: "RUM only.", rationale: "RUM is noisy — no controlled baseline; hard to attribute regressions." },
      { id: "c", text: "Synthetic only.", rationale: "Synthetic doesn't capture device, network, geo distribution of real users." },
      { id: "d", text: "Lighthouse runs in CI.", rationale: "Synthetic, but only one device type at one network — incomplete." },
    ],
    modelAnswer: "RUM (PerformanceObserver from real users) captures the long-tail distribution: slow phones, bad networks, weird browsers. Synthetic (Lighthouse, WebPageTest) gives you a controlled baseline you can A/B against between deploys. Use RUM for KPIs (p75 LCP), synthetic for regression alerts in CI.",
    modules: ["22-observability"],
  },
  {
    id: "q-detached-dom-leak",
    kind: "debug",
    difficulty: 4,
    title: "Heap snapshot shows thousands of detached <div>s. Source?",
    scenario: "Heap retains DOM nodes that are no longer in the document. What's the common cause?",
    choices: [
      { id: "a", text: "JS references to removed DOM nodes — usually a useEffect that stored the node in a ref or closure and never cleaned up.", correct: true, rationale: "DOM nodes are GC'd only if nothing references them. A ref or array holding the node keeps it alive even after detach." },
      { id: "b", text: "React doesn't unmount cleanly.", rationale: "React unmounts cleanly; it's user code holding references that leaks." },
      { id: "c", text: "Browser bug.", rationale: "Almost never. Leaks are user-code references." },
      { id: "d", text: "Detached DOM is fine.", rationale: "Detached DOM that's retained is a leak; it accumulates over the session." },
    ],
    modelAnswer: "Detached DOM in the heap means something JS is still pointing at it. Common culprits: refs that aren't cleared in cleanup, event listeners on document/window that capture a node in their closure, intervals that reference DOM, third-party libs (charts, maps) that don't expose a destroy(). Use Chrome's 'Retainers' panel to find what's holding the node, then add cleanup.",
    modules: ["23-memory-leaks"],
  },
  {
    id: "q-interval-leak",
    kind: "debug",
    difficulty: 2,
    title: "setInterval in useEffect — what cleanup do I need?",
    scenario: "A useEffect calls setInterval. What's the right cleanup?",
    choices: [
      { id: "a", text: "Return a cleanup that calls clearInterval. Without it, the interval survives unmount and fires forever.", correct: true, rationale: "useEffect cleanup runs on unmount AND before the next effect run. Missing clearInterval leaks the timer permanently." },
      { id: "b", text: "Set the state to null.", rationale: "Doesn't stop the timer." },
      { id: "c", text: "No cleanup needed.", rationale: "Without cleanup the interval fires on every render's stale closure forever." },
      { id: "d", text: "Use useLayoutEffect.", rationale: "Doesn't change cleanup semantics." },
    ],
    modelAnswer: "Every useEffect that creates a subscription, interval, timeout, listener, or observer must return a cleanup. For setInterval: const id = setInterval(...); return () => clearInterval(id). Otherwise the timer outlives the component and fires against stale closures, leaking memory and producing weird logs in StrictMode dev mode.",
    modules: ["23-memory-leaks", "f04-effects"],
  },
  {
    id: "q-listener-leak",
    kind: "debug",
    difficulty: 3,
    title: "Window event listener added in useEffect — why is it leaking?",
    scenario: "useEffect adds window.addEventListener('resize', handler). Heap shows handler accumulating.",
    choices: [
      { id: "a", text: "Missing cleanup — return () => window.removeEventListener('resize', handler). Each effect run adds a new listener without removing the old one.", correct: true, rationale: "Effects re-run on dep change without cleanup means old listeners stay attached. handler must be the SAME reference for removeEventListener to work." },
      { id: "b", text: "Use addEventListener once at module top.", rationale: "Couples DOM to React lifecycle wrong; can't subscribe per-mount that way." },
      { id: "c", text: "Resize doesn't leak.", rationale: "Any listener leaks if not removed; resize is no different." },
      { id: "d", text: "React handles it.", rationale: "React doesn't automatically clean DOM-level listeners you added." },
    ],
    modelAnswer: "Two issues compound. (1) Missing cleanup means each re-run adds a new listener. (2) removeEventListener needs the SAME reference passed to add — inline arrow functions create new references every render. Pattern: define handler with useCallback (or hoist it), add in effect, remove in cleanup with the same reference.",
    modules: ["23-memory-leaks"],
  },
  {
    id: "q-stale-closure-leak",
    kind: "debug",
    difficulty: 4,
    title: "useEffect closure captures stale state. Why?",
    scenario: "An interval inside useEffect always sees the initial count, even after count updates.",
    choices: [
      { id: "a", text: "Closure captured count at effect-creation time. Either include count in deps (re-runs effect) or use a ref to read latest value.", correct: true, rationale: "JS closures capture by reference to the variable in the outer scope. The effect ran once with count=0, so its closure sees count=0 forever." },
      { id: "b", text: "useEffect is broken.", rationale: "Intended behaviour — effects don't re-run without dep changes." },
      { id: "c", text: "Use useState lazy init.", rationale: "Unrelated; lazy init is about initial value, not closure capture." },
      { id: "d", text: "Add console.log.", rationale: "Doesn't fix the closure." },
    ],
    modelAnswer: "Effects close over the values from the render they ran in. count in the effect refers to the count from that render. Two fixes: (1) add count to deps so the effect re-runs (creating a new interval — sometimes wasteful); (2) use a ref — countRef.current = count synced via a separate effect, then read countRef.current inside the interval. Choose based on whether you want the effect to re-run.",
    modules: ["23-memory-leaks", "f04-effects"],
  },
  {
    id: "q-xss-jsx-vs-dangerous",
    kind: "internals",
    difficulty: 3,
    title: "Is <div>{userInput}</div> XSS-safe?",
    scenario: "Compare {userInput}, dangerouslySetInnerHTML, and sanitised HTML.",
    choices: [
      { id: "a", text: "JSX text interpolation is safe — React escapes by default. dangerouslySetInnerHTML is NOT safe without sanitisation.", correct: true, rationale: "JSX escapes any string value to text. dangerouslySetInnerHTML literally injects HTML; you must sanitise (DOMPurify) first." },
      { id: "b", text: "All three are equally unsafe.", rationale: "JSX text interpolation is safe by construction." },
      { id: "c", text: "JSX is unsafe without manual escaping.", rationale: "It escapes automatically; that's its key safety property." },
      { id: "d", text: "dangerouslySetInnerHTML is safe if input is non-empty.", rationale: "Non-emptiness has nothing to do with safety; HTML injection is HTML injection." },
    ],
    modelAnswer: "JSX text interpolation is XSS-safe — React converts to text and escapes. dangerouslySetInnerHTML is literally setting innerHTML; any <script> or onload= will execute. Sanitisation (DOMPurify with default config) makes it safe by stripping dangerous tags/attributes. Default to JSX; reach for dangerouslySetInnerHTML only with sanitisation, never raw user input.",
    modules: ["24-security"],
  },
  {
    id: "q-csp-nonce-vs-hash",
    kind: "design",
    difficulty: 5,
    title: "CSP for inline scripts: nonce or hash?",
    scenario: "You need to allow specific inline scripts under a strict CSP.",
    choices: [
      { id: "a", text: "nonce for per-request inline scripts (dynamic). hash for known static inline content.", correct: true, rationale: "nonces are a fresh random per request that the server injects; hashes are SHA-256 of the script content, fixed at build time. Different deployment models." },
      { id: "b", text: "Always nonce.", rationale: "Hashes are simpler when content doesn't change; nonces require server-side injection on every request." },
      { id: "c", text: "Always hash.", rationale: "Doesn't work for dynamic inline scripts (e.g. SSR-injected data)." },
      { id: "d", text: "Both for the same script.", rationale: "Pick one; combining adds complexity without benefit." },
    ],
    modelAnswer: "nonce: server generates a fresh random per request, puts it in the CSP header and on every inline <script>; the browser allows only matching nonces. Good for SSR with per-request dynamic content. hash: precompute sha256 of the script body at build time, put each hash in the CSP; good for static inline content. Modern Next.js supports nonces in middleware.",
    modules: ["24-security"],
  },
  {
    id: "q-iframe-sandbox",
    kind: "design",
    difficulty: 4,
    title: "Embedding third-party widgets — how do you contain them?",
    scenario: "You need to embed a vendor's widget but don't trust it to behave.",
    choices: [
      { id: "a", text: "iframe with sandbox attribute granting only the capabilities you need (allow-scripts but not allow-same-origin, etc.). Communicate via postMessage.", correct: true, rationale: "sandbox is the strongest containment the web offers for third-party HTML. allow-* flags grant capabilities incrementally; postMessage is the safe channel for data exchange." },
      { id: "b", text: "Inline the widget JS — easier.", rationale: "No isolation; third-party JS has full access to your DOM, cookies, storage." },
      { id: "c", text: "iframe without sandbox.", rationale: "No-sandbox iframe still has access to top.parent and can navigate it; partial protection only." },
      { id: "d", text: "Trust the vendor.", rationale: "Vendor compromises happen (script CDN takeover, malicious update); design defensively." },
    ],
    modelAnswer: "iframe + sandbox is the strongest isolation pattern. Empty sandbox attribute = max restriction (no scripts, no forms, no top navigation). Grant incrementally: sandbox='allow-scripts allow-popups'. Critically, do NOT add allow-same-origin if you don't trust the content — that gives it access to cookies and localStorage of its origin. Use postMessage with strict origin/source checks for cross-frame communication.",
    modules: ["24-security"],
  },
  // ─── Batch 3 end (28 questions: 17-24) ───
];

export function pickByCategory(kind: QuestionKind | "all", seed: number): Question {
  const pool = kind === "all" ? QUESTIONS : QUESTIONS.filter((q) => q.kind === kind);
  return pool[seed % pool.length];
}
