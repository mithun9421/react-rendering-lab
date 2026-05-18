"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import clsx from "clsx";
import {
  QUESTIONS,
  pickByCategory,
  type Question,
  type QuestionKind,
} from "@/modules/interview/questions";

type Score = { correct: number; total: number };

const STORAGE_KEY = "rrl:interview-score";
const CATS: { kind: QuestionKind | "all"; label: string; blurb: string }[] = [
  { kind: "all", label: "All", blurb: "Mixed bag — closest to a real interview round" },
  { kind: "debug", label: "Debug", blurb: "Here's a symptom. Find the cause." },
  { kind: "design", label: "Design", blurb: "How would you build / structure X?" },
  { kind: "tradeoff", label: "Trade-off", blurb: "Pick A or B. Defend it." },
  { kind: "internals", label: "Internals", blurb: "Why does React do it this way?" },
];

export default function InterviewPage() {
  const [cat, setCat] = useState<QuestionKind | "all">("all");
  const [seed, setSeed] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [score, setScore] = useState<Score>({ correct: 0, total: 0 });

  // Load saved score
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setScore(JSON.parse(raw));
    } catch {
      /* no-op */
    }
  }, []);

  const question = useMemo(() => pickByCategory(cat, seed), [cat, seed]);
  const correctChoice = useMemo(() => question.choices.find((c) => c.correct === true), [question]);
  const revealed = picked !== null;
  const isCorrect = revealed && picked === correctChoice?.id;

  const commit = (id: string) => {
    if (revealed) return;
    setPicked(id);
    const next: Score = {
      correct: score.correct + (id === correctChoice?.id ? 1 : 0),
      total: score.total + 1,
    };
    setScore(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      /* no-op */
    }
  };

  const nextQuestion = () => {
    setSeed((s) => s + 1);
    setPicked(null);
  };

  return (
    <article className="mx-auto w-full max-w-4xl px-4 pb-24 pt-6 sm:px-6 sm:pt-10">
      <Header score={score} />
      <Categories cat={cat} setCat={(c) => { setCat(c); setSeed(0); setPicked(null); }} />

      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={question.id + seed}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.18 }}
        >
          <QuestionCard
            question={question}
            picked={picked}
            correctId={correctChoice?.id ?? ""}
            commit={commit}
            isCorrect={isCorrect}
          />
        </motion.div>
      </AnimatePresence>

      {revealed && (
        <Reveal
          question={question}
          picked={picked!}
          correctId={correctChoice?.id ?? ""}
          onNext={nextQuestion}
        />
      )}

      <Footer />
    </article>
  );
}

function Header({ score }: { score: Score }) {
  const pct = score.total === 0 ? 0 : Math.round((score.correct / score.total) * 100);
  return (
    <header className="mb-6">
      <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-ink-dim sm:text-[11px]">
        <span>interview mode</span>
        <span>·</span>
        <span className="text-accent">Staff+ / Principal practice</span>
      </div>
      <h1 className="mt-2 text-2xl font-medium tracking-tight sm:text-3xl md:text-4xl">
        Spar with the question bank
      </h1>
      <p className="mt-3 max-w-2xl text-sm leading-relaxed text-ink-muted sm:text-base">
        Twelve scenarios drawn from real React / frontend systems interview rounds. Commit to an
        answer before reading the model — the rationale rewards the pause. Score persists locally;
        clear it any time.
      </p>
      <div className="mt-4 flex flex-wrap items-center gap-3 rounded-lg border border-bg-border bg-bg-panel p-3">
        <div className="flex items-baseline gap-1.5 font-mono">
          <span className="text-[10px] uppercase tracking-wider text-ink-dim">score</span>
          <span className="text-xl tabular-nums text-accent">{score.correct}</span>
          <span className="text-sm text-ink-muted">/ {score.total}</span>
          <span className="ml-1 text-[10px] text-ink-dim">({pct}%)</span>
        </div>
        <span className="ml-auto font-mono text-[10px] text-ink-dim">
          {QUESTIONS.length} questions in bank
        </span>
      </div>
    </header>
  );
}

