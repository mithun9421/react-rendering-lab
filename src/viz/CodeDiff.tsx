"use client";

import { cn } from "@/lib/utils";

/**
 * GitHub-style diff renderer for short snippets.
 *
 * Pass a flat string with line prefixes:
 *   `-` removed
 *   `+` added
 *   ` ` unchanged context
 * One char + one space at the start of each line. Tabs are rendered as 2 spaces.
 *
 * Mobile-first: horizontal scroll inside, never overflows the parent grid.
 */
export type DiffLine = { kind: "add" | "remove" | "context"; text: string };

export function parseDiff(src: string): DiffLine[] {
  return src
    .split("\n")
    // Strip leading/trailing blank lines but preserve intentional empty lines inside.
    .reduce<string[]>((acc, line, i, arr) => {
      const isEdgeBlank = line.trim() === "" && (i === 0 || i === arr.length - 1);
      if (!isEdgeBlank) acc.push(line);
      return acc;
    }, [])
    .map((line) => {
      if (line.startsWith("+ ")) return { kind: "add" as const, text: line.slice(2) };
      if (line.startsWith("- ")) return { kind: "remove" as const, text: line.slice(2) };
      if (line.startsWith("  ")) return { kind: "context" as const, text: line.slice(2) };
      // Tolerate single-char prefix without space (GitHub copy/paste sometimes drops it)
      if (line.startsWith("+")) return { kind: "add" as const, text: line.slice(1) };
      if (line.startsWith("-")) return { kind: "remove" as const, text: line.slice(1) };
      return { kind: "context" as const, text: line };
    });
}

export function CodeDiff({
  title,
  file,
  diff,
  language = "tsx",
}: {
  title?: string;
  /** Filename header — purely decorative. */
  file?: string;
  diff: string;
  language?: string;
}) {
  const lines = parseDiff(diff);
  const adds = lines.filter((l) => l.kind === "add").length;
  const removes = lines.filter((l) => l.kind === "remove").length;

  return (
    <div className="overflow-hidden rounded-lg border border-bg-border bg-bg-panel">
      <header className="flex flex-wrap items-center justify-between gap-2 border-b border-bg-border bg-bg-subtle px-3 py-2 text-xs">
        <div className="flex min-w-0 items-center gap-2">
          <DiffIcon />
          <span className="font-mono uppercase tracking-widest text-ink-dim">diff</span>
          {file && <span className="truncate font-mono text-ink">{file}</span>}
        </div>
        <div className="flex items-center gap-2 font-mono text-[10px]">
          <span className="text-accent-good">+{adds}</span>
          <span className="text-accent-bad">−{removes}</span>
          <span className="rounded bg-bg-elevated px-1.5 py-0.5 text-ink-dim">{language}</span>
        </div>
      </header>
      {title && (
        <div className="border-b border-bg-border bg-bg-subtle px-3 py-1.5 font-mono text-[11px] text-ink-muted">
          {title}
        </div>
      )}
      <div className="overflow-x-auto">
        <pre className="min-w-max p-0 font-mono text-[11px] leading-relaxed">
          {lines.map((l, i) => (
            <div
              key={i}
              className={cn(
                "flex items-start gap-3 whitespace-pre px-3 py-0.5",
                l.kind === "add" && "bg-accent-good/10",
                l.kind === "remove" && "bg-accent-bad/10",
                l.kind === "context" && "bg-transparent"
              )}
            >
              <span
                className={cn(
                  "select-none text-[10px] tabular-nums",
                  l.kind === "add" && "text-accent-good",
                  l.kind === "remove" && "text-accent-bad",
                  l.kind === "context" && "text-ink-dim"
                )}
              >
                {l.kind === "add" ? "+" : l.kind === "remove" ? "−" : " "}
              </span>
              <span
                className={cn(
                  l.kind === "add" && "text-ink",
                  l.kind === "remove" && "text-ink line-through decoration-accent-bad/40",
                  l.kind === "context" && "text-ink-muted"
                )}
              >
                {l.text || " "}
              </span>
            </div>
          ))}
        </pre>
      </div>
    </div>
  );
}

function DiffIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 16 16" aria-hidden className="text-ink-muted">
      <path
        fill="currentColor"
        d="M9.5 8a.75.75 0 0 1 .75-.75h2.25V5a.75.75 0 0 1 1.5 0v2.25H16a.75.75 0 0 1 0 1.5h-2v2.25a.75.75 0 0 1-1.5 0V8.75h-2.25A.75.75 0 0 1 9.5 8Zm-9 0a.75.75 0 0 1 .75-.75h6.5a.75.75 0 0 1 0 1.5h-6.5A.75.75 0 0 1 .5 8Z"
      />
    </svg>
  );
}
