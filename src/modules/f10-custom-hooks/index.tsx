"use client";

import { useEffect, useState } from "react";
import { Lesson } from "@/engine/Lesson";
import { Step } from "@/engine/Step";
import { Callout } from "@/engine/Callout";
import { Quiz } from "@/engine/Quiz";
import { ArchitectNotes } from "@/engine/ArchitectNotes";

export default function F10CustomHooks() {
  return (
    <Lesson slug="f10-custom-hooks">
      <Step n={1} kind="observe" title="A custom hook is just a function that uses other hooks">
        <pre className="not-prose overflow-x-auto rounded-md border border-bg-border bg-bg-elevated p-3 font-mono text-[11px] leading-relaxed">
{`function useWindowWidth() {
  const [width, setWidth] = useState(window.innerWidth);
  useEffect(() => {
    const onResize = () => setWidth(window.innerWidth);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);
  return width;
}

// Used like:
const width = useWindowWidth();`}
        </pre>
        <p className="mt-3">
          That&apos;s it. No registration, no API. The <code>use</code> prefix is the only thing
          that distinguishes a custom hook from a regular function — and it&apos;s how ESLint
          knows to enforce the Rules of Hooks.
        </p>
      </Step>

      <Step n={2} kind="profile" title="Try the demo">
        <WindowWidthDemo />
      </Step>

      <Step n={3} kind="explain" title="Why does extracting a hook help?">
        <ul>
          <li>
            <strong>Reuse</strong> — same subscription pattern in many components without
            copy-paste.
          </li>
          <li>
            <strong>Composition</strong> — hooks compose like functions:{" "}
            <code>useDebouncedSearch</code> uses <code>useDebouncedValue</code> uses{" "}
            <code>useTimeout</code>.
          </li>
          <li>
            <strong>Naming</strong> — gives a domain meaning to what would otherwise be 'a
            useState + a useEffect.' Code reads like sentences.
          </li>
          <li>
            <strong>Testability</strong> — you can test the hook in isolation with{" "}
            <code>@testing-library/react</code>&apos;s <code>renderHook</code>.
          </li>
        </ul>
      </Step>

      <Step n={4} kind="fix" title="Naming + return shape conventions">
        <ul>
          <li>
            <strong>Start with <code>use</code></strong>. This is the lint contract.
          </li>
          <li>
            <strong>Return a tuple <code>[value, setter]</code> for state-like hooks</strong>, an
            object for hooks with many properties. <code>const [value, setValue] = useX()</code>{" "}
            mirrors useState.
          </li>
          <li>
            <strong>Don&apos;t return null or undefined silently</strong>. If the hook can
            return nothing, make it explicit in the type and document why.
          </li>
          <li>
            <strong>Type generics for reuse</strong>. <code>useLocalStorage&lt;T&gt;(key: string,
            initial: T): [T, (next: T) =&gt; void]</code>.
          </li>
        </ul>
      </Step>

      <Step n={5} kind="explain" title="When NOT to extract a hook">
        <ul>
          <li>
            <strong>Used once</strong>. Premature abstraction. Inline; refactor later if a
            second use case appears.
          </li>
          <li>
            <strong>It&apos;s a one-liner of derived state</strong>.{" "}
            <code>const isAdult = age &gt;= 18</code> doesn&apos;t need a hook.
          </li>
          <li>
            <strong>It hides important context</strong>. A useEffect with non-obvious cleanup
            implications is often clearer at the call site, not buried in a hook.
          </li>
        </ul>
      </Step>

      <Quiz
        id="f10:naming"
        prompt="A helper function `getUserStatus(id)` calls useState inside. ESLint complains. Why?"
        options={[
          {
            id: "a",
            text: "useState only works in classes.",
            rationale: "False — useState is the function-component hook.",
          },
          {
            id: "b",
            text: "The `use` prefix is how the lint rule identifies hook callers. Without it, the linter assumes the function doesn't call hooks and can't enforce hook order. Rename to useUserStatus.",
            correct: true,
            rationale: "Naming is the lint contract. The lint rule statically tracks `use*` functions to enforce Rules of Hooks. Functions without `use` are assumed pure.",
          },
          {
            id: "c",
            text: "Helper functions can't use React APIs.",
            rationale: "They can — they just need the `use` prefix to be recognised as hook callers.",
          },
          {
            id: "d",
            text: "The function should return an object.",
            rationale: "Return shape doesn't matter to the lint rule.",
          },
        ]}
      />

      <ArchitectNotes
        framing="Custom hooks probe whether you understand them as a LINT CONTRACT, not a library API. The architect tests if you can articulate when to extract — and when not."
        followUps={[
          {
            q: "What's the runtime difference between a custom hook and a regular function?",
            a: "Zero. At runtime, useWindowWidth is just a function call. React doesn't track 'custom hooks' — it tracks hook calls (useState, useEffect, etc.). Whether those calls are inline in a component or extracted into a function called useX doesn't matter to the runtime. The `use` prefix is purely for LINTING — the eslint-plugin-react-hooks rule walks the call tree and checks hook order at every level. Without the prefix, the linter assumes the function doesn't call hooks.",
          },
          {
            q: "How does the hook order rule work, and how do custom hooks fit?",
            a: "React indexes hook calls by position in the fiber's memoizedState linked list. On each render, the same hooks must be called in the same order. Custom hooks are inlined for this purpose — useDebouncedSearch's internal hooks become part of the caller's linear hook order. The linter walks `use*` functions transitively to verify the order is stable across renders. The rule isn't 'hooks at top level' literally — it's 'hooks must be in a STABLE ORDER per render.'",
          },
          {
            q: "Show me a generic typed hook signature.",
            a: "function useLocalStorage<T>(key: string, initialValue: T): [T, (next: T) => void]. The generic T is inferred from initialValue at the call site; reads and writes are typed accordingly. Architect may probe: 'how do you handle JSON parsing errors?' Answer: union the return — `[T | null, ...]` — or accept a parser fn as a third arg. Or use Zod schema for runtime validation.",
          },
          {
            q: "When does a custom hook REPLACE context?",
            a: "When the value is GLOBAL (one source of truth, app-wide) and you want a clean API. Pattern: hook calls useContext internally, throws if used outside the provider, returns the value. `const user = useUser()` reads cleaner than `const user = useContext(UserCtx)` everywhere. Custom hooks layered over context are how design systems publish their tokens (useTheme, useColorMode). The hook is the API; the context is plumbing.",
          },
          {
            q: "Are there hooks you SHOULDN'T extract?",
            a: "Yes. Hooks with side effects whose CLEANUP semantics are non-obvious — useEffect with a complex async chain is often clearer at the call site than buried in a 'useFancyFetch'. Hooks that wrap a single hook call (useMemoFoo wrapping useMemo with one line of compute) — just inline. Premature extraction creates indirection without abstraction benefit.",
          },
        ]}
        pivots={[
          { to: "Rules of React (F11)", why: "Hooks order is one of the rules; expect to expand." },
          { to: "Testing custom hooks", why: "@testing-library/react's renderHook." },
          { to: "React Compiler × custom hooks", why: "Compiler treats custom hooks as opaque — architect may probe." },
        ]}
        dontSay={[
          {
            phrase: "Custom hooks are React's solution to mixins.",
            why: "Loose analogy; mixins are class-era inheritance hacks. Hooks are composition by function call. Architect may pivot to 'so why don't we use HOCs anymore?'",
          },
          {
            phrase: "Every reusable bit should be a hook.",
            why: "Many things are just functions — no React state needed. Architect wants to hear the threshold (state? effects? subscriptions?).",
          },
        ]}
      />

      <Step n={6} kind="next" title="All of this only works if your components obey the Rules of React.">
        <Callout tone="next" title="next foundation">
          Custom hooks rely on the Rules of React being followed. Foundation 11 names them all,
          and explains why the Compiler enforces them statically.
        </Callout>
      </Step>
    </Lesson>
  );
}

function WindowWidthDemo() {
  const width = useWindowWidth();
  return (
    <div className="not-prose mt-3 rounded-md border border-bg-border bg-bg-elevated p-3 font-mono text-xs">
      window width: <span className="text-accent">{width}px</span> · resize the browser to see
    </div>
  );
}
function useWindowWidth() {
  const [width, setWidth] = useState(typeof window === "undefined" ? 0 : window.innerWidth);
  useEffect(() => {
    const onResize = () => setWidth(window.innerWidth);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);
  return width;
}
