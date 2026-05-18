"use server";

import { revalidatePath } from "next/cache";

/**
 * Tiny in-memory store on the server. The whole point is to show the round-trip,
 * so latency is artificial: 600ms.
 *
 * NB: in a real app this would be `db.todos.insert(...)`.
 */
type Todo = { id: string; text: string };
let TODOS: Todo[] = [
  { id: "seed-1", text: "Audit React 19 coverage" },
  { id: "seed-2", text: "Pair on Module 12 boundary rules" },
];

export async function listTodos(): Promise<Todo[]> {
  return TODOS;
}

export type AddTodoState =
  | { ok: true; todo: Todo }
  | { ok: false; error: string }
  | null;

/**
 * Used by useActionState — must accept (prevState, formData) and return next state.
 * Validates input on the server. The client side gets the typed return value.
 */
export async function addTodoAction(
  _prev: AddTodoState,
  formData: FormData
): Promise<AddTodoState> {
  const text = String(formData.get("text") ?? "").trim();
  await new Promise((r) => setTimeout(r, 600));

  if (text.length < 3) {
    return { ok: false, error: "Todo must be at least 3 characters." };
  }
  if (text.length > 80) {
    return { ok: false, error: "Todo must be ≤ 80 characters." };
  }

  const todo: Todo = { id: `t-${Date.now()}`, text };
  TODOS = [todo, ...TODOS];
  revalidatePath("/lab/13-server-actions");
  return { ok: true, todo };
}

export async function deleteTodoAction(id: string) {
  await new Promise((r) => setTimeout(r, 400));
  TODOS = TODOS.filter((t) => t.id !== id);
  revalidatePath("/lab/13-server-actions");
}
