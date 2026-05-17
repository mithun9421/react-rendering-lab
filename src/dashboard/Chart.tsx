"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRenderCount } from "@/profiler/useRenderCount";
import { busy } from "@/lib/sim";

/**
 * Heavy chart: re-computes a smoothed series of N points on every render.
 * In `heavy=true` mode we also burn a few ms of CPU to simulate a real chart library.
 */
export function Chart({
  points = 240,
  heavyMs = 0,
  liveTick = true,
}: {
  points?: number;
  heavyMs?: number;
  liveTick?: boolean;
}) {
  useRenderCount("Chart");
  const [seed, setSeed] = useState(0);

  useEffect(() => {
    if (!liveTick) return;
    const i = setInterval(() => setSeed((x) => x + 1), 500);
    return () => clearInterval(i);
  }, [liveTick]);

  // NB: deliberately not memoized in the baseline so the recompute happens every render.
  const series = useMemo(() => {
    if (heavyMs > 0) busy(heavyMs);
    let v = 100;
    return Array.from({ length: points }, (_, i) => {
      v += (Math.sin(i / 7 + seed) + (Math.random() - 0.5)) * 1.5;
      return v;
    });
  }, [points, heavyMs, seed]);

  return (
    <div className="overflow-hidden rounded-lg border border-bg-border bg-bg-panel">
      <header className="flex items-center justify-between border-b border-bg-border px-3 py-2 text-xs">
        <span className="font-mono uppercase tracking-widest text-ink-dim">chart</span>
        <span className="font-mono text-ink-dim">{points} pts · {heavyMs}ms work</span>
      </header>
      <Sparkline series={series} />
    </div>
  );
}

function Sparkline({ series }: { series: number[] }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const cv = canvas.current;
    if (!cv) return;
    const dpr = window.devicePixelRatio || 1;
    const w = cv.clientWidth;
    const h = cv.clientHeight;
    cv.width = w * dpr;
    cv.height = h * dpr;
    const ctx = cv.getContext("2d")!;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);

    const min = Math.min(...series);
    const max = Math.max(...series);
    const pad = 8;
    const sx = (i: number) => (i / (series.length - 1)) * w;
    const sy = (v: number) => pad + (1 - (v - min) / (max - min || 1)) * (h - pad * 2);

    // area
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, "rgba(124,92,255,0.35)");
    grad.addColorStop(1, "rgba(124,92,255,0)");
    ctx.beginPath();
    ctx.moveTo(0, h);
    series.forEach((v, i) => ctx.lineTo(sx(i), sy(v)));
    ctx.lineTo(w, h);
    ctx.closePath();
    ctx.fillStyle = grad;
    ctx.fill();

    // stroke
    ctx.beginPath();
    series.forEach((v, i) => (i === 0 ? ctx.moveTo(sx(i), sy(v)) : ctx.lineTo(sx(i), sy(v))));
    ctx.strokeStyle = "#7c5cff";
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }, [series]);

  return <canvas ref={canvas} className="h-40 w-full" />;
}
