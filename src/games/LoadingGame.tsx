"use client";

import { useEffect } from "react";
import { Gamepad2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useLauncher } from "./launcherStore";
import { useTicTacToe } from "./ticTacToeStore";
import { useG2048 } from "./g2048Store";
import { TicTacToeBoard } from "./TicTacToeBoard";
import { G2048Board } from "./G2048Board";
import { GameLauncher } from "./GameLauncher";

/**
 * Renders inside `loading.tsx` so the user sees a playable game during
 * server-side data fetching. Shares the launcher + per-game stores with the
 * global <BoredomBuster/>, so a game started here continues straight into the
 * floating pill when the real page lands.
 */
export function LoadingGame({ subtitle = "fetching the lesson…" }: { subtitle?: string }) {
  const activeGame = useLauncher((s) => s.activeGame);
  const setActive = useLauncher((s) => s.setActiveGame);
  const hydrateLauncher = useLauncher((s) => s.hydrate);
  const hydrateTtt = useTicTacToe((s) => s.hydrate);
  const hydrate2048 = useG2048((s) => s.hydrate);

  useEffect(() => {
    hydrateLauncher();
    hydrateTtt();
    hydrate2048();
  }, [hydrateLauncher, hydrateTtt, hydrate2048]);

  return (
    <Card className="relative mx-auto mb-6 w-full max-w-md overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute -inset-px -z-0 bg-gradient-to-br from-accent/15 via-transparent to-accent-info/10 blur-2xl"
      />
      <div className="relative p-4 sm:p-5">
        <div className="mb-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="grid size-7 place-items-center rounded-lg bg-gradient-to-br from-accent to-accent-info text-white shadow-glass">
              <Gamepad2 className="size-4" aria-hidden />
            </span>
            <div className="leading-tight">
              <div className="font-mono text-[11px] uppercase tracking-widest text-ink">
                pass the time
              </div>
              <div className="font-mono text-[10px] text-ink-dim">{subtitle}</div>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            {activeGame && (
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => setActive(null)}
                className="h-7 font-mono text-[10px] uppercase tracking-widest"
                title="Pick a different game"
              >
                switch
              </Button>
            )}
            <Badge variant="info" className="gap-1 font-mono text-[10px]">
              <span className="relative flex size-1.5">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-accent opacity-70" />
                <span className="relative inline-flex size-1.5 rounded-full bg-accent" />
              </span>
              loading
            </Badge>
          </div>
        </div>
        {activeGame === "tictactoe" ? (
          <TicTacToeBoard />
        ) : activeGame === "2048" ? (
          <G2048Board />
        ) : (
          <GameLauncher />
        )}
      </div>
    </Card>
  );
}
