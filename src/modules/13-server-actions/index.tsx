"use client";

import { useEffect, useState } from "react";
import { Lesson } from "@/engine/Lesson";
import { Step } from "@/engine/Step";
import { Callout } from "@/engine/Callout";
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

      <Step n={5} kind="next" title="Server writes done. What about reads in render?">
        <Callout tone="next" title="next bottleneck">
          You can mutate from the client. You can fetch from the server. But what about reading
          a promise <em>inside</em> a render? <code>use()</code> is the last piece.
        </Callout>
      </Step>
    </Lesson>
  );
}
