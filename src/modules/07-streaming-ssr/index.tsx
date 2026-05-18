"use client";

import { Lesson } from "@/engine/Lesson";
import { Step } from "@/engine/Step";
import { Callout } from "@/engine/Callout";
import { StreamChunks } from "@/viz/StreamChunks";

export default function Module07() {
  return (
    <Lesson slug="07-streaming-ssr">
      <Step n={1} kind="observe" title="Shell first. Boundaries later.">
        <p>
          With streaming SSR the server flushes the document shell (head, nav, fallbacks) before
          any slow data resolves. As each <code>&lt;Suspense&gt;</code> boundary&apos;s data lands,
          its HTML is streamed in and React swaps the fallback for the real content — without a
          new network round-trip.
        </p>
      </Step>

      <Step n={2} kind="profile" title="A live(ish) replay of a streamed response">
        <div className="not-prose mt-3">
          <StreamChunks />
        </div>
      </Step>

      <Step n={3} kind="explain" title="renderToPipeableStream / renderToReadableStream">
        <p>
          The server-side API yields chunks as Suspense boundaries resolve. The client uses an
          inline runtime to swap fallbacks for real HTML in place. Crucially: the <em>hydration</em>{" "}
          tree React rebuilds matches the streamed structure — no client-side waterfall, no
          re-fetch on the client.
        </p>
      </Step>

      <Step n={4} kind="fix" title="React 19 — assets and metadata join the stream">
        <p>
          The streaming renderer doesn&apos;t just emit your component HTML. React 19 also
          hoists three categories of tag from anywhere in your tree into the document head, in
          the right order, at the right time:
        </p>
        <ul>
          <li>
            <strong>Document metadata:</strong> <code>&lt;title&gt;</code>,{" "}
            <code>&lt;meta&gt;</code>, <code>&lt;link rel=&quot;canonical&quot;&gt;</code>{" "}
            rendered inside a component get hoisted to <code>&lt;head&gt;</code>. Replaces{" "}
            <code>next/head</code> and <code>react-helmet</code>.
          </li>
          <li>
            <strong>Stylesheets with precedence:</strong>{" "}
            <code>&lt;link rel=&quot;stylesheet&quot; href=&quot;...&quot; precedence=&quot;high&quot;&gt;</code>{" "}
            is dedup&apos;d, hoisted, and ordered by precedence. The renderer suspends the
            boundary until the sheet is loaded — no FOUC.
          </li>
          <li>
            <strong>Async scripts:</strong>{" "}
            <code>&lt;script async src=&quot;...&quot;&gt;</code> is also dedup&apos;d and hoisted,
            so the same analytics tag rendered in three places loads exactly once.
          </li>
        </ul>
        <pre className="not-prose mt-3 overflow-x-auto rounded-md border border-bg-border bg-bg-elevated p-3 font-mono text-[10px] leading-relaxed">
{`function ProductPage({ product }) {
  return (
    <>
      <title>{product.name} · MyShop</title>
      <meta name="description" content={product.summary} />
      <link rel="stylesheet" href="/product.css" precedence="default" />
      <script async src="https://analytics.example/p.js" />
      <ProductDetail {...product} />
    </>
  );
}`}
        </pre>
      </Step>

      <Step n={5} kind="fix" title="Preloading APIs — tell the stream what's coming">
        <p>
          Even with streaming, the browser still discovers assets sequentially. React 19 ships
          three imperative APIs that emit early hints into the stream:
        </p>
        <ul>
          <li>
            <code>preload(href, &#123; as: &quot;style&quot; &#125;)</code> — emits a{" "}
            <code>&lt;link rel=&quot;preload&quot;&gt;</code> before the boundary that needs it.
          </li>
          <li>
            <code>preinit(href, &#123; as: &quot;script&quot; &#125;)</code> — preloads{" "}
            <em>and</em> executes the script as soon as it lands.
          </li>
          <li>
            <code>preconnect(origin)</code> / <code>prefetchDNS(origin)</code> — warm the TCP /
            DNS for an upcoming fetch.
          </li>
        </ul>
        <p>
          Use them inside the server component that <em>knows</em> the asset will be needed —
          right before the <code>&lt;Suspense&gt;</code> boundary. The browser starts the asset
          fetch in parallel with the data fetch the boundary is waiting on.
        </p>
      </Step>

      <Step n={6} kind="next" title="You shipped chunks. But waterfalls live in your tree.">
        <Callout tone="next" title="next bottleneck">
          A streamed boundary still has to wait for its data. If component A fetches X and child
          B fetches Y after mount, you&apos;ve serialised round-trips. Module 8 designs Suspense
          boundaries that coordinate async work without nested spinners.
        </Callout>
      </Step>
    </Lesson>
  );
}
