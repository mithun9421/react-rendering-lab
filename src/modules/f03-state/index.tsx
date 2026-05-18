"use client";

import { useState } from "react";
import { Lesson } from "@/engine/Lesson";
import { Step } from "@/engine/Step";
import { Callout } from "@/engine/Callout";
import { Quiz } from "@/engine/Quiz";
import { TryIt } from "@/engine/TryIt";
import { ArchitectNotes } from "@/engine/ArchitectNotes";

export default function F03State() {
  return (
    <Lesson slug="f03-state">
      <Step n={1} kind="observe" title="useState — variable that survives re-renders">
        <p>
          A regular variable inside a function component is recreated every render. State is the
          escape hatch: React stores the value on the fiber, you read it back next render.
        </p>
        <pre className="not-prose overflow-x-auto rounded-md border border-bg-border bg-bg-elevated p-3 font-mono text-[11px] leading-relaxed">
{`const [count, setCount] = useState(0);
//     ^         ^
//     current   updater — when called, schedules a re-render`}
        </pre>
        <p className="mt-3">
          Two things to remember:
        </p>
        <ul>
          <li><code>count</code> is the value at <em>this</em> render. It doesn&apos;t change mid-handler.</li>
          <li><code>setCount</code> schedules a new render. The new render reads the new value.</li>
        </ul>
      </Step>

      <Step n={2} kind="profile" title="The stale closure trap — your most common bug">
        <TryIt
          title="counter — two click handlers, same intent"
          knobs={[{ key: "updater", label: "use the updater form (c => c + 1)", default: false }]}
          hint="Click 'add 3 fast' with the knob OFF — count goes up by 1, not 3. Turn it on — count correctly goes up by 3. The reason is closure capture, not React being broken."
        >
          {(flags) => <StaleClosureDemo useUpdater={flags.updater} />}
        </TryIt>
        <p className="mt-3">
          With the simple form (<code>setCount(count + 1)</code>) three times in a row, all
          three reads see the same <code>count</code> value from this render. The updater form
          (<code>setCount(c =&gt; c + 1)</code>) receives the latest pending value, so the
          updates compose.
        </p>
      </Step>

      <Quiz
        id="f03:stale"
        prompt="An onClick handler does this — what's the final count after one click?"
        code={`const [count, setCount] = useState(0);
function click() {
  setCount(count + 1);
  setCount(count + 1);
  setCount(count + 1);
}`}
        options={[
          {
            id: "a",
            text: "3 — each setCount adds 1.",
            rationale: "Tempting but wrong. All three reads see count = 0 (the closure value).",
          },
          {
            id: "b",
            text: "1 — all three calls compute 0+1=1, React batches them, last write wins.",
            correct: true,
            rationale:
              "Closure captures count = 0 for the whole handler. Three calls to setCount(1) collapse into one new render with count = 1. Use the updater form to add 3 correctly.",
          },
          {
            id: "c",
            text: "It depends on whether you're in StrictMode.",
            rationale: "StrictMode doesn't affect setState semantics.",
          },
          {
            id: "d",
            text: "Throws — you can't call setState multiple times in a handler.",
            rationale: "You can, freely. React batches them.",
          },
        ]}
      />

      <Step n={3} kind="explain" title="Lazy initial state — avoid recomputing on every render">
        <p>
          If your initial value is expensive to compute, pass a function instead of the value
          itself. React calls it once, on the first render.
        </p>
        <pre className="not-prose mt-3 overflow-x-auto rounded-md border border-bg-border bg-bg-elevated p-3 font-mono text-[11px] leading-relaxed">
{`// BAD — runs on every render (return value is ignored after first)
const [data, setData] = useState(parseHugeJSON(localStorage.getItem("data")));

// GOOD — runs only once
const [data, setData] = useState(() => parseHugeJSON(localStorage.getItem("data")));`}
        </pre>
        <p className="mt-3">
          The distinction matters because the argument to <code>useState</code> is evaluated every
          render — even though React only uses the result on the first one. Wrapping in a
          function defers the work.
        </p>
      </Step>

      <Step n={4} kind="explain" title="Where does state live? Lift it up — but no higher.">
        <p>
          When two siblings need the same state, lift it to their common parent. <em>But
          not higher.</em> State that lives too high in the tree triggers cascading re-renders
          across components that don&apos;t care.
        </p>
        <ul>
          <li>
            <strong>Local input value</strong> → keep in the input component itself.
          </li>
          <li>
            <strong>Form field validated against another field</strong> → lift to the form.
          </li>
          <li>
            <strong>&quot;Is this modal open?&quot;</strong> → the component that opens the modal.
          </li>
          <li>
            <strong>User identity</strong> → context or a store, not props through 8 levels.
          </li>
        </ul>
        <p>
          The pragmatic rule: place state at the lowest common ancestor of all components that
          read or write it. Anything higher is wasted renders for components that don&apos;t care.
        </p>
      </Step>

      <Step n={5} kind="fix" title="React batches all updates in a handler">
        <p>
          Three <code>setState</code> calls in the same handler produce one render. As of React
          18, this batching also covers <code>setTimeout</code>, <code>fetch().then</code>, and
          native event handlers — anywhere you call setState.
        </p>
        <pre className="not-prose mt-3 overflow-x-auto rounded-md border border-bg-border bg-bg-elevated p-3 font-mono text-[11px] leading-relaxed">
{`function onClick() {
  setA(1);    // queued
  setB(2);    // queued
  setC(3);    // queued
  // — function returns —
  // React flushes the queue: ONE render, with A=1, B=2, C=3
}`}
        </pre>
        <p className="mt-3">
          You can&apos;t read updated state synchronously between setStates because they&apos;re
          all queued. If you need a flush, wrap in <code>flushSync</code> — but you almost never
          do.
        </p>
      </Step>

      <Step n={6} kind="explain" title="Don't reach for state when a derived value will do">
        <p>
          A common antipattern: storing computed values in state. If a value can be derived from
          props and other state, derive it — don&apos;t mirror it.
        </p>
        <pre className="not-prose mt-3 overflow-x-auto rounded-md border border-bg-border bg-bg-elevated p-3 font-mono text-[11px] leading-relaxed">
{`// BAD — fullName mirrors first + last, must be kept in sync
const [first, setFirst] = useState("");
const [last, setLast] = useState("");
const [fullName, setFullName] = useState("");
useEffect(() => setFullName(\`\${first} \${last}\`), [first, last]);

// GOOD — fullName is just derived
const [first, setFirst] = useState("");
const [last, setLast] = useState("");
const fullName = \`\${first} \${last}\`;`}
        </pre>
        <p className="mt-3">
          The bad version creates an extra render, requires an effect, and lets the two get out
          of sync if the effect ever doesn&apos;t fire (it won&apos;t under StrictMode-dev unmount).
          The good version can&apos;t be wrong.
        </p>
      </Step>

      <Quiz
        id="f03:derive"
        prompt="A component renders a sorted list. The unsorted list comes from props. Should the sorted version be in state?"
        options={[
          {
            id: "a",
            text: "Yes — store the sorted version in useState so we don't re-sort on every render.",
            rationale:
              "Creates the state-mirror problem: if the list prop changes, you must remember to re-sort and setState. Bugs guaranteed.",
          },
          {
            id: "b",
            text: "No — derive it. const sorted = [...list].sort(...). Wrap in useMemo if the sort is expensive.",
            correct: true,
            rationale:
              "Derived values can't go stale. The sort runs on every render (cheap for most cases); for an expensive sort + a stable list, useMemo caches it.",
          },
          {
            id: "c",
            text: "Yes — use useRef.",
            rationale: "Refs don't help here — the sorted value depends on the prop and must update when the prop changes.",
          },
          {
            id: "d",
            text: "Move the sorting to the parent.",
            rationale: "Doesn't change anything — the question of state vs derived is the same one level up.",
          },
        ]}
      />

      <ArchitectNotes
        framing="They're probing whether you understand setState as scheduling (not async I/O), and whether you can name where state actually lives in the fiber."
        followUps={[
          {
            q: "Is `setState` asynchronous?",
            a: "Careful — it's not async in the sense of returning a Promise or going to the network. It's synchronous in that it returns immediately. The 'async' confusion comes from two things: (1) the current render's closure still sees the OLD value after setState returns, because closures captured at render time; (2) the new render runs later, batched with other setStates in the same handler. The accurate phrasing: 'setState schedules a new render. Reading the captured `count` after won't show the update.' If you need the latest value mid-handler, use the updater form `setCount(c => c + 1)`.",
          },
          {
            q: "Where does the state value actually live? It's not on the component function.",
            a: "On the fiber. Specifically, the fiber's `memoizedState` is a linked list of hook records — useState gets one node per call, in hook-call order. The node stores the current value, a pending-updates queue, and the dispatcher. The component function is recreated every render; the fiber persists. That's why hook order matters — React indexes into the linked list by call order, not by name. Conditional hooks would mis-align the list and you'd read the wrong slot.",
          },
          {
            q: "Why does the updater form `setCount(c => c + 1)` compose correctly when three calls in a row don't?",
            a: "The value form `setCount(count + 1)` reads `count` from the current render's closure — frozen at render time. Three calls all see the same value. The updater form receives the LATEST pending state from the queue: first call's `c` is the current state; second call's `c` is what the first call would produce; third's is what the second would. They compose. Same reason functional reducers compose in Redux. Rule of thumb: if your next state depends on the previous, use the updater form.",
          },
          {
            q: "When would you reach for useReducer instead of useState?",
            a: "Three conditions trigger me: (1) the state shape has multiple coupled fields that change together (e.g. `{ status, error, data }` for a fetch); (2) there are 3+ ways to update — a reducer's action vocabulary documents them in one place; (3) child handlers want to dispatch without taking the setState as a prop. useReducer also pairs with useContext for cross-tree dispatch without props drilling. Beyond that, useState is fine and reads more naturally.",
          },
          {
            q: "Talk me through what happens when StrictMode double-fires setState.",
            a: "StrictMode in dev re-runs the function body of components to surface impurities. It also intentionally invokes setStates' updater function twice for the same reason — to catch updaters that aren't pure. Your updater should be pure: `c => c + 1` is fine, `c => { localStorage.set(c); return c+1; }` runs twice and writes twice. The fix isn't to disable StrictMode — it's to keep updaters pure and move side effects to handlers or effects.",
          },
        ]}
        pivots={[
          { to: "useReducer + dispatch", why: "Natural extension when state shape grows." },
          { to: "useSyncExternalStore", why: "External-store integration; the bridge for non-React stores like Zustand." },
          { to: "Tearing in concurrent mode", why: "Senior interviewers test if you know what tearing is and why useSyncExternalStore exists." },
        ]}
        dontSay={[
          {
            phrase: "useState is asynchronous.",
            why: "It returns synchronously. The confusion is between 'returns immediately' (sync) and 'effect visible later' (rendered next tick). Use the latter framing.",
          },
          {
            phrase: "Just put everything in useState.",
            why: "Derived values shouldn't be state. Stored derived state goes out of sync. The architect wants to hear 'state when the value is independent input; derived when it's a function of state.'",
          },
          {
            phrase: "useState is the same as useReducer with one action.",
            why: "Conceptually fine; the architect will pivot to 'so why do we have both?' and probe whether you can describe when each reads better.",
          },
        ]}
      />

      <Step n={7} kind="next" title="State changes. Effects react to those changes outside render.">
        <Callout tone="next" title="next foundation">
          Updating state triggers a render. But some work isn&apos;t about rendering —
          subscriptions, document.title, sending analytics. That work belongs in{" "}
          <code>useEffect</code>. Foundation 04.
        </Callout>
      </Step>
    </Lesson>
  );
}

function StaleClosureDemo({ useUpdater }: { useUpdater: boolean }) {
  const [count, setCount] = useState(0);
  const addThree = () => {
    if (useUpdater) {
      setCount((c) => c + 1);
      setCount((c) => c + 1);
      setCount((c) => c + 1);
    } else {
      setCount(count + 1);
      setCount(count + 1);
      setCount(count + 1);
    }
  };
  return (
    <div className="not-prose flex items-center gap-3 rounded-md border border-bg-border bg-bg-elevated p-3">
      <span className="font-mono text-2xl tabular-nums text-accent">{count}</span>
      <button
        onClick={addThree}
        className="rounded-md bg-accent px-3 py-1.5 font-mono text-[11px] text-white"
      >
        add 3 fast
      </button>
      <button
        onClick={() => setCount(0)}
        className="rounded-md border border-bg-border bg-bg-panel px-3 py-1.5 font-mono text-[11px] text-ink-muted"
      >
        reset
      </button>
      <span className="font-mono text-[10px] text-ink-dim">
        mode: <span className="text-ink">{useUpdater ? "updater" : "value"}</span>
      </span>
    </div>
  );
}
