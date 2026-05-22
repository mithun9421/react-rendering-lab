"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Gamepad2, Minimize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useTicTacToe } from "./ticTacToeStore";
import { TicTacToeBoard } from "./TicTacToeBoard";

/**
 * Loading-aware boredom buster.
 *
 * Behavior:
 *   1. Mounted globally. Hydrates persisted state (board, turn, score).
 *   2. Listens for same-origin <a> click — starts a 600ms timer.
 *   3. If the pathname has not changed before 600ms, the game pops up in the
 *      center. As soon as the new path resolves, the panel animates to a
 *      floating pill in the bottom-right.
 *   4. The pill is the always-on resume button — click it any time to restore
 *      the full panel and keep playing.
 *   5. User can ✕ to hush for the session.
 *
 * The pill stays available even if the page loads fast (we just don't auto-pop)
 * so the user can always launch a game manually from the corner.
 */

const POPUP_DELAY_MS = 600;

export function BoredomBuster() {
  const pathname = usePathname();
  const ui = useTicTacToe((s) => s.ui);
  const hushed = useTicTacToe((s) => s.hushed);
  const setUi = useTicTacToe((s) => s.setUi);
  const hydrate = useTicTacToe((s) => s.hydrate);

  const lastPath = useRef<string | null>(pathname);
  const popupTimer = useRef<number | null>(null);
  const wasNavigating = useRef(false);

  // Hydrate persisted state once on mount.
  useEffect(() => {
    hydrate();
    setUi("pill");
  }, [hydrate, setUi]);

  // When the pathname resolves, demote any open popup back to the pill.
  useEffect(() => {
    if (lastPath.current !== pathname) {
      lastPath.current = pathname;
      if (popupTimer.current != null) {
        clearTimeout(popupTimer.current);
        popupTimer.current = null;
      }
      if (wasNavigating.current) {
        wasNavigating.current = false;
        // If the user opened the popup automatically, slide it back to the pill.
        // (If they opened it manually we don't intrude — leave it open.)
        // We can't distinguish here cheaply, so use a small delay to allow the
        // new page to paint before tucking the game away.
        window.setTimeout(() => {
          // Only auto-minimize if it's still in the open state and not hushed.
          const state = useTicTacToe.getState();
          if (state.ui === "open" && state.status === "playing") setUi("pill");
        }, 350);
      }
    }
  }, [pathname, setUi]);

  // Click listener: anytime a same-origin <a> click starts navigation, arm the
  // popup timer. If the new path doesn't resolve in POPUP_DELAY_MS, pop the game.
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (hushed) return;
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      if (e.button !== 0) return;
      const target = e.target as HTMLElement | null;
      const a = target?.closest("a");
      if (!a) return;
      const href = a.getAttribute("href");
      if (!href) return;
      if (a.target === "_blank") return;
      if (a.hasAttribute("download")) return;
      if (href.startsWith("mailto:") || href.startsWith("tel:") || href.startsWith("javascript:") || href.startsWith("#")) return;
      if (href.startsWith("http") && !href.includes(location.host)) return;
      // Same path — no navigation will happen.
      if (href === location.pathname) return;

      wasNavigating.current = true;
      if (popupTimer.current != null) clearTimeout(popupTimer.current);
      popupTimer.current = window.setTimeout(() => {
        const state = useTicTacToe.getState();
        if (!state.hushed && state.ui !== "open") setUi("open");
      }, POPUP_DELAY_MS);
    };
    document.addEventListener("click", onClick, { capture: true });
    return () => {
      document.removeEventListener("click", onClick, { capture: true });
      if (popupTimer.current != null) clearTimeout(popupTimer.current);
    };
  }, [hushed, setUi]);

  if (hushed) return null;

  return (
    <>
      <AnimatePresence>
        {ui === "open" && <OpenPanel onMinimize={() => setUi("pill")} />}
      </AnimatePresence>
      <AnimatePresence>
        {ui === "pill" && <Pill onOpen={() => setUi("open")} />}
      </AnimatePresence>
    </>
  );
}

/* ───────────── open panel ───────────── */

