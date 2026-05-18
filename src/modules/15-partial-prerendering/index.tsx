"use client";

import { Lesson } from "@/engine/Lesson";
import { Step } from "@/engine/Step";
import { Callout } from "@/engine/Callout";
import { PprDiagram } from "@/viz/PprDiagram";

export default function Module15() {
  return (
    <Lesson slug="15-partial-prerendering">
      <Step n={1} kind="observe" title="Static gives you instant TTFB. Dynamic gives you fresh data. Pick both.">
        <p>
          Traditional rendering is binary: a page is either statically generated (fast, stale)
          or server-rendered (fresh, slow first byte). PPR breaks the dichotomy. The page is{" "}
          <strong>prerendered with holes</strong>. The holes are <code>&lt;Suspense&gt;</code>{" "}
          boundaries that resolve on the origin per request and stream into the cached shell.
        </p>
      </Step>

      <Step n={2} kind="profile" title="A 600ms request that paints in 60ms">
        <div className="not-prose mt-3">
          <PprDiagram />
        </div>
        <p className="mt-3">
          The CDN serves the prerendered shell instantly (~30ms TTFB). The browser paints it
          before the dynamic parts arrive. As the origin&apos;s stream catches up, the
          fallbacks resolve in place. Total: 600ms — but every <em>perceived</em> metric (LCP,
          FCP) is anchored to the 60ms shell paint.
        </p>
      </Step>

      <Step n={3} kind="explain" title="The mental model">
        <ol>
          <li>Build time: prerender everything you can. Hit a <code>&lt;Suspense&gt;</code> boundary that uses dynamic data? Emit a fallback into the static HTML.</li>
          <li>Edge: serve the static HTML from the CDN edge. Microseconds of TTFB.</li>
          <li>Origin: in parallel, the request hits origin; it resolves the dynamic boundaries and streams their HTML.</li>
          <li>Browser: paints the shell, then swaps fallbacks for streamed content via the inline runtime.</li>
        </ol>
      </Step>

      <Step n={4} kind="explain" title="What makes a boundary 'dynamic'?">
        <p>
          Any of these inside a Suspense boundary tags it dynamic and forces an origin round-trip:
        </p>
        <ul>
          <li>Reading <code>headers()</code>, <code>cookies()</code> or <code>searchParams</code>.</li>
          <li>Calling <code>fetch(url, &#123; cache: &apos;no-store&apos; &#125;)</code> or any uncached server function.</li>
          <li>Using <code>noStore()</code> / <code>unstable_noStore()</code> explicitly.</li>
        </ul>
        <p>Everything else stays in the prerendered shell.</p>
      </Step>

      <Step n={5} kind="explain" title="PPR vs SSG vs ISR vs SSR — when to pick which">
        <ul>
          <li>
            <strong>SSG</strong> (Static Site Generation) — render at build time, ship pure HTML.
            Use when content is identical for every user and changes &lt; once per deploy.
            Docs sites, marketing pages.
          </li>
          <li>
            <strong>ISR</strong> (Incremental Static Regeneration) — SSG + a TTL. Regenerates on
            demand. Use when content has personalisation by URL but not by user. Blog posts,
            product listings.
          </li>
          <li>
            <strong>SSR</strong> (full Server-Side Rendering) — render on every request. Use
            when the entire page depends on user state. Banking app, admin console.
          </li>
          <li>
            <strong>PPR</strong> (Partial Prerendering) — the page is mostly SSG but with{" "}
            <code>&lt;Suspense&gt;</code> holes filled per-request. Use when most of the page is
            static but a small dynamic strip (user greeting, cart count, live price) needs to
            be fresh. The right answer for most consumer apps in 2026.
          </li>
        </ul>
        <p>
          Heuristic: how much of the page is truly user-specific? &lt;5% → SSG with a small PPR
          hole. 5-40% → PPR. &gt;40% → full SSR or RSC streaming. The wrong choice is to use SSR
          everywhere because PPR is &quot;new&quot; — you pay origin latency on every byte for
          no benefit.
        </p>
      </Step>

      <Step n={6} kind="explain" title="The PPR gotchas no one warns you about">
        <ul>
          <li>
            <strong>Cookie reads infect the boundary.</strong> A server component that reads a
            cookie via <code>cookies()</code> forces the entire boundary it&apos;s in to be
            dynamic. Push cookie reads as deep as possible.
          </li>
          <li>
            <strong>Search params are dynamic too.</strong> Same rule. If your page reads
            <code>?utm_source</code> at the top level, the whole page becomes dynamic — your
            shell isn&apos;t cached.
          </li>
          <li>
            <strong>Cache invalidation is your job.</strong> Calling <code>revalidatePath()</code>{" "}
            from a Server Action busts only the prerendered shell — the dynamic chunks
            re-fetch per request anyway. Get the granularity right.
          </li>
        </ul>
      </Step>

      <Step n={7} kind="next" title="The lab's loop closes here">
        <Callout tone="next" title="back to the beginning">
          You started with a client app that re-rendered the world on every tick. You end with
          a hybrid model where most of the page is cached HTML and only the genuinely dynamic
          bits cost an origin trip. The same primitive — <em>Suspense as a checkpoint</em> — is
          what made it possible. Read Module 1 again with this in mind.
        </Callout>
      </Step>
    </Lesson>
  );
}
