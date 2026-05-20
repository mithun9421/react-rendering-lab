"use client";

import { useEffect, useRef, useState } from "react";
import clsx from "clsx";
import { Lesson } from "@/engine/Lesson";
import { Step } from "@/engine/Step";
import { Callout } from "@/engine/Callout";
import { ArchitectNotes } from "@/engine/ArchitectNotes";
import { TryIt } from "@/engine/TryIt";

type Req = {
  id: number;
  url: string;
  start: number;
  end: number;
  status: 200 | 304 | 500 | "pending";
  cache: "miss" | "hit" | "swr";
  parent?: number;
};

export default function Module18() {
  return (
    <Lesson slug="18-network-data">
      <Step n={1} kind="observe" title="A waterfall isn't a metaphor — it's a queueing pattern">
        <p>
          Browsers limit per-origin parallelism (~6 over HTTP/1.1, hundreds over HTTP/2 — but
          the server still has a connection budget). Every dependent request — fetch X → parse →
          fetch Y based on X — adds a full round-trip latency to your time-to-interactive.
        </p>
      </Step>

      <Step n={2} kind="profile" title="Watch your own dashboard's network">
        <TryIt
          title="request shape"
          knobs={[
            { key: "waterfall", label: "sequential (waterfall)", default: true },
            { key: "parallel", label: "parallel", default: false },
            { key: "dedup", label: "dedup duplicate keys", default: false },
            { key: "slow", label: "slow 3G (+300ms RTT)", default: false },
          ]}
          hint="Sequential: each request waits for the previous. Parallel: all start at once, total time = max(rtt). Dedup: same key requested 5 times collapses to 1."
        >
          {(flags) => <NetworkLab flags={flags} />}
        </TryIt>
      </Step>

      <Step n={3} kind="explain" title="Four cache strategies, ranked by user perception">
        <ul>
          <li>
            <strong>cache-first</strong> — return cached if present, never refetch. Fastest, most
            stale. For things that genuinely don&apos;t change (an immutable asset URL).
          </li>
          <li>
            <strong>stale-while-revalidate (SWR)</strong> — return cached <em>and</em> refetch in
            background. The UI updates seamlessly when fresh data lands. The 90% answer.
          </li>
          <li>
            <strong>network-first</strong> — try network, fall back to cache on failure. For
            critical writes&apos; read-after-write.
          </li>
          <li>
            <strong>network-only</strong> — always go. For mutations and PII.
          </li>
        </ul>
      </Step>

      <Step n={4} kind="fix" title="Dedup — production code, on a postage stamp">
        <pre className="not-prose overflow-x-auto rounded-md border border-bg-border bg-bg-elevated p-3 font-mono text-[10px] leading-relaxed">
{`const inflight = new Map<string, Promise<Response>>();

export function dedupedFetch(url: string): Promise<Response> {
  const cached = inflight.get(url);
  if (cached) return cached.then((r) => r.clone()); // ← clone for second reader

  const p = fetch(url).finally(() => {
    // expire after a tick so the next call refetches
    queueMicrotask(() => inflight.delete(url));
  });
  inflight.set(url, p);
  return p;
}`}
        </pre>
      </Step>

      <Step n={5} kind="explain" title="Retry & backoff — and the cascade you'd otherwise build">
        <p>
          Naive retry: <code>onError: () =&gt; retry()</code>. When origin returns 503 once, all
          components retry in the same microtask, multiplying with each render. You&apos;ve
          built a thundering-herd amplifier. Production-grade retry needs:
        </p>
        <ul>
          <li><strong>Exponential backoff</strong>: <code>delay = base * 2^attempt</code>.</li>
          <li><strong>Jitter</strong>: <code>delay *= 0.5 + Math.random()</code>. Without it, every client retries at the same instant.</li>
          <li><strong>Max attempts</strong>: stop after K to avoid infinite chains.</li>
          <li><strong>Circuit breaker</strong>: open the circuit after N consecutive failures across the shared key. Stops the herd at the source.</li>
        </ul>
        <RetrySim />
      </Step>

      <ArchitectNotes
        framing="Network questions probe whether you understand the frontend as a CACHE + RETRY system, not just 'fetch and render.' Senior devs talk about queueing, dedup, and the load-amplifier risk."
        followUps={[
          {
            q: "What's the difference between a request waterfall and a parallel fetch?",
            a: "Waterfall: each request depends on the previous (often because the consumer renders nested — fetch user → render component → fetch user's orders → render component → fetch order items). N round-trips. Parallel: all requests fire at once, total time = max(rtt). 1 round-trip wall-clock. The cure is moving fetches OUT of nested rendering and into a parent that issues them in parallel (Promise.all). RSC makes this natural: all queries can `await` at the top of the page, in parallel, before any rendering reads them.",
          },
          {
            q: "How does request deduplication actually work, and where does it live?",
            a: "Two-layer model. (1) In-flight dedup: a Map of `url → Promise`. If the same URL is requested while one is in flight, return the existing Promise instead of starting a new fetch. Lives in your fetch wrapper or the data library (React Query, SWR, RSC's cache()). (2) Result cache: stored response keyed by URL + freshness metadata. SWR/RQ keep this; vanilla fetch doesn't. The architect may probe: 'what about clone()?' — if multiple readers consume the body, you must `.clone()` before each read or only one gets the response.",
          },
          {
            q: "Walk me through a production retry policy that doesn't make the outage worse.",
            a: "Four ingredients. (1) Exponential backoff: delay = baseDelay × 2^attempt. (2) Jitter: delay × (0.5 + Math.random()) — without it every client retries in lockstep, amplifying load. (3) Max retries cap (3-5 typical). (4) Circuit breaker: after K consecutive failures across a shared cache key, OPEN the circuit — short-circuit subsequent calls locally for N seconds before half-open retry. This is the difference between a frontend that AMPLIFIES outages and one that ABSORBS them. The 9000 req/sec retry storm in the Module 25 simulator is what no-jitter looks like in production.",
          },
          {
            q: "Stale-while-revalidate (SWR) — when is it wrong?",
            a: "Wrong when freshness is a correctness constraint, not a UX preference. Showing a stale stock price for 5 seconds while revalidating is fine; showing stale account balance after a transfer can cause real-money confusion. The rule: SWR for content that's eventually consistent and rarely critical; network-first for reads where staleness is dangerous (after-write reads, regulated views). React Query and SWR libraries let you configure per-query — use the granularity.",
          },
          {
            q: "How do you design data fetching that survives a slow 3G connection?",
            a: "Five tactics. (1) Lower the critical-path query count — bundle related data in one endpoint or use RSC's `await Promise.all`. (2) Use Suspense + streaming so the shell paints before the data lands. (3) Set per-route stale-while-revalidate so navigations are instant. (4) Show optimistic UI for mutations — the user doesn't wait on the wire. (5) Set realistic timeouts (3-5s) and degrade gracefully. The architect tests if you can recite this without sounding like a SWR brochure — talk about what you'd skip on slow 3G that you'd ship on fiber.",
          },
        ]}
        pivots={[
          { to: "Incident simulator retry storm (Module 25)", why: "Concrete failure case — they'll ask to walk you through it." },
          { to: "RSC parallel fetching (Module 12)", why: "RSC bypasses the waterfall problem by lifting fetches." },
          { to: "Edge caching + CDN", why: "Where does the dedup conceptually live — client, edge, or origin?" },
        ]}
        dontSay={[
          {
            phrase: "Add an exponential backoff and call it a day.",
            why: "Backoff WITHOUT jitter is still a thundering herd. The architect wants to hear jitter, max-retries, and circuit-breaker as the full package.",
          },
          {
            phrase: "React Query handles it for me.",
            why: "It handles common cases. The architect tests if you UNDERSTAND what RQ is doing (dedup, cache, retry, refocus refetch), not just that you import it.",
          },
        ]}
      />

      <Step n={6} kind="next" title="One app — solved. A hundred apps — the wall.">
        <Callout tone="next" title="next bottleneck">
          A single team can deploy cache strategies cleanly. Once you have many teams, runtime
          contracts, version drift, and shared dependencies become the real cost. Module 19.
        </Callout>
      </Step>
    </Lesson>
  );
}

