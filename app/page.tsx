import Link from "next/link";
import { MODULES } from "@/modules/registry";
import { AdSlot } from "@/ads/AdSlot";
import { SiteFooter } from "@/shell/SiteFooter";
import { PendingLink } from "@/shell/PendingLink";

export default function Landing() {
  return (
    <main className="relative min-h-screen overflow-x-hidden grid-bg">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[320px] bg-[radial-gradient(ellipse_at_top,rgba(124,92,255,0.18),transparent_60%)] sm:h-[420px]" />

      <NavBar />
      <Hero />
      <LearningPaths />
      <ModuleList />
      {/* In-feed native ad — between substantive content blocks, the AdSense-preferred location */}
      <section className="relative mx-auto max-w-6xl px-4 pb-10 sm:px-6">
        <AdSlot
          slotId={process.env.NEXT_PUBLIC_ADSENSE_SLOT_LANDING_INFEED ?? ""}
          format="fluid"
          layoutKey="-fb+5w+4e-db+86"
          minHeight={140}
          className="rounded-lg border border-bg-border bg-bg-panel p-4"
        />
      </section>
      <HowItWorks />
      <FAQ />
      <SiteFooter />
    </main>
  );
}

function NavBar() {
  return (
    <nav className="relative mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-6 sm:py-5">
      <div className="flex items-center gap-2">
        <div className="size-2 rounded-full bg-accent animate-pulse_dot" />
        <span className="font-mono text-[13px] tracking-wider sm:text-sm">react-rendering-lab</span>
      </div>
      <div className="flex flex-wrap items-center gap-2 text-xs text-ink-muted sm:gap-3">
        <Link href="/lab" className="text-ink-muted hover:text-ink">
          Lab hub
        </Link>
        <Link href="/lab/journey" className="text-ink-muted hover:text-ink">
          Journey
        </Link>
        <Link href="/pricing" className="text-ink-muted hover:text-ink">
          Pricing
        </Link>
        <a href="https://github.com/mithun9421/react-rendering-lab" target="_blank" rel="noreferrer" className="text-ink-muted hover:text-ink">
          GitHub
        </a>
        <span className="pill">v0.9 · alpha</span>
        <PendingLink
          href="/lab/01-reconciliation"
          className="rounded-md bg-accent px-3 py-1.5 text-xs font-medium text-white shadow-glass active:scale-95 hover:brightness-110"
        >
          Start the lab →
        </PendingLink>
      </div>
    </nav>
  );
}

function Hero() {
  return (
    <section className="relative mx-auto max-w-6xl px-4 pb-10 pt-10 sm:px-6 sm:pt-20 sm:pb-12">
      <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-accent sm:text-xs sm:tracking-[0.2em]">
        A debugging simulator for advanced React + frontend systems
      </p>
      <h1 className="mt-3 max-w-3xl text-[34px] font-medium leading-[1.05] tracking-tight sm:text-5xl md:text-6xl">
        One broken dashboard.
        <br />
        <span className="text-ink-muted">Twenty-five architectural fixes.</span>
        <br />
        You feel every bottleneck.
      </h1>
      <p className="mt-5 max-w-2xl text-sm leading-relaxed text-ink-muted sm:mt-6 sm:text-base">
        Most React courses teach concepts in isolation. This lab evolves a single deliberately
        broken dashboard. You profile the symptoms, apply a pattern, watch the metrics change —
        and discover the <em className="not-italic text-ink">next</em> bottleneck the fix just
        exposed. From key collisions to incident-response, the whole frontend systems surface in
        one continuous arc.
      </p>

      <div className="mt-6 flex flex-col gap-2.5 sm:mt-8 sm:flex-row sm:flex-wrap sm:gap-3">
        <PendingLink
          href="/lab/01-reconciliation"
          className="rounded-md bg-accent px-4 py-3 text-center text-sm font-medium text-white shadow-glass active:scale-95 sm:py-2.5 hover:brightness-110"
        >
          Begin Module 1 →
        </PendingLink>
        <PendingLink
          href="/lab/journey"
          className="rounded-md border border-accent/40 bg-accent/5 px-4 py-3 text-center text-sm font-medium text-accent shadow-glass active:scale-95 sm:py-2.5 hover:bg-accent/10"
        >
          Watch the dashboard evolve ▸
        </PendingLink>
        <PendingLink
          href="/lab/25-incident-simulator"
          className="rounded-md border border-bg-border bg-bg-panel px-4 py-3 text-center text-sm text-ink active:scale-95 sm:py-2.5 hover:bg-bg-elevated"
        >
          Jump to the incident simulator
        </PendingLink>
      </div>

      <dl className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat n="36" l="lessons" />
        <Stat n="47" l="interview Qs" />
        <Stat n="6" l="incident scenarios" />
        <Stat n="100%" l="client-side · open source" />
      </dl>

      <Link
        href="/lab/daily"
        className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-accent-warn/30 bg-accent-warn/[0.06] p-4 transition hover:border-accent-warn/60"
      >
        <div className="min-w-0">
          <div className="font-mono text-[10px] uppercase tracking-widest text-accent-warn">
            ◐ daily challenge · refreshes midnight UTC
          </div>
          <h3 className="mt-1 truncate text-sm font-medium text-ink">
            One curated React / systems question per day — don&apos;t break the streak.
          </h3>
        </div>
        <span
          aria-hidden
          className="rounded-md bg-accent-warn px-3 py-1.5 font-mono text-[11px] text-bg"
        >
          take today&apos;s →
        </span>
      </Link>
    </section>
  );
}

