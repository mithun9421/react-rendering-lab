"use client";

import { useState } from "react";
import clsx from "clsx";
import { Lesson } from "@/engine/Lesson";
import { Step } from "@/engine/Step";
import { Callout } from "@/engine/Callout";
import { TryIt } from "@/engine/TryIt";

export default function Module08() {
  return (
    <Lesson slug="08-suspense">
      <Step n={1} kind="observe" title="Nested spinners or one coordinated load?">
        <p>
          Three components fetch three things. Either each shows its own spinner and the user
          sees flicker for 300ms · 600ms · 800ms — or you hoist a boundary above all three and
          show one coordinated skeleton. The trade is latency vs. cohesion.
        </p>
      </Step>

      <Step n={2} kind="profile" title="Toggle boundaries">
        <TryIt
          title="boundary placement"
          knobs={[
            { key: "perComponent", label: "boundary per component", default: true },
            { key: "shared", label: "single shared boundary", default: false },
          ]}
          hint="Per-component: each finishes independently — fast but flickery. Shared: one skeleton, then everything at once — cohesive but waits for the slowest."
        >
          {(flags) => <Waterfall mode={flags.shared && !flags.perComponent ? "shared" : "per"} />}
        </TryIt>
      </Step>

      <Step n={3} kind="explain" title="Suspense as backpressure">
        <p>
          A <code>Suspense</code> boundary is more than a spinner — it&apos;s a checkpoint where
          React can <em>pause</em> a tree. Children fetch in parallel above it; the boundary
          renders fallback until all are ready. Nest carefully: every boundary is also a
          waterfall opportunity.
        </p>
      </Step>

      <Step n={4} kind="next" title="Async sorted out. Now: hydration cost.">
        <Callout tone="next" title="next bottleneck">
          Even with perfect Suspense, hydrating non-interactive HTML wastes bandwidth and CPU.
          Module 9: ship JS only for the islands that need it.
        </Callout>
      </Step>
    </Lesson>
  );
}

type Mode = "per" | "shared";

function Waterfall({ mode }: { mode: Mode }) {
  const [run, setRun] = useState(0);
  return (
    <div>
      <button
        onClick={() => setRun((r) => r + 1)}
        className="mb-3 rounded-md bg-accent px-3 py-1.5 font-mono text-[11px] text-white"
      >
        ↻ refetch all
      </button>
      <div className="space-y-2">
        {mode === "per" ? (
          <>
            <Fetcher key={`a-${run}`} label="profile" ms={300} tone="accent-info" />
            <Fetcher key={`b-${run}`} label="orders" ms={600} tone="accent-warm" />
            <Fetcher key={`c-${run}`} label="recommendations" ms={900} tone="accent-good" />
          </>
        ) : (
          <SharedBoundary key={`s-${run}`} />
        )}
      </div>
    </div>
  );
}

function Fetcher({ label, ms, tone }: { label: string; ms: number; tone: string }) {
  const [done, setDone] = useState(false);
  useState(() => {
    setTimeout(() => setDone(true), ms);
    return null;
  });
  return (
    <div
      className={clsx(
        "rounded-md border border-bg-border bg-bg-elevated p-3 font-mono text-xs transition",
        done ? "" : "animate-pulse"
      )}
    >
      <div className="flex items-center justify-between">
        <span>{label}</span>
        <span className={done ? `text-${tone}` : "text-ink-dim"}>{done ? "ready" : `loading ${ms}ms`}</span>
      </div>
    </div>
  );
}

function SharedBoundary() {
  const [done, setDone] = useState(false);
  useState(() => {
    // Resolves only after the slowest dep
    setTimeout(() => setDone(true), 900);
    return null;
  });
  if (!done) {
    return (
      <div className="space-y-2">
        {["profile", "orders", "recommendations"].map((l) => (
          <div key={l} className="rounded-md border border-bg-border bg-bg-elevated p-3 font-mono text-xs animate-pulse">
            <div className="flex items-center justify-between">
              <span>{l}</span>
              <span className="text-ink-dim">awaiting shared boundary…</span>
            </div>
          </div>
        ))}
      </div>
    );
  }
  return (
    <div className="space-y-2">
      {["profile", "orders", "recommendations"].map((l) => (
        <div key={l} className="rounded-md border border-bg-border bg-bg-elevated p-3 font-mono text-xs">
          <div className="flex items-center justify-between">
            <span>{l}</span>
            <span className="text-accent-good">ready</span>
          </div>
        </div>
      ))}
    </div>
  );
}
