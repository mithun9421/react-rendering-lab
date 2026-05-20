"use client";

import { useEffect, useState } from "react";
import { Lesson } from "@/engine/Lesson";
import { Step } from "@/engine/Step";
import { Callout } from "@/engine/Callout";
import { ArchitectNotes } from "@/engine/ArchitectNotes";
import { TodoForm } from "./TodoForm";
import { listTodos } from "./actions";

type Todo = { id: string; text: string };

export default function Module13() {
  // We render the lesson on the client, so fetch the initial todos via the server action once.
  const [initial, setInitial] = useState<Todo[] | null>(null);
  useEffect(() => {
    listTodos().then(setInitial);
  }, []);

  return (
    <Lesson slug="13-server-actions">
      <Step n={1} kind="observe" title="No API route, no fetch wrapper, no client state library">
        <p>
          The form below posts to a function that runs on the server. There is no{" "}
          <code>fetch</code> call, no <code>useEffect</code> for mutation, no Redux. The
          mutation, validation, error path, pending state, and optimistic UI are all wired with
          three hooks: <code>useActionState</code>, <code>useOptimistic</code>,{" "}
          <code>useFormStatus</code>.
        </p>
      </Step>

      <Step n={2} kind="profile" title="Try it — submit invalid text to feel the error path">
        <div className="not-prose mt-3">
          {initial ? (
            <TodoForm initial={initial} />
          ) : (
            <div className="rounded-md border border-bg-border bg-bg-panel p-3 font-mono text-[11px] text-ink-dim">
              loading initial state from server action…
            </div>
          )}
        </div>
      </Step>

      <Step n={3} kind="explain" title="What each hook is doing">
        <ul>
          <li>
            <code>useActionState(action, initial)</code> wraps the server action and returns{" "}
            <code>[state, formAction, pending]</code>. The state is whatever your action
            returns — perfect for validation errors.
          </li>
          <li>
            <code>useFormStatus()</code> is read from inside the form. It exposes{" "}
            <code>pending</code> + <code>data</code> for the currently-submitting form. Used by
            the submit button to disable itself.
          </li>
          <li>
            <code>useOptimistic(state, reducer)</code> renders a *predicted* state immediately
            while the action runs. When the action resolves (or fails) React swaps it back to
            the true state.
          </li>
        </ul>
      </Step>

      <Step n={4} kind="explain" title="Progressive enhancement is free">
        <p>
          Because the form&apos;s <code>action</code> is a real function reference (not an event
          handler), the form works <em>without JavaScript</em>. The HTML submits, the server
          runs the action, the page revalidates. With JS, you get the optimistic + pending UX
          on top.
        </p>
      </Step>

      <ArchitectNotes
        framing="Server Actions are the React-19 take on progressive enhancement — the architect tests whether you understand BOTH the no-JS path AND the JS-enhanced path."
        followUps={[
          {
            q: "Walk me through what happens when a user submits a form WITHOUT JavaScript.",
            a: "The browser does a standard HTML form POST to the action URL. Bundlers compile `<form action={serverAction}>` to a URL pointing at a serverside RPC endpoint. The endpoint runs the action function on the server, executes mutations, can call revalidatePath. The response is HTML — typically the same route rerendered. Browser navigates. User sees updated content. The form survived a JS failure. The architect cares: 'progressive enhancement' means the JS layer adds UX, doesn't gate functionality.",
          },
          {
            q: "Explain useActionState. What problem does it solve over a plain useState?",
            a: "Three things at once. (1) Pending state — `pending` true while the action runs, lets the UI show a spinner without manual setState. (2) Return value — the action's return is exposed as `state`, perfect for validation errors and confirmations. (3) Form integration — the wrapped action goes straight into `<form action>`, the browser submits naturally. With plain useState you'd manually track all three. Plus, useActionState plays with React's transition semantics — the wrapped call is automatically a transition, so the pending state doesn't block the input.",
          },
          {
            q: "How does useOptimistic recover when the server rejects?",
            a: "useOptimistic is bound to the canonical state — typically the result of a query. The optimistic value lives until the action resolves. On success, the canonical state updates and useOptimistic falls back to it (the optimistic value is no longer needed). On rejection, the canonical state doesn't change — useOptimistic re-reads it on next render and the optimistic value vanishes. The UI snaps back. No manual rollback code. The architect may probe: 'how do you show the failure?' Answer: pair with useActionState's error return + a visible UI affordance (red border, retry button) on the affected item.",
          },
          {
            q: "What's useFormStatus and why does it have to be a separate hook?",
            a: "useFormStatus reads the current submission status of the NEAREST enclosing form. It's separate from useActionState because it's CONSUMER-side — any descendant can read it without being passed the pending state via props. Submit button reads pending without prop-drilling from the form. The constraint: the hook MUST be called from a child of the form, not from the form itself. The architect tests whether you can articulate the reason — context-style read, not prop-style.",
          },
          {
            q: "Server Actions and CSRF — how is it protected?",
            a: "Next.js (and other RSC hosts) generate per-deployment action IDs. The client gets the action's ID at SSR time; the server validates the ID on submission. The IDs aren't predictable across deployments, defeating CSRF where an attacker can't know the ID. ALSO, action invocations require the origin header to match (Same-Origin or CORS). The architect may probe: 'what if you accept actions from an iframe in a different origin?' Answer: by default, blocked; you can opt in explicitly with allowedOrigins config.",
          },
        ]}
        pivots={[
          { to: "RSC wire format (Module 12)", why: "Server Actions are POSTs against the same RSC infrastructure." },
          { to: "Progressive enhancement", why: "Architect may probe the broader principle." },
          { to: "Form validation strategies", why: "useActionState returns are the obvious place to put server-validated errors." },
        ]}
        dontSay={[
          {
            phrase: "Server Actions replace fetch.",
            why: "Different abstraction. Actions are RPC for mutations; fetch is HTTP transport. Use Actions for write paths; keep fetch for non-React contexts and reads outside the framework.",
          },
          {
            phrase: "useOptimistic is just useState with a setter.",
            why: "It's bound to a CANONICAL state and auto-reverts. useState gives you no recovery on rejection.",
          },
        ]}
      />

      <Step n={5} kind="next" title="Server writes done. What about reads in render?">
        <Callout tone="next" title="next bottleneck">
          You can mutate from the client. You can fetch from the server. But what about reading
          a promise <em>inside</em> a render? <code>use()</code> is the last piece.
        </Callout>
      </Step>
    </Lesson>
  );
}
