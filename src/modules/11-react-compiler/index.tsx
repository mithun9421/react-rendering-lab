"use client";

import { useMemo, useState } from "react";
import { Lesson } from "@/engine/Lesson";
import { Step } from "@/engine/Step";
import { Callout } from "@/engine/Callout";
import { TryIt } from "@/engine/TryIt";
import { MetricsPanel } from "@/engine/MetricsPanel";
import { ArchitectNotes } from "@/engine/ArchitectNotes";
import { useRenderCount } from "@/profiler/useRenderCount";
import { busy } from "@/lib/sim";
import { cn } from "@/lib/utils";
import { PatternGrid, type PatternItem } from "@/engine/PatternGrid";

const COMPILER_BLIND_SPOTS: PatternItem[] = [
  {
    icon: "📌",
    title: "Refs & mutable values",
    bad: "// compiler can't reason about ref.current",
    good: "// cache the value yourself",
    why: "Refs deliberately bypass React's render model — the compiler can't see through them.",
  },
  {
    icon: "🏪",
    title: "External stores",
    bad: "useStore(s => s.items.filter(...))",
    good: "useStore(selector, shallow)",
    why: "Selector identity is your job. Use the store's equality API, not just the compiler.",
  },
  {
    icon: "🌐",
    title: "Context fan-out",
    bad: "// one giant context for everything",
    good: "// split: AuthContext, ThemeContext...",
    why: "Compiler caches reads, not subscriptions. Splitting providers still matters.",
  },
  {
    icon: "🎲",
    title: "Time / random in render",
    bad: "const id = Math.random()",
    good: "// move to useEffect or useId",
    why: "Impure by definition. Compiler skips, lint shouts, your renders aren't memoised.",
  },
];

