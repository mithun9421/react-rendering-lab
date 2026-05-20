"use client";

import { useMemo, useState } from "react";
import clsx from "clsx";
import { Lesson } from "@/engine/Lesson";
import { Step } from "@/engine/Step";
import { Callout } from "@/engine/Callout";
import { ArchitectNotes } from "@/engine/ArchitectNotes";
import { TryIt } from "@/engine/TryIt";

type Mod = { id: string; size: number; group: "framework" | "lib" | "feature" | "dead" };

const MODS: Mod[] = [
  { id: "react-dom", size: 142, group: "framework" },
  { id: "next/router", size: 52, group: "framework" },
  { id: "next/image", size: 38, group: "framework" },
  { id: "lodash (full)", size: 71, group: "lib" },
  { id: "lodash/debounce", size: 2, group: "lib" },
  { id: "moment", size: 67, group: "lib" },
  { id: "date-fns/format", size: 6, group: "lib" },
  { id: "framer-motion", size: 58, group: "lib" },
  { id: "zustand", size: 6, group: "lib" },
  { id: "Chart", size: 28, group: "feature" },
  { id: "StockFeed", size: 14, group: "feature" },
  { id: "ActivityFeed", size: 8, group: "feature" },
  { id: "Settings (lazy)", size: 22, group: "feature" },
  { id: "Reports (lazy)", size: 34, group: "feature" },
  { id: "/utils/legacy", size: 18, group: "dead" },
  { id: "/utils/jsonview-v1", size: 9, group: "dead" },
];

