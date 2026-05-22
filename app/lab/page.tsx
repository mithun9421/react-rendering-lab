"use client";

import Link from "next/link";
import { useState } from "react";
import { motion } from "framer-motion";
import { FOUNDATIONS, MODULES } from "@/modules/registry";
import { QUESTIONS } from "@/modules/interview/questions";
import { computeStreak, levelOf, useProgress } from "@/progress/store";
import { SiteFooter } from "@/shell/SiteFooter";
import { AchievementsGallery } from "@/progress/AchievementsGallery";
import { ShareCard } from "@/progress/ShareCard";
import { ContinueReadingBanner } from "@/progress/ContinueReadingBanner";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

/**
 * The lab hub — five buckets, bento-grid layout, with live progress.
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

        <ContinueReadingBanner variant="inline" />

        <StatsCard
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

        {/* Bento: 6-col grid on lg+, 2 on md, 1 on sm */}
        <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-6">
          <Bucket
            className="lg:col-span-3"
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
            className="lg:col-span-3"
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
            className="lg:col-span-2"
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
            className="lg:col-span-2"
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
          <Bucket
            className="lg:col-span-6"
            tone="incident"
            href="/lab/25-incident-simulator"
            tag="oncall"
            title="Live-fire — the Incident Simulator"
            subtitle="6 scenarios · diagnose / fix / validate / postmortem"
            blurb="The capstone. Pick an incident, walk the on-call playbook, score yourself against the model post-mortem."
            cta="Drop into on-call"
          />
        </div>

        <Card className="mt-6 border-l-4 border-l-accent-warn">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] uppercase tracking-widest text-accent-warn">
                ◐ daily challenge · refresh midnight UTC
              </span>
            </div>
            <CardTitle className="mt-1 text-sm">
              One curated question per day · don&apos;t break the streak
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-4">
            <p className="text-[11px] text-ink-muted">
              Same question for everyone. Correct answers count toward the &quot;Interview-ready&quot;
              achievement and your daily streak.
            </p>
          </CardContent>
          <CardFooter>
            <Button asChild size="sm" variant="default">
              <Link href="/lab/daily">Open today&apos;s challenge →</Link>
            </Button>
          </CardFooter>
        </Card>

        <p className="mt-8 flex flex-wrap items-center gap-2 font-mono text-[11px] text-ink-dim">
          <span>Knowledge checks are sprinkled inside the lessons themselves. Look for the</span>
          <Badge variant="outline" className="font-mono text-[10px] text-accent">
            ▦ quick check
          </Badge>
          <span>card.</span>
        </p>

        <div className="mt-12">
          <ShareCard />
        </div>

        <Card className="mt-12 border-transparent bg-transparent shadow-none">
          <CardHeader className="px-0 pt-0">
            <CardTitle className="text-xl">Achievements</CardTitle>
          </CardHeader>
          <CardContent className="px-0 pb-0">
            <AchievementsGallery />
          </CardContent>
        </Card>
      </article>

      <SiteFooter />
    </main>
  );
}

function StatsCard({
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
  const _xp = hydrated ? xp : 0;
  const _streak = hydrated ? streak : 0;

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0 pb-3">
        <CardTitle className="font-mono text-[10px] uppercase tracking-widest text-ink-dim">
          your run
        </CardTitle>
        <Button
          size="sm"
          variant="ghost"
          onClick={onReset}
          onBlur={() => setConfirmReset(false)}
          className={cn(
            "font-mono text-[10px] uppercase tracking-widest",
            confirmReset && "text-accent-bad hover:text-accent-bad"
          )}
        >
          {confirmReset ? "click again to confirm" : "reset progress"}
        </Button>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex flex-wrap items-center gap-6">
          <div>
            <div className="font-mono text-[10px] uppercase tracking-widest text-ink-dim">level</div>
            <div className="mt-1 font-mono text-3xl tabular-nums text-accent">{level}</div>
          </div>
          <div className="min-w-[200px] flex-1">
            <div className="flex items-baseline justify-between">
              <span className="font-mono text-[10px] uppercase tracking-widest text-ink-dim">
                {_xp} XP
              </span>
              <span className="font-mono text-[10px] text-ink-dim">
                {toNext} to level {level + 1}
              </span>
            </div>
            <Progress value={into} className="mt-2" />
          </div>
          <div className="text-center">
            <div className="font-mono text-[10px] uppercase tracking-widest text-ink-dim">streak</div>
            <div className="mt-1 flex items-center gap-1 font-mono text-2xl tabular-nums text-accent-warm">
              <span>{_streak}</span>
              <span className="text-base">🔥</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
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
  className,
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
  className?: string;
}) {
  const palette = TONE[tone];
  const pct = total === 0 ? 0 : Math.round((progress / total) * 100);

  return (
    <Link href={href} className={cn("group block focus-visible:outline-none", className)}>
      <Card
        className={cn(
          "h-full border bg-bg-panel transition hover:-translate-y-0.5",
          palette.border,
          palette.hover
        )}
      >
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-3">
            <div
              className={cn(
                "flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest",
                palette.tag
              )}
            >
              <span aria-hidden className={cn("inline-block size-1.5 rounded-full", palette.dot)} />
              <span>{tag}</span>
              {total > 0 && (
                <span className="text-ink-dim">
                  · {progress}/{total}
                  {pct > 0 && <span className={palette.tag}> · {pct}%</span>}
                </span>
              )}
            </div>
            <span aria-hidden className={cn("font-mono", palette.tag)}>
              ▸
            </span>
          </div>
          <CardTitle className="mt-2 text-lg text-ink sm:text-xl">{title}</CardTitle>
          <p className={cn("mt-0.5 font-mono text-[11px]", palette.subtitle)}>{subtitle}</p>
        </CardHeader>
        <CardContent className="pb-3">
          <p className="text-xs leading-relaxed text-ink-muted">{blurb}</p>
          {total > 0 && (
            <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-bg-elevated">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ type: "spring", stiffness: 140, damping: 22 }}
                className={cn("h-full", palette.bar)}
              />
            </div>
          )}
        </CardContent>
        <CardFooter className="flex items-center justify-between pt-0">
          <span className={cn("text-xs font-medium", palette.cta)}>{cta} →</span>
          {secondary && <span className="font-mono text-[10px] text-ink-dim">{secondary}</span>}
        </CardFooter>
      </Card>
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
    dot: "bg-accent-info",
  },
  core: {
    border: "border-accent/30",
    hover: "hover:border-accent/60",
    tag: "text-accent",
    subtitle: "text-accent/80",
    bar: "bg-accent",
    cta: "text-accent",
    dot: "bg-accent",
  },
  journey: {
    border: "border-accent-good/30",
    hover: "hover:border-accent-good/60",
    tag: "text-accent-good",
    subtitle: "text-accent-good/80",
    bar: "bg-accent-good",
    cta: "text-accent-good",
    dot: "bg-accent-good",
  },
  interview: {
    border: "border-accent-warn/30",
    hover: "hover:border-accent-warn/60",
    tag: "text-accent-warn",
    subtitle: "text-accent-warn/80",
    bar: "bg-accent-warn",
    cta: "text-accent-warn",
    dot: "bg-accent-warn",
  },
  incident: {
    border: "border-accent-bad/30",
    hover: "hover:border-accent-bad/60",
    tag: "text-accent-bad",
    subtitle: "text-accent-bad/80",
    bar: "bg-accent-bad",
    cta: "text-accent-bad",
    dot: "bg-accent-bad",
  },
} as const;
