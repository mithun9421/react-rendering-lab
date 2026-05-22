"use client";

import { motion } from "framer-motion";
import {
  CircleDot,
  Flower2,
  Grid3x3,
  Heart,
  LayoutGrid,
  Moon,
  Sparkles,
  Type,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useTicTacToe } from "./ticTacToeStore";
import { useG2048 } from "./g2048Store";
import { useMemoryGame } from "./memoryStore";
import { useMinesweeper } from "./minesweeperStore";
import { useSlidePuzzle } from "./slidePuzzleStore";
import { useConnect4 } from "./connect4Store";
import { useLightsOut } from "./lightsOutStore";
import { useWordScramble } from "./wordScrambleStore";
import { useLauncher, type GameId } from "./launcherStore";

type GameMeta = {
  id: GameId;
  name: string;
  iconBg: string;
  Icon: React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
  useResumeable: () => boolean;
};

function useTicTacToeResumeable() {
  const board = useTicTacToe((s) => s.board);
  const status = useTicTacToe((s) => s.status);
  return status === "playing" && board.some((c) => c !== null);
}
function useG2048Resumeable() {
  const status = useG2048((s) => s.status);
  const tiles = useG2048((s) => s.tiles);
  return status === "playing" && tiles.length > 2;
}
function useMemoryResumeable() {
  const status = useMemoryGame((s) => s.status);
  const matches = useMemoryGame((s) => s.matches);
  return status === "playing" && matches > 0;
}
function useMinesweeperResumeable() {
  const status = useMinesweeper((s) => s.status);
  const grid = useMinesweeper((s) => s.grid);
  return status === "playing" && grid.some((c) => c.state === "revealed");
}
function useSlidePuzzleResumeable() {
  const status = useSlidePuzzle((s) => s.status);
  const moves = useSlidePuzzle((s) => s.moves);
  return status === "playing" && moves > 0;
}
function useConnect4Resumeable() {
  const status = useConnect4((s) => s.status);
  const discs = useConnect4((s) => s.discs);
  return status === "playing" && discs.length > 0;
}
function useLightsOutResumeable() {
  const status = useLightsOut((s) => s.status);
  const moves = useLightsOut((s) => s.moves);
  return status === "playing" && moves > 0;
}
function useWordScrambleResumeable() {
  const status = useWordScramble((s) => s.status);
  const slots = useWordScramble((s) => s.slots);
  return status !== "won" && slots.some((s) => s !== null);
}

const GAMES: GameMeta[] = [
  {
    id: "tictactoe",
    name: "Tic-Tac-Toe",
    iconBg: "bg-gradient-to-br from-accent-info to-accent",
    Icon: Grid3x3,
    useResumeable: useTicTacToeResumeable,
  },
  {
    id: "2048",
    name: "2048",
    iconBg: "bg-gradient-to-br from-[#ffd76b] via-[#ff7c93] to-[#7c5cff]",
    Icon: Sparkles,
    useResumeable: useG2048Resumeable,
  },
  {
    id: "memory",
    name: "Memory",
    iconBg: "bg-gradient-to-br from-[#ff9bd5] via-[#cdb6ff] to-[#9bd5ff]",
    Icon: Heart,
    useResumeable: useMemoryResumeable,
  },
  {
    id: "minesweeper",
    name: "Mine Garden",
    iconBg: "bg-gradient-to-br from-[#ffd1e4] via-[#c8e7ff] to-[#7c5cff]",
    Icon: Flower2,
    useResumeable: useMinesweeperResumeable,
  },
  {
    id: "slidepuzzle",
    name: "Slide",
    iconBg: "bg-gradient-to-br from-[#ffb47c] via-[#ff7c93] to-[#9bd5ff]",
    Icon: LayoutGrid,
    useResumeable: useSlidePuzzleResumeable,
  },
  {
    id: "connect4",
    name: "Connect 4",
    iconBg: "bg-gradient-to-br from-[#ff8da3] via-[#ffae3d] to-[#ffe27a]",
    Icon: CircleDot,
    useResumeable: useConnect4Resumeable,
  },
  {
    id: "lightsout",
    name: "Lights Out",
    iconBg: "bg-gradient-to-br from-[#ffd76b] via-[#9b7dff] to-[#1a1135]",
    Icon: Moon,
    useResumeable: useLightsOutResumeable,
  },
  {
    id: "wordscramble",
    name: "Scramble",
    iconBg: "bg-gradient-to-br from-[#ffc7e0] via-[#cdb6ff] to-[#9bd5ff]",
    Icon: Type,
    useResumeable: useWordScrambleResumeable,
  },
];

export function GameLauncher() {
  const setActive = useLauncher((s) => s.setActiveGame);
  const setUi = useLauncher((s) => s.setUi);
  return (
    <div className="space-y-2">
      <div className="px-1 font-mono text-[11px] uppercase tracking-widest text-ink-dim">
        pick a game
      </div>
      <ul className="grid grid-cols-3 gap-2">
        {GAMES.map((g) => (
          <li key={g.id}>
            <GameTile
              meta={g}
              onPick={() => {
                setActive(g.id);
                setUi("game");
              }}
            />
          </li>
        ))}
      </ul>
    </div>
  );
}

function GameTile({ meta, onPick }: { meta: GameMeta; onPick: () => void }) {
  const resumeable = meta.useResumeable();
  const Icon = meta.Icon;
  return (
    <motion.button
      type="button"
      onClick={onPick}
      whileHover={{ scale: 1.04, y: -2 }}
      whileTap={{ scale: 0.96 }}
      transition={{ type: "spring", stiffness: 360, damping: 24 }}
      className="group block w-full text-left"
    >
      <Card className="relative overflow-hidden border-bg-border transition-colors group-hover:border-accent/50">
        {resumeable && (
          <span className="absolute right-1.5 top-1.5 flex size-2">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-accent opacity-70" />
            <span className="relative inline-flex size-2 rounded-full bg-accent" />
          </span>
        )}
        <div className="flex flex-col items-center gap-2 px-2 py-3">
          <span
            className={cn(
              "grid size-11 place-items-center rounded-xl text-white shadow-glass",
              meta.iconBg
            )}
            aria-hidden
          >
            <Icon className="size-5" aria-hidden />
          </span>
          <span className="text-center font-mono text-[11px] leading-tight text-ink">
            {meta.name}
          </span>
        </div>
      </Card>
    </motion.button>
  );
}
