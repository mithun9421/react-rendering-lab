import Link from "next/link";
import { MODULES } from "@/modules/registry";

export default function Landing() {
  return (
    <main className="relative min-h-screen overflow-hidden grid-bg">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[420px] bg-[radial-gradient(ellipse_at_top,rgba(124,92,255,0.18),transparent_60%)]" />

      <nav className="relative mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <div className="flex items-center gap-2">
          <div className="size-2 rounded-full bg-accent animate-pulse_dot" />
          <span className="font-mono text-sm tracking-wider">react-rendering-lab</span>
        </div>
        <div className="flex items-center gap-3 text-xs text-ink-muted">
          <span className="pill">v0.1 · alpha</span>
          <Link href="/lab/01-reconciliation" className="rounded-md bg-accent px-3 py-1.5 text-xs font-medium text-white shadow-glass hover:brightness-110">
            Start the lab →
          </Link>
        </div>
      </nav>

      <section className="relative mx-auto max-w-6xl px-6 pt-20 pb-12">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-accent">A debugging simulator for advanced React</p>
        <h1 className="mt-3 max-w-3xl text-5xl font-medium leading-[1.05] tracking-tight md:text-6xl">
          One broken dashboard.
          <br />
          <span className="text-ink-muted">Ten architectural fixes.</span>
          <br />
          You feel every bottleneck.
        </h1>
        <p className="mt-6 max-w-2xl text-ink-muted leading-relaxed">
          Most React courses teach concepts in isolation. This lab evolves a single deliberately broken dashboard. You profile the
          symptoms, apply a pattern, watch the metrics change — and discover the <em className="not-italic text-ink">next</em>{" "}
          bottleneck the fix just exposed.
        </p>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/lab/01-reconciliation"
            className="rounded-md bg-accent px-4 py-2.5 text-sm font-medium text-white shadow-glass hover:brightness-110"
          >
            Begin Module 1 →
          </Link>
          <a
            href="https://react.dev/learn/render-and-commit"
            target="_blank"
            rel="noreferrer"
            className="rounded-md border border-bg-border bg-bg-panel px-4 py-2.5 text-sm text-ink hover:bg-bg-elevated"
          >
            Read the React docs
          </a>
        </div>
      </section>

      <section className="relative mx-auto max-w-6xl px-6 pb-24">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-mono text-xs uppercase tracking-widest text-ink-muted">Modules</h2>
          <span className="font-mono text-[11px] text-ink-dim">{MODULES.length} stages · ~3-4 hrs</span>
        </div>
        <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {MODULES.map((m, i) => (
            <li key={m.slug}>
              <Link
                href={`/lab/${m.slug}`}
                className="group block rounded-lg border border-bg-border bg-bg-panel p-4 transition hover:border-accent/50 hover:bg-bg-elevated"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[11px] text-ink-dim">{String(i + 1).padStart(2, "0")}</span>
                  <span className="pill">{m.tag}</span>
                </div>
                <div className="mt-3 text-sm font-medium text-ink">{m.title}</div>
                <p className="mt-1 text-xs leading-relaxed text-ink-muted">{m.hook}</p>
                <p className="mt-3 text-[11px] font-mono text-accent/80 opacity-0 transition group-hover:opacity-100">
                  next bottleneck → {m.next}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
