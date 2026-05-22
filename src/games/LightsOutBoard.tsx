"use client";

import { memo, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { RotateCcw, Moon, Sparkles, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useLightsOut, SIZE } from "./lightsOutStore";

const CELL = 44;
const GAP = 6;

export function LightsOutBoard({ compact = false }: { compact?: boolean }) {
  const grid = useLightsOut((s) => s.grid);
  const nonces = useLightsOut((s) => s.toggleNonce);
  const moves = useLightsOut((s) => s.moves);
  const bestMoves = useLightsOut((s) => s.bestMoves);
  const bestMs = useLightsOut((s) => s.bestMs);
  const startedAt = useLightsOut((s) => s.startedAt);
  const endedAt = useLightsOut((s) => s.endedAt);
  const status = useLightsOut((s) => s.status);
  const toggle = useLightsOut((s) => s.toggle);
  const restart = useLightsOut((s) => s.restart);
  const hydrate = useLightsOut((s) => s.hydrate);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  const elapsedSec = useElapsed(startedAt, endedAt, status);
  const litCount = grid.filter(Boolean).length;
  const boardW = SIZE * CELL + (SIZE + 1) * GAP;
  const boardH = boardW;

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
          aria-label="new puzzle"
          title="New puzzle"
        >
          <RotateCcw className="size-3.5" aria-hidden />
        </Button>
      </div>

      <div
        className="relative select-none overflow-hidden rounded-2xl border border-[#3b2870]/60 bg-gradient-to-br from-[#1a1135] via-[#2a1b5a] to-[#0e0a25] shadow-glass"
        style={{ width: boardW, height: boardH, padding: GAP }}
      >
        {/* starry backdrop */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,200,120,0.08),transparent_50%),radial-gradient(circle_at_70%_80%,rgba(180,140,255,0.1),transparent_55%)]"
        />
        <div
          className="relative grid h-full w-full"
          style={{
            gridTemplateColumns: `repeat(${SIZE}, ${CELL}px)`,
            gridAutoRows: `${CELL}px`,
            gap: GAP,
          }}
        >
          {grid.map((on, i) => (
            <LightCell
              key={i}
              idx={i}
              on={on}
              nonce={nonces[i] ?? 0}
              onClick={toggle}
              disabled={status === "won"}
            />
          ))}
        </div>

        <AnimatePresence>
          {status === "won" && (
            <motion.div
              key="won"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 rounded-2xl bg-bg/55 backdrop-blur-sm"
            >
              <div className="flex items-center gap-1.5 font-mono text-xs uppercase tracking-widest text-[#ffd76b]">
                <Moon className="size-3.5" aria-hidden />
                all stars resting · {moves} moves
              </div>
              <Button size="sm" onClick={restart} className="font-mono text-[11px]">
                new sky
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="flex h-4 items-center gap-1.5 font-mono text-[11px]">
        <Sparkles className={cn("size-3", litCount === 0 ? "text-[#ffd76b]" : "text-ink-dim")} aria-hidden />
        <span className={cn(litCount === 0 ? "text-[#ffd76b]" : "text-ink-dim")}>
          {litCount === 0 ? "the night is still" : `${litCount} star${litCount === 1 ? "" : "s"} still shining`}
        </span>
      </div>
    </div>
  );
}

const LightCell = memo(
  function LightCell({
    idx,
    on,
    nonce,
    onClick,
    disabled,
  }: {
    idx: number;
    on: boolean;
    nonce: number;
    onClick: (i: number) => void;
    disabled: boolean;
  }) {
    return (
      <motion.button
        type="button"
        onClick={() => onClick(idx)}
        disabled={disabled}
        whileHover={!disabled ? { scale: 1.06 } : undefined}
        whileTap={!disabled ? { scale: 0.92 } : undefined}
        animate={{
          // bounce when nonce changes (i.e. this cell just toggled)
          scale: nonce > 0 ? [1.16, 1] : 1,
        }}
        transition={{ duration: 0.24, ease: "easeOut" }}
        // forces a transition retrigger when the nonce changes — without this,
        // tapping the same cell twice doesn't replay the bounce.
        key={`${idx}-${nonce}`}
        className={cn(
          "relative grid place-items-center rounded-xl border outline-none transition-colors will-change-transform focus-visible:ring-2 focus-visible:ring-[#ffd76b]",
          on
            ? "border-[#ffd76b]/60 bg-gradient-to-br from-[#ffe7a3] via-[#ffc05c] to-[#ff8a3d] shadow-[0_0_18px_rgba(255,200,90,0.55),inset_0_0_8px_rgba(255,255,255,0.45)]"
            : "border-white/5 bg-gradient-to-br from-[#1f1640]/80 to-[#0d0820]/80"
        )}
        style={{ width: CELL, height: CELL }}
        aria-label={on ? "star on" : "star off"}
      >
        <span
          className={cn(
            "text-base transition-opacity",
            on ? "opacity-95" : "opacity-25"
          )}
          aria-hidden
        >
          {on ? "✦" : "·"}
        </span>
        {on && (
          <motion.span
            aria-hidden
            className="pointer-events-none absolute inset-0 rounded-xl"
            initial={{ opacity: 0.55 }}
            animate={{ opacity: [0.55, 0.85, 0.55] }}
            transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut" }}
            style={{
              background:
                "radial-gradient(circle at 50% 40%, rgba(255,230,160,0.5), transparent 60%)",
            }}
          />
        )}
      </motion.button>
    );
  },
  (prev, next) =>
    prev.idx === next.idx &&
    prev.on === next.on &&
    prev.nonce === next.nonce &&
    prev.disabled === next.disabled &&
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
