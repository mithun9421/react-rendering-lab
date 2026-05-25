"use client";

import { Lesson } from "@/engine/Lesson";
import { Step } from "@/engine/Step";
import { Callout } from "@/engine/Callout";
import { ArchitectNotes } from "@/engine/ArchitectNotes";
import { HydrationOverlay } from "@/viz/HydrationOverlay";
import { PatternGrid, type PatternItem } from "@/engine/PatternGrid";

const HYDRATION_MISMATCH_CAUSES: PatternItem[] = [
  {
    icon: "⏱️",
    title: "Time / random in render",
    bad: "<span>{Date.now()}</span>",
    good: "// server-render, hydrate client-side",
    why: "Server and client run at different instants. Use render-stable values only.",
  },
  {
    icon: "🪟",
    title: "typeof window branches",
    bad: "typeof window !== 'undefined'\n  ? <Client/> : <Server/>",
    good: "useEffect(() => setMounted(true), [])",
    why: "Different DOM on each side. Use a mounted flag toggled in useEffect.",
  },
  {
    icon: "🌍",
    title: "Locale-sensitive format",
    bad: "date.toLocaleString()",
    good: "// preformat on server, pass as string",
    why: "Server in UTC, browser in local — every render diverges.",
  },
  {
    icon: "🔑",
    title: "Auth-conditional UI",
    bad: "user ? <Avatar/> : <SignIn/>\n  // resolved at module load",
    good: "// fetch in effect, gate with isLoading",
    why: "Server saw unauthenticated; client cookie says otherwise. Defer the branch.",
  },
];

/**
 * Visual comparison of the four hydration modes, showing what each blocks
 * and what it unlocks. Compact replacement for the bullet list.
 */
function HydrationModesGrid() {
  const modes = [
    {
      icon: "🧱",
      name: "Full",
      tag: "synchronous",
      tone: "bad" as const,
      what: "One sync walk over the entire tree",
      cost: "380ms chart blocks the 60ms search",
    },
    {
      icon: "📊",
      name: "Progressive",
      tag: "priority-sorted",
      tone: "warn" as const,
      what: "Same walk, sorted by importance",
      cost: "Search hydrates first; chart still blocks the rest",
    },
    {
      icon: "🎯",
      name: "Selective",
      tag: "boundary-scoped",
      tone: "info" as const,
      what: "Mark some boundaries non-interactive",
      cost: "Footer + comments never hydrate at all",
    },
    {
      icon: "🏝️",
      name: "Islands",
      tag: "parallel",
      tone: "good" as const,
      what: "Selective AND independent per island",
      cost: "Every island hydrates in parallel",
    },
  ];
  const toneClass = {
    bad: "border-accent-bad/30 bg-accent-bad/5",
    warn: "border-accent-warn/30 bg-accent-warn/5",
    info: "border-accent-info/30 bg-accent-info/5",
    good: "border-accent-good/30 bg-accent-good/5",
  };
  const tagClass = {
    bad: "text-accent-bad",
    warn: "text-accent-warn",
    info: "text-accent-info",
    good: "text-accent-good",
  };
  return (
    <div className="not-prose grid gap-3 md:grid-cols-2">
      {modes.map((m) => (
        <div key={m.name} className={`rounded-xl border bg-bg-panel p-3 ${toneClass[m.tone]}`}>
          <div className="flex items-center gap-2">
            <span className="text-xl leading-none">{m.icon}</span>
            <span className="text-sm font-medium text-ink">{m.name}</span>
            <span className={`ml-auto font-mono text-[9px] uppercase tracking-widest ${tagClass[m.tone]}`}>
              {m.tag}
            </span>
          </div>
          <p className="mt-2 text-[12px] text-ink">{m.what}</p>
          <p className="mt-1 font-mono text-[10px] text-ink-muted">→ {m.cost}</p>
        </div>
      ))}
    </div>
  );
}

