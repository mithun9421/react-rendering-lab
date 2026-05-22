"use client";

import { create } from "zustand";

/**
 * Boredom-buster Tic-Tac-Toe. State persists across navigations and reloads
 * in localStorage so the user can minimize mid-game, read the lesson, then
 * resume. AI opponent (`O`) — human is `X`.
 */

export type Cell = "X" | "O" | null;
export type GameStatus = "playing" | "win-x" | "win-o" | "draw";
export type UiState = "hidden" | "open" | "pill";

type Score = { x: number; o: number; draws: number };

type State = {
  board: Cell[];
  turn: "X" | "O";
  status: GameStatus;
  winLine: number[] | null;
  ui: UiState;
  score: Score;
  /** True once the user has chosen to dismiss for the whole session. */
  hushed: boolean;
};

type Actions = {
  play: (idx: number) => void;
  restart: () => void;
  setUi: (ui: UiState) => void;
  hush: () => void;
  unhush: () => void;
  hydrate: () => void;
};

const STORAGE_KEY = "rrl:tictactoe";
const empty = (): Cell[] => Array(9).fill(null);
const initialScore = (): Score => ({ x: 0, o: 0, draws: 0 });

const initial: State = {
  board: empty(),
  turn: "X",
  status: "playing",
  winLine: null,
  ui: "hidden",
  score: initialScore(),
  hushed: false,
};

const WIN_LINES: [number, number, number][] = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8],
  [0, 3, 6], [1, 4, 7], [2, 5, 8],
  [0, 4, 8], [2, 4, 6],
];

function evaluate(board: Cell[]): { status: GameStatus; line: number[] | null } {
  for (const line of WIN_LINES) {
    const [a, b, c] = line;
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return { status: board[a] === "X" ? "win-x" : "win-o", line: [...line] };
    }
  }
  if (board.every((c) => c !== null)) return { status: "draw", line: null };
  return { status: "playing", line: null };
}

/** Slightly fallible AI — picks a winning move, blocks the player's threat,
 *  otherwise takes center, corner, or a random open cell. Adds a small chance
 *  to skip the optimal move so the game is winnable. */
function pickAiMove(board: Cell[]): number {
  const open = board.map((v, i) => (v ? -1 : i)).filter((i) => i >= 0);
  if (open.length === 0) return -1;

  // 1. Take a winning move.
  for (const i of open) {
    const next = [...board];
    next[i] = "O";
    if (evaluate(next).status === "win-o") return i;
  }
  // 2. Block player from winning — with 18% chance of missing it (cute).
  if (Math.random() > 0.18) {
    for (const i of open) {
      const next = [...board];
      next[i] = "X";
      if (evaluate(next).status === "win-x") return i;
    }
  }
  // 3. Center.
  if (open.includes(4)) return 4;
  // 4. A corner.
  const corners = [0, 2, 6, 8].filter((i) => open.includes(i));
  if (corners.length) return corners[Math.floor(Math.random() * corners.length)];
  // 5. Random open.
  return open[Math.floor(Math.random() * open.length)];
}

function persist(state: State) {
  if (typeof window === "undefined") return;
  try {
    const { ui: _ui, ...persisted } = state;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(persisted));
  } catch {
    // localStorage may throw in private mode — non-fatal.
  }
}

function hydrate(): Partial<State> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Partial<State>;
    return {
      board: Array.isArray(parsed.board) && parsed.board.length === 9 ? (parsed.board as Cell[]) : empty(),
      turn: parsed.turn === "O" ? "O" : "X",
      status: parsed.status ?? "playing",
      winLine: parsed.winLine ?? null,
      score: parsed.score ?? initialScore(),
      hushed: !!parsed.hushed,
    };
  } catch {
    return {};
  }
}

export const useTicTacToe = create<State & Actions>((set, get) => ({
  ...initial,

  hydrate: () => {
    const next = { ...initial, ...hydrate() };
    set(next);
  },

  play: (idx) => {
    const s = get();
    if (s.status !== "playing") return;
    if (s.board[idx]) return;
    if (s.turn !== "X") return;

    const next = [...s.board];
    next[idx] = "X";
    const after = evaluate(next);
    if (after.status !== "playing") {
      const score = bumpScore(s.score, after.status);
      const newState = { ...s, board: next, turn: "X" as const, status: after.status, winLine: after.line, score };
      set(newState);
      persist(newState);
      return;
    }
    // Hand to AI — schedule on a microtask so the X reveal animates first.
    set({ board: next, turn: "O" });
    setTimeout(() => {
      const cur = get();
      // User might have restarted or minimized in the meantime; only act if still O's turn.
      if (cur.turn !== "O" || cur.status !== "playing") return;
      const aiIdx = pickAiMove(cur.board);
      if (aiIdx < 0) return;
      const board = [...cur.board];
      board[aiIdx] = "O";
      const result = evaluate(board);
      const score = result.status !== "playing" ? bumpScore(cur.score, result.status) : cur.score;
      const newState = {
        ...cur,
        board,
        turn: "X" as const,
        status: result.status,
        winLine: result.line,
        score,
      };
      set(newState);
      persist(newState);
    }, 480);
  },

  restart: () => {
    const s = get();
    const newState = { ...s, board: empty(), turn: "X" as const, status: "playing" as const, winLine: null };
    set(newState);
    persist(newState);
  },

  setUi: (ui) => set({ ui }),
  hush: () => {
    const s = get();
    const next = { ...s, hushed: true };
    set(next);
    persist(next);
  },
  unhush: () => {
    const s = get();
    const next = { ...s, hushed: false };
    set(next);
    persist(next);
  },
}));

function bumpScore(prev: Score, status: GameStatus): Score {
  if (status === "win-x") return { ...prev, x: prev.x + 1 };
  if (status === "win-o") return { ...prev, o: prev.o + 1 };
  if (status === "draw") return { ...prev, draws: prev.draws + 1 };
  return prev;
}
