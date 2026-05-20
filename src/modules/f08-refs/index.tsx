"use client";

import { useEffect, useRef, useState } from "react";
import { Lesson } from "@/engine/Lesson";
import { Step } from "@/engine/Step";
import { Callout } from "@/engine/Callout";
import { Quiz } from "@/engine/Quiz";
import { ArchitectNotes } from "@/engine/ArchitectNotes";

export default function F08Refs() {
  return (
    <Lesson slug="f08-refs">
      <Step n={1} kind="observe" title="useRef — a box that doesn't trigger renders">
        <p>
          <code>const ref = useRef(initial)</code> returns an object{" "}
          <code>&#123; current: initial &#125;</code> that survives renders. Reading or writing
          <code>ref.current</code> does <strong>not</strong> trigger a re-render. It&apos;s the
          escape hatch for values that need to persist but aren&apos;t part of the UI.
        </p>
      </Step>

      <Step n={2} kind="explain" title="The two big use cases">
        <ul>
          <li>
            <strong>DOM access.</strong> <code>const ref = useRef&lt;HTMLInputElement&gt;(null);
            &lt;input ref=&#123;ref&#125;/&gt;</code>. React assigns the DOM node on mount.
            Use to focus, measure, scroll, integrate with non-React libraries.
          </li>
          <li>
            <strong>Mutable values that don&apos;t belong in state.</strong> Interval IDs, the
            latest value of something (for use in a stable callback), a previous-render snapshot
            for comparison.
          </li>
        </ul>
      </Step>

      <Step n={3} kind="profile" title="Try it — focus a hidden input">
        <FocusDemo />
      </Step>

      <Step n={4} kind="fix" title="State vs ref — the decision tree">
        <p>Two questions, in order:</p>
        <ol>
          <li>
            <strong>Does the UI render this value?</strong> If yes → state. The UI must
            re-render when it changes; ref doesn&apos;t trigger renders.
          </li>
          <li>
            <strong>Does it need to persist between renders?</strong> If yes → ref (or state).
            If no → just a local variable.
          </li>
        </ol>
        <pre className="not-prose mt-3 overflow-x-auto rounded-md border border-bg-border bg-bg-elevated p-3 font-mono text-[11px] leading-relaxed">
{`// Displayed → state
const [count, setCount] = useState(0);

// Mutable but not displayed → ref
const timerRef = useRef<number | null>(null);
useEffect(() => {
  timerRef.current = setInterval(tick, 1000);
  return () => clearInterval(timerRef.current!);
}, []);

// Not persisted → local variable
function handleClick() {
  const x = compute();  // gone after handler returns
  doSomething(x);
}`}
        </pre>
      </Step>

      <Step n={5} kind="explain" title="The render-purity rule for refs">
        <p>
          <strong>Don&apos;t read or write <code>ref.current</code> during render.</strong> Refs
          are mutable; reading them during render makes the render impure (same inputs, different
          outputs depending on when you read). Strict Mode catches this in dev. Refs are for
          effects + event handlers, where impurity is fine.
        </p>
        <p>The one exception: assigning a ref via the <code>ref=</code> prop. React calls your
        ref callback after the DOM is set; that&apos;s not 'during render' in the impure sense.</p>
      </Step>

      <Quiz
        id="f08:state-or-ref"
        prompt="You need to hold a setInterval id so you can clear it later. The UI doesn't display it. Which?"
        options={[
          {
            id: "a",
            text: "useState — feels canonical.",
            rationale: "Every interval start would cause a re-render. The UI doesn't display the id, so the re-render is wasted.",
          },
          {
            id: "b",
            text: "useRef — its .current is mutable, doesn't trigger renders.",
            correct: true,
            rationale: "Exactly the pattern. Set ref.current = setInterval(...); clear via ref.current. No renders. The architect tests if you've internalised 'don't display → don't state.'",
          },
          {
            id: "c",
            text: "A module-level variable.",
            rationale: "Shared across component instances and across hot-reloads. Refs are per-instance, scoped correctly.",
          },
          {
            id: "d",
            text: "useReducer.",
            rationale: "Solves the wrong problem — reducer still triggers renders on dispatch.",
          },
        ]}
      />

      <ArchitectNotes
        framing="Refs probe whether you can articulate the WHY (not 'state triggers renders, refs don't' but the deeper question of when each is the right tool)."
        followUps={[
          {
            q: "Walk me through what a ref actually IS at the React level.",
            a: "It's a plain JavaScript object `{ current: value }` allocated once on the fiber's memoizedState linked list. Same slot lookup as useState; the difference is that React doesn't subscribe to changes. Writing `ref.current = x` mutates the object in place; React's reconciler doesn't see it. Reading `ref.current` reads the latest mutation. The mental model: ref is the box; React just hands it to you on each render via useRef. Whatever's IN the box is your business.",
          },
          {
            q: "Why is reading ref.current during render an anti-pattern?",
            a: "Renders must be pure — same inputs, same output. Refs are mutable from outside the render (effects, handlers, async callbacks). If render reads ref.current, the output depends on when the render ran relative to the latest mutation. StrictMode dev double-fires render to catch this — if the two outputs differ, you have an impurity bug. The correct pattern: read refs in effects/handlers; let render only DECLARE them.",
          },
          {
            q: "When do you need useImperativeHandle?",
            a: "Rarely, but: when a parent needs an IMPERATIVE method on a child (focus(), play(), scrollTo()), and the child is a function component. Without useImperativeHandle, the parent's ref points to the DOM node — fine for `<input>`, useless for `<VideoPlayer>` that wraps a `<video>` internally. useImperativeHandle lets the child expose a custom interface. Architect may probe: 'when do you AVOID this?' Answer: when you can express the same need via props/callbacks. Imperative handles are escape hatches; declarative props are the default.",
          },
          {
            q: "Refs and concurrent React — any gotchas?",
            a: "Yes — refs don't tear like state can, BUT effects that read refs during transitions/Suspense can see stale values if the transition aborts and replays. The fix: don't depend on ref values for invariants the render needs to be consistent. Refs are 'I'll read this later, after commit, when the world is settled.' Concurrent React makes 'now' fuzzy; ref reads in handlers/effects are still correct because those fire after commit.",
          },
        ]}
        pivots={[
          { to: "React 19 ref-as-prop", why: "forwardRef deprecation; refs are now plain props." },
          { to: "useImperativeHandle", why: "Imperative-handle pattern for design systems." },
          { to: "Storing latest callback in a ref", why: "Common pattern for stable handlers + freshest closure." },
        ]}
        dontSay={[
          {
            phrase: "Refs are like instance variables.",
            why: "Loose analogy. Refs are scoped to a fiber instance, true, but the mental model 'instance variable' invites mutating during render, which breaks purity.",
          },
          {
            phrase: "Use a ref for performance.",
            why: "Refs avoid renders, not 'improve performance' broadly. Architect tests if you mean 'avoid re-rendering for non-displayed mutable values' specifically.",
          },
        ]}
      />

      <Step n={6} kind="next" title="Drilling props gets ugly. Context flattens the path.">
        <Callout tone="next" title="next foundation">
          Refs are for values you don&apos;t pass via props. Context is for values you don&apos;t
          want to pass through every intermediate component. Foundation 09.
        </Callout>
      </Step>
    </Lesson>
  );
}

function FocusDemo() {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <div className="not-prose mt-3 rounded-md border border-bg-border bg-bg-elevated p-3">
      <input
        ref={ref}
        placeholder="focus me via the button"
        className="w-full rounded-md border border-bg-border bg-bg-panel px-2 py-1.5 font-mono text-xs"
      />
      <button
        onClick={() => ref.current?.focus()}
        className="mt-2 rounded-md bg-accent px-3 py-1.5 font-mono text-[11px] text-white"
      >
        ref.current.focus()
      </button>
    </div>
  );
}
