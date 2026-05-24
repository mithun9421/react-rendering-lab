"use client";

import { Lesson } from "@/engine/Lesson";
import { Step } from "@/engine/Step";
import { Callout } from "@/engine/Callout";
import { RscBoundary } from "@/viz/RscBoundary";
import { ArchitectNotes } from "@/engine/ArchitectNotes";
import { PatternGrid, type PatternItem } from "@/engine/PatternGrid";

const RSC_LIMITATIONS: PatternItem[] = [
  {
    icon: "🔌",
    title: "No subscriptions",
    bad: "useState / useEffect on the server",
    good: "// push to a client leaf",
    why: "RSC renders once per request — no fiber persists. State lives behind 'use client'.",
  },
  {
    icon: "🎭",
    title: "Client context",
    bad: "// RSC reading client-only context",
    good: "// flip boundary, or pass via props",
    why: "RSC can read server-safe context only. Client context needs a client ancestor.",
  },
  {
    icon: "🌐",
    title: "Browser globals",
    bad: "document.cookie / localStorage",
    good: "// cookies() from next/headers",
    why: "No window/document on the server. Trap: deps that touch them at import time.",
  },
  {
    icon: "🔄",
    title: "Self re-fetch",
    bad: "// 'refresh my data' from RSC",
    good: "revalidatePath / revalidateTag",
    why: "RSC is request-scoped. Server Action invalidates; next request re-renders.",
  },
];

/**
 * What's possible on each side of the 'use client' boundary. Renders as a
 * compact two-column matrix instead of yet another bullet list.
 */