export default function Module11() {
  return (
    <Lesson slug="11-react-compiler">
      <Step n={1} kind="observe" title="useMemo, useCallback, React.memo: a tax you pay everywhere">
        <p>
          For ten years, performant React meant scattering identity glue across every component:
          memoize props, memoize callbacks, memoize children. The compiler (1.0 stable Dec 2025)
          does it for you at build time. <strong>It rewrites your component to cache values per
          input.</strong>
        </p>
      </Step>

      <Step n={2} kind="profile" title="Same component, three flavors">
        <TryIt
          title="parent re-renders every second; what does the child cost?"
          knobs={[
            { key: "manual", label: "manual useMemo + memo", default: false },
            { key: "compiled", label: "simulate React Compiler", default: false, hint: "Approximates what the compiler emits — automatic per-input caching" },
            { key: "heavy", label: "+8ms work inside child", default: true },
          ]}
          hint="Naive: child re-renders every tick. Manual: works, but bookkeeping is everywhere. Compiled: identical UX, zero hooks in user code."
        >
          {(flags) => <ChildComparison flags={flags} />}
        </TryIt>
        <div className="mt-4">
          <MetricsPanel watch={["Child:naive", "Child:manual", "Child:compiled"]} />
        </div>
      </Step>

      <Step n={3} kind="explain" title="What the compiler actually emits">
        <p>
          The compiler analyses each component, identifies render-stable values, and inserts a
          per-component <code>useMemoCache</code> hook. Conceptually:
        </p>
        <pre className="not-prose overflow-x-auto rounded-md border border-bg-border bg-bg-elevated p-3 font-mono text-[10px] leading-relaxed sm:text-[11px]">
{`// you write
function Profile({ user }) {
  const greeting = \`Hello, \${user.name}\`;
  const onLogout = () => signOut(user.id);
  return <Header text={greeting} onLogout={onLogout} />;
}

// compiler emits (sketch)
function Profile({ user }) {
  const $ = useMemoCache(3);
  let greeting; let onLogout;
  if ($[0] !== user.name) {
    greeting = \`Hello, \${user.name}\`;
    $[0] = user.name; $[1] = greeting;
  } else { greeting = $[1]; }
  if ($[2] !== user.id) {
    onLogout = () => signOut(user.id);
    $[3] = user.id; $[4] = onLogout;
  } else { onLogout = $[4]; }
  return <Header text={greeting} onLogout={onLogout} />;
}`}
        </pre>
      </Step>

      <Step n={4} kind="fix" title="The Rules of React aren't suggestions any more">
        <p>
          The compiler can only optimise <strong>pure</strong> components. It assumes you obey:
        </p>
        <ul>
          <li>Components and hooks are pure — same input, same output, no side effects in render.</li>
          <li>Don&apos;t mutate props, state, or hook return values.</li>
          <li>Don&apos;t call hooks conditionally.</li>
        </ul>
        <p>
          When ESLint with <code>eslint-plugin-react-compiler</code> flags a file, the compiler
          quietly skips it — and you lose the optimisation. The lint output is now your{" "}
          <em>perf budget</em>.
        </p>
      </Step>

      <Step n={5} kind="fix" title="Where you still need to think">
        <PatternGrid items={COMPILER_BLIND_SPOTS} columns={2} />
      </Step>

      <Step n={6} kind="explain" title="When the compiler is wrong — debug, opt-out, escape">
        <p>
          The compiler is conservative — when it can&apos;t prove purity, it leaves the
          component uncompiled. Sometimes it&apos;s wrong about a real impurity (a mutation
          that&apos;s actually safe) and you want to <em>force</em> compilation. Sometimes
          it&apos;s right but you want manual control. The escape hatches:
        </p>
        <ul>
          <li>
            <code>&apos;use no memo&apos;</code> directive at the top of a file or component — tells the
            compiler to skip this code entirely. Use when a hook lies about deps and the
            compiler is correctly leaving it alone.
          </li>
          <li>
            <code>useMemoCache</code> directly — undocumented; not the API to reach for. If
            you need this, you have a deeper problem.
          </li>
          <li>
            <code>eslint-plugin-react-compiler</code> — lints code that the compiler will
            skip. When it shouts at a file, fix the file or add <code>&apos;use no memo&apos;</code>;
            don&apos;t pretend the file is being memoised when it isn&apos;t.
          </li>
        </ul>
        <p className="text-ink-muted">
          Sanity check: the compiler doesn&apos;t change behaviour, only frequency. If your
          tests pass uncompiled, they pass compiled. If a test fails only when compilation
          turns on, your code was relying on a re-render the compiler correctly elided.
        </p>
      </Step>

      <ArchitectNotes
        framing="They're checking whether you treat the Compiler as a faith move ('it just works') or as a static analysis with concrete preconditions you can name."
        followUps={[
          {
            q: "What does the compiler actually emit? Walk me through one transformed component.",
            a: "It inserts a `useMemoCache(n)` hook at the top of each function — a fixed-size array (n = number of cacheable expressions in this component). For every memoisable expression (a derived value, a JSX element subtree, a callback), it emits an if-block: if any dependency changed since the last render, recompute and store in the cache slot; else read the slot. Conceptually: every render either reuses cached slots or refills them based on Object.is comparisons against the previous render's input identity. The runtime contract is just 'pure deps in, cached value out' — same as useMemo, but automatically inserted and exhaustive.",
          },
          {
            q: "How does the compiler decide what to memoise vs what to skip?",
            a: "Static analysis. It models which JS expressions can be safely cached based on the Rules of React: pure, immutable inputs, no side effects in render. If it sees a violation (a mutation, a Math.random in render, an impure hook return), it bails on that file and emits identity transforms — your code runs unmemoised. The linter then flags those bails so you can fix them. The contract is: obey the rules → get memoised; break them → silently uncompiled + lint shouts.",
          },
          {
            q: "When does the Compiler hurt performance?",
            a: "Rarely, but yes. The cache array adds a small per-render overhead (size n, n reads, n writes on the first render). For trivially cheap components, the bookkeeping costs more than the work it saves. The Compiler team has done benchmarks; net is a small positive across realistic apps. The edge case is a tight render loop in a tiny component — measure it. For typical app code, the wins from auto-memoised list rows + cached children swamp the bookkeeping cost.",
          },
          {
            q: "I have a third-party component library that's not Compiler-clean. What happens?",
            a: "Three options: (1) Compiler bails on that file alone — your codebase is still mostly compiled, library is uncompiled, no breakage. (2) Your own components that call that library are still compiled — the library's impurity doesn't infect your code unless you import an impure HOC. (3) For the impure library, add `'use no memo'` at the top of any file where you wrap it, to be explicit. The architecture treats compilation as a file-level opt-in/out; it doesn't need whole-app purity to start paying off.",
          },
          {
            q: "If the Compiler memoises everything, do I still need React.memo or useMemo manually?",
            a: "Rarely, but yes. The Compiler can't reason about: (a) values from refs (mutable), (b) external stores accessed via useSyncExternalStore (the SELECTOR has to be stable — Compiler doesn't memoise external state derivation), (c) context fan-out (the Compiler caches reads, not subscriptions). And `useTransition` / `useDeferredValue` aren't replaced — they're priority hints, orthogonal to memoisation. So: drop manual memo for normal derived values; keep it where the input lives outside React's tracking.",
          },
          {
            q: "How is the Compiler different from inlining manual useMemos everywhere?",
            a: "Two ways. (1) It's exhaustive — it caches every cacheable expression, including JSX subtrees and inline callbacks, which is impractical to do by hand. (2) Its cache is keyed precisely on the syntactic inputs the expression reads, not on a hand-typed deps array. exhaustive-deps lint catches the cases where humans get the deps array wrong; the Compiler doesn't need a deps array at all because it derives them. Net effect: better-than-human-quality memoisation with zero ergonomic cost.",
          },
        ]}
        pivots={[
          { to: "Rules of React (F11)", why: "Compiler depends on them; architect will probe if you can name them." },
          { to: "Server Components", why: "Pure-by-construction is a related move; they may ask 'how do RSC + Compiler interact?'" },
          { to: "Concurrent rendering", why: "Compiler memoisation enables more aggressive transition + Suspense use; expect to discuss interactions." },
        ]}
        dontSay={[
          {
            phrase: "The Compiler is a magic black box.",
            why: "It's a Babel/SWC plugin doing static analysis. Saying 'magic' signals you haven't read the docs.",
          },
          {
            phrase: "I just turn it on and forget useMemo exists.",
            why: "Partially true but lazy. The architect wants to hear about the bail conditions (refs, external state, impure hooks) where you DO still think.",
          },
          {
            phrase: "It's slower because it adds bookkeeping.",
            why: "Net it's faster on realistic apps; the bookkeeping cost is dwarfed by the avoided re-renders. Saying 'slower' suggests you didn't measure.",
          },
        ]}
      />

      <Step n={7} kind="next" title="So your client renders are free. What still isn't?">
        <Callout tone="next" title="next bottleneck">
          Compiler memoisation makes pure client work nearly free. But you&apos;re still shipping
          the code for that work to the browser. <strong>Server Components</strong> let you do
          the work where the data lives — and ship zero JS for it.
        </Callout>
      </Step>
    </Lesson>
  );
}

