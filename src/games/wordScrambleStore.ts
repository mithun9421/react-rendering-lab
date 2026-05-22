"use client";

import { create } from "zustand";

/**
 * Word Scramble — unscramble a 5-letter word by tapping letter tiles in order.
 *
 * Mechanics:
 *   - A target word is shuffled into a pool of letter tiles, each with a
 *     stable `id` so the view can animate letters between the pool row and
 *     the answer slots.
 *   - Tapping a pool tile moves it to the next empty slot. Tapping a slot
 *     tile sends it back to the pool. When all slots are filled, the guess
 *     is checked. Correct → confetti + auto-advance to the next word.
 *     Wrong → flash + shake, then auto-clear the slots after a beat.
 *   - 'Hint' reveals one un-placed letter in its correct slot (locked).
 *
 * Persists across reloads. Tracks streak + best streak + words solved +
 * hints used.
 */

export const SLOTS = 5;

const WORDS = [
  "ANGEL",
  "APPLE",
  "BAKER",
  "BEACH",
  "BLOOM",
  "BLUSH",
  "BRAVE",
  "BUNNY",
  "CANDY",
  "CHEER",
  "CLOUD",
  "CORAL",
  "CRISP",
  "CRUSH",
  "DAISY",
  "DANCE",
  "DREAM",
  "EARTH",
  "FAIRY",
  "FANCY",
  "FLAME",
  "FLOAT",
  "FRESH",
  "FROST",
  "GIANT",
  "GLEAM",
  "GLOSS",
  "GRACE",
  "GRAPE",
  "HAPPY",
  "HONEY",
  "JELLY",
  "JOLLY",
  "JUICE",
  "LATTE",
  "LEMON",
  "LIGHT",
  "LOTUS",
  "MAPLE",
  "MELON",
  "MERRY",
  "MUSIC",
  "OCEAN",
  "PASTA",
  "PEACH",
  "PEARL",
  "PIANO",
  "POPPY",
  "PRIDE",
  "PUPPY",
  "QUEEN",
  "QUIET",
  "RIVER",
  "ROYAL",
  "SHINY",
  "SHORE",
  "SMILE",
  "SNOWY",
  "STARS",
  "STORY",
  "SUNNY",
  "SWEET",
  "SWIRL",
  "TIARA",
  "TIGER",
  "TULIP",
];

export type Letter = {
  id: number;
  ch: string;
  /** True when revealed by the hint and locked into its slot. */
  locked?: boolean;
};

type Status = "playing" | "won" | "wrong";

type State = {
  word: string;
  /** Letters still available in the pool. Order = display order. */
  pool: Letter[];
  /** Slot positions; `null` when empty. */
  slots: (Letter | null)[];
  status: Status;
  /** Hints used on the current word. */
  hintsUsed: number;
  /** Lifetime stats. */
  solved: number;
  streak: number;
  bestStreak: number;
  totalHints: number;
};

type Actions = {
  pickFromPool: (letterId: number) => void;
  pickFromSlot: (slotIdx: number) => void;
  hint: () => void;
  next: () => void;
  shuffle: () => void;
  hydrate: () => void;
};

const STORAGE_KEY = "rrl:word-scramble";

function shuffleString(s: string): string {
  const chars = s.split("");
  for (let i = chars.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }
  return chars.join("");
}

function newWord(): { word: string; pool: Letter[]; slots: (Letter | null)[] } {
  const word = WORDS[Math.floor(Math.random() * WORDS.length)];
  let scrambled = shuffleString(word);
  // Ensure scrambled actually differs from the word.
  let attempts = 0;
  while (scrambled === word && attempts < 5) {
    scrambled = shuffleString(word);
    attempts++;
  }
  const pool: Letter[] = scrambled.split("").map((ch, idx) => ({ id: idx + 1, ch }));
  return { word, pool, slots: Array.from({ length: SLOTS }, () => null) };
}

const initial = (): State => {
  const { word, pool, slots } = newWord();
  return {
    word,
    pool,
    slots,
    status: "playing",
    hintsUsed: 0,
    solved: 0,
    streak: 0,
    bestStreak: 0,
    totalHints: 0,
  };
};

function persist(s: State) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        word: s.word,
        pool: s.pool,
        slots: s.slots,
        status: s.status,
        hintsUsed: s.hintsUsed,
        solved: s.solved,
        streak: s.streak,
        bestStreak: s.bestStreak,
        totalHints: s.totalHints,
      })
    );
  } catch {
    /* storage unavailable */
  }
}

function rehydrate(): Partial<State> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Partial<State>;
    if (typeof parsed.word !== "string" || !Array.isArray(parsed.pool) || !Array.isArray(parsed.slots)) {
      return {};
    }
    return {
      word: parsed.word,
      pool: parsed.pool as Letter[],
      slots: parsed.slots as (Letter | null)[],
      status: parsed.status === "won" ? "won" : "playing",
      hintsUsed: typeof parsed.hintsUsed === "number" ? parsed.hintsUsed : 0,
      solved: typeof parsed.solved === "number" ? parsed.solved : 0,
      streak: typeof parsed.streak === "number" ? parsed.streak : 0,
      bestStreak: typeof parsed.bestStreak === "number" ? parsed.bestStreak : 0,
      totalHints: typeof parsed.totalHints === "number" ? parsed.totalHints : 0,
    };
  } catch {
    return {};
  }
}