function CapabilityMatrix() {
  const rows: { feature: string; server: boolean; client: boolean; note?: string }[] = [
    { feature: "fs.readFile / db.query()", server: true, client: false },
    { feature: "process.env / secrets", server: true, client: false },
    { feature: "async function components", server: true, client: false, note: "renders once per request" },
    { feature: "useState / useReducer", server: false, client: true },
    { feature: "useEffect / event handlers", server: false, client: true },
    { feature: "browser APIs (window, localStorage)", server: false, client: true },
    { feature: "ship zero JS", server: true, client: false, note: "main RSC superpower" },
    { feature: "ship interactivity", server: false, client: true },
  ];
  return (
    <div className="not-prose overflow-hidden rounded-xl border border-bg-border bg-bg-panel">
      <div className="grid grid-cols-[1fr_88px_88px] bg-bg-subtle px-3 py-2 font-mono text-[10px] uppercase tracking-widest text-ink-dim">
        <span>capability</span>
        <span className="text-center text-accent-info">server</span>
        <span className="text-center text-accent">client</span>
      </div>
      <div className="divide-y divide-bg-border">
        {rows.map((r) => (
          <div
            key={r.feature}
            className="grid grid-cols-[1fr_88px_88px] items-center px-3 py-2 text-xs"
          >
            <span className="text-ink">
              {r.feature}
              {r.note && (
                <span className="ml-2 font-mono text-[10px] text-ink-dim">— {r.note}</span>
              )}
            </span>
            <span className="text-center">
              {r.server ? (
                <span className="text-accent-good">●</span>
              ) : (
                <span className="text-bg-border">○</span>
              )}
            </span>
            <span className="text-center">
              {r.client ? (
                <span className="text-accent-good">●</span>
              ) : (
                <span className="text-bg-border">○</span>
              )}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Module12() {
  return (
    <Lesson slug="12-server-components">
      <Step n={1} kind="observe" title="A component is server unless you opt out">
        <p>
          In the App Router, every component is a Server Component until a file starts with{" "}
          <code>&apos;use client&apos;</code>. Server components <strong>never run in the
          browser</strong>. They render to an RSC payload, get streamed to the client, and
          contribute zero KB to the JS bundle.
        </p>
      </Step>

      <Step n={2} kind="explain" title="The boundary is contagious downward">
        <p>
          Once a component is <code>&apos;use client&apos;</code>, every descendant rendered from
          it is also client — unless you pass a server component as <em>children</em> through it
          (the &quot;serialised children&quot; trick). This is the single most important RSC
          rule.
        </p>
        <p>Click a node to toggle its boundary. Watch the shipped-JS counter:</p>
        <div className="not-prose mt-3">
          <RscBoundary />
        </div>
      </Step>

      <Step n={3} kind="explain" title="What server-only buys you (and what it costs)">
        <CapabilityMatrix />
      </Step>

      <Step n={4} kind="fix" title="The pattern: push 'use client' to the leaves">
        <p>
          A common refactor is hoisting interactivity to leaf components — a small{" "}
          <code>&lt;LikeButton&gt;</code> inside a server-rendered article body. The article
          stays server (zero JS for its markdown render); only the button ships its 1KB
          handler.
        </p>
        <p className="text-ink-muted">
          A real-world Next.js app aggressively using RSC sees 30-60% smaller client bundles
          compared to the SSR-only equivalent.
        </p>
      </Step>

      <Step n={5} kind="explain" title="Passing client components through server — the children trick">
        <p>
          A common confusion: &quot;if I&apos;m a server component, can I render a client
          component as a child?&quot; Yes — and there&apos;s a powerful variant. A server
          component can <em>compose</em> a client component, AND pass another server component
          as <code>children</code> through it. The client component never sees the server
          subtree as JS; it just renders the React elements it was handed.
        </p>
        <pre className="not-prose mt-3 overflow-x-auto rounded-md border border-bg-border bg-bg-elevated p-3 font-mono text-[10px] leading-relaxed">
{`// Server Component
export default async function Page() {
  const article = await db.articles.find(id);

  return (
    <ClientShell>            {/* purple — runs in browser */}
      <ArticleBody {...article}/>  {/* green — server-rendered, passed as children */}
    </ClientShell>
  );
}`}
        </pre>
        <p>
          Result: <code>ClientShell</code> gets interactivity, <code>ArticleBody</code> ships
          zero JS even though it&apos;s nested inside an interactive parent. This is the move
          that makes layouts feel snappy.
        </p>
      </Step>

      <Step n={6} kind="explain" title="What RSC can NOT do (and the workarounds)">
        <PatternGrid items={RSC_LIMITATIONS} />
      </Step>

      <ArchitectNotes
        framing="RSC is the topic where junior answers and senior answers diverge most. Senior probes the build-time / run-time split, the wire format, and the boundary's actual semantics — not just 'use client at the top.'"
        followUps={[
          {
            q: "Describe the RSC wire format. What actually crosses the network?",
            a: "Two things. (1) HTML — the rendered output of the server tree, streamed in chunks. (2) The RSC payload — a custom serialised format describing the React element tree, including references to Client Components by module ID + props (props serialised as JSON or special markers for non-JSON values like dates, maps, server-side promises). It's NOT JSON top-to-bottom — there's a chunk-id-prefixed protocol. The client runtime knows how to interpret references like `$L1` as 'load Client Component with module ID 1.' This is what lets a Server Component render a Client Component while the Client Component's JS lives in a separate, lazy-loaded chunk.",
          },
          {
            q: "What happens at BUILD time vs RUNTIME for an RSC + Client Component tree?",
            a: "Build time: the bundler walks the import graph from the route entry, identifies modules with `'use client'`, splits them into client chunks with a server-side proxy/reference stub. RSC files don't ship to the client at all — their imports either become server-only or are blocked at build (e.g. importing `fs` from a Client Component is rejected). Runtime: a request hits the route, the server walks the RSC tree, calls each component's async function, streams the result. When it encounters a Client Component reference, it emits a placeholder pointing to the client chunk and streams the props alongside. The browser receives both, hydrates the Client Components in place.",
          },
          {
            q: "Can a Server Component re-render? What triggers it?",
            a: "Each request is a fresh server render — there's no in-process re-render of a Server Component within a session. To 'refresh' a Server Component's output, you trigger a re-fetch of the route (or a Server Action calling revalidatePath/revalidateTag), and Next.js (or your RSC host) re-renders the route on the server and streams the new payload. The client runtime then reconciles the new RSC payload into the existing tree without remounting Client Components that didn't change. This is the magic — server output changes, client state preserved.",
          },
          {
            q: "Why can't a Server Component use useState? Walk me through what would break.",
            a: "useState requires a fiber's memoizedState linked list and a dispatcher to push updates to. Both live in the client renderer. On the server there's no fiber that persists between requests — the server renders once and discards the tree. So useState would have nowhere to write to and no way to trigger a re-render. The architectural decision is clean: Server Components are stateless, request-scoped; state lives behind the 'use client' boundary where the renderer can manage it.",
          },
          {
            q: "How does data fetching parallelise across Server Components?",
            a: "If you `await` two queries sequentially in the same component (`const a = await fetchA(); const b = await fetchB();`), they're serial. Use Promise.all to parallelise. If two SIBLING Server Components each fetch, they run in parallel automatically — the server can render them concurrently up to the point where awaits block. For data shared across siblings, hoist the fetch to the parent and pass results down, or use `cache()` so both children calling getUser(id) collapse into one fetch.",
          },
          {
            q: "What's the cost model? How do I reason about 'should this be a Server or Client component'?",
            a: "Three dimensions. (1) Does it need state, effects, browser APIs, or event handlers? If yes, Client. (2) Does it have a large library dependency that you don't want on the client bundle? If yes, prefer Server. (3) Is it interactive but small (a like button)? Client, as a leaf — the rest of the tree stays Server. The 'push use client to the leaves' rule operationalises this: maximise Server up the tree, minimise Client at the leaves. Bundle math: the closer 'use client' is to the leaves, the less JS ships.",
          },
        ]}
        pivots={[
          { to: "Server Actions (Module 13)", why: "Symmetric writes; expect 'OK we read on the server — how do we mutate?'" },
          { to: "Streaming SSR (Module 7)", why: "RSC streams; the natural pivot is to the wire-level streaming behaviour." },
          { to: "Cache invalidation", why: "'How do you trigger a re-render of a Server Component?' is the canonical follow-up." },
        ]}
        dontSay={[
          {
            phrase: "Server Components are just SSR.",
            why: "Wrong vocabulary. SSR renders the whole tree on the server then hydrates everything. RSC keeps the Server tree on the server permanently — those components never ship as JS. Conflating the two is a senior-interview red flag.",
          },
          {
            phrase: "I always make everything a Client Component for safety.",
            why: "Throws away RSC's main benefit (zero client JS for server-renderable parts). Architect wants to hear 'I default to Server and opt into Client at leaves.'",
          },
          {
            phrase: "useState doesn't work on the server.",
            why: "Technically true but unsatisfying. The architect wants 'because there's no persistent fiber across requests' — show the why, not the rule.",
          },
        ]}
      />

      <Step n={7} kind="next" title="Reads are solved. What about writes?">
        <Callout tone="next" title="next bottleneck">
          Server Components let the server <em>render</em>. But the page still posts to API
          routes for mutations. Server Actions kill that boilerplate: write an async function
          with <code>&apos;use server&apos;</code> and pass it directly to <code>&lt;form action&gt;</code>.
        </Callout>
      </Step>
    </Lesson>
  );
}
