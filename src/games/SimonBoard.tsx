"use client";

import { memo, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, RotateCcw, Sparkles, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  PADS,
  SHOW_GAP_MS,
  SHOW_POST_MS,
  flashDurationFor,
  useSimon,
  type PadId,
  type SimonStatus,
} from "./simonStore";

type PadStyle = {
  base: string;
  flash: string;
  ringFlash: string;
  emoji: string;
};

const PAD_STYLES: PadStyle[] = [
  {
    base: "bg-gradient-to-br from-[#3fa9b8] to-[#1d6f7e]",
    flash:
      "bg-gradient-to-br from-[#8be3ee] to-[#3fa9b8] shadow-[0_0_28px_rgba(63,169,184,0.7)]",
    ringFlash: "ring-2 ring-[#8be3ee]",
    emoji: "💧",
  },
  {
    base: "bg-gradient-to-br from-[#ffae3d] to-[#d97a1c]",
    flash:
      "bg-gradient-to-br from-[#ffe27a] to-[#ffae3d] shadow-[0_0_28px_rgba(255,180,80,0.75)]",
    ringFlash: "ring-2 ring-[#ffe27a]",
    emoji: "☀️",
  },
  {
    base: "bg-gradient-to-br from-[#ff7c93] to-[#c64670]",
    flash:
      "bg-gradient-to-br from-[#ffbfd0] to-[#ff7c93] shadow-[0_0_28px_rgba(255,124,147,0.7)]",
    ringFlash: "ring-2 ring-[#ffbfd0]",
    emoji: "🌸",
  },
  {
    base: "bg-gradient-to-br from-[#9b7dff] to-[#5f4dc7]",
    flash:
      "bg-gradient-to-br from-[#cdb6ff] to-[#9b7dff] shadow-[0_0_28px_rgba(155,125,255,0.75)]",
    ringFlash: "ring-2 ring-[#cdb6ff]",
    emoji: "🌙",
  },
];

const BOARD_PX = 220;
const PAD_PX = (BOARD_PX - 24) / 2; // 12px outer pad + small gap between

export function SimonBoard({ compact = false }: { compact?: boolean }) {
  const sequence = useSimon((s) => s.sequence);
  const status = useSimon((s) => s.status);
  const showingStep = useSimon((s) => s.showingStep);
  const flashPad = useSimon((s) => s.flashPad);
  const flashKey = useSimon((s) => s.flashKey);
  const progress = useSimon((s) => s.progress);
  const best = useSimon((s) => s.best);
  const start = useSimon((s) => s.start);
  const tap = useSimon((s) => s.tap);
  const showStep = useSimon((s) => s.showStep);
  const hydrate = useSimon((s) => s.hydrate);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  // Drive the 'showing' phase: walk through `sequence`, flashing each pad,
  // then hand control to the player.
  const showRunRef = useRef(0);
  useEffect(() => {
    if (status !== "showing") return;
    const myRun = ++showRunRef.current;
    const level = sequence.length;
    const flashMs = flashDurationFor(level);
    const timeouts: number[] = [];

    sequence.forEach((_, i) => {
      timeouts.push(
        window.setTimeout(
          () => {
            if (showRunRef.current !== myRun) return;
            showStep(i);
          },
          i * (flashMs + SHOW_GAP_MS)
        )
      );
      timeouts.push(
        window.setTimeout(
          () => {
            if (showRunRef.current !== myRun) return;
            showStep(-1);
          },
          i * (flashMs + SHOW_GAP_MS) + flashMs
        )
      );
    });
    // Hand over to player.
    timeouts.push(
      window.setTimeout(
        () => {
          if (showRunRef.current !== myRun) return;
          showStep(-1);
          useSimon.setState({ status: "waiting" });
        },
        sequence.length * (flashMs + SHOW_GAP_MS) + SHOW_POST_MS
      )
    );

    return () => {
      // Cancel ongoing showing; force the run id forward so any still-queued
      // callbacks above see they're stale.
      showRunRef.current = myRun + 1;
      timeouts.forEach((t) => clearTimeout(t));
    };
  }, [status, sequence, showStep]);

  const showingPad: PadId | null =
    status === "showing" && showingStep >= 0 ? sequence[showingStep] : null;
  const level = sequence.length;
  const banner =
    status === "idle"
      ? "ready when you are"
      : status === "showing"
        ? `watch · round ${level}`
        : status === "waiting"
          ? `your turn · ${progress + 1}/${level}`
          : `that's not it · best ${best}`;

  return (
    <div className={cn("flex flex-col items-center gap-3", compact && "scale-90")}>
      <div className="flex w-full items-center justify-between gap-2 px-1">
        <div className="flex flex-wrap items-center gap-1.5">
          <Badge variant="info" className="font-mono text-[10px] tabular-nums">
            round · {Math.max(1, level)}
          </Badge>
          {best > 0 && (
            <Badge variant="warn" className="gap-1 font-mono text-[10px] tabular-nums">
              <Trophy className="size-2.5" aria-hidden /> {best}
            </Badge>
          )}
        </div>
        <Button
          type="button"
          size="icon"
          variant="ghost"
          onClick={start}
          className="size-7"
          aria-label="restart"
          title="Restart"
        >
          <RotateCcw className="size-3.5" aria-hidden />
        </Button>
      </div>

      <div
        className="relative overflow-hidden rounded-3xl border border-bg-border bg-gradient-to-br from-[#1c1a30] via-[#16142a] to-[#0c0b1c] p-3 shadow-glass"
        style={{ width: BOARD_PX, height: BOARD_PX }}
      >
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(124,92,255,0.08),transparent_60%)]"
        />
        <div className="relative grid h-full w-full grid-cols-2 grid-rows-2 gap-2">
          {(Array.from({ length: PADS }) as undefined[]).map((_, i) => {
            const padId = i as PadId;
            const isFlashing = showingPad === padId;
            const isTapFlash = flashPad === padId;
            return (
              <Pad
                key={padId}
                id={padId}
                style={PAD_STYLES[padId]}
                isFlashing={isFlashing || isTapFlash}
                tapFlashKey={isTapFlash ? flashKey : -1}
                disabled={status !== "waiting" && status !== "idle"}
                onTap={tap}
              />
            );
          })}
        </div>

        {/* Center disc with status / start button */}
        <div className="pointer-events-none absolute inset-0 grid place-items-center">
          <CenterBadge status={status} onStart={start} banner={banner} progress={progress} level={level} />
        </div>
      </div>

      <div className="flex h-4 items-center gap-1.5 font-mono text-[11px]">
        <Sparkles
          className={cn(
            "size-3",
            status === "showing" && "text-accent-info animate-pulse",
            status === "waiting" && "text-accent-warn",
            status === "over" && "text-accent-bad",
            status === "idle" && "text-ink-dim"
          )}
          aria-hidden
        />
        <span
          className={cn(
            status === "showing" && "text-accent-info",
            status === "waiting" && "text-accent-warn",
            status === "over" && "text-accent-bad",
            status === "idle" && "text-ink-dim"
          )}
        >
          {banner}
        </span>
      </div>
    </div>
  );
}

