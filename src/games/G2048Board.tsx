"use client";

import { memo, useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { RotateCcw, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useG2048, SIZE, type Direction, type Tile } from "./g2048Store";

const CELL = 60; // px
const GAP = 8;

/** Pastel candy palette mapped to powers of 2. Beyond 2048 we cycle a rainbow
 *  gradient so the board doesn't go grey on high scores. */
const TILE_STYLES: Record<number, { bg: string; text: string; size: string }> = {
  2: { bg: "bg-gradient-to-br from-[#f5efe6] to-[#e9dec8]", text: "text-[#7a6a55]", size: "text-2xl" },
  4: { bg: "bg-gradient-to-br from-[#f5e3c4] to-[#ecd09e]", text: "text-[#7a6a55]", size: "text-2xl" },
  8: { bg: "bg-gradient-to-br from-[#ffd6a8] to-[#ff9f73]", text: "text-white", size: "text-2xl" },
  16: { bg: "bg-gradient-to-br from-[#ffa07a] to-[#ff6f61]", text: "text-white", size: "text-2xl" },
  32: { bg: "bg-gradient-to-br from-[#ff7a8a] to-[#ee4f6b]", text: "text-white", size: "text-2xl" },
  64: { bg: "bg-gradient-to-br from-[#ff5c7a] to-[#d6336c]", text: "text-white", size: "text-2xl" },
  128: { bg: "bg-gradient-to-br from-[#cdb6ff] to-[#9b7dff]", text: "text-white", size: "text-xl" },
  256: { bg: "bg-gradient-to-br from-[#b7a0ff] to-[#7c5cff]", text: "text-white", size: "text-xl" },
  512: { bg: "bg-gradient-to-br from-[#9bd5ff] to-[#5cb8ff]", text: "text-white", size: "text-xl" },
  1024: { bg: "bg-gradient-to-br from-[#7ce5d6] to-[#3ddccb]", text: "text-white", size: "text-lg" },
  2048: { bg: "bg-gradient-to-br from-[#ffd76b] to-[#ff9b3d] shadow-[0_0_20px_rgba(255,176,69,0.6)]", text: "text-white", size: "text-lg" },
};

function tileStyle(value: number) {
  if (TILE_STYLES[value]) return TILE_STYLES[value];
  return {
    bg: "bg-gradient-to-br from-[#7c5cff] via-[#ff5c7a] to-[#ffd76b] shadow-[0_0_24px_rgba(255,124,164,0.55)]",
    text: "text-white",
    size: "text-base",
  };
}

export function G2048Board({ compact = false }: { compact?: boolean }) {
  const tiles = useG2048((s) => s.tiles);
  const score = useG2048((s) => s.score);
  const best = useG2048((s) => s.best);
  const status = useG2048((s) => s.status);
  const keepPlaying = useG2048((s) => s.keepPlaying);
  const move = useG2048((s) => s.move);
  const restart = useG2048((s) => s.restart);
  const keepGoing = useG2048((s) => s.keepGoing);
  const hydrate = useG2048((s) => s.hydrate);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  // Keyboard.
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const map: Record<string, Direction> = {
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
      // Don't hijack typing in inputs.
      const tag = (document.activeElement as HTMLElement | null)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      e.preventDefault();
      move(dir);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [move]);

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
      if (Math.max(adx, ady) < 24) return; // ignore tiny taps
      if (adx > ady) move(dx > 0 ? "right" : "left");
      else move(dy > 0 ? "down" : "up");
    },
    [move]
  );

  const boardPx = SIZE * CELL + (SIZE + 1) * GAP;

  return (
    <div className={cn("flex flex-col items-center gap-3", compact && "scale-90")}>
      <div className="flex w-full items-center justify-between gap-2 px-1">
        <div className="flex items-center gap-1.5">
          <Badge variant="info" className="font-mono text-[10px] tabular-nums">
            score · {score}
          </Badge>
          <Badge variant="secondary" className="font-mono text-[10px] tabular-nums">
            best · {best}
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

      <div
        className="relative select-none rounded-2xl border border-bg-border bg-bg-elevated/80 p-2 shadow-glass backdrop-blur"
        style={{ width: boardPx, height: boardPx, padding: GAP }}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
        role="application"
        aria-label="2048"
        tabIndex={0}
      >
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-br from-accent/10 via-transparent to-accent-info/10 blur-2xl opacity-60"
        />
        {/* Empty cell grid */}
        <div className="relative grid h-full w-full" style={{ gridTemplateColumns: `repeat(${SIZE}, 1fr)`, gridTemplateRows: `repeat(${SIZE}, 1fr)`, gap: GAP }}>
          {Array.from({ length: SIZE * SIZE }).map((_, i) => (
            <div key={i} className="rounded-lg bg-bg-panel/60" />
          ))}
        </div>

        {/* Tile layer */}
        <div className="pointer-events-none absolute inset-0" style={{ padding: GAP }}>
          <AnimatePresence>
            {tiles
              .filter((t) => t.value > 0)
              .map((t) => (
                <TileNode key={t.id} tile={t} />
              ))}
          </AnimatePresence>
        </div>

        {/* Overlay states */}
        <AnimatePresence>
          {status === "won" && !keepPlaying && (
            <motion.div
              key="won"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 rounded-2xl bg-bg/70 backdrop-blur-sm"
            >
              <div className="flex items-center gap-1.5 font-mono text-xs uppercase tracking-widest text-[#ffd76b]">
                <Sparkles className="size-3.5" aria-hidden />
                you reached 2048
              </div>
              <div className="flex gap-2">
                <Button size="sm" onClick={keepGoing} className="font-mono text-[11px]">
                  keep going
                </Button>
                <Button size="sm" variant="outline" onClick={restart} className="font-mono text-[11px]">
                  new game
                </Button>
              </div>
            </motion.div>
          )}
          {status === "over" && (
            <motion.div
              key="over"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 rounded-2xl bg-bg/70 backdrop-blur-sm"
            >
              <div className="font-mono text-xs uppercase tracking-widest text-accent-bad">no moves left</div>
              <Button size="sm" onClick={restart} className="font-mono text-[11px]">
                try again
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="font-mono text-[10px] text-ink-dim">
        arrows · wasd · swipe to play
      </div>
    </div>
  );
}

const TileNode = memo(
  function TileNode({ tile }: { tile: Tile }) {
    const style = tileStyle(tile.value);
    const x = tile.col * (CELL + GAP);
    const y = tile.row * (CELL + GAP);
    return (
      <motion.div
        initial={tile.isNew ? { scale: 0.3, opacity: 0, x, y } : false}
        animate={{
          x,
          y,
          scale: tile.justMerged ? [1, 1.12, 1] : 1,
          opacity: 1,
        }}
        exit={{ scale: 0.6, opacity: 0 }}
        transition={{
          x: { type: "spring", stiffness: 360, damping: 30 },
          y: { type: "spring", stiffness: 360, damping: 30 },
          scale: { duration: tile.justMerged ? 0.22 : 0.18 },
          opacity: { duration: 0.18 },
        }}
        className={cn(
          "absolute grid place-items-center rounded-lg font-mono font-semibold tabular-nums will-change-transform",
          style.bg,
          style.text,
          style.size
        )}
        style={{ width: CELL, height: CELL }}
      >
        {tile.value}
      </motion.div>
    );
  },
  (prev, next) =>
    prev.tile.id === next.tile.id &&
    prev.tile.row === next.tile.row &&
    prev.tile.col === next.tile.col &&
    prev.tile.value === next.tile.value &&
    !!prev.tile.justMerged === !!next.tile.justMerged
);
