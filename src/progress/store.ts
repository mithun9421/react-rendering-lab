"use client";

import { create } from "zustand";

/**
 * Lab-wide progress + gamification, persisted in localStorage.
 *
 * One store, four observable shapes:
 *   - completedLessons: which lesson slugs the user finished (scroll-to-bottom)
 *   - quizScores:       per-quiz best result (correct / total)
 *   - xp:               sum of points awarded across lessons + quizzes
 *   - streak:           consecutive days the user opened the lab
 *
 * Privacy: persisted to localStorage only. Wiped by clearing browser data.
 * Cookie banner declares this; consent isn't required for functional storage.
 */

const STORAGE_KEY = "rrl:progress";
const XP_PER_LESSON = 10;
const XP_PER_QUIZ_CORRECT = 5;

export type QuizScore = { correct: number; total: number; bestPct: number };

export type ProgressState = {
  /** ISO date strings (YYYY-MM-DD), one per day the lab was opened. */
  visits: string[];
  completedLessons: Record<string, number>; // slug → epoch ms completed
  quizScores: Record<string, QuizScore>; // quizId → best score
  xp: number;
  /** Hydrated marks this true once we've read localStorage so SSR doesn't show stale "0 XP". */
  hydrated: boolean;

  // actions
  markLessonComplete: (slug: string) => void;
  recordQuiz: (quizId: string, correct: number, total: number) => "improved" | "same" | "first";
  pingVisit: () => void;
  resetAll: () => void;
};

const todayKey = (): string => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

const isYesterday = (a: string, b: string): boolean => {
  // a vs b — is a the day immediately before b?
  const da = new Date(a);
  const db = new Date(b);
  return Math.round((db.getTime() - da.getTime()) / 86_400_000) === 1;
};

function load(): Pick<ProgressState, "visits" | "completedLessons" | "quizScores" | "xp"> {
  if (typeof window === "undefined") {
    return { visits: [], completedLessons: {}, quizScores: {}, xp: 0 };
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { visits: [], completedLessons: {}, quizScores: {}, xp: 0 };
    const parsed = JSON.parse(raw);
    return {
      visits: Array.isArray(parsed.visits) ? parsed.visits.slice(-90) : [], // keep last 90 days
      completedLessons: parsed.completedLessons ?? {},
      quizScores: parsed.quizScores ?? {},
      xp: typeof parsed.xp === "number" ? parsed.xp : 0,
    };
  } catch {
    return { visits: [], completedLessons: {}, quizScores: {}, xp: 0 };
  }
}

function persist(s: Pick<ProgressState, "visits" | "completedLessons" | "quizScores" | "xp">) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        visits: s.visits,
        completedLessons: s.completedLessons,
        quizScores: s.quizScores,
        xp: s.xp,
      })
    );
  } catch {
    // private mode / quota / disabled — silently ignore
  }
}

export const useProgress = create<ProgressState>((set, get) => ({
  visits: [],
  completedLessons: {},
  quizScores: {},
  xp: 0,
  hydrated: false,

  markLessonComplete: (slug) => {
    const { completedLessons, xp } = get();
    if (completedLessons[slug]) return; // already completed, no double-award
    const next = {
      ...get(),
      completedLessons: { ...completedLessons, [slug]: Date.now() },
      xp: xp + XP_PER_LESSON,
    };
    persist(next);
    set(next);
  },

  recordQuiz: (quizId, correct, total) => {
    const pct = total === 0 ? 0 : (correct / total) * 100;
    const { quizScores, xp } = get();
    const prior = quizScores[quizId];
    const isFirst = !prior;
    const improved = !isFirst && pct > prior.bestPct;
    const next: QuizScore = {
      correct: Math.max(correct, prior?.correct ?? 0),
      total,
      bestPct: Math.max(pct, prior?.bestPct ?? 0),
    };
    // Award XP only for correct picks beyond what they had before
    const newCorrect = Math.max(0, correct - (prior?.correct ?? 0));
    const newState = {
      ...get(),
      quizScores: { ...quizScores, [quizId]: next },
      xp: xp + newCorrect * XP_PER_QUIZ_CORRECT,
    };
    persist(newState);
    set(newState);
    return isFirst ? "first" : improved ? "improved" : "same";
  },

  pingVisit: () => {
    const today = todayKey();
    const { visits } = get();
    if (visits[visits.length - 1] === today) return; // already pinged today
    const next = { ...get(), visits: [...visits, today].slice(-90) };
    persist(next);
    set(next);
  },

  resetAll: () => {
    const empty = { visits: [], completedLessons: {}, quizScores: {}, xp: 0 };
    persist(empty);
    set({ ...get(), ...empty });
  },
}));

/** Compute a streak from the visits array. Idempotent — call any time. */
export function computeStreak(visits: string[]): number {
  if (visits.length === 0) return 0;
  const today = todayKey();
  const last = visits[visits.length - 1];
  // Streak only counts if today or yesterday was the last visit
  if (last !== today && !isYesterday(last, today)) return 0;
  let streak = 1;
  for (let i = visits.length - 2; i >= 0; i--) {
    if (isYesterday(visits[i], visits[i + 1])) streak++;
    else if (visits[i] !== visits[i + 1]) break;
  }
  return streak;
}

/** Compute level + level progress from raw XP. 100 XP per level. */
export function levelOf(xp: number) {
  const level = Math.floor(xp / 100) + 1;
  const into = xp % 100;
  return { level, into, toNext: 100 - into };
}

/** Hydrate on the client; safe to call anywhere — useEffect-friendly. */
export function hydrateProgress() {
  if (typeof window === "undefined") return;
  const loaded = load();
  useProgress.setState({ ...loaded, hydrated: true });
}
