"use client";

import { useState } from "react";
import { Lesson } from "@/engine/Lesson";
import { Step } from "@/engine/Step";
import { Callout } from "@/engine/Callout";
import { Quiz } from "@/engine/Quiz";
import { ArchitectNotes } from "@/engine/ArchitectNotes";

export default function F05Events() {
  return (
    <Lesson slug="f05-events">
      <Step n={1} kind="observe" title="React events look like HTML events but aren't">
        <p>
          <code>&lt;button onClick=&#123;...&#125;&gt;</code> looks like the HTML attribute.
          It&apos;s not. React wraps each event in a <strong>SyntheticEvent</strong> — a
          cross-browser-normalised object — and delegates from the root.
        </p>
      </Step>

      <Step n={2} kind="explain" title="Event delegation: one listener, every event">
        <p>
          When React 17+ mounts, it attaches a single listener per event type to the root DOM
          node. Every click, change, keydown anywhere in your app bubbles up to that one
          listener. React then walks the React tree from the target up, invoking your handlers.
        </p>
        <p>
          Why: (1) memory — no per-element listener. (2) consistent ordering. (3) dynamic
          content works without re-binding. The trade-off: synthetic events aren&apos;t exact
          DOM events. If you do `addEventListener` on a node directly, you bypass React&apos;s
          delegation; useful for <code>&lt;canvas&gt;</code> low-level work, mostly avoided.
        </p>
      </Step>

      <Step n={3} kind="fix" title="Passing arguments to handlers">
        <p>The right way to bind extra args to a handler:</p>
        <pre className="not-prose mt-3 overflow-x-auto rounded-md border border-bg-border bg-bg-elevated p-3 font-mono text-[11px] leading-relaxed">
{`// Inline arrow (allocates a new closure per render):
<button onClick={() => deleteRow(item.id)}>×</button>

// Pre-bound (stable reference — useful for memo'd children):
const onDelete = useCallback((id) => deleteRow(id), [deleteRow]);
<button onClick={() => onDelete(item.id)}>×</button>

// Data-attribute delegation (one handler for many items):
function onListClick(e) {
  const id = e.currentTarget.dataset.id;
  if (id) deleteRow(id);
}
<ul onClick={onListClick}>
  {items.map(i => <li key={i.id} data-id={i.id}>×</li>)}
</ul>`}
        </pre>
      </Step>

      <Step n={4} kind="explain" title="event.preventDefault() and event.stopPropagation()">
        <ul>
          <li>
            <code>preventDefault()</code> cancels the browser&apos;s default action — submitting
            a form, following a link, scrolling. Use it for form `onSubmit` if you handle the
            POST yourself.
          </li>
          <li>
            <code>stopPropagation()</code> stops React&apos;s synthetic bubbling. Sibling
            handlers won&apos;t see this event. Use sparingly — it&apos;s often a sign the
            architecture is wrong (handlers should be at the right level, not stopped
            mid-flight).
          </li>
        </ul>
      </Step>

      <Step n={5} kind="profile" title="Try it — synthetic event in your hand">
        <EventInspector />
      </Step>

      <Quiz
        id="f05:delegation"
        prompt="An app with 1,000 buttons. Should each button get its own onClick, or should the parent <div> delegate?"
        options={[
          {
            id: "a",
            text: "Each button — React handles delegation internally, no perf diff.",
            correct: true,
            rationale:
              "React already delegates at the root. Writing onClick on each button doesn't actually attach 1000 DOM listeners; it just registers React handlers in the synthetic system. The architect tests if you know React's delegation already gives you the win.",
          },
          {
            id: "b",
            text: "Parent delegation — saves 1000 listeners.",
            rationale: "True for vanilla DOM. Not true with React — React already delegates. Manual parent-delegation gains nothing and loses TypeScript inference on the per-button handler.",
          },
          {
            id: "c",
            text: "Inline arrow functions on each button.",
            rationale: "Works, but every render allocates 1000 new arrow functions. With memo'd children it busts memoisation. Use useCallback or per-item delegation if perf matters.",
          },
          {
            id: "d",
            text: "Custom event bus.",
            rationale: "Overengineering. React's system already handles this.",
          },
        ]}
      />

      <ArchitectNotes
        framing="Event questions probe whether you understand React's delegation model AND when you need to bypass it (canvas, video, scroll perf)."
        followUps={[
          {
            q: "What's a SyntheticEvent and how does it differ from a DOM event?",
            a: "SyntheticEvent is React's cross-browser-normalised wrapper. It exposes the same API as DOM events (target, currentTarget, preventDefault, etc.) but with consistent behaviour across browsers. Pre-React-17 it was object-pooled (you couldn't hold a reference across handlers); React 17+ removed pooling. The underlying nativeEvent is still accessible via `e.nativeEvent`. The architect may probe: 'what about events React doesn't support?' Answer: useEffect + native addEventListener — common for resize, intersection, paste with specific MIME handling.",
          },
          {
            q: "Walk me through React's event delegation model.",
            a: "React 17+ attaches ONE listener per event type to the root DOM container (the element passed to createRoot). When that listener fires, React walks the React tree from the target fiber up to root, invoking handlers along the way and respecting bubbling/capture semantics. Pre-17, React attached to document — which caused issues for nested React apps. Per-event-type means: one click listener handles every onClick in the app; one focus listener handles every focus; etc.",
          },
          {
            q: "When SHOULD you bypass React's event system?",
            a: "Three legit cases. (1) Performance-critical (scroll, mousemove on canvas) where the synthetic-event allocation matters — pre-React-17 this was huge; now it's a micro-optimisation. (2) Events React doesn't support: paste with specific MIME types, gamepad, beforeinput on contenteditable. (3) Passive listeners (scroll, touchstart with `{passive: true}`) — React doesn't support passive by default in older versions. Use useEffect + addEventListener for these; remember the cleanup.",
          },
          {
            q: "What's the difference between e.target and e.currentTarget?",
            a: "e.target is the deepest element that received the event (where the user actually clicked). e.currentTarget is the element where the handler is attached (where React called your function). On a `<button>` with an `<svg>` inside: clicking the SVG icon, target is the SVG, currentTarget is the button. Almost always you want currentTarget — handler attached to the button, button is what you care about. target is for cases where the SAME handler is attached to a parent for multiple children (delegation).",
          },
        ]}
        pivots={[
          { to: "Custom Elements + React 19", why: "How synthetic events handle custom-element events." },
          { to: "Passive event listeners", why: "Scroll perf trade-offs." },
          { to: "Form events × Server Actions (Module 13)", why: "Forms have special event handling." },
        ]}
        dontSay={[
          {
            phrase: "React events are HTML events.",
            why: "They're synthetic wrappers. Different lifecycle (pooled pre-17), different cross-browser guarantees.",
          },
          {
            phrase: "Always use stopPropagation to be safe.",
            why: "Often masks an architecture bug (handlers at wrong levels). Use sparingly.",
          },
        ]}
      />

      <Step n={6} kind="next" title="Renders happen. Lists and conditions shape the output.">
        <Callout tone="next" title="next foundation">
          Events trigger renders. Renders produce UI from data — conditional rendering, lists,
          keys. The keys question previews Module 1. Foundation 06.
        </Callout>
      </Step>
    </Lesson>
  );
}

function EventInspector() {
  const [last, setLast] = useState<string | null>(null);
  return (
    <div className="not-prose mt-3 rounded-md border border-bg-border bg-bg-elevated p-3">
      <button
        onClick={(e) =>
          setLast(
            `type=${e.type} · target=${(e.target as HTMLElement).tagName} · currentTarget=${e.currentTarget.tagName} · time=${e.timeStamp.toFixed(0)}`
          )
        }
        className="rounded-md bg-accent px-3 py-1.5 font-mono text-[11px] text-white"
      >
        click me
      </button>
      <pre className="mt-3 overflow-x-auto rounded border border-bg-border bg-bg-panel p-2 font-mono text-[10px] text-ink-muted">
        {last ?? "click the button to inspect the synthetic event"}
      </pre>
    </div>
  );
}
