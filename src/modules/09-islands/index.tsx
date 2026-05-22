"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Lesson } from "@/engine/Lesson";
import { Step } from "@/engine/Step";
import { Callout } from "@/engine/Callout";
import { ArchitectNotes } from "@/engine/ArchitectNotes";

type Block = { id: string; label: string; jsKb: number; interactive: boolean };

const PAGE: Block[] = [
  { id: "nav", label: "Nav", jsKb: 0.2, interactive: false },
  { id: "hero", label: "Hero", jsKb: 0.0, interactive: false },
  { id: "search", label: "Search box", jsKb: 6.0, interactive: true },
  { id: "feed", label: "Stock feed", jsKb: 12.0, interactive: true },
  { id: "chart", label: "Chart", jsKb: 24.0, interactive: true },
  { id: "comments", label: "Comments (static)", jsKb: 0.0, interactive: false },
  { id: "footer", label: "Footer", jsKb: 0.0, interactive: false },
];

export default function Module09() {
  return (
    <Lesson slug="09-islands">
      <Step n={1} kind="observe" title="What if 80% of your page never needed JS?">
        <p>
          Most of a typical page is static HTML masquerading as React: footers, hero text,
          articles, comments. Islands architecture means: render those as plain HTML, ship JS
          only for the actually-interactive parts.
        </p>
        <IslandsMap />
      </Step>

      <Step n={2} kind="explain" title="What you give up and what you get">
        <p>
          You give up: passing state across islands trivially, single-page-app feel between
          islands, and some component code reuse with non-island parts. You get: a fraction of
          the JS, faster TTI, and parallel hydration of the remaining islands.
        </p>
      </Step>

      <Step n={3} kind="explain" title="When islands hurt — the cross-island state trap">
        <p>
          Islands are a bet that your interactive bits don&apos;t need to know about each
          other. The bet loses when:
        </p>
        <ul>
          <li>
            Two islands need to share state. You end up reinventing a global store (window
            event bus, custom element <code>postMessage</code>) — and now the &quot;simple
            island&quot; isn&apos;t simple.
          </li>
          <li>
            One island&apos;s outcome should re-render another island. Without a runtime
            integration layer, you&apos;re forced to push state through URL params or
            cookies — slow and clumsy compared to React state.
          </li>
          <li>
            The page transition needs to feel like an SPA. Islands by default re-load the
            full page on navigation. View transitions help, but they aren&apos;t free.
          </li>
        </ul>
        <p>
          The pragmatic ceiling: islands work great for content sites with a few interactive
          widgets (Astro, Eleventy, Marko). For full SPAs they fight you. Module 12 (Server
          Components) is the React-native version of the same idea — keep the static parts
          server-only without paying the cross-island integration cost.
        </p>
      </Step>

      <ArchitectNotes
        framing="Islands forces architectural choices most React devs avoid — what's interactive vs what's just markup. The architect tests whether you understand the cost model and the trade-offs you accept."
        followUps={[
          {
            q: "How is Islands different from RSC in practice?",
            a: "Islands and RSC solve similar problems differently. Islands (Astro, Eleventy with hydration) compile to static HTML by default; you mark specific components as 'interactive' and ship JS only for those. RSC keeps server-rendered components rendered SERVER-SIDE permanently — the boundary is `'use client'` opt-in. Functionally similar (ship less JS), architecturally different: Islands give you the page-as-HTML mental model; RSC keeps the component-tree mental model with explicit boundaries.",
          },
          {
            q: "When does the cross-island state problem bite?",
            a: "Two islands need to share data. With React-everywhere, you'd lift state to a parent or use context. With islands, the 'parent' doesn't exist as JS — it's static HTML. Solutions: (a) reinvent a global event bus via window or Custom Elements (`<my-cart-icon/>`); (b) route through URL params + page reload; (c) collapse the islands into one bigger island that owns the shared state. None is as clean as React's tree-based state flow. The architect wants to hear: 'I default to islands; I escalate to a bigger island when state crosses.'",
          },
          {
            q: "What's the bundle math for an islands site vs a React SPA?",
            a: "Typical SPA ships ~140 KB React + framework runtime + your code. Islands site ships only the JS for the interactive widgets — often 20-40 KB for a content-heavy site. The savings compound on cold-start: less JS to download, less to parse, less to execute before TTI. For a content site (blog, marketing), islands beat SPA by ~70% on shipped JS. For an app (dashboard, editor), the math reverses — most of the page IS interactive, islands' overhead doesn't pay off.",
          },
          {
            q: "Page transitions in an islands setup — how do you avoid full-page reloads?",
            a: "Three options. (1) Accept page reloads — fine for content sites, the user expects them. (2) View Transitions API — paint the new page with a cross-fade, no JS routing required. (3) Add a thin SPA router (Astro Transitions, htmx, Turbo) that intercepts links and morphs the DOM. Each option ships more JS than 'no router' but less than React Router. The architect probes whether you understand the trade — islands' main cost is navigation feel, and the fix has a JS price.",
          },
        ]}
        pivots={[
          { to: "Server Components (Module 12)", why: "Islands and RSC converge philosophically; expect to compare." },
          { to: "View Transitions API", why: "If you mention page transitions, they'll probe whether you know the platform alternative." },
          { to: "Bundle analyzer + treemap (Module 20)", why: "The bundle math claim invites a 'show me how you'd measure' follow-up." },
        ]}
        dontSay={[
          {
            phrase: "Islands is the future of React.",
            why: "Marketing line. The architect wants to hear 'islands win for content; SPAs win for apps; RSC blurs the line within React.'",
          },
          {
            phrase: "Just use Astro instead of React.",
            why: "Tool, not pattern. The architect cares about the principles (ship less JS, separate static from interactive) — Astro is one expression of them.",
          },
        ]}
      />

      <Step n={4} kind="next" title="Less to hydrate. But the lists you kept are huge.">
        <Callout tone="next" title="next bottleneck">
          The feed and chart are still rendered with thousands of items. Module 10 closes the
          loop with windowing — and then we&apos;re back at reconciliation keys, which is why
          the lab is a cycle, not a ladder.
        </Callout>
      </Step>
    </Lesson>
  );
}

