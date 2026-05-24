"use client";

import { createContext, useContext, useEffect, useRef, useState } from "react";
import { Lesson } from "@/engine/Lesson";
import { Step } from "@/engine/Step";
import { TryIt } from "@/engine/TryIt";
import { MetricsPanel } from "@/engine/MetricsPanel";
import { BeforeAfter } from "@/engine/BeforeAfter";
import { Callout } from "@/engine/Callout";
import { Quiz } from "@/engine/Quiz";
import { ArchitectNotes } from "@/engine/ArchitectNotes";
import { DiffTree, type DiffNode } from "@/viz/DiffTree";
import { PatternGrid, type PatternItem } from "@/engine/PatternGrid";
import { StockFeed } from "@/dashboard/StockFeed";
import { useRenderCount } from "@/profiler/useRenderCount";

export default function Module01() {
  return (
    <Lesson slug="01-reconciliation">
      <Step n={1} kind="observe" title="The dashboard ticks once a second. Watch the rows flash.">
        <p>
          Below is the stock feed straight from the broken baseline. Every row briefly flashes
          on render. With <strong>bad keys</strong> turned on, the rows reuse <em>positional</em>{" "}
          identity — meaning when the array re-renders, React compares old and new at the same
          slot. The component reused at position 0 may have nothing to do with the symbol now
          at position 0.
        </p>
        <p>
          Watch the <code>StockRow:*</code> counters in the profiler at the bottom of the screen.
          They climb in lockstep across <em>every</em> row, every tick.
        </p>
      </Step>

      <Step n={2} kind="profile" title="Quantify the damage">
        <p>
          The profiler is recording. The four cards below are pulled directly from it. Note
          how the average commit duration creeps up the more rows you display.
        </p>
        <MetricsPanel watch={["StockFeed", "StockRow:AAPL", "StockRow:NVDA"]} />
      </Step>

      <Step n={3} kind="explain" title="Why does this happen? Keys are identity.">
        <p>
          React reconciles two trees position-by-position when no <code>key</code> is provided
          (or the key is the array index). If you reorder, insert, or remove items, React
          can&apos;t tell — so it keeps the old fiber, updates the props in place, and any
          internal state inside the row (focus, selection, animation progress) lives with the
          <em>wrong</em> row.
        </p>
        <p>Below is what reconciliation thinks happened in two cases:</p>

        <div className="not-prose mt-3 grid gap-3 md:grid-cols-2">
          <DiffTree
            title="key={index}  →  React thinks everything was kept"
            before={mkNodes(["AAPL", "MSFT", "GOOG", "AMZN"], "kept")}
            after={mkNodes(["MSFT", "GOOG", "AMZN", "NVDA"], "kept")}
          />
          <DiffTree
            title="key={sym}    →  React sees the move + the add"
            before={mkNodes(["AAPL", "MSFT", "GOOG", "AMZN"], "kept")}
            after={[
              { id: "MSFT", label: "MSFT", status: "moved" },
              { id: "GOOG", label: "GOOG", status: "moved" },
              { id: "AMZN", label: "AMZN", status: "moved" },
              { id: "NVDA", label: "NVDA", status: "added" },
            ]}
          />
        </div>
      </Step>

      <Step n={4} kind="fix" title="Toggle the fix and watch the row counters split">
        <TryIt
          title="key strategy"
          knobs={[
            { key: "stableKey", label: "key = symbol (stable)", default: false, hint: "Use the symbol as the key instead of the array index" },
            { key: "flash", label: "row flash on render", default: true },
          ]}
          hint="With a stable key, when only one symbol changes, only one row's render counter goes up. With the index key, every row's counter goes up every tick."
        >
          {(flags) => (
            <BeforeAfter
              before={<StockFeed badKeys tickMs={900} rowFlash={flags.flash} />}
              after={<StockFeed badKeys={!flags.stableKey} tickMs={900} rowFlash={flags.flash} />}
              labelBefore="key = index"
              labelAfter="key = symbol"
            />
          )}
        </TryIt>
      </Step>

      <Step n={5} kind="fix" title="Identity also lives in your closures">
        <p>
          A stable key is necessary but not sufficient. Even with the right keys, an unstable
          prop (a new object literal, a new function created every render) busts memoization
          and forces work down the tree. Click the button below; the right-hand panel keeps
          its identity, the left-hand panel doesn&apos;t.
        </p>
        <ReferenceIdentityDemo />
      </Step>

      <Quiz
        id="m1:keys"
        prompt="A list re-orders. Which key strategy lets React reuse the existing fibers (and any local state in each row)?"
        options={[
          {
            id: "a",
            text: "key={index}",
            rationale: "Positional identity. After reorder, slot 0 reuses the fiber for slot 0 — but the data at slot 0 changed. State migrates with position, not with data.",
          },
          {
            id: "b",
            text: "key={item.id} (stable, item-derived)",
            correct: true,
            rationale:
              "The fiber follows the item, not the slot. Reorders become 'moves' rather than 'mutations.' Local state stays attached to the right row.",
          },
          {
            id: "c",
            text: "key={Math.random()}",
            rationale: "Forces a remount of every row on every render. State is destroyed. This is what 'wrong' looks like.",
          },
          {
            id: "d",
            text: "No key — let React figure it out.",
            rationale: "React falls back to index keys and warns in dev. Same problem as (a) plus a warning.",
          },
        ]}
      />

      <Step n={6} kind="explain" title="Five anti-patterns that quietly bust reconciliation">
        <p>Each one shows up weekly in code review.</p>
        <PatternGrid items={RECONCILIATION_ANTIPATTERNS} />
      </Step>

      <Step n={7} kind="explain" title="When NOT to memoize">
        <p>
          The lab is built around the cost of <em>unstable identity</em>. But memoization has
          a cost too — every <code>useMemo</code> / <code>useCallback</code> stores a closure,
          and each comparison runs every render. Skip it when:
        </p>
        <ul>
          <li>The component is cheap and shallow. A one-line component reading two primitives
            is faster to re-render than to memoize.
          </li>
          <li>The parent re-renders less often than the child is interacted with — e.g. a
            top-level layout. Memo here adds bookkeeping for ~zero saved work.
          </li>
          <li>You ship the Compiler (Module 11). It memoises every pure component
            automatically. Manual <code>useMemo</code> on top is just noise.
          </li>
        </ul>
      </Step>

      <Step n={8} kind="fix" title="React 19 ergonomics: ref-as-prop and Context shorthand">
        <p>
          Two small wins that ship in React 19 and remove ten years of boilerplate from
          identity-related code:
        </p>
        <RefAsPropDemo />
        <p className="mt-4">
          And providers no longer need <code>.Provider</code> — pass the value directly:
        </p>
        <ContextShorthandDemo />
      </Step>

      <ArchitectNotes
        framing="They're testing whether you understand identity as the contract — keys, refs, and prop-object identity all belong in the same conceptual bucket."
        followUps={[
          {
            q: "Walk me through exactly what changes when you switch from `key={index}` to `key={item.id}` on a sortable list.",
            a: "Before: React reconciles position-by-position. After a sort, position 3 still has 'key=3' but the data at position 3 is now `items[3]`, which used to be at position 1. React reuses the position-3 fiber, calls the same component instance with new props. Internal state (focus, in-place edit flag, animation state) stays attached to position 3. After: each fiber's key is the item id. After a sort, React matches old fiber 'key=banana' to new fiber 'key=banana' — wherever they are — and moves the DOM node. The internal state moves with the data. This is what 'fiber identity follows the key' literally means.",
          },
          {
            q: "When is index keying actually correct?",
            a: "When (1) the list is append-only or unchanging in identity, AND (2) items have no per-row state. A static product list rendered from a SSR response that never reorders client-side is fine with index keys. The moment ANY reordering, insertion, or deletion mid-list is possible, you need stable id keys. The rule of thumb in code review: see `key={index}` → ask 'can this list ever reorder?' If yes, it's a bug waiting to happen.",
          },
          {
            q: "Why doesn't React.memo + index keys 'fix' this?",
            a: "Because the index-key problem isn't about whether the row re-renders — it's about which fiber gets reused. memo controls 'do I re-execute this component for new props?' but the fiber that holds the state has already been wrongly matched. The row's internal state (an in-place edit flag, for example) belongs to position 3, not to item 'banana'. memo can't fix mis-attribution.",
          },
          {
            q: "What's the cost of a Compiler-optimised render with stable keys vs without?",
            a: "Compiler memoises return values keyed on input identity. With stable keys AND stable prop objects, the Compiler skips most of your render bodies on uneventful re-renders. With unstable keys, the Compiler can't help — the fibers are wrong even before memo kicks in. Compiler is necessary but not sufficient for fast lists. Order of operations: (1) get keys right, (2) get prop identity right, (3) let the Compiler do the rest.",
          },
          {
            q: "How does this scale to 10,000 rows? When do you stop fixing reconciliation and start virtualising?",
            a: "Reconciliation is roughly O(n) in elements. For 10k rows, even cheap per-row work compounds. The crossover where 'fix the keys' stops being enough is usually ~500-1000 visible rows. Beyond that, the right answer is virtualisation (Module 10) — render only what's on screen. Stable keys still matter inside the windowed slice, but the absolute work drops 50× because you're rendering 30 rows instead of 10,000.",
          },
        ]}
        pivots={[
          { to: "Diffing algorithm internals (Module 2)", why: "Natural follow-up — they want to hear about the O(n) heuristics and the type-stable invariant." },
          { to: "Fiber alternate trees (Module 3)", why: "If you mention 'fiber identity', expect 'and what IS a fiber, exactly?'" },
          { to: "React Compiler (Module 11)", why: "If you justify a memo manually, they'll ask 'how does the Compiler change this answer?'" },
        ]}
        dontSay={[
          {
            phrase: "React.memo fixes re-renders.",
            why: "memo prevents prop-equal re-renders. It doesn't fix unstable identity, doesn't help with key mistakes, doesn't survive new function/object props. Frame it as 'memo gates re-execution; it does NOT fix the input it's gating against.'",
          },
          {
            phrase: "I always use Math.random for keys.",
            why: "Forces a remount of every row every render. State destroyed. The architect will assume you've never debugged a focus-loss bug.",
          },
          {
            phrase: "The virtual DOM compares trees.",
            why: "Vague. React compares fibers (alternate vs current) via the reconciliation algorithm. 'Virtual DOM' was 2014 marketing; senior interviewers expect 'reconciliation' and 'fibers' as the vocabulary.",
          },
        ]}
      />

      <Step n={9} kind="next" title="You fixed reconciliation. Now the diff itself becomes the wall.">
        <Callout tone="next" title="next bottleneck">
          Reconciliation is now cheap per-row. But the <strong>diffing algorithm</strong> still
          walks the entire tree on every state change — and its O(n) heuristics make some
          mistakes invisible until you violate the structural assumption. Module 2 visualizes
          how those assumptions break down.
        </Callout>
      </Step>
    </Lesson>
  );
}

