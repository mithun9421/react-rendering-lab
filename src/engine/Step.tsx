"use client";

import clsx from "clsx";

export type StepKind = "observe" | "profile" | "explain" | "fix" | "next";

const KINDS: Record<StepKind, { label: string; color: string; emoji: string }> = {
  observe: { label: "Observe", color: "text-accent-warm", emoji: "○" },
  profile: { label: "Profile", color: "text-accent-info", emoji: "▦" },
  explain: { label: "Explain", color: "text-accent", emoji: "✸" },
  fix: { label: "Apply fix", color: "text-accent-good", emoji: "✓" },
  next: { label: "Next bottleneck", color: "text-accent-warn", emoji: "→" },
};

export function Step({
  n,
  kind,
  title,
  children,
}: {
  n: number;
  kind: StepKind;
  title: string;
  children: React.ReactNode;
}) {
  const k = KINDS[kind];
  return (
    <section className="grid grid-cols-[28px_1fr] gap-3 sm:grid-cols-[40px_1fr] sm:gap-4">
      <div className="flex flex-col items-center">
        <div className={clsx("flex size-7 items-center justify-center rounded-full border border-bg-border bg-bg-panel font-mono text-[11px] sm:size-8 sm:text-xs", k.color)}>
          {n}
        </div>
        <div className="mt-2 w-px flex-1 bg-bg-border" aria-hidden />
      </div>
      <div className="min-w-0 pb-2">
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <span className={clsx("pill !uppercase", k.color)}>
            <span aria-hidden>{k.emoji}</span> {k.label}
          </span>
          <h2 className="text-[15px] font-medium leading-snug sm:text-base">{title}</h2>
        </div>
        <div className="prose prose-invert prose-sm max-w-none text-ink-muted prose-strong:text-ink prose-code:text-accent prose-code:before:content-none prose-code:after:content-none prose-code:rounded prose-code:bg-bg-elevated prose-code:px-1 prose-code:py-0.5">
          {children}
        </div>
      </div>
    </section>
  );
}
