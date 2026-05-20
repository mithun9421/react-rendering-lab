"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Lesson } from "@/engine/Lesson";
import { Step } from "@/engine/Step";
import { Callout } from "@/engine/Callout";
import { ArchitectNotes } from "@/engine/ArchitectNotes";
import { TryIt } from "@/engine/TryIt";
import { useRenderCount } from "@/profiler/useRenderCount";

const ROW_H = 28;
const TOTAL = 50000;

/** Deterministic per-row height so the dynamic-heights demo is stable. */
function dynamicHeightFor(i: number): number {
  // 24 → 96 px, varying by a hash
  const h = 24 + ((i * 2654435761) % 73);
  return Math.max(24, h);
}

export default function Module10() {
  return (
    <Lesson slug="10-virtualization">
      <Step n={1} kind="observe" title="50,000 rows. The DOM disagrees.">
        <p>
          Rendering 50k DOM nodes destroys layout, paint, and scroll. The fix isn&apos;t to
          render fewer items — it&apos;s to render only the items <em>visible</em> right now.
        </p>
      </Step>

      <Step n={2} kind="profile" title="DOM nodes, render count, scroll FPS">
        <TryIt
          title="50,000-row list"
          knobs={[
            { key: "virtual", label: "windowing (virtualization)", default: false },
            { key: "dynamic", label: "dynamic row heights (24-96px)", default: false },
            { key: "thick", label: "expensive row component", default: false },
          ]}
          hint="With windowing off, scroll the panel and watch the FPS counter dive. Turn it on — same data, ~25 rendered DOM rows. Add 'dynamic heights' to see prefix-sum indexing in action."
        >
          {(flags) => <List virtualised={flags.virtual} expensive={flags.thick} dynamic={flags.dynamic} />}
        </TryIt>
      </Step>

      <Step n={3} kind="explain" title="How windowing works">
        <p>
          A scroll listener reads <code>scrollTop</code>, computes <code>start = floor(scrollTop / rowH)</code>{" "}
          and <code>end = start + viewport / rowH</code>. You render rows in <code>[start, end]</code>{" "}
          and reserve total height with a spacer. Add an overscan of 2-4 rows for smoothness.
        </p>
      </Step>

      <ArchitectNotes
        framing="Virtualization questions probe whether you can articulate what you GIVE UP (a11y, Cmd+F, anchor links, scrollbar accuracy) — not just the perf win."
        followUps={[
          {
            q: "Walk me through the prefix-sum offsets approach for dynamic row heights.",
            a: "Build an array `offsets[i]` = the y-pixel position where row i starts. For fixed heights, offsets[i] = i * ROW_H. For dynamic, you pre-measure or estimate, then `offsets[i] = offsets[i-1] + heights[i-1]`. To find the first visible row given scrollTop, binary-search the offsets array — O(log n). To render, walk from start until you've covered the viewport height. When row heights change post-render (text rewrap, image load), you re-measure and update offsets from that row forward.",
          },
          {
            q: "What's the a11y story for a virtualized list?",
            a: "Screen readers walk the DOM, not your virtualization state. So off-screen rows literally don't exist for AT. Fix: (1) set `role='grid'` or `role='list'` on the scroller; (2) set `aria-rowcount` to the TOTAL count, not the rendered count; (3) set `aria-rowindex` on each rendered row to its position in the full list. NVDA, JAWS, VoiceOver use rowindex to announce 'row 50 of 10,000.' Without these, the user hears 'item 3 of 30' when there are 10,000 items.",
          },
          {
            q: "When does virtualization start to win? Where's the break-even point?",
            a: "Cost of virtualisation: overhead of scroll listener + offset math + extra DOM for the spacer. Cost of naive: O(n) rendering + O(n) DOM nodes. Break-even is usually ~200-500 rows for cheap rows, ~50-100 for expensive rows (rich content, images, charts). Below break-even, virtualisation is overhead; above, it's required. The architect tests whether you've measured both before reaching — 'I virtualize lists ≥500 unless rows are expensive.'",
          },
          {
            q: "How does virtualisation interact with Cmd+F in-page search?",
            a: "It breaks it. Cmd+F searches the rendered DOM; off-screen rows don't match. Users hit a discoverability wall. Mitigations: (1) provide an in-app search (preferred — works even without Cmd+F); (2) render a flattened, off-screen `<div>` with all text (defeats the purpose); (3) accept the trade — most virtualised lists ship with in-app filter UIs anyway. The architect is testing whether you've thought about WHO uses the page, not just WHO benchmarks it.",
          },
          {
            q: "How does dynamic row height handle a row that grows AFTER mount (image loads, content expands)?",
            a: "Three steps. (1) ResizeObserver on each rendered row reports the new height. (2) Update the heights array; recompute offsets from this row forward. (3) If the scroll position would shift due to a row growing ABOVE the viewport, optionally adjust scrollTop to keep visual stability. Libraries like @tanstack/virtual handle this. The architect may probe: 'what about scroll restoration on browser-back?' Answer: persist scrollTop in history state, restore on remount.",
          },
        ]}
        pivots={[
          { to: "@tanstack/react-virtual", why: "Production-grade virtualisation library; they'll ask 'why not roll your own?'" },
          { to: "Accessibility tree (Module 21)", why: "AT-aware virtualisation requires understanding the AOM." },
          { to: "Reconciliation keys (Module 1)", why: "Inside the rendered window, keys still matter — bottleneck chain closes." },
        ]}
        dontSay={[
          {
            phrase: "Virtualization is just removing off-screen DOM.",
            why: "It's also scrolltop tracking, offset math, overscan tuning, a11y plumbing, and resize observation. 'Just removing DOM' undersells the engineering.",
          },
          {
            phrase: "I always virtualize lists.",
            why: "Below break-even, it's overhead. Architect probes whether you've measured.",
          },
        ]}
      />

      <Step n={4} kind="next" title="The loop closes">
        <Callout tone="next" title="back to module 1">
          Now your visible window changes constantly — and every row in it must reconcile with
          stable keys, or you&apos;ll repaint rows you didn&apos;t mean to. Frontend scaling
          isn&apos;t a ladder; it&apos;s a cycle of newly-exposed bottlenecks. Welcome back to
          reconciliation.
        </Callout>
      </Step>
    </Lesson>
  );
}