function mkNodes(syms: string[], status: DiffNode["status"]): DiffNode[] {
  return syms.map((s) => ({ id: s, label: s, status }));
}

/* ----------------- Reference identity demo ----------------- */

function ReferenceIdentityDemo() {
  const [n, setN] = useState(0);

  return (
    <div className="not-prose mt-4 grid gap-3 md:grid-cols-2">
      <Panel title="unstable: new {} prop every render">
        {/* Re-created every render → child sees new ref → child re-renders */}
        <Child label="Unstable" config={{ ts: Date.now() }} />
      </Panel>

      <Panel title="stable: prop reference cached">
        <StableChild />
      </Panel>

      <div className="md:col-span-2">
        <button
          onClick={() => setN((x) => x + 1)}
          className="rounded-md bg-accent px-3 py-1.5 text-xs font-medium text-white"
        >
          Force parent re-render ({n})
        </button>
      </div>
    </div>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-bg-border bg-bg-panel p-3">
      <p className="mb-2 font-mono text-[10px] uppercase tracking-widest text-ink-dim">{title}</p>
      {children}
    </div>
  );
}

const STABLE = { ts: 0 } as const;

function StableChild() {
  return <Child label="Stable" config={STABLE} />;
}

function Child({ label, config }: { label: string; config: { ts: number } }) {
  const count = useRenderCount(`Child:${label}`);
  return (
    <div className="rounded bg-bg-elevated px-3 py-2 font-mono text-xs">
      {label} · rendered <span className="text-accent-warn">{count}</span> times · config.ts=
      {config.ts}
    </div>
  );
}

