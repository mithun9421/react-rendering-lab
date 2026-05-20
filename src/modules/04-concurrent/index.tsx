"use client";

import { useDeferredValue, useMemo, useState, useTransition } from "react";
import { Lesson } from "@/engine/Lesson";
import { Step } from "@/engine/Step";
import { Callout } from "@/engine/Callout";
import { ArchitectNotes } from "@/engine/ArchitectNotes";
import { TryIt } from "@/engine/TryIt";
import { MetricsPanel } from "@/engine/MetricsPanel";
import { SchedulerQueue } from "@/viz/SchedulerQueue";
import { useRenderCount } from "@/profiler/useRenderCount";
import { busy } from "@/lib/sim";
import clsx from "clsx";

const HAYSTACK = Array.from({ length: 8000 }, (_, i) => `item-${i.toString(16).padStart(4, "0")}`);

export default function Module04() {
  return (
    <Lesson slug="04-concurrent">
      <Step n={1} kind="observe" title="A search input that fights you">
        <p>
          Filtering 8k strings takes a few ms — fine. But on every keystroke, React schedules a
          fat render that blocks the input. Type fast and you feel it: the field drops keys
          and stutters. The same update is both urgent (the text caret) and non-urgent (the
          filtered list).
        </p>
      </Step>

      <Step n={2} kind="fix" title="Split urgency with useTransition + useDeferredValue">
        <TryIt
          title="search demo"
          knobs={[
            { key: "transition", label: "use startTransition for results", default: false },
            { key: "deferred", label: "useDeferredValue for list", default: false },
            { key: "heavy", label: "+12ms artificial work / render", default: false },
          ]}
          hint="Turn 'heavy' on first to feel the jank. Then enable startTransition: typing stays smooth even though the result list is stale for a beat. That staleness is the trade — and it's the whole point."
        >
          {(flags) => <SearchDemo flags={flags} />}
        </TryIt>

        <div className="mt-4">
          <MetricsPanel watch={["SearchResults"]} />
        </div>
      </Step>

      <Step n={3} kind="profile" title="See the queue, see the interrupt">
        <p>
          Five lanes, one CPU. The scheduler always pops from the highest non-empty lane. If a
          higher-priority task arrives mid-flight, the lower-priority one is{" "}
          <em>interrupted</em> — pushed back to its queue, finished later.
        </p>
        <div className="not-prose mt-3">
          <SchedulerQueue />
        </div>
        <p className="mt-3">
          Try this sequence: enqueue a <code>transition</code> (filter 8k items), wait for it to
          start, then enqueue a <code>sync</code> (click handler). Watch the bar flash and the
          transition slot returns to its queue.
        </p>
      </Step>

      <Step n={4} kind="explain" title="What 'lane' actually does">
        <p>
          <code>startTransition</code> tags the wrapped update with TransitionLane. When the
          scheduler sees both a SyncLane (your keystroke) and a TransitionLane (your filtered
          results) it commits the keystroke first and lets the transition re-render — and
          interrupts it if a higher-priority update arrives.
        </p>
        <p>
          <code>useDeferredValue</code> is the read-side dual: it lets a child <em>read</em> a
          stale version of a value until the urgent commit settles.
        </p>
      </Step>

      <Step n={5} kind="explain" title="When transitions don't help">
        <p>
          <code>startTransition</code> only helps if the work it wraps is interruptible
          render-phase work. It does <em>not</em>:
        </p>
        <ul>
          <li>
            <strong>Yield inside a single component</strong>. If <code>computeFilter()</code>{" "}
            takes 200ms in one component, wrapping its result-setting <em>state</em> in a
            transition doesn&apos;t help — the work still runs synchronously when that
            component renders. Time-slice the work itself (Module 5).
          </li>
          <li>
            <strong>Help with effects</strong>. <code>useEffect</code> callbacks aren&apos;t
            part of the lane system; they run after commit regardless.
          </li>
          <li>
            <strong>Help with the network</strong>. Transitions are CPU schedulers, not network
            schedulers. For request prioritisation see Module 18.
          </li>
        </ul>
        <p>
          The rule: <code>startTransition</code> for &quot;this state update is allowed to be
          stale.&quot; Everything else is a different tool.
        </p>
      </Step>

      <ArchitectNotes
        framing="The architect wants to see whether you can articulate the difference between rendering priority (lanes/transitions) and rendering interruption (fiber yielding) — they're related but not the same."
        followUps={[
          {
            q: "What does `startTransition` actually do at the scheduler level?",
            a: "It tags any state updates queued inside the callback with TransitionLane (one of the 31 lanes). The scheduler treats TransitionLane work as preemptible: if a SyncLane update (a click, a keystroke) arrives mid-transition, the scheduler aborts the in-flight transition render, processes the urgent work first, then resumes the transition. The transition is what gives React the LICENSE to interrupt the work. Without it, the render runs to completion.",
          },
          {
            q: "Why doesn't useTransition help with a single 200ms-blocking component?",
            a: "Transitions yield BETWEEN fibers — between component renders within the tree. The scheduler checks `shouldYield()` after each fiber's work. If a single component takes 200ms inside its function body (heavy compute, sync loop), there's no yield point — the scheduler can't interrupt mid-function. The fix is time slicing the work inside that component (chunking with rAF/postTask), or moving it off the main thread (worker). Transitions handle the across-tree case; time slicing handles the within-component case.",
          },
          {
            q: "useDeferredValue vs useTransition — when do you reach for which?",
            a: "useTransition wraps an UPDATE site — 'this state setter is non-urgent.' You own the update. useDeferredValue wraps a READ site — 'render this value, but it's OK if I'm a frame behind.' You consume a prop you don't own. Use useTransition when YOU dispatch the update; use useDeferredValue when a parent passed you a prop and you want to make YOUR re-render off the critical path. They compose: parent uses transition on the update, child uses deferred value on the read.",
          },
          {
            q: "What's the relationship between transitions and Suspense?",
            a: "Transitions tell Suspense 'don't show a fallback for this update.' Normally, a Suspense boundary swaps to fallback the moment any descendant suspends. Inside a transition, Suspense keeps the previous content mounted and shows the fallback only if the transition takes more than ~500ms (configurable). This is what gives navigation a smooth feel — no flash to skeleton on every link click, only on actually-slow loads. The architect is testing whether you've used both together.",
          },
          {
            q: "Can transitions starve? What if SyncLane updates keep arriving?",
            a: "Yes. If high-priority lanes never empty, a transition can be delayed indefinitely — each retry gets preempted. React has internal anti-starvation: after a configurable timeout (~5s), a starving transition gets bumped to a higher priority. In practice you rarely hit it; if you do, you have an architectural problem (too many sync updates, or the transition should have been split). The architect may ask 'how would you debug a stuck transition?' — answer: profiler timeline + commit lane inspection.",
          },
        ]}
        pivots={[
          { to: "Fiber lanes + bitmask (Module 3)", why: "Transitions are syntactic sugar over a lane tag; expect to discuss the bitmask." },
          { to: "Time slicing (Module 5)", why: "Natural extension — between vs within fibers." },
          { to: "Suspense boundaries (Module 8)", why: "Transitions interact with Suspense fallback behavior." },
        ]}
        dontSay={[
          {
            phrase: "useTransition makes React render in parallel.",
            why: "React is single-threaded. Transitions enable interruption, not parallelism. There's no second thread doing the deferred work.",
          },
          {
            phrase: "Wrap everything in startTransition.",
            why: "Urgent updates SHOULD be urgent. Wrapping every setState makes input feel laggy because the keystroke is now preemptible. Reserve transitions for genuinely-deferrable work.",
          },
        ]}
      />

      <Step n={6} kind="next" title="You yield between work units. Now you need to yield inside one.">
        <Callout tone="next" title="next bottleneck">
          Concurrency yields between fibers. But if a single component <em>itself</em> does
          12ms of work, that fiber is uninterruptible. Module 5 attacks the frame budget
          directly with time slicing.
        </Callout>
      </Step>
    </Lesson>
  );
}

