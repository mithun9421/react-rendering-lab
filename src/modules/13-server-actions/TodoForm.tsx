"use client";

import { useActionState, useOptimistic, useRef, useTransition } from "react";
import { useFormStatus } from "react-dom";
import { addTodoAction, deleteTodoAction, type AddTodoState } from "./actions";

type Todo = { id: string; text: string };

export function TodoForm({ initial }: { initial: Todo[] }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction, isPending] = useActionState<AddTodoState, FormData>(addTodoAction, null);

  // Optimistic layer over the (server-driven) list.
  // We keep our own local "committed" list seeded from initial; the optimistic hook lets us
  // show a pending item while the action runs.
  const [optimistic, addOptimistic] = useOptimistic<Todo[], string>(
    state?.ok ? [state.todo, ...initial] : initial,
    (current, pendingText) => [{ id: `pending-${Date.now()}`, text: pendingText + " …" }, ...current]
  );

  const [, startTransition] = useTransition();

  return (
    <div className="space-y-3">
      <form
        ref={formRef}
        action={(fd) => {
          // Apply the optimistic update inside a transition before triggering the action.
          const text = String(fd.get("text") ?? "").trim();
          if (text.length >= 3) {
            startTransition(() => {
              addOptimistic(text);
              formAction(fd);
              formRef.current?.reset();
            });
          } else {
            startTransition(() => formAction(fd));
          }
        }}
        className="flex items-center gap-2"
      >
        <input
          name="text"
          autoComplete="off"
          placeholder="Add a todo (3-80 chars)…"
          className="flex-1 rounded-md border border-bg-border bg-bg-elevated px-3 py-2 font-mono text-sm placeholder:text-ink-dim focus:outline-none focus:ring-2 focus:ring-accent/40"
        />
        <SubmitButton />
      </form>

      {state && !state.ok && (
        <p className="rounded-md border border-accent-bad/30 bg-accent-bad/10 px-3 py-2 font-mono text-[11px] text-accent-bad">
          server rejected: {state.error}
        </p>
      )}

      <ul className="divide-y divide-bg-border rounded-md border border-bg-border bg-bg-panel">
        {optimistic.length === 0 && (
          <li className="px-3 py-3 font-mono text-[11px] text-ink-dim">no todos yet</li>
        )}
        {optimistic.map((t) => {
          const pending = t.id.startsWith("pending-");
          return (
            <li key={t.id} className="flex items-center justify-between px-3 py-2 text-sm">
              <span className={pending ? "text-ink-muted italic" : "text-ink"}>{t.text}</span>
              <div className="flex items-center gap-2">
                {pending && (
                  <span className="font-mono text-[10px] uppercase tracking-widest text-accent-warn">
                    optimistic
                  </span>
                )}
                {!pending && (
                  <form
                    action={async (fd) => {
                      const id = String(fd.get("id"));
                      await deleteTodoAction(id);
                    }}
                  >
                    <input type="hidden" name="id" value={t.id} />
                    <button className="font-mono text-[11px] text-ink-dim hover:text-accent-bad">
                      delete
                    </button>
                  </form>
                )}
              </div>
            </li>
          );
        })}
      </ul>

      <p className="font-mono text-[10px] text-ink-dim">
        {isPending ? "server action in flight…" : "idle"} · artificial 600ms latency to make the
        optimistic phase visible
      </p>
    </div>
  );
}

function SubmitButton() {
  // useFormStatus reads from the enclosing <form>. It only works inside a child of <form>.
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-md bg-accent px-3 py-2 font-mono text-[11px] text-white disabled:opacity-50"
    >
      {pending ? "saving…" : "add todo"}
    </button>
  );
}
