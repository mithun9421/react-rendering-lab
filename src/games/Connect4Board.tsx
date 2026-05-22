"use client";

import { memo, useCallback, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { RotateCcw, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useConnect4, COLS, ROWS, type Player, type Disc } from "./connect4Store";

const CELL = 36;
const GAP = 4;

export function Connect4Board({ compact = false }: { compact?: boolean }) {
  const discs = useConnect4((s) => s.discs);
  const board = useConnect4((s) => s.board);
  const turn = useConnect4((s) => s.turn);
  const status = useConnect4((s) => s.status);
  const score = useConnect4((s) => s.score);
  const drop = useConnect4((s) => s.drop);
  const restart = useConnect4((s) => s.restart);
  const hydrate = useConnect4((s) => s.hydrate);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  const boardW = COLS * CELL + (COLS + 1) * GAP;
  const boardH = ROWS * CELL + (ROWS + 1) * GAP;

  const columnFull = useCallback((c: number) => board[c] !== 0, [board]);
  const canPlay = status === "playing" && turn === 1;

  const banner =
    status === "win-p"
      ? "you got four! 🎉"
      : status === "win-ai"
        ? "the bot won this round"
        : status === "draw"
          ? "no four — draw!"
          : turn === 1
            ? "your move 🍓"
            : "bot thinking…";

  return (
    <div className={cn("flex flex-col items-center gap-3", compact && "scale-90")}>
      <div className="flex w-full items-center justify-between gap-2 px-1">
        <div className="flex items-center gap-1.5">
          <Badge variant="info" className="gap-1 font-mono text-[10px]">
            <DiscDot player={1} size="xs" /> {score.p}
          </Badge>
          <Badge variant="warn" className="gap-1 font-mono text-[10px]">
            <DiscDot player={2} size="xs" /> {score.ai}
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
          aria-label="new round"
          title="New round"
        >
          <RotateCcw className="size-3.5" aria-hidden />
        </Button>
      </div>

      <div className="relative">
        <HoverRow boardW={boardW} canPlay={canPlay} columnFull={columnFull} />

        <div
          className="relative select-none rounded-2xl border border-[#7c5cff]/30 bg-gradient-to-br from-[#5b4bd6] via-[#3b2fa8] to-[#2a2270] shadow-glass"
          style={{ width: boardW, height: boardH, padding: GAP }}
        >
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-br from-white/10 via-transparent to-black/20 blur-[1px]"
          />
          {/* Empty wells */}
          <div
            className="relative grid h-full w-full"
            style={{
              gridTemplateColumns: `repeat(${COLS}, ${CELL}px)`,
              gridAutoRows: `${CELL}px`,
              gap: GAP,
            }}
          >
            {Array.from({ length: COLS * ROWS }).map((_, i) => (
              <div
                key={i}
                className="rounded-full bg-bg-panel/85 shadow-[inset_0_2px_3px_rgba(0,0,0,0.5)]"
              />
            ))}
          </div>

          {/* Disc layer */}
          <div className="pointer-events-none absolute inset-0" style={{ padding: GAP }}>
            <AnimatePresence>
              {discs.map((d) => (
                <DiscNode key={d.id} disc={d} />
              ))}
            </AnimatePresence>
          </div>

          {/* Click columns (overlaid invisible buttons spanning full board height) */}
          <ColumnButtons canPlay={canPlay} columnFull={columnFull} drop={drop} />

          <AnimatePresence>
            {(status === "win-p" || status === "win-ai" || status === "draw") && (
              <motion.div
                key="end"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 rounded-2xl bg-bg/65 backdrop-blur-sm"
              >
                <div
                  className={cn(
                    "flex items-center gap-1.5 font-mono text-xs uppercase tracking-widest",
                    status === "win-p" && "text-accent-good",
                    status === "win-ai" && "text-accent-bad",
                    status === "draw" && "text-ink-muted"
                  )}
                >
                  {status === "win-p" && <Sparkles className="size-3.5" aria-hidden />}
                  {status === "win-p"
                    ? "four in a row!"
                    : status === "win-ai"
                      ? "bot beat you"
                      : "all full · draw"}
                </div>
                <Button size="sm" onClick={restart} className="font-mono text-[11px]">
                  rematch
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <div className="flex h-4 items-center gap-1.5 font-mono text-[11px]">
        <span
          className={cn(
            status === "win-p" && "text-accent-good",
            status === "win-ai" && "text-accent-bad",
            status === "draw" && "text-ink-muted",
            status === "playing" && turn === 1 && "text-accent-info",
            status === "playing" && turn === 2 && "text-accent-warn"
          )}
        >
          {banner}
        </span>
      </div>
    </div>
  );
}

/* ───────────── memoized children ───────────── */

const DiscNode = memo(
  function DiscNode({ disc }: { disc: Disc }) {
    return (
      <motion.div
        initial={{ x: disc.col * (CELL + GAP), y: -CELL - 4, opacity: 0, scale: 0.9 }}
        animate={{
          x: disc.col * (CELL + GAP),
          y: disc.row * (CELL + GAP),
          opacity: 1,
          scale: disc.highlighted ? [1, 1.08, 1] : 1,
        }}
        exit={{ opacity: 0, scale: 0.6 }}
        transition={{
          y: { type: "spring", stiffness: 260, damping: 16, mass: 0.85 },
          scale: disc.highlighted
            ? { duration: 1.1, repeat: Infinity, repeatType: "loop", ease: "easeInOut" }
            : { duration: 0.18 },
          opacity: { duration: 0.18 },
        }}
        className="absolute grid place-items-center rounded-full will-change-transform"
        style={{ width: CELL, height: CELL }}
      >
        <DiscDot player={disc.player} highlighted={disc.highlighted} />
      </motion.div>
    );
  },
  (prev, next) =>
    prev.disc.id === next.disc.id &&
    prev.disc.row === next.disc.row &&
    prev.disc.col === next.disc.col &&
    prev.disc.player === next.disc.player &&
    !!prev.disc.highlighted === !!next.disc.highlighted
);

const HoverRow = memo(function HoverRow({
  boardW,
  canPlay,
  columnFull,
}: {
  boardW: number;
  canPlay: boolean;
  columnFull: (c: number) => boolean;
}) {
  const [hoverCol, setHoverCol] = useState<number | null>(null);
  return (
    <div
      className="mb-1 flex"
      style={{ width: boardW, paddingLeft: GAP, paddingRight: GAP, gap: GAP }}
      aria-hidden
      onMouseLeave={() => setHoverCol(null)}
    >
      {Array.from({ length: COLS }).map((_, c) => (
        <div
          key={c}
          onMouseEnter={() => setHoverCol(c)}
          style={{ width: CELL, height: 16 }}
          className="grid place-items-center"
        >
          <AnimatePresence>
            {canPlay && hoverCol === c && !columnFull(c) && (
              <motion.span
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -2 }}
                transition={{ duration: 0.14 }}
              >
                <DiscDot player={1} size="sm" muted />
              </motion.span>
            )}
          </AnimatePresence>
        </div>
      ))}
    </div>
  );
});

const ColumnButtons = memo(function ColumnButtons({
  canPlay,
  columnFull,
  drop,
}: {
  canPlay: boolean;
  columnFull: (c: number) => boolean;
  drop: (c: number) => void;
}) {
  return (
    <div className="absolute inset-0 flex" style={{ padding: GAP, gap: GAP }}>
      {Array.from({ length: COLS }).map((_, c) => (
        <button
          key={c}
          type="button"
          disabled={!canPlay || columnFull(c)}
          onClick={() => drop(c)}
          aria-label={`drop disc in column ${c + 1}`}
          className={cn(
            "flex-1 rounded-md outline-none transition-colors focus-visible:bg-white/5",
            canPlay && !columnFull(c) && "hover:bg-white/5"
          )}
          style={{ height: ROWS * (CELL + GAP) - GAP }}
        />
      ))}
    </div>
  );
});

function DiscDot({
  player,
  highlighted,
  muted,
  size = "md",
}: {
  player: Player;
  highlighted?: boolean;
  muted?: boolean;
  size?: "xs" | "sm" | "md";
}) {
  const sizeCls = size === "xs" ? "size-2" : size === "sm" ? "size-3.5" : "size-7";
  const opacity = muted ? "opacity-60" : "";
  return (
    <span
      aria-hidden
      className={cn(
        "block rounded-full shadow-[inset_-3px_-4px_8px_rgba(0,0,0,0.35),inset_3px_4px_6px_rgba(255,255,255,0.35)]",
        sizeCls,
        opacity,
        player === 1 && "bg-gradient-to-br from-[#ff8da3] to-[#ff5c7a]",
        player === 2 && "bg-gradient-to-br from-[#ffe27a] to-[#ffae3d]",
        highlighted && "ring-2 ring-white/70"
      )}
    />
  );
}
