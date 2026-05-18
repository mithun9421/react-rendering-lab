"use client";

import { useState } from "react";
import clsx from "clsx";
import { motion, AnimatePresence } from "framer-motion";

export function BeforeAfter({
  before,
  after,
  labelBefore = "Broken",
  labelAfter = "Fixed",
  initial = "before",
}: {
  before: React.ReactNode;
  after: React.ReactNode;
  labelBefore?: string;
  labelAfter?: string;
  initial?: "before" | "after";
}) {
  const [mode, setMode] = useState<"before" | "after">(initial);

  return (
    <div className="overflow-hidden rounded-xl border border-bg-border bg-bg-panel">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-bg-border bg-bg-subtle px-3 py-2">
        <div className="flex min-w-0 items-center gap-2">
          <span className="font-mono text-[10px] uppercase tracking-widest text-ink-dim">surface</span>
          <span className="truncate font-mono text-xs text-ink">{mode === "before" ? labelBefore : labelAfter}</span>
        </div>
        <div className="flex rounded-md bg-bg-elevated p-0.5">
          <Toggle on={mode === "before"} color="bad" onClick={() => setMode("before")}>
            {labelBefore}
          </Toggle>
          <Toggle on={mode === "after"} color="good" onClick={() => setMode("after")}>
            {labelAfter}
          </Toggle>
        </div>
      </div>
      <div className="relative">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={mode}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.18 }}
            className="p-4"
          >
            {mode === "before" ? before : after}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

function Toggle({
  on,
  color,
  onClick,
  children,
}: {
  on: boolean;
  color: "good" | "bad";
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={clsx(
        "rounded px-3 py-1 text-xs font-medium transition",
        on
          ? color === "bad"
            ? "bg-accent-bad/15 text-accent-bad"
            : "bg-accent-good/15 text-accent-good"
          : "text-ink-muted hover:text-ink"
      )}
    >
      {children}
    </button>
  );
}
