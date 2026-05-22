"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Gamepad2, Minimize2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useTicTacToe } from "./ticTacToeStore";
import { useG2048 } from "./g2048Store";
import { useMemoryGame } from "./memoryStore";
import { useLauncher, type GameId, type LauncherUi } from "./launcherStore";
import { TicTacToeBoard } from "./TicTacToeBoard";
import { G2048Board } from "./G2048Board";
import { MemoryBoard } from "./MemoryBoard";
import { GameLauncher } from "./GameLauncher";

/**
 * Loading-aware boredom buster.
 *
 * Floating pill is always present in the bottom-right. Clicking it opens the
 * game launcher (or directly resumes the last game if one is in progress).
 * If a route navigation has been pending >600ms, the launcher auto-pops so
 * the user has something to do while waiting.
 */

const POPUP_DELAY_MS = 600;

export function BoredomBuster() {
  const pathname = usePathname();
  const ui = useLauncher((s) => s.ui);
  const activeGame = useLauncher((s) => s.activeGame);
  const setUi = useLauncher((s) => s.setUi);
  const setActive = useLauncher((s) => s.setActiveGame);
  const hydrateLauncher = useLauncher((s) => s.hydrate);
  const hydrateTtt = useTicTacToe((s) => s.hydrate);
  const hydrate2048 = useG2048((s) => s.hydrate);
  const hydrateMemory = useMemoryGame((s) => s.hydrate);

  const lastPath = useRef<string | null>(pathname);
  const popupTimer = useRef<number | null>(null);
  const wasNavigating = useRef(false);

  // Initial hydrate + show pill.
  useEffect(() => {
    hydrateLauncher();
    hydrateTtt();
    hydrate2048();
    hydrateMemory();
    setUi("pill");
  }, [hydrateLauncher, hydrateTtt, hydrate2048, hydrateMemory, setUi]);

  // When the pathname resolves, tuck the panel back into the pill.
  useEffect(() => {
    if (lastPath.current !== pathname) {
      lastPath.current = pathname;
      if (popupTimer.current != null) {
        clearTimeout(popupTimer.current);
        popupTimer.current = null;
      }
      if (wasNavigating.current) {
        wasNavigating.current = false;
        window.setTimeout(() => {
          const state = useLauncher.getState();
          if (state.ui === "launcher" || state.ui === "game") setUi("pill");
        }, 350);
      }
    }
  }, [pathname, setUi]);

  // <a> click → arm popup timer.
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
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
      if (href === location.pathname) return;

      wasNavigating.current = true;
      if (popupTimer.current != null) clearTimeout(popupTimer.current);
      popupTimer.current = window.setTimeout(() => {
        const state = useLauncher.getState();
        // Resume the active game if one was in flight; else pop the launcher.
        if (state.ui === "pill" || state.ui === "hidden") {
          setUi(state.activeGame ? "game" : "launcher");
        }
      }, POPUP_DELAY_MS);
    };
    document.addEventListener("click", onClick, { capture: true });
    return () => {
      document.removeEventListener("click", onClick, { capture: true });
      if (popupTimer.current != null) clearTimeout(popupTimer.current);
    };
  }, [setUi]);

  return (
    <>
      <AnimatePresence>
        {(ui === "launcher" || ui === "game") && (
          <Panel
            ui={ui}
            activeGame={activeGame}
            onMinimize={() => setUi("pill")}
            onBack={() => setUi("launcher")}
            onClear={() => setActive(null)}
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {ui === "pill" && (
          <Pill
            activeGame={activeGame}
            onOpen={() => setUi(activeGame ? "game" : "launcher")}
          />
        )}
      </AnimatePresence>
    </>
  );
}

/* ───────────── panel (launcher or active game) ───────────── */

function Panel({
  ui,
  activeGame,
  onMinimize,
  onBack,
  onClear,
}: {
  ui: LauncherUi;
  activeGame: GameId | null;
  onMinimize: () => void;
  onBack: () => void;
  onClear: () => void;
}) {
  const showingGame = ui === "game" && activeGame !== null;
  const title = showingGame ? gameTitle(activeGame) : "boredom buster";
  const subtitle = showingGame ? "page loading — keep playing" : "pick something to play";

  return (
    <motion.div
      key="bb-panel"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[80] flex items-end justify-center px-3 pb-3 sm:items-center sm:p-4"
      aria-modal="true"
      role="dialog"
      aria-label={title}
    >
      <button
        type="button"
        onClick={onMinimize}
        aria-label="minimize"
        className="absolute inset-0 bg-bg/60 backdrop-blur-sm"
      />
      <motion.div
        layoutId="bb-surface"
        initial={{ y: 24, scale: 0.96, opacity: 0 }}
        animate={{ y: 0, scale: 1, opacity: 1 }}
        exit={{ y: 24, scale: 0.96, opacity: 0 }}
        transition={{ type: "spring", stiffness: 280, damping: 26 }}
        className="relative w-full max-w-sm rounded-2xl border border-bg-border bg-bg-panel/95 p-4 shadow-glass backdrop-blur"
      >
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {showingGame ? (
              <Button
                type="button"
                size="icon"
                variant="ghost"
                onClick={() => {
                  onClear();
                  onBack();
                }}
                aria-label="back to launcher"
                title="Pick a different game"
                className="size-7"
              >
                <ArrowLeft className="size-3.5" aria-hidden />
              </Button>
            ) : (
              <span className="grid size-7 place-items-center rounded-lg bg-gradient-to-br from-accent to-accent-info text-white shadow-glass">
                <Gamepad2 className="size-4" aria-hidden />
              </span>
            )}
            <div className="leading-tight">
              <div className="font-mono text-[11px] uppercase tracking-widest text-ink">{title}</div>
              <div className="font-mono text-[10px] text-ink-dim">{subtitle}</div>
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
        {showingGame ? <GameSurface id={activeGame!} /> : <GameLauncher />}
      </motion.div>
    </motion.div>
  );
}

function GameSurface({ id }: { id: GameId }) {
  if (id === "tictactoe") return <TicTacToeBoard />;
  if (id === "2048") return <G2048Board />;
  if (id === "memory") return <MemoryBoard />;
  return null;
}

function gameTitle(id: GameId | null): string {
  if (id === "tictactoe") return "tic-tac-toe";
  if (id === "2048") return "2048";
  if (id === "memory") return "memory match";
  return "boredom buster";
}

/* ───────────── floating pill ───────────── */

function Pill({ activeGame, onOpen }: { activeGame: GameId | null; onOpen: () => void }) {
  return (
    <motion.div
      key="bb-pill"
      layoutId="bb-surface"
      initial={{ opacity: 0, y: 12, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 12, scale: 0.9 }}
      transition={{ type: "spring", stiffness: 280, damping: 26 }}
      className="fixed bottom-3 right-3 z-[60] sm:bottom-4 sm:right-4"
    >
      <motion.button
        type="button"
        onClick={onOpen}
        aria-label="open game launcher"
        animate={activeGame ? { y: [0, -3, 0] } : undefined}
        transition={activeGame ? { duration: 2.4, repeat: Infinity, ease: "easeInOut" } : undefined}
        className="flex items-center gap-2 rounded-full border border-bg-border bg-bg-panel/95 py-1.5 pl-1.5 pr-3 shadow-glass backdrop-blur outline-none focus-visible:ring-2 focus-visible:ring-accent"
      >
        <PillIcon activeGame={activeGame} />
        <span className="hidden font-mono text-[10px] uppercase tracking-widest text-ink-dim sm:inline">
          {activeGame ? `resume · ${gameTitle(activeGame)}` : "play"}
        </span>
      </motion.button>
    </motion.div>
  );
}

function PillIcon({ activeGame }: { activeGame: GameId | null }) {
  if (activeGame === "tictactoe") return <TicTacToeMini />;
  if (activeGame === "2048") return <G2048Mini />;
  if (activeGame === "memory") return <MemoryMini />;
  return (
    <span className="grid size-7 place-items-center rounded-md bg-gradient-to-br from-accent to-accent-info text-white shadow-glass">
      <Gamepad2 className="size-4" aria-hidden />
    </span>
  );
}

function TicTacToeMini() {
  const board = useTicTacToe((s) => s.board);
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

function MemoryMini() {
  const cards = useMemoryGame((s) => s.cards);
  return (
    <span
      className="grid size-7 shrink-0 grid-cols-4 grid-rows-4 gap-px overflow-hidden rounded-md bg-gradient-to-br from-[#ff9bd5]/40 via-bg-elevated to-[#9bd5ff]/40 p-0.5"
      aria-hidden
    >
      {cards.map((c, i) => (
        <span
          key={i}
          className={cn(
            "rounded-[1px]",
            c.state === "matched" && "bg-accent-good/70",
            c.state === "flipped" && "bg-accent-info/70",
            c.state === "hidden" && "bg-bg-panel/80"
          )}
        />
      ))}
    </span>
  );
}

function G2048Mini() {
  const tiles = useG2048((s) => s.tiles);
  // Build 4x4 grid of values from tiles.
  const grid: number[][] = Array.from({ length: 4 }, () => Array.from({ length: 4 }, () => 0));
  for (const t of tiles) if (t.value > 0 && grid[t.row]) grid[t.row][t.col] = t.value;
  return (
    <span
      className="grid size-7 shrink-0 grid-cols-4 grid-rows-4 gap-px overflow-hidden rounded-md bg-gradient-to-br from-[#ffd76b]/30 via-bg-elevated to-[#7c5cff]/30 p-0.5"
      aria-hidden
    >
      {grid.flat().map((v, i) => (
        <span
          key={i}
          className={cn(
            "rounded-[1px]",
            v === 0 && "bg-bg-panel/70",
            v > 0 && v < 32 && "bg-[#ffd6a8]",
            v >= 32 && v < 256 && "bg-[#ff7c93]",
            v >= 256 && v < 2048 && "bg-[#7c5cff]",
            v >= 2048 && "bg-[#ffd76b]"
          )}
        />
      ))}
    </span>
  );
}
