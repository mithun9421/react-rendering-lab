"use client";

import { useEffect, useRef, useState } from "react";
import clsx from "clsx";
import { Lesson } from "@/engine/Lesson";
import { Step } from "@/engine/Step";
import { Callout } from "@/engine/Callout";
import { TryIt } from "@/engine/TryIt";
import { ArchitectGate } from "@/engine/ArchitectGate";

export default function Module17() {
  return (
    <Lesson slug="17-browser-pipeline">
      <Step n={1} kind="observe" title="Four phases, in this order, every frame.">
        <p>
          Even a perfect React commit doesn&apos;t paint anything on its own. The browser runs
          four phases — <strong>style</strong>, <strong>layout</strong>, <strong>paint</strong>,{" "}
          <strong>composite</strong> — in that order. Whether a CSS change triggers all four or
          just one is the difference between a 1ms update and a 16ms frame killer.
        </p>
        <PipelinePhases />
      </Step>

      <Step n={2} kind="explain" title="Which property triggers which phase?">
        <div className="not-prose">
          <PropertyTable />
        </div>
        <p className="mt-3">
          The cheat sheet: prefer <code>transform</code> and <code>opacity</code>. They skip
          layout and paint entirely — the GPU just re-composites the existing layer.
        </p>
      </Step>

      <Step n={3} kind="profile" title="Layout thrashing — the most common perf bug nobody sees">
        <TryIt
          title="resize 200 boxes — measured & batched vs interleaved"
          knobs={[{ key: "batched", label: "batch reads then writes", default: false }]}
          hint="Interleaved: every loop iteration reads then writes, forcing a re-layout each time (O(n²)). Batched: one read pass, one write pass — single layout."
        >
          {(flags) => <ThrashDemo batched={flags.batched} />}
        </TryIt>
      </Step>

      <Step n={4} kind="explain" title="Forced synchronous reflow — the smoking gun">
        <p>
          When JS asks for <code>offsetHeight</code>, <code>getBoundingClientRect()</code>, or{" "}
          <code>scrollTop</code> <em>after</em> you&apos;ve mutated a style, the browser has to
          flush pending layout immediately to give you a correct number. That flush is
          synchronous. Do it in a loop and you&apos;ve hand-built an O(n²) algorithm out of two
          O(n) loops.
        </p>
        <pre className="not-prose mt-3 overflow-x-auto rounded-md border border-bg-border bg-bg-elevated p-3 font-mono text-[10px] leading-relaxed">
{`// BAD — read inside write loop (forced reflow per iteration)
for (const el of items) {
  el.style.height = el.offsetHeight + 10 + "px";   // read THEN write
}

// GOOD — batch the reads, then batch the writes
const heights = items.map((el) => el.offsetHeight); // all reads
items.forEach((el, i) => (el.style.height = heights[i] + 10 + "px"));`}
        </pre>
      </Step>

      <Step n={5} kind="fix" title="transform: translate vs top/left">
        <ArchitectGate prompts={["why-this-approach", "tradeoffs", "next-bottleneck"]}>
          <TransformVsTopLeft />
        </ArchitectGate>
      </Step>

      <Step n={6} kind="explain" title="Composite layer overuse">
        <p>
          The temptation: promote everything with <code>will-change: transform</code> or{" "}
          <code>translateZ(0)</code>. Each promotion creates a new compositor layer. Each layer
          eats GPU memory and adds a compositor cost. Promote what you animate; not the world.
        </p>
        <p>
          Chrome DevTools → Rendering → &quot;Layer borders&quot; visualises this. The lab&apos;s
          mini-version below toggles three promotion strategies and shows the rough layer count.
        </p>
        <LayerCount />
      </Step>

      <Step n={7} kind="next" title="The pipeline is fast — when the bytes arrive.">
        <Callout tone="next" title="next bottleneck">
          Pipeline phases are short. The real wall-clock killer is the request that hasn&apos;t
          finished yet. Module 18 looks at the network as a queueing system.
        </Callout>
      </Step>
    </Lesson>
  );
}

/* ─────────── phases viz ─────────── */

