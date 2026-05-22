"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

/**
 * <ArchitectGate/> — wraps a "fix" or reveal behind a reflection prompt.
 *
 * Default mode: the prompt is collapsed; tap "Reveal" to skip (the lab still works fast).
 * Architect Mode (persisted in localStorage): the prompt MUST be filled with at least
 * 12 characters before the reveal slot mounts. The point isn't grading — it's the pause.
 *
 * Use sparingly. One gate per module, always before the "fix" / "next bottleneck" step.
 */
type Question =
  | "why-this-approach"
  | "tradeoffs"
  | "what-scales-poorly"
  | "next-bottleneck"
  | "ten-million-users";

const QUESTION_LABEL: Record<Question, string> = {
  "why-this-approach": "Why this approach?",
  tradeoffs: "What are the tradeoffs?",
  "what-scales-poorly": "What scales poorly here?",
  "next-bottleneck": "What new bottleneck will this expose?",
  "ten-million-users": "Would this still work at 10M users?",
};

export function ArchitectGate({
  prompts = ["why-this-approach", "tradeoffs", "next-bottleneck"],
  children,
}: {
  prompts?: Question[];
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const architectMode = useArchitectMode();

  const enoughAnswered = prompts.every((p) => (answers[p] ?? "").trim().length >= 12);

  if (revealed || (!architectMode && !open)) {
    if (!revealed) {
      return (
        <div className="rounded-lg border border-dashed border-bg-border bg-bg-subtle p-4 text-sm">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="font-mono text-[11px] uppercase tracking-widest text-accent">
              architect mode {architectMode ? "on" : "off"}
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setOpen(true)}
                className="rounded-md border border-bg-border bg-bg-elevated px-3 py-1.5 font-mono text-[11px] active:scale-95"
              >
                think first
              </button>
              <button
                onClick={() => setRevealed(true)}
                className="rounded-md bg-accent px-3 py-1.5 font-mono text-[11px] text-white active:scale-95"
              >
                reveal →
              </button>
            </div>
          </div>
          <p className="mt-2 text-[12px] text-ink-muted">
            Reflection beats memorisation. Toggle Architect Mode at the bottom dock to make this
            gate required everywhere.
          </p>
        </div>
      );
    }
    return <>{children}</>;
  }

  return (
    <div className="rounded-lg border border-accent/30 bg-accent/[0.05] p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="font-mono text-[11px] uppercase tracking-widest text-accent">
          architect mode · pause to reason
        </span>
        <button
          onClick={() => setOpen(false)}
          className="font-mono text-[11px] text-ink-dim hover:text-ink"
        >
          dismiss
        </button>
      </div>
      <div className="mt-3 space-y-3">
        {prompts.map((p) => (
          <label key={p} className="block">
            <span className="block text-[12px] font-medium text-ink">{QUESTION_LABEL[p]}</span>
            <textarea
              rows={2}
              value={answers[p] ?? ""}
              onChange={(e) => setAnswers((a) => ({ ...a, [p]: e.target.value }))}
              placeholder="just a sentence is enough — the point is to commit to a hypothesis"
              className="mt-1 w-full rounded-md border border-bg-border bg-bg-elevated px-3 py-2 font-mono text-[12px] placeholder:text-ink-dim focus:outline-none focus:ring-2 focus:ring-accent/40"
            />
          </label>
        ))}
      </div>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
        <span className="font-mono text-[10px] text-ink-dim">
          {Object.values(answers).filter((v) => v.trim().length >= 12).length} / {prompts.length}{" "}
          committed
        </span>
        <button
          disabled={!enoughAnswered}
          onClick={() => setRevealed(true)}
          className={cn(
            "rounded-md px-3 py-1.5 font-mono text-[11px] active:scale-95",
            enoughAnswered
              ? "bg-accent-good text-bg"
              : "cursor-not-allowed bg-bg-elevated text-ink-dim"
          )}
        >
          {enoughAnswered ? "reveal the fix →" : "12+ chars each, then reveal"}
        </button>
      </div>
    </div>
  );
}

/* ---------- Architect-mode toggle (persisted) ---------- */

const STORAGE_KEY = "rrl:architect-mode";

export function useArchitectMode() {
  const [on, setOn] = useState(false);
  useEffect(() => {
    try {
      setOn(localStorage.getItem(STORAGE_KEY) === "1");
    } catch {
      // no-op
    }
  }, []);
  return on;
}

export function ArchitectModeToggle() {
  const [on, setOn] = useState(false);
  useEffect(() => {
    try {
      setOn(localStorage.getItem(STORAGE_KEY) === "1");
    } catch {
      // no-op
    }
  }, []);
  const toggle = () => {
    const next = !on;
    setOn(next);
    try {
      localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
    } catch {
      // no-op
    }
    // Hot-broadcast via a custom event so other components can react without a re-render dance
    window.dispatchEvent(new CustomEvent("rrl:architect-mode", { detail: next }));
  };
  return (
    <button
      onClick={toggle}
      className={cn(
        "rounded-md border px-2 py-1 font-mono text-[10px] uppercase tracking-widest",
        on ? "border-accent/50 bg-accent/10 text-accent" : "border-bg-border text-ink-muted"
      )}
      title="Architect mode forces the reflection prompt before any fix reveal"
    >
      <AnimatePresence initial={false} mode="wait">
        <motion.span
          key={on ? "on" : "off"}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.12 }}
        >
          arch · {on ? "ON" : "off"}
        </motion.span>
      </AnimatePresence>
    </button>
  );
}
