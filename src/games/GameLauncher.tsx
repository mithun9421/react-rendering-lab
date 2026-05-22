"use client";

import { motion } from "framer-motion";
import { Grid3x3, Sparkles, ChevronRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useTicTacToe } from "./ticTacToeStore";
import { useG2048 } from "./g2048Store";
import { useLauncher, type GameId } from "./launcherStore";

type GameMeta = {
  id: GameId;
  name: string;
  tagline: string;
  iconBg: string;
  Icon: React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
  /** Per-game small live status, e.g. "X · 3" or "score · 124". */
  useStatus: () => { line: string; resumeable: boolean };
};

function useTicTacToeStatus() {
  const score = useTicTacToe((s) => s.score);
  const board = useTicTacToe((s) => s.board);
  const status = useTicTacToe((s) => s.status);
  const resumeable = status === "playing" && board.some((c) => c !== null);
  return {
    line: `wins · ${score.x} · losses · ${score.o}`,
    resumeable,
  };
}
function useG2048Status() {
  const score = useG2048((s) => s.score);
  const best = useG2048((s) => s.best);
  const status = useG2048((s) => s.status);
  const tiles = useG2048((s) => s.tiles);
  return {
    line: `score · ${score} · best · ${best}`,
    resumeable: status === "playing" && tiles.length > 2,
  };
}

const GAMES: GameMeta[] = [
  {
    id: "tictactoe",
    name: "Tic-Tac-Toe",
    tagline: "classic vs cute AI",
    iconBg: "bg-gradient-to-br from-accent-info to-accent",
    Icon: Grid3x3,
    useStatus: useTicTacToeStatus,
  },
  {
    id: "2048",
    name: "2048",
    tagline: "swipe + merge to gold",
    iconBg: "bg-gradient-to-br from-[#ffd76b] via-[#ff7c93] to-[#7c5cff]",
    Icon: Sparkles,
    useStatus: useG2048Status,
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
      <ul className="space-y-2">
        {GAMES.map((g) => (
          <li key={g.id}>
            <GameRow
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

function GameRow({ meta, onPick }: { meta: GameMeta; onPick: () => void }) {
  const status = meta.useStatus();
  const Icon = meta.Icon;
  return (
    <motion.button
      type="button"
      onClick={onPick}
      whileHover={{ scale: 1.015 }}
      whileTap={{ scale: 0.985 }}
      className="group w-full text-left"
    >
      <Card className="overflow-hidden border-bg-border transition-colors group-hover:border-accent/50">
        <CardContent className="flex items-center gap-3 p-3">
          <span
            className={cn(
              "grid size-10 shrink-0 place-items-center rounded-xl text-white shadow-glass",
              meta.iconBg
            )}
            aria-hidden
          >
            <Icon className="size-5" aria-hidden />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm font-medium text-ink">{meta.name}</span>
              {status.resumeable && (
                <Badge variant="info" className="gap-1 font-mono text-[9px]">
                  <span className="relative flex size-1.5">
                    <span className="absolute inline-flex size-full animate-ping rounded-full bg-accent opacity-70" />
                    <span className="relative inline-flex size-1.5 rounded-full bg-accent" />
                  </span>
                  in progress
                </Badge>
              )}
            </div>
            <div className="truncate font-mono text-[11px] text-ink-dim">{meta.tagline}</div>
            <div className="truncate font-mono text-[10px] text-ink-muted">{status.line}</div>
          </div>
          <ChevronRight className="size-4 shrink-0 text-ink-dim transition-transform group-hover:translate-x-0.5 group-hover:text-accent" aria-hidden />
        </CardContent>
      </Card>
    </motion.button>
  );
}
