"use client";

import { useEffect, useRef, useState } from "react";
import clsx from "clsx";
import { Lesson } from "@/engine/Lesson";
import { Step } from "@/engine/Step";
import { Callout } from "@/engine/Callout";
import { ArchitectNotes } from "@/engine/ArchitectNotes";

type Span = { id: number; name: string; start: number; dur: number; kind: "frontend" | "backend" };

export default function Module22() {
  return (
    <Lesson slug="22-observability">
      <Step n={1} kind="observe" title="If a page is slow in prod and you can't see it, did it happen?">
        <p>
          You can&apos;t fix what you can&apos;t measure. RUM (Real User Monitoring) samples
          actual sessions in production and reports back Web Vitals + custom marks. Tracing
          connects a slow frontend span to the backend span that caused it.
        </p>
      </Step>

      <Step n={2} kind="profile" title="Web Vitals — read from your own page, live">
        <WebVitalsDashboard />
        <p className="mt-3 text-xs text-ink-muted">
          Real values from this very page&apos;s PerformanceObserver. Targets are Google&apos;s
          published &quot;good&quot; thresholds.
        </p>
      </Step>

      <Step n={3} kind="explain" title="The Core Web Vitals — what they actually measure">
        <ul>
          <li>
            <strong>LCP</strong> (Largest Contentful Paint) — when did the biggest above-the-fold
            element render? Image, headline, hero. Good: <code>≤ 2.5s</code>.
          </li>
          <li>
            <strong>INP</strong> (Interaction to Next Paint) — for every click/keystroke, how
            long until the next paint? Replaced FID in 2024. Good: <code>≤ 200ms</code>.
          </li>
          <li>
            <strong>CLS</strong> (Cumulative Layout Shift) — total visible movement during the
            session. Good: <code>≤ 0.1</code>.
          </li>
          <li>
            <strong>TTFB</strong> (Time to First Byte) — server + network round-trip. The floor
            on everything downstream.
          </li>
        </ul>
      </Step>

      <Step n={4} kind="profile" title="Distributed trace — frontend ↔ backend">
        <p>
          OpenTelemetry instruments both sides. A <code>traceparent</code> header on the fetch
          links the frontend span to the backend span; you see the full causal chain in one
          flamegraph.
        </p>
        <TraceFlame />
      </Step>

      <Step n={5} kind="explain" title="Custom marks — your code, your metrics">
        <pre className="not-prose overflow-x-auto rounded-md border border-bg-border bg-bg-elevated p-3 font-mono text-[10px] leading-relaxed">
{`// In your code:
performance.mark("checkout:start");
await runCheckout();
performance.mark("checkout:end");
performance.measure("checkout", "checkout:start", "checkout:end");

// In your RUM reporter:
const observer = new PerformanceObserver((list) => {
  for (const entry of list.getEntries()) {
    beacon.send({
      name: entry.name,
      dur: entry.duration,
      sessionId, userId, route,
    });
  }
});
observer.observe({ type: "measure", buffered: true });`}
        </pre>
      </Step>

      <Step n={6} kind="explain" title="Beaconing — don't lose the metric when the user leaves">
        <p>
          Sending metrics over <code>fetch()</code> on <code>beforeunload</code> is unreliable —
          the request is cancelled when the page navigates. Use{" "}
          <code>navigator.sendBeacon(url, json)</code>: the browser queues the POST and lets it
          finish even after the page is gone.
        </p>
      </Step>

      <ArchitectNotes
        framing="Observability is the senior topic where 'I add console.log' and 'I instrument three signals against a budget' get sorted. The architect tests whether you can articulate sampling, sourcemaps, and the FE-BE trace bridge."
        followUps={[
          {
            q: "What's the three-signals model for frontend observability?",
            a: "(1) Metrics: numeric time-series — Web Vitals, custom timings, error rate, request count. Aggregable, cheap to store. (2) Logs: structured events — user action, error, warning. Searchable but expensive at volume. (3) Traces: per-request causal chains spanning frontend + backend — fetch X started here, backend processed for 200ms, response returned, frontend rendered in 30ms. Connected via traceparent header. Senior interviewers want all three named; juniors usually skip traces.",
          },
          {
            q: "Walk me through the INP measurement strategy in production.",
            a: "Subscribe to `PerformanceObserver({ type: 'event', buffered: true, durationThreshold: 16 })`. For each event entry, INP candidate = entry.duration. Track the LONGEST event across the session (or p98 if you have many). Send via `navigator.sendBeacon()` on visibilitychange/pagehide to your RUM endpoint with sessionId + url + INP value. Compare against the Web Vitals threshold (200ms good, 500ms poor). The architect may probe: 'why sendBeacon and not fetch?' Answer: navigation cancels fetch, sendBeacon survives.",
          },
          {
            q: "Sourcemaps in production — host them, hide them, or destroy them?",
            a: "Host them, with auth. Without sourcemaps, error reports show minified line:column — useless. Solution: upload sourcemaps to your error tracker (Sentry, Datadog) at deploy time so symbolication happens server-side; do NOT serve sourcemaps publicly (they expose your code). For Webpack/Vite/Turbopack: `sourcemap: 'hidden'` mode emits the file but doesn't reference it from the JS. The architect tests whether you've thought about the source-code-leak trade-off.",
          },
          {
            q: "Distributed tracing — how does the trace bridge frontend → backend?",
            a: "OpenTelemetry standard: generate a `traceparent` header `00-{traceId}-{spanId}-01`. The frontend's fetch call sends it. Backend reads it, opens a child span with that parent, executes, closes. Both spans land in your trace store (Datadog, Honeycomb, Tempo). UI shows them in one flame graph. For RSC, the server can generate the traceId before render so frontend SPANs inherit it. The architect may probe: 'what about Server Action latency?' Answer: same mechanism — Action's POST carries traceparent, the handler creates a span.",
          },
          {
            q: "Real User Monitoring (RUM) vs synthetic — when each?",
            a: "RUM samples real sessions, biased toward your actual user distribution (devices, locations, networks). Honest but noisy. Synthetic runs scripted journeys at fixed intervals from controlled environments — clean baselines, easy to compare PRs, but ignores real-world variability. Use both. RUM tells you what your USERS experience; synthetic tells you what CHANGED. Senior interviewers test if you can articulate the gap.",
          },
        ]}
        pivots={[
          { to: "Web Vitals (LCP, INP, CLS)", why: "Concrete metrics they'll probe." },
          { to: "Error boundaries + onCaughtError", why: "Reporting layer integration." },
          { to: "Session replay (FullStory, LogRocket)", why: "The architect may probe trade-offs vs privacy." },
        ]}
        dontSay={[
          {
            phrase: "We use Google Analytics for everything.",
            why: "GA is a metric layer, not full observability. Missing traces, missing detailed errors, missing performance API integration. The architect wants to hear the full three-signals model.",
          },
          {
            phrase: "INP is just FID renamed.",
            why: "INP measures the LONGEST interaction in the session, not just the first. Different semantics, harder bar.",
          },
        ]}
      />

      <Step n={7} kind="next" title="You can see the problems. Now you have to find the leaks.">
        <Callout tone="next" title="next bottleneck">
          RUM shows degradation over a session — but the why is usually invisible. Module 23
          adds the second instrument: memory.
        </Callout>
      </Step>
    </Lesson>
  );
}

