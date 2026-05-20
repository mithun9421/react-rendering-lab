"use client";

import { create } from "zustand";
import { ACHIEVEMENTS } from "./achievements";

/**
 * Lab-wide progress + gamification, persisted in localStorage.
 *
 * Stored shape:
 *   {
 *     visits: string[]            // YYYY-MM-DD per day visited (last 90)
 *     completedLessons: { slug → epoch_ms }
 *     quizScores: { quizId → { correct, total, bestPct } }
 *     xp: number                  // cumulative
 *     unlocked: { achievementId → epoch_ms }
 *   }
 *
 * Privacy: localStorage only. Cookie banner declares this; functional storage
 * doesn't require consent.
 */

const STORAGE_KEY = "rrl:progress";
const XP_PER_LESSON = 10;
const XP_PER_QUIZ_CORRECT = 5;

export type QuizScore = { correct: number; total: number; bestPct: number };

export type ProgressState = {
  visits: string[];
  completedLessons: Record<string, number>;
  quizScores: Record<string, QuizScore>;
  xp: number;
  unlocked: Record<string, number>;
  /** Queue of recently-unlocked achievement ids waiting for a toast. */
  pendingToasts: string[];
  hydrated: boolean;

  // actions
  markLessonComplete: (slug: string) => void;
  recordQuiz: (quizId: string, correct: number, total: number) => "improved" | "same" | "first";
  pingVisit: () => void;
  resetAll: () => void;
  popToast: () => string | undefined;
};

const todayKey = (): string => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

const isYesterday = (a: string, b: string): boolean => {
  const da = new Date(a);
  const db = new Date(b);
  return Math.round((db.getTime() - da.getTime()) / 86_400_000) === 1;
};

type Persisted = Pick<
  ProgressState,
  "visits" | "completedLessons" | "quizScores" | "xp" | "unlocked"
>;

function load(): Persisted {
  if (typeof window === "undefined") {
    return { visits: [], completedLessons: {}, quizScores: {}, xp: 0, unlocked: {} };
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { visits: [], completedLessons: {}, quizScores: {}, xp: 0, unlocked: {} };
    const parsed = JSON.parse(raw);
    return {
      visits: Array.isArray(parsed.visits) ? parsed.visits.slice(-90) : [],
      completedLessons: parsed.completedLessons ?? {},
      quizScores: parsed.quizScores ?? {},
      xp: typeof parsed.xp === "number" ? parsed.xp : 0,
      unlocked: parsed.unlocked ?? {},
    };
  } catch {
    return { visits: [], completedLessons: {}, quizScores: {}, xp: 0, unlocked: {} };
  }
}

function persist(s: Persisted) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        visits: s.visits,
        completedLessons: s.completedLessons,
        quizScores: s.quizScores,
        xp: s.xp,
        unlocked: s.unlocked,
      })
    );
  } catch {
    // private mode / quota / disabled — silently ignore
  }
}

/**
 * Evaluate achievements against the given persisted state.
 * Returns the newly-unlocked IDs, XP bonus, and an updated unlocked map.
 */
function evaluateAchievementUnlocks(s: Persisted) {
  const newlyUnlocked: string[] = [];
  let xpBonus = 0;
  const updatedUnlocked = { ...s.unlocked };
  // Re-shape `s` into the wider ProgressState shape the check functions expect;
  // they only read the persisted fields anyway.
  const shaped: ProgressState = {
    ...s,
    pendingToasts: [],
    hydrated: true,
    markLessonComplete: () => {},
    recordQuiz: () => "same" as const,
    pingVisit: () => {},
    resetAll: () => {},
    popToast: () => undefined,
  };
  for (const a of ACHIEVEMENTS) {
    if (updatedUnlocked[a.id]) continue;
    if (a.check(shaped)) {
      updatedUnlocked[a.id] = Date.now();
      newlyUnlocked.push(a.id);
      xpBonus += a.xp;
    }
  }
  return { newlyUnlocked, xpBonus, updatedUnlocked };
}

