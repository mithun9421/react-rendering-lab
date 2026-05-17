"use client";

import { useEffect, useState } from "react";
import { Lesson } from "@/engine/Lesson";
import { Step } from "@/engine/Step";
import { TryIt } from "@/engine/TryIt";
import { MetricsPanel } from "@/engine/MetricsPanel";
import { BeforeAfter } from "@/engine/BeforeAfter";
import { Callout } from "@/engine/Callout";
import { DiffTree, type DiffNode } from "@/viz/DiffTree";
import { StockFeed } from "@/dashboard/StockFeed";
import { useRenderCount } from "@/profiler/useRenderCount";

export default function Module01() {
  return (
    <Lesson slug="01-reconciliation">
      <Step n={1} kind="observe" title="The dashboard ticks once a second. Watch the rows flash.">
        <p>
          Below is the stock feed straight from the broken baseline. Every row briefly flashes
          on render. With <strong>bad keys</strong> turned on, the rows reuse <em>positional</em>{" "}
          identity — meaning when the array re-renders, React compares old and new at the same
          slot. The component reused at position 0 may have nothing to do with the symbol now
          at position 0.
        </p>
        <p>
          Watch the <code>StockRow:*</code> counters in the profiler at the bottom of the screen.
          They climb in lockstep across <em>every</em> row, every tick.
        </p>
      </Step>

      <Step n={2} kind="profile" title="Quantify the damage">
        <p>
          The profiler is recording. The four cards below are pulled directly from it. Note
          how the average commit duration creeps up the more rows you display.
        </p>
        <MetricsPanel watch={["StockFeed", "StockRow:AAPL", "StockRow:NVDA"]} />
      </Step>

      <Step n={3} kind="explain" title="Why does this happen? Keys are identity.">
        <p>
          React reconciles two trees position-by-position when no <code>key</code> is provided
          (or the key is the array index). If you reorder, insert, or remove items, React
          can&apos;t tell — so it keeps the old fiber, updates the props in place, and any
          internal state inside the row (focus, selection, animation progress) lives with the
          <em>wrong</em> row.
        </p>
        <p>Below is what reconciliation thinks happened in two cases:</p>

        <div className="not-prose mt-3 grid gap-3 md:grid-cols-2">
          <DiffTree
            title="key={index}  →  React thinks everything was kept"
            before={mkNodes(["AAPL", "MSFT", "GOOG", "AMZN"], "kept")}
            after={mkNodes(["MSFT", "GOOG", "AMZN", "NVDA"], "kept")}
          />
          <DiffTree
            title="key={sym}    →  React sees the move + the add"
            before={mkNodes(["AAPL", "MSFT", "GOOG", "AMZN"], "kept")}
            after={[
              { id: "MSFT", label: "MSFT", status: "moved" },
              { id: "GOOG", label: "GOOG", status: "moved" },
              { id: "AMZN", label: "AMZN", status: "moved" },
              { id: "NVDA", label: "NVDA", status: "added" },
            ]}
          />
        </div>
      </Step>

      <Step n={4} kind="fix" title="Toggle the fix and watch the row counters split">
        <TryIt
          title="key strategy"
          knobs={[
            { key: "stableKey", label: "key = symbol (stable)", default: false, hint: "Use the symbol as the key instead of the array index" },
            { key: "flash", label: "row flash on render", default: true },
          ]}
          hint="With a stable key, when only one symbol changes, only one row's render counter goes up. With the index key, every row's counter goes up every tick."
        >
          {(flags) => (
            <BeforeAfter
              before={<StockFeed badKeys tickMs={900} rowFlash={flags.flash} />}
              after={<StockFeed badKeys={!flags.stableKey} tickMs={900} rowFlash={flags.flash} />}
              labelBefore="key = index"
              labelAfter="key = symbol"
            />
          )}
        </TryIt>
      </Step>

      <Step n={5} kind="fix" title="Identity also lives in your closures">
        <p>
          A stable key is necessary but not sufficient. Even with the right keys, an unstable
          prop (a new object literal, a new function created every render) busts memoization
          and forces work down the tree. Click the button below; the right-hand panel keeps
          its identity, the left-hand panel doesn&apos;t.
        </p>
        <ReferenceIdentityDemo />
      </Step>

      <Step n={6} kind="next" title="You fixed reconciliation. Now the diff itself becomes the wall.">
        <Callout tone="next" title="next bottleneck">
          Reconciliation is now cheap per-row. But the <strong>diffing algorithm</strong> still
          walks the entire tree on every state change — and its O(n) heuristics make some
          mistakes invisible until you violate the structural assumption. Module 2 visualizes
          how those assumptions break down.
        </Callout>
      </Step>
    </Lesson>
  );
}

function mkNodes(syms: string[], status: DiffNode["status"]): DiffNode[] {
  return syms.map((s) => ({ id: s, label: s, status }));
}

/* ----------------- Reference identity demo ----------------- */

function ReferenceIdentityDemo() {
  const [n, setN] = useState(0);

  return (
    <div className="not-prose mt-4 grid gap-3 md:grid-cols-2">
      <Panel title="unstable: new {} prop every render">
        {/* Re-created every render → child sees new ref → child re-renders */}
        <Child label="Unstable" config={{ ts: Date.now() }} />
      </Panel>

      <Panel title="stable: prop reference cached">
        <StableChild />
      </Panel>

      <div className="md:col-span-2">
        <button
          onClick={() => setN((x) => x + 1)}
          className="rounded-md bg-accent px-3 py-1.5 text-xs font-medium text-white"
        >
          Force parent re-render ({n})
        </button>
      </div>
    </div>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-bg-border bg-bg-panel p-3">
      <p className="mb-2 font-mono text-[10px] uppercase tracking-widest text-ink-dim">{title}</p>
      {children}
    </div>
  );
}

const STABLE = { ts: 0 } as const;

function StableChild() {
  return <Child label="Stable" config={STABLE} />;
}

function Child({ label, config }: { label: string; config: { ts: number } }) {
  const count = useRenderCount(`Child:${label}`);
  return (
    <div className="rounded bg-bg-elevated px-3 py-2 font-mono text-xs">
      {label} · rendered <span className="text-accent-warn">{count}</span> times · config.ts=
      {config.ts}
    </div>
  );
}