/* ----------------- React 19 ref-as-prop demo ----------------- */

/** React 19 lets you take `ref` directly as a prop. No forwardRef wrapper, no double signature. */
function FancyInput({ ref, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { ref?: React.Ref<HTMLInputElement> }) {
  return (
    <input
      ref={ref}
      {...props}
      className="w-full rounded-md border border-bg-border bg-bg-elevated px-3 py-2 font-mono text-sm placeholder:text-ink-dim focus:outline-none focus:ring-2 focus:ring-accent/40"
    />
  );
}

function RefAsPropDemo() {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <div className="not-prose mt-3 grid gap-3 md:grid-cols-2">
      <div className="rounded-lg border border-bg-border bg-bg-panel p-3">
        <p className="mb-2 font-mono text-[10px] uppercase tracking-widest text-ink-dim">
          live · click the button to focus
        </p>
        <FancyInput ref={ref} placeholder="type here…" />
        <button
          onClick={() => ref.current?.focus()}
          className="mt-2 rounded-md bg-accent px-3 py-1.5 font-mono text-[11px] text-white"
        >
          focus FancyInput
        </button>
      </div>
      <pre className="overflow-x-auto rounded-md border border-bg-border bg-bg-elevated p-3 font-mono text-[10px] leading-relaxed">
{`// React 18 — boilerplate
const FancyInput = forwardRef<HTMLInputElement, Props>(
  function FancyInput(props, ref) {
    return <input ref={ref} {...props} />;
  }
);

// React 19 — plain prop
function FancyInput({ ref, ...props }: Props & {
  ref?: React.Ref<HTMLInputElement>;
}) {
  return <input ref={ref} {...props} />;
}`}
      </pre>
    </div>
  );
}

