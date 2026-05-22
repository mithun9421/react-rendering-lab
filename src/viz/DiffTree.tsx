"use client";

import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export type DiffNode = {
  id: string;
  label: string;
  /** "kept" | "moved" | "added" | "removed" */
  status: "kept" | "moved" | "added" | "removed";
};

/**
 * Two-column before/after tree showing reconciliation outcomes per row.
 * Colors tell the story: kept = neutral, moved = blue, added = green, removed = red.
 */
export function DiffTree({
  before,
  after,
  title = "Reconciliation diff",
}: {
  before: DiffNode[];
  after: DiffNode[];
  title?: string;
}) {
  return (
    <Card className="overflow-hidden">
      <header className="flex flex-col gap-2 border-b border-bg-border px-3 py-2 text-xs sm:flex-row sm:items-center sm:justify-between">
        <span className="font-mono uppercase tracking-widest text-ink-dim">{title}</span>
        <span className="flex flex-wrap items-center gap-2 font-mono text-[10px] sm:gap-3">
          <Legend label="kept" cls="bg-bg-elevated text-ink-muted" />
          <Legend label="moved" cls="bg-accent-info/20 text-accent-info" />
          <Legend label="added" cls="bg-accent-good/20 text-accent-good" />
          <Legend label="removed" cls="bg-accent-bad/20 text-accent-bad" />
        </span>
      </header>
      <div className="grid grid-cols-1 gap-px bg-bg-border sm:grid-cols-2">
        <Column title="Previous tree" items={before} />
        <Column title="Next tree" items={after} highlight />
      </div>
    </Card>
  );
}

function Legend({ label, cls }: { label: string; cls: string }) {
  return (
    <span className={cn("rounded px-1.5 py-0.5 uppercase tracking-wider", cls)}>{label}</span>
  );
}

function Column({ title, items, highlight }: { title: string; items: DiffNode[]; highlight?: boolean }) {
  return (
    <div className="bg-bg-panel p-3">
      <p className="mb-2 font-mono text-[10px] uppercase tracking-widest text-ink-dim">{title}</p>
      <ul className="space-y-1">
        {items.map((n, i) => (
          <motion.li
            key={`${n.id}-${i}`}
            layout
            initial={{ opacity: 0, x: highlight ? 4 : -4 }}
            animate={{ opacity: 1, x: 0 }}
            className={cn(
              "flex items-center justify-between rounded px-2 py-1 font-mono text-xs",
              n.status === "kept" && "bg-bg-elevated text-ink-muted",
              n.status === "moved" && "bg-accent-info/15 text-accent-info",
              n.status === "added" && "bg-accent-good/15 text-accent-good",
              n.status === "removed" && "bg-accent-bad/15 text-accent-bad line-through"
            )}
          >
            <span>{n.label}</span>
            <span className="text-[10px] opacity-60">key={n.id}</span>
          </motion.li>
        ))}
      </ul>
    </div>
  );
}