export default function Module20() {
  return (
    <Lesson slug="20-build-bundle">
      <Step n={1} kind="observe" title="Bundle bytes are a budget. Treat them like one.">
        <p>
          The lab&apos;s production build is around 168 KB First Load. A real e-commerce dashboard
          is usually 600 KB to 2 MB before anything renders. Each KB is a slice of the user&apos;s
          mobile data plan and a fraction of a second on a $200 phone.
        </p>
      </Step>

      <Step n={2} kind="profile" title="Bundle treemap — interactive">
        <TryIt
          title="optimizations"
          knobs={[
            { key: "tree", label: "tree shake (import named, not default)", default: false },
            { key: "split", label: "code-split routes (dynamic imports)", default: false },
            { key: "swap", label: "swap moment → date-fns / lodash → lodash-es", default: false },
            { key: "deadcode", label: "remove dead modules", default: false },
          ]}
          hint="Each toggle flips a real strategy. Watch the total drop. Then think: which one helped the most on the critical path (initial route) vs. total bytes shipped?"
        >
          {(flags) => <BundleViz flags={flags} />}
        </TryIt>
      </Step>

      <Step n={3} kind="explain" title="The five levers, in order of payoff">
        <ol>
          <li>
            <strong>Tree shaking</strong> — import only what you use.{" "}
            <code>import &#123; debounce &#125; from &quot;lodash&quot;</code> drags 71KB if your{" "}
            <code>sideEffects: false</code> isn&apos;t set; <code>import debounce from
            &quot;lodash/debounce&quot;</code> drags 2KB.
          </li>
          <li>
            <strong>Code splitting</strong> — anything not on the critical path becomes a dynamic
            <code>import()</code>. Settings, Reports, modals. Webpack/Turbopack/Vite all do this
            automatically when they see <code>import()</code>.
          </li>
          <li>
            <strong>Library swaps</strong> — moment → date-fns or Temporal. lodash → es-toolkit.
            Same API surface for 90% of usage, 10% of the bytes.
          </li>
          <li>
            <strong>Dead-code elimination</strong> — knip, ts-prune, depcheck. Hunts unused
            exports and files. Surprisingly fruitful in any &gt;6mo-old codebase.
          </li>
          <li>
            <strong>Polyfill audit</strong> — set your browserslist tight. Modern targets cut
            most polyfills.
          </li>
        </ol>
      </Step>

      <Step n={4} kind="explain" title="ESM vs CommonJS — the silent saboteur">
        <p>
          Tree shaking only works on ESM. If a dependency ships CommonJS (most npm packages do
          for historical reasons), the bundler can&apos;t prove which exports are unused — it
          ships the whole module. Check your top three dependencies: if any has only a{" "}
          <code>main</code> field and no <code>module</code> / <code>exports.import</code>,
          that&apos;s why your bundle isn&apos;t shrinking.
        </p>
      </Step>

      <Step n={5} kind="fix" title="Dynamic imports — the load-when-needed pattern">
        <pre className="not-prose overflow-x-auto rounded-md border border-bg-border bg-bg-elevated p-3 font-mono text-[10px] leading-relaxed">
{`// statically imported — lands in the initial bundle
import { Reports } from "./Reports";

// dynamic — separate chunk, fetched on demand
const Reports = lazy(() => import("./Reports"));

// in JSX
<Suspense fallback={<Skeleton />}>
  <Reports />
</Suspense>`}
        </pre>
      </Step>

      <Step n={6} kind="explain" title="Webpack vs Turbopack vs Vite — what changes">
        <ul>
          <li>
            <strong>Webpack</strong> — battle-tested, slowest dev rebuilds, most plugins. Persistent
            cache helps. The path you&apos;re on if you don&apos;t pick.
          </li>
          <li>
            <strong>Turbopack</strong> — Rust, incremental, function-graph–level invalidation.
            10-100× faster dev rebuilds on big apps. Default in Next 16+.
          </li>
          <li>
            <strong>Vite</strong> — Rollup for prod, esbuild for dev. Tiny dev-server overhead,
            simplest config, doesn&apos;t play with Next App Router.
          </li>
        </ul>
      </Step>

      <ArchitectNotes
        framing="Bundle questions probe whether you can do the math — and whether you understand WHY tree-shaking works (or doesn't)."
        followUps={[
          {
            q: "Why does tree-shaking only work on ESM?",
            a: "ESM imports are statically analyzable: `import { foo } from 'pkg'` tells the bundler at parse time WHICH exports are used. Unused exports get marked for elimination. CommonJS `require('pkg').foo` reads a property of an object — to know what's used, the bundler would have to execute the code. That's impractical. So CJS packages ship in full. The architect may probe: 'how do I check a package?' Answer: `package.json`'s `main` (CJS), `module` (ESM), and `exports` field (modern, both). If a package has only `main`, you're shipping the whole thing.",
          },
          {
            q: "Bundle splitting — how do you decide what to split?",
            a: "Three signals. (1) Critical-path test: does this code run on the route's first paint? If no, split. (2) Frequency: how often does the average user hit this code? Rare features → splits. (3) Size: 50KB threshold is a rough cut — below it, splitting overhead (extra HTTP request) costs more than the saving. The Reports page and Settings dialog are textbook split candidates. The product list rendered on every page isn't. Most bundlers auto-split on dynamic `import()` calls — the call site IS the boundary.",
          },
          {
            q: "What's the difference between code splitting and lazy loading?",
            a: "Code splitting is the BUNDLER decision to emit multiple files. Lazy loading is the RUNTIME decision to fetch and execute a file when needed. They pair: a dynamic import (`import('./Reports')`) tells the bundler to split AND triggers a runtime fetch when the component renders. You can split without lazy-loading (preloading a chunk on hover, for example) and lazy-load without splitting (rare — usually just shifts the moment of execution).",
          },
          {
            q: "Show me your decision tree for picking a bundler in 2026.",
            a: "(1) Default to Next.js + Turbopack for full-stack apps — RSC support, App Router, Vercel handoff. (2) Vite for SPA-only React + library projects — fastest dev, simplest config, best Rollup ecosystem. (3) Webpack only for legacy migrations or Module Federation at scale (until Turbopack/Rspack catch up on MF maturity). (4) Rspack as a Webpack drop-in replacement for build-time speed. (5) esbuild for tooling/CLIs only — not full apps. The architect tests if you've moved past 'I default to Webpack because that's what I learned.'",
          },
          {
            q: "How do you measure bundle size in production, not just at build?",
            a: "Build-time: bundle analyzer (Webpack Bundle Analyzer, Vite Visualizer). Production: web-vitals library logs Real User INP + Bundle Size via Performance API, sent to your RUM endpoint. Plus: budget enforcement in CI — bundlewatch, size-limit. Compare PRs against baseline; fail if size grows > N%. The architect cares about the prod measurement because build-time metrics lie when CDN compression or HTTP/3 prioritisation kicks in.",
          },
        ]}
        pivots={[
          { to: "Code splitting + Suspense", why: "Dynamic imports + Suspense fallback are the React-idiomatic pattern." },
          { to: "RSC's bundle impact (Module 12)", why: "RSC ships zero JS for Server Components — massive reduction." },
          { to: "Polyfill audit", why: "browserslist tuning often saves 30KB+." },
        ]}
        dontSay={[
          {
            phrase: "Just use code splitting everywhere.",
            why: "Below the 50KB heuristic, splits cost more than they save (extra HTTP request, runtime overhead). The architect wants to hear measurement.",
          },
          {
            phrase: "Use a CDN to fix bundle size.",
            why: "CDN affects DELIVERY speed, not bundle size. Architect tests whether you separate the two concerns.",
          },
        ]}
      />

      <Step n={7} kind="next" title="Bundle slim — but the page has to be usable.">
        <Callout tone="next" title="next bottleneck">
          A 100 KB bundle is worthless if a blind user can&apos;t reach the button. Module 21
          treats accessibility as architecture, not a checklist.
        </Callout>
      </Step>
    </Lesson>
  );
}

