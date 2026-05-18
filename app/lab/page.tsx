"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import clsx from "clsx";
import { FOUNDATIONS, MODULES } from "@/modules/registry";
import { QUESTIONS } from "@/modules/interview/questions";
import { computeStreak, levelOf, useProgress } from "@/progress/store";
import { SiteFooter } from "@/shell/SiteFooter";

/**
 * The lab hub — five buckets with live progress.
 *
 * Renders client-side because all the numbers come from localStorage. On the
 * server it shows zeros; on hydration the real numbers fade in. ProgressBoot
 * (mounted in app/layout.tsx) already pinged today's visit by the time this
 * effect runs.
 */
export default function LabHub() {
  const completedLessons = useProgress((s) => s.completedLessons);
  const quizScores = useProgress((s) => s.quizScores);
  const xp = useProgress((s) => s.xp);
  const visits = useProgress((s) => s.visits);
  const hydrated = useProgress((s) => s.hydrated);
  const reset = useProgress((s) => s.resetAll);

  const [confirmReset, setConfirmReset] = useState(false);

  const foundationsDone = FOUNDATIONS.filter((m) => completedLessons[m.slug]).length;
  const coreDone = MODULES.filter((m) => completedLessons[m.slug]).length;
  const quizTaken = Object.keys(quizScores).length;
  const quizAvg =
    quizTaken === 0
      ? 0
      : Object.values(quizScores).reduce((a, q) => a + q.bestPct, 0) / quizTaken;

  const { level, into, toNext } = levelOf(xp);
  const streak = computeStreak(visits);

  return (
    <main className="relative min-h-screen overflow-x-hidden grid-bg">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[280px] bg-[radial-gradient(ellipse_at_top,rgba(124,92,255,0.16),transparent_60%)]" />

      <article className="relative mx-auto w-full max-w-6xl px-4 pb-24 pt-10 sm:px-6 sm:pt-16">
        <header className="mb-8">
          <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-ink-dim sm:text-[11px]">
            <span>lab hub</span>
            <span>·</span>
            <span className="text-accent">your progress</span>
          </div>
          <h1 className="mt-2 text-3xl font-medium tracking-tight sm:text-4xl md:text-5xl">
            Pick a bucket. Track your run.
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-ink-muted sm:text-base">
            Five tracks across foundations, performance, journey, interview prep, and in-context
            knowledge checks. Your XP, streak, and completion state live in your browser&apos;s
            localStorage — clear it anytime.
          </p>
        </header>

        <StatsRow
          level={level}
          xp={xp}
          into={into}
          toNext={toNext}
          streak={streak}
          hydrated={hydrated}
          onReset={() => (confirmReset ? reset() : setConfirmReset(true))}
          confirmReset={confirmReset}
          setConfirmReset={setConfirmReset}
        />

        <div className="mt-8 grid gap-4 md:grid-cols-2">
          <Bucket
            tone="foundations"
            href={`/lab/${FOUNDATIONS[0].slug}`}
            tag="foundations"
            title="The React course"
            subtitle="JSX → props → state → effects → hooks → rules"
            blurb="End-to-end React fundamentals. If you've written useState more than once, you can probably skip — but most working devs find a gap or two."
            progress={foundationsDone}
            total={FOUNDATIONS.length}
          />
          <Bucket
            tone="core"
            href="/lab/01-reconciliation"
            tag="performance"
            title="The performance / systems modules"
            subtitle="25 modules · the bottleneck chain"
            blurb="Reconciliation through incident response. Every fix exposes the next bottleneck — the original lab."
            progress={coreDone}
            total={MODULES.length}
          />
          <Bucket
            tone="journey"
            href="/lab/journey"
            tag="journey"
            title="The Journey — watch it evolve"
            subtitle="11 stages · one dashboard"
            blurb="Same Dashboard, eleven progressive states. The visual proof of the bottleneck chain. 20-30 minutes."
            progress={completedLessons["lab:journey"] ? 1 : 0}
            total={1}
            cta="Open the Journey"
          />
          <Bucket
            tone="interview"
            href="/lab/interview"
            tag="interview"
            title="The Question Bank"
            subtitle={`${QUESTIONS.length} curated · debug / design / tradeoff / internals`}
            blurb="Drawn from real Staff+/Principal rounds. Multi-choice with rationale on every option — the wrong answers do most of the teaching."
            progress={quizTaken}
            total={QUESTIONS.length}
            cta="Start the bank"
            secondary={quizTaken > 0 ? `${Math.round(quizAvg)}% average best` : undefined}
          />
        </div>

        <div className="mt-4">
          <Bucket
            tone="incident"
            href="/lab/25-incident-simulator"
            tag="oncall"
            title="Live-fire — the Incident Simulator"
            subtitle="6 scenarios · diagnose / fix / validate / postmortem"
            blurb="The capstone. Pick an incident, walk the on-call playbook, score yourself against the model post-mortem."
            cta="Drop into on-call"
            wide
          />
        </div>

        <p className="mt-8 font-mono text-[11px] text-ink-dim">
          Knowledge checks are sprinkled inside the lessons themselves. Look for the{" "}
          <span className="rounded bg-accent/10 px-1.5 py-0.5 font-mono text-[10px] text-accent">▦ quick check</span>{" "}
          card.
        </p>
      </article>

      <SiteFooter />
    </main>
  );
}

