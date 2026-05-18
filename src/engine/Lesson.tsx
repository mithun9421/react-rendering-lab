"use client";

import { Children, Fragment, type ReactNode } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { MODULES, moduleBySlug } from "@/modules/registry";
import { AdSlot } from "@/ads/AdSlot";

/**
 * Insert one in-article ad after the 4th step.
 * If the lesson has fewer than 5 steps, render no in-article ad — the end-of-lesson
 * slot below still fires.
 */
function interleaveAd(children: ReactNode): ReactNode {
  const arr = Children.toArray(children);
  if (arr.length < 5) return arr;
  const ad = (
    <div className="rounded-lg border border-dashed border-bg-border bg-bg-subtle p-3" key="__inarticle_ad">
      <AdSlot
        slotId={process.env.NEXT_PUBLIC_ADSENSE_SLOT_MODULE_INARTICLE ?? ""}
        format="in-article"
        minHeight={120}
      />
    </div>
  );
  return [
    ...arr.slice(0, 4),
    <Fragment key="__ad_wrap">{ad}</Fragment>,
    ...arr.slice(4),
  ];
}

export function Lesson({
  slug,
  children,
}: {
  slug: string;
  children: React.ReactNode;
}) {
  const def = moduleBySlug(slug)!;
  const idx = MODULES.findIndex((m) => m.slug === slug);
  const prev = MODULES[idx - 1];
  const next = MODULES[idx + 1];

  return (
    <article className="mx-auto w-full max-w-6xl px-4 pb-24 pt-6 sm:px-6 sm:pt-10">
      <header className="mb-8 sm:mb-10">
        <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-ink-dim sm:text-[11px]">
          <span>Module {String(idx + 1).padStart(2, "0")}</span>
          <span>·</span>
          <span className="text-accent">{def.tag}</span>
        </div>
        <motion.h1
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mt-2 text-2xl font-medium tracking-tight sm:text-3xl md:text-4xl"
        >
          {def.title}
        </motion.h1>
        <p className="mt-3 max-w-2xl text-sm text-ink-muted sm:text-base">{def.hook}</p>
      </header>

      <div className="space-y-8 sm:space-y-10">{interleaveAd(children)}</div>

      {/* End-of-lesson native ad slot — fires only after the reader scrolled the whole lesson.
          This is the highest-quality impression we have; AdSense rewards it. */}
      <div className="mt-12 sm:mt-16">
        <AdSlot
          slotId={process.env.NEXT_PUBLIC_ADSENSE_SLOT_MODULE_END ?? ""}
          format="in-article"
          minHeight={120}
          className="rounded-lg border border-dashed border-bg-border bg-bg-subtle p-4"
        />
      </div>

      <nav className="mt-12 flex flex-col gap-3 border-t border-bg-border pt-6 text-sm sm:mt-16 sm:flex-row sm:items-center sm:justify-between">
        {prev ? (
          <Link href={`/lab/${prev.slug}`} className="group flex items-center gap-2 text-ink-muted hover:text-ink">
            <span aria-hidden>←</span>
            <span>
              <span className="block font-mono text-[10px] uppercase tracking-widest text-ink-dim">prev</span>
              <span className="block">{prev.title}</span>
            </span>
          </Link>
        ) : (
          <span />
        )}
        {next ? (
          <Link
            href={`/lab/${next.slug}`}
            className="group flex items-center gap-3 rounded-lg border border-bg-border bg-bg-panel px-4 py-3 hover:border-accent/50 hover:bg-bg-elevated"
          >
            <span className="text-right">
              <span className="block font-mono text-[10px] uppercase tracking-widest text-accent/80">next bottleneck</span>
              <span className="block">{next.title}</span>
            </span>
            <span aria-hidden>→</span>
          </Link>
        ) : (
          <span />
        )}
      </nav>
    </article>
  );
}