/* ─────────── bundle viz ─────────── */

function BundleViz({ flags }: { flags: { tree: boolean; split: boolean; swap: boolean; deadcode: boolean } }) {
  const optimised = useMemo<Mod[]>(() => {
    return MODS.map((m) => {
      let size = m.size;
      let group = m.group;
      // Tree shake: cut lodash full (-71) → keep small named
      if (flags.tree && m.id === "lodash (full)") size = 0;
      if (!flags.tree && m.id === "lodash/debounce") size = 0;
      // Swap: moment → date-fns, lodash-es replaces lodash (already covered)
      if (flags.swap && m.id === "moment") size = 0;
      if (!flags.swap && m.id === "date-fns/format") size = 0;
      // Split: Settings + Reports become async (still counted but flagged separately)
      if (flags.split && (m.id === "Settings (lazy)" || m.id === "Reports (lazy)")) {
        group = "feature";
      }
      // Dead code remove
      if (flags.deadcode && m.group === "dead") size = 0;
      return { ...m, size, group };
    }).filter((m) => m.size > 0);
  }, [flags]);

  const total = optimised.reduce((a, m) => a + m.size, 0);
  const initial = optimised.reduce((a, m) => {
    if (flags.split && (m.id === "Settings (lazy)" || m.id === "Reports (lazy)")) return a;
    return a + m.size;
  }, 0);
  const max = MODS.reduce((a, m) => a + m.size, 0);

  return (
    <div>
      <div className="mb-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
        <Stat label="initial bundle" v={`${initial} KB`} tone={initial < 250 ? "good" : initial < 400 ? "warn" : "bad"} />
        <Stat label="total shipped" v={`${total} KB`} tone={total < 350 ? "good" : "warn"} />
        <Stat
          label="vs. baseline"
          v={`${(((total - max) / max) * 100).toFixed(0)}%`}
          tone={total < max ? "good" : "bad"}
        />
      </div>
      <Treemap mods={optimised} />
    </div>
  );
}

function Treemap({ mods }: { mods: Mod[] }) {
  const total = mods.reduce((a, m) => a + m.size, 0);
  return (
    <div className="overflow-hidden rounded-lg border border-bg-border bg-bg-panel">
      <div className="grid grid-cols-12 gap-px bg-bg-border">
        {mods
          .slice()
          .sort((a, b) => b.size - a.size)
          .map((m) => {
            const span = Math.max(1, Math.round((m.size / total) * 12));
            return (
              <div
                key={m.id}
                className={clsx(
                  "flex flex-col justify-between p-2 font-mono text-[10px] transition",
                  m.group === "framework" && "bg-accent/20 text-accent",
                  m.group === "lib" && "bg-accent-info/15 text-accent-info",
                  m.group === "feature" && "bg-accent-good/15 text-accent-good",
                  m.group === "dead" && "bg-accent-bad/15 text-accent-bad"
                )}
                style={{ gridColumn: `span ${span} / span ${span}`, minHeight: 42 }}
                title={`${m.id} · ${m.size} KB`}
              >
                <span className="truncate">{m.id}</span>
                <span className="text-ink-muted">{m.size} KB</span>
              </div>
            );
          })}
      </div>
      <div className="border-t border-bg-border px-3 py-2 font-mono text-[10px] text-ink-dim">
        cell area ∝ KB · color: framework / lib / feature / dead-code
      </div>
    </div>
  );
}

function Stat({ label, v, tone }: { label: string; v: string; tone: "good" | "warn" | "bad" }) {
  return (
    <div className="rounded-lg border border-bg-border bg-bg-panel p-3">
      <div className="flex items-center justify-between">
        <span className="font-mono text-[10px] uppercase tracking-widest text-ink-dim">{label}</span>
        <span
          className={clsx(
            "size-1.5 rounded-full",
            tone === "good" && "bg-accent-good",
            tone === "warn" && "bg-accent-warn",
            tone === "bad" && "bg-accent-bad"
          )}
        />
      </div>
      <div
        className={clsx(
          "mt-2 font-mono text-xl tabular-nums",
          tone === "good" && "text-ink",
          tone === "warn" && "text-accent-warn",
          tone === "bad" && "text-accent-bad"
        )}
      >
        {v}
      </div>
    </div>
  );
}
