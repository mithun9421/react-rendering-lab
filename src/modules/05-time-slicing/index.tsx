"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { Lesson } from "@/engine/Lesson";
import { Step } from "@/engine/Step";
import { Callout } from "@/engine/Callout";
import { ArchitectNotes } from "@/engine/ArchitectNotes";
import { TimeSlicingDemo } from "@/viz/FrameBudget";

export default function Module05() {
  return (
    <Lesson slug="05-time-slicing">
      <Step n={1} kind="observe" title="60 fps = 16.67ms per frame. That's it.">
        <p>
          Every animation frame, the browser has ~16ms to: process input → run JS → style → layout
          → paint → composite. If your render eats the whole budget, the frame is dropped.
        </p>
      </Step>

      <Step n={2} kind="profile" title="Long tasks — recorded live from this page">
        <p>
          Tasks &gt; 50ms are flagged as <strong>long tasks</strong> by the browser&apos;s
          PerformanceObserver. Click the buttons below to deliberately burn CPU and watch your
          own page accumulate long-task entries.
        </p>
        <LongTaskMonitor />
      </Step>

      <Step n={3} kind="profile" title="Blocking vs sliced — feel the difference">
        <p>
          The bar below is one frame. Drag the sliders to change how much CPU work happens. Run
          it blocking to overflow the frame. Then run it sliced: same total work, but each chunk
          yields to the browser between slices.
        </p>
        <div className="not-prose mt-3">
          <TimeSlicingDemo />
        </div>
      </Step>

      <Step n={4} kind="explain" title="How React slices time in practice">
        <p>
          The scheduler tracks <code>currentTime</code>. After every fiber, it asks{" "}
          <code>shouldYield()</code>. If a frame is about to expire, it yields back to{" "}
          <code>postTask</code> / <code>MessageChannel</code>, lets the browser paint, then
          resumes. <em>This is why fiber exists.</em>
        </p>
      </Step>

      <Step n={5} kind="explain" title="scheduler.postTask vs requestIdleCallback">
        <ul>
          <li>
            <code>requestIdleCallback(cb, &#123; timeout &#125;)</code> — fires when the browser
            decides it&apos;s idle. No priority hint; no way to cancel cleanly. Safari only added
            support in 2024.
          </li>
          <li>
            <code>scheduler.postTask(cb, &#123; priority &#125;)</code> — Chrome/Edge. Three named
            priorities (<code>user-blocking</code>, <code>user-visible</code>, <code>background</code>);
            returns a Promise; cancellable via AbortSignal. The strict superset.
          </li>
          <li>
            <code>queueMicrotask</code> — same task, before next paint. Use for &quot;defer this
            until just after the current call stack&quot;, not for &quot;run when idle&quot;.
          </li>
        </ul>
      </Step>

      <ArchitectNotes
        framing="They're checking whether you understand the frame budget concretely (16.67ms ≈ 60fps; 8.33ms ≈ 120fps on modern devices) and can name specific techniques to respect it."
        followUps={[
          {
            q: "What's the actual budget for JS work in a 60fps frame?",
            a: "The frame budget is 16.67ms total, but JS doesn't get all of it. Subtract style recalc, layout, paint, composite — usually ~6-8ms on a mid-tier device. So your JS budget is roughly 8-10ms per frame for smooth interaction. The longtask threshold (50ms) is way above that — by the time you're flagged, you've already missed 3+ frames. The architect wants concreteness: 'I aim for ≤8ms of JS per frame.'",
          },
          {
            q: "How would you slice a 200ms sync computation without breaking it?",
            a: "Three options. (1) `scheduler.postTask({ priority: 'user-visible' })` with a generator pattern — yield every ~5ms. (2) requestIdleCallback for non-critical work — let the browser pick when. (3) Move to a Web Worker if the work is genuinely parallel-safe (no DOM access). The choice depends on whether the work is single-shot or recurring, and whether it has DOM dependencies. For most React work, the answer is option 1 — postTask gives priority + cancellability.",
          },
          {
            q: "Why does requestAnimationFrame block input?",
            a: "rAF callbacks run in the 'animation frame callback' phase, before layout, before paint. If your rAF callback takes 30ms, the next frame can't paint until you're done. The user's click can't be processed until the rendering pipeline catches up. requestAnimationFrame is for visual updates timed to refresh; it's not a 'run this when idle' primitive. For idle work, use idleCallback or postTask with low priority.",
          },
          {
            q: "How is React's scheduler different from `setTimeout(fn, 0)`?",
            a: "setTimeout has a minimum delay (~4ms in many browsers due to throttling rules), runs at task priority (lower than microtask), and doesn't compose. React's scheduler uses MessageChannel internally for the same 'next macrotask' effect but with no delay floor. It also tracks per-task priorities (5 lanes) and supports cancellation. The architect may probe: 'why MessageChannel and not postTask?' Answer: postTask isn't universally supported; MessageChannel is the compatibility floor.",
          },
          {
            q: "How do you measure long tasks in production?",
            a: "PerformanceObserver with `type: 'longtask'`. Subscribe at app boot, log entries with duration + attribution to your RUM endpoint. The architect will follow up: 'what's a good budget?' Answer: alert at >50ms (the spec's longtask threshold), investigate at >100ms, page-on-call at >250ms. Trends matter more than individual events — a sustained 200ms p95 is way worse than occasional spikes.",
          },
        ]}
        pivots={[
          { to: "Concurrent rendering (Module 4)", why: "Time slicing is what makes concurrent rendering meaningful." },
          { to: "Web Workers + OffscreenCanvas", why: "When time slicing isn't enough, parallelism is the next step." },
          { to: "Real Web Vitals (Module 22)", why: "INP (Interaction to Next Paint) is the new Core Web Vital that long tasks blow." },
        ]}
        dontSay={[
          {
            phrase: "Just use setTimeout to make it async.",
            why: "setTimeout doesn't 'make it async' — it schedules at task priority with a floor delay. The work still runs synchronously when its turn comes. Use scheduler.postTask or generator-yielding.",
          },
          {
            phrase: "React handles time slicing automatically.",
            why: "React time-slices BETWEEN fibers when in concurrent mode. Inside a single component's function body, you're on your own.",
          },
        ]}
      />

      <Step n={6} kind="next" title="Client work isn't the problem if the page didn't paint yet">
        <Callout tone="next" title="next bottleneck">
          All of this matters <em>after</em> hydration. But hydration itself is a giant
          synchronous walk that runs before the user can do anything. Module 6.
        </Callout>
      </Step>
    </Lesson>
  );
}

/* ─────────── long-task monitor (real PerformanceObserver) ─────────── */

type LongTask = { id: number; t: number; duration: number; type: string };

function LongTaskMonitor() {
  const [tasks, setTasks] = useState<LongTask[]>([]);
  const [supported, setSupported] = useState<boolean | null>(null);
  const seq = useRef(0);

  useEffect(() => {
    try {
      const supportedTypes = (PerformanceObserver as unknown as { supportedEntryTypes?: string[] })
        .supportedEntryTypes;
      if (!supportedTypes || !supportedTypes.includes("longtask")) {
        setSupported(false);
        return;
      }
      setSupported(true);
      const observer = new PerformanceObserver((list) => {
        const now = performance.now();
        const incoming = list.getEntries().map((e) => ({
          id: ++seq.current,
          t: now - (now - e.startTime),
          duration: e.duration,
          type: e.entryType,
        }));
        setTasks((prev) => [...prev, ...incoming].slice(-20));
      });
      observer.observe({ type: "longtask", buffered: true });
      return () => observer.disconnect();
    } catch {
      setSupported(false);
    }
  }, []);

  const burn = (ms: number) => {
    const end = performance.now() + ms;
    // eslint-disable-next-line no-empty
    while (performance.now() < end) {
      Math.sqrt(Math.random() * 1e6);
    }
  };

  const burnSliced = async (totalMs: number, chunk = 4) => {
    let remaining = totalMs;
    while (remaining > 0) {
      const slice = Math.min(chunk, remaining);
      burn(slice);
      remaining -= slice;
      await new Promise((r) => requestAnimationFrame(() => r(null)));
    }
  };

  const longest = tasks.reduce((a, t) => Math.max(a, t.duration), 0);

  return (
    <div className="not-prose mt-3 rounded-lg border border-bg-border bg-bg-panel">
      <header className="flex flex-wrap items-center justify-between gap-2 border-b border-bg-border px-3 py-2 text-xs">
        <span className="font-mono uppercase tracking-widest text-ink-dim">
          PerformanceObserver · longtask
        </span>
        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={() => burn(80)}
            className="rounded-md bg-accent-bad px-2 py-1 font-mono text-[11px] text-white active:scale-95"
          >
            burn 80ms blocking
          </button>
          <button
            onClick={() => burnSliced(80, 4)}
            className="rounded-md bg-accent-good px-2 py-1 font-mono text-[11px] text-bg active:scale-95"
          >
            burn 80ms sliced (no longtask)
          </button>
          <button
            onClick={() => setTasks([])}
            className="rounded-md border border-bg-border px-2 py-1 font-mono text-[11px] text-ink-muted active:scale-95"
          >
            clear
          </button>
        </div>
      </header>

      {supported === false && (
        <div className="px-3 py-3 font-mono text-[11px] text-ink-dim">
          longtask API isn&apos;t supported in this browser (Safari did not ship until recently
          — open in Chrome / Edge for the real chart).
        </div>
      )}

      {supported && tasks.length === 0 && (
        <div className="px-3 py-6 text-center font-mono text-[11px] text-ink-dim">
          no long tasks yet — try the &quot;burn 80ms&quot; button
        </div>
      )}

      {supported && tasks.length > 0 && (
        <>
          <ul className="max-h-48 space-y-0.5 overflow-y-auto p-2 font-mono text-[11px]">
            {tasks
              .slice()
              .reverse()
              .map((t) => (
                <li key={t.id} className="grid grid-cols-[1fr_2fr] items-center gap-2">
                  <span
                    className={cn(
                      "rounded px-2 py-0.5 text-[10px] uppercase tracking-wider",
                      t.duration > 200
                        ? "bg-accent-bad/15 text-accent-bad"
                        : t.duration > 100
                        ? "bg-accent-warn/15 text-accent-warn"
                        : "bg-accent/15 text-accent"
                    )}
                  >
                    {t.duration.toFixed(0)}ms
                  </span>
                  <div className="relative h-2 rounded bg-bg-elevated">
                    <div
                      className={cn(
                        "h-2 rounded",
                        t.duration > 200 ? "bg-accent-bad" : t.duration > 100 ? "bg-accent-warn" : "bg-accent"
                      )}
                      style={{ width: `${Math.min(100, (t.duration / Math.max(longest, 50)) * 100)}%` }}
                    />
                  </div>
                </li>
              ))}
          </ul>
          <div className="border-t border-bg-border px-3 py-2 font-mono text-[10px] text-ink-dim">
            longest so far: {longest.toFixed(0)}ms · count: {tasks.length}
            {longest > 50 && " · over the 50ms long-task threshold"}
          </div>
        </>
      )}
    </div>
  );
}
