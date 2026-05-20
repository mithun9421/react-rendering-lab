"use client";

import { Lesson } from "@/engine/Lesson";
import { Step } from "@/engine/Step";
import { Callout } from "@/engine/Callout";
import { ArchitectNotes } from "@/engine/ArchitectNotes";
import { StreamChunks } from "@/viz/StreamChunks";
import { RealStreamChunks } from "@/viz/RealStreamChunks";

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

      <Step n={3} kind="profile" title="A real streamed response — your own server, your own bytes">
        <p>
          The viz above was simulated for predictability. This one is real — it calls the lab&apos;s
          own <code>/api/stream</code> route. The endpoint returns a <code>ReadableStream</code>{" "}
          that emits seven newline-delimited JSON chunks at scripted intervals over ~1.4s. The
          client reads the body with <code>reader.read()</code> in a loop and appends each chunk
          as it arrives.
        </p>
        <p>
          Wall-clock times in the right column are <em>actual</em> server-to-client latencies,
          not animation. Refresh under DevTools&apos; Network throttling to see how the timing
          shifts.
        </p>
        <div className="not-prose mt-3">
          <RealStreamChunks />
        </div>
      </Step>

      <Step n={4} kind="explain" title="renderToPipeableStream / renderToReadableStream">
        <p>
          The server-side API yields chunks as Suspense boundaries resolve. The client uses an
          inline runtime to swap fallbacks for real HTML in place. Crucially: the <em>hydration</em>{" "}
          tree React rebuilds matches the streamed structure — no client-side waterfall, no
          re-fetch on the client.
        </p>
      </Step>

      <Step n={5} kind="fix" title="React 19 — assets and metadata join the stream">
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

      <Step n={6} kind="fix" title="Preloading APIs — tell the stream what's coming">
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

      <ArchitectNotes
        framing="Streaming SSR is the React 18+ moneyshot — the architect wants you to articulate the FLUSH model: shell first, boundaries later, all over the same response."
        followUps={[
          {
            q: "How does renderToReadableStream differ from renderToString?",
            a: "renderToString is sync — it walks the tree, produces ALL the HTML, returns it. If your tree has any await (data fetching, Suspense), it blocks. renderToReadableStream is async — it returns a stream that emits the shell immediately and additional chunks as Suspense boundaries resolve. The transport is HTTP chunked transfer-encoding; the renderer flushes whenever a boundary's data lands. The user paints the shell at ~30ms TTFB while the boundary chunks arrive over the next second.",
          },
          {
            q: "What controls WHEN a chunk gets flushed?",
            a: "Two events. (1) The shell is flushed as soon as the top-level render reaches the first Suspense boundary that can't yet resolve. Everything ABOVE that boundary is in the shell. (2) Each subsequent flush happens when a Suspense boundary's data lands (its async function resolves). React serialises the boundary's content + an inline `<script>` that swaps the fallback for the real HTML. The browser parses these scripts as they arrive; no full-page rerender, just in-place DOM patches.",
          },
          {
            q: "How does selective hydration interact with streaming?",
            a: "Selective hydration prioritises hydration based on user interaction, not source order. A streaming SSR response arrives chunks in source order (shell → top → bottom). Once chunks reach the client, hydration walks in document order BUT if the user clicks an element in a not-yet-hydrated chunk, React preempts and hydrates that subtree first. The architect cares: streaming controls when HTML arrives; selective hydration controls when JS attaches. Both run concurrently.",
          },
          {
            q: "What does the Suspense boundary's fallback do during streaming?",
            a: "Renders to HTML and sits there until the real content arrives via a later chunk. The fallback's HTML is in the shell. When the boundary's data resolves, React emits a chunk like `<template id='B:1'>...</template><script>$RC('S:1','B:1')</script>` — a hidden template with the real content, then a runtime call to replace the fallback's DOM with the template's children. The substitution is DOM-level, not a re-render. The architect may probe: 'what if the boundary errors?' Answer: error boundary kicks in, fallback's content stays.",
          },
          {
            q: "What's the cost of having too many Suspense boundaries?",
            a: "Each boundary is a flush point — overhead on the renderer + extra inline runtime calls on the client. For 200 Suspense boundaries on a page, you'll see network bytes from the runtime swap scripts compound to noticeable KB. Coarser boundaries (one per major section, not one per row) is the right granularity. The architect tests whether you've designed boundaries around 'units that fail or load together,' not 'every component.'",
          },
        ]}
        pivots={[
          { to: "Suspense architecture (Module 8)", why: "Streaming + Suspense are inseparable; expect to discuss boundary placement." },
          { to: "Server Components (Module 12)", why: "RSC uses the same streaming primitives — discuss the wire format overlap." },
          { to: "Partial Prerendering (Module 15)", why: "PPR = streaming + ISR; senior interviewers may probe the connection." },
        ]}
        dontSay={[
          {
            phrase: "Streaming SSR is the same as Server Components.",
            why: "Streaming SSR is HTML transport; RSC is a wire format AND a rendering model. They share primitives but solve different problems.",
          },
          {
            phrase: "Streaming makes everything faster.",
            why: "Streaming makes TTFB and FCP faster — sometimes at the cost of TTI (total interactive time). The trade is perception vs absolute; the architect wants to hear the trade-off, not the marketing line.",
          },
        ]}
      />

      <Step n={7} kind="next" title="You shipped chunks. But waterfalls live in your tree.">
        <Callout tone="next" title="next bottleneck">
          A streamed boundary still has to wait for its data. If component A fetches X and child
          B fetches Y after mount, you&apos;ve serialised round-trips. Module 8 designs Suspense
          boundaries that coordinate async work without nested spinners.
        </Callout>
      </Step>
    </Lesson>
  );
}