function SearchDemo({ flags }: { flags: { transition: boolean; deferred: boolean; heavy: boolean } }) {
  const [q, setQ] = useState("");
  const [filterQ, setFilterQ] = useState("");
  const [isPending, startTransition] = useTransition();
  const deferred = useDeferredValue(filterQ);
  const queryForFilter = flags.deferred ? deferred : filterQ;

  return (
    <div>
      <div className="flex items-center gap-2">
        <input
          value={q}
          onChange={(e) => {
            const v = e.target.value;
            setQ(v);
            if (flags.transition) startTransition(() => setFilterQ(v));
            else setFilterQ(v);
          }}
          placeholder="search 8k items…"
          className="flex-1 rounded-md border border-bg-border bg-bg-elevated px-3 py-2 font-mono text-sm placeholder:text-ink-dim focus:outline-none focus:ring-2 focus:ring-accent/40"
        />
        <span className={clsx("font-mono text-[11px]", isPending ? "text-accent-warn" : "text-ink-dim")}>
          {isPending ? "pending…" : "idle"}
        </span>
      </div>
      <SearchResults q={queryForFilter} heavy={flags.heavy} />
    </div>
  );
}

function SearchResults({ q, heavy }: { q: string; heavy: boolean }) {
  useRenderCount("SearchResults");
  const results = useMemo(() => {
    if (heavy) busy(12);
    const needle = q.toLowerCase();
    return HAYSTACK.filter((s) => s.includes(needle)).slice(0, 80);
  }, [q, heavy]);

  return (
    <ul className="mt-3 max-h-64 overflow-y-auto rounded-md border border-bg-border bg-bg-elevated p-2 font-mono text-[11px]">
      {results.length === 0 && <li className="px-2 py-1 text-ink-dim">no matches</li>}
      {results.map((s) => (
        <li key={s} className="px-2 py-0.5 text-ink-muted">
          {s}
        </li>
      ))}
    </ul>
  );
}
