"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Lesson } from "@/engine/Lesson";
import { Step } from "@/engine/Step";
import { Callout } from "@/engine/Callout";
import { TryIt } from "@/engine/TryIt";
import { useRenderCount } from "@/profiler/useRenderCount";

const ROW_H = 28;
const TOTAL = 50000;

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
            { key: "thick", label: "expensive row component", default: false },
          ]}
          hint="With windowing off, scroll the panel and watch the FPS counter dive. Turn it on — same data, ~25 rendered DOM rows."
        >
          {(flags) => <List virtualised={flags.virtual} expensive={flags.thick} />}
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

function List({ virtualised, expensive }: { virtualised: boolean; expensive: boolean }) {
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

  const start = virtualised ? Math.max(0, Math.floor(scrollTop / ROW_H) - 4) : 0;
  const end = virtualised ? Math.min(TOTAL, start + Math.ceil(vh / ROW_H) + 8) : TOTAL;

  const items = useMemo(() => {
    const out: number[] = [];
    for (let i = start; i < end; i++) out.push(i);
    return out;
  }, [start, end]);

  return (
    <div>
      <div className="mb-2 flex items-center justify-between font-mono text-[11px] text-ink-dim">
        <span>
          rendered: <span className="text-ink">{items.length}</span> / {TOTAL}
        </span>
        <span>
          mode: <span className="text-accent">{virtualised ? "windowed" : "naive"}</span>
        </span>
      </div>
      <div
        ref={ref}
        className="h-80 overflow-auto rounded-md border border-bg-border bg-bg-elevated"
      >
        <div style={virtualised ? { height: TOTAL * ROW_H, position: "relative" } : {}}>
          <div
            style={virtualised ? { transform: `translateY(${start * ROW_H}px)`, position: "absolute", left: 0, right: 0 } : {}}
          >
            {items.map((i) => (
              <Row key={i} i={i} expensive={expensive} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function Row({ i, expensive }: { i: number; expensive: boolean }) {
  // optional artificial expense — busy() would block scroll; we burn it cheap-but-visible
  if (expensive) {
    // 30 cheap multiplications per row × visible rows on scroll = real cost without freezing
    let acc = 0;
    for (let k = 0; k < 200; k++) acc += Math.sin(i + k);
    if (acc < -9e9) console.log(acc);
  }
  return (
    <div
      style={{ height: ROW_H }}
      className="flex items-center justify-between border-b border-bg-border/40 px-3 font-mono text-[11px]"
    >
      <span className="text-ink-muted">row {i.toString().padStart(5, "0")}</span>
      <span className="text-ink-dim">payload-{(i * 31) % 9973}</span>
    </div>
  );
}
