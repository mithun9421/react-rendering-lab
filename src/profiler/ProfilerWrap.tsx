"use client";

import { Profiler, type ProfilerOnRenderCallback } from "react";
import { useProfiler } from "./store";

/**
 * Wraps children in React's <Profiler> API and forwards every onRender event
 * to the lab's profiler store. Use sparingly — Profiler has overhead.
 *
 * The store gains four extra fields per commit when fed by this:
 *   - actualDuration: ms of work React did this commit
 *   - baseDuration:   ms of work React WOULD have done with no memoisation
 *   - phase:          "mount" | "update" | "nested-update"
 *
 * Diff `actualDuration` vs `baseDuration` to see how much memo saved you. If
 * they're equal, your memo isn't doing anything. If baseDuration is huge and
 * actualDuration is tiny, your memo is earning its keep.
 */
export function ProfilerWrap({ id, children }: { id: string; children: React.ReactNode }) {
  const push = useProfiler((s) => s.pushCommit);

  const onRender: ProfilerOnRenderCallback = (
    profilerId,
    phase,
    actualDuration,
    baseDuration,
    _startTime,
    commitTime
  ) => {
    push({
      label: profilerId,
      dur: actualDuration,
      fibers: 1,
      lane: phase === "mount" ? "urgent" : "idle",
      actualDuration,
      baseDuration,
      phase,
      t: commitTime,
    });
  };

  return (
    <Profiler id={id} onRender={onRender}>
      {children}
    </Profiler>
  );
}
