"use client";

import { useEffect } from "react";
import { hydrateProgress, useProgress } from "./store";

/**
 * Mount once at the root. Hydrates the progress store from localStorage and
 * pings today's visit so streaks count. Renders nothing.
 */
export function ProgressBoot() {
  const pingVisit = useProgress((s) => s.pingVisit);
  useEffect(() => {
    hydrateProgress();
    // ping after hydration completes
    setTimeout(pingVisit, 0);
  }, [pingVisit]);
  return null;
}
