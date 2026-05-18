"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import clsx from "clsx";

/**
 * Two-phase fiber playback:
 *   1. Render phase — walk the alternate tree, mark each fiber "done"
 *   2. Commit phase — three sub-phases:
 *        before-mutation (snapshot effects)
 *        mutation        (DOM writes, refs)
 *        layout          (useLayoutEffect)
 *
 * The render phase is interruptible. The commit phase is not — that's the entire teaching point.
 */
type Node = { id: string; label: string; kind?: "host" | "fn" | "memo"; child?: Node[] };

const TREE: Node = {
  id: "root",
  label: "App",
  kind: "fn",
  child: [
    {
      id: "header",
      label: "Header",
      kind: "fn",
      child: [
        { id: "logo", label: "Logo", kind: "host" },
        { id: "nav", label: "Nav", kind: "fn" },
      ],
    },
    {
      id: "main",
      label: "Main",
      kind: "fn",
      child: [
        {
          id: "feed",
          label: "StockFeed",
          kind: "memo",
          child: [
            { id: "r1", label: "Row(AAPL)", kind: "fn" },
            { id: "r2", label: "Row(MSFT)", kind: "fn" },
            { id: "r3", label: "Row(GOOG)", kind: "fn" },
          ],
        },
        { id: "chart", label: "Chart", kind: "memo" },
      ],
    },
    { id: "footer", label: "Footer", kind: "host" },
  ],
};

function flatten(n: Node, depth = 0, acc: Array<{ n: Node; depth: number }> = []) {
  acc.push({ n, depth });
  (n.child ?? []).forEach((c) => flatten(c, depth + 1, acc));
  return acc;
}

type Phase = "idle" | "render" | "before" | "mutation" | "layout" | "done";

export function FiberTrace() {
  const nodes = flatten(TREE);
  const [cursor, setCursor] = useState(-1);
  const [phase, setPhase] = useState<Phase>("idle");
  const [playing, setPlaying] = useState(false);
  const raf = useRef<number>(0);
  const last = useRef<number>(0);

  useEffect(() => {
    if (!playing) return;
    const step = (t: number) => {
      if (t - last.current > 220) {
        if (phase === "render") {
          setCursor((c) => {
            const nx = c + 1;
            if (nx >= nodes.length) {
              setPhase("before");
              return c;
            }
            return nx;
          });
        } else if (phase === "before") {
          setPhase("mutation");
        } else if (phase === "mutation") {
          setPhase("layout");
        } else if (phase === "layout") {
          setPhase("done");
          setPlaying(false);
        }
        last.current = t;
      }
      raf.current = requestAnimationFrame(step);
    };
    raf.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf.current);
  }, [playing, phase, nodes.length]);

  const play = () => {
    setCursor(-1);
    setPhase("render");
    setPlaying(true);
  };
  const pause = () => setPlaying(false);
  const reset = () => {
    setCursor(-1);
    setPhase("idle");
    setPlaying(false);
  };

  return (
    <div className="rounded-lg border border-bg-border bg-bg-panel">
      <header className="flex flex-col gap-2 border-b border-bg-border px-3 py-2 text-xs sm:flex-row sm:items-center sm:justify-between">
        <span className="font-mono uppercase tracking-widest text-ink-dim">fiber playback</span>
        <div className="flex flex-wrap items-center gap-2">
          <button onClick={play} className="rounded-md bg-accent px-2 py-1 font-mono text-[11px] text-white">
            ▶ play
          </button>
          <button onClick={pause} className="rounded-md border border-bg-border px-2 py-1 font-mono text-[11px] text-ink-muted">
            ❚❚ pause
          </button>
          <button onClick={reset} className="rounded-md border border-bg-border px-2 py-1 font-mono text-[11px] text-ink-muted">
            ↺ reset
          </button>
        </div>
      </header>

      {/* phase bar */}
      <div className="flex gap-px border-b border-bg-border bg-bg-subtle p-2 font-mono text-[10px]">
        <PhaseChip label="1. render" tone="info" active={phase === "render"} done={phaseDone(phase, "render")} note="interruptible" />
        <PhaseChip label="2. before-mutation" tone="warn" active={phase === "before"} done={phaseDone(phase, "before")} note="snapshot effects" />
        <PhaseChip label="3. mutation" tone="bad" active={phase === "mutation"} done={phaseDone(phase, "mutation")} note="DOM writes · refs · uninterruptible" />
        <PhaseChip label="4. layout" tone="good" active={phase === "layout"} done={phaseDone(phase, "layout")} note="useLayoutEffect" />
      </div>

      <ul className="space-y-1 p-3 font-mono text-xs">
        {nodes.map((row, i) => {
          const isRender = phase === "render";
          const done = i < cursor || (!isRender && phase !== "idle");
          const active = isRender && i === cursor;
          return (
            <motion.li
              key={row.n.id}
              animate={{
                backgroundColor: active
                  ? "rgba(124,92,255,0.20)"
                  : done && phase !== "done"
                  ? "rgba(61,220,151,0.06)"
                  : done && phase === "done"
                  ? "rgba(255,200,87,0.06)"
                  : "transparent",
              }}
              transition={{ duration: 0.18 }}
              className={clsx(
                "flex items-center gap-2 rounded px-2 py-1",
                done ? "text-ink-muted" : active ? "text-ink" : "text-ink-dim"
              )}
              style={{ paddingLeft: 8 + row.depth * 14 }}
            >
              <span
                className={clsx(
                  "size-1.5 rounded-full",
                  active ? "bg-accent animate-pulse_dot" : done ? "bg-accent-good" : "bg-bg-border"
                )}
              />
              <span>{row.n.label}</span>
              <span className="text-[10px] text-ink-dim">{row.n.kind}</span>
              {/* show what each commit sub-phase does to this node */}
              {phase === "mutation" && done && (row.n.kind === "host" || row.n.kind === "fn") && (
                <span className="ml-auto text-[10px] text-accent-bad">DOM patched</span>
              )}
              {phase === "layout" && done && row.n.kind === "fn" && (
                <span className="ml-auto text-[10px] text-accent-good">useLayoutEffect</span>
              )}
            </motion.li>
          );
        })}
      </ul>

      <footer className="border-t border-bg-border px-3 py-2 font-mono text-[10px] text-ink-dim">
        order: parent → firstChild → ... → sibling → return ·{" "}
        <span className="text-accent">render</span> is interruptible · <span className="text-accent-bad">commit</span> is not
      </footer>
    </div>
  );
}

function phaseDone(current: Phase, target: Phase): boolean {
  const order: Phase[] = ["idle", "render", "before", "mutation", "layout", "done"];
  return order.indexOf(current) > order.indexOf(target);
}

function PhaseChip({
  label,
  tone,
  active,
  done,
  note,
}: {
  label: string;
  tone: "info" | "warn" | "bad" | "good";
  active: boolean;
  done: boolean;
  note: string;
}) {
  return (
    <div
      className={clsx(
        "flex-1 rounded px-2 py-1.5",
        active && tone === "info" && "bg-accent-info/15 text-accent-info",
        active && tone === "warn" && "bg-accent-warn/15 text-accent-warn",
        active && tone === "bad" && "bg-accent-bad/15 text-accent-bad",
        active && tone === "good" && "bg-accent-good/15 text-accent-good",
        !active && done && "bg-bg-elevated text-ink-muted",
        !active && !done && "bg-bg-panel text-ink-dim"
      )}
    >
      <div className="font-semibold">{label}</div>
      <div className="text-[9px] opacity-80">{note}</div>
    </div>
  );
}