/* ─────────── network lab ─────────── */

function NetworkLab({ flags }: { flags: { waterfall: boolean; parallel: boolean; dedup: boolean; slow: boolean } }) {
  const [reqs, setReqs] = useState<Req[]>([]);
  const [running, setRunning] = useState(false);

  const run = async () => {
    setRunning(true);
    setReqs([]);
    const t0 = performance.now();
    const rtt = flags.slow ? 320 : 80;

    const urls = ["/api/me", "/api/feed", "/api/feed", "/api/feed", "/api/recs", "/api/comments"];
    let id = 0;

    if (flags.parallel && !flags.waterfall) {
      // Parallel: all kick off together. Optionally dedup.
      const seen = new Map<string, number>();
      const recs: Req[] = urls.map((u) => {
        const startedAt = performance.now() - t0;
        let cached: Req["cache"] = "miss";
        if (flags.dedup && seen.has(u)) cached = "hit";
        else seen.set(u, startedAt);
        return {
          id: ++id,
          url: u,
          start: startedAt,
          end: startedAt + (cached === "hit" ? 4 : rtt + Math.random() * 40),
          status: 200,
          cache: cached,
        };
      });
      setReqs(recs);
    } else {
      // Sequential waterfall
      const recs: Req[] = [];
      const seen = new Map<string, number>();
      let cursor = 0;
      for (const u of urls) {
        const startedAt = cursor;
        let dur = rtt + Math.random() * 40;
        let cache: Req["cache"] = "miss";
        if (flags.dedup && seen.has(u)) {
          dur = 4;
          cache = "hit";
        } else seen.set(u, startedAt);
        recs.push({ id: ++id, url: u, start: startedAt, end: startedAt + dur, status: 200, cache });
        cursor += dur;
      }
      setReqs(recs);
    }
    await new Promise((r) => setTimeout(r, 0));
    setRunning(false);
  };

  useEffect(() => {
    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flags.waterfall, flags.parallel, flags.dedup, flags.slow]);

  const totalDur = Math.max(0, ...reqs.map((r) => r.end));
  const networkBytes = reqs.filter((r) => r.cache !== "hit").length;

  return (
    <div>
      <div className="mb-2 flex flex-wrap items-center gap-3 text-xs">
        <button
          disabled={running}
          onClick={run}
          className="rounded-md bg-accent px-3 py-1.5 font-mono text-[11px] text-white"
        >
          ↻ replay
        </button>
        <span className="font-mono text-ink-dim">
          total: <span className="text-ink">{totalDur.toFixed(0)}ms</span> · network calls:{" "}
          <span className="text-ink">{networkBytes}</span> / {reqs.length}
        </span>
      </div>
      <Waterfall reqs={reqs} totalDur={Math.max(400, totalDur)} />
    </div>
  );
}