/* ───────────── pads ───────────── */

const Pad = memo(
  function Pad({
    id,
    style,
    isFlashing,
    tapFlashKey,
    disabled,
    onTap,
  }: {
    id: PadId;
    style: PadStyle;
    isFlashing: boolean;
    tapFlashKey: number;
    disabled: boolean;
    onTap: (id: PadId) => void;
  }) {
    // Use a brief key bump to retrigger the flash animation on repeat taps.
    return (
      <motion.button
        type="button"
        onClick={() => onTap(id)}
        disabled={disabled}
        whileHover={!disabled && !isFlashing ? { scale: 1.025 } : undefined}
        whileTap={!disabled ? { scale: 0.96 } : undefined}
        animate={{
          scale: isFlashing ? 1.04 : 1,
        }}
        transition={{ duration: 0.14, ease: "easeOut" }}
        className={cn(
          "relative grid place-items-center rounded-2xl outline-none transition-[box-shadow,background] duration-150 focus-visible:ring-2 focus-visible:ring-white/60",
          isFlashing ? style.flash : style.base,
          isFlashing && style.ringFlash
        )}
        style={{ width: PAD_PX, height: PAD_PX }}
        aria-label={`pad ${id + 1}`}
      >
        <motion.span
          key={`${id}-${tapFlashKey}-${isFlashing ? "f" : "r"}`}
          initial={{ scale: 1 }}
          animate={{ scale: isFlashing ? [1, 1.18, 1] : 1 }}
          transition={{ duration: 0.22, ease: "easeOut" }}
          className={cn(
            "text-2xl drop-shadow-[0_0_6px_rgba(0,0,0,0.45)]",
            !isFlashing && "opacity-80"
          )}
        >
          {style.emoji}
        </motion.span>
      </motion.button>
    );
  },
  (prev, next) =>
    prev.id === next.id &&
    prev.isFlashing === next.isFlashing &&
    prev.tapFlashKey === next.tapFlashKey &&
    prev.disabled === next.disabled &&
    prev.onTap === next.onTap
);

function CenterBadge({
  status,
  onStart,
  banner,
  progress,
  level,
}: {
  status: SimonStatus;
  onStart: () => void;
  banner: string;
  progress: number;
  level: number;
}) {
  void banner;
  return (
    <AnimatePresence mode="wait">
      {(status === "idle" || status === "over") && (
        <motion.button
          key="start"
          type="button"
          onClick={onStart}
          initial={{ scale: 0.7, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.7, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 22 }}
          className="pointer-events-auto grid size-14 place-items-center rounded-full border border-white/15 bg-bg-panel/90 text-white shadow-glass backdrop-blur"
          aria-label={status === "over" ? "play again" : "start"}
        >
          <Play className="size-5 -translate-x-px" aria-hidden />
        </motion.button>
      )}
      {(status === "showing" || status === "waiting") && (
        <motion.div
          key="hud"
          initial={{ scale: 0.85, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.85, opacity: 0 }}
          transition={{ duration: 0.18 }}
          className="grid size-14 place-items-center rounded-full border border-white/10 bg-bg-panel/85 text-center font-mono text-[10px] uppercase tracking-widest text-ink-dim shadow-glass backdrop-blur"
        >
          <span className="leading-tight">
            <span className="block text-sm font-semibold text-ink">{progress}/{level}</span>
            <span className="text-[8px] text-ink-dim">round</span>
          </span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
