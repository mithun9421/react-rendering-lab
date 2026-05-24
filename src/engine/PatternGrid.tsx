/**
 * Visual card grid for showing pattern pairs — anti-pattern + the fix, or
 * before + after, or option A vs option B. Each card shows an icon, title,
 * two short code snippets (red = bad / green = good), and a one-line why.
 *
 * Designed to replace bullet-list text in "explain" steps across modules,
 * giving each module a denser, more scannable visual surface.
 */

export type PatternItem = {
  icon: string;
  title: string;
  /** Short code or text — left/bad side. Renders red. */
  bad: string;
  /** Short code or text — right/good side. Renders green. */
  good: string;
  /** One-sentence rationale. */
  why: string;
  /** Override the bad-side label (default: hidden on small / "anti-pattern"). */
  badLabel?: string;
  /** Override the good-side label (default: "fix"). */
  goodLabel?: string;
};

export function PatternGrid({
  items,
  columns = 3,
}: {
  items: PatternItem[];
  /** Max columns at lg+. Use 2 for denser cards with more code; 3 for terse. */
  columns?: 2 | 3;
}) {
  const colClass = columns === 2 ? "lg:grid-cols-2" : "md:grid-cols-2 lg:grid-cols-3";
  return (
    <div className={`not-prose grid gap-3 ${colClass}`}>
      {items.map((p) => (
        <div
          key={p.title}
          className="group flex flex-col gap-2 rounded-xl border border-bg-border bg-bg-panel p-3 transition-colors hover:border-accent/40 hover:bg-bg-elevated"
        >
          <div className="flex items-center gap-2">
            <span className="text-lg leading-none" aria-hidden>
              {p.icon}
            </span>
            <span className="text-sm font-medium text-ink">{p.title}</span>
          </div>
          <pre className="overflow-x-auto rounded-md border border-accent-bad/30 bg-accent-bad/5 p-2 font-mono text-[10px] leading-snug text-accent-bad">
            {p.bad}
          </pre>
          <pre className="overflow-x-auto rounded-md border border-accent-good/30 bg-accent-good/5 p-2 font-mono text-[10px] leading-snug text-accent-good">
            {p.good}
          </pre>
          <p className="text-[11px] leading-relaxed text-ink-muted">{p.why}</p>
        </div>
      ))}
    </div>
  );
}
