"use client";

import { useEffect, useState } from "react";
import { Lesson } from "@/engine/Lesson";
import { Step } from "@/engine/Step";
import { Callout } from "@/engine/Callout";
import { Quiz } from "@/engine/Quiz";
import { ArchitectNotes } from "@/engine/ArchitectNotes";

export default function F04Effects() {
  return (
    <Lesson slug="f04-effects">
      <Step n={1} kind="observe" title="useEffect — sync with the outside world">
        <p>
          useEffect runs AFTER render, AFTER paint. Its job is to synchronize your component
          with something external: a subscription, the document title, a network resource, a
          timer. It is <em>not</em> &quot;the thing you call after setState.&quot;
        </p>
        <pre className="not-prose overflow-x-auto rounded-md border border-bg-border bg-bg-elevated p-3 font-mono text-[11px] leading-relaxed">
{`useEffect(() => {
  // 1. setup — runs after render
  document.title = \`Hello, \${name}\`;

  return () => {
    // 2. cleanup — runs before next effect AND on unmount
  };
}, [name]); // 3. deps — when to re-run`}
        </pre>
      </Step>

      <Step n={2} kind="explain" title="The deps array — the most-misunderstood part of React">
        <ul>
          <li>
            <strong>Omit it</strong> → effect runs after EVERY render. Almost always wrong.
          </li>
          <li>
            <strong>Empty <code>[]</code></strong> → runs once on mount, cleanup on unmount.
            Useful for one-time setup (subscribe to a store, attach a window listener).
          </li>
          <li>
            <strong><code>[a, b]</code></strong> → runs when any dep changed since last
            render, compared with <code>Object.is</code>.
          </li>
        </ul>
        <p>
          The <strong>exhaustive-deps</strong> ESLint rule isn&apos;t a stylistic preference —
          it&apos;s a correctness check. Every value referenced inside the effect must be in
          the deps. Omit a dep → stale closure → silent bugs. Disable the rule → you&apos;re
          writing in a minefield.
        </p>
      </Step>

      <Step n={3} kind="explain" title="Cleanup — the part everyone skips">
        <p>
          Whatever your effect sets up, the cleanup must reverse. Subscribe → unsubscribe.
          Interval → clearInterval. Listener → removeEventListener. Fetch → AbortController.
        </p>
        <pre className="not-prose overflow-x-auto rounded-md border border-bg-border bg-bg-elevated p-3 font-mono text-[11px] leading-relaxed">
{`useEffect(() => {
  const id = setInterval(tick, 1000);
  return () => clearInterval(id);          // ← required
}, []);

useEffect(() => {
  const ac = new AbortController();
  fetch(url, { signal: ac.signal }).then(...);
  return () => ac.abort();                 // ← cancels in-flight
}, [url]);`}
        </pre>
        <p>
          Skip the cleanup and you have a memory leak — every remount adds another interval
          (Module 23). StrictMode in dev double-fires effects specifically to catch missing
          cleanups; your cleanup needs to be idempotent.
        </p>
      </Step>

      <Step n={4} kind="fix" title="When you DON'T need an effect">
        <p>
          The biggest mistake: reaching for useEffect when a plain expression or event handler
          would do. Effects exist to synchronize with the OUTSIDE world. They&apos;re NOT for:
        </p>
        <ul>
          <li>
            <strong>Derived values</strong>. <code>fullName = first + last</code> is a
            computation, not an effect.
          </li>
          <li>
            <strong>Reacting to a click</strong>. Handlers go in event handlers.
          </li>
          <li>
            <strong>Adjusting state when props change</strong>. Compute the new state directly
            in render, or use the key prop to reset.
          </li>
          <li>
            <strong>Chaining state updates</strong> (`setA` → effect → `setB`). Compute both in
            the same handler.
          </li>
        </ul>
      </Step>

      <Quiz
        id="f04:effect-or-handler"
        prompt="A user clicks 'Save' and you want to (a) POST to /api/save, (b) show a toast on success. Where does this live?"
        options={[
          {
            id: "a",
            text: "useEffect with [clickedSave] dep — set the state on click, react in effect.",
            rationale: "Effects are for syncing with external systems based on state. Click→POST→toast is intent, not sync.",
          },
          {
            id: "b",
            text: "Event handler directly: onClick={async () => { await post(); toast(); }}",
            correct: true,
            rationale: "User intent goes in handlers. Effects react to STATE/PROP changes. Going through state to chain operations adds bugs (StrictMode double-fire, stale closures).",
          },
          {
            id: "c",
            text: "useLayoutEffect.",
            rationale: "Layout effects run before paint, useful for DOM measuring. Unrelated to network mutations.",
          },
          {
            id: "d",
            text: "useReducer with a SAVE action that triggers fetch.",
            rationale: "Same problem — turns intent into state then chases it with side effects. Direct handler is cleaner.",
          },
        ]}
      />

      <Step n={5} kind="explain" title="useEffect vs useLayoutEffect">
        <ul>
          <li>
            <strong>useEffect</strong> runs AFTER paint, on the next macrotask. Doesn&apos;t
            block the user from seeing the new frame.
          </li>
          <li>
            <strong>useLayoutEffect</strong> runs SYNCHRONOUSLY after the DOM mutation but
            BEFORE the browser paints. Blocks paint until it finishes.
          </li>
        </ul>
        <p>
          When to reach for useLayoutEffect: you need to MEASURE the DOM (offsetHeight, scroll
          position) and immediately apply an adjustment that the user shouldn&apos;t see as a
          flicker. Almost everything else uses useEffect.
        </p>
      </Step>

      <ArchitectNotes
        framing="They're testing whether you understand effects as SYNC mechanisms (not 'lifecycle hooks renamed'), and whether you can name when useEffect is the wrong tool."
        followUps={[
          {
            q: "Why does StrictMode double-fire effects in dev?",
            a: "To surface missing cleanups. The cycle is mount → cleanup → mount again. If your cleanup is correct, you see no double effect (subscribe + unsubscribe + subscribe = same as one subscribe). If it's wrong (subscribe without unsubscribe), you see two active subscriptions instead of one. The fix is never 'disable StrictMode' — it's to make every effect idempotent: every setup paired with a teardown that reverses it.",
          },
          {
            q: "Why is exhaustive-deps a strict ESLint rule?",
            a: "It encodes a correctness invariant: every value referenced inside the effect must be in deps. Otherwise the effect captures STALE values (closure capture at render time). Bugs from missing deps are intermittent, hard to reproduce, and only show under conditional execution. Disabling the rule means you accept silent staleness. If the rule complains and you don't want the dep, the correct response is to refactor (move the value to a ref, hoist outside, restructure), not to silence.",
          },
          {
            q: "Walk me through the lifecycle: when does setup/cleanup fire?",
            a: "(1) After every render where deps changed: cleanup of the previous effect (if any), then setup of the new effect. (2) On unmount: final cleanup. (3) In StrictMode dev only: extra mount → cleanup → mount cycle on first mount to test idempotency. Order in commit phase: useLayoutEffects (sync, pre-paint) → browser paint → useEffects (scheduled, post-paint).",
          },
          {
            q: "How do you avoid race conditions when an effect fetches based on a prop?",
            a: "AbortController. `useEffect(() => { const ac = new AbortController(); fetch(url, {signal: ac.signal}).then(setData); return () => ac.abort(); }, [url])`. When `url` changes, the cleanup aborts the in-flight request before starting the next. Without this, an older fetch can resolve AFTER a newer fetch and overwrite the right data. The architect may probe: 'what if you don't have AbortController?' Answer: closure flag (`let cancelled = false`) checked before setState. Less clean but works.",
          },
        ]}
        pivots={[
          { to: "Memory leaks (Module 23)", why: "Missing cleanups are the #1 leak source." },
          { to: "useSyncExternalStore", why: "Subscription pattern for external stores — replaces ad-hoc useEffect subscribers." },
          { to: "useEvent / useEffectEvent proposal", why: "RFC for separating reactive deps from handler logic." },
        ]}
        dontSay={[
          {
            phrase: "useEffect runs after every render.",
            why: "It runs after EVERY render where DEPS changed. With [], it runs once. With no deps, it runs every render.",
          },
          {
            phrase: "Disable exhaustive-deps to get the behavior you want.",
            why: "Encodes a stale closure. The architect treats this as 'I don't understand closure capture.'",
          },
        ]}
      />

      <Step n={6} kind="next" title="Events trigger state changes. Renders produce UI from data shapes.">
        <Callout tone="next" title="next foundation">
          Effects react to state. The user reacts to clicks. Foundation 05 covers React&apos;s
          event system — synthetic events, delegation, why you don&apos;t write{" "}
          <code>addEventListener</code> in React.
        </Callout>
      </Step>
    </Lesson>
  );
}
