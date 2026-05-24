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
  const pushLongTask = useProfiler((s) => s.pushLongTask);

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

    // Long Tasks API — captures any main-thread task > 50ms (W3C threshold for
    // "user-perceptible input lag"). buffered:true catches tasks that fired
    // before this observer attached (e.g., the initial route render).
    let longTaskObs: PerformanceObserver | null = null;
    try {
      if (typeof PerformanceObserver !== "undefined") {
        longTaskObs = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            pushLongTask({ t: entry.startTime, dur: entry.duration });
          }
        });
        longTaskObs.observe({ type: "longtask", buffered: true });
      }
    } catch {
      // Safari and older browsers don't support 'longtask' — silently skip.
    }

    return () => {
      cancelAnimationFrame(raf);
      clearInterval(memInt);
      longTaskObs?.disconnect();
    };
  }, [setFps, setMem, pushLongTask]);
}
