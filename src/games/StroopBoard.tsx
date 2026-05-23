"use client";

import { memo, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, RotateCcw, Sparkles, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { COLOURS, ROUND_MS, useStroop, type Colour } from "./stroopStore";

const COLOUR_HEX: Record<Colour, string> = {
  red: "#ff5c7a",
  blue: "#4fa3ff",
  green: "#4dd498",
  yellow: "#ffd233",
};

const COLOUR_LABEL: Record<Colour, string> = {
  red: "RED",
  blue: "BLUE",
  green: "GREEN",
  yellow: "YELLOW",
};

const BOARD_W = 280;

export function StroopBoard({ compact = false }: { compact?: boolean }) {
  const prompt = useStroop((s) => s.prompt);
  const status = useStroop((s) => s.status);
  const score = useStroop((s) => s.score);
  const streak = useStroop((s) => s.streak);
  const best = useStroop((s) => s.best);
  const bestStreak = useStroop((s) => s.bestStreak);
  const startedAt = useStroop((s) => s.startedAt);
  const tapFeedback = useStroop((s) => s.tapFeedback);
  const feedbackKey = useStroop((s) => s.feedbackKey);
  const start = useStroop((s) => s.start);
  const tap = useStroop((s) => s.tap);
  const endRound = useStroop((s) => s.endRound);
  const hydrate = useStroop((s) => s.hydrate);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  // Drive countdown — tick every 100ms while playing.
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (status !== "playing" || !startedAt) return;
    const id = window.setInterval(() => setNow(Date.now()), 100);
    return () => clearInterval(id);
  }, [status, startedAt]);
  const elapsed = status === "playing" && startedAt ? now - startedAt : 0;
  const remaining = Math.max(0, ROUND_MS - elapsed);
  useEffect(() => {
    if (status === "playing" && remaining === 0) endRound();
  }, [status, remaining, endRound]);

  const pct = (remaining / ROUND_MS) * 100;
  const seconds = remaining / 1000;

  return (
    <div className={cn("flex flex-col items-center gap-3", compact && "scale-90")}>
      <div className="flex w-full items-center justify-between gap-2 px-1" style={{ maxWidth: BOARD_W }}>
        <div className="flex flex-wrap items-center gap-1.5">
          <Badge variant="info" className="font-mono text-[10px] tabular-nums">
            score · {score}
          </Badge>
          {streak >= 3 && (
            <Badge variant="warn" className="gap-1 font-mono text-[10px]">
              <Sparkles className="size-2.5" aria-hidden /> ×{streak}
            </Badge>
          )}
          {best !== 0 && (
            <Badge variant="secondary" className="gap-1 font-mono text-[10px] tabular-nums">
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
        className="relative overflow-hidden rounded-3xl border border-bg-border bg-gradient-to-br from-[#15131e] via-[#1a1830] to-[#0d0b1c] p-4 shadow-glass"
        style={{ width: BOARD_W, minHeight: 200 }}
      >
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_30%,rgba(124,92,255,0.12),transparent_60%)]"
        />
        {/* Timer bar */}
        <div className="relative mb-3 h-1.5 overflow-hidden rounded-full bg-bg-panel/70">
          <motion.div
            className="h-full rounded-full"
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.1, ease: "linear" }}
            style={{
              background:
                "linear-gradient(90deg, #4dd498 0%, #ffd233 55%, #ff5c7a 100%)",
            }}
          />
        </div>

        {/* Center prompt */}
        <div className="relative grid h-24 place-items-center">
          <AnimatePresence mode="wait">
            {status === "playing" && prompt ? (
              <motion.div
                key={prompt.id}
                initial={{ scale: 0.7, opacity: 0, y: 8 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.8, opacity: 0, y: -8 }}
                transition={{ type: "spring", stiffness: 320, damping: 22 }}
                className="font-mono text-4xl font-extrabold uppercase tracking-widest"
                style={{ color: COLOUR_HEX[prompt.ink], textShadow: `0 0 28px ${COLOUR_HEX[prompt.ink]}55` }}
              >
                {COLOUR_LABEL[prompt.word]}
              </motion.div>
            ) : status === "idle" ? (
              <motion.div
                key="idle"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center"
              >
                <div className="font-mono text-[11px] uppercase tracking-widest text-ink-dim">
                  tap the colour, ignore the word
                </div>
                <div className="mt-1 font-mono text-[10px] text-ink-muted">
                  20 seconds · how many can you nail?
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="over"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center"
              >
                <div className="flex items-center justify-center gap-1.5 font-mono text-xs uppercase tracking-widest text-accent-good">
                  <Sparkles className="size-3.5" aria-hidden />
                  +{score} in 20s
                </div>
                {bestStreak >= 3 && (
                  <div className="mt-1 font-mono text-[10px] text-ink-dim">
                    best streak ×{bestStreak}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Feedback flash */}
        <AnimatePresence>
          {tapFeedback && (
            <motion.div
              key={feedbackKey}
              initial={{ opacity: 0.55 }}
              animate={{ opacity: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.32, ease: "easeOut" }}
              className={cn(
                "pointer-events-none absolute inset-0 rounded-3xl",
                tapFeedback === "correct" ? "bg-accent-good/30" : "bg-accent-bad/30"
              )}
            />
          )}
        </AnimatePresence>

        {/* Colour pads / start */}
        <div className="relative mt-3 flex items-center justify-center gap-2">
          {status === "playing" ? (
            COLOURS.map((c) => (
              <ColourPad key={c} colour={c} onTap={tap} />
            ))
          ) : (
            <motion.button
              type="button"
              onClick={start}
              whileHover={{ scale: 1.06 }}
              whileTap={{ scale: 0.94 }}
              className="grid h-12 w-32 place-items-center gap-2 rounded-2xl bg-gradient-to-br from-accent to-accent-info font-mono text-xs uppercase tracking-widest text-white shadow-glass"
            >
              <span className="inline-flex items-center gap-1.5">
                <Play className="size-3.5" aria-hidden />
                {status === "over" ? "play again" : "start"}
              </span>
            </motion.button>
          )}
        </div>

        {/* Live timer in corner */}
        {status === "playing" && (
          <div className="pointer-events-none absolute right-3 top-3 font-mono text-[10px] tabular-nums text-ink-dim">
            {seconds.toFixed(1)}s
          </div>
        )}
      </div>

      <div className="font-mono text-[10px] text-ink-dim">
        tap the ink colour · not what the word reads
      </div>
    </div>
  );
}

const ColourPad = memo(
  function ColourPad({ colour, onTap }: { colour: Colour; onTap: (c: Colour) => void }) {
    return (
      <motion.button
        type="button"
        onClick={() => onTap(colour)}
        whileHover={{ scale: 1.06, y: -2 }}
        whileTap={{ scale: 0.92 }}
        transition={{ type: "spring", stiffness: 360, damping: 22 }}
        className="grid size-12 place-items-center rounded-2xl outline-none shadow-glass focus-visible:ring-2 focus-visible:ring-white/70"
        style={{
          backgroundColor: COLOUR_HEX[colour],
          boxShadow: `0 0 18px ${COLOUR_HEX[colour]}55, inset 0 -3px 6px rgba(0,0,0,0.3), inset 0 3px 6px rgba(255,255,255,0.35)`,
        }}
        aria-label={`tap ${colour}`}
      />
    );
  },
  (prev, next) => prev.colour === next.colour && prev.onTap === next.onTap
);
