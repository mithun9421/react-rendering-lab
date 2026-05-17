/**
 * Synchronous busy-loop. Burns CPU for ~ms milliseconds.
 * We use this to deliberately blow the frame budget so the learner sees real FPS drops.
 *
 * DO NOT use this in production code — it really does block the main thread.
 */
export function busy(ms: number) {
  if (typeof performance === "undefined") return;
  const end = performance.now() + ms;
  // eslint-disable-next-line no-empty
  while (performance.now() < end) {
    // Math.sqrt prevents the JIT from optimising away the loop body entirely.
    Math.sqrt(Math.random() * 1e6);
  }
}

/**
 * Yieldy version — returns a Promise that resolves on next idle/animation frame after `ms` of busy work.
 * Time-slicing module uses this.
 */
export function busyAsync(totalMs: number, chunkMs = 4): Promise<void> {
  return new Promise((resolve) => {
    let remaining = totalMs;
    const step = () => {
      const slice = Math.min(chunkMs, remaining);
      busy(slice);
      remaining -= slice;
      if (remaining <= 0) {
        resolve();
        return;
      }
      // Yield to the browser so input + paint can interleave.
      requestAnimationFrame(step);
    };
    step();
  });
}
