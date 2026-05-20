"use client";

import { Component, Suspense, createContext, use, useState } from "react";
import { Lesson } from "@/engine/Lesson";
import { Step } from "@/engine/Step";
import { Callout } from "@/engine/Callout";
import { ArchitectNotes } from "@/engine/ArchitectNotes";
import { TryIt } from "@/engine/TryIt";

export default function Module14() {
  return (
    <Lesson slug="14-use-hook">
      <Step n={1} kind="observe" title="use() is the first hook that breaks the rules of hooks">
        <p>
          <code>use()</code> is the only hook you&apos;re allowed to call <strong>conditionally</strong>{" "}
          and <strong>inside loops</strong>. Why? Because it isn&apos;t state — it&apos;s a resource
          read. Two flavours:
        </p>
        <ul>
          <li><code>use(promise)</code> — suspends until the promise resolves, throws on reject.</li>
          <li><code>use(context)</code> — reads the nearest provider, same as <code>useContext</code>, but legal in branches.</li>
        </ul>
      </Step>

      <Step n={2} kind="profile" title="Suspend on a promise — no useEffect, no isLoading flag">
        <TryIt
          title="fetch with use()"
          knobs={[
            { key: "slow", label: "slow network (1.5s)", default: false },
            { key: "fail", label: "fail the request", default: false },
          ]}
          hint="No state machine. The Suspense boundary catches the throw, shows the fallback, and re-renders when the promise resolves. The ErrorBoundary catches rejection."
        >
          {(flags) => <UseDemo key={`${flags.slow}-${flags.fail}`} slow={flags.slow} fail={flags.fail} />}
        </TryIt>
      </Step>

      <Step n={3} kind="explain" title="What 'suspending' actually means">
        <p>
          When <code>use(promise)</code> sees an unresolved promise, it <em>throws</em> it.
          Suspense catches the thrown promise, registers a <code>.then()</code>, displays the
          fallback, and re-renders when the promise resolves. This is the same mechanism that
          lets RSC stream chunks lazily.
        </p>
      </Step>

      <Step n={4} kind="explain" title="Conditional use(context)">
        <div className="not-prose mt-3">
          <ConditionalContextDemo />
        </div>
        <p className="mt-3">
          Try toggling the &quot;authenticated&quot; switch. The child only reads{" "}
          <code>AuthContext</code> when authenticated — that&apos;s illegal with{" "}
          <code>useContext</code>, perfectly fine with <code>use()</code>.
        </p>
      </Step>

      <ArchitectNotes
        framing="The `use()` hook breaks two old rules (conditional calls, in-loop calls). The architect tests whether you understand WHY it gets a pass — and whether you can articulate the relationship to Suspense."
        followUps={[
          {
            q: "Why is `use()` allowed to be called conditionally when other hooks aren't?",
            a: "Hooks live on the fiber's memoizedState linked list, indexed by call order. Conditional calls would mis-align the indices. `use()` is special: it doesn't allocate a slot on memoizedState — it's a READ operation. For a Promise, it throws (Suspense catches). For Context, it does a context lookup. Neither needs a stable slot on the fiber. The architect may probe further: 'so what about state inside `use`?' Answer: `use()` itself doesn't hold state; its inputs (Promise / Context) hold their own state outside the fiber.",
          },
          {
            q: "Why is `use(promise)` always paired with a Suspense boundary?",
            a: "Because `use(promise)` throws the promise. Without a Suspense boundary up the tree, the throw propagates to the error boundary (or the root) — same as an unhandled error. Suspense is what catches the thrown Promise specifically, distinguishes it from an error, and renders the fallback. The architect tests if you know: `use(promise)` is a control-flow primitive that requires the catcher upstream.",
          },
          {
            q: "What's the difference between `use(myPromise)` and `await myPromise`?",
            a: "`await` requires an async function. Components aren't async (except RSC). `await` schedules continuation as a microtask. `use(promise)` works in synchronous render contexts by throwing the promise — React's renderer catches, schedules a re-render when the promise resolves. Different mechanism, same effect: 'this code reads a value that requires waiting.' In RSC, you CAN `await` directly because the component IS async; on the client, `use(promise)` is the only way to wait inside a render.",
          },
          {
            q: "What is `cache()` and why does it pair with `use(promise)`?",
            a: "cache() de-duplicates a function call within a single request. Same arguments → same promise. Without cache(), two siblings calling `getUser(42)` produce two requests; with cache(), they share one. Combined with `use(promise)`: each sibling calls `use(getUser(42))`, both suspend on the same promise, the boundary waits once. The architect may follow up: 'when is cache() not enough?' Answer: cross-request caching (cache is request-scoped). For longer-lived caches, escalate to fetch's revalidate, or a real cache layer.",
          },
          {
            q: "Talk me through using `use(context)` conditionally — when would you do that?",
            a: "Common case: auth-gated UI. `if (!authed) return <Guest/>; const user = use(AuthContext);`. The component renders the guest path without touching the auth context (cheap; no subscription). Only the auth path reads it. With `useContext` you'd have to read unconditionally — losing the bail-out perf. The architect cares: 'what about when context is undefined?' Answer: `use(MaybeContext)` returns `undefined` if no provider; combine with a null-guard for graceful degradation.",
          },
        ]}
        pivots={[
          { to: "Suspense (Module 8)", why: "Throw-a-promise mechanism shared with Suspense." },
          { to: "RSC + async components (Module 12)", why: "RSC can use await; clients use use() — discuss the symmetry." },
          { to: "Error boundaries", why: "use(promise.then(reject)) → boundary catches rejection." },
        ]}
        dontSay={[
          {
            phrase: "use() is just useEffect.",
            why: "Effects run AFTER render; use() suspends DURING render. Different timing, different mental model.",
          },
          {
            phrase: "use() works without Suspense.",
            why: "For Context, yes. For Promises, you need a Suspense boundary or the throw propagates uncaught.",
          },
        ]}
      />

      <Step n={5} kind="next" title="One hook to stream them all">
        <Callout tone="next" title="next bottleneck">
          <code>use()</code> + Suspense + Server Components together compose into{" "}
          <strong>Partial Prerendering</strong> — a static shell with dynamic suspense holes,
          shipped from the CDN. Module 15.
        </Callout>
      </Step>
    </Lesson>
  );
}

