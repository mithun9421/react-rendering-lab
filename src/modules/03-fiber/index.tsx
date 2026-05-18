"use client";

import { Lesson } from "@/engine/Lesson";
import { Step } from "@/engine/Step";
import { Callout } from "@/engine/Callout";
import { FiberTrace } from "@/viz/FiberTrace";
import { LaneBitmask } from "@/viz/LaneBitmask";

export default function Module03() {
  return (
    <Lesson slug="03-fiber">
      <Step n={1} kind="explain" title="A fiber is a unit of work, not a node">
        <p>
          The reconciler walks a singly-linked tree (parent / firstChild / sibling / return).
          Each node is a <strong>fiber</strong> — a record carrying type, props, hooks, and
          alternate pointer. The walk produces a new alternate tree; commit phase swaps it in.
        </p>
        <p>Press play to see one render → commit pass:</p>
      </Step>

      <Step n={2} kind="profile" title="Render phase vs commit phase">
        <div className="not-prose">
          <FiberTrace />
        </div>
        <p className="mt-3">
          The render phase can be paused, restarted, or aborted. The commit phase cannot — once
          React decides to commit, the four sub-phases (snapshot, mutation, layout, passive)
          run in one synchronous sweep.
        </p>
      </Step>

      <Step n={3} kind="explain" title="The commit sub-phases — what runs when">
        <ul>
          <li>
            <strong>before-mutation</strong> — <code>getSnapshotBeforeUpdate</code> runs.
            Capture scroll position / focus before the DOM changes.
          </li>
          <li>
            <strong>mutation</strong> — DOM writes, ref attachments, ref detachments. The user
            now sees the new pixels (after the next paint).
          </li>
          <li>
            <strong>layout</strong> — <code>useLayoutEffect</code> runs synchronously, before
            the browser paints. Mutating DOM here is fine; reading layout values is fine.
          </li>
          <li>
            <strong>passive (scheduled)</strong> — <code>useEffect</code> runs after the paint,
            scheduled on the next macrotask. <em>Not</em> part of the synchronous commit; this is
            why effects don&apos;t block the frame.
          </li>
        </ul>
      </Step>

      <Step n={4} kind="profile" title="Lanes — priority lives in 31 bits">
        <p>
          Every pending update is tagged with one or more lanes. The scheduler stores them in a
          single 31-bit integer bitmask and uses the lowest set bit as the next-highest priority.
          Toggle bits below and watch the &quot;next lane to render&quot; pick:
        </p>
        <div className="not-prose mt-3">
          <LaneBitmask />
        </div>
      </Step>

      <Step n={5} kind="explain" title="Why bitmasks?">
        <p>
          Two operations dominate the scheduler&apos;s hot path: <em>find the next priority</em>{" "}
          and <em>merge a new update into the existing pending set</em>. A bitmask makes both{" "}
          <strong>O(1)</strong>: <code>lowestBit = lanes & -lanes</code> for priority,{" "}
          <code>combined = a | b</code> for merging. The whole pending-work state of the React
          tree fits in 4 bytes per root.
        </p>
      </Step>

      <Step n={6} kind="next" title="Fiber gives React the ability to yield. But plain setState doesn't use it.">
        <Callout tone="next" title="next bottleneck">
          The walker is interruptible, the priorities are surgical, but <code>setState</code>{" "}
          still renders synchronously by default. Module 4 introduces concurrent APIs that
          actually exercise the lanes.
        </Callout>
      </Step>
    </Lesson>
  );
}