/* ─────────── Web Vitals dashboard (real values) ─────────── */

type Vital = { lcp?: number; cls?: number; ttfb?: number; inp?: number; fcp?: number };

function WebVitalsDashboard() {
  const [v, setV] = useState<Vital>({});
  const interactionLong = useRef<number>(0);

  useEffect(() => {
    // LCP
    try {
      const lcpObs = new PerformanceObserver((list) => {
        const entries = list.getEntries() as PerformanceEntry[];
        const last = entries[entries.length - 1] as PerformanceEntry & { renderTime?: number; loadTime?: number };
        const t = (last.renderTime || last.loadTime || last.startTime) as number;
        setV((p) => ({ ...p, lcp: t }));
      });
      lcpObs.observe({ type: "largest-contentful-paint", buffered: true });
    } catch {
      /* no-op */
    }

    // CLS
    try {
      let cls = 0;
      const clsObs = new PerformanceObserver((list) => {
        for (const entry of list.getEntries() as (PerformanceEntry & {
          value: number;
          hadRecentInput: boolean;
        })[]) {
          if (!entry.hadRecentInput) cls += entry.value;
        }
        setV((p) => ({ ...p, cls }));
      });
      clsObs.observe({ type: "layout-shift", buffered: true });
    } catch {
      /* no-op */
    }

    // Paint timing (FCP)
    try {
      const paintObs = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.name === "first-contentful-paint") {
            setV((p) => ({ ...p, fcp: entry.startTime }));
          }
        }
      });
      paintObs.observe({ type: "paint", buffered: true });
    } catch {
      /* no-op */
    }

    // Navigation TTFB
    try {
      const nav = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined;
      if (nav) setV((p) => ({ ...p, ttfb: nav.responseStart - nav.requestStart }));
    } catch {
      /* no-op */
    }

    // Event timing → approximate INP (longest interaction)
    try {
      const evObs = new PerformanceObserver((list) => {
        for (const entry of list.getEntries() as (PerformanceEntry & { duration: number })[]) {
          if (entry.duration > interactionLong.current) {
            interactionLong.current = entry.duration;
            setV((p) => ({ ...p, inp: interactionLong.current }));
          }
        }
      });
      evObs.observe({ type: "event", buffered: true, durationThreshold: 16 } as PerformanceObserverInit);
    } catch {
      /* no-op */
    }
  }, []);

  return (
    <div className="not-prose mt-3 grid grid-cols-2 gap-2 sm:grid-cols-5">
      <Gauge label="LCP" value={v.lcp} unit="ms" good={2500} poor={4000} fmt={(x) => x.toFixed(0)} />
      <Gauge
        label="INP"
        value={v.inp}
        unit="ms"
        good={200}
        poor={500}
        fmt={(x) => x.toFixed(0)}
        hint="interact with the page first"
      />
      <Gauge label="CLS" value={v.cls} unit="" good={0.1} poor={0.25} fmt={(x) => x.toFixed(3)} />
      <Gauge label="FCP" value={v.fcp} unit="ms" good={1800} poor={3000} fmt={(x) => x.toFixed(0)} />
      <Gauge label="TTFB" value={v.ttfb} unit="ms" good={800} poor={1800} fmt={(x) => x.toFixed(0)} />
    </div>
  );
}

