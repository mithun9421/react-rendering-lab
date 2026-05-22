"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

/**
 * Step-by-step tour for one journey stage. Six max steps per stage; each step
 * names what to look at and what should be different vs. the previous stage.
 *
 * Step authors should reference real surfaces by literal name: "the right
 * panel", "the profiler dock", "the StockRow counters" — readers shouldn't have
 * to translate metaphor to UI.
 */
export type TourStep = {
  /** Short imperative — appears as the step title. */
  title: string;
  /** Body text — keep it to 2 sentences max. */
  body: string;
  /** Optional anchor label to display ("dashboard", "profiler", "code diff"). */
  pointAt?: "left-panel" | "right-panel" | "profiler" | "diff" | "controls";
};

export function StageTour({ steps, stageKey }: { steps: TourStep[]; stageKey: string | number }) {
  const [open, setOpen] = useState(false);
  const [idx, setIdx] = useState(0);
  const lastStageKey = useRef(stageKey);

  // Reset to step 0 whenever the stage changes
  useEffect(() => {
    if (lastStageKey.current !== stageKey) {
      lastStageKey.current = stageKey;
      setIdx(0);
    }
  }, [stageKey]);

  if (steps.length === 0) return null;
  const step = steps[idx];

  return (
    <div className="overflow-hidden rounded-lg border border-accent/30 bg-accent/[0.04]">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition hover:bg-accent/10"
        aria-expanded={open}
      >
        <div className="min-w-0">
          <div className="font-mono text-[10px] uppercase tracking-widest text-accent">
            ▸ guided tour · {steps.length} step{steps.length === 1 ? "" : "s"}
          </div>
          <div className="mt-0.5 truncate text-sm text-ink">
            {open ? `${idx + 1}. ${step.title}` : "Tap to walk through this stage"}
          </div>
        </div>
        <span aria-hidden className="font-mono text-sm text-accent">
          {open ? "−" : "+"}
        </span>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="overflow-hidden border-t border-accent/20"
          >
            <div className="p-4">
              {/* Progress dots */}
              <ol className="mb-3 flex flex-wrap items-center gap-1.5">
                {steps.map((_, i) => (
                  <li key={i}>
                    <button
                      onClick={() => setIdx(i)}
                      className={cn(
                        "h-1.5 rounded-full transition",
                        i === idx ? "w-8 bg-accent" : i < idx ? "w-4 bg-accent-good/60" : "w-4 bg-bg-border"
                      )}
                      aria-label={`Go to step ${i + 1}`}
                    />
                  </li>
                ))}
                <li className="ml-auto font-mono text-[10px] text-ink-dim">
                  {idx + 1} / {steps.length}
                </li>
              </ol>

              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, x: 6 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -6 }}
                  transition={{ duration: 0.14 }}
                >
                  <div className="flex items-start gap-3">
                    <span className="grid size-6 shrink-0 place-items-center rounded-full border border-accent/40 bg-accent/10 font-mono text-[11px] text-accent">
                      {idx + 1}
                    </span>
                    <div className="min-w-0">
                      <h3 className="text-sm font-medium text-ink">{step.title}</h3>
                      <p className="mt-1 text-xs leading-relaxed text-ink-muted">{step.body}</p>
                      {step.pointAt && (
                        <p className="mt-2 inline-flex items-center gap-1.5 rounded bg-bg-elevated px-1.5 py-0.5 font-mono text-[10px] text-ink-dim">
                          <span className="text-accent">↗</span> look at:{" "}
                          <span className="text-ink">{anchorLabel(step.pointAt)}</span>
                        </p>
                      )}
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>

              {/* Controls */}
              <div className="mt-4 flex items-center justify-between">
                <button
                  onClick={() => setIdx((i) => Math.max(0, i - 1))}
                  disabled={idx === 0}
                  className="rounded-md border border-bg-border bg-bg-elevated px-3 py-1.5 font-mono text-[11px] active:scale-95 disabled:opacity-40"
                >
                  ← prev
                </button>
                <span className="font-mono text-[10px] text-ink-dim">
                  {idx === steps.length - 1 ? "end of tour" : `${steps.length - 1 - idx} more`}
                </span>
                <button
                  onClick={() => setIdx((i) => Math.min(steps.length - 1, i + 1))}
                  disabled={idx === steps.length - 1}
                  className="rounded-md bg-accent px-3 py-1.5 font-mono text-[11px] text-white active:scale-95 disabled:opacity-40"
                >
                  next →
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function anchorLabel(p: TourStep["pointAt"]) {
  switch (p) {
    case "left-panel":
      return "the LEFT dashboard (previous stage)";
    case "right-panel":
      return "the RIGHT dashboard (current stage)";
    case "profiler":
      return "the profiler dock (bottom of page)";
    case "diff":
      return "the code diff below";
    case "controls":
      return "the apply-next-fix button";
    default:
      return "";
  }
}
