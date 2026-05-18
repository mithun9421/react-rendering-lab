"use client";

import { StockFeed } from "./StockFeed";
import { ActivityFeed } from "./ActivityFeed";
import { Chart } from "./Chart";

/**
 * The single evolving dashboard surface.
 *
 * Every module's fix is exposed as a prop. The /lab/journey page renders this
 * component six times with progressively more fixes applied — the literal
 * "watch one app evolve" experience.
 *
 * Defaults = the broken baseline. Levers:
 *   - badKeys / rowFlash → Module 1 (reconciliation)
 *   - chartHeavyMs       → Modules 4/5 (concurrency + time slicing)
 *   - tickMs             → noise level (always-on)
 *   - activitySize       → growth pressure
 *   - islands            → Module 9 (drop the chart entirely on the static pass)
 *   - virtualisedActivity→ Module 10 (windowing for the activity list)
 *   - compiled           → Module 11 (auto memoization — drops re-render cost)
 */
export function Dashboard(props: {
  badKeys?: boolean;
  rowFlash?: boolean;
  chartHeavyMs?: number;
  tickMs?: number;
  activitySize?: number;
  /** Drop the chart from the surface (server-rendered as static elsewhere). */
  islands?: boolean;
  /** Use a virtualised activity list. */
  virtualisedActivity?: boolean;
}) {
  const {
    badKeys = true,
    rowFlash = true,
    chartHeavyMs = 0,
    tickMs = 800,
    activitySize = 40,
    islands = false,
    virtualisedActivity = false,
  } = props;

  return (
    <div className="grid gap-3 lg:grid-cols-2">
      <StockFeed badKeys={badKeys} rowFlash={rowFlash} tickMs={tickMs} />
      {islands ? <StaticChartShell /> : <Chart heavyMs={chartHeavyMs} />}
      <ActivityFeed size={activitySize} virtualised={virtualisedActivity} />
      {islands ? <StaticChartShell points={120} /> : <Chart heavyMs={chartHeavyMs} points={120} />}
    </div>
  );
}

function StaticChartShell({ points = 240 }: { points?: number }) {
  return (
    <div className="overflow-hidden rounded-lg border border-bg-border bg-bg-panel">
      <header className="flex items-center justify-between border-b border-bg-border px-3 py-2 text-xs">
        <span className="font-mono uppercase tracking-widest text-ink-dim">chart · static island</span>
        <span className="font-mono text-ink-dim">{points} pts · zero JS</span>
      </header>
      <div className="h-40 w-full bg-[linear-gradient(180deg,rgba(124,92,255,0.15),transparent_75%)]" />
    </div>
  );
}
