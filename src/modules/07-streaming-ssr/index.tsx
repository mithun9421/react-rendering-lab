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

      <Step n={4} kind="next" title="You shipped chunks. But waterfalls live in <em>your</em> tree.">
        <Callout tone="next" title="next bottleneck">
          A streamed boundary still has to wait for its data. If component A fetches X and child
          B fetches Y after mount, you&apos;ve serialised round-trips. Module 8 designs Suspense
          boundaries that coordinate async work without nested spinners.
        </Callout>
      </Step>
    </Lesson>
  );
}
