"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import clsx from "clsx";
import { QUESTIONS } from "@/modules/interview/questions";
import { useProgress } from "@/progress/store";

/**
 * /lab/daily — one curated question per day, deterministic by date.
 *
 * Same question for everyone visiting on the same UTC day; rotates at midnight UTC.
 * Correct answers add streak XP + count toward the "Interview-ready" achievement.
 *
 * Free for everyone. Pro upgrade (when shipped) will unlock archive + monthly
 * perfect-attendance badge.
 */
export default function DailyChallenge() {
  const recordQuiz = useProgress((s) => s.recordQuiz);
  const quizScores = useProgress((s) => s.quizScores);

  const today = useMemo(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  }, []);

  // Deterministic pick: hash today's date string into the question pool.
  const question = useMemo(() => {
    let h = 0;
    for (let i = 0; i < today.length; i++) h = (h * 31 + today.charCodeAt(i)) | 0;
    const idx = Math.abs(h) % QUESTIONS.length;
    return QUESTIONS[idx];
  }, [today]);

  const correctChoice = useMemo(
    () => question.choices.find((c) => c.correct === true),
    [question]
  );

  const quizId = `daily:${today}:${question.id}`;
  const priorScore = quizScores[quizId];

  const [picked, setPicked] = useState<string | null>(
    priorScore ? (priorScore.bestPct === 100 ? "__already__" : null) : null
  );

  useEffect(() => {
    // Reload prior pick on hydration — quizScores fills in after ProgressBoot runs.
    if (priorScore?.bestPct === 100 && picked === null) setPicked("__already__");
  }, [priorScore, picked]);

  const revealed = picked !== null;
  const isCorrect = picked === correctChoice?.id || picked === "__already__";

  const commit = (id: string) => {
    if (revealed) return;
    setPicked(id);
    const correct = id === correctChoice?.id ? 1 : 0;
    recordQuiz(quizId, correct, 1);
  };

  return (
    <article className="mx-auto w-full max-w-3xl px-4 pb-24 pt-6 sm:px-6 sm:pt-10">
      <header className="mb-8">
        <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-ink-dim sm:text-[11px]">
          <span>daily challenge</span>
          <span>·</span>
          <span className="text-accent-warn">{today}</span>
        </div>
        <h1 className="mt-2 text-2xl font-medium tracking-tight sm:text-3xl md:text-4xl">
          One question per day. Don&apos;t break the streak.
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-ink-muted">
          Same question for everyone visiting today. New one tomorrow at midnight UTC. Counts
          toward your streak and the &quot;Interview-ready&quot; achievement.
        </p>
      </header>

      <section className="rounded-xl border border-bg-border bg-bg-panel">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-bg-border bg-bg-subtle px-4 py-3">
          <div className="flex items-center gap-2">
            <span
              className={clsx(
                "rounded-md px-2 py-0.5 font-mono text-[10px] uppercase tracking-widest",
                question.kind === "debug" && "bg-accent-bad/15 text-accent-bad",
                question.kind === "design" && "bg-accent-info/15 text-accent-info",
                question.kind === "tradeoff" && "bg-accent-warn/15 text-accent-warn",
                question.kind === "internals" && "bg-accent/15 text-accent"
              )}
            >
              {question.kind}
            </span>
            <span className="font-mono text-[10px] uppercase tracking-widest text-ink-dim">
              difficulty {question.difficulty}/5
            </span>
          </div>
          {priorScore && (
            <span
              className={clsx(
                "rounded-md px-2 py-0.5 font-mono text-[10px] uppercase tracking-widest",
                priorScore.bestPct === 100
                  ? "bg-accent-good/15 text-accent-good"
                  : "bg-accent-warn/15 text-accent-warn"
              )}
            >
              {priorScore.bestPct === 100 ? "answered ✓" : "attempted"}
            </span>
          )}
        </div>

        <div className="p-5">
          <h2 className="text-lg font-medium text-ink">{question.title}</h2>
          <p className="mt-2 text-sm leading-relaxed text-ink-muted">{question.scenario}</p>
          {question.code && (
            <pre className="mt-3 overflow-x-auto rounded-md border border-bg-border bg-bg-elevated p-3 font-mono text-[11px] leading-relaxed text-ink">
              {question.code}
            </pre>
          )}

          <ul className="mt-4 space-y-2">
            {question.choices.map((c) => {
              const isPicked = picked === c.id;
              const showCorrect = revealed && c.id === correctChoice?.id;
              const showWrong = revealed && isPicked && !c.correct;
              return (
                <li key={c.id}>
                  <button
                    onClick={() => commit(c.id)}
                    disabled={revealed}
                    className={clsx(
                      "w-full rounded-md border px-3 py-2.5 text-left text-sm transition active:scale-[0.99]",
                      !revealed && "border-bg-border bg-bg-elevated text-ink-muted hover:border-accent/40 hover:text-ink",
                      showCorrect && "border-accent-good/40 bg-accent-good/10 text-ink",
                      showWrong && "border-accent-bad/40 bg-accent-bad/10 text-ink",
                      revealed && !showCorrect && !showWrong && "opacity-60"
                    )}
                  >
                    <span className="flex items-start gap-2">
                      <span
                        className={clsx(
                          "mt-0.5 font-mono text-[10px] uppercase tracking-widest",
                          showCorrect ? "text-accent-good" : showWrong ? "text-accent-bad" : "text-ink-dim"
                        )}
                      >
                        {c.id}
                      </span>
                      <span className="flex-1">{c.text}</span>
                    </span>
                  </button>
                  {revealed && isPicked && c.rationale && (
                    <p className="mt-1.5 rounded-md bg-bg-subtle px-3 py-2 font-mono text-[11px] leading-relaxed text-ink-muted">
                      {c.rationale}
                    </p>
                  )}
                </li>
              );
            })}
          </ul>

          {revealed && picked !== "__already__" && (
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              className={clsx(
                "mt-4 rounded-md p-3 text-sm",
                isCorrect
                  ? "border border-accent-good/30 bg-accent-good/5 text-ink"
                  : "border border-accent-warn/30 bg-accent-warn/5 text-ink"
              )}
            >
              <div
                className={clsx(
                  "mb-1 font-mono text-[10px] uppercase tracking-widest",
                  isCorrect ? "text-accent-good" : "text-accent-warn"
                )}
              >
                {isCorrect ? "✓ +5 XP · streak preserved" : "✗ try again tomorrow"}
              </div>
              <p className="text-sm leading-relaxed">{question.modelAnswer}</p>
            </motion.div>
          )}
          {picked === "__already__" && (
            <div className="mt-4 rounded-md border border-accent-good/30 bg-accent-good/5 p-3 text-sm text-ink-muted">
              You already answered today&apos;s challenge correctly. Come back tomorrow for the next.
            </div>
          )}
        </div>
      </section>

      <nav className="mt-12 flex flex-wrap items-center justify-between gap-3 border-t border-bg-border pt-6 text-sm">
        <Link href="/lab" className="text-ink-muted hover:text-ink">
          ← lab hub
        </Link>
        <Link
          href="/lab/interview"
          className="rounded-lg border border-bg-border bg-bg-panel px-4 py-3 hover:border-accent/50 hover:bg-bg-elevated"
        >
          <span className="block font-mono text-[10px] uppercase tracking-widest text-accent/80">want more?</span>
          <span className="block">Full interview bank →</span>
        </Link>
      </nav>
    </article>
  );
}