function Categories({
  cat,
  setCat,
}: {
  cat: QuestionKind | "all";
  setCat: (c: QuestionKind | "all") => void;
}) {
  return (
    <div className="mb-6 grid gap-2 sm:grid-cols-3 lg:grid-cols-5">
      {CATS.map((c) => (
        <button
          key={c.kind}
          onClick={() => setCat(c.kind)}
          className={clsx(
            "rounded-lg border p-3 text-left text-xs transition active:scale-[0.99]",
            cat === c.kind
              ? "border-accent/50 bg-accent/10"
              : "border-bg-border bg-bg-panel hover:border-accent/30 hover:bg-bg-elevated"
          )}
        >
          <div
            className={clsx(
              "font-mono text-[10px] uppercase tracking-widest",
              cat === c.kind ? "text-accent" : "text-ink-dim"
            )}
          >
            {c.label}
          </div>
          <div className="mt-1 text-[11px] leading-snug text-ink-muted">{c.blurb}</div>
        </button>
      ))}
    </div>
  );
}

function QuestionCard({
  question,
  picked,
  correctId,
  commit,
  isCorrect,
}: {
  question: Question;
  picked: string | null;
  correctId: string;
  commit: (id: string) => void;
  isCorrect: boolean;
}) {
  const revealed = picked !== null;
  return (
    <section className="rounded-xl border border-bg-border bg-bg-panel">
      <header className="flex flex-wrap items-center justify-between gap-2 border-b border-bg-border bg-bg-subtle px-4 py-3">
        <div className="flex flex-wrap items-center gap-2">
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
      </header>

      <div className="p-4">
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
            const showCorrect = revealed && c.id === correctId;
            const showWrong = revealed && isPicked && !c.correct;
            return (
              <li key={c.id}>
                <button
                  onClick={() => commit(c.id)}
                  disabled={revealed}
                  className={clsx(
                    "w-full rounded-md border px-3 py-2.5 text-left text-sm transition active:scale-[0.99]",
                    !revealed && "border-bg-border bg-bg-elevated hover:border-accent/40 hover:bg-bg-panel text-ink-muted",
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
                    {showCorrect && (
                      <span className="font-mono text-[10px] text-accent-good">✓ model</span>
                    )}
                    {showWrong && <span className="font-mono text-[10px] text-accent-bad">✗</span>}
                  </span>
                </button>
                {revealed && isPicked && (
                  <p className="mt-1.5 rounded-md bg-bg-subtle px-3 py-2 font-mono text-[11px] leading-relaxed text-ink-muted">
                    {c.rationale}
                  </p>
                )}
              </li>
            );
          })}
        </ul>

        {revealed && (
          <div
            className={clsx(
              "mt-4 rounded-md px-3 py-2 font-mono text-[11px] uppercase tracking-widest",
              isCorrect ? "bg-accent-good/15 text-accent-good" : "bg-accent-warn/15 text-accent-warn"
            )}
          >
            {isCorrect ? "✓ matched the model answer" : "your pick differed — read the model below"}
          </div>
        )}
      </div>
    </section>
  );
}

function Reveal({
  question,
  picked,
  correctId,
  onNext,
}: {
  question: Question;
  picked: string;
  correctId: string;
  onNext: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, delay: 0.08 }}
      className="mt-4 space-y-3"
    >
      <div className="rounded-lg border border-accent/30 bg-accent/5 p-4">
        <div className="mb-1 font-mono text-[10px] uppercase tracking-widest text-accent">
          model answer
        </div>
        <p className="text-sm leading-relaxed text-ink">{question.modelAnswer}</p>
        {question.modules && question.modules.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {question.modules.map((slug) => (
              <Link
                key={slug}
                href={`/lab/${slug}`}
                className="rounded-md border border-bg-border bg-bg-elevated px-2 py-1 font-mono text-[10px] uppercase tracking-widest text-ink-muted hover:text-ink"
              >
                deep dive · {slug}
              </Link>
            ))}
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
        <span className="font-mono text-ink-dim">
          you picked <span className="text-ink">{picked}</span> · model was{" "}
          <span className="text-accent-good">{correctId}</span>
        </span>
        <button
          onClick={onNext}
          className="rounded-md bg-accent px-3 py-1.5 font-mono text-[11px] text-white active:scale-95"
        >
          next question →
        </button>
      </div>
    </motion.div>
  );
}

function Footer() {
  return (
    <nav className="mt-12 flex flex-wrap items-center justify-between gap-3 border-t border-bg-border pt-6 text-sm">
      <Link href="/lab/journey" className="text-ink-muted hover:text-ink">
        ← back to the Journey
      </Link>
      <Link
        href="/lab/25-incident-simulator"
        className="rounded-lg border border-bg-border bg-bg-panel px-4 py-3 hover:border-accent/50 hover:bg-bg-elevated"
      >
        <span className="block font-mono text-[10px] uppercase tracking-widest text-accent/80">
          live-fire practice
        </span>
        <span className="block">Production incident simulator →</span>
      </Link>
    </nav>
  );
}
