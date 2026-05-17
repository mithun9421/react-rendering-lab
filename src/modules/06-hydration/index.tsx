"use client";

import { Lesson } from "@/engine/Lesson";
import { Step } from "@/engine/Step";
import { Callout } from "@/engine/Callout";
import { HydrationOverlay } from "@/viz/HydrationOverlay";

export default function Module06() {
  return (
    <Lesson slug="06-hydration">
      <Step n={1} kind="observe" title="HTML arrives. The user can see it. They still can't click anything.">
        <p>
          SSR sends an HTML payload that paints fast. Then React has to <em>hydrate</em> — walk
          the whole tree, attach event listeners, reconcile state. Until that walk finishes,
          clicks are dropped on the floor.
        </p>
      </Step>

      <Step n={2} kind="profile" title="Four hydration strategies, four overlays">
        <p>Pick a mode and press replay. Watch which components become interactive, and when.</p>
        <div className="not-prose mt-3">
          <HydrationOverlay />
        </div>
      </Step>

      <Step n={3} kind="explain" title="What each mode actually changes">
        <ul>
          <li><strong>Full</strong> — one synchronous walk. The 380ms chart blocks the 60ms search.</li>
          <li><strong>Progressive</strong> — same walk, sorted by priority. The search hydrates first, but the chart still blocks the rest.</li>
          <li><strong>Selective</strong> — only mark some boundaries as interactive. Footer + comments never hydrate.</li>
          <li><strong>Islands</strong> — selective <em>and</em> independent. Each island hydrates in parallel because nothing depends on its siblings.</li>
        </ul>
      </Step>

      <Step n={4} kind="next" title="Even islands wait for HTML">
        <Callout tone="next" title="next bottleneck">
          Hydration can&apos;t start until the byte arrives. Streaming SSR (Module 7) sends the
          shell first and lets each Suspense boundary stream in its own chunk.
        </Callout>
      </Step>
    </Lesson>
  );
}
