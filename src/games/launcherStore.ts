"use client";

import { create } from "zustand";

export type GameId =
  | "tictactoe"
  | "2048"
  | "memory"
  | "minesweeper"
  | "slidepuzzle"
  | "connect4"
  | "lightsout"
  | "wordscramble"
  | "simon";
export type LauncherUi = "hidden" | "launcher" | "game" | "pill";

type State = {
  ui: LauncherUi;
  /** Last picked game — used by the pill to deep-link straight back in. */
  activeGame: GameId | null;
};

type Actions = {
  setUi: (ui: LauncherUi) => void;
  setActiveGame: (id: GameId | null) => void;
  hydrate: () => void;
};

const STORAGE_KEY = "rrl:games:launcher";

const initial: State = { ui: "hidden", activeGame: null };

export const useLauncher = create<State & Actions>((set) => ({
  ...initial,
  setUi: (ui) => set({ ui }),
  setActiveGame: (activeGame) => {
    set({ activeGame });
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ activeGame }));
      } catch {
        /* storage may be unavailable */
      }
    }
  },
  hydrate: () => {
    if (typeof window === "undefined") return;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as { activeGame?: GameId };
      const valid: GameId[] = [
        "tictactoe",
        "2048",
        "memory",
        "minesweeper",
        "slidepuzzle",
        "connect4",
        "lightsout",
        "wordscramble",
        "simon",
      ];
      if (valid.includes(parsed.activeGame as GameId)) {
        set({ activeGame: parsed.activeGame as GameId });
      }
    } catch {
      /* ignore */
    }
  },
}));
