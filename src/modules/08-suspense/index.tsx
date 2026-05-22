"use client";

import { Component, Suspense, use, useState } from "react";
import { cn } from "@/lib/utils";
import { Lesson } from "@/engine/Lesson";
import { Step } from "@/engine/Step";
import { Callout } from "@/engine/Callout";
import { ArchitectNotes } from "@/engine/ArchitectNotes";
import { TryIt } from "@/engine/TryIt";

export default function Module08() {
  return (
    <Lesson slug="08-suspense">
      <Step n={1} kind="observe" title="Nested spinners or one coordinated load?">
        <p>
          Three components fetch three things. Either each shows its own spinner and the user
          sees flicker for 300ms · 600ms · 900ms — or you hoist a boundary above all three and
          show one coordinated skeleton. The trade is latency vs. cohesion.
        </p>
      </Step>

      <Step n={2} kind="profile" title="Toggle boundaries">
        <TryIt
          title="boundary placement"
          knobs={[
            { key: "perComponent", label: "boundary per component", default: true },
            { key: "shared", label: "single shared boundary", default: false },
          ]}
          hint="Per-component: each finishes independently — fast but flickery. Shared: one skeleton, then everything at once — cohesive but waits for the slowest."
        >
          {(flags) => <Waterfall mode={flags.shared && !flags.perComponent ? "shared" : "per"} />}
        </TryIt>
      </Step>

      <Step n={3} kind="explain" title="Suspense as backpressure">
        <p>
          A <code>Suspense</code> boundary is more than a spinner — it&apos;s a checkpoint where
          React can <em>pause</em> a tree. Children fetch in parallel above it; the boundary
          renders fallback until all are ready. Nest carefully: every boundary is also a
          waterfall opportunity.
        </p>
      </Step>

      <Step n={4} kind="fix" title="cache() — request de-duplication, the right way">
        <p>
          Two siblings call <code>getUser(42)</code> in the same render. Without help they fire
          two network requests. <code>cache()</code> from React memoizes the result by argument
          identity for the lifetime of the request — one fetch, two readers.
        </p>
        <pre className="not-prose mt-3 overflow-x-auto rounded-md border border-bg-border bg-bg-elevated p-3 font-mono text-[10px] leading-relaxed">
{`import { cache } from "react";

export const getUser = cache(async (id: number) => {
  console.log("fetch", id); // logs ONCE even if called 5 times
  const r = await fetch(\`/api/users/\${id}\`);
  return r.json();
});

// In two sibling server components:
const a = await getUser(42);  // hits the network
const b = await getUser(42);  // returns the cached result`}
        </pre>
        <CacheDemo />
      </Step>

      <Step n={5} kind="fix" title="Suspense + ErrorBoundary retry — the real pairing">
        <p>
          Suspense handles <em>pending</em>. Error boundaries handle <em>rejected</em>. The
          retry pattern below is the one production apps actually ship — reset the boundary,
          drop the cached promise, re-suspend.
        </p>
        <ErrorRetryDemo />
      </Step>

      <Step n={6} kind="fix" title="React 19's finer-grained error callbacks">
        <p>
          <code>createRoot</code> and <code>hydrateRoot</code> grew three new callbacks. They
          replace the &quot;everything is a console.error&quot; era:
        </p>
        <ul>
          <li>
            <code>onCaughtError(err, info)</code> — fires when an ErrorBoundary <em>catches</em>{" "}
            the error. Use to log handled exceptions to your tracker.
          </li>
          <li>
            <code>onUncaughtError(err, info)</code> — fires when nothing catches. Use to crash
            the session and reload.
          </li>
          <li>
            <code>onRecoverableError(err, info)</code> — fires for things React itself
            recovered from (e.g. a hydration mismatch it retried). Useful as a health signal.
          </li>
        </ul>
        <pre className="not-prose mt-3 overflow-x-auto rounded-md border border-bg-border bg-bg-elevated p-3 font-mono text-[10px] leading-relaxed">
{`hydrateRoot(document, <App />, {
  onCaughtError(err, info)      { tracker.warn(err, info); },
  onUncaughtError(err, info)    { tracker.crash(err, info); reloadSoon(); },
  onRecoverableError(err, info) { tracker.info("react recovered", err); },
});`}
        </pre>
      </Step>

      <ArchitectNotes
        framing="Suspense is the only React primitive that's both a rendering mechanism AND a UX pattern. The architect tests if you can talk about both — the throw-a-promise mechanism, and the boundary-placement design."
        followUps={[
          {
            q: "How does Suspense actually work? What does 'a component suspends' mean?",
            a: "It THROWS a Promise. Literally — when use(promise) sees an unresolved promise, it throws it as if it were an exception. React's renderer is wrapped in a try/catch that catches Promises specifically. On catch, React: (a) records which Suspense boundary is the closest ancestor, (b) renders the boundary's fallback, (c) calls .then() on the promise, (d) re-renders the boundary when the promise resolves. It's the same control-flow trick error boundaries use — throwing as escape, with separate catch behaviour for Promises vs errors.",
          },
          {
            q: "When do you put a Suspense boundary, and how do you choose granularity?",
            a: "Three principles. (1) Granularity matches 'units that load together' — a profile card with avatar + name + bio loads as one unit, not three. (2) Above critical-path components for fast TTFB on slow data — wrap the slow widget in its own boundary so the rest renders. (3) BELOW navigation — the route shouldn't suspend on data; the page should. The architect wants to hear about user-facing design, not just throw-a-promise.",
          },
          {
            q: "What's the difference between Suspense and a manual loading state?",
            a: "Suspense COMPOSES across boundaries. A boundary catches any descendant's suspension. With manual `isLoading` state, every async component manages its own UI; you can't coordinate. Suspense ALSO interacts with transitions (keeps previous content visible during navigation), with streaming (each boundary is a flush point), and with selective hydration (each boundary is a hydration unit). Manual state gives you none of that. The architect cares: 'why is Suspense fundamentally different from a useState(isLoading)?' Composability across the system.",
          },
          {
            q: "How does `cache()` interact with Suspense?",
            a: "cache() de-duplicates the promise so multiple components reading the same key share one fetch. Without cache(): two siblings calling getUser(42) fire two requests, both suspend, the boundary waits for both. With cache(): one fetch, both siblings receive the same promise, the boundary waits once. Critical for Server Components where data is fetched per-component but you want to avoid N×duplicate queries. The architect may follow up: 'when does cache() NOT help?' — when calls happen across requests (cache is request-scoped).",
          },
          {
            q: "Suspense fallback shows for 50ms then real content arrives — the user sees a flicker. How do you fix it?",
            a: "Two options. (1) Wrap the navigation in startTransition — React shows the OLD content for up to ~500ms while the new tree loads, only swaps to fallback if it takes longer. The user sees a smooth swap. (2) Use a min-display-time pattern where the fallback uses CSS transitions to fade in/out, smoothing the swap. Pick (1) when the boundary represents a route change; pick (2) when it's a data refresh.",
          },
        ]}
        pivots={[
          { to: "Streaming SSR (Module 7)", why: "Suspense is what streaming flushes around." },
          { to: "Error boundaries", why: "Same throw-as-escape mechanism, different catch behaviour." },
          { to: "Transitions + Suspense", why: "Most senior questions land here — the interplay is the answer." },
        ]}
        dontSay={[
          {
            phrase: "Suspense is just for loading states.",
            why: "Loading states are the consumer surface. The mechanism (throw-a-promise + boundary catch) does much more — drives streaming, drives selective hydration, drives RSC.",
          },
          {
            phrase: "Don't nest Suspense boundaries.",
            why: "Nesting is intentional. The architect will probe whether you understand the nested-boundary semantics — innermost catches first.",
          },
        ]}
      />

      <Step n={7} kind="next" title="Async sorted out. Now: hydration cost.">
        <Callout tone="next" title="next bottleneck">
          Even with perfect Suspense, hydrating non-interactive HTML wastes bandwidth and CPU.
          Module 9: ship JS only for the islands that need it.
        </Callout>
      </Step>
    </Lesson>
  );
}

