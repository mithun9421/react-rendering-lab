"use client";

import { useEffect } from "react";
import { useProfiler } from "./store";

/**
 * Drives FPS + memory polling. Mount ONCE near the root.
 * rAF-based sample, EMA-smoothed.
 */
export function useFpsLoop() {
  const setFps = useProfiler((s) => s.setFps);
  const setMem = useProfiler((s) => s.setMem);

  useEffect(() => {
    let last = performance.now();
    let dropped = 0;
    let frames = 0;
    let acc = 0;
    let raf = 0;
    let ema = 60;

    const tick = (now: number) => {
      const dt = now - last;
      last = now;
      frames += 1;
      acc += dt;
      // dropped if a single frame > 32ms (one missed 60Hz tick)
      if (dt > 32) dropped += Math.max(1, Math.round(dt / 16.67) - 1);

      if (acc >= 500) {
        const instant = (frames * 1000) / acc;
        ema = ema * 0.7 + instant * 0.3;
        setFps(Math.round(ema), dropped);
        acc = 0;
        frames = 0;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    // memory poll (Chrome only — graceful no-op elsewhere)
    const memInt = setInterval(() => {
      // performance.memory is non-standard; cast through unknown.
      const mem = (performance as unknown as { memory?: { usedJSHeapSize: number } }).memory;
      if (mem) setMem(Math.round(mem.usedJSHeapSize / 1048576));
    }, 1000);

    return () => {
      cancelAnimationFrame(raf);
      clearInterval(memInt);
    };
  }, [setFps, setMem]);
}
