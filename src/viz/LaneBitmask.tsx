"use client";

import { useState } from "react";
import clsx from "clsx";

/**
 * The React scheduler tracks pending work via a 31-bit lane bitmask
 * (one bit = one lane). Higher bits = lower priority. The scheduler always
 * works on the lowest-set-bit (highest priority) first.
 *
 * This viz lets the learner toggle bits and shows the resulting "next lane to work on".
 */

type Bit = { idx: number; label: string; color: string };

const LANES: Bit[] = [
  { idx: 0, label: "SyncHydrationLane", color: "bg-accent-bad" },
  { idx: 1, label: "SyncLane", color: "bg-accent-bad" },
  { idx: 2, label: "InputContinuousHydrationLane", color: "bg-accent-warm" },
  { idx: 3, label: "InputContinuousLane", color: "bg-accent-warm" },
  { idx: 4, label: "DefaultHydrationLane", color: "bg-accent" },
  { idx: 5, label: "DefaultLane", color: "bg-accent" },
  { idx: 6, label: "TransitionHydrationLane", color: "bg-accent-info" },
  { idx: 7, label: "TransitionLane 1", color: "bg-accent-info" },
  { idx: 8, label: "TransitionLane 2", color: "bg-accent-info" },
  { idx: 9, label: "TransitionLane 3", color: "bg-accent-info" },
  { idx: 10, label: "TransitionLane 4", color: "bg-accent-info" },
  { idx: 24, label: "RetryLane", color: "bg-accent-good" },
  { idx: 25, label: "SelectiveHydrationLane", color: "bg-accent-good" },
  { idx: 26, label: "IdleHydrationLane", color: "bg-accent-good" },
  { idx: 27, label: "IdleLane", color: "bg-accent-good" },
  { idx: 30, label: "OffscreenLane", color: "bg-ink-dim" },
];

export function LaneBitmask() {
  const [mask, setMask] = useState(0);

  const toggle = (idx: number) => setMask((m) => m ^ (1 << idx));
  const lowestBit = mask === 0 ? -1 : Math.log2(mask & -mask);
  const winner = LANES.find((l) => l.idx === lowestBit);

  return (
    <div className="rounded-lg border border-bg-border bg-bg-panel">
      <header className="flex flex-col gap-2 border-b border-bg-border px-3 py-2 text-xs sm:flex-row sm:items-center sm:justify-between">
        <span className="font-mono uppercase tracking-widest text-ink-dim">31-bit lane mask</span>
        <span className="font-mono text-ink-dim">
          mask = <span className="text-accent">0x{mask.toString(16).padStart(8, "0")}</span>
        </span>
      </header>

      {/* the 31 bits */}
      <div className="overflow-x-auto p-3">
        <div className="flex min-w-[480px] gap-0.5">
          {Array.from({ length: 31 }).map((_, i) => {
            const set = (mask & (1 << i)) !== 0;
            const lane = LANES.find((l) => l.idx === i);
            return (
              <button
                key={i}
                onClick={() => toggle(i)}
                title={lane?.label ?? `lane ${i}`}
                className={clsx(
                  "h-6 w-3 rounded-sm transition",
                  set ? lane?.color ?? "bg-accent" : "bg-bg-elevated"
                )}
              />
            );
          })}
        </div>
        <p className="mt-2 font-mono text-[10px] text-ink-dim">
          bit 0 (leftmost) = highest priority · bit 30 = lowest · tap to toggle
        </p>
      </div>

      {/* known lanes — clickable */}
      <div className="border-t border-bg-border p-3">
        <p className="mb-2 font-mono text-[10px] uppercase tracking-widest text-ink-dim">named lanes</p>
        <div className="flex flex-wrap gap-1.5">
          {LANES.map((l) => {
            const set = (mask & (1 << l.idx)) !== 0;
            return (
              <button
                key={l.idx}
                onClick={() => toggle(l.idx)}
                className={clsx(
                  "rounded-md px-2 py-1 font-mono text-[10px] active:scale-95",
                  set ? `${l.color} text-white` : "border border-bg-border text-ink-muted"
                )}
              >
                {l.label}
              </button>
            );
          })}
        </div>
      </div>

      <footer className="border-t border-bg-border px-3 py-2 font-mono text-[11px]">
        {winner ? (
          <span>
            next to render:{" "}
            <span className={clsx("rounded px-1.5 py-0.5 text-white", winner.color)}>
              {winner.label}
            </span>{" "}
            <span className="text-ink-dim">(lowest set bit · highest priority)</span>
          </span>
        ) : (
          <span className="text-ink-dim">no pending work · idle</span>
        )}
      </footer>
    </div>
  );
}