/* ----------------- React 19 <Context value> shorthand ----------------- */

const ThemeCtx = createContext<"dark" | "light">("dark");

function ContextShorthandDemo() {
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  return (
    <div className="not-prose mt-3 grid gap-3 md:grid-cols-2">
      <div className="rounded-lg border border-bg-border bg-bg-panel p-3">
        <p className="mb-2 font-mono text-[10px] uppercase tracking-widest text-ink-dim">live</p>
        {/* React 19: <ThemeCtx value=...> (no .Provider) */}
        <ThemeCtx value={theme}>
          <ThemedSwatch />
        </ThemeCtx>
        <button
          onClick={() => setTheme((t) => (t === "dark" ? "light" : "dark"))}
          className="mt-3 rounded-md bg-accent px-3 py-1.5 font-mono text-[11px] text-white"
        >
          toggle theme ({theme})
        </button>
      </div>
      <pre className="overflow-x-auto rounded-md border border-bg-border bg-bg-elevated p-3 font-mono text-[10px] leading-relaxed">
{`// React 18
<ThemeCtx.Provider value={theme}>
  <App />
</ThemeCtx.Provider>

// React 19
<ThemeCtx value={theme}>
  <App />
</ThemeCtx>`}
      </pre>
    </div>
  );
}

function ThemedSwatch() {
  const t = useContext(ThemeCtx);
  return (
    <div
      className="grid h-12 place-items-center rounded-md border border-bg-border font-mono text-xs"
      style={{
        background: t === "dark" ? "#15151a" : "#f4f4f6",
        color: t === "dark" ? "#e7e7ea" : "#15151a",
      }}
    >
      theme = {t}
    </div>
  );
}

const RECONCILIATION_ANTIPATTERNS: PatternItem[] = [
  {
    icon: "🎲",
    title: "Generated keys",
    bad: "key={Math.random()}",
    good: "key={item.id}",
    why: "Random keys break identity every render — full remount, lost focus, lost scroll.",
  },
  {
    icon: "🔄",
    title: "Inline object props",
    bad: "style={{ padding: 8 }}",
    good: "const PAD = { padding: 8 } // hoist",
    why: "New object identity every render busts memo. Hoist or memoize.",
  },
  {
    icon: "👆",
    title: "Inline handlers",
    bad: "onClick={() => doX(id)}",
    good: "useCallback or data-* delegation",
    why: "Same problem as inline objects — fresh fn identity every render.",
  },
  {
    icon: "📦",
    title: "Unnecessary wrappers",
    bad: "<div><List items={...} /></div>",
    good: "<List items={...} />",
    why: "Extra wrappers force the diff to compare wrappers, not children.",
  },
  {
    icon: "💥",
    title: "Components defined in render",
    bad: "function Outer() {\n  const Inner = () => ...\n  return <Inner />\n}",
    good: "// hoist Inner above Outer",
    why: "New component type every parent render → unmount every child.",
  },
];
