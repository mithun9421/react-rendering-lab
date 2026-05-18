"use client";

import { StockFeed } from "./StockFeed";
import { ActivityFeed } from "./ActivityFeed";
import { Chart } from "./Chart";
import { SearchBar } from "./SearchBar";
import { NotificationsPanel } from "./NotificationsPanel";
import { ChatPanel } from "./ChatPanel";
import { ProductCatalog } from "./ProductCatalog";
import { SettingsForm } from "./SettingsForm";
import { Recommendations } from "./Recommendations";

/**
 * The single evolving dashboard surface.
 *
 * Every module's fix is exposed as a prop. The /lab/journey page renders this
 * component once per stage and pipes a progressively-fuller patch.
 *
 * The `compose` prop picks which panels render:
 *   - "core"     → stocks + chart + activity (Modules 1-10)
 *   - "wider"    → adds search + notifications (Modules 4-7)
 *   - "full"     → adds chat + products + form + recommendations (Modules 8-15)
 */
export type DashboardProps = {
  // Surface composition
  compose?: "core" | "wider" | "full";

  // Reconciliation (Module 1)
  badKeys?: boolean;
  rowFlash?: boolean;
  // Frame pressure (Module 5)
  chartHeavyMs?: number;
  // Update rate
  tickMs?: number;
  // Activity feed (Modules 1, 10)
  activitySize?: number;
  virtualisedActivity?: boolean;
  // Islands (Module 9)
  islands?: boolean;
  // Concurrent rendering (Module 4)
  searchDeferred?: boolean;
  searchTransition?: boolean;
  searchHeavyMs?: number;
  // Memory / unbounded growth (Module 23)
  unboundedNotifications?: boolean;
  // Suspense streaming (Modules 7-8)
  streamedRecs?: boolean;
  // Optimistic UI (Module 13)
  optimisticChat?: boolean;
  optimisticSave?: boolean;
  // Auto-memo / Compiler (Module 11)
  compiled?: boolean;
  // Virtualisation also on products (Module 10)
  virtualisedProducts?: boolean;
};

export function Dashboard(props: DashboardProps) {
  const {
    compose = "core",
    badKeys = true,
    rowFlash = true,
    chartHeavyMs = 0,
    tickMs = 800,
    activitySize = 40,
    virtualisedActivity = false,
    islands = false,
    searchDeferred = false,
    searchTransition = false,
    searchHeavyMs = 0,
    unboundedNotifications = false,
    streamedRecs = false,
    optimisticChat = false,
    optimisticSave = false,
    compiled = false,
    virtualisedProducts = false,
  } = props;

  return (
    <div className="grid gap-3 lg:grid-cols-2">
      <StockFeed badKeys={badKeys} rowFlash={rowFlash} tickMs={tickMs} />
      {islands ? <StaticChartShell /> : <Chart heavyMs={chartHeavyMs} />}
      <ActivityFeed size={activitySize} virtualised={virtualisedActivity} />
      {islands ? <StaticChartShell points={120} /> : <Chart heavyMs={chartHeavyMs} points={120} />}

      {(compose === "wider" || compose === "full") && (
        <>
          <SearchBar
            deferred={searchDeferred}
            transition={searchTransition}
            heavyMs={searchHeavyMs}
            compact
          />
          <NotificationsPanel
            tickMs={Math.max(800, Math.floor(tickMs * 1.6))}
            bounded={!unboundedNotifications}
          />
        </>
      )}

      {compose === "full" && (
        <>
          <ChatPanel optimistic={optimisticChat} tickMs={Math.max(2500, tickMs * 4)} />
          <ProductCatalog size={50} virtualised={virtualisedProducts} compiled={compiled} />
          <SettingsForm optimisticSave={optimisticSave} />
          <Recommendations streamed={streamedRecs} />
        </>
      )}
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
