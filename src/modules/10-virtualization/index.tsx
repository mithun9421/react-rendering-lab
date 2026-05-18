"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Lesson } from "@/engine/Lesson";
import { Step } from "@/engine/Step";
import { Callout } from "@/engine/Callout";
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
