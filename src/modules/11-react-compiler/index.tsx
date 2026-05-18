"use client";

import { useMemo, useState } from "react";
import { Lesson } from "@/engine/Lesson";
import { Step } from "@/engine/Step";
import { Callout } from "@/engine/Callout";
import { TryIt } from "@/engine/TryIt";
import { MetricsPanel } from "@/engine/MetricsPanel";
import { useRenderCount } from "@/profiler/useRenderCount";
import { busy } from "@/lib/sim";
import clsx from "clsx";

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
        <pre className="not-prose overflow-auto rounded-md border border-bg-border bg-bg-elevated p-3 font-mono text-[11px]">
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
        <ul>
          <li><strong>Refs and mutable values</strong> — the compiler can&apos;t reason about them. Cache them yourself.</li>
          <li><strong>External stores (Zustand, Redux)</strong> — selectors still need stable references; use the store&apos;s selector API.</li>
          <li><strong>Context fan-out</strong> — splitting providers still matters. The compiler caches reads, not subscriptions.</li>
          <li><strong>Render-time work that depends on time/random</strong> — by definition impure. Move to effects.</li>
        </ul>
      </Step>

      <Step n={6} kind="next" title="So your client renders are free. What still isn't?">
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
          className={clsx(
            "size-1.5 rounded-full",
            tone === "good" && "bg-accent-good",
            tone === "warn" && "bg-accent-warn",
            tone === "bad" && "bg-accent-bad"
          )}
        />
      </div>
      <div
        className={clsx(
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
