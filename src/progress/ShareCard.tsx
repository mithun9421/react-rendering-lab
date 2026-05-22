"use client";

import { useState } from "react";
import { Share2, Copy, Download, Check, Twitter, Linkedin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useProgress, levelOf, computeStreak } from "./store";

/**
 * Generates a shareable progress card and surfaces the share + copy actions.
 *
 * Two URL forms here on purpose:
 *   - `cardPath`  — relative path (`/api/og/card?...`). Used for the inline
 *                   <img> preview so it always loads from the SAME origin
 *                   the user is on (works locally, in preview deploys, and
 *                   in production without depending on NEXT_PUBLIC_SITE_URL
 *                   pointing at the right place).
 *   - `cardAbs`   — absolute URL using the current origin in the browser
 *                   (or NEXT_PUBLIC_SITE_URL as a server-side fallback).
 *                   Used for the social share intent URLs because external
 *                   crawlers (Twitter, LinkedIn) need a fully-qualified URL.
 */

const FALLBACK_SITE =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://react-rendering-lab.vercel.app";

export function ShareCard() {
  const completedLessons = useProgress((s) => s.completedLessons);
  const xp = useProgress((s) => s.xp);
  const visits = useProgress((s) => s.visits);
  const hydrated = useProgress((s) => s.hydrated);
  const [copied, setCopied] = useState(false);

  const { level } = levelOf(xp);
  const streak = computeStreak(visits);
  const lessons = Object.keys(completedLessons).length;

  const params = new URLSearchParams({
    level: String(level),
    xp: String(xp),
    streak: String(streak),
    lessons: String(lessons),
    track: "React Rendering Lab",
  });

  // Relative path: always works against the current origin.
  const cardPath = `/api/og/card?${params.toString()}`;
  // Absolute URL: uses window.location in the browser, falls back to env at
  // SSR-time (which is fine because ShareCard only renders meaningfully on the
  // client — hydrated check below).
  const origin = typeof window !== "undefined" ? window.location.origin : FALLBACK_SITE;
  const cardAbs = `${origin}${cardPath}`;
  const siteAbs = origin;

  const shareText = `I'm at Level ${level} on React Rendering Lab — ${lessons}/36 lessons, ${streak}-day streak. Free interactive course covering React rendering, hydration, server components, and on-call incident response.`;

  const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
    shareText
  )}&url=${encodeURIComponent(siteAbs)}`;
  const linkedinUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(siteAbs)}`;

  const [imgError, setImgError] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(`${shareText}\n${siteAbs}`);
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
    <Card className="border-accent/30 bg-gradient-to-b from-accent/[0.04] to-transparent">
      <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2 space-y-0 pb-3">
        <h2 className="flex items-center gap-1.5 font-mono text-xs uppercase tracking-widest text-accent">
          <Share2 className="size-3.5" />
          share your progress
        </h2>
        <Badge variant="outline" className="font-mono text-[10px] tabular-nums">
          Level {level} · {streak}🔥 · {lessons}/36
        </Badge>
      </CardHeader>
      <CardContent className="pt-0">
        {/* Card preview */}
        <div
          className="relative overflow-hidden rounded-lg border border-bg-border bg-bg-elevated"
          style={{ aspectRatio: "1200 / 630" }}
        >
          {!imgError ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={cardPath}
              alt="Your React Rendering Lab progress card"
              loading="lazy"
              onError={() => setImgError(true)}
              className="block h-full w-full"
            />
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-2 p-4 text-center">
              <p className="font-mono text-[11px] uppercase tracking-widest text-accent-warn">
                preview unavailable
              </p>
              <p className="text-xs text-ink-muted">
                The share buttons below still work — the image is generated server-side when X /
                LinkedIn / your download fetches it.
              </p>
            </div>
          )}
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <Button asChild variant="outline" size="sm">
            <a href={twitterUrl} target="_blank" rel="noreferrer">
              <Twitter className="size-3.5" /> share on X
            </a>
          </Button>
          <Button asChild variant="outline" size="sm">
            <a href={linkedinUrl} target="_blank" rel="noreferrer">
              <Linkedin className="size-3.5" /> share on LinkedIn
            </a>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={copy}
            className={copied ? "text-accent-good" : undefined}
          >
            {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
            {copied ? "copied" : "copy text + link"}
          </Button>
          <Button asChild variant="outline" size="sm">
            <a href={cardAbs} download="react-rendering-lab-progress.png">
              <Download className="size-3.5" /> download card
            </a>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
