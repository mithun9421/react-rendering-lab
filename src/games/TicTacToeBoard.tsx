"use client";

import { motion, AnimatePresence } from "framer-motion";
import { RotateCcw, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useTicTacToe } from "./ticTacToeStore";

const CELL = 64; // px

const WIN_LINES_GEOMETRY: Record<string, { x1: number; y1: number; x2: number; y2: number }> = {
  // row 0
  "0,1,2": { x1: 8, y1: CELL * 0.5, x2: CELL * 3 - 8, y2: CELL * 0.5 },
  // row 1
  "3,4,5": { x1: 8, y1: CELL * 1.5, x2: CELL * 3 - 8, y2: CELL * 1.5 },
  // row 2
  "6,7,8": { x1: 8, y1: CELL * 2.5, x2: CELL * 3 - 8, y2: CELL * 2.5 },
  // col 0
  "0,3,6": { x1: CELL * 0.5, y1: 8, x2: CELL * 0.5, y2: CELL * 3 - 8 },
  // col 1
  "1,4,7": { x1: CELL * 1.5, y1: 8, x2: CELL * 1.5, y2: CELL * 3 - 8 },
  // col 2
  "2,5,8": { x1: CELL * 2.5, y1: 8, x2: CELL * 2.5, y2: CELL * 3 - 8 },
  // diag \
  "0,4,8": { x1: 10, y1: 10, x2: CELL * 3 - 10, y2: CELL * 3 - 10 },
  // diag /
  "2,4,6": { x1: CELL * 3 - 10, y1: 10, x2: 10, y2: CELL * 3 - 10 },
};

export function TicTacToeBoard({ compact = false }: { compact?: boolean }) {
  const board = useTicTacToe((s) => s.board);
  const turn = useTicTacToe((s) => s.turn);
  const status = useTicTacToe((s) => s.status);
  const winLine = useTicTacToe((s) => s.winLine);
  const score = useTicTacToe((s) => s.score);
  const play = useTicTacToe((s) => s.play);
  const restart = useTicTacToe((s) => s.restart);

  const winKey = winLine ? winLine.join(",") : null;
  const geom = winKey ? WIN_LINES_GEOMETRY[winKey] : null;

  const banner =
    status === "win-x"
      ? "you win!"
      : status === "win-o"
        ? "the bot got you"
        : status === "draw"
          ? "cat's game"
          : turn === "X"
            ? "your move"
            : "thinking…";

  return (
    <div className={cn("flex flex-col items-center gap-3", compact && "scale-90")}>
      <div className="flex w-full items-center justify-between gap-2 px-1">
        <div className="flex items-center gap-1.5">
          <Badge variant="info" className="font-mono text-[10px]">
            X · {score.x}
          </Badge>
          <Badge variant="warn" className="font-mono text-[10px]">
            O · {score.o}
          </Badge>
          <Badge variant="secondary" className="font-mono text-[10px]">
            ∼ {score.draws}
          </Badge>
        </div>
        <Button
          type="button"
          size="icon"
          variant="ghost"
          onClick={restart}
          className="size-7"
          aria-label="restart game"
          title="Restart"
        >
          <RotateCcw className="size-3.5" aria-hidden />
        </Button>
      </div>

      <div className="relative" style={{ width: CELL * 3, height: CELL * 3 }}>
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-accent/15 via-bg-elevated to-accent-info/10 blur-xl opacity-60" aria-hidden />
        <div
          className="relative grid h-full w-full grid-cols-3 grid-rows-3 overflow-hidden rounded-2xl border border-bg-border bg-bg-elevated/80 shadow-glass backdrop-blur"
        >
          {board.map((cell, i) => (
            <Cell
              key={i}
              idx={i}
              value={cell}
              disabled={status !== "playing" || cell !== null || turn !== "X"}
              onPick={() => play(i)}
            />
          ))}
        </div>
        {/* winning line */}
        <svg
          className="pointer-events-none absolute inset-0"
          width={CELL * 3}
          height={CELL * 3}
          viewBox={`0 0 ${CELL * 3} ${CELL * 3}`}
          aria-hidden
        >
          <AnimatePresence>
            {geom && (
              <motion.line
                key={winKey}
                x1={geom.x1}
                y1={geom.y1}
                x2={geom.x2}
                y2={geom.y2}
                stroke="url(#winGrad)"
                strokeWidth={6}
                strokeLinecap="round"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.42, ease: "easeOut" }}
              />
            )}
          </AnimatePresence>
          <defs>
            <linearGradient id="winGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#7c5cff" />
              <stop offset="100%" stopColor="#ff7cc6" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      <div className="flex h-6 items-center gap-1.5 font-mono text-[11px]">
        {status !== "playing" && <Sparkles className="size-3 text-accent" aria-hidden />}
        <span
          className={cn(
            status === "win-x" && "text-accent-good",
            status === "win-o" && "text-accent-bad",
            status === "draw" && "text-ink-muted",
            status === "playing" && (turn === "X" ? "text-accent" : "text-accent-warn")
          )}
        >
          {banner}
        </span>
      </div>
    </div>
  );
}

