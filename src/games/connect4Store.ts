"use client";

import { create } from "zustand";

/**
 * Connect 4 — 7 columns × 6 rows. Player drops red discs, AI drops gold.
 * AI uses depth-3 alpha-beta minimax with a four-window heuristic and a
 * center-column bias, with an immediate-win and immediate-block override
 * so it behaves sensibly without being unbeatable. Player always goes first.
 *
 * State persists in localStorage so a mid-game survives reloads.
 */

export const COLS = 7;
export const ROWS = 6;
const SIZE = COLS * ROWS;
const WIN = 4;

export type Player = 1 | 2; // 1 = human, 2 = AI
type Cell = 0 | Player;

export type Disc = {
  id: number;
  row: number;
  col: number;
  player: Player;
  /** Set when the disc participates in the winning line. */
  highlighted?: boolean;
};

type Status = "playing" | "win-p" | "win-ai" | "draw";

type State = {
  board: Cell[];
  discs: Disc[];
  turn: Player;
  status: Status;
  /** Cell indices of the 4 winning discs, if any. */
  winningCells: number[] | null;
  score: { p: number; ai: number; draws: number };
  nextId: number;
};

type Actions = {
  drop: (col: number) => void;
  restart: () => void;
  hydrate: () => void;
};

const STORAGE_KEY = "rrl:connect4";

const cellIdx = (r: number, c: number) => r * COLS + c;

function emptyBoard(): Cell[] {
  return Array.from({ length: SIZE }, () => 0);
}

function landingRow(board: Cell[], col: number): number {
  for (let r = ROWS - 1; r >= 0; r--) if (board[cellIdx(r, col)] === 0) return r;
  return -1;
}

function checkWinFrom(board: Cell[], r: number, c: number, player: Player): number[] | null {
  const dirs: [number, number][] = [
    [0, 1],
    [1, 0],
    [1, 1],
    [1, -1],
  ];
  for (const [dr, dc] of dirs) {
    const line: number[] = [cellIdx(r, c)];
    // walk forwards
    let i = 1;
    while (true) {
      const nr = r + dr * i;
      const nc = c + dc * i;
      if (nr < 0 || nr >= ROWS || nc < 0 || nc >= COLS) break;
      if (board[cellIdx(nr, nc)] !== player) break;
      line.push(cellIdx(nr, nc));
      i++;
    }
    // walk backwards
    i = 1;
    while (true) {
      const nr = r - dr * i;
      const nc = c - dc * i;
      if (nr < 0 || nr >= ROWS || nc < 0 || nc >= COLS) break;
      if (board[cellIdx(nr, nc)] !== player) break;
      line.unshift(cellIdx(nr, nc));
      i++;
    }
    if (line.length >= WIN) return line.slice(0, WIN);
  }
  return null;
}

function isFull(board: Cell[]): boolean {
  for (let c = 0; c < COLS; c++) if (board[cellIdx(0, c)] === 0) return false;
  return true;
}

function legalCols(board: Cell[]): number[] {
  const out: number[] = [];
  for (let c = 0; c < COLS; c++) if (board[cellIdx(0, c)] === 0) out.push(c);
  return out;
}

/* ───────────── AI ───────────── */

function evaluateWindow(window: Cell[], player: Player): number {
  const opp: Player = player === 1 ? 2 : 1;
  let score = 0;
  const pCount = window.filter((c) => c === player).length;
  const oCount = window.filter((c) => c === opp).length;
  const empty = window.filter((c) => c === 0).length;

  if (pCount === 4) score += 100;
  else if (pCount === 3 && empty === 1) score += 5;
  else if (pCount === 2 && empty === 2) score += 2;

  if (oCount === 3 && empty === 1) score -= 4;
  return score;
}

