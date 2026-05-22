"use client";

import { memo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Lightbulb, RotateCcw, Shuffle, Sparkles, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useWordScramble, SLOTS, type Letter } from "./wordScrambleStore";

const TILE = 44;
const GAP = 6;

export function WordScrambleBoard({ compact = false }: { compact?: boolean }) {
  const word = useWordScramble((s) => s.word);
  const pool = useWordScramble((s) => s.pool);
  const slots = useWordScramble((s) => s.slots);
  const status = useWordScramble((s) => s.status);
  const hintsUsed = useWordScramble((s) => s.hintsUsed);
  const solved = useWordScramble((s) => s.solved);
  const streak = useWordScramble((s) => s.streak);
  const bestStreak = useWordScramble((s) => s.bestStreak);
  const pickFromPool = useWordScramble((s) => s.pickFromPool);
  const pickFromSlot = useWordScramble((s) => s.pickFromSlot);
  const hint = useWordScramble((s) => s.hint);
  const next = useWordScramble((s) => s.next);
  const shuffle = useWordScramble((s) => s.shuffle);
  const hydrate = useWordScramble((s) => s.hydrate);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  const boardW = SLOTS * TILE + (SLOTS - 1) * GAP;

  return (
    <div className={cn("flex flex-col items-center gap-3", compact && "scale-90")}>
      <div className="flex w-full items-center justify-between gap-2 px-1">
        <div className="flex flex-wrap items-center gap-1.5">
          <Badge variant="info" className="font-mono text-[10px] tabular-nums">
            solved · {solved}
          </Badge>
          {streak >= 2 && (
            <Badge variant="warn" className="gap-1 font-mono text-[10px]">
              <Sparkles className="size-2.5" aria-hidden /> ×{streak}
            </Badge>
          )}
          {bestStreak >= 3 && streak < 2 && (
            <Badge variant="secondary" className="gap-1 font-mono text-[10px]">
              <Trophy className="size-2.5" aria-hidden /> best ×{bestStreak}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-1">
          <Button
            type="button"
            size="icon"
            variant="ghost"
            onClick={shuffle}
            disabled={status === "won"}
            className="size-7"
            aria-label="shuffle letters"
            title="Reshuffle"
          >
            <Shuffle className="size-3.5" aria-hidden />
          </Button>
          <Button
            type="button"
            size="icon"
            variant="ghost"
            onClick={hint}
            disabled={status === "won"}
            className="size-7"
            aria-label="hint"
            title="Reveal a letter"
          >
            <Lightbulb className="size-3.5" aria-hidden />
          </Button>
          <Button
            type="button"
            size="icon"
            variant="ghost"
            onClick={next}
            className="size-7"
            aria-label="new word"
            title="Skip / new word"
          >
            <RotateCcw className="size-3.5" aria-hidden />
          </Button>
        </div>
      </div>

      {/* Answer slots */}
      <motion.div
        animate={status === "wrong" ? { x: [0, -6, 6, -4, 4, 0] } : { x: 0 }}
        transition={{ duration: 0.42, ease: "easeInOut" }}
        className="flex items-center gap-1.5"
        style={{ width: boardW }}
      >
        {slots.map((letter, i) => (
          <Slot
            key={i}
            idx={i}
            letter={letter}
            won={status === "won"}
            wrong={status === "wrong"}
            onTap={pickFromSlot}
          />
        ))}
      </motion.div>

      {/* Pool */}
      <div
        className="relative flex flex-wrap items-center justify-center gap-1.5 rounded-xl border border-bg-border bg-bg-elevated/60 p-2"
        style={{ minWidth: boardW, minHeight: TILE + 16 }}
      >
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-xl bg-gradient-to-br from-accent-info/8 via-transparent to-accent-warn/8 blur-2xl opacity-60"
        />
        <AnimatePresence>
          {pool.map((letter) => (
            <PoolTile key={letter.id} letter={letter} onTap={pickFromPool} disabled={status === "won"} />
          ))}
          {pool.length === 0 && status === "playing" && (
            <motion.span
              key="ready"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="font-mono text-[10px] uppercase tracking-widest text-ink-dim"
            >
              tap a slot to undo
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {status === "won" && (
          <motion.div
            key="won"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center gap-2"
          >
            <div className="flex items-center gap-1.5 font-mono text-xs uppercase tracking-widest text-accent-good">
              <Sparkles className="size-3.5" aria-hidden />
              {word.toLowerCase()}!
              {hintsUsed > 0 && (
                <span className="text-ink-dim">· {hintsUsed} hint{hintsUsed > 1 ? "s" : ""}</span>
              )}
            </div>
            <Button size="sm" onClick={next} className="font-mono text-[11px]">
              next word →
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {status !== "won" && (
        <div className="font-mono text-[10px] text-ink-dim">
          {SLOTS} letters · tap to place · tap a slot to undo
        </div>
      )}
    </div>
  );
}

/* ───────────── tiles ───────────── */

const Slot = memo(
  function Slot({
    idx,
    letter,
    won,
    wrong,
    onTap,
  }: {
    idx: number;
    letter: Letter | null;
    won: boolean;
    wrong: boolean;
    onTap: (i: number) => void;
  }) {
    return (
      <button
        type="button"
        onClick={() => onTap(idx)}
        disabled={won || !letter || letter.locked}
        className={cn(
          "relative grid place-items-center rounded-xl border-2 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-accent",
          letter
            ? letter.locked
              ? "border-[#ffd76b]/70 bg-[#ffe7a3]/15"
              : won
                ? "border-accent-good/60 bg-accent-good/15"
                : wrong
                  ? "border-accent-bad/60 bg-accent-bad/15"
                  : "border-accent/50 bg-bg-elevated/80 hover:border-accent"
            : "border-dashed border-bg-border bg-bg-panel/40"
        )}
        style={{ width: TILE, height: TILE }}
        aria-label={letter ? `slot ${idx + 1}: ${letter.ch}` : `slot ${idx + 1} empty`}
      >
        {letter ? (
          <motion.span
            layoutId={`letter-${letter.id}`}
            transition={{ type: "spring", stiffness: 380, damping: 28 }}
            className={cn(
              "font-mono text-xl font-semibold uppercase",
              letter.locked
                ? "text-[#ffd76b]"
                : won
                  ? "text-accent-good"
                  : "text-ink"
            )}
          >
            {letter.ch}
          </motion.span>
        ) : (
          <span className="font-mono text-[10px] text-ink-dim">·</span>
        )}
      </button>
    );
  },
  (prev, next) =>
    prev.idx === next.idx &&
    prev.letter?.id === next.letter?.id &&
    prev.letter?.ch === next.letter?.ch &&
    !!prev.letter?.locked === !!next.letter?.locked &&
    prev.won === next.won &&
    prev.wrong === next.wrong &&
    prev.onTap === next.onTap
);

const PoolTile = memo(
  function PoolTile({
    letter,
    onTap,
    disabled,
  }: {
    letter: Letter;
    onTap: (id: number) => void;
    disabled: boolean;
  }) {
    return (
      <motion.button
        type="button"
        onClick={() => onTap(letter.id)}
        disabled={disabled}
        initial={{ scale: 0.7, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.6, opacity: 0 }}
        whileHover={!disabled ? { y: -3, scale: 1.05 } : undefined}
        whileTap={!disabled ? { scale: 0.94 } : undefined}
        transition={{ type: "spring", stiffness: 360, damping: 24 }}
        className="grid place-items-center rounded-xl bg-gradient-to-br from-[#ffc7e0] via-[#cdb6ff] to-[#9bd5ff] font-mono text-xl font-semibold uppercase text-[#3b1f59] shadow-glass outline-none will-change-transform focus-visible:ring-2 focus-visible:ring-accent"
        style={{ width: TILE, height: TILE }}
        aria-label={`letter ${letter.ch}`}
      >
        <motion.span layoutId={`letter-${letter.id}`} transition={{ type: "spring", stiffness: 380, damping: 28 }}>
          {letter.ch}
        </motion.span>
      </motion.button>
    );
  },
  (prev, next) =>
    prev.letter.id === next.letter.id &&
    prev.letter.ch === next.letter.ch &&
    prev.disabled === next.disabled &&
    prev.onTap === next.onTap
);