function Stat({ n, l }: { n: string; l: string }) {
  return (
    <div className="rounded-lg border border-bg-border bg-bg-panel p-3">
      <dd className="font-mono text-3xl tabular-nums text-ink">{n}</dd>
      <dt className="mt-1 font-mono text-[10px] uppercase tracking-widest text-ink-dim">{l}</dt>
    </div>
  );
}

function LearningPaths() {
  return (
    <section className="relative mx-auto max-w-6xl px-4 pb-12 sm:px-6">
      <h2 className="font-mono text-xs uppercase tracking-widest text-ink-muted">Three ways to read it</h2>
      <p className="mt-1 text-sm text-ink-dim">
        Same content, different entry points. Pick the one that matches what you&apos;re here for.
      </p>
      <div className="mt-4 grid gap-3 md:grid-cols-2 lg:grid-cols-4">
        <Path
          tone="info"
          title="New to React · the Foundations"
          time="~2 hrs"
          for="you've written some JSX but want a real foundation"
          steps={["F01 components", "F02 props · F03 state · F04 effects", "→ flows into Module 1"]}
          cta={{ href: "/lab/f01-components", label: "Start at F01 →" }}
        />
        <Path
          tone="info"
          title="Linear · the bottleneck chain"
          time="3-4 hrs"
          for="comfortable with React — go straight to the meat"
          steps={["Start at Module 1", "Keep clicking 'next bottleneck'", "Finish at the Incident Simulator"]}
          cta={{ href: "/lab/01-reconciliation", label: "Start at Module 1 →" }}
        />
        <Path
          tone="accent"
          title="Demonstrative · the Journey"
          time="20-30 min"
          for="experienced devs who want the payoff fast"
          steps={["Open /lab/journey", "Slide level 0 → 10", "See the same surface evolve"]}
          cta={{ href: "/lab/journey", label: "Open the Journey →" }}
        />
        <Path
          tone="warn"
          title="Interview · Staff+ practice"
          time="open-ended"
          for="anyone prepping for a senior-or-higher round"
          steps={["Pick a category", "Commit to an answer", "Read the model + score"]}
          cta={{ href: "/lab/interview", label: "Start the question bank →" }}
        />
        <Path
          tone="warn"
          title="Diagnostic · the Incident Simulator"
          time="open-ended"
          for="on-call practice"
          steps={["Get an incident", "Diagnose · fix · validate", "New scenario · score it"]}
          cta={{ href: "/lab/25-incident-simulator", label: "Drop into on-call →" }}
        />
      </div>
    </section>
  );
}

function Path({
  tone,
  title,
  time,
  for: forWho,
  steps,
  cta,
}: {
  tone: "info" | "accent" | "warn";
  title: string;
  time: string;
  for: string;
  steps: string[];
  cta: { href: string; label: string };
}) {
  const toneCls = {
    info: "border-accent-info/30 bg-accent-info/5 text-accent-info",
    accent: "border-accent/40 bg-accent/5 text-accent",
    warn: "border-accent-warn/30 bg-accent-warn/5 text-accent-warn",
  }[tone];
  return (
    <div className={"rounded-lg border bg-bg-panel p-4 " + toneCls.split(" ").filter(Boolean).slice(0, 2).join(" ")}>
      <div className="flex items-baseline justify-between">
        <h3 className="text-sm font-medium text-ink">{title}</h3>
        <span className="font-mono text-[10px] uppercase tracking-widest text-ink-dim">{time}</span>
      </div>
      <p className="mt-1 text-xs text-ink-muted">for {forWho}</p>
      <ol className="mt-3 space-y-1 text-xs text-ink-muted">
        {steps.map((s, i) => (
          <li key={i} className="flex items-start gap-2">
            <span className="font-mono text-[10px] text-ink-dim">{i + 1}.</span>
            <span>{s}</span>
          </li>
        ))}
      </ol>
      <Link href={cta.href} className="mt-4 inline-block text-xs font-medium text-accent hover:text-accent">
        {cta.label}
      </Link>
    </div>
  );
}