function evaluateBoard(board: Cell[], player: Player): number {
  let score = 0;
  // Center bias
  for (let r = 0; r < ROWS; r++) if (board[cellIdx(r, 3)] === player) score += 3;

  // Horizontal
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c <= COLS - 4; c++) {
      score += evaluateWindow(
        [board[cellIdx(r, c)], board[cellIdx(r, c + 1)], board[cellIdx(r, c + 2)], board[cellIdx(r, c + 3)]],
        player
      );
    }
  }
  // Vertical
  for (let c = 0; c < COLS; c++) {
    for (let r = 0; r <= ROWS - 4; r++) {
      score += evaluateWindow(
        [board[cellIdx(r, c)], board[cellIdx(r + 1, c)], board[cellIdx(r + 2, c)], board[cellIdx(r + 3, c)]],
        player
      );
    }
  }
  // Diagonals \
  for (let r = 0; r <= ROWS - 4; r++) {
    for (let c = 0; c <= COLS - 4; c++) {
      score += evaluateWindow(
        [
          board[cellIdx(r, c)],
          board[cellIdx(r + 1, c + 1)],
          board[cellIdx(r + 2, c + 2)],
          board[cellIdx(r + 3, c + 3)],
        ],
        player
      );
    }
  }
  // Diagonals /
  for (let r = 3; r < ROWS; r++) {
    for (let c = 0; c <= COLS - 4; c++) {
      score += evaluateWindow(
        [
          board[cellIdx(r, c)],
          board[cellIdx(r - 1, c + 1)],
          board[cellIdx(r - 2, c + 2)],
          board[cellIdx(r - 3, c + 3)],
        ],
        player
      );
    }
  }
  return score;
}

function isTerminal(board: Cell[]): { done: boolean; winner: Player | null } {
  // Check any 4-in-a-row by scanning cells.
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const v = board[cellIdx(r, c)];
      if (v === 0) continue;
      if (checkWinFrom(board, r, c, v)) return { done: true, winner: v };
    }
  }
  if (isFull(board)) return { done: true, winner: null };
  return { done: false, winner: null };
}

function minimax(
  board: Cell[],
  depth: number,
  alpha: number,
  beta: number,
  maximizing: boolean
): { score: number; col: number | null } {
  const term = isTerminal(board);
  if (term.done) {
    if (term.winner === 2) return { score: 1_000_000, col: null };
    if (term.winner === 1) return { score: -1_000_000, col: null };
    return { score: 0, col: null };
  }
  if (depth === 0) return { score: evaluateBoard(board, 2), col: null };

  const cols = legalCols(board).sort((a, b) => Math.abs(3 - a) - Math.abs(3 - b)); // try centre first
  let bestCol = cols[0];

  if (maximizing) {
    let value = -Infinity;
    for (const c of cols) {
      const r = landingRow(board, c);
      const next = board.slice();
      next[cellIdx(r, c)] = 2;
      const { score } = minimax(next, depth - 1, alpha, beta, false);
      if (score > value) {
        value = score;
        bestCol = c;
      }
      alpha = Math.max(alpha, value);
      if (alpha >= beta) break;
    }
    return { score: value, col: bestCol };
  } else {
    let value = Infinity;
    for (const c of cols) {
      const r = landingRow(board, c);
      const next = board.slice();
      next[cellIdx(r, c)] = 1;
      const { score } = minimax(next, depth - 1, alpha, beta, true);
      if (score < value) {
        value = score;
        bestCol = c;
      }
      beta = Math.min(beta, value);
      if (alpha >= beta) break;
    }
    return { score: value, col: bestCol };
  }
}

function pickAiCol(board: Cell[]): number {
  const cols = legalCols(board);
  if (cols.length === 0) return -1;

  // 1. Immediate win.
  for (const c of cols) {
    const r = landingRow(board, c);
    const next = board.slice();
    next[cellIdx(r, c)] = 2;
    if (checkWinFrom(next, r, c, 2)) return c;
  }
  // 2. Block immediate threat.
  for (const c of cols) {
    const r = landingRow(board, c);
    const next = board.slice();
    next[cellIdx(r, c)] = 1;
    if (checkWinFrom(next, r, c, 1)) return c;
  }
  // 3. Minimax depth 2 (~5ms typical, never blocks the frame).
  const { col } = minimax(board, 2, -Infinity, Infinity, true);
  return col ?? cols[Math.floor(Math.random() * cols.length)];
}

/* ───────────── persistence ───────────── */

const initial = (): State => ({
  board: emptyBoard(),
  discs: [],
  turn: 1,
  status: "playing",
  winningCells: null,
  score: { p: 0, ai: 0, draws: 0 },
  nextId: 1,
});

function persist(s: State) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        board: s.board,
        discs: s.discs.map((d) => ({ id: d.id, row: d.row, col: d.col, player: d.player })),
        turn: s.turn,
        status: s.status,
        winningCells: s.winningCells,
        score: s.score,
        nextId: s.nextId,
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
    if (!Array.isArray(parsed.board) || parsed.board.length !== SIZE) return {};
    return {
      board: parsed.board as Cell[],
      discs: Array.isArray(parsed.discs) ? (parsed.discs as Disc[]) : [],
      turn: parsed.turn === 2 ? 2 : 1,
      status: (["playing", "win-p", "win-ai", "draw"] as Status[]).includes(parsed.status as Status)
        ? (parsed.status as Status)
        : "playing",
      winningCells: Array.isArray(parsed.winningCells) ? parsed.winningCells : null,
      score: parsed.score ?? { p: 0, ai: 0, draws: 0 },
      nextId: typeof parsed.nextId === "number" ? parsed.nextId : 1,
    };
  } catch {
    return {};
  }
}

