"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import clsx from "clsx";
import { Lesson } from "@/engine/Lesson";
import { Step } from "@/engine/Step";
import { Callout } from "@/engine/Callout";

type Block = { id: string; label: string; jsKb: number; interactive: boolean };

const PAGE: Block[] = [
  { id: "nav", label: "Nav", jsKb: 0.2, interactive: false },
  { id: "hero", label: "Hero", jsKb: 0.0, interactive: false },
  { id: "search", label: "Search box", jsKb: 6.0, interactive: true },
  { id: "feed", label: "Stock feed", jsKb: 12.0, interactive: true },
  { id: "chart", label: "Chart", jsKb: 24.0, interactive: true },
  { id: "comments", label: "Comments (static)", jsKb: 0.0, interactive: false },
  { id: "footer", label: "Footer", jsKb: 0.0, interactive: false },
];

export default function Module09() {
  return (
    <Lesson slug="09-islands">
      <Step n={1} kind="observe" title="What if 80% of your page never needed JS?">
        <p>
          Most of a typical page is static HTML masquerading as React: footers, hero text,
          articles, comments. Islands architecture means: render those as plain HTML, ship JS
          only for the actually-interactive parts.
        </p>
        <IslandsMap />
      </Step>

      <Step n={2} kind="explain" title="What you give up and what you get">
        <p>
          You give up: passing state across islands trivially, single-page-app feel between
          islands, and some component code reuse with non-island parts. You get: a fraction of
          the JS, faster TTI, and parallel hydration of the remaining islands.
        </p>
      </Step>

      <Step n={3} kind="next" title="Less to hydrate. But the lists you kept are huge.">
        <Callout tone="next" title="next bottleneck">
          The feed and chart are still rendered with thousands of items. Module 10 closes the
          loop with windowing — and then we&apos;re back at reconciliation keys, which is why
          the lab is a cycle, not a ladder.
        </Callout>
      </Step>
    </Lesson>
  );
}

function IslandsMap() {
  const [mode, setMode] = useState<"all" | "islands">("all");
  const total = PAGE.reduce((a, b) => a + b.jsKb, 0);
  const islandsOnly = PAGE.filter((b) => b.interactive).reduce((a, b) => a + b.jsKb, 0);

  return (
    <div className="not-prose mt-3 rounded-lg border border-bg-border bg-bg-panel p-3">
      <div className="mb-3 flex flex-wrap items-center gap-2 text-xs">
        <button
          onClick={() => setMode("all")}
          className={clsx(
            "rounded-md px-2 py-1 font-mono text-[11px]",
            mode === "all" ? "bg-accent text-white" : "border border-bg-border text-ink-muted"
          )}
        >
          hydrate everything
        </button>
        <button
          onClick={() => setMode("islands")}
          className={clsx(
            "rounded-md px-2 py-1 font-mono text-[11px]",
            mode === "islands" ? "bg-accent text-white" : "border border-bg-border text-ink-muted"
          )}
        >
          hydrate only islands
        </button>
        <span className="ml-auto font-mono text-[11px] text-ink-dim">
          shipped JS: <span className="text-ink">{mode === "all" ? total.toFixed(1) : islandsOnly.toFixed(1)} KB</span>{" "}
          {mode === "islands" && <span className="text-accent-good">−{(((total - islandsOnly) / total) * 100).toFixed(0)}%</span>}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
        {PAGE.map((b) => {
          const hydrated = mode === "all" ? true : b.interactive;
          return (
            <motion.div
              key={b.id}
              animate={{
                borderColor: hydrated ? "rgba(124,92,255,0.5)" : "rgba(255,255,255,0.06)",
                opacity: hydrated ? 1 : 0.5,
              }}
              className="rounded-md border bg-bg-elevated p-3"
            >
              <div className="font-mono text-xs">{b.label}</div>
              <div className="mt-1 font-mono text-[10px] text-ink-dim">
                {b.jsKb}KB · {b.interactive ? "interactive" : "static"}
                {hydrated && b.jsKb > 0 && <span className="ml-2 text-accent">island</span>}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
