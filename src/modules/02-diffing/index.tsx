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

      <Step n={3} kind="next" title="Diffing is cheap. Commit isn't.">
        <Callout tone="next" title="next bottleneck">
          The diff phase is interruptible. The <strong>commit phase</strong> isn&apos;t — and
          everything that lands in commit (effects, refs, DOM mutations) runs in one
          uninterruptible sweep. Module 3 dives into Fiber, where render-vs-commit lives.
        </Callout>
      </Step>
    </Lesson>
  );
}