function List({
  virtualised,
  expensive,
  dynamic,
}: {
  virtualised: boolean;
  expensive: boolean;
  dynamic: boolean;
}) {
  useRenderCount("VirtList");
  const ref = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [vh, setVh] = useState(320);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    setVh(el.clientHeight);
    const on = () => setScrollTop(el.scrollTop);
    el.addEventListener("scroll", on, { passive: true });
    return () => el.removeEventListener("scroll", on);
  }, []);

  // Build a prefix-sum array of row offsets so we can binary-search into "what row is at scrollTop?"
  // For static heights this is just multiplication; for dynamic heights we pay O(n) up front, O(log n) lookup.
  const offsets = useMemo(() => {
    if (!dynamic) return null;
    const arr = new Float32Array(TOTAL + 1);
    let acc = 0;
    for (let i = 0; i < TOTAL; i++) {
      arr[i] = acc;
      acc += dynamicHeightFor(i);
    }
    arr[TOTAL] = acc;
    return arr;
  }, [dynamic]);
  const totalHeight = dynamic && offsets ? offsets[TOTAL] : TOTAL * ROW_H;

  // Find start index from scrollTop.
  let start = 0;
  let end = TOTAL;
  if (virtualised) {
    if (dynamic && offsets) {
      // binary search for the first row whose offset >= scrollTop
      let lo = 0;
      let hi = TOTAL - 1;
      while (lo < hi) {
        const mid = (lo + hi) >>> 1;
        if (offsets[mid + 1] <= scrollTop) lo = mid + 1;
        else hi = mid;
      }
      start = Math.max(0, lo - 4);
      // walk forward until we've covered the viewport
      let yCursor = offsets[start];
      let i = start;
      while (i < TOTAL && yCursor < scrollTop + vh + 8 * 60) {
        yCursor += dynamicHeightFor(i);
        i++;
      }
      end = Math.min(TOTAL, i + 4);
    } else {
      start = Math.max(0, Math.floor(scrollTop / ROW_H) - 4);
      end = Math.min(TOTAL, start + Math.ceil(vh / ROW_H) + 8);
    }
  }

  const items = useMemo(() => {
    const out: number[] = [];
    for (let i = start; i < end; i++) out.push(i);
    return out;
  }, [start, end]);

  const translateY = virtualised ? (dynamic && offsets ? offsets[start] : start * ROW_H) : 0;

  return (
    <div>
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2 font-mono text-[11px] text-ink-dim">
        <span>
          rendered: <span className="text-ink">{items.length}</span> / {TOTAL.toLocaleString()}
        </span>
        <span>
          mode:{" "}
          <span className="text-accent">
            {virtualised ? "windowed" : "naive"}
            {dynamic ? " · dynamic-h" : ""}
          </span>
        </span>
      </div>
      <div ref={ref} className="h-80 overflow-auto rounded-md border border-bg-border bg-bg-elevated">
        <div style={virtualised ? { height: totalHeight, position: "relative" } : {}}>
          <div
            style={
              virtualised
                ? { transform: `translateY(${translateY}px)`, position: "absolute", left: 0, right: 0 }
                : {}
            }
          >
            {items.map((i) => (
              <Row key={i} i={i} expensive={expensive} dynamic={dynamic} />
            ))}
          </div>
        </div>
      </div>
      {dynamic && (
        <p className="mt-2 font-mono text-[10px] text-ink-dim">
          dynamic heights: binary-search the prefix-sum offsets array (O(log n)) to find the
          first visible row · no measure-on-mount needed because heights are derived from
          the row index deterministically
        </p>
      )}
    </div>
  );
}

function Row({ i, expensive, dynamic }: { i: number; expensive: boolean; dynamic: boolean }) {
  if (expensive) {
    let acc = 0;
    for (let k = 0; k < 200; k++) acc += Math.sin(i + k);
    if (acc < -9e9) console.log(acc);
  }
  const h = dynamic ? dynamicHeightFor(i) : ROW_H;
  return (
    <div
      style={{ height: h }}
      className="flex items-center justify-between border-b border-bg-border/40 px-3 font-mono text-[11px]"
    >
      <span className="text-ink-muted">row {i.toString().padStart(5, "0")}</span>
      <span className="flex items-center gap-3 text-ink-dim">
        {dynamic && <span className="text-[10px] opacity-70">h={h}px</span>}
        payload-{(i * 31) % 9973}
      </span>
    </div>
  );
}
