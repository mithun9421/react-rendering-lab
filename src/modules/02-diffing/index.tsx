"use client";

import { Lesson } from "@/engine/Lesson";
import { Step } from "@/engine/Step";
import { Callout } from "@/engine/Callout";
import { DiffTree, type DiffNode } from "@/viz/DiffTree";
import { TryIt } from "@/engine/TryIt";

export default function Module02() {
  return (
    <Lesson slug="02-diffing">
      <Step n={1} kind="observe" title="React's diff is O(n), not O(n³)">
        <p>
          A general tree-edit algorithm is O(n³). React skips it with two hard heuristics:
        </p>
        <ul>
          <li>Two elements of <strong>different types</strong> produce different trees — burn the subtree, build a new one.</li>
          <li>Two elements of the <strong>same type</strong> have stable identity at the same position; reuse the fiber, update props.</li>
        </ul>
        <p>This is fast — and silently lossy when you violate the assumption.</p>
      </Step>

      <Step n={2} kind="explain" title="When the assumption breaks">
        <TryIt
          title="Wrapping a list in a Suspense boundary"
          knobs={[
            { key: "wrap", label: "wrap in <section>", default: false, hint: "Type changes at the root → React tears down the subtree" },
          ]}
          hint="Toggle the knob. Switching the wrapper element type forces the entire child list to unmount and remount, even though every child key is stable."
        >
          {(flags) => (
            <DiffTree
              title={flags.wrap ? "type changed at root → full unmount" : "same root type → reused"}
              before={[
                { id: "L", label: "<List>", status: "kept" },
                { id: "A", label: "  Row(AAPL)", status: "kept" },
                { id: "B", label: "  Row(MSFT)", status: "kept" },
                { id: "C", label: "  Row(GOOG)", status: "kept" },
              ]}
              after={
                flags.wrap
                  ? ([
                      { id: "S", label: "<section>", status: "added" },
                      { id: "L", label: "  <List>", status: "removed" },
                      { id: "A", label: "    Row(AAPL)", status: "removed" },
                      { id: "B", label: "    Row(MSFT)", status: "removed" },
                      { id: "C", label: "    Row(GOOG)", status: "removed" },
                    ] as DiffNode[])
                  : ([
                      { id: "L", label: "<List>", status: "kept" },
                      { id: "A", label: "  Row(AAPL)", status: "kept" },
                      { id: "B", label: "  Row(MSFT)", status: "kept" },
                      { id: "C", label: "  Row(GOOG)", status: "kept" },
                    ] as DiffNode[])
              }
            />
          )}
        </TryIt>
      </Step>

      <Step n={3} kind="explain" title="The conditional wrapper trap — same logic, different tree">
        <p>
          A common refactor: wrap a tree in a panel only when a side condition is true. Done
          carelessly, this looks like a one-line change and causes a full subtree teardown:
        </p>
        <pre className="not-prose mt-3 overflow-x-auto rounded-md border border-bg-border bg-bg-elevated p-3 font-mono text-[10px] leading-relaxed">
{`// BAD — different element types at the root of the same branch
{isExpanded
  ? <section className="big"><Inner/></section>
  : <Inner/>}

// → React sees <section> vs <Inner>, treats them as different types,
//   destroys + remounts the whole subtree. Inner loses local state.

// GOOD — same wrapper type both branches; toggle a class
<section className={isExpanded ? "big" : "small"}>
  <Inner/>
</section>`}
        </pre>
        <p>
          The fix is to keep the root element <em>type</em> stable and let attributes vary.
          Same component identity, no remount.
        </p>
      </Step>

      <Step n={4} kind="explain" title="Why the diff isn't O(n³): the two heuristics, made concrete">
        <p>
          The general tree-edit distance problem is O(n³). React skips it with two assumptions
          we already met. To make them concrete:
        </p>
        <ul>
          <li>
            <strong>Hash by type, position-by-position.</strong> If <code>tree[i].type ===
            prev[i].type</code>, reuse the fiber and reconcile props. Otherwise destroy.
          </li>
          <li>
            <strong>Inside a children array, hash by key.</strong> If <code>keys</code> match,
            the matched fibers reorder rather than remount. This is why keys are mandatory in
            lists.
          </li>
        </ul>
        <p>
          That&apos;s it. Two rules, applied recursively. The reason it&apos;s O(n) is that{" "}
          <em>you</em>, the developer, provide the &quot;moves&quot; for free via stable types
          and keys — the algorithm never has to search for them.
        </p>
      </Step>

      <Step n={5} kind="explain" title="A footnote: Custom Elements">
        <p>
          One quiet React 19 change with diff implications: <strong>Custom Elements</strong>{" "}
          (Web Components) are now first-class. React used to set everything as an attribute,
          which silently broke properties like <code>data</code> arrays. In 19 the renderer
          checks the element&apos;s property descriptor and assigns properties when available.
          This means <code>&lt;my-chart data={`{points}`}/&gt;</code> now reuses the same element
          when <code>points</code> changes — instead of tearing down the DOM node on every update.
        </p>
      </Step>

      <Step n={6} kind="next" title="Diffing is cheap. Commit isn't.">
        <Callout tone="next" title="next bottleneck">
          The diff phase is interruptible. The <strong>commit phase</strong> isn&apos;t — and
          everything that lands in commit (effects, refs, DOM mutations) runs in one
          uninterruptible sweep. Module 3 dives into Fiber, where render-vs-commit lives.
        </Callout>
      </Step>
    </Lesson>
  );
}
