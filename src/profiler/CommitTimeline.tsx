"use client";

import { useEffect, useRef } from "react";
import { useProfiler, type CommitEvent } from "./store";
import clsx from "clsx";

/**
 * Chrome-Performance-style commit timeline. Each commit is a colored bar:
 *   width  ∝ duration
 *   color  ∝ lane (urgent / transition / idle)
 *   y      ∝ label band
 *
 * Last ~6 seconds are visible. Auto-scrolls.
 */
export function CommitTimeline() {
  const commits = useProfiler((s) => s.commits);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const cv = canvasRef.current;
    if (!cv) return;
    const dpr = window.devicePixelRatio || 1;
    const w = cv.clientWidth;
    const h = cv.clientHeight;
    cv.width = w * dpr;
    cv.height = h * dpr;
    const ctx = cv.getContext("2d")!;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);

    if (commits.length === 0) {
      drawEmpty(ctx, w, h);
      return;
    }

    const now = commits[commits.length - 1].t;
    const windowMs = 6000;
    const minT = now - windowMs;

    // group by label → lane index (y band)
    const labels = Array.from(new Set(commits.map((c) => c.label)));
    const bandH = Math.max(8, Math.min(20, Math.floor((h - 12) / Math.max(labels.length, 1))));

    // grid (every 1s)
    ctx.fillStyle = "#1c1c22";
    for (let s = 0; s <= 6; s++) {
      const x = (s / 6) * w;
      ctx.fillRect(x, 0, 1, h);
    }

    // frame budget line at 16.67ms — visualised as a horizontal "danger" lane width-scale:
    //   we draw bars whose width = (dur/16.67) * 30px. Anything > 30px = over budget.
    const pxPerMs = 1.8;

    commits.forEach((c) => {
      if (c.t < minT) return;
      const x = ((c.t - minT) / windowMs) * w;
      const bandIdx = labels.indexOf(c.label);
      const y = 4 + bandIdx * bandH;
      const wBar = Math.max(2, c.dur * pxPerMs);
      ctx.fillStyle = colorFor(c);
      ctx.fillRect(x, y, wBar, bandH - 2);
    });

    // band labels
    ctx.fillStyle = "#6c6c78";
    ctx.font = "10px ui-monospace, SFMono-Regular, Menlo, monospace";
    labels.forEach((l, i) => {
      ctx.fillText(l, 4, 4 + i * bandH + bandH - 6);
    });
  }, [commits]);

  return (
    <div className="relative h-[88px] w-full overflow-hidden rounded border border-bg-border bg-bg-subtle">
      <canvas ref={canvasRef} className="h-full w-full" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 flex justify-between px-2 pb-0.5 font-mono text-[9px] text-ink-dim">
        <span>-6s</span>
        <span>commits · width ∝ duration</span>
        <span>now</span>
      </div>
    </div>
  );
}

function colorFor(c: CommitEvent) {
  if (c.dur > 16.67) return "#ff5c7a"; // over budget
  if (c.lane === "transition") return "#5cc8ff";
  if (c.lane === "idle") return "#3ddc97";
  return "#7c5cff";
}

function drawEmpty(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.fillStyle = "#6c6c78";
  ctx.font = "11px ui-monospace, SFMono-Regular, Menlo, monospace";
  ctx.fillText("no commits recorded yet — interact with the page", 10, h / 2);
}

// Re-export for convenience
export const __forClsx = clsx;
