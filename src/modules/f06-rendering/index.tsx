"use client";

import { Lesson } from "@/engine/Lesson";
import { Step } from "@/engine/Step";
import { Callout } from "@/engine/Callout";
import { Quiz } from "@/engine/Quiz";
import { ArchitectNotes } from "@/engine/ArchitectNotes";

export default function F06Rendering() {
  return (
    <Lesson slug="f06-rendering">
      <Step n={1} kind="observe" title="Conditional rendering — four patterns, one trap">
        <pre className="not-prose overflow-x-auto rounded-md border border-bg-border bg-bg-elevated p-3 font-mono text-[11px] leading-relaxed">
{`// 1. Short-circuit &&
{isAdmin && <AdminPanel/>}

// 2. Ternary
{loading ? <Spinner/> : <Content/>}

// 3. Early return
if (!user) return <Login/>;

// 4. Variable assignment (when JSX gets complex)
let body;
if (status === "loading") body = <Skeleton/>;
else if (status === "error") body = <Error/>;
else body = <Content data={data}/>;
return <Frame>{body}</Frame>;`}
        </pre>
        <p className="mt-3">
          The trap with <code>&&</code>: if the left side evaluates to <code>0</code> (zero —
          falsy but not null/undefined), React renders &quot;0&quot;. <code>{`{count && <Items/>}`}</code>{" "}
          when count is 0 renders the literal text &quot;0&quot;. Use <code>count &gt; 0 && ...</code>{" "}
          or a ternary.
        </p>
      </Step>

      <Step n={2} kind="explain" title="Lists — and why keys aren't optional">
        <pre className="not-prose overflow-x-auto rounded-md border border-bg-border bg-bg-elevated p-3 font-mono text-[11px] leading-relaxed">
{`{items.map((item) => (
  <Row key={item.id} item={item} />
))}`}
        </pre>
        <p className="mt-3">
          Every direct child of a `.map()` needs a stable, unique <code>key</code>. React uses
          keys to match the OLD list to the NEW list element-by-element. Wrong keys mean React
          mis-matches: it might reuse position 3&apos;s fiber for what should be a different
          item, dragging along the wrong local state.
        </p>
        <p>
          Key rules: (1) unique among siblings (not globally). (2) stable across renders (not
          random, not index). (3) derived from the item identity (item.id, item.uuid, the
          underlying domain ID).
        </p>
      </Step>

      <Step n={3} kind="explain" title="Fragments in lists">
        <p>
          If each list item is multiple sibling elements, wrap in a Fragment with a key:
        </p>
        <pre className="not-prose mt-3 overflow-x-auto rounded-md border border-bg-border bg-bg-elevated p-3 font-mono text-[11px] leading-relaxed">
{`// Each item produces TWO siblings — need Fragment as the wrapping element
import { Fragment } from "react";

{rows.map((row) => (
  <Fragment key={row.id}>
    <dt>{row.label}</dt>
    <dd>{row.value}</dd>
  </Fragment>
))}

// Shorthand <> doesn't accept key; use the full Fragment.`}
        </pre>
      </Step>

      <Quiz
        id="f06:keys"
        prompt="A list re-orders by user-selected sort. Local in-place edit state on each row should follow the row's DATA, not its position. Which key strategy?"
        options={[
          {
            id: "a",
            text: "key={index}",
            rationale: "Position-bound. After sort, position 3's fiber stays in slot 3 — but its data is now item 5. Edit state migrates with position; wrong.",
          },
          {
            id: "b",
            text: "key={item.id}",
            correct: true,
            rationale: "Identity-bound. After sort, React matches old fiber 'id=42' to new fiber 'id=42' wherever it ended up. Edit state moves with the item.",
          },
          {
            id: "c",
            text: "key={item.name}",
            rationale: "Risky — names can collide (two 'Item A'), names can change (rename triggers full remount). Stable IDs only.",
          },
          {
            id: "d",
            text: "No key — React figures it out.",
            rationale: "Falls back to index keys + warns in dev. Same problem as (a).",
          },
        ]}
      />

      <Step n={4} kind="fix" title="Anti-patterns that bite immediately">
        <ul>
          <li>
            <strong>Map without keys</strong> → warning + falls back to index keys → state bugs
            on reorder.
          </li>
          <li>
            <strong><code>key={`{Math.random()}`}</code></strong> → fresh key every render →
            every row REMOUNTS → state lost, focus dropped, animations restart.
          </li>
          <li>
            <strong>Reusing the index when items reorder</strong> → React thinks nothing moved
            → state migrates wrong.
          </li>
          <li>
            <strong>Returning <code>null</code> from a list map</strong> → fine, but causes
            inconsistent indices if you also use index keys. Filter first, map second.
          </li>
        </ul>
      </Step>

      <ArchitectNotes
        framing="They're testing whether you treat keys as IDENTITY, not 'performance optimisation' — the wrong mental model is the source of every key bug."
        followUps={[
          {
            q: "Walk me through why React picked the 'key + position' algorithm instead of LCS or Myers.",
            a: "Two-prong reasoning. (1) Cost: LCS is O(n²), Myers is O(n+d). React's diff is O(n) — every element visited once. (2) Quality of result: LCS/Myers find the OPTIMAL diff. React's algorithm finds a CHEAP, GOOD-ENOUGH diff. By giving you the keys, you tell React the moves directly — no search needed. Trade: when your keys are wrong, React's results degrade catastrophically. With LCS, even wrong inputs would produce a correct diff (just slower). React chose: cheap + correct-when-you-help-it.",
          },
          {
            q: "What does React do if you forget keys entirely?",
            a: "Dev: warns 'Each child in a list should have a unique key prop'. Falls back to index keys. Behaviour matches `key={index}`: position-bound identity. Reordering breaks state. Production: no warning, same fallback. The warning is your only line of defence — don't disable it via ESLint suppression.",
          },
          {
            q: "Can a key span across components/parents?",
            a: "No. Keys are unique among DIRECT SIBLINGS in the parent's children array. The same key value in two different parents is fine — they're separate scopes. The fiber matching is parent-local. The architect may probe: 'can I use the same key across remounts to preserve state?' Answer: no — React only preserves fibers within the same parent, across renders. Unmount destroys.",
          },
          {
            q: "How do keys interact with React.memo?",
            a: "memo's compare runs on PROPS. Keys are NOT props — they're framework-internal. memo can't see the key. But the FIBER that memo wraps is keyed; if the key changes, React unmounts the memo'd component and mounts a new instance. memo doesn't run because the fiber identity changed. The architect tests: 'so what's the practical impact?' Answer: stable keys keep memo'd components reused; changing keys force remount, which throws away their internal state and any cached children.",
          },
        ]}
        pivots={[
          { to: "Reconciliation (Module 1)", why: "Keys are the entry-point question; reconciliation is the full story." },
          { to: "Virtualisation (Module 10)", why: "Windowed lists still use keys inside the rendered slice." },
          { to: "React DevTools 'Why did this render?'", why: "Practical debugging of memo + key interactions." },
        ]}
        dontSay={[
          {
            phrase: "Keys are a performance hint.",
            why: "They're an IDENTITY contract. Performance follows from correct identity, but framing them as 'hints' invites laziness.",
          },
          {
            phrase: "I use index keys because they're stable.",
            why: "They're stable when the list never reorders. The moment it can, index keys cause state migration bugs. Architect probes whether you'd defend index keys.",
          },
        ]}
      />

      <Step n={5} kind="next" title="Lists are inputs. Forms are how we collect them.">
        <Callout tone="next" title="next foundation">
          Lists need inputs to filter and sort by. Forms are the React-native way to collect
          them. Foundation 07.
        </Callout>
      </Step>
    </Lesson>
  );
}
