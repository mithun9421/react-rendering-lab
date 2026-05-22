"use client";

import { create } from "zustand";

/**
 * Mini Minesweeper — 6x6 board with 7 mines.
 *
 * Classic-safe first click: mines are placed only after the user's first
 * reveal, guaranteeing the opening cell (and its neighbours, when room
 * permits) is mine-free. Cascade reveal from 0-cells via BFS, with each
 * cell carrying a `revealOrder` so the view can stagger entrance animations.
 *
 * Tracks elapsed time, flag count, best time (won games only). Persists in
 * localStorage so a paused game resumes when the pill is opened.
 */

export const COLS = 6;
export const ROWS = 6;
export const MINES = 7;

export type Cell = {
  id: number;
  mine: boolean;
  adjacent: number;
  state: "hidden" | "revealed" | "flagged";
  /** Set during cascade reveals; drives the staggered open animation. */
  revealOrder?: number;
  /** Marker for the mine the player clicked when losing — drawn explosively. */
  exploded?: boolean;
};

type Status = "idle" | "playing" | "won" | "over";

type State = {
  grid: Cell[];
  status: Status;
  flagCount: number;
  startedAt: number | null;
  endedAt: number | null;
  bestMs: number;
  /** Mobile-friendly flag toggle. When on, taps drop a flag instead of revealing. */
  flagMode: boolean;
};

type Actions = {
  reveal: (idx: number) => void;
  toggleFlag: (idx: number) => void;
  setFlagMode: (on: boolean) => void;
  restart: () => void;
  hydrate: () => void;
};

const STORAGE_KEY = "rrl:minesweeper";

function emptyGrid(): Cell[] {
  return Array.from({ length: COLS * ROWS }, (_, id) => ({
    id,
    mine: false,
    adjacent: 0,
    state: "hidden" as const,
  }));
}

const initial = (): State => ({
  grid: emptyGrid(),
  status: "idle",
  flagCount: 0,
  startedAt: null,
  endedAt: null,
  bestMs: 0,
  flagMode: false,
});

function idx(row: number, col: number): number {
  return row * COLS + col;
}

function neighbors(i: number): number[] {
  const r = Math.floor(i / COLS);
  const c = i % COLS;
  const out: number[] = [];
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      if (dr === 0 && dc === 0) continue;
      const nr = r + dr;
      const nc = c + dc;
      if (nr < 0 || nr >= ROWS || nc < 0 || nc >= COLS) continue;
      out.push(idx(nr, nc));
    }
  }
  return out;
}

/** Place MINES randomly, avoiding `safe` cells. Returns a new grid with
 *  `mine` and `adjacent` fields populated. */
function placeMines(grid: Cell[], safe: Set<number>): Cell[] {
  const banned = new Set(safe);
  const candidates: number[] = [];
  for (let i = 0; i < grid.length; i++) if (!banned.has(i)) candidates.push(i);
  // Shuffle candidates
  for (let i = candidates.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [candidates[i], candidates[j]] = [candidates[j], candidates[i]];
  }
  const mineSet = new Set(candidates.slice(0, MINES));
  const out: Cell[] = grid.map((c) => ({ ...c, mine: mineSet.has(c.id) }));
  for (const c of out) {
    if (c.mine) continue;
    c.adjacent = neighbors(c.id).reduce((n, nb) => n + (out[nb].mine ? 1 : 0), 0);
  }
  return out;
}

/** BFS reveal from `start`. Mutates copies, returns a new grid. */
function cascade(grid: Cell[], start: number): Cell[] {
  const out = grid.map((c) => ({ ...c }));
  const queue: number[] = [start];
  const seen = new Set<number>([start]);
  let order = 0;
  while (queue.length) {
    const i = queue.shift()!;
    const c = out[i];
    if (c.state !== "hidden") continue;
    out[i] = { ...c, state: "revealed", revealOrder: order++ };
    if (c.adjacent > 0 || c.mine) continue;
    for (const n of neighbors(i)) {
      if (seen.has(n)) continue;
      seen.add(n);
      const nb = out[n];
      if (nb.state === "hidden" && !nb.mine) queue.push(n);
    }
  }
  return out;
}

