"use client";

import { Gamepad2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TicTacToeBoard } from "./TicTacToeBoard";

/**
 * Renders inside `loading.tsx` so the user sees a playable tic-tac-toe board
 * during server-side data fetching for the next route. Shares the same
 * persisted store as the global <BoredomBuster/>, so a game started here
 * continues seamlessly into the floating pill when the real page lands.
 */
export function LoadingGame({ subtitle = "fetching the lesson…" }: { subtitle?: string }) {
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
          <Badge variant="info" className="gap-1 font-mono text-[10px]">
            <span className="relative flex size-1.5">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-accent opacity-70" />
              <span className="relative inline-flex size-1.5 rounded-full bg-accent" />
            </span>
            loading
          </Badge>
        </div>
        <TicTacToeBoard />
      </div>
    </Card>
  );
}