export const useProgress = create<ProgressState>((set, get) => ({
  visits: [],
  completedLessons: {},
  quizScores: {},
  xp: 0,
  unlocked: {},
  pendingToasts: [],
  hydrated: false,

  markLessonComplete: (slug) => {
    const cur = get();
    if (cur.completedLessons[slug]) return;
    const interim: Persisted = {
      visits: cur.visits,
      completedLessons: { ...cur.completedLessons, [slug]: Date.now() },
      quizScores: cur.quizScores,
      xp: cur.xp + XP_PER_LESSON,
      unlocked: cur.unlocked,
    };
    const { newlyUnlocked, xpBonus, updatedUnlocked } = evaluateAchievementUnlocks(interim);
    const final: Persisted = { ...interim, xp: interim.xp + xpBonus, unlocked: updatedUnlocked };
    persist(final);
    set({
      ...cur,
      ...final,
      pendingToasts: [...cur.pendingToasts, ...newlyUnlocked],
    });
  },

  recordQuiz: (quizId, correct, total) => {
    const cur = get();
    const pct = total === 0 ? 0 : (correct / total) * 100;
    const prior = cur.quizScores[quizId];
    const isFirst = !prior;
    const improved = !isFirst && pct > prior.bestPct;
    const next: QuizScore = {
      correct: Math.max(correct, prior?.correct ?? 0),
      total,
      bestPct: Math.max(pct, prior?.bestPct ?? 0),
    };
    const newCorrect = Math.max(0, correct - (prior?.correct ?? 0));
    const interim: Persisted = {
      visits: cur.visits,
      completedLessons: cur.completedLessons,
      quizScores: { ...cur.quizScores, [quizId]: next },
      xp: cur.xp + newCorrect * XP_PER_QUIZ_CORRECT,
      unlocked: cur.unlocked,
    };
    const { newlyUnlocked, xpBonus, updatedUnlocked } = evaluateAchievementUnlocks(interim);
    const final: Persisted = { ...interim, xp: interim.xp + xpBonus, unlocked: updatedUnlocked };
    persist(final);
    set({
      ...cur,
      ...final,
      pendingToasts: [...cur.pendingToasts, ...newlyUnlocked],
    });
    return isFirst ? "first" : improved ? "improved" : "same";
  },

  pingVisit: () => {
    const cur = get();
    const today = todayKey();
    if (cur.visits[cur.visits.length - 1] === today) return;
    const interim: Persisted = {
      visits: [...cur.visits, today].slice(-90),
      completedLessons: cur.completedLessons,
      quizScores: cur.quizScores,
      xp: cur.xp,
      unlocked: cur.unlocked,
    };
    const { newlyUnlocked, xpBonus, updatedUnlocked } = evaluateAchievementUnlocks(interim);
    const final: Persisted = { ...interim, xp: interim.xp + xpBonus, unlocked: updatedUnlocked };
    persist(final);
    set({
      ...cur,
      ...final,
      pendingToasts: [...cur.pendingToasts, ...newlyUnlocked],
    });
  },

  resetAll: () => {
    const empty: Persisted = {
      visits: [],
      completedLessons: {},
      quizScores: {},
      xp: 0,
      unlocked: {},
    };
    persist(empty);
    set({ ...get(), ...empty, pendingToasts: [] });
  },

  popToast: () => {
    const { pendingToasts } = get();
    if (pendingToasts.length === 0) return undefined;
    const [head, ...rest] = pendingToasts;
    set({ pendingToasts: rest });
    return head;
  },
}));

/** Compute a streak from the visits array. Idempotent. */
export function computeStreak(visits: string[]): number {
  if (visits.length === 0) return 0;
  const today = todayKey();
  const last = visits[visits.length - 1];
  if (last !== today && !isYesterday(last, today)) return 0;
  let streak = 1;
  for (let i = visits.length - 2; i >= 0; i--) {
    if (isYesterday(visits[i], visits[i + 1])) streak++;
    else if (visits[i] !== visits[i + 1]) break;
  }
  return streak;
}

/** Compute level from raw XP. 100 XP per level. */
export function levelOf(xp: number) {
  const level = Math.floor(xp / 100) + 1;
  const into = xp % 100;
  return { level, into, toNext: 100 - into };
}

/** Hydrate the store from localStorage. Call once after mount. */
export function hydrateProgress() {
  if (typeof window === "undefined") return;
  const loaded = load();
  useProgress.setState({ ...loaded, hydrated: true });
}
