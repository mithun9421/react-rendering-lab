"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { Lesson } from "@/engine/Lesson";
import { Step } from "@/engine/Step";
import { Callout } from "@/engine/Callout";
import { ArchitectNotes } from "@/engine/ArchitectNotes";
import { TryIt } from "@/engine/TryIt";

export default function Module23() {
  return (
    <Lesson slug="23-memory-leaks">
      <Step n={1} kind="observe" title="Heap that only goes up. Performance that only goes down.">
        <p>
          A frontend memory leak is almost never &quot;React leaked&quot;. It&apos;s your code
          retaining a reference the GC can&apos;t see is dead — usually because a long-lived
          object (window, document, a module-level Map) still points at it.
        </p>
        <HeapMonitor />
      </Step>

      <Step n={2} kind="profile" title="The four classic leak shapes">
        <TryIt
          title="trigger a leak"
          knobs={[
            { key: "interval", label: "timer leak (setInterval never cleared)", default: false },
            { key: "listener", label: "event listener leak (window.addEventListener)", default: false },
            { key: "closure", label: "stale closure (callback retains big payload)", default: false },
            { key: "cache", label: "unbounded cache (Map grows forever)", default: false },
          ]}
          hint="Toggle one on, watch the heap chart at the top climb. Toggle off — the leaked stuff stays. That's the tell: the heap doesn't drop after GC, only after a hard reload."
        >
          {(flags) => <LeakTriggers flags={flags} />}
        </TryIt>
      </Step>

      <Step n={3} kind="explain" title="Retention paths — why GC won't collect">
        <p>
          JavaScript&apos;s GC marks reachable objects from a small set of <strong>roots</strong>{" "}
          — window, document, the call stack, any live closure. Anything reachable from a root
          stays. Detached DOM nodes are usually retained by:
        </p>
        <RetentionPath />
      </Step>

      <Step n={4} kind="fix" title="The four cleanups, copy-paste-ready">
        <pre className="not-prose overflow-x-auto rounded-md border border-bg-border bg-bg-elevated p-3 font-mono text-[10px] leading-relaxed">
{`// 1. Timer
useEffect(() => {
  const id = setInterval(tick, 1000);
  return () => clearInterval(id);            // ← required
}, []);

// 2. Event listener
useEffect(() => {
  const onResize = () => setW(window.innerWidth);
  window.addEventListener("resize", onResize);
  return () => window.removeEventListener("resize", onResize);
}, []);

// 3. AbortController for fetch
useEffect(() => {
  const ac = new AbortController();
  fetch(url, { signal: ac.signal }).then(setData);
  return () => ac.abort();                   // ← cancels in-flight + handler
}, [url]);

// 4. Bounded cache (LRU)
const cache = new Map();
function getCached(key, fn) {
  if (cache.has(key)) return cache.get(key);
  if (cache.size > 100) cache.delete(cache.keys().next().value);  // evict oldest
  const v = fn();
  cache.set(key, v);
  return v;
}`}
        </pre>
      </Step>

      <Step n={5} kind="explain" title="How to find leaks in production">
        <ol>
          <li>
            <strong>DevTools → Memory → Heap snapshot</strong>. Take one, perform the suspect
            action, take another, compare retained sizes.
          </li>
          <li>
            <strong>DevTools → Performance → Memory checkbox</strong>. Records JS heap over
            time. A sawtooth pattern is healthy; a staircase is the leak.
          </li>
          <li>
            <strong>3-snapshot technique</strong>: snapshot, navigate to suspect, navigate back,
            snapshot. Anything &gt; 0 in the comparison is retained across the round-trip.
          </li>
          <li>
            <strong>WeakRefs / FinalizationRegistry</strong> for instrumentation in dev: track
            when objects are <em>not</em> collected when they should be.
          </li>
        </ol>
      </Step>

      <ArchitectNotes
        framing="Memory questions probe whether you can read a heap snapshot and name retention paths concretely — not just 'cleanups in useEffect.'"
        followUps={[
          {
            q: "Walk me through the 3-snapshot heap technique.",
            a: "(1) Take snapshot A at a baseline. (2) Perform the suspected leak action (open + close a modal 10 times, navigate between routes). (3) Take snapshot B. (4) Force GC (DevTools button). (5) Take snapshot C. (6) In DevTools, Compare C vs A — anything STILL there is retained across the action and survives GC. Filter by your component class names or 'Detached' to find DOM leaks. The architect tests if you've ACTUALLY done this; many seniors haven't.",
          },
          {
            q: "Detached DOM nodes — what makes them stick around?",
            a: "Something in JS holds a reference. The most common culprits: (1) Event listener registered to window/document, closure references the detached subtree. (2) Interval/timeout callback never cleared, closure pins the component. (3) An external library's subscription (websocket, IntersectionObserver) never unsubscribed. (4) React Query cache containing JSX from a closure. The architect may probe: 'how do you find which one?' Answer: in the heap snapshot, click the detached object → 'Retainers' panel shows the chain from GC root to the object. Walk it backwards.",
          },
          {
            q: "How does StrictMode help find memory leaks?",
            a: "It double-invokes effects in dev: mount → cleanup → mount again. If your cleanup doesn't reverse the mount (interval still running, listener still attached), the second mount adds ANOTHER interval/listener on top of the first. After repeated mounts, you'd see N intervals firing. StrictMode catches this in dev before it ships. Disabling StrictMode silences the symptom but ships the leak. The architect tests whether you've ever encountered the StrictMode 'why is my interval firing twice?' question.",
          },
          {
            q: "When do you need WeakRef or FinalizationRegistry?",
            a: "Rare in app code; common in library code that caches large objects. WeakRef holds a reference that doesn't prevent GC. FinalizationRegistry fires a callback when an object IS collected. Use cases: (1) A cache where entries should auto-evict when nothing else references them. (2) Debugging instrumentation: log when a component is collected (to verify cleanup worked). (3) Subscription patterns where you DON'T want the subscription to keep the subscriber alive. For most React app code, useEffect + return cleanup is the right tool; WeakRef is plumbing for library authors.",
          },
          {
            q: "Production memory leak — you can't reproduce locally. How do you debug?",
            a: "Three signals from RUM. (1) `performance.memory.usedJSHeapSize` sampled every 10 seconds, sent to RUM. Compare cohorts over time on the dashboard. (2) Page lifetime: median session duration before crash/reload. (3) Specific suspicions: instrument detached-DOM count (querySelectorAll on a known-leak suspect, check if its size grows unbounded). Bisect via deploys — when did the memory growth start? Often correlates with a specific commit. The architect may probe: 'do you ship feature flags for memory bisects?' Answer: yes, when reproduction is impossible locally, ship a flag that disables the suspect feature and watch memory metrics.",
          },
        ]}
        pivots={[
          { to: "Effect cleanups (F04)", why: "Most leaks trace to missing cleanups." },
          { to: "Observability (Module 22)", why: "How you SEE the leak in prod." },
          { to: "useSyncExternalStore subscription pattern", why: "External stores must clean up — a common leak class." },
        ]}
        dontSay={[
          {
            phrase: "Just disable StrictMode in dev.",
            why: "Hides leaks instead of fixing them. The architect interprets this as 'I don't write idempotent cleanups.'",
          },
          {
            phrase: "JS has garbage collection so leaks don't matter.",
            why: "GC reclaims unreachable memory. Leaks are about REACHABLE memory that you no longer need — GC can't help you there.",
          },
        ]}
      />

      <Step n={6} kind="next" title="Leaks are accidental. Some bytes are hostile.">
        <Callout tone="next" title="next bottleneck">
          You&apos;ve made the dashboard observable, accessible, fast, and leak-free. The last
          layer: security. Module 24 covers the attack surfaces of a modern SPA.
        </Callout>
      </Step>
    </Lesson>
  );
}