/* ───────────── store ───────────── */

export const useConnect4 = create<State & Actions>((set, get) => ({
  ...initial(),

  hydrate: () => {
    const restored = rehydrate();
    const next: State = { ...initial(), ...restored };
    // Mark winning discs so the resumed game shows the highlight.
    if (next.winningCells) {
      const winSet = new Set(next.winningCells);
      next.discs = next.discs.map((d) =>
        winSet.has(cellIdx(d.row, d.col)) ? { ...d, highlighted: true } : d
      );
    }
    set(next);
  },

  drop: (col) => {
    const s = get();
    if (s.status !== "playing") return;
    if (s.turn !== 1) return;
    if (s.board[cellIdx(0, col)] !== 0) return; // column full

    const row = landingRow(s.board, col);
    if (row < 0) return;

    const board = s.board.slice();
    board[cellIdx(row, col)] = 1;
    const id = s.nextId;
    const disc: Disc = { id, row, col, player: 1 };

    const winLine = checkWinFrom(board, row, col, 1);
    if (winLine) {
      const winSet = new Set(winLine);
      const discs = [
        ...s.discs.map((d) => (winSet.has(cellIdx(d.row, d.col)) ? { ...d, highlighted: true } : d)),
        { ...disc, highlighted: true },
      ];
      const next: State = {
        ...s,
        board,
        discs,
        turn: 2,
        status: "win-p",
        winningCells: winLine,
        score: { ...s.score, p: s.score.p + 1 },
        nextId: s.nextId + 1,
      };
      set(next);
      persist(next);
      return;
    }

    if (isFull(board)) {
      const next: State = {
        ...s,
        board,
        discs: [...s.discs, disc],
        turn: 2,
        status: "draw",
        score: { ...s.score, draws: s.score.draws + 1 },
        nextId: s.nextId + 1,
      };
      set(next);
      persist(next);
      return;
    }

    // Hand to AI.
    set({
      ...s,
      board,
      discs: [...s.discs, disc],
      turn: 2,
      nextId: s.nextId + 1,
    });

    setTimeout(() => {
      const cur = get();
      // Bail if state changed (restart, etc).
      if (cur.turn !== 2 || cur.status !== "playing") return;
      const aiCol = pickAiCol(cur.board);
      if (aiCol < 0) return;
      const aiRow = landingRow(cur.board, aiCol);
      const aiBoard = cur.board.slice();
      aiBoard[cellIdx(aiRow, aiCol)] = 2;
      const aiId = cur.nextId;
      const aiDisc: Disc = { id: aiId, row: aiRow, col: aiCol, player: 2 };

      const aiWin = checkWinFrom(aiBoard, aiRow, aiCol, 2);
      if (aiWin) {
        const winSet = new Set(aiWin);
        const discs = [
          ...cur.discs.map((d) =>
            winSet.has(cellIdx(d.row, d.col)) ? { ...d, highlighted: true } : d
          ),
          { ...aiDisc, highlighted: true },
        ];
        const next: State = {
          ...cur,
          board: aiBoard,
          discs,
          turn: 1,
          status: "win-ai",
          winningCells: aiWin,
          score: { ...cur.score, ai: cur.score.ai + 1 },
          nextId: cur.nextId + 1,
        };
        set(next);
        persist(next);
        return;
      }
      if (isFull(aiBoard)) {
        const next: State = {
          ...cur,
          board: aiBoard,
          discs: [...cur.discs, aiDisc],
          turn: 1,
          status: "draw",
          score: { ...cur.score, draws: cur.score.draws + 1 },
          nextId: cur.nextId + 1,
        };
        set(next);
        persist(next);
        return;
      }
      const next: State = {
        ...cur,
        board: aiBoard,
        discs: [...cur.discs, aiDisc],
        turn: 1,
        nextId: cur.nextId + 1,
      };
      set(next);
      persist(next);
    }, 480);
  },

  restart: () => {
    const s = get();
    const next: State = {
      ...initial(),
      score: s.score,
    };
    set(next);
    persist(next);
  },
}));