/* ---------- demo ---------- */

function ChildComparison({ flags }: { flags: { manual: boolean; compiled: boolean; heavy: boolean } }) {
  const [n, setN] = useState(0);

  const tick = () => setN((x) => x + 1);

  // Same input each time → all three should ideally render once
  const config = { theme: "dark" as const, lang: "en" };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <button onClick={tick} className="rounded-md bg-accent px-3 py-1.5 font-mono text-[11px] text-white">
          ↻ re-render parent ({n})
        </button>
        <span className="font-mono text-[11px] text-ink-dim">
          parent renders → children below should ideally not
        </span>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <NaiveChild label="naive" config={config} heavy={flags.heavy} />
        {flags.manual ? (
          <MemoedChild label="manual" config={config} heavy={flags.heavy} />
        ) : (
          <NaiveChild label="manual" config={config} heavy={flags.heavy} />
        )}
        {flags.compiled ? (
          <SimulatedCompilerChild label="compiled" config={config} heavy={flags.heavy} />
        ) : (
          <NaiveChild label="compiled" config={config} heavy={flags.heavy} />
        )}
      </div>
    </div>
  );
}

type ChildProps = { label: string; config: { theme: "dark" | "light"; lang: string }; heavy: boolean };

function NaiveChild({ label, config, heavy }: ChildProps) {
  const c = useRenderCount(`Child:${label}`);
  if (heavy) busy(8);
  return <ChildCard label={label} config={config} renders={c} tone="bad" />;
}