/* ─────────── live heap monitor ─────────── */

function HeapMonitor() {
  const [samples, setSamples] = useState<number[]>([]);
  const supported = typeof performance !== "undefined" &&
    (performance as unknown as { memory?: { usedJSHeapSize: number } }).memory != null;

  useEffect(() => {
    if (!supported) return;
    const id = setInterval(() => {
      const mem = (performance as unknown as { memory?: { usedJSHeapSize: number } }).memory!;
      const mb = mem.usedJSHeapSize / 1048576;
      setSamples((s) => [...s.slice(-79), mb]);
    }, 500);
    return () => clearInterval(id);
  }, [supported]);

  const current = samples[samples.length - 1] ?? 0;
  const peak = samples.length ? Math.max(...samples) : 0;
  const slope = samples.length > 4 ? samples[samples.length - 1] - samples[samples.length - 5] : 0;
  const max = Math.max(peak, 50);

  if (!supported) {
    return (
      <div className="not-prose mt-3 rounded-lg border border-bg-border bg-bg-panel p-3 font-mono text-[11px] text-ink-dim">
        live heap unavailable (Chrome only — try in Chrome / Edge for a real chart)
      </div>
    );
  }

  return (
    <div className="not-prose mt-3 rounded-lg border border-bg-border bg-bg-panel p-3">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-3 font-mono text-[11px]">
        <span className="text-ink-dim">
          heap · <span className="text-ink">{current.toFixed(1)} MB</span> · peak{" "}
          <span className="text-ink">{peak.toFixed(1)} MB</span>
        </span>
        <span
          className={cn(
            slope > 1 ? "text-accent-bad" : slope > 0.2 ? "text-accent-warn" : "text-accent-good"
          )}
        >
          {slope >= 0 ? "↑" : "↓"} {Math.abs(slope).toFixed(1)} MB / 2s
        </span>
      </div>
      <svg viewBox="0 0 320 80" className="h-20 w-full">
        <polyline
          points={samples
            .map((v, i) => `${(i / 79) * 320},${80 - (v / max) * 70 - 5}`)
            .join(" ")}
          fill="none"
          stroke="#7c5cff"
          strokeWidth="1.5"
        />
        {samples.map((v, i) => (
          <circle
            key={i}
            cx={(i / 79) * 320}
            cy={80 - (v / max) * 70 - 5}
            r="1"
            fill="#7c5cff"
            opacity="0.7"
          />
        ))}
      </svg>
    </div>
  );
}