function StatsRow({
  level,
  xp,
  into,
  toNext,
  streak,
  hydrated,
  onReset,
  confirmReset,
  setConfirmReset,
}: {
  level: number;
  xp: number;
  into: number;
  toNext: number;
  streak: number;
  hydrated: boolean;
  onReset: () => void;
  confirmReset: boolean;
  setConfirmReset: (v: boolean) => void;
}) {
  // tiny hydration cleanup — render zeros pre-hydration to keep SSR identical to client
  const _xp = hydrated ? xp : 0;
  const _streak = hydrated ? streak : 0;
  return (
    <div className="rounded-xl border border-bg-border bg-bg-panel p-4">
      <div className="flex flex-wrap items-center gap-6">
        <div>
          <div className="font-mono text-[10px] uppercase tracking-widest text-ink-dim">level</div>
          <div className="mt-1 font-mono text-3xl tabular-nums text-accent">{level}</div>
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline justify-between">
            <span className="font-mono text-[10px] uppercase tracking-widest text-ink-dim">
              {_xp} XP
            </span>
            <span className="font-mono text-[10px] text-ink-dim">
              {toNext} to level {level + 1}
            </span>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-bg-elevated">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${into}%` }}
              transition={{ type: "spring", stiffness: 160, damping: 22 }}
              className="h-full bg-accent"
            />
          </div>
        </div>
        <div className="text-center">
          <div className="font-mono text-[10px] uppercase tracking-widest text-ink-dim">streak</div>
          <div className="mt-1 flex items-center gap-1 font-mono text-2xl tabular-nums text-accent-warm">
            <span>{_streak}</span>
            <span className="text-base">🔥</span>
          </div>
        </div>
        <div>
          <button
            onClick={onReset}
            className={clsx(
              "rounded-md border px-2 py-1 font-mono text-[10px] uppercase tracking-widest active:scale-95",
              confirmReset
                ? "border-accent-bad/40 bg-accent-bad/10 text-accent-bad"
                : "border-bg-border bg-bg-elevated text-ink-dim hover:text-ink"
            )}
            onBlur={() => setConfirmReset(false)}
          >
            {confirmReset ? "click again to confirm" : "reset progress"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Bucket({
  tone,
  href,
  tag,
  title,
  subtitle,
  blurb,
  progress = 0,
  total = 0,
  cta = "Open",
  secondary,
  wide = false,
}: {
  tone: "foundations" | "core" | "journey" | "interview" | "incident";
  href: string;
  tag: string;
  title: string;
  subtitle: string;
  blurb: string;
  progress?: number;
  total?: number;
  cta?: string;
  secondary?: string;
  wide?: boolean;
}) {
  const palette = TONE[tone];
  const pct = total === 0 ? 0 : Math.round((progress / total) * 100);
  return (
    <Link
      href={href}
      className={clsx(
        "group block rounded-xl border bg-bg-panel p-5 transition hover:-translate-y-0.5",
        palette.border,
        palette.hover
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className={clsx("flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest", palette.tag)}>
          <span>{tag}</span>
          {total > 0 && (
            <span className="text-ink-dim">
              · {progress}/{total}
              {pct > 0 && <span className={palette.tag}> · {pct}%</span>}
            </span>
          )}
        </div>
        <span aria-hidden className={clsx("font-mono", palette.tag)}>
          ▸
        </span>
      </div>
      <h2 className="mt-3 text-lg font-medium text-ink sm:text-xl">{title}</h2>
      <p className={clsx("mt-0.5 font-mono text-[11px]", palette.subtitle)}>{subtitle}</p>
      <p className="mt-3 text-xs leading-relaxed text-ink-muted">{blurb}</p>
      {total > 0 && (
        <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-bg-elevated">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ type: "spring", stiffness: 140, damping: 22 }}
            className={clsx("h-full", palette.bar)}
          />
        </div>
      )}
      <div className="mt-4 flex items-center justify-between">
        <span className={clsx("text-xs font-medium", palette.cta)}>{cta} →</span>
        {secondary && <span className="font-mono text-[10px] text-ink-dim">{secondary}</span>}
      </div>
      {wide && <div className="mt-1 h-0" />}
    </Link>
  );
}

const TONE = {
  foundations: {
    border: "border-accent-info/30",
    hover: "hover:border-accent-info/60",
    tag: "text-accent-info",
    subtitle: "text-accent-info/80",
    bar: "bg-accent-info",
    cta: "text-accent-info",
  },
  core: {
    border: "border-accent/30",
    hover: "hover:border-accent/60",
    tag: "text-accent",
    subtitle: "text-accent/80",
    bar: "bg-accent",
    cta: "text-accent",
  },
  journey: {
    border: "border-accent-good/30",
    hover: "hover:border-accent-good/60",
    tag: "text-accent-good",
    subtitle: "text-accent-good/80",
    bar: "bg-accent-good",
    cta: "text-accent-good",
  },
  interview: {
    border: "border-accent-warn/30",
    hover: "hover:border-accent-warn/60",
    tag: "text-accent-warn",
    subtitle: "text-accent-warn/80",
    bar: "bg-accent-warn",
    cta: "text-accent-warn",
  },
  incident: {
    border: "border-accent-bad/30",
    hover: "hover:border-accent-bad/60",
    tag: "text-accent-bad",
    subtitle: "text-accent-bad/80",
    bar: "bg-accent-bad",
    cta: "text-accent-bad",
  },
} as const;