/* ---------- waterfall demo ---------- */

type Mode = "per" | "shared";

function Waterfall({ mode }: { mode: Mode }) {
  const [run, setRun] = useState(0);
  return (
    <div>
      <button
        onClick={() => setRun((r) => r + 1)}
        className="mb-3 rounded-md bg-accent px-3 py-1.5 font-mono text-[11px] text-white"
      >
        ↻ refetch all
      </button>
      <div className="space-y-2">
        {mode === "per" ? (
          <>
            <Fetcher key={`a-${run}`} label="profile" ms={300} tone="accent-info" />
            <Fetcher key={`b-${run}`} label="orders" ms={600} tone="accent-warm" />
            <Fetcher key={`c-${run}`} label="recommendations" ms={900} tone="accent-good" />
          </>
        ) : (
          <SharedBoundary key={`s-${run}`} />
        )}
      </div>
    </div>
  );
}

function Fetcher({ label, ms, tone }: { label: string; ms: number; tone: string }) {
  const [done, setDone] = useState(false);
  useState(() => {
    setTimeout(() => setDone(true), ms);
    return null;
  });
  return (
    <div
      className={cn(
        "rounded-md border border-bg-border bg-bg-elevated p-3 font-mono text-xs transition",
        done ? "" : "animate-pulse"
      )}
    >
      <div className="flex items-center justify-between">
        <span>{label}</span>
        <span className={done ? `text-${tone}` : "text-ink-dim"}>{done ? "ready" : `loading ${ms}ms`}</span>
      </div>
    </div>
  );
}