/* ─────────── leak triggers ─────────── */

const leakedListeners: Array<(e: Event) => void> = [];
const leakedCache = new Map<number, ArrayBuffer>();

function LeakTriggers({ flags }: { flags: { interval: boolean; listener: boolean; closure: boolean; cache: boolean } }) {
  const intervalRef = useRef<number | null>(null);
  const closureBlob = useRef<ArrayBuffer | null>(null);

  // Interval leak — intentionally NEVER cleared while toggled on
  useEffect(() => {
    if (!flags.interval) return;
    // create a 1MB allocation each tick and "store" it in the closure
    const id = window.setInterval(() => {
      const big = new ArrayBuffer(1 * 1024 * 1024);
      // anchor it so GC can't collect — push into module-level
      leakedCache.set(performance.now(), big);
    }, 800);
    intervalRef.current = id as unknown as number;
    return () => {
      // NB: we deliberately DON'T clear here when "leaking";
      //     toggle off only stops creating new ones, the old ones remain
      //     UNLESS you check the Cleanup button below.
    };
  }, [flags.interval]);

  // Listener leak — adds to window, never removes
  useEffect(() => {
    if (!flags.listener) return;
    const handler = () => {
      // closure captures a 512KB blob just to make the listener heavy
      const blob = new Uint8Array(512 * 1024);
      blob[0] = 1;
    };
    window.addEventListener("scroll", handler);
    window.addEventListener("resize", handler);
    leakedListeners.push(handler);
    // no removeEventListener — this is the leak
  }, [flags.listener]);

  // Stale closure — keep a big payload alive via a long-lived ref
  useEffect(() => {
    if (!flags.closure) return;
    closureBlob.current = new ArrayBuffer(4 * 1024 * 1024); // 4MB held forever
  }, [flags.closure]);

  // Unbounded cache
  useEffect(() => {
    if (!flags.cache) return;
    const id = window.setInterval(() => {
      leakedCache.set(performance.now() + Math.random(), new ArrayBuffer(512 * 1024));
    }, 400);
    return () => clearInterval(id);
  }, [flags.cache]);

  const cleanup = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    while (leakedListeners.length) {
      const h = leakedListeners.pop()!;
      window.removeEventListener("scroll", h);
      window.removeEventListener("resize", h);
    }
    leakedCache.clear();
    closureBlob.current = null;
    // suggest GC
    try {
      const w = window as Window & { gc?: () => void };
      w.gc?.();
    } catch {
      /* no-op */
    }
  };

  return (
    <div className="space-y-3">
      <div className="rounded-md border border-accent-bad/30 bg-accent-bad/5 p-3 font-mono text-[11px] text-accent-bad">
        ⨯ these toggles intentionally leak memory in your tab. They&apos;re bounded by the demo
        (max a few hundred MB), and clearing them with the button below releases everything.
      </div>
      <div>
        <button
          onClick={cleanup}
          className="rounded-md bg-accent-good px-3 py-1.5 font-mono text-[11px] text-bg active:scale-95"
        >
          ✓ cleanup all leaks
        </button>
      </div>
    </div>
  );
}

/* ─────────── retention path ─────────── */

function RetentionPath() {
  return (
    <div className="not-prose mt-3 rounded-lg border border-bg-border bg-bg-panel p-3">
      <ol className="space-y-2 text-sm">
        {[
          ["GC root", "window (or document)"],
          ["↓ pinned by", "a `setInterval` callback registered in an effect with no cleanup"],
          ["↓ closes over", "your component's `props`"],
          ["↓ references", "the parent fiber, which references the DOM subtree"],
          ["↓ retains", "the entire detached subtree (heap snapshot shows hundreds of nodes)"],
        ].map(([k, v], i) => (
          <li key={i} className="flex items-start gap-3 font-mono text-[11px]">
            <span className="w-24 text-ink-dim">{k}</span>
            <span className={cn(i === 4 ? "text-accent-bad" : "text-ink-muted")}>{v}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}
