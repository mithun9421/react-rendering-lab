"use client";

import { StockFeed } from "./StockFeed";
import { ActivityFeed } from "./ActivityFeed";
import { Chart } from "./Chart";

/**
 * Composed surface. The defaults are the BROKEN baseline — modules will pass
 * overrides via PatchProvider to demonstrate fixes.
 */
export function Dashboard(props: {
  badKeys?: boolean;
  rowFlash?: boolean;
  chartHeavyMs?: number;
  tickMs?: number;
  activitySize?: number;
}) {
  const {
    badKeys = true,
    rowFlash = true,
    chartHeavyMs = 0,
    tickMs = 800,
    activitySize = 40,
  } = props;

  return (
    <div className="grid gap-3 lg:grid-cols-2">
      <StockFeed badKeys={badKeys} rowFlash={rowFlash} tickMs={tickMs} />
      <Chart heavyMs={chartHeavyMs} />
      <ActivityFeed size={activitySize} />
      <Chart heavyMs={chartHeavyMs} points={120} />
    </div>
  );
}
