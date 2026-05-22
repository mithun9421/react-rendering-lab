"use client";

import { create } from "zustand";

/**
 * Memory Match (Concentration).
 *
 * 4x4 board → 16 cards = 8 emoji pairs. Flip two cards at a time; matches
 * stay face-up, mismatches flip back after ~700ms. Game completes when all
 * pairs are matched. Track moves, best (lowest moves), and current streak
 * of consecutive matches without a miss.
 *
 * State persists in localStorage so the user can minimize mid-game and
 * resume from the floating pill.
 */

export type Card = {
  id: number;
  /** The pair this card belongs to. Two cards share the same `pairId`. */
  pairId: number;
  symbol: string;
  /** 'hidden' face down, 'flipped' currently revealed, 'matched' permanently up. */
  state: "hidden" | "flipped" | "matched";
};

type GameStatus = "playing" | "won";

type State = {
  cards: Card[];
  /** Indices into `cards` that are currently flipped face-up (not matched). */
  selection: number[];
  moves: number;
  matches: number;
  /** Consecutive matches since the last mismatch. */
  streak: number;
  bestStreak: number;
  /** Lowest moves count for a completed game. 0 = no record yet. */
  bestMoves: number;
  status: GameStatus;
  /** True briefly while a non-match is being shown before the auto-flip-back. */
  locked: boolean;
};

type Actions = {
  flip: (idx: number) => void;
  restart: () => void;
  hydrate: () => void;
};

const STORAGE_KEY = "rrl:memory";
const PAIRS = 8;

const EMOJI_BANK = [
  "🌸", "🍓", "🌻", "🍄", "🍑", "🍋", "🐝", "🦋",
  "🌈", "⭐", "🌙", "🍀", "🐬", "🦄", "🐢", "🍉",
];

function shuffle<T>(arr: T[]): T[] {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

function fresh(): Card[] {
  const symbols = shuffle(EMOJI_BANK).slice(0, PAIRS);
  const deck: Card[] = [];
  symbols.forEach((symbol, pairId) => {
    deck.push({ id: pairId * 2, pairId, symbol, state: "hidden" });
    deck.push({ id: pairId * 2 + 1, pairId, symbol, state: "hidden" });
  });
  return shuffle(deck);
}

const initial = (): State => ({
  cards: fresh(),
  selection: [],
  moves: 0,
  matches: 0,
  streak: 0,
  bestStreak: 0,
  bestMoves: 0,
  status: "playing",
  locked: false,
});

function persist(s: State) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        cards: s.cards.map((c) => ({ id: c.id, pairId: c.pairId, symbol: c.symbol, state: c.state })),
        selection: s.selection,
        moves: s.moves,
        matches: s.matches,
        streak: s.streak,
        bestStreak: s.bestStreak,
        bestMoves: s.bestMoves,
        status: s.status,
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
    if (!Array.isArray(parsed.cards) || parsed.cards.length !== PAIRS * 2) return {};
    return {
      cards: parsed.cards as Card[],
      selection: Array.isArray(parsed.selection) ? parsed.selection.filter((n): n is number => typeof n === "number") : [],
      moves: typeof parsed.moves === "number" ? parsed.moves : 0,
      matches: typeof parsed.matches === "number" ? parsed.matches : 0,
      streak: typeof parsed.streak === "number" ? parsed.streak : 0,
      bestStreak: typeof parsed.bestStreak === "number" ? parsed.bestStreak : 0,
      bestMoves: typeof parsed.bestMoves === "number" ? parsed.bestMoves : 0,
      status: parsed.status === "won" ? "won" : "playing",
    };
  } catch {
    return {};
  }
}

export const useMemoryGame = create<State & Actions>((set, get) => ({
  ...initial(),

  hydrate: () => {
    const restored = rehydrate();
    // Whenever we hydrate, ensure any cards that were mid-flip when persisted
    // are reset to hidden so the resumed game is in a clean state.
    const next: State = { ...initial(), ...restored };
    next.locked = false;
    next.selection = [];
    next.cards = next.cards.map((c) => (c.state === "flipped" ? { ...c, state: "hidden" } : c));
    set(next);
  },

  flip: (idx) => {
    const s = get();
    if (s.locked) return;
    if (s.status === "won") return;
    const card = s.cards[idx];
    if (!card || card.state !== "hidden") return;

    const cards = s.cards.map((c, i) => (i === idx ? { ...c, state: "flipped" as const } : c));
    const selection = [...s.selection, idx];

    if (selection.length < 2) {
      const next: State = { ...s, cards, selection };
      set(next);
      persist(next);
      return;
    }

    // Two cards face-up — resolve.
    const [a, b] = selection;
    const cardA = cards[a];
    const cardB = cards[b];
    const moves = s.moves + 1;

    if (cardA.pairId === cardB.pairId) {
      const matchedCards = cards.map((c, i) =>
        i === a || i === b ? { ...c, state: "matched" as const } : c
      );
      const matches = s.matches + 1;
      const streak = s.streak + 1;
      const bestStreak = Math.max(s.bestStreak, streak);
      const won = matches === PAIRS;
      const bestMoves =
        won && (s.bestMoves === 0 || moves < s.bestMoves) ? moves : s.bestMoves;
      const next: State = {
        ...s,
        cards: matchedCards,
        selection: [],
        moves,
        matches,
        streak,
        bestStreak,
        bestMoves,
        status: won ? "won" : "playing",
      };
      set(next);
      persist(next);
    } else {
      // Mismatch — show briefly, then flip back.
      const next: State = { ...s, cards, selection, moves, streak: 0, locked: true };
      set(next);
      persist(next);
      setTimeout(() => {
        const cur = get();
        // If user restarted or matched something else, skip.
        if (!cur.locked) return;
        const reset = cur.cards.map((c, i) =>
          i === a || i === b ? { ...c, state: "hidden" as const } : c
        );
        const after: State = { ...cur, cards: reset, selection: [], locked: false };
        set(after);
        persist(after);
      }, 720);
    }
  },

  restart: () => {
    const s = get();
    const next: State = {
      ...initial(),
      // Preserve records.
      bestStreak: s.bestStreak,
      bestMoves: s.bestMoves,
    };
    set(next);
    persist(next);
  },
}));

export { PAIRS };