function SharedBoundary() {
  const [done, setDone] = useState(false);
  useState(() => {
    setTimeout(() => setDone(true), 900);
    return null;
  });
  if (!done) {
    return (
      <div className="space-y-2">
        {["profile", "orders", "recommendations"].map((l) => (
          <div key={l} className="rounded-md border border-bg-border bg-bg-elevated p-3 font-mono text-xs animate-pulse">
            <div className="flex items-center justify-between">
              <span>{l}</span>
              <span className="text-ink-dim">awaiting shared boundary…</span>
            </div>
          </div>
        ))}
      </div>
    );
  }
  return (
    <div className="space-y-2">
      {["profile", "orders", "recommendations"].map((l) => (
        <div key={l} className="rounded-md border border-bg-border bg-bg-elevated p-3 font-mono text-xs">
          <div className="flex items-center justify-between">
            <span>{l}</span>
            <span className="text-accent-good">ready</span>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ---------- cache() demo (simulated, since `cache()` is RSC-only) ---------- */

const inflight = new Map<number, { p: Promise<{ id: number; name: string }>; hits: number }>();

function simulatedCached(id: number) {
  const existing = inflight.get(id);
  if (existing) {
    existing.hits += 1;
    return existing;
  }
  const rec = {
    p: new Promise<{ id: number; name: string }>((res) => {
      setTimeout(() => res({ id, name: `user-${id}` }), 700);
    }),
    hits: 1,
  };
  inflight.set(id, rec);
  return rec;
}

function CacheDemo() {
  const [run, setRun] = useState(0);
  return (
    <div className="not-prose mt-4">
      <div className="mb-2 flex items-center gap-2 text-xs">
        <button
          onClick={() => {
            inflight.clear();
            setRun((r) => r + 1);
          }}
          className="rounded-md bg-accent px-3 py-1.5 font-mono text-[11px] text-white"
        >
          ↻ render two siblings, each calls getUser(42)
        </button>
      </div>
      <Suspense
        key={run}
        fallback={
          <div className="space-y-2">
            <div className="h-3 w-2/3 animate-pulse rounded bg-bg-border" />
            <div className="h-3 w-1/2 animate-pulse rounded bg-bg-border" />
          </div>
        }
      >
        <CachedSiblings />
      </Suspense>
    </div>
  );
}

function CachedSiblings() {
  const rec = simulatedCached(42);
  const a = use(rec.p);
  const b = use(rec.p);
  return (
    <div className="rounded-md border border-bg-border bg-bg-panel p-3 font-mono text-xs">
      <div>sibling A read user: {a.name}</div>
      <div>sibling B read user: {b.name}</div>
      <div className="mt-2 text-accent-good">network calls: 1 · cache hits: {rec.hits - 1}</div>
    </div>
  );
}

/* ---------- Suspense + ErrorBoundary retry ---------- */

let retryAttempt = 0;
const retryPromiseCache = new Map<number, Promise<string>>();
function flakyData(attempt: number) {
  if (!retryPromiseCache.has(attempt)) {
    retryPromiseCache.set(
      attempt,
      new Promise<string>((res, rej) => {
        setTimeout(() => {
          // fail the first attempt, succeed the second
          if (attempt === 0) rej(new Error("network timeout (simulated)"));
          else res(`payload v${attempt}`);
        }, 500);
      })
    );
  }
  return retryPromiseCache.get(attempt)!;
}

function ErrorRetryDemo() {
  const [key, setKey] = useState(0);
  const reset = () => {
    retryAttempt += 1;
    retryPromiseCache.clear();
    setKey((k) => k + 1);
  };
  return (
    <div className="not-prose mt-3 rounded-lg border border-bg-border bg-bg-panel p-3">
      <RetryErrorBoundary onReset={reset} key={key}>
        <Suspense
          fallback={
            <div className="rounded-md border border-bg-border bg-bg-elevated p-3 font-mono text-[11px] text-ink-muted">
              fetching…
            </div>
          }
        >
          <FlakyChild />
        </Suspense>
      </RetryErrorBoundary>
    </div>
  );
}

function FlakyChild() {
  const data = use(flakyData(retryAttempt));
  return (
    <div className="rounded-md border border-accent-good/40 bg-accent-good/10 p-3 font-mono text-xs">
      ✓ {data}
    </div>
  );
}

class RetryErrorBoundary extends Component<{ children: React.ReactNode; onReset: () => void }, { err?: Error }> {
  state: { err?: Error } = {};
  static getDerivedStateFromError(err: Error) {
    return { err };
  }
  render() {
    if (this.state.err) {
      return (
        <div className="space-y-2">
          <div className="rounded-md border border-accent-bad/40 bg-accent-bad/10 p-3 font-mono text-xs text-accent-bad">
            ⨯ {this.state.err.message}
          </div>
          <button
            onClick={() => {
              this.setState({ err: undefined });
              this.props.onReset();
            }}
            className="rounded-md bg-accent px-3 py-1.5 font-mono text-[11px] text-white"
          >
            retry (next attempt succeeds)
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