function Gauge({
  label,
  value,
  unit,
  good,
  poor,
  fmt,
  hint,
}: {
  label: string;
  value: number | undefined;
  unit: string;
  good: number;
  poor: number;
  fmt: (n: number) => string;
  hint?: string;
}) {
  const tone = value == null ? "warn" : value <= good ? "good" : value <= poor ? "warn" : "bad";
  return (
    <div className="rounded-lg border border-bg-border bg-bg-panel p-3">
      <div className="flex items-center justify-between">
        <span className="font-mono text-[10px] uppercase tracking-widest text-ink-dim">{label}</span>
        <span
          className={clsx(
            "size-1.5 rounded-full",
            tone === "good" && "bg-accent-good",
            tone === "warn" && "bg-accent-warn",
            tone === "bad" && "bg-accent-bad"
          )}
        />
      </div>
      <div
        className={clsx(
          "mt-2 font-mono text-xl tabular-nums",
          tone === "good" && "text-ink",
          tone === "warn" && "text-accent-warn",
          tone === "bad" && "text-accent-bad"
        )}
      >
        {value == null ? "—" : `${fmt(value)}${unit}`}
      </div>
      <div className="mt-1 font-mono text-[10px] text-ink-dim">
        {hint ?? `good ≤ ${fmt(good)}${unit}`}
      </div>
    </div>
  );
}

/* ─────────── distributed trace flame ─────────── */

const SPANS: Span[] = [
  { id: 1, name: "FE · navigate → /dashboard", start: 0, dur: 60, kind: "frontend" },
  { id: 2, name: "FE · fetch /api/feed", start: 60, dur: 380, kind: "frontend" },
  { id: 3, name: "BE · handler /api/feed", start: 70, dur: 320, kind: "backend" },
  { id: 4, name: "BE · db.query stocks", start: 110, dur: 260, kind: "backend" },
  { id: 5, name: "BE · cache.set", start: 380, dur: 8, kind: "backend" },
  { id: 6, name: "FE · render <StockFeed>", start: 460, dur: 90, kind: "frontend" },
  { id: 7, name: "FE · LCP", start: 540, dur: 6, kind: "frontend" },
];

function TraceFlame() {
  const total = Math.max(...SPANS.map((s) => s.start + s.dur));
  return (
    <div className="not-prose mt-3 overflow-hidden rounded-lg border border-bg-border bg-bg-panel">
      <div className="space-y-1 p-3">
        {SPANS.map((s) => (
          <div key={s.id} className="grid grid-cols-[1fr_3fr] items-center gap-3 font-mono text-[11px]">
            <span className="truncate text-ink-muted">{s.name}</span>
            <div className="relative h-3 rounded bg-bg-elevated">
              <div
                className={clsx(
                  "absolute top-0 h-3 rounded",
                  s.kind === "frontend" ? "bg-accent/60" : "bg-accent-info/60"
                )}
                style={{ left: `${(s.start / total) * 100}%`, width: `${(s.dur / total) * 100}%` }}
                title={`${s.dur}ms`}
              />
            </div>
          </div>
        ))}
      </div>
      <div className="border-t border-bg-border px-3 py-2 font-mono text-[10px] text-ink-dim">
        purple = frontend span · blue = backend span · the same trace, linked via traceparent
      </div>
    </div>
  );
}