/* ---------- use(promise) demo ---------- */

// Module-level cache so we don't recreate the promise on every render
const promiseCache = new Map<string, Promise<{ payload: string }>>();
function getPayloadPromise(slow: boolean, fail: boolean) {
  const key = `${slow}-${fail}`;
  if (!promiseCache.has(key)) {
    promiseCache.set(
      key,
      new Promise((resolve, reject) => {
        const ms = slow ? 1500 : 400;
        setTimeout(() => {
          if (fail) reject(new Error("Request failed: 500"));
          else resolve({ payload: `loaded · slow=${slow} · ${new Date().toLocaleTimeString()}` });
        }, ms);
      })
    );
  }
  return promiseCache.get(key)!;
}

function UseDemo({ slow, fail }: { slow: boolean; fail: boolean }) {
  return (
    <ErrorBoundary>
      <Suspense fallback={<Skeleton />}>
        <Resolved slow={slow} fail={fail} />
      </Suspense>
    </ErrorBoundary>
  );
}

function Resolved({ slow, fail }: { slow: boolean; fail: boolean }) {
  // Conditionally throw a promise — this is the magic.
  const data = use(getPayloadPromise(slow, fail));
  return (
    <div className="rounded-md border border-accent-good/40 bg-accent-good/10 px-3 py-3 font-mono text-xs">
      ✓ {data.payload}
    </div>
  );
}

function Skeleton() {
  return (
    <div className="space-y-2">
      <div className="h-3 w-3/4 animate-pulse rounded bg-bg-border" />
      <div className="h-3 w-1/2 animate-pulse rounded bg-bg-border" />
      <div className="h-3 w-2/3 animate-pulse rounded bg-bg-border" />
    </div>
  );
}

/* ---------- minimal class error boundary (React still doesn't have a hook) ---------- */
class ErrorBoundary extends Component<{ children: React.ReactNode }, { err?: Error }> {
  state: { err?: Error } = {};
  static getDerivedStateFromError(err: Error) {
    return { err };
  }
  render() {
    if (this.state.err) {
      return (
        <div className="rounded-md border border-accent-bad/40 bg-accent-bad/10 px-3 py-3 font-mono text-xs text-accent-bad">
          ⨯ caught: {this.state.err.message}
          <button
            onClick={() => {
              promiseCache.clear();
              this.setState({ err: undefined });
            }}
            className="ml-3 rounded border border-accent-bad/40 bg-bg-elevated px-2 py-0.5 text-[10px] text-accent-bad"
          >
            retry
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

/* ---------- use(context) conditional demo ---------- */

const AuthContext = createContext<{ user: string } | null>(null);

function ConditionalContextDemo() {
  const [authed, setAuthed] = useState(true);
  return (
    <div className="space-y-2">
      <label className="flex items-center gap-2 text-xs">
        <input type="checkbox" checked={authed} onChange={(e) => setAuthed(e.target.checked)} className="accent-accent" />
        <span className="font-mono">authenticated</span>
      </label>
      <AuthContext.Provider value={authed ? { user: "mithun" } : null}>
        <Greeting authed={authed} />
      </AuthContext.Provider>
      <pre className="overflow-x-auto rounded-md border border-bg-border bg-bg-elevated p-2 font-mono text-[10px] leading-relaxed text-ink-muted">
{`function Greeting({ authed }) {
  if (!authed) return <Guest/>;
  const { user } = use(AuthContext);  // legal — conditional read
  return <span>Hi, {user}!</span>;
}`}
      </pre>
    </div>
  );
}

function Greeting({ authed }: { authed: boolean }) {
  if (!authed) return <span className="font-mono text-xs text-ink-dim">guest mode</span>;
  // Conditional context read — illegal with useContext, legal with use()
  const ctx = use(AuthContext);
  return <span className="font-mono text-xs text-accent">Hi, {ctx?.user}!</span>;
}
