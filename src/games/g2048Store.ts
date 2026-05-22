"use client";

import { create } from "zustand";

/**
 * 2048 — slide tiles, merge equals, reach 2048.
 *
 * Tiles carry stable ids so framer-motion can animate position changes with
 * layoutId. After a move:
 *   - tiles slide to their new (row, col)
 *   - absorbed tiles fade out (handled by AnimatePresence in the view)
 *   - one new tile (value 2, or 4 with 10% chance) spawns on an empty cell
 *
 * State persists in localStorage so a game survives reloads and route changes,
 * matching the rest of the boredom-buster suite.
 */

export const SIZE = 4;

export type Tile = {
  id: number;
  value: number;
  row: number;
  col: number;
  isNew?: boolean;
  justMerged?: boolean;
};

export type Direction = "up" | "down" | "left" | "right";
export type Status = "playing" | "won" | "over";

type State = {
  tiles: Tile[];
  score: number;
  best: number;
  status: Status;
  /** Reached 2048 and chose to keep going. */
  keepPlaying: boolean;
  nextId: number;
};

type Actions = {
  move: (dir: Direction) => void;
  restart: () => void;
  keepGoing: () => void;
  hydrate: () => void;
};

const STORAGE_KEY = "rrl:2048";

const empty = (): State => ({
  tiles: [],
  score: 0,
  best: 0,
  status: "playing",
  keepPlaying: false,
  nextId: 1,
});

function spawn(tiles: Tile[], nextId: number): { tiles: Tile[]; nextId: number } {
  const occupied = new Set(tiles.map((t) => t.row * SIZE + t.col));
  const free: number[] = [];
  for (let i = 0; i < SIZE * SIZE; i++) if (!occupied.has(i)) free.push(i);
  if (free.length === 0) return { tiles, nextId };
  const slot = free[Math.floor(Math.random() * free.length)];
  const value = Math.random() < 0.1 ? 4 : 2;
  return {
    tiles: [
      ...tiles,
      { id: nextId, value, row: Math.floor(slot / SIZE), col: slot % SIZE, isNew: true },
    ],
    nextId: nextId + 1,
  };
}

function tilesByCell(tiles: Tile[]): (Tile | undefined)[][] {
  const grid: (Tile | undefined)[][] = Array.from({ length: SIZE }, () =>
    Array.from({ length: SIZE }, () => undefined)
  );
  for (const t of tiles) grid[t.row][t.col] = t;
  return grid;
}

function slideLine(line: Tile[]): { line: Tile[]; absorbed: Tile[]; moved: boolean; gained: number } {
  // line is sorted in the direction of movement (towards index 0)
  const next: Tile[] = [];
  const absorbed: Tile[] = [];
  let gained = 0;
  let moved = false;
  let lastMergedIdx = -1; // index in `next` of the tile that just merged this turn
  for (const t of line) {
    if (next.length > 0 && next[next.length - 1].value === t.value && lastMergedIdx !== next.length - 1) {
      // merge into previous
      const into = next[next.length - 1];
      const newValue = into.value * 2;
      next[next.length - 1] = { ...into, value: newValue, justMerged: true };
      // The absorbed tile slides to the merger's destination, then fades.
      absorbed.push({ ...t, row: into.row, col: into.col });
      lastMergedIdx = next.length - 1;
      gained += newValue;
      moved = true;
    } else {
      next.push({ ...t, justMerged: false });
    }
  }
  return { line: next, absorbed, moved, gained };
}

/** Apply a move, returning the new tile arrangement, absorbed (animating-out)
 *  tiles, score delta, and a flag indicating whether anything moved. */
function performMove(tiles: Tile[], dir: Direction): {
  tiles: Tile[];
  absorbed: Tile[];
  moved: boolean;
  gained: number;
} {
  const grid = tilesByCell(tiles);
  const out: Tile[] = [];
  const absorbed: Tile[] = [];
  let totalMoved = false;
  let gained = 0;

  for (let i = 0; i < SIZE; i++) {
    // Collect this row/col in the movement order
    const original: Tile[] = [];
    for (let j = 0; j < SIZE; j++) {
      const t = dir === "left" || dir === "right" ? grid[i][j] : grid[j][i];
      if (t) original.push(t);
    }
    // For right/down we slide towards the high index, so reverse the line so
    // "first" in slideLine corresponds to the tile nearest the destination.
    const reversed = dir === "right" || dir === "down";
    const ordered = reversed ? [...original].reverse() : original;
    const { line, absorbed: absLine, moved, gained: g } = slideLine(ordered);
    if (moved) totalMoved = true;
    gained += g;

    // Reproject onto the grid.
    line.forEach((t, idx) => {
      const pos = reversed ? SIZE - 1 - idx : idx;
      const row = dir === "left" || dir === "right" ? i : pos;
      const col = dir === "left" || dir === "right" ? pos : i;
      if (t.row !== row || t.col !== col) totalMoved = true;
      out.push({ ...t, row, col });
    });
    absorbed.push(...absLine);
  }
  return { tiles: out, absorbed, moved: totalMoved, gained };
}

