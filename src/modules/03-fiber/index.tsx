"use client";

import { Lesson } from "@/engine/Lesson";
import { Step } from "@/engine/Step";
import { Callout } from "@/engine/Callout";
import { FiberTrace } from "@/viz/FiberTrace";

export default function Module03() {
  return (
    <Lesson slug="03-fiber">
      <Step n={1} kind="explain" title="A fiber is a unit of work, not a node">
        <p>
          The reconciler walks a singly-linked tree (parent / firstChild / sibling / return).
          Each node is a <strong>fiber</strong> — a record carrying type, props, hooks, and
          alternate pointer. The walk produces a new alternate tree; commit phase swaps it in.
        </p>
        <p>Press play to see one render-phase pass:</p>
      </Step>

      <Step n={2} kind="profile" title="Render phase vs commit phase">
        <div className="not-prose">
          <FiberTrace />
        </div>
        <p className="mt-3">
          The render phase can be paused, restarted, or aborted. The commit phase cannot — once
          React decides to commit, the DOM mutations, layout effects and refs run in one
          synchronous sweep.
        </p>
      </Step>

      <Step n={3} kind="explain" title="Lanes — priority lives in 31 bits">
        <p>
          Updates are tagged with a <em>lane</em>: SyncLane, InputContinuousLane, DefaultLane,
          TransitionLane, IdleLane. The scheduler picks the highest-priority pending lane on
          each macrotask. <code>startTransition</code> tags its work with TransitionLane — that&apos;s
          the entire mechanism behind interruptible updates.
        </p>
      </Step>

      <Step n={4} kind="next" title="A fast walker still blocks if no one yields">
        <Callout tone="next" title="next bottleneck">
          Fiber gives React the <em>ability</em> to yield, but plain <code>setState</code> still
          renders synchronously. Module 4 introduces concurrent APIs that actually use it.
        </Callout>
      </Step>
    </Lesson>
  );
}
