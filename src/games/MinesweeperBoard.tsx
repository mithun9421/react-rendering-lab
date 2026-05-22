"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Flag, RotateCcw, Sparkles, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { useMinesweeper, COLS, ROWS, MINES, type Cell } from "./minesweeperStore";

const CELL = 38;
const GAP = 4;

const NUMBER_STYLE: Record<number, string> = {
  1: "text-[#5cb8ff]",
  2: "text-[#4fd1a9]",
  3: "text-[#ff7a8a]",
  4: "text-[#b48cff]",
  5: "text-[#ff9b5c]",
  6: "text-[#26b8b8]",
  7: "text-[#ff7cc6]",
  8: "text-[#cdb6ff]",
};

export function MinesweeperBoard({ compact = false }: { compact?: boolean }) {
  const grid = useMinesweeper((s) => s.grid);
  const status = useMinesweeper((s) => s.status);
  const flagCount = useMinesweeper((s) => s.flagCount);
  const startedAt = useMinesweeper((s) => s.startedAt);
  const endedAt = useMinesweeper((s) => s.endedAt);
  const bestMs = useMinesweeper((s) => s.bestMs);
  const flagMode = useMinesweeper((s) => s.flagMode);
  const reveal = useMinesweeper((s) => s.reveal);
  const toggleFlag = useMinesweeper((s) => s.toggleFlag);
  const setFlagMode = useMinesweeper((s) => s.setFlagMode);
  const restart = useMinesweeper((s) => s.restart);
  const hydrate = useMinesweeper((s) => s.hydrate);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  // Live timer.
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (status !== "playing" || !startedAt) return;
    const id = window.setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(id);
  }, [status, startedAt]);
  const elapsedMs = startedAt ? (endedAt ?? now) - startedAt : 0;

  const boardW = COLS * CELL + (COLS + 1) * GAP;
  const boardH = ROWS * CELL + (ROWS + 1) * GAP;

  const onCellClick = (i: number, e: React.MouseEvent) => {
    if (e.shiftKey || e.metaKey || e.ctrlKey) {
      toggleFlag(i);
      return;
    }
    reveal(i);
  };

  const onCellContext = (i: number, e: React.MouseEvent) => {
    e.preventDefault();
    toggleFlag(i);
  };

  const minesLeft = Math.max(0, MINES - flagCount);

  return (
    <div className={cn("flex flex-col items-center gap-3", compact && "scale-90")}>
      <div className="flex w-full items-center justify-between gap-2 px-1">
        <div className="flex items-center gap-1.5">
          <Badge variant="warn" className="gap-1 font-mono text-[10px] tabular-nums">
            <span aria-hidden>🌸</span>
            {minesLeft}
          </Badge>
          <Badge variant="info" className="font-mono text-[10px] tabular-nums">
            {(elapsedMs / 1000).toFixed(1)}s
          </Badge>
          {bestMs > 0 && (
            <Badge variant="secondary" className="gap-1 font-mono text-[10px] tabular-nums">
              <Trophy className="size-2.5" aria-hidden /> {(bestMs / 1000).toFixed(1)}s
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-widest text-ink-dim">
            <Flag className="size-3" aria-hidden />
            <Switch checked={flagMode} onCheckedChange={setFlagMode} aria-label="flag mode" />
          </label>
          <Button
            type="button"
            size="icon"
            variant="ghost"
            onClick={restart}
            className="size-7"
            aria-label="new field"
            title="New field"
          >
            <RotateCcw className="size-3.5" aria-hidden />
          </Button>
        </div>
      </div>

      <div
        className="relative select-none rounded-2xl border border-bg-border bg-gradient-to-br from-[#fff5f9]/5 via-bg-elevated to-[#e9f6ff]/5 shadow-glass backdrop-blur"
        style={{ width: boardW, height: boardH, padding: GAP }}
        onContextMenu={(e) => e.preventDefault()}
      >
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-br from-[#ffd1e4]/12 via-transparent to-[#c8e7ff]/12 blur-2xl opacity-60"
        />
        <div
          className="relative grid h-full w-full"
          style={{
            gridTemplateColumns: `repeat(${COLS}, ${CELL}px)`,
            gridAutoRows: `${CELL}px`,
            gap: GAP,
          }}
        >
          {grid.map((cell, i) => (
            <CellTile
              key={cell.id}
              cell={cell}
              status={status}
              flagMode={flagMode}
              onClick={(e) => onCellClick(i, e)}
              onContextMenu={(e) => onCellContext(i, e)}
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
              className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 rounded-2xl bg-bg/70 backdrop-blur-sm"
            >
              <div className="flex items-center gap-1.5 font-mono text-xs uppercase tracking-widest text-accent-good">
                <Sparkles className="size-3.5" aria-hidden />
                garden cleared in {(elapsedMs / 1000).toFixed(1)}s
              </div>
              <Button size="sm" onClick={restart} className="font-mono text-[11px]">
                replant
              </Button>
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
              <div className="font-mono text-xs uppercase tracking-widest text-accent-bad">
                ouch! a bee stung 🐝
              </div>
              <Button size="sm" onClick={restart} className="font-mono text-[11px]">
                try again
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="font-mono text-[10px] text-ink-dim">
        {flagMode ? "tap to plant a flag 🌸" : "tap to reveal · shift-click flags"}
      </div>
    </div>
  );
}

function CellTile({
  cell,
  status,
  flagMode,
  onClick,
  onContextMenu,
}: {
  cell: Cell;
  status: "idle" | "playing" | "won" | "over";
  flagMode: boolean;
  onClick: (e: React.MouseEvent) => void;
  onContextMenu: (e: React.MouseEvent) => void;
}) {
  const c = cell;
  const disabled = c.state === "revealed" || status === "won" || status === "over";
  const delaySec = (c.revealOrder ?? 0) * 0.025;

  return (
    <motion.button
      type="button"
      onClick={onClick}
      onContextMenu={onContextMenu}
      disabled={disabled && c.state === "revealed"}
      whileHover={c.state === "hidden" && status !== "won" && status !== "over" ? { scale: 1.06 } : undefined}
      whileTap={c.state === "hidden" && status !== "won" && status !== "over" ? { scale: 0.92 } : undefined}
      className={cn(
        "relative grid place-items-center rounded-lg transition-colors outline-none focus-visible:ring-2 focus-visible:ring-accent",
        c.state === "hidden" &&
          "border border-white/5 bg-gradient-to-br from-[#7c5cff]/25 via-[#a78bff]/20 to-[#c4b5fd]/25 hover:from-[#7c5cff]/35 hover:via-[#a78bff]/30 hover:to-[#c4b5fd]/35",
        c.state === "flagged" &&
          "border border-[#ff7cc6]/40 bg-gradient-to-br from-[#ffe0ec]/25 to-[#ff7cc6]/20",
        c.state === "revealed" && !c.mine &&
          "border border-bg-border/40 bg-bg-panel/80",
        c.state === "revealed" && c.mine && c.exploded &&
          "border border-accent-bad/60 bg-accent-bad/25 shadow-[0_0_18px_rgba(255,92,122,0.6)]",
        c.state === "revealed" && c.mine && !c.exploded &&
          "border border-accent-bad/40 bg-accent-bad/10",
        flagMode && c.state === "hidden" && "ring-1 ring-[#ff7cc6]/30"
      )}
      style={{ width: CELL, height: CELL }}
      aria-label={
        c.state === "flagged"
          ? "flagged cell"
          : c.state === "revealed"
            ? c.mine
              ? "mine"
              : `${c.adjacent} adjacent mines`
            : "hidden cell"
      }
    >
      <AnimatePresence mode="wait">
        {c.state === "flagged" && (
          <motion.span
            key="flag"
            initial={{ y: -8, opacity: 0, rotate: -20 }}
            animate={{
              y: [0, -2, 0, -1, 0],
              opacity: 1,
              rotate: [0, -8, 6, -4, 0],
            }}
            exit={{ y: -6, opacity: 0 }}
            transition={{
              y: { duration: 0.5, ease: "easeOut" },
              rotate: { duration: 0.5, ease: "easeOut" },
              opacity: { duration: 0.2 },
            }}
            className="text-base"
            aria-hidden
          >
            🌸
          </motion.span>
        )}
        {c.state === "revealed" && c.mine && (
          <motion.span
            key="mine"
            initial={{ scale: 0.3, opacity: 0, rotate: -30 }}
            animate={
              c.exploded
                ? { scale: [0.6, 1.35, 1.1, 1.2], opacity: 1, rotate: [-30, 12, -6, 0] }
                : { scale: 1, opacity: 0.85, rotate: 0 }
            }
            transition={{ duration: c.exploded ? 0.5 : 0.25, ease: "easeOut" }}
            className="text-base"
            aria-hidden
          >
            🐝
          </motion.span>
        )}
        {c.state === "revealed" && !c.mine && c.adjacent > 0 && (
          <motion.span
            key={`n-${c.adjacent}`}
            initial={{ scale: 0.3, opacity: 0, y: 4 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 20, delay: delaySec }}
            className={cn("font-mono text-sm font-bold tabular-nums", NUMBER_STYLE[c.adjacent])}
          >
            {c.adjacent}
          </motion.span>
        )}
        {c.state === "revealed" && !c.mine && c.adjacent === 0 && (
          <motion.span
            key="empty"
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 0.4 }}
            transition={{ duration: 0.2, delay: delaySec }}
            className="text-[10px]"
            aria-hidden
          >
            ·
          </motion.span>
        )}
      </AnimatePresence>
    </motion.button>
  );
}
