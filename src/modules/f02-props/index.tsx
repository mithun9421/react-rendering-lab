"use client";

import { useState } from "react";
import { Lesson } from "@/engine/Lesson";
import { Step } from "@/engine/Step";
import { Callout } from "@/engine/Callout";
import { Quiz } from "@/engine/Quiz";

export default function F02Props() {
  return (
    <Lesson slug="f02-props">
      <Step n={1} kind="observe" title="Props are how parents talk to children">
        <p>
          A component without props is a constant — it renders the same output every time. Props
          make it parametric. They flow strictly downward; a child can&apos;t change them.
        </p>
        <pre className="not-prose overflow-x-auto rounded-md border border-bg-border bg-bg-elevated p-3 font-mono text-[11px] leading-relaxed">
{`function Card({ title, body, tone }) {
  return (
    <article className={tone}>
      <h3>{title}</h3>
      <p>{body}</p>
    </article>
  );
}

<Card title="Hello" body="World" tone="info"/>`}
        </pre>
      </Step>

      <Step n={2} kind="explain" title="Destructuring is convention, not magic">
        <p>
          You&apos;ll see both styles in real codebases:
        </p>
        <div className="not-prose mt-3 grid gap-3 md:grid-cols-2">
          <div className="rounded-lg border border-bg-border bg-bg-panel p-3">
            <p className="mb-2 font-mono text-[10px] uppercase tracking-widest text-ink-dim">
              destructured (the common form)
            </p>
            <pre className="overflow-x-auto font-mono text-[11px] leading-relaxed text-ink-muted">
{`function Card({ title, body }) {
  return <article>{title} — {body}</article>;
}`}
            </pre>
          </div>
          <div className="rounded-lg border border-bg-border bg-bg-panel p-3">
            <p className="mb-2 font-mono text-[10px] uppercase tracking-widest text-ink-dim">
              full props
            </p>
            <pre className="overflow-x-auto font-mono text-[11px] leading-relaxed text-ink-muted">
{`function Card(props) {
  return (
    <article>{props.title} — {props.body}</article>
  );
}`}
            </pre>
          </div>
        </div>
        <p className="mt-3">
          Both compile to the same thing. Destructuring is purely ergonomic. Defaults work
          naturally: <code>function Card(&#123; tone = &quot;info&quot; &#125;)</code>.
        </p>
      </Step>

      <Step n={3} kind="explain" title="`children` is just another prop">
        <p>
          Anything between the opening and closing tags of a JSX element becomes the{" "}
          <code>children</code> prop. You can render it anywhere — wrap it, pass it through,
          filter it.
        </p>
        <pre className="not-prose mt-3 overflow-x-auto rounded-md border border-bg-border bg-bg-elevated p-3 font-mono text-[11px] leading-relaxed">
{`function Section({ title, children }) {
  return (
    <section>
      <h2>{title}</h2>
      <div className="body">{children}</div>
    </section>
  );
}

<Section title="Settings">
  <p>your stuff here</p>
  <button>save</button>
</Section>`}
        </pre>
        <p className="mt-3">
          This is the most important pattern in React: <strong>composition</strong>. Instead of
          configuring components with twenty props, accept <code>children</code> and let the
          caller provide content.
        </p>
      </Step>

      <Quiz
        id="f02:children"
        prompt="A `<Card>` component accepts a `body: string` prop. Designers want to render rich content inside (a paragraph and a button). What's the cleanest API change?"
        options={[
          {
            id: "a",
            text: "Add a `customBody?: ReactNode` prop alongside `body`.",
            rationale:
              "Two props for the same slot creates ambiguity — which wins? Composition via `children` is cleaner.",
          },
          {
            id: "b",
            text: "Replace `body: string` with `children: ReactNode`. The caller renders whatever they want.",
            correct: true,
            rationale:
              "Composition over configuration. The component owns layout (the container, the spacing); the caller owns content. This scales.",
          },
          {
            id: "c",
            text: "Pass an HTML string to body and use dangerouslySetInnerHTML.",
            rationale:
              "Opens XSS, loses React's reconciliation, breaks for user-provided components. The composition answer is right here.",
          },
          {
            id: "d",
            text: "Keep `body: string` and tell designers to inline HTML.",
            rationale: "Same XSS and reconciliation problems.",
          },
        ]}
      />

      <Step n={4} kind="explain" title="Spread props — useful and dangerous">
        <p>
          You can forward all props down with the spread operator. It&apos;s useful when
          building wrappers around primitives:
        </p>
        <pre className="not-prose mt-3 overflow-x-auto rounded-md border border-bg-border bg-bg-elevated p-3 font-mono text-[11px] leading-relaxed">
{`function PrimaryButton({ children, ...rest }) {
  // rest carries onClick, disabled, aria-*, type, etc.
  return (
    <button className="btn-primary" {...rest}>
      {children}
    </button>
  );
}

// Used like:
<PrimaryButton onClick={...} disabled aria-label="Save">
  Save
</PrimaryButton>`}
        </pre>
        <p className="mt-3 text-ink-muted">
          The danger: spread forwards every prop, including ones you don&apos;t expect. If the
          caller passes <code>style</code>, it lands on the &lt;button&gt;. That might be fine
          or might conflict. Be deliberate.
        </p>
      </Step>

      <Step n={5} kind="fix" title="Pass functions to talk back">
        <p>
          Props flow down. To send information back up, accept a callback prop:
        </p>
        <CallbackDemo />
        <pre className="not-prose mt-3 overflow-x-auto rounded-md border border-bg-border bg-bg-elevated p-3 font-mono text-[11px] leading-relaxed">
{`function Counter({ value, onIncrement }) {
  return (
    <button onClick={onIncrement}>+1 ({value})</button>
  );
}

function Parent() {
  const [n, setN] = useState(0);
  return <Counter value={n} onIncrement={() => setN(n + 1)}/>;
}`}
        </pre>
        <p className="mt-3">
          The state lives in <code>Parent</code>; <code>Counter</code> renders the value and
          fires the callback. This is what people mean by &quot;controlled component.&quot;
        </p>
      </Step>

      <Step n={6} kind="explain" title="Anti-patterns">
        <ul>
          <li>
            <strong>Mutating props.</strong> <code>props.foo = &quot;bar&quot;</code> is allowed by
            JavaScript but breaks React&apos;s purity contract. The next render produces a
            different output for the same input. Don&apos;t do it.
          </li>
          <li>
            <strong>Passing functions inline through twenty components.</strong> Every render
            creates a new function identity, which busts memo on every component in the chain.
            Use composition (children) or context to flatten the path.
          </li>
          <li>
            <strong>Spreading without thinking.</strong> <code>&lt;div &#123;...props&#125;/&gt;</code>{" "}
            forwards everything, including <code>onClick</code> if the parent accidentally
            attached one. Destructure what you mean to forward, or use TypeScript&apos;s{" "}
            <code>Pick&lt;...&gt;</code> to narrow.
          </li>
          <li>
            <strong>Boolean props as &quot;variants&quot;.</strong>{" "}
            <code>&lt;Button primary danger small/&gt;</code> ends up combining illegally
            (primary AND danger?). Prefer one <code>variant=&quot;primary&quot;|&quot;danger&quot;</code>{" "}
            prop.
          </li>
        </ul>
      </Step>

      <Quiz
        id="f02:mutation"
        prompt="A teammate writes `props.items.push(newItem)` inside a component. Why is this a bug?"
        options={[
          {
            id: "a",
            text: "JavaScript doesn't allow array mutation.",
            rationale: "It allows it just fine. The bug is at the React layer.",
          },
          {
            id: "b",
            text: "It mutates an object owned by the parent, breaks React's purity contract, and the parent's state won't reflect the change.",
            correct: true,
            rationale:
              "Two problems: render is supposed to be pure; and the parent's state is unchanged because you mutated the existing array reference, not produced a new one. The parent's setState wasn't called.",
          },
          {
            id: "c",
            text: "Array methods like push don't work in React.",
            rationale: "They work; React just expects you to call setState with a new array.",
          },
          {
            id: "d",
            text: "Use Object.freeze on props.",
            rationale: "React doesn't freeze; it relies on the contract. Freezing in dev catches violations but isn't the fix.",
          },
        ]}
      />

      <Step n={7} kind="next" title="Props are inputs from the outside. State is owned within.">
        <Callout tone="next" title="next foundation">
          Components with props are still mostly static — they re-render only when the parent
          gives them new props. Some state lives <em>inside</em> a component and changes in
          response to user action. That&apos;s <code>useState</code>. Foundation 03.
        </Callout>
      </Step>
    </Lesson>
  );
}

function CallbackDemo() {
  const [n, setN] = useState(0);
  return (
    <div className="not-prose mt-3 rounded-md border border-bg-border bg-bg-elevated p-3">
      <Counter value={n} onIncrement={() => setN((c) => c + 1)} />
      <p className="mt-2 font-mono text-[10px] text-ink-dim">
        parent owns state; child receives value + callback
      </p>
    </div>
  );
}
function Counter({ value, onIncrement }: { value: number; onIncrement: () => void }) {
  return (
    <button
      onClick={onIncrement}
      className="rounded-md bg-accent px-3 py-1.5 font-mono text-[11px] text-white"
    >
      +1 ({value})
    </button>
  );
}
