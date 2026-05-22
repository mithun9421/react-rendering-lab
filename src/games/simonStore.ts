"use client";

import { create } from "zustand";

/**
 * Simon Says — watch the four pastel pads flash a sequence, then tap them
 * back in the same order. Each round adds one step; one wrong tap ends the
 * run. The best (longest) sequence ever reproduced persists across sessions.
 *
 * The in-progress sequence intentionally does NOT persist: the game is
 * 10-30 seconds long and the 'showing' phase needs to replay each time
 * anyway, so a fresh start on every resume is the cleaner UX.
 */

export const PADS = 4;
const FLASH_BASE_MS = 540;
const FLASH_MIN_MS = 280;
const FLASH_GAP_MS = 180;
const POST_SHOW_MS = 280;

export type PadId = 0 | 1 | 2 | 3;
export type SimonStatus = "idle" | "showing" | "waiting" | "over";

type State = {
  sequence: PadId[];
  status: SimonStatus;
  /** Which step of the sequence the computer is currently flashing
   *  (during `showing`). -1 if no pad is flashing. */
  showingStep: number;
  /** Pad the player just tapped — drives a brief flash on the view.
   *  Carries a nonce so taps on the same pad replay the animation. */
  flashPad: PadId | null;
  flashKey: number;
  /** Which step of the sequence the player has entered so far. */
  progress: number;
  best: number;
};

type Actions = {
  start: () => void;
  /** Player tapped a pad. */
  tap: (pad: PadId) => void;
  /** Called by the view to advance the showing animation. */
  showStep: (step: number) => void;
  hydrate: () => void;
};

const STORAGE_KEY = "rrl:simon";

const initial = (): State => ({
  sequence: [],
  status: "idle",
  showingStep: -1,
  flashPad: null,
  flashKey: 0,
  progress: 0,
  best: 0,
});

function persistBest(best: number) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ best }));
  } catch {
    /* storage unavailable */
  }
}

function rehydrateBest(): number {
  if (typeof window === "undefined") return 0;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return 0;
    const parsed = JSON.parse(raw) as { best?: number };
    return typeof parsed.best === "number" ? parsed.best : 0;
  } catch {
    return 0;
  }
}

function randPad(): PadId {
  return Math.floor(Math.random() * PADS) as PadId;
}

export function flashDurationFor(level: number): number {
  // Round 1: 540ms; each subsequent round trims ~24ms, floored at 280ms.
  return Math.max(FLASH_MIN_MS, FLASH_BASE_MS - (level - 1) * 24);
}

export const SHOW_GAP_MS = FLASH_GAP_MS;
export const SHOW_POST_MS = POST_SHOW_MS;

export const useSimon = create<State & Actions>((set, get) => ({
  ...initial(),

  hydrate: () => {
    set({ ...initial(), best: rehydrateBest() });
  },

  start: () => {
    const s = get();
    // Generate a single first step and begin the show.
    set({
      ...s,
      sequence: [randPad()],
      progress: 0,
      status: "showing",
      showingStep: -1,
      flashPad: null,
    });
  },

  showStep: (step) => {
    set({ showingStep: step });
  },

  tap: (pad) => {
    const s = get();
    // Tap flash always renders (for feedback). Only logic-applies in `waiting`.
    const flashKey = s.flashKey + 1;
    if (s.status !== "waiting") {
      set({ flashPad: pad, flashKey });
      return;
    }
    const expected = s.sequence[s.progress];
    if (pad !== expected) {
      const best = Math.max(s.best, s.sequence.length - 1); // they reproduced (length-1) earlier rounds at least
      // More precise: they finished sequence.length-1 rounds, so best = sequence.length - 1.
      // But it should be at least the previous best.
      set({
        ...s,
        flashPad: pad,
        flashKey,
        status: "over",
        best,
      });
      persistBest(best);
      return;
    }
    const nextProgress = s.progress + 1;
    if (nextProgress < s.sequence.length) {
      set({ ...s, flashPad: pad, flashKey, progress: nextProgress });
      return;
    }
    // Round cleared — append a new step and start showing again.
    const newSequence: PadId[] = [...s.sequence, randPad()];
    const best = Math.max(s.best, s.sequence.length);
    set({
      ...s,
      flashPad: pad,
      flashKey,
      progress: 0,
      sequence: newSequence,
      status: "showing",
      showingStep: -1,
      best,
    });
    if (best !== s.best) persistBest(best);
  },
}));
