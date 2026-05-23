"use client";

import { create } from "zustand";

/**
 * Stroop — match the INK colour of a colour word, ignoring what the word says.
 * 20-second round. Score = correct - wrong; streak = consecutive correct.
 * Best score + best streak persist across sessions; in-progress runs do NOT
 * (rounds are 20 seconds — a fresh start on resume is the cleaner UX).
 */

export type Colour = "red" | "blue" | "green" | "yellow";
export const COLOURS: Colour[] = ["red", "blue", "green", "yellow"];

export const ROUND_MS = 20_000;
const MATCH_BIAS = 0.35; // chance the word and ink are the same colour

export type Prompt = {
  id: number;
  word: Colour;
  ink: Colour;
};

export type StroopStatus = "idle" | "playing" | "over";

type State = {
  prompt: Prompt | null;
  status: StroopStatus;
  score: number;
  streak: number;
  best: number;
  bestStreak: number;
  /** ms elapsed in the current round. Updated by the view's interval. */
  startedAt: number | null;
  nextId: number;
  /** Tap feedback: 'correct' | 'wrong' | null. Cleared after a short delay. */
  tapFeedback: "correct" | "wrong" | null;
  feedbackKey: number;
};

type Actions = {
  start: () => void;
  tap: (colour: Colour) => void;
  endRound: () => void;
  hydrate: () => void;
};

const STORAGE_KEY = "rrl:stroop";

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function makePrompt(prev: Prompt | null, nextId: number): Prompt {
  let word: Colour;
  do {
    word = pick(COLOURS);
  } while (prev && word === prev.word);

  const match = Math.random() < MATCH_BIAS;
  let ink: Colour;
  if (match) {
    ink = word;
  } else {
    do {
      ink = pick(COLOURS);
    } while (ink === word || (prev && ink === prev.ink));
  }
  return { id: nextId, word, ink };
}

const initial = (): State => ({
  prompt: null,
  status: "idle",
  score: 0,
  streak: 0,
  best: 0,
  bestStreak: 0,
  startedAt: null,
  nextId: 1,
  tapFeedback: null,
  feedbackKey: 0,
});

function persistBest(best: number, bestStreak: number) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ best, bestStreak }));
  } catch {
    /* storage unavailable */
  }
}

function rehydrate(): { best: number; bestStreak: number } {
  if (typeof window === "undefined") return { best: 0, bestStreak: 0 };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { best: 0, bestStreak: 0 };
    const parsed = JSON.parse(raw) as { best?: number; bestStreak?: number };
    return {
      best: typeof parsed.best === "number" ? parsed.best : 0,
      bestStreak: typeof parsed.bestStreak === "number" ? parsed.bestStreak : 0,
    };
  } catch {
    return { best: 0, bestStreak: 0 };
  }
}

export const useStroop = create<State & Actions>((set, get) => ({
  ...initial(),

  hydrate: () => {
    const { best, bestStreak } = rehydrate();
    set({ ...initial(), best, bestStreak });
  },

  start: () => {
    const s = get();
    set({
      ...s,
      prompt: makePrompt(null, s.nextId),
      status: "playing",
      score: 0,
      streak: 0,
      startedAt: Date.now(),
      nextId: s.nextId + 1,
      tapFeedback: null,
    });
  },

  tap: (colour) => {
    const s = get();
    if (s.status !== "playing" || !s.prompt) return;
    const correct = colour === s.prompt.ink;
    const score = s.score + (correct ? 1 : -1);
    const streak = correct ? s.streak + 1 : 0;
    const bestStreak = Math.max(s.bestStreak, streak);
    set({
      ...s,
      prompt: makePrompt(s.prompt, s.nextId),
      nextId: s.nextId + 1,
      score,
      streak,
      bestStreak,
      tapFeedback: correct ? "correct" : "wrong",
      feedbackKey: s.feedbackKey + 1,
    });
  },

  endRound: () => {
    const s = get();
    if (s.status !== "playing") return;
    const best = Math.max(s.best, s.score);
    set({
      ...s,
      status: "over",
      best,
      bestStreak: Math.max(s.bestStreak, s.streak),
      prompt: null,
      tapFeedback: null,
    });
    persistBest(best, Math.max(s.bestStreak, s.streak));
  },
}));
