"use client";

import { Lesson } from "@/engine/Lesson";
import { Step } from "@/engine/Step";
import { Callout } from "@/engine/Callout";
import { Quiz } from "@/engine/Quiz";
import { ArchitectNotes } from "@/engine/ArchitectNotes";

export default function F11Rules() {
  return (
    <Lesson slug="f11-rules">
      <Step n={1} kind="observe" title="React has rules. Not suggestions.">
        <p>
          Three contracts make modern React possible. Break them and you lose the Compiler, you
          lose concurrent rendering, you lose StrictMode safety, and you ship subtle bugs.
        </p>
      </Step>

      <Step n={2} kind="explain" title="Rule 1 — render must be pure">
        <p>Given the same props + state, your component must return the same JSX.</p>
        <ul>
          <li>No mutation of props, state, or hook return values.</li>
          <li>No I/O (fetch, console.log of identifying data, localStorage.setItem).</li>
          <li>No reading mutable values (refs, Date.now(), Math.random) DURING render.</li>
          <li>No setState in render (that&apos;s an infinite loop).</li>
        </ul>
        <p>
          Why: React calls render multiple times for the same inputs (StrictMode, transitions,
          time-slicing). If render isn&apos;t pure, those extra calls cause duplicated effects.
        </p>
      </Step>

      <Step n={3} kind="explain" title="Rule 2 — state is immutable">
        <pre className="not-prose mt-3 overflow-x-auto rounded-md border border-bg-border bg-bg-elevated p-3 font-mono text-[11px] leading-relaxed">
{`// WRONG — mutates the existing array
items.push(newItem);
setItems(items);   // same reference → React sees no change → no re-render

// RIGHT — new array, new reference
setItems([...items, newItem]);

// WRONG — mutates the existing object
user.name = "new";
setUser(user);     // same reference → no re-render

// RIGHT — new object
setUser({ ...user, name: "new" });`}
        </pre>
        <p className="mt-3">
          React detects state changes by reference comparison (Object.is). Same reference → no
          change. Mutation in place looks like nothing happened. Immutable updates create new
          references for changed branches and reuse old references for unchanged ones — this is
          what enables fast diffing and memoization.
        </p>
      </Step>

      <Step n={4} kind="explain" title="Rule 3 — hooks must be called in the same order every render">
        <p>
          Every useState, useEffect, useMemo, useContext attaches to a fiber slot. React indexes
          them by call order. Conditional hooks shift the indices: the second render reads the
          wrong slot.
        </p>
        <pre className="not-prose mt-3 overflow-x-auto rounded-md border border-bg-border bg-bg-elevated p-3 font-mono text-[11px] leading-relaxed">
{`// WRONG — conditional hook
function Component({ enabled }) {
  if (enabled) {
    useState(0);     // ← only sometimes called
  }
  const [name] = useState("");  // ← reads the wrong slot if enabled changed
}

// RIGHT — call hooks unconditionally; gate the LOGIC
function Component({ enabled }) {
  const [count, setCount] = useState(0);  // always called
  const [name] = useState("");
  if (!enabled) return null;  // gate after the hooks
}`}
        </pre>
        <p className="mt-3">
          The ESLint rule <code>react-hooks/rules-of-hooks</code> catches this — never silence
          it. The exception: <code>use()</code> can be called conditionally (it doesn&apos;t
          allocate a fiber slot — it reads/throws).
        </p>
      </Step>

      <Quiz
        id="f11:purity"
        prompt="A component mutates `props.user.lastLogin = Date.now()` inside its render body. What breaks?"
        options={[
          {
            id: "a",
            text: "Nothing — JS allows it.",
            rationale: "JS allows it; React doesn't. You're mutating an object owned by the parent. Next render the parent still has the old reference; mutations leak; eventual bugs.",
          },
          {
            id: "b",
            text: "Multiple things: (1) parent's state is now inconsistent with its setState calls; (2) StrictMode dev calls render twice, producing two timestamps; (3) Compiler bails on the file because impure.",
            correct: true,
            rationale: "Every consequence of breaking purity. The architect tests if you can name the layers — parent state, dev double-render, Compiler bail.",
          },
          {
            id: "c",
            text: "The Compiler optimises around it.",
            rationale: "The Compiler refuses to optimise impure code. It silently bails.",
          },
          {
            id: "d",
            text: "Just warn the user.",
            rationale: "React doesn't warn at runtime for prop mutation. The lint rule + dev double-render are the only signals.",
          },
        ]}
      />

      <ArchitectNotes
        framing="The Rules of React question is where seniors prove they understand WHY the rules exist — not 'because React docs say so' but 'because the Compiler/scheduler/StrictMode all depend on them.'"
        followUps={[
          {
            q: "Why is purity such a foundational requirement?",
            a: "Three downstream features depend on it. (1) The Compiler memoises by input identity — only safe if pure. (2) Concurrent rendering may abort + re-run; impure renders cause duplicated effects. (3) StrictMode dev double-renders to catch impurities. Drop purity and the Compiler bails on your file, transitions don't behave consistently, and you ship StrictMode-only bugs. The architect cares about the SYSTEMS view — purity isn't a code-style preference, it's the substrate for everything else.",
          },
          {
            q: "Why immutability and not just 'tell me when state changes'?",
            a: "Two reasons. (1) Reference comparison via Object.is is O(1) — the cheapest possible 'did this change?' check. Deep equality would be O(n) per prop per render and tank perf. (2) Immutable updates create structural sharing — unchanged branches keep the same references, so memoization downstream still works. Mutation in place breaks both: same reference even though contents changed (no re-render), and you lose the ability to compare 'before' vs 'after' since the 'before' is gone.",
          },
          {
            q: "Hooks order — what does the runtime actually do?",
            a: "Each function-component fiber has a memoizedState linked list. On render, a 'hook cursor' walks the list — first useState call reads slot 0, second reads slot 1, etc. The cursor MUST hit the same slots in the same order. Conditional hooks shift the alignment: render 1 calls useState then useState then useEffect (slots 0/1/2); render 2 skips the second useState (slots 0/1 — but slot 1 was the SECOND useState, now it's the useEffect's slot). React tries to read state from what was an effect slot. Subtle, broken, hard to debug. The rule prevents the alignment from ever shifting.",
          },
          {
            q: "Can you give me an example of legitimate impurity in render — something React allows?",
            a: "Yes — calling lazy-initialized refs (useRef's initial value). useState's lazy initializer. use() (which is special). Reading from a stable context. None of these break purity in the SENSE that matters (same inputs → same output) because their behavior is deterministic per render. What's NOT allowed: calling external APIs, mutating props, reading clocks. The line is 'is the result determined by render-time inputs?'",
          },
          {
            q: "What enforces these rules in 2026 — lint, runtime, both?",
            a: "Mostly lint. (1) eslint-plugin-react-hooks enforces hook order and exhaustive-deps. (2) eslint-plugin-react-compiler flags purity violations the Compiler would bail on. (3) StrictMode dev catches some runtime impurities by double-firing. (4) The Compiler skips impure files silently. Runtime checks are minimal because they'd cost prod perf. The architect probes whether you SHIP these lints and treat their warnings as errors — many teams disable them and live with the consequences.",
          },
        ]}
        pivots={[
          { to: "React Compiler (Module 11)", why: "Compiler enforces what these rules describe." },
          { to: "Concurrent rendering (Module 4)", why: "Transitions + Suspense rely on purity." },
          { to: "StrictMode design choices", why: "Why dev double-fires — connect to all three rules." },
        ]}
        dontSay={[
          {
            phrase: "The rules are React docs being opinionated.",
            why: "They're contracts the runtime depends on. The architect tests if you understand WHY.",
          },
          {
            phrase: "I can mutate state if I'm careful.",
            why: "You can't. Mutation looks like 'no change' to React's Object.is — your setState becomes a no-op. The architect treats this as 'I don't understand reference vs structural equality.'",
          },
          {
            phrase: "Conditional hooks are fine if the condition is stable.",
            why: "Stable until it's not. The rule exists because the runtime CAN'T detect stability — only the LINTER can detect that you might violate it.",
          },
        ]}
      />

      <Step n={5} kind="next" title="You're ready for Module 1 — Reconciliation.">
        <Callout tone="next" title="end of foundations">
          You now have the entire substrate that the rest of the lab assumes. The Core track
          (Module 1+) starts where this ends — with reconciliation and the cost of identity.
        </Callout>
      </Step>
    </Lesson>
  );
}