function isOver(tiles: Tile[]): boolean {
  if (tiles.length < SIZE * SIZE) return false;
  const grid = tilesByCell(tiles);
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      const v = grid[r][c]!.value;
      if (r + 1 < SIZE && grid[r + 1][c]!.value === v) return false;
      if (c + 1 < SIZE && grid[r][c + 1]!.value === v) return false;
    }
  }
  return true;
}

function reachedGoal(tiles: Tile[]): boolean {
  return tiles.some((t) => t.value >= 2048);
}

function persist(state: State) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        tiles: state.tiles.map((t) => ({ id: t.id, value: t.value, row: t.row, col: t.col })),
        score: state.score,
        best: state.best,
        status: state.status,
        keepPlaying: state.keepPlaying,
        nextId: state.nextId,
      })
    );
  } catch {
    /* storage may be unavailable */
  }
}

function rehydrate(): Partial<State> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Partial<State>;
    return {
      tiles: Array.isArray(parsed.tiles) ? (parsed.tiles as Tile[]) : [],
      score: typeof parsed.score === "number" ? parsed.score : 0,
      best: typeof parsed.best === "number" ? parsed.best : 0,
      status: parsed.status ?? "playing",
      keepPlaying: !!parsed.keepPlaying,
      nextId: typeof parsed.nextId === "number" ? parsed.nextId : 1,
    };
  } catch {
    return {};
  }
}

export const useG2048 = create<State & Actions>((set, get) => ({
  ...empty(),

  hydrate: () => {
    const restored = rehydrate();
    let next: State = { ...empty(), ...restored } as State;
    // Bootstrap a fresh game if none persisted.
    if (next.tiles.length === 0 && next.status === "playing") {
      let bootstrap = spawn([], next.nextId);
      bootstrap = spawn(bootstrap.tiles, bootstrap.nextId);
      next = { ...next, tiles: bootstrap.tiles, nextId: bootstrap.nextId };
      persist(next);
    }
    set(next);
  },

  move: (dir) => {
    const s = get();
    if (s.status === "over") return;
    if (s.status === "won" && !s.keepPlaying) return;

    const { tiles, absorbed, moved, gained } = performMove(s.tiles, dir);
    if (!moved) return;

    const score = s.score + gained;
    const best = Math.max(s.best, score);
    // Show absorbed tiles for one tick so they animate out, then prune.
    const combined: Tile[] = [
      ...tiles,
      ...absorbed.map((t) => ({ ...t, value: 0 })), // value 0 → renderer skips
    ];

    // Spawn happens after a short delay so the slide reads clearly.
    set({ tiles: combined, score, best });
    setTimeout(() => {
      const cur = get();
      // If user reset / changed direction quickly, skip.
      if (cur.tiles !== combined) return;
      const cleaned = cur.tiles.filter((t) => t.value > 0).map((t) => ({ ...t, justMerged: false, isNew: false }));
      const spawned = spawn(cleaned, cur.nextId);
      const won = !cur.keepPlaying && cur.status !== "won" && reachedGoal(spawned.tiles);
      const over = !won && isOver(spawned.tiles);
      const newState: State = {
        ...cur,
        tiles: spawned.tiles,
        nextId: spawned.nextId,
        status: won ? "won" : over ? "over" : "playing",
      };
      set(newState);
      persist(newState);
    }, 120);
  },

  restart: () => {
    const s = get();
    let bootstrap = spawn([], 1);
    bootstrap = spawn(bootstrap.tiles, bootstrap.nextId);
    const next: State = {
      tiles: bootstrap.tiles,
      score: 0,
      best: s.best,
      status: "playing",
      keepPlaying: false,
      nextId: bootstrap.nextId,
    };
    set(next);
    persist(next);
  },

  keepGoing: () => {
    const s = get();
    const next: State = { ...s, keepPlaying: true, status: "playing" };
    set(next);
    persist(next);
  },
}));
