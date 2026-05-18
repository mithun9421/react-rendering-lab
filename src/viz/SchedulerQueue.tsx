"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import clsx from "clsx";

/**
 * Visualises React's scheduler queues as five stacks.
 * - You can enqueue work into any lane.
 * - The scheduler always pops from the highest-priority non-empty lane.
 * - An "interrupt" animation triggers when a higher-priority item lands while a transition is running.
 *
 * NB: this is a teaching abstraction — the real scheduler is more nuanced (lane bitmasks,
 * yield checks, microtask drain). But the model holds.
 */

type Lane = "sync" | "input" | "default" | "transition" | "idle";
type Task = { id: number; lane: Lane; label: string };

const LANE_META: Record<Lane, { color: string; label: string }> = {
  sync: { color: "bg-accent-bad", label: "SyncLane · click/keypress" },
  input: { color: "bg-accent-warm", label: "ContinuousInput · mousemove/scroll" },
  default: { color: "bg-accent", label: "DefaultLane · setState / fetch result" },
  transition: { color: "bg-accent-info", label: "TransitionLane · startTransition" },
  idle: { color: "bg-accent-good", label: "IdleLane · low-priority work" },
};

const LANE_ORDER: Lane[] = ["sync", "input", "default", "transition", "idle"];

let idSeq = 0;
const nextId = () => ++idSeq;

export function SchedulerQueue() {
  const [queues, setQueues] = useState<Record<Lane, Task[]>>({
    sync: [],
    input: [],
    default: [],
    transition: [],
    idle: [],
  });
  const [running, setRunning] = useState<Task | null>(null);
  const [interruptKey, setInterruptKey] = useState(0);
  const runningRef = useRef<Task | null>(null);
  runningRef.current = running;

  const enqueue = (lane: Lane, label: string) => {
    const task = { id: nextId(), lane, label };
    setQueues((q) => ({ ...q, [lane]: [...q[lane], task] }));

    // Interrupt: a higher-priority task arrives while a lower-priority one is running.
    if (runningRef.current && LANE_ORDER.indexOf(lane) < LANE_ORDER.indexOf(runningRef.current.lane)) {
      setInterruptKey((k) => k + 1);
      // Put the interrupted task back at the front of its queue
      const interrupted = runningRef.current;
      setRunning(null);
      setQueues((q) => ({ ...q, [interrupted.lane]: [interrupted, ...q[interrupted.lane]] }));
    }
  };

  // Scheduler tick — every 600ms, pop from the highest non-empty lane.
  useEffect(() => {
    const tick = setInterval(() => {
      if (runningRef.current) {
        // finish current work
        setRunning(null);
        return;
      }
      setQueues((q) => {
        for (const lane of LANE_ORDER) {
          if (q[lane].length > 0) {
            const [head, ...rest] = q[lane];
            setRunning(head);
            return { ...q, [lane]: rest };
          }
        }
        return q;
      });
    }, 600);
    return () => clearInterval(tick);
  }, []);

  const total = Object.values(queues).reduce((a, ls) => a + ls.length, 0);

  return (
    <div className="rounded-lg border border-bg-border bg-bg-panel">
      <header className="flex flex-col gap-2 border-b border-bg-border px-3 py-2 text-xs sm:flex-row sm:items-center sm:justify-between">
        <span className="font-mono uppercase tracking-widest text-ink-dim">
          scheduler · {total} pending {running && `· running ${running.lane}`}
        </span>
        <div className="flex flex-wrap gap-1.5">
          {LANE_ORDER.map((l) => (
            <button
              key={l}
              onClick={() => enqueue(l, labelFor(l))}
              className="rounded-md border border-bg-border bg-bg-elevated px-2 py-1 font-mono text-[10px] active:scale-95"
              title={LANE_META[l].label}
            >
              + {l}
            </button>
          ))}
        </div>
      </header>

      {/* CPU "currently running" bar */}
      <div className="border-b border-bg-border bg-bg-subtle px-3 py-2">
        <div className="mb-1 font-mono text-[10px] uppercase tracking-widest text-ink-dim">
          CPU · running
        </div>
        <div className="relative h-8 overflow-hidden rounded border border-bg-border bg-bg-elevated">
          <AnimatePresence mode="wait">
            {running && (
              <motion.div
                key={running.id}
                initial={{ x: "-100%" }}
                animate={{ x: 0 }}
                exit={{ x: "100%", opacity: 0 }}
                transition={{ duration: 0.2 }}
                className={clsx("absolute inset-0 flex items-center px-3 font-mono text-xs text-white", LANE_META[running.lane].color)}
              >
                {running.label}
              </motion.div>
            )}
          </AnimatePresence>
          {/* Interrupt flash */}
          <AnimatePresence>
            <motion.div
              key={interruptKey}
              initial={{ opacity: 0.6 }}
              animate={{ opacity: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.6 }}
              className="pointer-events-none absolute inset-0 bg-accent-warn"
            />
          </AnimatePresence>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-px bg-bg-border md:grid-cols-5">
        {LANE_ORDER.map((lane) => (
          <div key={lane} className="bg-bg-panel p-3">
            <div className="mb-2 flex items-center gap-2">
              <span className={clsx("size-2 rounded-full", LANE_META[lane].color)} />
              <span className="font-mono text-[10px] uppercase tracking-widest text-ink-dim">{lane}</span>
            </div>
            <ul className="space-y-1">
              <AnimatePresence initial={false}>
                {queues[lane].map((t) => (
                  <motion.li
                    key={t.id}
                    layout
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    transition={{ duration: 0.15 }}
                    className="rounded bg-bg-elevated px-2 py-1 font-mono text-[11px] text-ink"
                  >
                    {t.label}
                  </motion.li>
                ))}
              </AnimatePresence>
              {queues[lane].length === 0 && (
                <li className="rounded border border-dashed border-bg-border px-2 py-1 font-mono text-[10px] text-ink-dim">
                  empty
                </li>
              )}
            </ul>
          </div>
        ))}
      </div>

      <footer className="border-t border-bg-border px-3 py-2 font-mono text-[10px] text-ink-dim">
        Higher lanes preempt lower lanes. Enqueue into <code>sync</code> while a{" "}
        <code>transition</code> is running to see the interrupt.
      </footer>
    </div>
  );
}

function labelFor(l: Lane): string {
  switch (l) {
    case "sync":
      return "click handler";
    case "input":
      return "scroll position";
    case "default":
      return "setState(data)";
    case "transition":
      return "filter 8k items";
    case "idle":
      return "warm cache";
  }
}