const PHASES = [
  { id: "style", label: "Style", desc: "Recompute matched rules", color: "bg-accent-info" },
  { id: "layout", label: "Layout", desc: "Geometry (positions, sizes)", color: "bg-accent" },
  { id: "paint", label: "Paint", desc: "Rasterise to bitmaps per layer", color: "bg-accent-warm" },
  { id: "composite", label: "Composite", desc: "GPU stitches layers together", color: "bg-accent-good" },
];
function PipelinePhases() {
  return (
    <div className="not-prose mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
      {PHASES.map((p, i) => (
        <div key={p.id} className="rounded-lg border border-bg-border bg-bg-panel p-3">
          <div className="flex items-center gap-2">
            <span className={clsx("size-2 rounded-full", p.color)} />
            <span className="font-mono text-[10px] uppercase tracking-widest text-ink-dim">
              {i + 1} · {p.label}
            </span>
          </div>
          <p className="mt-2 text-xs text-ink-muted">{p.desc}</p>
        </div>
      ))}
    </div>
  );
}

/* ─────────── property table ─────────── */

const PROPS: { prop: string; phases: ("S" | "L" | "P" | "C")[]; cost: "low" | "med" | "high" }[] = [
  { prop: "transform", phases: ["C"], cost: "low" },
  { prop: "opacity", phases: ["C"], cost: "low" },
  { prop: "filter", phases: ["P", "C"], cost: "med" },
  { prop: "color", phases: ["P", "C"], cost: "med" },
  { prop: "background", phases: ["P", "C"], cost: "med" },
  { prop: "width / height", phases: ["L", "P", "C"], cost: "high" },
  { prop: "top / left / right / bottom", phases: ["L", "P", "C"], cost: "high" },
  { prop: "display", phases: ["S", "L", "P", "C"], cost: "high" },
];

