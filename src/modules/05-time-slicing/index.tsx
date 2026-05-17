"use client";

import { Lesson } from "@/engine/Lesson";
import { Step } from "@/engine/Step";
import { Callout } from "@/engine/Callout";
import { TimeSlicingDemo } from "@/viz/FrameBudget";

export default function Module05() {
  return (
    <Lesson slug="05-time-slicing">
      <Step n={1} kind="observe" title="60 fps = 16.67ms per frame. That's it.">
        <p>
          Every animation frame, the browser has ~16ms to: process input → run JS → style → layout
          → paint → composite. If your render eats the whole budget, the frame is dropped.
        </p>
      </Step>

      <Step n={2} kind="profile" title="Blocking vs sliced — feel the difference">
        <p>
          The bar below is one frame. Drag the sliders to change how much CPU work happens. Run
          it blocking to overflow the frame. Then run it sliced: same total work, but each chunk
          yields to the browser between slices.
        </p>
        <div className="not-prose mt-3">
          <TimeSlicingDemo />
        </div>
      </Step>

      <Step n={3} kind="explain" title="How React slices time in practice">
        <p>
          The scheduler tracks <code>currentTime</code>. After every fiber, it asks{" "}
          <code>shouldYield()</code>. If a frame is about to expire, it yields back to{" "}
          <code>postTask</code> / <code>MessageChannel</code>, lets the browser paint, then
          resumes. <em>This is why fiber exists.</em>
        </p>
      </Step>

      <Step n={4} kind="next" title="Client work isn't the problem if the page didn't paint yet">
        <Callout tone="next" title="next bottleneck">
          All of this matters <em>after</em> hydration. But hydration itself is a giant
          synchronous walk that runs before the user can do anything. Module 6.
        </Callout>
      </Step>
    </Lesson>
  );
}
