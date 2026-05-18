"use client";

import { useState } from "react";
import { Lesson } from "@/engine/Lesson";
import { Step } from "@/engine/Step";
import { Callout } from "@/engine/Callout";
import { Quiz } from "@/engine/Quiz";
import { TryIt } from "@/engine/TryIt";

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
