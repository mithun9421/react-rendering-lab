"use client";

import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

export type StepKind = "observe" | "profile" | "explain" | "fix" | "next";

const KINDS: Record<StepKind, { label: string; emoji: string }> = {
  observe: { label: "Observe", emoji: "○" },
  profile: { label: "Profile", emoji: "▦" },
  explain: { label: "Explain", emoji: "✸" },
  fix: { label: "Apply fix", emoji: "✓" },
  next: { label: "Next bottleneck", emoji: "→" },
};

/**
 * Tone tokens per step kind. We use cva to map a `StepKind` to a `Badge`
 * variant + the colour used by the step number circle. Keeping this in cva
 * (instead of hand-rolled string maps) makes it cheap to extend later.
 */
const stepKindStyles = cva("", {
  variants: {
    kind: {
      observe: "",
      profile: "",
      explain: "",
      fix: "",
      next: "",
    },
  },
});

const badgeVariantFor: Record<StepKind, "warn" | "info" | "default" | "success" | "outline"> = {
  observe: "warn",
  profile: "info",
  explain: "default",
  fix: "success",
  next: "outline",
};

const numberColorFor: Record<StepKind, string> = {
  observe: "text-accent-warn",
  profile: "text-accent-info",
  explain: "text-accent",
  fix: "text-accent-good",
  next: "text-accent",
};

export interface StepProps extends VariantProps<typeof stepKindStyles> {
  n: number;
  kind: StepKind;
  title: string;
  children: React.ReactNode;
}

export function Step({ n, kind, title, children }: StepProps) {
  const k = KINDS[kind];
  return (
    <section className="grid grid-cols-[28px_1fr] gap-3 sm:grid-cols-[40px_1fr] sm:gap-4">
      <div className="flex flex-col items-center">
        <div
          className={cn(
            "flex size-7 items-center justify-center rounded-full border border-bg-border bg-bg-panel font-mono text-[11px] sm:size-8 sm:text-xs",
            numberColorFor[kind]
          )}
        >
          {n}
        </div>
        <div className="mt-2 w-px flex-1 bg-bg-border" aria-hidden />
      </div>
      <div className="min-w-0 pb-2">
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <Badge variant={badgeVariantFor[kind]} className="!uppercase font-mono tracking-widest">
            <span aria-hidden className="mr-1">
              {k.emoji}
            </span>
            {k.label}
          </Badge>
          <h2 className="text-[15px] font-medium leading-snug sm:text-base">{title}</h2>
        </div>
        <div className="prose prose-invert prose-sm max-w-none text-ink-muted prose-strong:text-ink prose-code:text-accent prose-code:before:content-none prose-code:after:content-none prose-code:rounded prose-code:bg-bg-elevated prose-code:px-1 prose-code:py-0.5">
          {children}
        </div>
      </div>
    </section>
  );
}