function PropertyTable() {
  return (
    <div className="overflow-x-auto rounded-lg border border-bg-border bg-bg-panel">
      <table className="w-full min-w-[420px] text-left text-xs">
        <thead className="bg-bg-subtle text-[10px] uppercase tracking-widest text-ink-dim">
          <tr>
            <th className="px-3 py-2">property</th>
            <th className="px-3 py-2">style</th>
            <th className="px-3 py-2">layout</th>
            <th className="px-3 py-2">paint</th>
            <th className="px-3 py-2">composite</th>
            <th className="px-3 py-2">cost</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-bg-border">
          {PROPS.map((row) => {
            const has = (p: "S" | "L" | "P" | "C") => row.phases.includes(p);
            return (
              <tr key={row.prop} className="font-mono">
                <td className="px-3 py-2 text-ink">{row.prop}</td>
                <Cell on={has("S")} />
                <Cell on={has("L")} />
                <Cell on={has("P")} />
                <Cell on={has("C")} />
                <td className="px-3 py-2">
                  <span
                    className={clsx(
                      "rounded px-1.5 py-0.5 text-[10px] uppercase tracking-wider",
                      row.cost === "low" && "bg-accent-good/15 text-accent-good",
                      row.cost === "med" && "bg-accent-warn/15 text-accent-warn",
                      row.cost === "high" && "bg-accent-bad/15 text-accent-bad"
                    )}
                  >
                    {row.cost}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
function Cell({ on }: { on: boolean }) {
  return <td className="px-3 py-2 text-center">{on ? <span className="text-accent">●</span> : <span className="text-ink-dim">—</span>}</td>;
}

/* ─────────── layout-thrash demo ─────────── */

function ThrashDemo({ batched }: { batched: boolean }) {
  const [duration, setDuration] = useState<number | null>(null);
  const [running, setRunning] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const run = () => {
    const root = ref.current;
    if (!root) return;
    setRunning(true);
    setDuration(null);
    requestAnimationFrame(() => {
      const items = Array.from(root.querySelectorAll<HTMLDivElement>("[data-box]"));
      const start = performance.now();

      if (batched) {
        const heights = items.map((el) => el.offsetHeight);
        items.forEach((el, i) => (el.style.height = heights[i] + 4 + "px"));
      } else {
        items.forEach((el) => {
          // forced-reflow per item: read offsetHeight AFTER mutating below
          el.style.height = el.offsetHeight + 4 + "px";
        });
      }

      const end = performance.now();
      setDuration(end - start);
      setRunning(false);
    });
  };

  return (
    <div>
      <div className="mb-2 flex flex-wrap items-center gap-2 text-xs">
        <button
          onClick={run}
          disabled={running}
          className="rounded-md bg-accent px-3 py-1.5 font-mono text-[11px] text-white disabled:opacity-50"
        >
          ▶ run on 200 boxes
        </button>
        {duration != null && (
          <span
            className={clsx(
              "font-mono",
              duration > 16 ? "text-accent-bad" : duration > 8 ? "text-accent-warn" : "text-accent-good"
            )}
          >
            {duration.toFixed(2)}ms {duration > 16 && "· dropped a frame"}
          </span>
        )}
      </div>
      <div
        ref={ref}
        className="grid max-h-48 grid-cols-10 gap-1 overflow-hidden rounded-md border border-bg-border bg-bg-elevated p-2 sm:grid-cols-20"
      >
        {Array.from({ length: 200 }).map((_, i) => (
          <div
            key={i}
            data-box
            style={{ height: 8 }}
            className={clsx("rounded-sm bg-accent/30", i % 3 === 0 && "bg-accent/60")}
          />
        ))}
      </div>
    </div>
  );
}

/* ─────────── transform vs top/left ─────────── */

function TransformVsTopLeft() {
  const [running, setRunning] = useState(false);
  return (
    <div className="not-prose grid gap-3 md:grid-cols-2">
      <AnimCard label="transform: translate (composite-only)" use="transform" running={running} />
      <AnimCard label="top / left (layout + paint + composite)" use="top-left" running={running} />
      <div className="md:col-span-2">
        <button
          onClick={() => setRunning((r) => !r)}
          className="rounded-md bg-accent px-3 py-1.5 font-mono text-[11px] text-white"
        >
          {running ? "■ stop" : "▶ animate both at the same time"}
        </button>
        <p className="mt-2 font-mono text-[11px] text-ink-dim">
          Both should look identical. On a low-end device the right one drops frames; the left
          stays smooth.
        </p>
      </div>
    </div>
  );
}
function AnimCard({ label, use, running }: { label: string; use: "transform" | "top-left"; running: boolean }) {
  const [t, setT] = useState(0);
  useEffect(() => {
    if (!running) return;
    let raf = 0;
    let start = performance.now();
    const tick = (now: number) => {
      setT(((now - start) / 1000) % 2);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [running]);
  const x = Math.sin(t * Math.PI) * 60;
  const style: React.CSSProperties =
    use === "transform" ? { transform: `translateX(${x}px)` } : { position: "relative", left: x };
  return (
    <div className="rounded-lg border border-bg-border bg-bg-panel p-3">
      <p className="mb-2 font-mono text-[10px] uppercase tracking-widest text-ink-dim">{label}</p>
      <div className="grid h-20 place-items-center overflow-hidden rounded-md bg-bg-elevated">
        <div className="size-12 rounded-md bg-accent shadow-glass" style={style} />
      </div>
    </div>
  );
}

/* ─────────── layer count ─────────── */

function LayerCount() {
  const [strategy, setStrategy] = useState<"none" | "animated" | "all">("animated");
  const total = 24;
  const promoted = strategy === "none" ? 0 : strategy === "animated" ? 3 : total;
  return (
    <div className="not-prose mt-3 rounded-lg border border-bg-border bg-bg-panel p-3">
      <div className="mb-2 flex flex-wrap items-center gap-2 text-xs">
        <span className="font-mono text-[10px] uppercase tracking-widest text-ink-dim">strategy</span>
        {(["none", "animated", "all"] as const).map((s) => (
          <button
            key={s}
            onClick={() => setStrategy(s)}
            className={clsx(
              "rounded-md px-2 py-1 font-mono text-[11px]",
              strategy === s ? "bg-accent text-white" : "border border-bg-border text-ink-muted"
            )}
          >
            {s}
          </button>
        ))}
        <span className="ml-auto font-mono text-[11px] text-ink-dim">
          layers: <span className="text-ink">{promoted + 1}</span> root +{" "}
          <span className="text-accent-warn">{Math.max(0, promoted - 3) * 12}MB</span> GPU
        </span>
      </div>
      <div className="grid grid-cols-6 gap-1">
        {Array.from({ length: total }).map((_, i) => {
          const isPromoted = strategy === "all" || (strategy === "animated" && i % 8 === 0);
          return (
            <div
              key={i}
              className={clsx(
                "h-8 rounded-sm transition",
                isPromoted ? "bg-accent/40 ring-1 ring-accent" : "bg-bg-elevated"
              )}
              title={isPromoted ? "promoted to its own layer" : "shares parent layer"}
            />
          );
        })}
      </div>
    </div>
  );
}