// Manual: memo the whole component AND memoize the prop
const MemoedChild = ((): React.ComponentType<ChildProps> => {
  const M = function ManualChild({ label, config, heavy }: ChildProps) {
    const c = useRenderCount(`Child:${label}`);
    // simulate what user code would do: memo derived values
    const derived = useMemo(() => {
      if (heavy) busy(8);
      return `${config.theme}/${config.lang}`;
    }, [config.theme, config.lang, heavy]);
    return <ChildCard label={label} config={config} renders={c} tone="warn" derived={derived} />;
  };
  // Approximate React.memo with default shallow compare via memoization at parent (we can't reach in here cleanly)
  // The "manual" win shows up because the heavy work is memoized — count still climbs but cost drops.
  return M;
})();

// Compiled: simulate by *literally* caching the rendered output by config-identity.
// The compiler doesn't do this exactly, but the UX is identical from the outside.
const compilerCache = new WeakMap<object, React.ReactElement>();
function SimulatedCompilerChild({ label, config, heavy }: ChildProps) {
  const c = useRenderCount(`Child:${label}`);
  // Anchor the cache to a stable config-shaped key (the compiler would key on each input)
  const key = configKey(config);
  if (compilerCache.has(key)) {
    return compilerCache.get(key)!;
  }
  if (heavy) busy(8);
  const el = <ChildCard label={label} config={config} renders={c} tone="good" derived="cached by compiler" />;
  compilerCache.set(key, el);
  return el;
}

// We need stable object identity for the demo cache; in real compiler-emitted code,
// the cache lives inside `useMemoCache` and is keyed by primitive comparisons.
const KEY_CACHE = new Map<string, object>();
function configKey(c: { theme: string; lang: string }) {
  const k = `${c.theme}|${c.lang}`;
  let obj = KEY_CACHE.get(k);
  if (!obj) {
    obj = {};
    KEY_CACHE.set(k, obj);
  }
  return obj;
}

function ChildCard({
  label,
  config,
  renders,
  tone,
  derived,
}: {
  label: string;
  config: { theme: string; lang: string };
  renders: number;
  tone: "good" | "warn" | "bad";
  derived?: string;
}) {
  return (
    <div className="rounded-lg border border-bg-border bg-bg-panel p-3">
      <div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-widest text-ink-dim">
        <span>{label}</span>
        <span
          className={cn(
            "size-1.5 rounded-full",
            tone === "good" && "bg-accent-good",
            tone === "warn" && "bg-accent-warn",
            tone === "bad" && "bg-accent-bad"
          )}
        />
      </div>
      <div
        className={cn(
          "mt-2 font-mono text-2xl tabular-nums",
          tone === "good" && "text-accent-good",
          tone === "warn" && "text-accent-warn",
          tone === "bad" && "text-accent-bad"
        )}
      >
        {renders}
      </div>
      <div className="mt-1 font-mono text-[10px] text-ink-dim">
        renders · config={config.theme}/{config.lang}
      </div>
      {derived && <div className="mt-1 font-mono text-[10px] text-ink-muted">{derived}</div>}
    </div>
  );
}
