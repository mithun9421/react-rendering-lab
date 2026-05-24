"use client";

import { create } from "zustand";

export type CommitEvent = {
  /** monotonic id */
  id: number;
  /** ms timestamp, performance.now() */
  t: number;
  /** ms duration */
  dur: number;
  /** label (component or surface) */
  label: string;
  /** number of fibers/components in this commit */
  fibers: number;
  /** was this an "urgent" lane or a transition? */
  lane: "urgent" | "transition" | "idle";
  /** when present, from React's <Profiler> API — actualDuration / baseDuration in ms */
  actualDuration?: number;
  baseDuration?: number;
  /** mount vs update phase per Profiler's onRender phase arg */
  phase?: "mount" | "update" | "nested-update";
};

/** Long task captured from the browser's Long Tasks API. */
export type LongTaskEvent = {
  id: number;
  /** start time, ms (performance.now()) */
  t: number;
  /** task duration, ms */
  dur: number;
};

type ProfilerState = {
  fps: number;
  droppedFrames: number;
  /** total render invocations recorded by `useRenderCount` since reset */
  renders: Record<string, number>;
  commits: CommitEvent[];
  /** real Long Tasks (>50ms) from PerformanceObserver, kept bounded */
  longTasks: LongTaskEvent[];
  /** simulated CPU load 0..1 — heavyTask uses this */
  cpu: number;
  /** simulated memory MB */
  mem: number;
  recording: boolean;

  // actions
  bumpRender: (label: string) => void;
  pushCommit: (c: Omit<CommitEvent, "id" | "t"> & Partial<Pick<CommitEvent, "t">>) => void;
  pushLongTask: (l: Omit<LongTaskEvent, "id">) => void;
  setFps: (fps: number, dropped: number) => void;
  setCpu: (cpu: number) => void;
  setMem: (mem: number) => void;
  toggleRecord: () => void;
  reset: () => void;
};

let commitId = 0;
let longTaskId = 0;

export const useProfiler = create<ProfilerState>((set) => ({
  fps: 60,
  droppedFrames: 0,
  renders: {},
  commits: [],
  longTasks: [],
  cpu: 0,
  mem: 0,
  recording: true,

  bumpRender: (label) =>
    set((s) => {
      if (!s.recording) return s;
      return { renders: { ...s.renders, [label]: (s.renders[label] ?? 0) + 1 } };
    }),

  pushCommit: (c) =>
    set((s) => {
      if (!s.recording) return s;
      const evt: CommitEvent = {
        id: ++commitId,
        t: c.t ?? (typeof performance !== "undefined" ? performance.now() : Date.now()),
        dur: c.dur,
        label: c.label,
        fibers: c.fibers,
        lane: c.lane,
        actualDuration: c.actualDuration,
        baseDuration: c.baseDuration,
        phase: c.phase,
      };
      const next = s.commits.length > 240 ? s.commits.slice(-200) : s.commits;
      return { commits: [...next, evt] };
    }),

  pushLongTask: (l) =>
    set((s) => {
      if (!s.recording) return s;
      const evt: LongTaskEvent = { id: ++longTaskId, t: l.t, dur: l.dur };
      const next = s.longTasks.length > 60 ? s.longTasks.slice(-50) : s.longTasks;
      return { longTasks: [...next, evt] };
    }),

  setFps: (fps, dropped) => set({ fps, droppedFrames: dropped }),
  setCpu: (cpu) => set({ cpu }),
  setMem: (mem) => set({ mem }),
  toggleRecord: () => set((s) => ({ recording: !s.recording })),
  reset: () => set({ renders: {}, commits: [], longTasks: [], droppedFrames: 0 }),
}));
