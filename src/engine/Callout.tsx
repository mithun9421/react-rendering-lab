import clsx from "clsx";

type Tone = "info" | "warn" | "good" | "bad" | "next";

const tones: Record<Tone, string> = {
  info: "border-accent-info/30 bg-accent-info/5 text-accent-info",
  warn: "border-accent-warn/30 bg-accent-warn/5 text-accent-warn",
  good: "border-accent-good/30 bg-accent-good/5 text-accent-good",
  bad: "border-accent-bad/30 bg-accent-bad/5 text-accent-bad",
  next: "border-accent/30 bg-accent/5 text-accent",
};

export function Callout({
  tone = "info",
  title,
  children,
}: {
  tone?: Tone;
  title?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={clsx("rounded-lg border px-4 py-3 text-sm", tones[tone])}>
      {title && <div className="mb-1 font-mono text-[11px] uppercase tracking-widest">{title}</div>}
      <div className="text-ink">{children}</div>
    </div>
  );
}