function OpenPanel({ onMinimize }: { onMinimize: () => void }) {
  return (
    <motion.div
      key="ttt-open"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[80] flex items-end justify-center px-3 pb-3 sm:items-center sm:p-4"
      aria-modal="true"
      role="dialog"
      aria-label="Tic-Tac-Toe — boredom buster"
    >
      {/* dim backdrop — click to minimize */}
      <button
        type="button"
        onClick={onMinimize}
        aria-label="minimize game"
        className="absolute inset-0 bg-bg/60 backdrop-blur-sm"
      />
      <motion.div
        layoutId="ttt-surface"
        initial={{ y: 24, scale: 0.96, opacity: 0 }}
        animate={{ y: 0, scale: 1, opacity: 1 }}
        exit={{ y: 24, scale: 0.96, opacity: 0 }}
        transition={{ type: "spring", stiffness: 280, damping: 26 }}
        className="relative w-full max-w-sm rounded-2xl border border-bg-border bg-bg-panel/95 p-4 shadow-glass backdrop-blur"
      >
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="grid size-7 place-items-center rounded-lg bg-gradient-to-br from-accent to-accent-info text-white shadow-glass">
              <Gamepad2 className="size-4" aria-hidden />
            </span>
            <div className="leading-tight">
              <div className="font-mono text-[11px] uppercase tracking-widest text-ink">tic-tac-toe</div>
              <div className="font-mono text-[10px] text-ink-dim">page is loading — pass the time</div>
            </div>
          </div>
          <Button
            type="button"
            size="icon"
            variant="ghost"
            onClick={onMinimize}
            aria-label="minimize"
            className="size-7"
            title="Minimize"
          >
            <Minimize2 className="size-3.5" aria-hidden />
          </Button>
        </div>
        <TicTacToeBoard />
      </motion.div>
    </motion.div>
  );
}

/* ───────────── floating pill ───────────── */

function Pill({ onOpen }: { onOpen: () => void }) {
  const board = useTicTacToe((s) => s.board);
  const status = useTicTacToe((s) => s.status);
  const turn = useTicTacToe((s) => s.turn);

  const inProgress = status === "playing" && board.some((c) => c !== null);
  const label = inProgress
    ? turn === "X"
      ? "your move"
      : "bot thinking"
    : status === "win-x"
      ? "you won!"
      : status === "win-o"
        ? "rematch?"
        : status === "draw"
          ? "rematch?"
          : "play a round";

  return (
    <motion.div
      key="ttt-pill"
      layoutId="ttt-surface"
      initial={{ opacity: 0, y: 12, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 12, scale: 0.9 }}
      transition={{ type: "spring", stiffness: 280, damping: 26 }}
      className="fixed bottom-3 right-3 z-[60] sm:bottom-4 sm:right-4"
    >
      <motion.button
        type="button"
        onClick={onOpen}
        aria-label="open tic-tac-toe game"
        animate={inProgress ? { y: [0, -3, 0] } : undefined}
        transition={inProgress ? { duration: 2.4, repeat: Infinity, ease: "easeInOut" } : undefined}
        className="flex items-center gap-2 rounded-full border border-bg-border bg-bg-panel/95 py-1.5 pl-1.5 pr-3 shadow-glass backdrop-blur outline-none focus-visible:ring-2 focus-visible:ring-accent"
      >
        <MiniBoard board={board} />
        <span className="hidden font-mono text-[10px] uppercase tracking-widest text-ink-dim sm:inline">
          {label}
        </span>
      </motion.button>
    </motion.div>
  );
}

function MiniBoard({ board }: { board: ("X" | "O" | null)[] }) {
  return (
    <span
      className="grid size-7 shrink-0 grid-cols-3 grid-rows-3 gap-px overflow-hidden rounded-md bg-gradient-to-br from-accent/30 via-bg-elevated to-accent-info/20 p-0.5"
      aria-hidden
    >
      {board.map((c, i) => (
        <span
          key={i}
          className={cn(
            "rounded-[2px] bg-bg-panel",
            c === "X" && "bg-accent-info/70",
            c === "O" && "bg-accent-warn/70"
          )}
        />
      ))}
    </span>
  );
}