function IslandsMap() {
  const [mode, setMode] = useState<"all" | "islands">("all");
  const total = PAGE.reduce((a, b) => a + b.jsKb, 0);
  const islandsOnly = PAGE.filter((b) => b.interactive).reduce((a, b) => a + b.jsKb, 0);

  return (
    <div className="not-prose mt-3 rounded-lg border border-bg-border bg-bg-panel p-3">
      <div className="mb-3 flex flex-wrap items-center gap-2 text-xs">
        <button
          onClick={() => setMode("all")}
          className={cn(
            "rounded-md px-2 py-1 font-mono text-[11px]",
            mode === "all" ? "bg-accent text-white" : "border border-bg-border text-ink-muted"
          )}
        >
          hydrate everything
        </button>
        <button
          onClick={() => setMode("islands")}
          className={cn(
            "rounded-md px-2 py-1 font-mono text-[11px]",
            mode === "islands" ? "bg-accent text-white" : "border border-bg-border text-ink-muted"
          )}
        >
          hydrate only islands
        </button>
        <span className="ml-auto font-mono text-[11px] text-ink-dim">
          shipped JS: <span className="text-ink">{mode === "all" ? total.toFixed(1) : islandsOnly.toFixed(1)} KB</span>{" "}
          {mode === "islands" && <span className="text-accent-good">−{(((total - islandsOnly) / total) * 100).toFixed(0)}%</span>}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
        {PAGE.map((b) => {
          const hydrated = mode === "all" ? true : b.interactive;
          return (
            <motion.div
              key={b.id}
              animate={{
                borderColor: hydrated ? "rgba(124,92,255,0.5)" : "rgba(255,255,255,0.06)",
                opacity: hydrated ? 1 : 0.5,
              }}
              className="rounded-md border bg-bg-elevated p-3"
            >
              <div className="font-mono text-xs">{b.label}</div>
              <div className="mt-1 font-mono text-[10px] text-ink-dim">
                {b.jsKb}KB · {b.interactive ? "interactive" : "static"}
                {hydrated && b.jsKb > 0 && <span className="ml-2 text-accent">island</span>}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