function Cell({
  idx,
  value,
  disabled,
  onPick,
}: {
  idx: number;
  value: "X" | "O" | null;
  disabled: boolean;
  onPick: () => void;
}) {
  const row = Math.floor(idx / 3);
  const col = idx % 3;
  return (
    <motion.button
      type="button"
      onClick={onPick}
      disabled={disabled}
      whileHover={!disabled ? { scale: 1.04 } : undefined}
      whileTap={!disabled ? { scale: 0.94 } : undefined}
      className={cn(
        "relative flex items-center justify-center transition-colors",
        // Inner dividers via borders — last row/col have no divider.
        row < 2 && "border-b border-bg-border/70",
        col < 2 && "border-r border-bg-border/70",
        !disabled && "hover:bg-accent/5",
        disabled && value === null && "cursor-default"
      )}
      style={{ width: CELL, height: CELL }}
      aria-label={value ? `cell ${idx + 1} filled with ${value}` : `cell ${idx + 1} empty`}
    >
      <AnimatePresence>
        {value === "X" && (
          <motion.svg
            key="x"
            width={36}
            height={36}
            viewBox="0 0 36 36"
            initial={{ scale: 0.4, opacity: 0, rotate: -12 }}
            animate={{ scale: 1, opacity: 1, rotate: 0 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 18 }}
          >
            <defs>
              <linearGradient id="xGrad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#7c5cff" />
                <stop offset="100%" stopColor="#5cc8ff" />
              </linearGradient>
            </defs>
            <motion.path
              d="M8 8 L28 28"
              stroke="url(#xGrad)"
              strokeWidth={5}
              strokeLinecap="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.22, ease: "easeOut" }}
            />
            <motion.path
              d="M28 8 L8 28"
              stroke="url(#xGrad)"
              strokeWidth={5}
              strokeLinecap="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.22, ease: "easeOut", delay: 0.16 }}
            />
          </motion.svg>
        )}
        {value === "O" && (
          <motion.svg
            key="o"
            width={36}
            height={36}
            viewBox="0 0 36 36"
            initial={{ scale: 0.4, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ type: "spring", stiffness: 280, damping: 16 }}
          >
            <defs>
              <linearGradient id="oGrad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#ff7cc6" />
                <stop offset="100%" stopColor="#ffb47c" />
              </linearGradient>
            </defs>
            <motion.circle
              cx={18}
              cy={18}
              r={11}
              fill="none"
              stroke="url(#oGrad)"
              strokeWidth={5}
              strokeLinecap="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.36, ease: "easeOut" }}
            />
          </motion.svg>
        )}
      </AnimatePresence>
    </motion.button>
  );
}