function Waterfall({ reqs, totalDur }: { reqs: Req[]; totalDur: number }) {
  return (
    <div className="overflow-hidden rounded-lg border border-bg-border bg-bg-panel">
      <div className="space-y-1 p-3 font-mono text-[11px]">
        {reqs.length === 0 && <div className="text-ink-dim">replay to see the chart</div>}
        {reqs.map((r) => {
          const leftPct = (r.start / totalDur) * 100;
          const widthPct = Math.max(2, ((r.end - r.start) / totalDur) * 100);
          return (
            <div key={r.id} className="grid grid-cols-[1fr_2fr] items-center gap-3">
              <span className="truncate text-ink-muted">
                {r.url}{" "}
                {r.cache === "hit" && (
                  <span className="ml-1 rounded bg-accent-good/15 px-1 py-0.5 text-[9px] uppercase tracking-wider text-accent-good">
                    dedup
                  </span>
                )}
              </span>
              <div className="relative h-3 rounded bg-bg-elevated">
                <div
                  className={clsx(
                    "absolute top-0 h-3 rounded",
                    r.cache === "hit" ? "bg-accent-good/60" : "bg-accent/60"
                  )}
                  style={{ left: `${leftPct}%`, width: `${widthPct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
      <div className="border-t border-bg-border px-3 py-2 font-mono text-[10px] text-ink-dim">
        width ∝ duration · left ∝ start time · green = served from dedup cache
      </div>
    </div>
  );
}

/* ─────────── retry simulator ─────────── */

function RetrySim() {
  const [strategy, setStrategy] = useState<"naive" | "backoff" | "circuit">("naive");
  const [run, setRun] = useState(0);
  return (
    <div className="not-prose mt-3 rounded-lg border border-bg-border bg-bg-panel p-3">
      <div className="mb-2 flex flex-wrap items-center gap-2 text-xs">
        <span className="font-mono text-[10px] uppercase tracking-widest text-ink-dim">strategy</span>
        {(["naive", "backoff", "circuit"] as const).map((s) => (
          <button
            key={s}
            onClick={() => {
              setStrategy(s);
              setRun((r) => r + 1);
            }}
            className={clsx(
              "rounded-md px-2 py-1 font-mono text-[11px]",
              strategy === s ? "bg-accent text-white" : "border border-bg-border text-ink-muted"
            )}
          >
            {s}
          </button>
        ))}
      </div>
      <RetryViz key={`${strategy}-${run}`} strategy={strategy} />
    </div>
  );
}

function RetryViz({ strategy }: { strategy: "naive" | "backoff" | "circuit" }) {
  // Each row = one attempt. Naive fires 8 instant retries. Backoff exponential. Circuit opens after 3 fails.
  const attempts: { at: number; ok?: boolean; opened?: boolean }[] = [];
  if (strategy === "naive") {
    for (let i = 0; i < 8; i++) attempts.push({ at: i * 30 });
  } else if (strategy === "backoff") {
    for (let i = 0; i < 6; i++) {
      const delay = 80 * Math.pow(2, i) * (0.5 + Math.random());
      attempts.push({ at: i === 0 ? 0 : attempts[i - 1].at + delay });
    }
    attempts[5].ok = true; // succeeds on the 6th
  } else {
    for (let i = 0; i < 3; i++) attempts.push({ at: i * 200 });
    attempts.push({ at: 600, opened: true });
  }
  const maxT = attempts[attempts.length - 1].at + 50;
  const networkCalls = attempts.filter((a) => !a.opened).length;

  return (
    <div>
      <div className="mb-2 font-mono text-[11px] text-ink-dim">
        network calls fired: <span className="text-ink">{networkCalls}</span> · timeline below
      </div>
      <div className="relative h-6 overflow-hidden rounded border border-bg-border bg-bg-elevated">
        {attempts.map((a, i) => (
          <div
            key={i}
            title={a.opened ? "circuit opened — no retry" : a.ok ? "success" : "503"}
            className={clsx(
              "absolute top-1 h-4 w-1 rounded-sm",
              a.opened
                ? "bg-accent-good"
                : a.ok
                ? "bg-accent-good"
                : strategy === "naive"
                ? "bg-accent-bad"
                : "bg-accent-warn"
            )}
            style={{ left: `${(a.at / maxT) * 100}%` }}
          />
        ))}
      </div>
      <p className="mt-2 font-mono text-[11px] text-ink-dim">
        {strategy === "naive" && "8 fires in 240ms — herd. The origin gets worse, not better."}
        {strategy === "backoff" &&
          "Each delay roughly doubles. 6th attempt succeeds (origin recovered). Total: ~5s."}
        {strategy === "circuit" &&
          "3 failures → circuit opens. Subsequent requests short-circuit locally for N seconds, sparing origin."}
      </p>
    </div>
  );
}
