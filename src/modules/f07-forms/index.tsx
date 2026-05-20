"use client";

import { useRef, useState } from "react";
import { Lesson } from "@/engine/Lesson";
import { Step } from "@/engine/Step";
import { Callout } from "@/engine/Callout";
import { Quiz } from "@/engine/Quiz";
import { ArchitectNotes } from "@/engine/ArchitectNotes";

export default function F07Forms() {
  return (
    <Lesson slug="f07-forms">
      <Step n={1} kind="observe" title="Controlled vs uncontrolled — pick one consciously">
        <p>
          A <strong>controlled</strong> input has its value driven by React state:{" "}
          <code>&lt;input value=&#123;email&#125; onChange=&#123;e =&gt;
          setEmail(e.target.value)&#125;/&gt;</code>. Every keystroke updates state, every render
          shows state. The DOM is a slave to React.
        </p>
        <p>
          An <strong>uncontrolled</strong> input holds its own value in the DOM. You read it
          via a ref on submit: <code>const ref = useRef(); &lt;input ref=&#123;ref&#125;/&gt;
          ... ref.current.value</code>. The DOM is the source of truth; React only reads.
        </p>
      </Step>

      <Step n={2} kind="profile" title="See both in action">
        <ControlledVsUncontrolled />
      </Step>

      <Step n={3} kind="explain" title="When each wins">
        <p>
          <strong>Controlled (default for most product code):</strong>
        </p>
        <ul>
          <li>Per-keystroke validation (highlight invalid email as you type).</li>
          <li>Transform / format (uppercase, insert dashes in card number).</li>
          <li>Conditional disable / show (submit button enables when form is valid).</li>
          <li>Multi-field interactions (password ↔ confirm-password match check).</li>
        </ul>
        <p>
          <strong>Uncontrolled (specialised cases):</strong>
        </p>
        <ul>
          <li>Large forms with 30+ fields — each keystroke re-rendering the whole form gets expensive. Libraries like react-hook-form use refs internally for this reason.</li>
          <li>File inputs — must be uncontrolled (security; can&apos;t set the value).</li>
          <li>Integrating with imperative third-party widgets that own their DOM.</li>
        </ul>
      </Step>

      <Step n={4} kind="fix" title="Form actions in React 19">
        <p>
          React 19 added <code>&lt;form action=&#123;serverAction&#125;&gt;</code> as a
          first-class primitive. The browser POSTs to the action, the server runs it, the
          response navigates. Even without JS. With JS, you get optimistic UI via{" "}
          <code>useOptimistic</code>, pending state via <code>useFormStatus</code>, and
          validation via <code>useActionState</code>. Module 13 covers this in depth.
        </p>
      </Step>

      <Quiz
        id="f07:controlled-or-not"
        prompt="A signup form has 5 fields. Each needs per-keystroke validation (email format, password strength). What's the right approach?"
        options={[
          {
            id: "a",
            text: "Controlled — useState per field, validate on each keystroke.",
            correct: true,
            rationale: "Per-keystroke validation requires React to see every change. Controlled is the natural fit; performance is fine at 5 fields. Above ~10 fields, switch to useReducer or react-hook-form to limit re-renders.",
          },
          {
            id: "b",
            text: "Uncontrolled — refs only.",
            rationale: "Loses the per-keystroke validation handle. Refs read on submit; you can't easily highlight invalid email AS the user types without manual event handling.",
          },
          {
            id: "c",
            text: "react-hook-form — always.",
            rationale: "Overkill for 5 fields. RHF shines at 20+ fields where avoiding per-field renders matters. For 5, useState is simpler.",
          },
          {
            id: "d",
            text: "Server-only validation.",
            rationale: "Loses immediate feedback. Even with Server Actions, per-keystroke client validation is the right UX for format checks.",
          },
        ]}
      />

      <ArchitectNotes
        framing="Forms questions probe whether you can name the SPECIFIC perf characteristics — when controlled wins, when uncontrolled wins, when to reach for a library."
        followUps={[
          {
            q: "Why does react-hook-form claim to be faster than naive controlled forms?",
            a: "RHF uses refs for the values (uncontrolled) but ALSO subscribes specific components to specific fields. When `email` changes, only the email field's component renders — the rest of the form doesn't see the update. Compare to naive controlled: 30 useState calls all live on the same parent component, so any keystroke re-renders the whole form (30 inputs + their labels + the submit button). The architect tests if you understand: it's not 'uncontrolled is faster' — it's 'subscription-based granularity is faster than parent-state cascade.'",
          },
          {
            q: "Why must file inputs be uncontrolled?",
            a: "Security. If file inputs were controllable, a malicious script could programmatically attach files via `<input type='file' value={...}/>`. Browsers block this — file inputs accept value from user interaction ONLY (clicking, drag-drop). You can READ via ref, but can't WRITE. Even in React, `<input type='file' value={...}/>` is a no-op for the value attribute.",
          },
          {
            q: "Validation strategies — when client, when server, when both?",
            a: "Both, layered. Client validates format (email regex, length, character classes) for immediate feedback — milliseconds. Server validates SEMANTICS (email exists, password not pwned, business rules) and TRUST (client could be tampered). Never trust the client; always re-validate server-side. Client validation is UX; server validation is security. The architect tests if you can articulate the SEPARATION — many devs conflate them.",
          },
          {
            q: "Show me how you'd build a complex form (think: order checkout with 20 fields, dynamic add/remove items, server validation, optimistic submit).",
            a: "React-hook-form for the value layer (subscription-based, refs internally). Zod for schema validation (TypeScript types + runtime parsing). Server Actions for the submit + revalidatePath. useActionState wraps the action — pending state for the submit button, errors for inline display. useOptimistic for the 'submitted, processing' UX. Refs not state for items — the array structure is owned by RHF's fieldArray. The architect cares about the layering: each library does one thing.",
          },
        ]}
        pivots={[
          { to: "Server Actions (Module 13)", why: "Form action prop + useActionState — modern form pattern." },
          { to: "Zod schema validation", why: "TypeScript types + runtime parsing for forms." },
          { to: "react-hook-form internals", why: "Subscription-based form pattern explanation." },
        ]}
        dontSay={[
          {
            phrase: "Always use controlled inputs.",
            why: "Above 10-20 fields, naive controlled gets expensive. Architect wants to hear the threshold.",
          },
          {
            phrase: "Skip server validation — client handles it.",
            why: "Security disaster. The architect treats this as 'I'd let an attacker bypass validation by hitting the API directly.'",
          },
        ]}
      />

      <Step n={5} kind="next" title="Sometimes a value isn't UI — it's plumbing.">
        <Callout tone="next" title="next foundation">
          Forms hold values you DISPLAY. Refs hold values you USE — DOM access, interval ids,
          previous-render snapshots. Foundation 08.
        </Callout>
      </Step>
    </Lesson>
  );
}

