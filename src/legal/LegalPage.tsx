import Link from "next/link";

export function LegalPage({
  eyebrow,
  title,
  updated,
  children,
}: {
  eyebrow: string;
  title: string;
  updated?: string;
  children: React.ReactNode;
}) {
  return (
    <article className="mx-auto w-full max-w-3xl px-4 pb-24 pt-10 sm:px-6 sm:pt-16">
      <Link href="/" className="font-mono text-[11px] uppercase tracking-widest text-ink-dim hover:text-ink">
        ← back to lab
      </Link>
      <p className="mt-6 font-mono text-[11px] uppercase tracking-widest text-accent">{eyebrow}</p>
      <h1 className="mt-2 text-3xl font-medium tracking-tight sm:text-4xl">{title}</h1>
      {updated && (
        <p className="mt-2 font-mono text-[11px] text-ink-dim">last updated · {updated}</p>
      )}
      <div className="prose prose-invert prose-sm mt-8 max-w-none text-ink-muted prose-headings:text-ink prose-strong:text-ink prose-a:text-accent prose-a:no-underline hover:prose-a:underline prose-code:rounded prose-code:bg-bg-elevated prose-code:px-1 prose-code:py-0.5 prose-code:text-accent prose-code:before:content-none prose-code:after:content-none">
        {children}
      </div>
    </article>
  );
}
