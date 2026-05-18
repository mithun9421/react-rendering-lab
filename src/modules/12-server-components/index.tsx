"use client";

import { Lesson } from "@/engine/Lesson";
import { Step } from "@/engine/Step";
import { Callout } from "@/engine/Callout";
import { RscBoundary } from "@/viz/RscBoundary";

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

      <Step n={3} kind="explain" title="What you can do in a server component that you can't on the client">
        <ul>
          <li>Touch the file system (<code>fs.readFile</code>).</li>
          <li>Hit the database directly: <code>await db.query(...)</code> inside the component.</li>
          <li>Read process env, secrets, internal service tokens.</li>
          <li>Render <em>async</em> functions: <code>export default async function Page() {`{`}...{`}`}</code>.</li>
        </ul>
        <p>What you can&apos;t do: <code>useState</code>, <code>useEffect</code>, event handlers, browser APIs. Those are client-only.</p>
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
        <ul>
          <li>
            <strong>Subscribe to anything.</strong> No <code>useEffect</code>, no
            <code>useState</code>. RSC renders once per request — there is no &quot;state&quot;
            on the server. Push subscriptions down to a small client leaf.
          </li>
          <li>
            <strong>Read context defined in a client component.</strong> RSC can read context
            <em>only</em> if the context itself is server-safe (no React hooks on the value).
            For client-only context, the boundary has to be flipped.
          </li>
          <li>
            <strong>Use browser-only globals.</strong> <code>document</code>, <code>localStorage</code>{" "}
            don&apos;t exist. The compiler error is fast; the trap is when a dependency uses
            them at import time — gate it behind dynamic import.
          </li>
          <li>
            <strong>Re-fetch on its own.</strong> RSC is request-scoped. To &quot;refresh the
            data,&quot; you need a Server Action that calls <code>revalidatePath</code> (Module
            13) or a route-level <code>revalidate</code> hint.
          </li>
        </ul>
      </Step>

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