function isWon(grid: Cell[]): boolean {
  return grid.every((c) => (c.mine ? c.state !== "revealed" : c.state === "revealed"));
}

function persist(s: State) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        grid: s.grid.map((c) => ({
          id: c.id,
          mine: c.mine,
          adjacent: c.adjacent,
          state: c.state,
        })),
        status: s.status,
        flagCount: s.flagCount,
        startedAt: s.startedAt,
        endedAt: s.endedAt,
        bestMs: s.bestMs,
        flagMode: s.flagMode,
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
    if (!Array.isArray(parsed.grid) || parsed.grid.length !== COLS * ROWS) return {};
    return {
      grid: parsed.grid as Cell[],
      status: (["idle", "playing", "won", "over"] as Status[]).includes(parsed.status as Status)
        ? (parsed.status as Status)
        : "idle",
      flagCount: typeof parsed.flagCount === "number" ? parsed.flagCount : 0,
      startedAt: typeof parsed.startedAt === "number" ? parsed.startedAt : null,
      endedAt: typeof parsed.endedAt === "number" ? parsed.endedAt : null,
      bestMs: typeof parsed.bestMs === "number" ? parsed.bestMs : 0,
      flagMode: !!parsed.flagMode,
    };
  } catch {
    return {};
  }
}

export const useMinesweeper = create<State & Actions>((set, get) => ({
  ...initial(),

  hydrate: () => {
    const restored = rehydrate();
    set({ ...initial(), ...restored });
  },

  reveal: (i) => {
    const s = get();
    if (s.status === "won" || s.status === "over") return;
    if (s.flagMode) {
      get().toggleFlag(i);
      return;
    }
    const cell = s.grid[i];
    if (!cell || cell.state !== "hidden") return;

    // First click: place mines avoiding this cell + its neighbours when possible.
    let grid = s.grid;
    let status: Status = s.status;
    let startedAt = s.startedAt;
    if (status === "idle") {
      const safe = new Set<number>([i, ...neighbors(i)]);
      // If safe set is too big to fit MINES in remaining cells, shrink it.
      while (grid.length - safe.size < MINES) {
        const arr = Array.from(safe);
        safe.delete(arr[arr.length - 1]);
      }
      grid = placeMines(grid, safe);
      status = "playing";
      startedAt = Date.now();
    }

    // Now actually reveal.
    if (grid[i].mine) {
      // boom!
      const exploded = grid.map((c) =>
        c.mine ? { ...c, state: "revealed" as const, exploded: c.id === i } : c
      );
      const next: State = {
        ...s,
        grid: exploded,
        status: "over",
        startedAt,
        endedAt: Date.now(),
      };
      set(next);
      persist(next);
      return;
    }

    const next = cascade(grid, i);
    const won = isWon(next);
    const endedAt = won ? Date.now() : s.endedAt;
    const elapsed = won && startedAt ? endedAt! - startedAt : 0;
    const bestMs = won && (s.bestMs === 0 || elapsed < s.bestMs) ? elapsed : s.bestMs;
    const newState: State = {
      ...s,
      grid: next,
      status: won ? "won" : "playing",
      startedAt,
      endedAt: won ? endedAt : null,
      bestMs,
    };
    set(newState);
    persist(newState);
  },

  toggleFlag: (i) => {
    const s = get();
    if (s.status === "won" || s.status === "over") return;
    const cell = s.grid[i];
    if (!cell || cell.state === "revealed") return;

    const flagged = cell.state === "flagged";
    const next = s.grid.map((c) =>
      c.id === i ? { ...c, state: flagged ? ("hidden" as const) : ("flagged" as const) } : c
    );
    const newState: State = {
      ...s,
      grid: next,
      flagCount: s.flagCount + (flagged ? -1 : 1),
      status: s.status === "idle" ? "idle" : s.status,
    };
    set(newState);
    persist(newState);
  },

  setFlagMode: (on) => {
    const s = get();
    const next: State = { ...s, flagMode: on };
    set(next);
    persist(next);
  },

  restart: () => {
    const s = get();
    const next: State = { ...initial(), bestMs: s.bestMs };
    set(next);
    persist(next);
  },
}));
