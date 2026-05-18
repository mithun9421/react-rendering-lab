import Link from "next/link";
import { MODULES } from "@/modules/registry";

export default function Landing() {
  return (
    <main className="relative min-h-screen overflow-x-hidden grid-bg">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[320px] bg-[radial-gradient(ellipse_at_top,rgba(124,92,255,0.18),transparent_60%)] sm:h-[420px]" />

      <nav className="relative mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-6 sm:py-5">
        <div className="flex items-center gap-2">
          <div className="size-2 rounded-full bg-accent animate-pulse_dot" />
          <span className="font-mono text-[13px] tracking-wider sm:text-sm">react-rendering-lab</span>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs text-ink-muted sm:gap-3">
          <span className="pill">v0.2 · alpha</span>
          <Link
            href="/lab/01-reconciliation"
            className="rounded-md bg-accent px-3 py-1.5 text-xs font-medium text-white shadow-glass active:scale-95 hover:brightness-110"
          >
            Start the lab →
          </Link>
        </div>
      </nav>

      <section className="relative mx-auto max-w-6xl px-4 pb-10 pt-10 sm:px-6 sm:pt-20 sm:pb-12">
        <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-accent sm:text-xs sm:tracking-[0.2em]">
          A debugging simulator for advanced React
        </p>
        <h1 className="mt-3 max-w-3xl text-[34px] font-medium leading-[1.05] tracking-tight sm:text-5xl md:text-6xl">
          One broken dashboard.
          <br />
          <span className="text-ink-muted">Fifteen architectural fixes.</span>
          <br />
          You feel every bottleneck.
        </h1>
        <p className="mt-5 max-w-2xl text-sm leading-relaxed text-ink-muted sm:mt-6 sm:text-base">
          Most React courses teach concepts in isolation. This lab evolves a single deliberately broken dashboard. You profile
          the symptoms, apply a pattern, watch the metrics change — and discover the{" "}
          <em className="not-italic text-ink">next</em> bottleneck the fix just exposed.
        </p>

        <div className="mt-6 flex flex-col gap-2.5 sm:mt-8 sm:flex-row sm:flex-wrap sm:gap-3">
          <Link
            href="/lab/01-reconciliation"
            className="rounded-md bg-accent px-4 py-3 text-center text-sm font-medium text-white shadow-glass active:scale-95 sm:py-2.5 hover:brightness-110"
          >
            Begin Module 1 →
          </Link>
          <Link
            href="/lab/journey"
            className="rounded-md border border-accent/40 bg-accent/5 px-4 py-3 text-center text-sm font-medium text-accent shadow-glass active:scale-95 sm:py-2.5 hover:bg-accent/10"
          >
            Watch the dashboard evolve ▸
          </Link>
          <a
            href="https://react.dev/learn/render-and-commit"
            target="_blank"
            rel="noreferrer"
            className="rounded-md border border-bg-border bg-bg-panel px-4 py-3 text-center text-sm text-ink active:scale-95 sm:py-2.5 hover:bg-bg-elevated"
          >
            Read the React docs
          </a>
        </div>
      </section>

      <section className="relative mx-auto max-w-6xl px-4 pb-24 sm:px-6">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-mono text-xs uppercase tracking-widest text-ink-muted">Modules</h2>
          <span className="font-mono text-[10px] text-ink-dim sm:text-[11px]">
            {MODULES.length} stages · ~3-4 hrs
          </span>
        </div>
        <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {MODULES.map((m, i) => (
            <li key={m.slug}>
              <Link
                href={`/lab/${m.slug}`}
                className="group flex h-full flex-col rounded-lg border border-bg-border bg-bg-panel p-4 transition active:scale-[0.99] hover:border-accent/50 hover:bg-bg-elevated"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[11px] text-ink-dim">{String(i + 1).padStart(2, "0")}</span>
                  <span className="pill">{m.tag}</span>
                </div>
                <div className="mt-3 text-sm font-medium text-ink">{m.title}</div>
                <p className="mt-1 text-xs leading-relaxed text-ink-muted">{m.hook}</p>
                {/* On touch devices group-hover never fires — show with reduced opacity always; brighten on hover */}
                <p className="mt-3 font-mono text-[11px] text-accent/70 transition group-hover:text-accent">
                  next → <span className="text-accent/90">{m.next}</span>
                </p>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
