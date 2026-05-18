"use client";

import { Lesson } from "@/engine/Lesson";
import { Step } from "@/engine/Step";
import { Callout } from "@/engine/Callout";
import { FiberTrace } from "@/viz/FiberTrace";
import { LaneBitmask } from "@/viz/LaneBitmask";
import { ArchitectNotes } from "@/engine/ArchitectNotes";

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

      <Step n={6} kind="explain" title="Common interview questions, and the one-line answers">
        <ul>
          <li>
            <strong>Why does React need fiber at all?</strong> To break rendering into chunks
            the scheduler can pause, resume, and abort. Without it, every render is a single
            synchronous walk you can&apos;t interrupt.
          </li>
          <li>
            <strong>What&apos;s the alternate tree?</strong> A double-buffered version of the
            current fiber tree. The render phase mutates the alternate; commit swaps it in.
            That&apos;s how React can throw away in-progress work without corrupting the live UI.
          </li>
          <li>
            <strong>Why are hooks order-dependent?</strong> Each fiber stores its hook state as
            a linked list. The order of hook calls maps to positions in that list. Conditional
            hooks break the mapping and the next render reads someone else&apos;s state.
          </li>
          <li>
            <strong>Why do refs not trigger re-renders?</strong> Refs are stored on the fiber,
            not on the hook state. Mutating a ref doesn&apos;t enqueue an update.
          </li>
          <li>
            <strong>What runs in the passive-effect phase?</strong> <code>useEffect</code>{" "}
            callbacks. They are <em>scheduled</em> during commit but executed on the next
            macrotask — so they don&apos;t delay the paint.
          </li>
        </ul>
      </Step>

      <ArchitectNotes
        framing="The fiber question separates 'I've used React' from 'I understand React.' They want vocabulary that's specific (work unit, alternate, lane, effect tag) and a clear mental model of render vs commit."
        followUps={[
          {
            q: "Walk me through a complete render → commit cycle for a setState that updates one row in a list of 1,000.",
            a: "(1) setState pushes an update onto the fiber's queue, tagged with a lane (default for a click, transition for a transition). (2) Scheduler picks the highest-priority pending lane, starts a render. (3) Reconciler walks from the root, comparing each fiber's pendingProps to memoizedProps. Where they're equal, it bails out — most of the 1,000 rows don't re-execute. The one row that changed runs its function, produces a new element tree. (4) Effect tags accumulate on the path from changed-row up to root. (5) Render phase produces the alternate tree. (6) Commit phase: before-mutation, mutation (DOM writes for the changed row), layout (useLayoutEffect), then passive effects scheduled on next macrotask. The whole pipeline is ~one frame for a well-keyed list.",
          },
          {
            q: "What IS a fiber, concretely? Field-level.",
            a: "A plain object with fields including: `type` (the component function or HTML tag string), `key`, `stateNode` (the DOM node for hosts, or the class instance for class components, null for function components), `child`/`sibling`/`return` (the linked-list pointers), `alternate` (pointer to the other tree's fiber for this slot), `memoizedProps`/`pendingProps` (props before/after the current work), `memoizedState` (the linked list of hook records for function components), `flags` (effect tags: Placement, Update, Deletion, Snapshot, etc.), `lanes` (which lanes have pending work for this fiber). About 30 fields total. Nothing magical — just a record.",
          },
          {
            q: "Explain double buffering. Why two trees?",
            a: "At any moment React holds two fiber trees: the 'current' tree (what's on screen) and the 'work-in-progress' alternate (being built). Render phase mutates the alternate. If the scheduler interrupts mid-render, the alternate is discarded and re-started; the current is untouched, screen unchanged. Commit phase swaps the alternate to be the current by applying its DOM effects. Two trees = atomicity. Without it, an interrupted render would leave the UI in a half-applied state.",
          },
          {
            q: "How are hooks bound to a fiber? Why does order matter?",
            a: "Each function component fiber has a `memoizedState` field that's the HEAD of a linked list of hook records. Each useState/useEffect/useMemo call advances a cursor through that list, creating the node on first render and updating it on subsequent renders. React indexes by position in the list. Conditional hooks shift the positions: the second render might align useState-1 with what was useEffect at the previous render. The 'rules of hooks' linter exists to catch this at write-time because the runtime can't.",
          },
          {
            q: "When does React abort a render? What triggers it?",
            a: "Three triggers. (1) A higher-priority lane arrives mid-render — the scheduler aborts the current work, throws away the alternate, and starts fresh at the higher priority. (2) An error inside a render throws — the entire alternate is discarded, error boundary kicks in. (3) Suspense — a thrown Promise causes React to abort the affected subtree, show the fallback, and resume when the Promise resolves. In all three cases, the user-visible current tree is unchanged because alternate is what got mutated.",
          },
          {
            q: "What's the difference between effect tags / flags and lane bitmasks?",
            a: "Lanes are at the FIBER level — they describe what priority of work is pending. Flags are at the FIBER level too, but describe what side effects the commit phase will apply for this fiber: Placement (DOM insertion), Update (props/text change), Deletion, Snapshot (getSnapshotBeforeUpdate), Passive (useEffect). Lanes drive scheduling decisions ('which work do I pick up next?'); flags drive commit decisions ('what do I do to the DOM here?'). Both are bitmasks for the same O(1) merge / read reasons.",
          },
        ]}
        pivots={[
          { to: "Concurrent rendering (Module 4)", why: "Fibers enable concurrency; the natural pivot is 'show me what code triggers it.'" },
          { to: "useSyncExternalStore + tearing", why: "Concurrent + fiber double-buffer is what 'tearing' means; the architect will probe if you know why external stores need this hook." },
          { to: "Server Components vs fibers", why: "RSC don't have fibers in the client sense — they want to hear you articulate the difference." },
        ]}
        dontSay={[
          {
            phrase: "Fibers are virtual DOM nodes.",
            why: "Vague. Fibers are persistent records that survive renders; elements are throwaway descriptions. The architect will ask 'so what's an element?' to test.",
          },
          {
            phrase: "React keeps state in memory.",
            why: "Where in memory? Be specific: state lives on the fiber's memoizedState linked list, keyed by hook call order. Specificity is what 'senior' means.",
          },
          {
            phrase: "Fibers are React's main optimization.",
            why: "Fibers enable optimizations (concurrency, time-slicing, interruption). They aren't themselves the optimization. The mental model is 'persistent work units' first, 'enables scheduling' second.",
          },
        ]}
      />

      <Step n={7} kind="next" title="Fiber gives React the ability to yield. But plain setState doesn't use it.">
        <Callout tone="next" title="next bottleneck">
          The walker is interruptible, the priorities are surgical, but <code>setState</code>{" "}
          still renders synchronously by default. Module 4 introduces concurrent APIs that
          actually exercise the lanes.
        </Callout>
      </Step>
    </Lesson>
  );
}
