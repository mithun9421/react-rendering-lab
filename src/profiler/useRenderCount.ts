"use client";

import { useEffect, useRef } from "react";
import { useProfiler } from "./store";

/**
 * Increments the global render counter for `label` on EVERY render of the calling component.
 * Visible in the profiler dock and in `<RenderCounter label=... />`.
 *
 * NB: we deliberately call this in render (not in effect) so a render that throws still counts.
 */
export function useRenderCount(label: string) {
  const bump = useProfiler((s) => s.bumpRender);
  // Track per-instance count too — useful for "this row rendered N times" overlays.
  const local = useRef(0);
  local.current += 1;
  bump(label);
  return local.current;
}

/** Measures commit duration via a layout effect — closest we can get without devtools API. */
export function useCommitTimer(label: string, opts?: { lane?: "urgent" | "transition" | "idle"; fibers?: number }) {
  const push = useProfiler((s) => s.pushCommit);
  const start = useRef<number>(0);
  // record at render-start
  start.current = typeof performance !== "undefined" ? performance.now() : Date.now();

  useEffect(() => {
    const end = typeof performance !== "undefined" ? performance.now() : Date.now();
    push({
      dur: end - start.current,
      label,
      lane: opts?.lane ?? "urgent",
      fibers: opts?.fibers ?? 1,
    });
  });
}

/** Combined helper. */
export function useProfileRender(label: string, opts?: { lane?: "urgent" | "transition" | "idle"; fibers?: number }) {
  const count = useRenderCount(label);
  useCommitTimer(label, opts);
  return count;
}