function checkComplete(slots: (Letter | null)[], word: string): boolean | null {
  if (slots.some((s) => s === null)) return null;
  const guess = slots.map((s) => s!.ch).join("");
  return guess === word;
}

export const useWordScramble = create<State & Actions>((set, get) => ({
  ...initial(),

  hydrate: () => {
    const restored = rehydrate();
    const next: State = { ...initial(), ...restored };
    set(next);
  },

  pickFromPool: (letterId) => {
    const s = get();
    if (s.status !== "playing") return;
    const letter = s.pool.find((l) => l.id === letterId);
    if (!letter) return;
    // Find next empty slot.
    const slotIdx = s.slots.findIndex((x) => x === null);
    if (slotIdx === -1) return;
    const pool = s.pool.filter((l) => l.id !== letterId);
    const slots = s.slots.slice();
    slots[slotIdx] = letter;
    let next: State = { ...s, pool, slots };

    const result = checkComplete(slots, s.word);
    if (result === true) {
      next = {
        ...next,
        status: "won",
        solved: s.solved + 1,
        streak: s.streak + 1,
        bestStreak: Math.max(s.bestStreak, s.streak + 1),
      };
    } else if (result === false) {
      next = { ...next, status: "wrong" };
      // Auto-clear after the shake.
      set(next);
      persist(next);
      setTimeout(() => {
        const cur = get();
        // Bail if user advanced/cleared themselves.
        if (cur.status !== "wrong") return;
        const kept = cur.slots.filter((sl): sl is Letter => sl !== null && !!sl.locked);
        const returned = cur.slots.filter((sl): sl is Letter => sl !== null && !sl.locked);
        const clearedSlots: (Letter | null)[] = Array.from({ length: SLOTS }, () => null);
        // Re-place locked letters back into their slots.
        kept.forEach((letter) => {
          const correctIdx = cur.word.indexOf(letter.ch);
          // Find first matching index that's still empty.
          for (let i = 0; i < SLOTS; i++) {
            if (cur.word[i] === letter.ch && clearedSlots[i] === null) {
              clearedSlots[i] = letter;
              break;
            }
          }
          // Fallback if (somehow) we can't place it.
          if (!clearedSlots.includes(letter)) clearedSlots[correctIdx >= 0 ? correctIdx : 0] = letter;
        });
        const after: State = {
          ...cur,
          slots: clearedSlots,
          pool: [...cur.pool, ...returned],
          status: "playing",
          streak: 0,
        };
        set(after);
        persist(after);
      }, 480);
      return;
    }

    set(next);
    persist(next);
  },

  pickFromSlot: (slotIdx) => {
    const s = get();
    if (s.status === "won") return;
    const letter = s.slots[slotIdx];
    if (!letter || letter.locked) return;
    const slots = s.slots.slice();
    slots[slotIdx] = null;
    const pool = [...s.pool, letter];
    const next: State = { ...s, slots, pool, status: "playing" };
    set(next);
    persist(next);
  },

  hint: () => {
    const s = get();
    if (s.status !== "playing") return;
    // Find first slot whose correct letter isn't already placed (locked or not) in the right spot.
    for (let i = 0; i < SLOTS; i++) {
      const need = s.word[i];
      const current = s.slots[i];
      if (current && current.ch === need) continue;
      // Pull a matching letter from pool, or swap from another slot if needed.
      let donorFromPool = s.pool.find((l) => l.ch === need);
      let donorSlotIdx = -1;
      if (!donorFromPool) {
        donorSlotIdx = s.slots.findIndex((sl, j) => sl !== null && !sl.locked && sl.ch === need && j !== i);
        if (donorSlotIdx < 0) return; // no letter found
      }

      const newSlots = s.slots.slice();
      let newPool = s.pool.slice();

      // If something is in slot i and not locked, return it to the pool.
      const incumbent = newSlots[i];
      if (incumbent && !incumbent.locked) {
        newPool.push(incumbent);
        newSlots[i] = null;
      }
      // Place the donor letter (locked) into slot i.
      if (donorFromPool) {
        newPool = newPool.filter((l) => l.id !== donorFromPool!.id);
        newSlots[i] = { ...donorFromPool, locked: true };
      } else {
        const donor = newSlots[donorSlotIdx]!;
        newSlots[donorSlotIdx] = null;
        newSlots[i] = { ...donor, locked: true };
      }

      const next: State = {
        ...s,
        slots: newSlots,
        pool: newPool,
        hintsUsed: s.hintsUsed + 1,
        totalHints: s.totalHints + 1,
      };
      set(next);
      persist(next);
      // Auto-check after a hint placement could complete the word.
      const result = checkComplete(newSlots, s.word);
      if (result === true) {
        const won: State = {
          ...next,
          status: "won",
          solved: next.solved + 1,
          streak: next.streak + 1,
          bestStreak: Math.max(next.bestStreak, next.streak + 1),
        };
        set(won);
        persist(won);
      }
      return;
    }
  },

  next: () => {
    const s = get();
    const { word, pool, slots } = newWord();
    const next: State = {
      ...s,
      word,
      pool,
      slots,
      status: "playing",
      hintsUsed: 0,
    };
    set(next);
    persist(next);
  },

  shuffle: () => {
    const s = get();
    if (s.status === "won") return;
    // Re-shuffle the pool order only.
    const pool = [...s.pool];
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    const next: State = { ...s, pool };
    set(next);
    persist(next);
  },
}));
