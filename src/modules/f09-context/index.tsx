"use client";

import { createContext, useContext, useState } from "react";
import { Lesson } from "@/engine/Lesson";
import { Step } from "@/engine/Step";
import { Callout } from "@/engine/Callout";
import { Quiz } from "@/engine/Quiz";
import { ArchitectNotes } from "@/engine/ArchitectNotes";

const ThemeCtx = createContext<"dark" | "light">("dark");

export default function F09Context() {
  return (
    <Lesson slug="f09-context">
      <Step n={1} kind="observe" title="Context — broadcast a value through the tree">
        <pre className="not-prose overflow-x-auto rounded-md border border-bg-border bg-bg-elevated p-3 font-mono text-[11px] leading-relaxed">
{`// 1. Create — one per concept (theme, locale, auth user)
const ThemeCtx = createContext<"dark" | "light">("dark");

// 2. Provide — wrap the subtree
<ThemeCtx value={theme}>
  <App/>
</ThemeCtx>

// 3. Consume — anywhere in the subtree
function Button() {
  const theme = useContext(ThemeCtx);
  return <button className={theme}>...</button>;
}`}
        </pre>
        <p className="mt-3">
          The new <code>&lt;Context value=&#125;</code> shorthand is React 19 — drops{" "}
          <code>.Provider</code>. The old form still works.
        </p>
      </Step>

      <Step n={2} kind="profile" title="Try it">
        <ThemeDemo />
      </Step>

      <Step n={3} kind="explain" title="The fan-out trap">
        <p>
          When context value changes, <strong>every consumer</strong> re-renders. There&apos;s
          no selector. A consumer reading only <code>theme</code> still re-renders when{" "}
          <code>cart.count</code> changes if both live in the same context value object.
        </p>
        <pre className="not-prose mt-3 overflow-x-auto rounded-md border border-bg-border bg-bg-elevated p-3 font-mono text-[11px] leading-relaxed">
{`// BAD — one context for unrelated state
<AppCtx value={{ theme, cart, user }}>
  // every consumer re-renders on ANY of these changing

// GOOD — split contexts
<ThemeCtx value={theme}>
  <CartCtx value={cart}>
    <UserCtx value={user}>
      // theme consumers re-render only on theme change`}
        </pre>
      </Step>

      <Step n={4} kind="explain" title="Memo doesn't save you from context re-renders">
        <p>
          <code>React.memo</code> compares PROPS. Context isn&apos;t a prop — it&apos;s a
          subscription. A memo&apos;d component that calls <code>useContext</code> STILL
          re-renders on every context value change. To skip context-driven renders, you need
          either (a) split the context, or (b) move to an external store with selector-based
          subscriptions (useSyncExternalStore).
        </p>
      </Step>

      <Quiz
        id="f09:context-or-store"
        prompt="A frequently-updated cart object lives in context. Header reads cart.count. Header re-renders on every cart change. What do you do?"
        options={[
          {
            id: "a",
            text: "Wrap Header in React.memo.",
            rationale: "memo compares props. Header uses context, not a prop. memo doesn't help.",
          },
          {
            id: "b",
            text: "Split the context: CartCountCtx and CartItemsCtx.",
            rationale: "Helps if count and items change at different rates. Limited if they change together.",
          },
          {
            id: "c",
            text: "Move cart to an external store; Header subscribes only to count via a selector (useSyncExternalStore).",
            correct: true,
            rationale: "The store + selector pattern gives FINE-GRAINED subscriptions. Header re-renders only when count changes, not when items change. This is what Zustand/Redux/Jotai exist for.",
          },
          {
            id: "d",
            text: "Move Header out of the provider tree.",
            rationale: "Header still needs the count. Moving it out means lifting the value somewhere else, which just moves the problem.",
          },
        ]}
      />

      <ArchitectNotes
        framing="Context probes whether you understand it's a BROADCAST mechanism — not a store. The architect tests the boundary between 'use context' and 'use a store.'"
        followUps={[
          {
            q: "Why doesn't context support selectors?",
            a: "React's context model is value-broadcast: when the value changes, every consumer subscribed to that context re-renders. Adding selector support would require tracking which consumers depend on which slices — that's what external stores already do via useSyncExternalStore. The React team decided not to bake selector support into context; instead, split contexts or escalate to a store. The architect tests if you understand this is a design choice with a reason, not a limitation.",
          },
          {
            q: "Walk me through the decision tree: prop, context, or store.",
            a: "Props for 1-3 levels of explicit data flow. Context for tree-wide values that change RARELY (theme, locale, auth user, feature flags). Store for tree-wide values that change FREQUENTLY and need per-slice subscriptions (cart, real-time data, complex form state). The thresholds: prop drilling becomes painful at 4+ levels; context fan-out becomes a perf problem when the value changes more than ~10 times per session.",
          },
          {
            q: "How does context interact with concurrent rendering?",
            a: "Context reads are STABLE within a single render — useContext returns the same value throughout. Concurrent React can abort + replay a render, which re-reads context fresh; no tearing. The architect may probe: 'what about cross-render consistency?' Answer: that's what useSyncExternalStore exists for, when the source of truth lives outside React's render loop. Context lives INSIDE React's render loop, so it's already consistent.",
          },
          {
            q: "What's the cost of one extra Provider in a deeply-nested tree?",
            a: "Negligible at render time — Providers are cheap fibers. The cost is broadcast: a Provider with N consumers triggers N re-renders when its value changes. So 'wrapping the world in a Provider' is fine; CHANGING the Provider's value frequently is what hurts. Mitigation: stable value identity via useMemo. New object every render with same shape = unnecessary re-renders for consumers because Object.is sees a new reference.",
          },
        ]}
        pivots={[
          { to: "useSyncExternalStore (Module 16)", why: "When context fan-out becomes a perf problem, this is the next step." },
          { to: "Server Components context", why: "RSC can read context but with limitations — architect may probe." },
          { to: "Provider composition", why: "Deep apps stack Provider trees — how do you manage them?" },
        ]}
        dontSay={[
          {
            phrase: "Context is for global state.",
            why: "Imprecise. Context is for VALUES that need tree-wide reach without prop drilling. 'Global state' usually wants a store with selectors.",
          },
          {
            phrase: "Wrap in memo to prevent context re-renders.",
            why: "Doesn't work. Memo doesn't see context subscriptions.",
          },
        ]}
      />

      <Step n={5} kind="next" title="Once you reuse logic, you reach for hooks of your own.">
        <Callout tone="next" title="next foundation">
          Custom hooks are the React-native way to extract reusable logic — same pattern as
          contexts and providers, just for state + effects. Foundation 10.
        </Callout>
      </Step>
    </Lesson>
  );
}

function ThemeDemo() {
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  return (
    <div className="not-prose mt-3 rounded-md border border-bg-border bg-bg-elevated p-3">
      <ThemeCtx value={theme}>
        <ChildA />
      </ThemeCtx>
      <button
        onClick={() => setTheme((t) => (t === "dark" ? "light" : "dark"))}
        className="mt-2 rounded-md bg-accent px-3 py-1.5 font-mono text-[11px] text-white"
      >
        toggle theme
      </button>
    </div>
  );
}
function ChildA() {
  return (
    <div>
      <ChildB />
    </div>
  );
}
function ChildB() {
  return (
    <div>
      <ChildC />
    </div>
  );
}
function ChildC() {
  const theme = useContext(ThemeCtx);
  return (
    <div
      className="grid h-10 place-items-center rounded font-mono text-xs"
      style={{
        background: theme === "dark" ? "#15151a" : "#f0f0f0",
        color: theme === "dark" ? "#e7e7ea" : "#1a1a1a",
      }}
    >
      theme = {theme}  (no props drilled through ChildA/ChildB)
    </div>
  );
}
