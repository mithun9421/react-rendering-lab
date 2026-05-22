"use client";

import { memo, useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { RotateCcw, Sparkles, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useSlidePuzzle, COLS, ROWS } from "./slidePuzzleStore";

const CELL = 56;
const GAP = 6;

/** Per-row pastel gradients so the solved state forms a soft rainbow. */
const TILE_GRADIENT = [
  "bg-gradient-to-br from-[#ffd6a8] to-[#ff9b73] text-white", // row 0 (1-4): peach
  "bg-gradient-to-br from-[#ffb6cf] to-[#ff7ca8] text-white", // row 1 (5-8): rose
  "bg-gradient-to-br from-[#cdb6ff] to-[#9b7dff] text-white", // row 2 (9-12): lavender
  "bg-gradient-to-br from-[#9bd5ff] to-[#5cb8ff] text-white", // row 3 (13-15): cyan
];

function gradientFor(value: number): string {
  // Tile colour is based on the row the tile BELONGS to when solved.
  const solvedRow = Math.floor((value - 1) / COLS);
  return TILE_GRADIENT[solvedRow] ?? TILE_GRADIENT[0];
}

export function SlidePuzzleBoard({ compact = false }: { compact?: boolean }) {
  const tiles = useSlidePuzzle((s) => s.tiles);
  const moves = useSlidePuzzle((s) => s.moves);
  const bestMoves = useSlidePuzzle((s) => s.bestMoves);
  const startedAt = useSlidePuzzle((s) => s.startedAt);
  const endedAt = useSlidePuzzle((s) => s.endedAt);
  const bestMs = useSlidePuzzle((s) => s.bestMs);
  const status = useSlidePuzzle((s) => s.status);
  const slide = useSlidePuzzle((s) => s.slide);
  const slideDir = useSlidePuzzle((s) => s.slideDir);
  const restart = useSlidePuzzle((s) => s.restart);
  const hydrate = useSlidePuzzle((s) => s.hydrate);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  // Keyboard.
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const map: Record<string, "up" | "down" | "left" | "right"> = {
        ArrowUp: "up",
        ArrowDown: "down",
        ArrowLeft: "left",
        ArrowRight: "right",
        w: "up",
        s: "down",
        a: "left",
        d: "right",
        W: "up",
        S: "down",
        A: "left",
        D: "right",
      };
      const dir = map[e.key];
      if (!dir) return;
      const tag = (document.activeElement as HTMLElement | null)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      e.preventDefault();
      slideDir(dir);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [slideDir]);

  // Touch swipes.
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const onTouchStart = useCallback((e: React.TouchEvent) => {
    const t = e.touches[0];
    touchStart.current = { x: t.clientX, y: t.clientY };
  }, []);
  const onTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      const s = touchStart.current;
      touchStart.current = null;
      if (!s) return;
      const t = e.changedTouches[0];
      const dx = t.clientX - s.x;
      const dy = t.clientY - s.y;
      const adx = Math.abs(dx);
      const ady = Math.abs(dy);
      if (Math.max(adx, ady) < 24) return;
      if (adx > ady) slideDir(dx > 0 ? "right" : "left");
      else slideDir(dy > 0 ? "down" : "up");
    },
    [slideDir]
  );

  const boardW = COLS * CELL + (COLS + 1) * GAP;
  const boardH = ROWS * CELL + (ROWS + 1) * GAP;

  // Map value -> current (row, col) for layout animation.
  const positions = new Map<number, { row: number; col: number }>();
  tiles.forEach((value, i) => {
    if (value === 0) return;
    positions.set(value, { row: Math.floor(i / COLS), col: i % COLS });
  });

  const elapsedSec = useElapsed(startedAt, endedAt, status);

  return (
    <div className={cn("flex flex-col items-center gap-3", compact && "scale-90")}>
      <div className="flex w-full items-center justify-between gap-2 px-1">
        <div className="flex flex-wrap items-center gap-1.5">
          <Badge variant="info" className="font-mono text-[10px] tabular-nums">
            moves · {moves}
          </Badge>
          <Badge variant="secondary" className="font-mono text-[10px] tabular-nums">
            {elapsedSec.toFixed(1)}s
          </Badge>
          {bestMs > 0 && (
            <Badge variant="warn" className="gap-1 font-mono text-[10px] tabular-nums">
              <Trophy className="size-2.5" aria-hidden /> {(bestMs / 1000).toFixed(1)}s
            </Badge>
          )}
          {bestMoves > 0 && (
            <Badge variant="success" className="font-mono text-[10px] tabular-nums">
              best · {bestMoves}
            </Badge>
          )}
        </div>
        <Button
          type="button"
          size="icon"
          variant="ghost"
          onClick={restart}
          className="size-7"
          aria-label="shuffle"
          title="Shuffle"
        >
          <RotateCcw className="size-3.5" aria-hidden />
        </Button>
      </div>

      <div
        className="relative select-none rounded-2xl border border-bg-border bg-bg-elevated/80 shadow-glass backdrop-blur"
        style={{ width: boardW, height: boardH, padding: GAP }}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
        role="application"
        aria-label="slide puzzle"
        tabIndex={0}
      >
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-br from-[#ffd6a8]/12 via-transparent to-[#9bd5ff]/12 blur-2xl opacity-60"
        />
        {/* Empty slot ghosts */}
        <div
          className="relative grid h-full w-full"
          style={{
            gridTemplateColumns: `repeat(${COLS}, ${CELL}px)`,
            gridAutoRows: `${CELL}px`,
            gap: GAP,
          }}
        >
          {Array.from({ length: COLS * ROWS }).map((_, i) => (
            <div key={i} className="rounded-xl bg-bg-panel/60" />
          ))}
        </div>

        {/* Tile layer */}
        <div className="pointer-events-none absolute inset-0" style={{ padding: GAP }}>
          <AnimatePresence>
            {Array.from(positions.entries()).map(([value, pos]) => (
              <PuzzleTile
                key={value}
                value={value}
                row={pos.row}
                col={pos.col}
                won={status === "won"}
                onClick={slide}
              />
            ))}
          </AnimatePresence>
        </div>

        <AnimatePresence>
          {status === "won" && (
            <motion.div
              key="won"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 rounded-2xl bg-bg/70 backdrop-blur-sm"
            >
              <div className="flex items-center gap-1.5 font-mono text-xs uppercase tracking-widest text-accent-good">
                <Sparkles className="size-3.5" aria-hidden />
                solved in {moves} moves · {elapsedSec.toFixed(1)}s
              </div>
              <Button size="sm" onClick={restart} className="font-mono text-[11px]">
                shuffle again
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="font-mono text-[10px] text-ink-dim">
        arrows · wasd · swipe · tap a tile to slide
      </div>
    </div>
  );
}

const PuzzleTile = memo(
  function PuzzleTile({
    value,
    row,
    col,
    won,
    onClick,
  }: {
    value: number;
    row: number;
    col: number;
    won: boolean;
    onClick: (idx: number) => void;
  }) {
    const x = col * (CELL + GAP);
    const y = row * (CELL + GAP);
    const tileIdx = row * COLS + col;
    return (
      <motion.button
        type="button"
        initial={false}
        animate={{ x, y, scale: 1 }}
        whileHover={!won ? { scale: 1.04 } : undefined}
        whileTap={!won ? { scale: 0.94 } : undefined}
        transition={{ type: "spring", stiffness: 380, damping: 30 }}
        onClick={() => onClick(tileIdx)}
        className={cn(
          "pointer-events-auto absolute grid place-items-center rounded-xl font-mono text-lg font-semibold tabular-nums shadow-glass outline-none will-change-transform focus-visible:ring-2 focus-visible:ring-accent",
          gradientFor(value),
          won && "ring-1 ring-white/30"
        )}
        style={{ width: CELL, height: CELL }}
        aria-label={`tile ${value}`}
      >
        {value}
      </motion.button>
    );
  },
  (prev, next) =>
    prev.value === next.value &&
    prev.row === next.row &&
    prev.col === next.col &&
    prev.won === next.won &&
    prev.onClick === next.onClick
);

function useElapsed(startedAt: number | null, endedAt: number | null, status: "playing" | "won") {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (status !== "playing" || !startedAt) return;
    const id = window.setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(id);
  }, [startedAt, status]);
  if (!startedAt) return 0;
  return ((endedAt ?? now) - startedAt) / 1000;
}