function ControlledVsUncontrolled() {
  const [controlled, setControlled] = useState("");
  const uncontrolledRef = useRef<HTMLInputElement>(null);
  const [readValue, setReadValue] = useState<string | null>(null);

  return (
    <div className="not-prose mt-3 grid gap-3 md:grid-cols-2">
      <div className="rounded-lg border border-bg-border bg-bg-panel p-3">
        <p className="mb-2 font-mono text-[10px] uppercase tracking-widest text-ink-dim">controlled</p>
        <input
          value={controlled}
          onChange={(e) => setControlled(e.target.value)}
          placeholder="type…"
          className="w-full rounded-md border border-bg-border bg-bg-elevated px-2 py-1.5 font-mono text-xs"
        />
        <p className="mt-2 font-mono text-[11px] text-ink-muted">
          state has: <span className="text-ink">{controlled || "(empty)"}</span>
        </p>
      </div>
      <div className="rounded-lg border border-bg-border bg-bg-panel p-3">
        <p className="mb-2 font-mono text-[10px] uppercase tracking-widest text-ink-dim">uncontrolled</p>
        <input
          ref={uncontrolledRef}
          defaultValue=""
          placeholder="type…"
          className="w-full rounded-md border border-bg-border bg-bg-elevated px-2 py-1.5 font-mono text-xs"
        />
        <button
          onClick={() => setReadValue(uncontrolledRef.current?.value ?? "")}
          className="mt-2 rounded-md bg-accent px-2.5 py-1 font-mono text-[11px] text-white"
        >
          read via ref
        </button>
        <p className="mt-2 font-mono text-[11px] text-ink-muted">
          last read: <span className="text-ink">{readValue ?? "(nothing yet)"}</span>
        </p>
      </div>
    </div>
  );
}
