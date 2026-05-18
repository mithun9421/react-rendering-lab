"use client";

import { useDeferredValue, useMemo, useState, useTransition } from "react";
import { Lesson } from "@/engine/Lesson";
import { Step } from "@/engine/Step";
import { Callout } from "@/engine/Callout";
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

      <Step n={5} kind="next" title="You yield between work units. Now you need to yield inside one.">
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
