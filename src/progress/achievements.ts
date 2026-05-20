/**
 * Achievement catalogue + evaluator.
 *
 * Each achievement is a pure function `check(progress) → boolean`. The evaluator
 * runs on every progress-store mutation and records first-unlock timestamp into
 * the same localStorage entry (`rrl:progress.unlocked`).
 *
 * Design rules:
 *  - Each achievement names a CONCRETE behaviour the learner did. No abstract
 *    "explorer" / "master" badge soup.
 *  - Tiers (Bronze/Silver/Gold) for time-based or count-based progress.
 *  - One-shot achievements (no level, no repeat).
 *  - The lock-state UX is never shameful — locked badges are slightly dimmed
 *    with the criteria visible. The unlock toast is celebratory.
 */

import type { ProgressState } from "./store";

export type AchievementTier = "bronze" | "silver" | "gold" | "single";

export type Achievement = {
  id: string;
  tier: AchievementTier;
  title: string;
  /** Short description of the criterion. */
  criterion: string;
  /** XP awarded on unlock. */
  xp: number;
  /** Evaluator — return true if the user has satisfied the criterion at this point. */
  check: (p: ProgressState) => boolean;
  /** Optional emoji-ish symbol for the badge. */
  symbol?: string;
};

const lessonsCompleted = (p: ProgressState) => Object.keys(p.completedLessons).length;
const quizzesTaken = (p: ProgressState) => Object.keys(p.quizScores).length;
const quizzesPerfect = (p: ProgressState) =>
  Object.values(p.quizScores).filter((s) => s.bestPct === 100).length;
const visitCount = (p: ProgressState) => p.visits.length;

export const ACHIEVEMENTS: Achievement[] = [
  // ── Lesson completion tiers ───────────────────────────────
  // Research note: cosmetic "first login" badges are seen as cringe by senior devs.
  // We only ship achievements that signal real competence or sustained behaviour.
  {
    id: "lessons-10",
    tier: "bronze",
    title: "Getting going",
    criterion: "Complete 10 lessons",
    xp: 30,
    symbol: "❶",
    check: (p) => lessonsCompleted(p) >= 10,
  },
  {
    id: "lessons-25",
    tier: "silver",
    title: "Working it",
    criterion: "Complete 25 lessons",
    xp: 60,
    symbol: "❷",
    check: (p) => lessonsCompleted(p) >= 25,
  },
  {
    id: "lessons-36",
    tier: "gold",
    title: "Architect of arc",
    criterion: "Complete all 36 lessons (Foundations + Core)",
    xp: 150,
    symbol: "❸",
    check: (p) => lessonsCompleted(p) >= 36,
  },

  // ── Streak tiers ──────────────────────────────────────────
  {
    id: "streak-3",
    tier: "bronze",
    title: "Three in a row",
    criterion: "3-day streak",
    xp: 15,
    symbol: "🜨",
    check: (p) => visitCount(p) >= 3,
  },
  {
    id: "streak-7",
    tier: "silver",
    title: "Full week",
    criterion: "7-day streak",
    xp: 40,
    symbol: "🜨",
    check: (p) => visitCount(p) >= 7,
  },
  {
    id: "streak-30",
    tier: "gold",
    title: "Habit formed",
    criterion: "30-day streak",
    xp: 200,
    symbol: "🜨",
    check: (p) => visitCount(p) >= 30,
  },

  // ── Quiz mastery ──────────────────────────────────────────
  {
    id: "quizzes-10",
    tier: "bronze",
    title: "Quiz adept",
    criterion: "Answer 10 knowledge checks",
    xp: 25,
    symbol: "✦",
    check: (p) => quizzesTaken(p) >= 10,
  },
  {
    id: "perfect-5",
    tier: "silver",
    title: "Marksman",
    criterion: "Score 100% on 5 different quizzes",
    xp: 50,
    symbol: "✦",
    check: (p) => quizzesPerfect(p) >= 5,
  },
  {
    id: "perfect-15",
    tier: "gold",
    title: "Sniper",
    criterion: "Score 100% on 15 different quizzes",
    xp: 150,
    symbol: "✦",
    check: (p) => quizzesPerfect(p) >= 15,
  },

  // ── Track-specific ────────────────────────────────────────
  {
    id: "foundations-done",
    tier: "single",
    title: "Foundations laid",
    criterion: "Complete all 11 Foundations",
    xp: 80,
    symbol: "⬢",
    check: (p) => {
      const fSlugs = [
        "f01-components",
        "f02-props",
        "f03-state",
        "f04-effects",
        "f05-events",
        "f06-rendering",
        "f07-forms",
        "f08-refs",
        "f09-context",
        "f10-custom-hooks",
        "f11-rules",
      ];
      return fSlugs.every((s) => p.completedLessons[s]);
    },
  },
  {
    id: "rendering-master",
    tier: "single",
    title: "Renderer's notebook",
    criterion: "Complete the React internals chain (M01-M05)",
    xp: 60,
    symbol: "⬢",
    check: (p) => {
      const m = [
        "01-reconciliation",
        "02-diffing",
        "03-fiber",
        "04-concurrent",
        "05-time-slicing",
      ];
      return m.every((s) => p.completedLessons[s]);
    },
  },
  {
    id: "ssr-arc",
    tier: "single",
    title: "Past the byte stream",
    criterion: "Complete the SSR + RSC chain (M06-M15)",
    xp: 100,
    symbol: "⬢",
    check: (p) => {
      const m = [
        "06-hydration",
        "07-streaming-ssr",
        "08-suspense",
        "09-islands",
        "10-virtualization",
        "11-react-compiler",
        "12-server-components",
        "13-server-actions",
        "14-use-hook",
        "15-partial-prerendering",
      ];
      return m.every((s) => p.completedLessons[s]);
    },
  },
  {
    id: "incident-veteran",
    tier: "single",
    title: "On-call ready",
    criterion: "Reach the Incident Simulator and complete it",
    xp: 80,
    symbol: "⬢",
    check: (p) => Boolean(p.completedLessons["25-incident-simulator"]),
  },
  {
    id: "interview-ready",
    tier: "single",
    title: "Interview-ready",
    criterion: "Answer 25 interview-bank questions correctly",
    xp: 75,
    symbol: "▶",
    // Interview questions are recorded with id pattern "q-…"; correct ones have bestPct === 100
    check: (p) =>
      Object.entries(p.quizScores).filter(([id, s]) => id.startsWith("q-") && s.bestPct === 100)
        .length >= 25,
  },
];

/** Compute which achievements should be unlocked at the current progress state. */
export function evaluate(progress: ProgressState): string[] {
  return ACHIEVEMENTS.filter((a) => a.check(progress)).map((a) => a.id);
}

export function findAchievement(id: string): Achievement | undefined {
  return ACHIEVEMENTS.find((a) => a.id === id);
}