function ModuleList() {
  return (
    <section className="relative mx-auto max-w-6xl px-4 pb-12 sm:px-6">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-mono text-xs uppercase tracking-widest text-ink-muted">All modules</h2>
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
              <p className="mt-3 font-mono text-[11px] text-accent/70 transition group-hover:text-accent">
                next → <span className="text-accent/90">{m.next}</span>
              </p>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

function HowItWorks() {
  return (
    <section className="relative mx-auto max-w-6xl px-4 pb-16 sm:px-6">
      <h2 className="font-mono text-xs uppercase tracking-widest text-ink-muted">How a module works</h2>
      <p className="mt-1 max-w-2xl text-sm text-ink-dim">
        Every module follows the same six-beat rhythm. The point is muscle memory — by Module 5
        you&apos;re predicting the next callout before you read it.
      </p>
      <ol className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {BEATS.map((b, i) => (
          <li key={b.label} className="rounded-lg border border-bg-border bg-bg-panel p-4">
            <div className="flex items-center gap-2">
              <span className="grid size-6 place-items-center rounded-full border border-bg-border bg-bg-elevated font-mono text-[10px] text-accent">
                {i + 1}
              </span>
              <h3 className="text-sm font-medium text-ink">{b.label}</h3>
            </div>
            <p className="mt-2 text-xs leading-relaxed text-ink-muted">{b.text}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}
const BEATS = [
  { label: "Observe", text: "You meet the broken behaviour in the dashboard. Watch a flash, feel an input lag, notice a metric climb." },
  { label: "Profile", text: "The dock at the bottom records FPS, render counts, commit durations. You confirm the symptom with numbers, not vibes." },
  { label: "Explain", text: "A short narrative explains the internal mechanism — what React (or the browser, or the network) is actually doing." },
  { label: "Apply fix", text: "A real interactive control flips the pattern on. Same dashboard, same data — different mental model." },
  { label: "Validate", text: "Metrics move. Render counts drop. FPS recovers. The numbers prove the pattern worked." },
  { label: "Next bottleneck", text: "A callout points at what's now visible only because you fixed the previous thing. Click — you're at the next module." },
];

function FAQ() {
  return (
    <section className="relative mx-auto max-w-6xl px-4 pb-24 sm:px-6">
      <h2 className="font-mono text-xs uppercase tracking-widest text-ink-muted">FAQ</h2>
      <dl className="mt-4 space-y-3">
        {Q.map((q) => (
          <details key={q.q} className="group rounded-lg border border-bg-border bg-bg-panel p-4 open:border-accent/40">
            <summary className="flex cursor-pointer items-center justify-between text-sm font-medium text-ink">
              <span>{q.q}</span>
              <span className="font-mono text-[11px] text-ink-dim group-open:text-accent">+</span>
            </summary>
            <dd className="mt-2 text-sm leading-relaxed text-ink-muted">{q.a}</dd>
          </details>
        ))}
      </dl>
    </section>
  );
}
const Q = [
  {
    q: "Who is this lab for?",
    a: "Working React engineers and devs prepping for Staff-level interviews. The first 10 modules assume you can read JSX and have written useState before. From Module 11 onward you get React 19's modern primitives (Compiler, RSC, Actions, use(), PPR). From Module 16 we leave React proper and walk the full frontend systems surface — state, network, build, observability, security, on-call.",
  },
  {
    q: "What if I just want to demo it to my team?",
    a: "Open /lab/journey on a TV. Slide level 0 → 10. The same dashboard surface morphs in front of them as each module's fix is applied. Twenty minutes; no setup; conversation guaranteed.",
  },
  {
    q: "Why a custom profiler instead of React DevTools?",
    a: "DevTools shows you render reasons after the fact. The lab needs overlays you can't get from DevTools — animated Fiber traversal, scheduler-queue snapshots, lane-bitmask viz, hydration order — driven from the same store the metrics dock reads.",
  },
  {
    q: "Is anything sent to a server?",
    a: "Almost nothing. The lab is statically rendered. Module 13 (Server Actions) uses Next.js Server Actions for the demo form, but it's an in-memory store on the same Vercel function. There is no analytics, no telemetry, no third-party scripts.",
  },
  {
    q: "Can I use the visualisations / code in my own teaching?",
    a: "Yes — MIT licensed. Fork the GitHub repo. The src/engine/ primitives (Lesson, Step, TryIt, BeforeAfter, MetricsPanel, ArchitectGate) are intentionally generic.",
  },
  {
    q: "What about React DevTools' new Suspense / Performance / Trace features?",
    a: "Module 22 (Observability) shows the in-page equivalents — real Web Vitals readouts from PerformanceObserver. The lab is meant to be the bridge from 'read the docs' to 'open DevTools and know what you're looking at.'",
  },
];

