"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { MODULES, moduleBySlug } from "@/modules/registry";

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

      <div className="space-y-8 sm:space-y-10">{children}</div>

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
