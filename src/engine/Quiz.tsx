"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useProgress } from "@/progress/store";

/**
 * <Quiz/> — in-context knowledge check. Drop inside any <Step/> body to test
 * the reader on what they just read. Multi-choice; one correct answer; rationale
 * per option after commit.
 *
 * Scoring + XP: when the user picks, the result feeds the global progress store
 * (5 XP per correct, capped at one award per quiz so retries don't grind).
 */

export type QuizOption = {
  id: string;
  text: string;
  correct?: true;
  rationale: string;
};

export type QuizProps = {
  /** Stable id — used as the storage key. Convention: `${moduleSlug}:q${n}`. */
  id: string;
  prompt: string;
  options: QuizOption[];
  /** Optional snippet rendered above the options. */
  code?: string;
};

export function Quiz({ id, prompt, options, code }: QuizProps) {
  const [picked, setPicked] = useState<string | null>(null);
  const recordQuiz = useProgress((s) => s.recordQuiz);
  const priorScore = useProgress((s) => s.quizScores[id]);

  const correctId = options.find((o) => o.correct)?.id ?? "";
  const isCorrect = picked === correctId;
  const revealed = picked !== null;

  const commit = (optId: string) => {
    if (revealed) return;
    setPicked(optId);
    const correct = optId === correctId ? 1 : 0;
    recordQuiz(id, correct, 1);
  };

  const reset = () => setPicked(null);

  return (
    <div className="not-prose my-4 overflow-hidden rounded-lg border border-accent/30 bg-accent/[0.04]">
      <header className="flex flex-wrap items-center justify-between gap-2 border-b border-accent/20 bg-accent/[0.06] px-3 py-2 text-xs">
        <div className="flex items-center gap-2">
          <span className="font-mono text-[10px] uppercase tracking-widest text-accent">
            ▦ quick check
          </span>
          {priorScore && (
            <span className="rounded bg-accent-good/15 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider text-accent-good">
              best · {Math.round(priorScore.bestPct)}%
            </span>
          )}
        </div>
        <span className="font-mono text-[10px] text-ink-dim">+5 XP if correct</span>
      </header>

      <div className="p-4">
        <p className="text-sm font-medium text-ink">{prompt}</p>
        {code && (
          <pre className="mt-2 overflow-x-auto rounded-md border border-bg-border bg-bg-elevated p-3 font-mono text-[11px] leading-relaxed text-ink-muted">
            {code}
          </pre>
        )}

        <ul className="mt-3 space-y-1.5">
          {options.map((o) => {
            const isPicked = picked === o.id;
            const showRight = revealed && o.id === correctId;
            const showWrong = revealed && isPicked && !o.correct;
            return (
              <li key={o.id}>
                <button
                  type="button"
                  onClick={() => commit(o.id)}
                  disabled={revealed}
                  className={cn(
                    "flex w-full items-start gap-2 rounded-md border px-3 py-2 text-left text-xs transition active:scale-[0.99]",
                    !revealed && "border-bg-border bg-bg-elevated text-ink-muted hover:border-accent/40 hover:text-ink",
                    showRight && "border-accent-good/40 bg-accent-good/10 text-ink",
                    showWrong && "border-accent-bad/40 bg-accent-bad/10 text-ink",
                    revealed && !showRight && !showWrong && "opacity-60"
                  )}
                >
                  <span
                    className={cn(
                      "mt-0.5 font-mono text-[10px] uppercase tracking-widest",
                      showRight ? "text-accent-good" : showWrong ? "text-accent-bad" : "text-ink-dim"
                    )}
                  >
                    {o.id}
                  </span>
                  <span className="flex-1">{o.text}</span>
                </button>
                <AnimatePresence>
                  {revealed && isPicked && o.rationale && (
                    <motion.p
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden px-3 pt-1.5 font-mono text-[10px] leading-relaxed text-ink-muted"
                    >
                      {o.rationale}
                    </motion.p>
                  )}
                </AnimatePresence>
              </li>
            );
          })}
        </ul>

        {revealed && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-3 flex items-center justify-between gap-2 rounded-md px-3 py-2 text-xs"
          >
            <span
              className={cn(
                "font-mono uppercase tracking-widest",
                isCorrect ? "text-accent-good" : "text-accent-warn"
              )}
            >
              {isCorrect ? "✓ +5 XP" : "✗ read the rationale above"}
            </span>
            <button
              onClick={reset}
              className="rounded-md border border-bg-border bg-bg-elevated px-2 py-1 font-mono text-[10px] text-ink-muted hover:text-ink"
            >
              try again
            </button>
          </motion.div>
        )}
      </div>
    </div>
  );
}
