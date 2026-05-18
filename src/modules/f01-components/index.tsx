"use client";

import { useState } from "react";
import { Lesson } from "@/engine/Lesson";
import { Step } from "@/engine/Step";
import { Callout } from "@/engine/Callout";
import { TryIt } from "@/engine/TryIt";

export default function F01Components() {
  return (
    <Lesson slug="f01-components">
      <Step n={1} kind="observe" title="A component is just a function that returns JSX">
        <p>
          React components are functions. They take <strong>props</strong> as input and return
          <strong> elements</strong> as output. There&apos;s no class machinery, no &quot;React
          object,&quot; no hidden lifecycle. Just functions.
        </p>
        <pre className="not-prose overflow-x-auto rounded-md border border-bg-border bg-bg-elevated p-3 font-mono text-[11px] leading-relaxed">
{`function Greeting({ name }) {
  return <h1>Hello, {name}!</h1>;
}

// Used like:
<Greeting name="Mithun" />`}
        </pre>
      </Step>

      <Step n={2} kind="explain" title="JSX is sugar for React.createElement">
        <p>
          JSX isn&apos;t a separate language — it&apos;s a syntax that the compiler (Babel, SWC,
          esbuild) transforms into plain function calls. Everything you can do with JSX you can
          do with <code>React.createElement</code>; JSX just reads better.
        </p>
        <div className="not-prose mt-3 grid gap-3 md:grid-cols-2">
          <div className="rounded-lg border border-bg-border bg-bg-panel p-3">
            <p className="mb-2 font-mono text-[10px] uppercase tracking-widest text-ink-dim">
              JSX (what you write)
            </p>
            <pre className="overflow-x-auto font-mono text-[11px] leading-relaxed text-ink-muted">
{`<div className="card">
  <h2>{title}</h2>
  <p>{desc}</p>
</div>`}
            </pre>
          </div>
          <div className="rounded-lg border border-bg-border bg-bg-panel p-3">
            <p className="mb-2 font-mono text-[10px] uppercase tracking-widest text-ink-dim">
              compiled output (what runs)
            </p>
            <pre className="overflow-x-auto font-mono text-[11px] leading-relaxed text-ink-muted">
{`React.createElement(
  "div",
  { className: "card" },
  React.createElement("h2", null, title),
  React.createElement("p", null, desc)
)`}
            </pre>
          </div>
        </div>
        <p className="mt-3">
          The output is a plain JS object describing what to render. React then asks the
          renderer (DOM, Native, Canvas) to materialise it. The same <code>&lt;App/&gt;</code>{" "}
          element can be sent to any renderer — that&apos;s how React Native works.
        </p>
      </Step>

      <Step n={3} kind="explain" title="A component vs a component instance vs an element">
        <p>Three things that look similar but aren&apos;t:</p>
        <ul>
          <li>
            <strong>Component</strong> — the function itself. <code>Greeting</code> is a
            component. You import it, you reference it.
          </li>
          <li>
            <strong>Element</strong> — what JSX produces. <code>&lt;Greeting name=&quot;X&quot;/&gt;</code>{" "}
            is an element — a plain object <code>&#123; type: Greeting, props: &#123; name: &quot;X&quot; &#125; &#125;</code>.
            Cheap to create; it&apos;s just an object.
          </li>
          <li>
            <strong>Instance</strong> (kind of) — the rendered output the reconciler tracks
            internally. You don&apos;t hold a reference to one. React 19 doesn&apos;t expose them;
            class components had imperative instance access, function components don&apos;t.
          </li>
        </ul>
        <p>
          The takeaway: <em>creating</em> an element is essentially free. React is fine with
          you describing a deeply nested tree on every render; what costs is the reconciler
          turning that tree into DOM. Module 1 covers that.
        </p>
      </Step>

      <Step n={4} kind="fix" title="Capitalisation is how React tells components apart from DOM">
        <p>
          React uses the first letter to decide what an element means:
        </p>
        <ul>
          <li>
            <code>&lt;div/&gt;</code> — lowercase. Treated as an HTML tag, passed to the DOM
            renderer.
          </li>
          <li>
            <code>&lt;Card/&gt;</code> — uppercase. Treated as a reference to a component
            function in scope.
          </li>
        </ul>
        <pre className="not-prose mt-3 overflow-x-auto rounded-md border border-bg-border bg-bg-elevated p-3 font-mono text-[10px] leading-relaxed">
{`// BUG — React thinks 'card' is an HTML element you invented.
function Page() {
  const card = () => <div>...</div>;   // lowercase!
  return <card/>;                       // renders <card/> in the DOM
}

// FIX — uppercase the variable.
function Page() {
  const Card = () => <div>...</div>;
  return <Card/>;                       // renders the function's output
}`}
        </pre>
      </Step>

      <Step n={5} kind="fix" title="Fragments — when a wrapping <div> would lie">
        <p>
          A component must return one element. When the natural answer is a list of siblings,
          use a <strong>Fragment</strong> — a wrapper that doesn&apos;t emit any DOM.
        </p>
        <div className="not-prose mt-3 grid gap-3 md:grid-cols-2">
          <div className="rounded-lg border border-bg-border bg-bg-panel p-3">
            <p className="mb-2 font-mono text-[10px] uppercase tracking-widest text-ink-dim">
              explicit Fragment
            </p>
            <pre className="overflow-x-auto font-mono text-[11px] leading-relaxed text-ink-muted">
{`import { Fragment } from "react";

function Row() {
  return (
    <Fragment>
      <td>name</td>
      <td>price</td>
    </Fragment>
  );
}`}
            </pre>
          </div>
          <div className="rounded-lg border border-bg-border bg-bg-panel p-3">
            <p className="mb-2 font-mono text-[10px] uppercase tracking-widest text-ink-dim">
              shorthand
            </p>
            <pre className="overflow-x-auto font-mono text-[11px] leading-relaxed text-ink-muted">
{`function Row() {
  return (
    <>
      <td>name</td>
      <td>price</td>
    </>
  );
}`}
            </pre>
          </div>
        </div>
        <p className="mt-3">
          Use the explicit <code>&lt;Fragment&gt;</code> form when you need to pass a{" "}
          <code>key</code> (the shorthand <code>&lt;&gt;</code> can&apos;t take props).
        </p>
      </Step>

      <Step n={6} kind="profile" title="Try it — define a component, render it">
        <TryIt
          title="component sandbox"
          knobs={[
            { key: "withFragment", label: "use a Fragment instead of <div>", default: false },
          ]}
          hint="Toggle to see how the wrapping element changes. The output looks identical because Fragment doesn't emit anything to the DOM."
        >
          {(flags) => <Sandbox withFragment={flags.withFragment} />}
        </TryIt>
      </Step>

      <Step n={7} kind="explain" title="Anti-patterns that bite immediately">
        <ul>
          <li>
            <strong>Lowercase component names</strong> — <code>function card()</code> renders an
            HTML tag called <code>card</code>, not your component. React doesn&apos;t warn loudly;
            you just see nothing.
          </li>
          <li>
            <strong>Defining a component inside another component&apos;s render</strong> — every
            outer render creates a new function reference. React sees a new component type each
            time and tears down the subtree, destroying state. <em>Never</em> nest function
            declarations like this; move them out.
          </li>
          <li>
            <strong>Returning multiple roots without a wrapper</strong> — a syntax error in JSX.
            Wrap in a Fragment.
          </li>
          <li>
            <strong>Returning bare strings or numbers</strong> — legal! <code>return
            &quot;hi&quot;</code> renders the text. Sometimes useful.
          </li>
        </ul>
      </Step>

      <Step n={8} kind="next" title="Components alone are static. They need inputs.">
        <Callout tone="next" title="next foundation">
          Components without props are constants. <strong>Props</strong> turn them into
          parameters — and reveal the most important React pattern, composition. Foundation 02.
        </Callout>
      </Step>
    </Lesson>
  );
}

function Sandbox({ withFragment }: { withFragment: boolean }) {
  const [count, setCount] = useState(0);
  const inner = (
    <>
      <span className="font-mono text-xs text-ink">count: {count}</span>
      <button
        onClick={() => setCount((c) => c + 1)}
        className="ml-3 rounded-md bg-accent px-2.5 py-1 font-mono text-[11px] text-white"
      >
        +1
      </button>
    </>
  );
  return (
    <div className="not-prose rounded-md border border-bg-border bg-bg-elevated p-3">
      {withFragment ? <>{inner}</> : <div className="flex items-center">{inner}</div>}
      <p className="mt-3 font-mono text-[10px] text-ink-dim">
        wrapper type:{" "}
        <span className="text-ink">{withFragment ? "<Fragment/>" : "<div/>"}</span>{" "}
        · same visual output, different DOM
      </p>
    </div>
  );
}