export default function Module06() {
  return (
    <Lesson slug="06-hydration">
      <Step n={1} kind="observe" title="HTML arrives. The user can see it. They still can't click anything.">
        <p>
          SSR sends an HTML payload that paints fast. Then React has to <em>hydrate</em> — walk
          the whole tree, attach event listeners, reconcile state. Until that walk finishes,
          clicks are dropped on the floor.
        </p>
      </Step>

      <Step n={2} kind="profile" title="Four hydration strategies, four overlays">
        <p>Pick a mode and press replay. Watch which components become interactive, and when.</p>
        <div className="not-prose mt-3">
          <HydrationOverlay />
        </div>
      </Step>

      <Step n={3} kind="explain" title="What each mode actually changes">
        <HydrationModesGrid />
      </Step>

      <Step n={4} kind="explain" title="Hydration mismatches — the most common production bug">
        <p>
          A mismatch means: the HTML the server rendered doesn&apos;t match what the client
          would have rendered on first pass. When it happens, React 19 invalidates a chunk of
          the tree and re-renders it client-side, costing time + visible flicker.
        </p>
        <p>The four classic causes:</p>
        <PatternGrid items={HYDRATION_MISMATCH_CAUSES} />
        <p>
          React 19&apos;s <code>onRecoverableError</code> (Module 8) surfaces these — wire it
          into your error tracker so the mismatches don&apos;t hide.
        </p>
      </Step>

      <ArchitectNotes
        framing="Hydration is where the rubber meets the road for SSR — the architect tests whether you can distinguish 'rendered' from 'interactive' and explain why the gap matters."
        followUps={[
          {
            q: "What does hydration actually do? Step by step.",
            a: "Server sends HTML — browser paints it. React's client runtime receives the same component tree (via the RSC payload or the SSR rendered tree description). It walks the existing DOM, matching each React element to its DOM node. Attaches event listeners, runs useEffects, sets up state. The page becomes interactive incrementally as boundaries hydrate. The DOM is NOT recreated — React reuses the existing nodes. If a mismatch is detected mid-walk, React falls back to client-rendering the affected subtree (and warns).",
          },
          {
            q: "Why do hydration mismatches happen, and which are most common?",
            a: "Mismatches happen when the server's rendered HTML doesn't byte-match what the client's first render would produce. Top three causes in production: (1) Date.toLocaleString — server in UTC, client in user's TZ. (2) `typeof window !== 'undefined'` branches — different DOM on each side. (3) Auth-conditional UI — server saw an unauthenticated user, client cookie says otherwise. React 19's `onRecoverableError` callback reports recovered mismatches; wire it to your error tracker.",
          },
          {
            q: "Explain selective hydration vs progressive hydration.",
            a: "Both reduce blocking. Progressive: hydrate boundaries in priority order — main content first, footer last. Selective (React 18+): when the user interacts with a not-yet-hydrated region, React reprioritises and hydrates that region first. The user clicks the footer button before main hydrated? Footer hydrates immediately, main continues. Selective is what makes streaming SSR actually feel fast — the user steers the priority by where they look and click.",
          },
          {
            q: "Why is hydration so expensive even for static content?",
            a: "Three reasons. (1) Walking the tree allocates fibers + hook records + event listeners — proportional to component count, not just visible content. (2) The first render runs effects (useEffect, useLayoutEffect) — these can compound to seconds in big apps. (3) Hydration runs after JS download + parse — so on slow connections, the JS arrives well after the HTML, blocking interactivity. The cost is unavoidable for any interactive component; it's why RSC + Islands exist (don't hydrate what doesn't need to be interactive).",
          },
          {
            q: "Walk me through how to debug a hydration warning in production.",
            a: "(1) Reproduce locally with the same data — most prod mismatches are data-driven (locale, auth). (2) Check what the server rendered vs what the client rendered: view-source vs DevTools Elements. (3) Look for Date, Math.random, conditional renders based on window/document. (4) Add `suppressHydrationWarning` ONLY as last resort, and only on the specific node — it doesn't fix the mismatch, just silences the warning. (5) For dynamic content (timestamps, randoms), the right pattern is server-render a placeholder, then swap in the dynamic value via useEffect.",
          },
        ]}
        pivots={[
          { to: "Streaming SSR (Module 7)", why: "Hydration order matters more when HTML streams; expect to discuss the interplay." },
          { to: "Islands (Module 9)", why: "If hydration is expensive, the next move is 'hydrate less'." },
          { to: "useId for stable IDs", why: "Common hydration-mismatch fix the architect may probe." },
        ]}
        dontSay={[
          {
            phrase: "Hydration is just SSR.",
            why: "SSR is the server rendering phase; hydration is the client phase that follows. They're sequential, not the same thing.",
          },
          {
            phrase: "Use `suppressHydrationWarning` everywhere.",
            why: "Silences the warning without fixing the divergence. The architect will probe whether you understand it's a band-aid, not a fix.",
          },
        ]}
      />

      <Step n={5} kind="next" title="Even islands wait for HTML">
        <Callout tone="next" title="next bottleneck">
          Hydration can&apos;t start until the byte arrives. Streaming SSR (Module 7) sends the
          shell first and lets each Suspense boundary stream in its own chunk.
        </Callout>
      </Step>
    </Lesson>
  );
}
