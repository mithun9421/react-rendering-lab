"use client";

import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { RotateCcw, Sparkles, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useMemoryGame, PAIRS } from "./memoryStore";

const CELL = 60;
const GAP = 8;
const COLS = 4;

export function MemoryBoard({ compact = false }: { compact?: boolean }) {
  const cards = useMemoryGame((s) => s.cards);
  const moves = useMemoryGame((s) => s.moves);
  const matches = useMemoryGame((s) => s.matches);
  const streak = useMemoryGame((s) => s.streak);
  const bestStreak = useMemoryGame((s) => s.bestStreak);
  const bestMoves = useMemoryGame((s) => s.bestMoves);
  const status = useMemoryGame((s) => s.status);
  const flip = useMemoryGame((s) => s.flip);
  const restart = useMemoryGame((s) => s.restart);
  const hydrate = useMemoryGame((s) => s.hydrate);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  const boardW = COLS * CELL + (COLS + 1) * GAP;
  const rows = Math.ceil(cards.length / COLS);
  const boardH = rows * CELL + (rows + 1) * GAP;

  const banner =
    status === "won"
      ? "all pairs found!"
      : moves === 0
        ? "flip two cards"
        : streak >= 2
          ? `streak ×${streak}`
          : `${matches}/${PAIRS} pairs`;

  return (
    <div className={cn("flex flex-col items-center gap-3", compact && "scale-90")}>
      <div className="flex w-full items-center justify-between gap-2 px-1">
        <div className="flex flex-wrap items-center gap-1.5">
          <Badge variant="info" className="font-mono text-[10px] tabular-nums">
            moves · {moves}
          </Badge>
          {streak >= 2 && (
            <Badge variant="warn" className="gap-1 font-mono text-[10px]">
              <Sparkles className="size-2.5" aria-hidden /> ×{streak}
            </Badge>
          )}
          {bestMoves > 0 && (
            <Badge variant="secondary" className="gap-1 font-mono text-[10px]">
              <Trophy className="size-2.5" aria-hidden /> {bestMoves}
            </Badge>
          )}
        </div>
        <Button
          type="button"
          size="icon"
          variant="ghost"
          onClick={restart}
          className="size-7"
          aria-label="new deal"
          title="New deal"
        >
          <RotateCcw className="size-3.5" aria-hidden />
        </Button>
      </div>

      <div
        className="relative select-none rounded-2xl border border-bg-border bg-bg-elevated/80 shadow-glass backdrop-blur"
        style={{ width: boardW, height: boardH, padding: GAP }}
      >
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-br from-accent-info/10 via-transparent to-accent-warn/10 blur-2xl opacity-60"
        />
        <div
          className="relative grid h-full w-full"
          style={{
            gridTemplateColumns: `repeat(${COLS}, ${CELL}px)`,
            gridAutoRows: `${CELL}px`,
            gap: GAP,
          }}
        >
          {cards.map((c, i) => (
            <CardTile key={c.id} idx={i} symbol={c.symbol} state={c.state} onPick={() => flip(i)} />
          ))}
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
                cleared in {moves} moves
              </div>
              <Button size="sm" onClick={restart} className="font-mono text-[11px]">
                new deal
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="flex h-4 items-center font-mono text-[11px]">
        <span
          className={cn(
            status === "won" && "text-accent-good",
            status === "playing" && streak >= 2 && "text-accent-warn",
            status === "playing" && streak < 2 && "text-ink-muted"
          )}
        >
          {banner}
          {bestStreak >= 3 && status === "playing" && (
            <span className="ml-2 text-ink-dim">· best streak ×{bestStreak}</span>
          )}
        </span>
      </div>
    </div>
  );
}

function CardTile({
  idx,
  symbol,
  state,
  onPick,
}: {
  idx: number;
  symbol: string;
  state: "hidden" | "flipped" | "matched";
  onPick: () => void;
}) {
  const faceUp = state !== "hidden";
  return (
    <motion.button
      type="button"
      onClick={onPick}
      disabled={state !== "hidden"}
      whileHover={state === "hidden" ? { scale: 1.05 } : undefined}
      whileTap={state === "hidden" ? { scale: 0.95 } : undefined}
      className="relative outline-none focus-visible:ring-2 focus-visible:ring-accent"
      style={{ width: CELL, height: CELL, perspective: 600 }}
      aria-label={faceUp ? `card ${idx + 1} showing ${symbol}` : `card ${idx + 1} hidden`}
    >
      <motion.div
        className="relative h-full w-full"
        animate={{ rotateY: faceUp ? 180 : 0 }}
        transition={{ type: "spring", stiffness: 260, damping: 22 }}
        style={{ transformStyle: "preserve-3d" }}
      >
        {/* back */}
        <div
          className="absolute inset-0 grid place-items-center rounded-xl border border-bg-border bg-gradient-to-br from-accent/40 via-accent-info/30 to-accent-warn/30 shadow-glass"
          style={{ backfaceVisibility: "hidden" }}
        >
          <span className="font-mono text-xs text-white/70">?</span>
        </div>
        {/* front */}
        <div
          className={cn(
            "absolute inset-0 grid place-items-center rounded-xl border text-3xl shadow-glass transition-colors",
            state === "matched"
              ? "border-accent-good/50 bg-accent-good/15"
              : "border-bg-border bg-bg-panel"
          )}
          style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
        >
          <motion.span
            animate={state === "matched" ? { scale: [1, 1.2, 1] } : { scale: 1 }}
            transition={{ duration: 0.4 }}
          >
            {symbol}
          </motion.span>
        </div>
      </motion.div>
    </motion.button>
  );
}
