"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

/**
 * <ArchitectNotes/> — "if a Senior Architect asked you this in an interview"
 * depth, ready to recite. Drops at the bottom of any lesson, just before the
 * next-bottleneck callout.
 *
 * The shape forces authors to think about the conversation, not just the
 * concept:
 *   - followUps[]   — questions you should expect after the lesson topic
 *   - pivots[]      — adjacent topics they're likely to pivot to
 *   - dontSay[]     — common wrong answers, plus why they're wrong
 *
 * Visual language: a darker, denser block than a Callout. Folded by default
 * so it doesn't dominate the lesson; tap to expand.
 */

export type FollowUp = {
  q: string;
  /** Compact ready-to-recite answer — full sentences, not bullets. */
  a: string;
};

export type Pivot = {
  to: string;
  /** Why they'd pivot here — what they're testing. */
  why: string;
};

export type DontSay = {
  /** The wrong answer or wrong framing in quotes. */
  phrase: string;
  /** Why it's wrong + the corrected mental model. */
  why: string;
};

export type ArchitectNotesProps = {
  /** Lead — one sentence framing what they're really probing. */
  framing?: string;
  followUps: FollowUp[];
  pivots?: Pivot[];
  dontSay?: DontSay[];
};

export function ArchitectNotes({ framing, followUps, pivots, dontSay }: ArchitectNotesProps) {
  const [open, setOpen] = useState(false);
  return (
    <div className="not-prose my-6 overflow-hidden rounded-lg border border-accent-warn/30 bg-gradient-to-b from-accent-warn/[0.04] to-transparent">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition hover:bg-accent-warn/[0.06]"
      >
        <div className="min-w-0">
          <div className="font-mono text-[10px] uppercase tracking-widest text-accent-warn">
            ▣ if a senior architect asked you this
          </div>
          <div className="mt-0.5 truncate text-sm text-ink">
            {open
              ? `${followUps.length} follow-up${followUps.length === 1 ? "" : "s"}${
                  pivots?.length ? ` · ${pivots.length} pivot${pivots.length === 1 ? "" : "s"}` : ""
                }${dontSay?.length ? ` · ${dontSay.length} trap${dontSay.length === 1 ? "" : "s"}` : ""}`
              : "Tap to read the interview-grade follow-ups"}
          </div>
        </div>
        <span aria-hidden className="font-mono text-sm text-accent-warn">
          {open ? "−" : "+"}
        </span>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="overflow-hidden border-t border-accent-warn/20"
          >
            <div className="space-y-4 p-4">
              {framing && (
                <p className="rounded-md border border-accent-warn/30 bg-accent-warn/[0.06] px-3 py-2 text-xs italic leading-relaxed text-ink-muted">
                  <span className="not-italic font-mono text-[10px] uppercase tracking-widest text-accent-warn">
                    what they&apos;re really probing ·
                  </span>{" "}
                  {framing}
                </p>
              )}

              <section>
                <h4 className="mb-2 font-mono text-[10px] uppercase tracking-widest text-ink-dim">
                  Follow-up questions
                </h4>
                <ol className="space-y-3">
                  {followUps.map((f, i) => (
                    <li key={i} className="rounded-md border border-bg-border bg-bg-panel p-3">
                      <p className="text-sm font-medium text-ink">
                        <span className="mr-1 font-mono text-[10px] uppercase tracking-widest text-accent-warn">
                          Q{i + 1}
                        </span>
                        {f.q}
                      </p>
                      <p className="mt-2 text-xs leading-relaxed text-ink-muted">{f.a}</p>
                    </li>
                  ))}
                </ol>
              </section>

              {pivots && pivots.length > 0 && (
                <section>
                  <h4 className="mb-2 font-mono text-[10px] uppercase tracking-widest text-ink-dim">
                    Likely pivots
                  </h4>
                  <ul className="space-y-1.5 text-xs">
                    {pivots.map((p, i) => (
                      <li key={i} className="flex items-start gap-2 text-ink-muted">
                        <span className="mt-0.5 font-mono text-[10px] text-accent">→</span>
                        <span>
                          <span className="text-ink">{p.to}</span>{" "}
                          <span className="text-ink-dim">— {p.why}</span>
                        </span>
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {dontSay && dontSay.length > 0 && (
                <section>
                  <h4 className="mb-2 font-mono text-[10px] uppercase tracking-widest text-ink-dim">
                    Don&apos;t say
                  </h4>
                  <ul className="space-y-2">
                    {dontSay.map((d, i) => (
                      <li
                        key={i}
                        className={cn(
                          "rounded-md border border-accent-bad/30 bg-accent-bad/5 px-3 py-2 text-xs"
                        )}
                      >
                        <p className="font-mono text-accent-bad">
                          ✗ &ldquo;{d.phrase}&rdquo;
                        </p>
                        <p className="mt-1 leading-relaxed text-ink-muted">{d.why}</p>
                      </li>
                    ))}
                  </ul>
                </section>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
