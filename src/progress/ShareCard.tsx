"use client";

import { useState } from "react";
import clsx from "clsx";
import { useProgress, levelOf, computeStreak } from "./store";

/**
 * Generates a shareable progress card and surfaces the share + copy actions.
 *
 * The OG image is rendered by /api/og/card with stats as query params, so the
 * card is up-to-date the moment the user opens the share dialog. Twitter +
 * LinkedIn intent URLs preview the image automatically.
 */

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://react-rendering-lab.vercel.app";

export function ShareCard() {
  const completedLessons = useProgress((s) => s.completedLessons);
  const xp = useProgress((s) => s.xp);
  const visits = useProgress((s) => s.visits);
  const hydrated = useProgress((s) => s.hydrated);
  const [copied, setCopied] = useState(false);

  const { level } = levelOf(xp);
  const streak = computeStreak(visits);
  const lessons = Object.keys(completedLessons).length;

  // Build OG card URL with stats as params
  const cardUrl = new URL(`${SITE}/api/og/card`);
  cardUrl.searchParams.set("level", String(level));
  cardUrl.searchParams.set("xp", String(xp));
  cardUrl.searchParams.set("streak", String(streak));
  cardUrl.searchParams.set("lessons", String(lessons));
  cardUrl.searchParams.set("track", "React Rendering Lab");

  const shareText = `I'm at Level ${level} on React Rendering Lab — ${lessons}/36 lessons, ${streak}-day streak. Free interactive course covering React rendering, hydration, server components, and on-call incident response.`;

  const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
    shareText
  )}&url=${encodeURIComponent(SITE)}`;
  const linkedinUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(SITE)}`;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(`${shareText}\n${SITE}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  if (!hydrated || lessons === 0) {
    // Don't pitch sharing until the user has something to share.
    return null;
  }

  return (
    <section className="rounded-xl border border-accent/30 bg-gradient-to-b from-accent/[0.04] to-transparent p-5">
      <header className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-mono text-xs uppercase tracking-widest text-accent">
          ⇡ share your progress
        </h2>
        <span className="font-mono text-[11px] text-ink-dim">
          Level {level} · {streak}🔥 · {lessons}/36
        </span>
      </header>

      {/* Card preview */}
      <div className="overflow-hidden rounded-lg border border-bg-border bg-bg-elevated">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={cardUrl.toString()}
          alt="Your React Rendering Lab progress card"
          loading="lazy"
          className="block w-full"
          style={{ aspectRatio: "1200 / 630" }}
        />
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <a
          href={twitterUrl}
          target="_blank"
          rel="noreferrer"
          className="rounded-md border border-bg-border bg-bg-panel px-3 py-1.5 font-mono text-[11px] text-ink-muted hover:text-ink"
        >
          ↗ share on X
        </a>
        <a
          href={linkedinUrl}
          target="_blank"
          rel="noreferrer"
          className="rounded-md border border-bg-border bg-bg-panel px-3 py-1.5 font-mono text-[11px] text-ink-muted hover:text-ink"
        >
          ↗ share on LinkedIn
        </a>
        <button
          onClick={copy}
          className={clsx(
            "rounded-md border border-bg-border bg-bg-panel px-3 py-1.5 font-mono text-[11px]",
            copied ? "text-accent-good" : "text-ink-muted hover:text-ink"
          )}
        >
          {copied ? "✓ copied" : "⎘ copy text + link"}
        </button>
        <a
          href={cardUrl.toString()}
          download="react-rendering-lab-progress.png"
          className="rounded-md border border-bg-border bg-bg-panel px-3 py-1.5 font-mono text-[11px] text-ink-muted hover:text-ink"
        >
          ↓ download card
        </a>
      </div>
    </section>
  );
}
