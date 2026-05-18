"use client";

import { useEffect, useRef, useState } from "react";
import clsx from "clsx";
import { Lesson } from "@/engine/Lesson";
import { Step } from "@/engine/Step";
import { Callout } from "@/engine/Callout";
import { TryIt } from "@/engine/TryIt";

export default function Module21() {
  return (
    <Lesson slug="21-accessibility">
      <Step n={1} kind="observe" title="Accessibility is the only correctness bug your test suite can't catch">
        <p>
          Lighthouse scores you ≥ 90. Your screen reader user gets stuck. The runtime checks
          axe / Lighthouse run are necessary; <em>none</em> of them validate real assistive-tech
          journeys. This is architectural, not a checklist.
        </p>
      </Step>

      <Step n={2} kind="profile" title="Tab through the dashboard — see your own focus path">
        <FocusPathDemo />
      </Step>

      <Step n={3} kind="explain" title="The accessibility tree — what AT actually sees">
        <p>
          The browser builds a parallel tree from your DOM, mapping each element to an{" "}
          <strong>accessibility object</strong> with role + name + state + value. Screen readers
          read this tree, not your CSS. A <code>&lt;div onClick&gt;</code> with great styling is
          an unlabelled generic element to NVDA / JAWS / VoiceOver.
        </p>
        <AccessibilityTree />
      </Step>

      <Step n={4} kind="fix" title="Five things to get right in production">
        <ol>
          <li>
            <strong>Semantic HTML first</strong>. <code>&lt;button&gt;</code>, <code>&lt;a&gt;</code>,{" "}
            <code>&lt;nav&gt;</code>, <code>&lt;label&gt;</code>. Use ARIA only when no semantic
            element exists — the first rule of ARIA is don&apos;t use ARIA.
          </li>
          <li>
            <strong>Visible focus ring</strong>. <code>:focus-visible</code> instead of removing
            outlines. Test by tab-navigating with no mouse.
          </li>
          <li>
            <strong>Labelled controls</strong>. Every input has a <code>&lt;label htmlFor&gt;</code>{" "}
            or <code>aria-label</code>. Icon-only buttons get <code>aria-label=&quot;Open
            menu&quot;</code>.
          </li>
          <li>
            <strong>Async state announced</strong>. Live regions (<code>aria-live=&quot;polite&quot;</code>){" "}
            or <code>role=&quot;status&quot;</code> for &quot;Saved&quot; / &quot;Loading&quot;.
            Don&apos;t spam <code>assertive</code>.
          </li>
          <li>
            <strong>Focus management on navigation</strong>. After a route change or modal open,
            move focus into the new content (the page heading or first interactive). Otherwise
            the screen reader keeps reading the old context.
          </li>
        </ol>
      </Step>

      <Step n={5} kind="fix" title="Modal focus trap — done correctly">
        <TryIt
          title="modal"
          knobs={[
            { key: "trap", label: "use focus trap + restore on close", default: false },
          ]}
          hint="Without the trap: tab keeps escaping behind the overlay. With the trap: focus loops inside the modal, and returns to the trigger on close."
        >
          {(flags) => <ModalDemo trap={flags.trap} />}
        </TryIt>
      </Step>

      <Step n={6} kind="explain" title="Hydration & async — the hidden a11y pitfalls">
        <ul>
          <li>
            <strong>Suspense fallback</strong> should set <code>aria-busy=&quot;true&quot;</code>{" "}
            on the boundary; assistive tech announces &quot;loading&quot;.
          </li>
          <li>
            <strong>Optimistic UI</strong> — announce the optimistic state via a live region so
            the user doesn&apos;t think nothing happened.
          </li>
          <li>
            <strong>Toasts</strong> — <code>role=&quot;status&quot;</code> (polite). For errors,{" "}
            <code>role=&quot;alert&quot;</code> (assertive). Don&apos;t make every toast assertive.
          </li>
          <li>
            <strong>Skeleton loaders</strong> visible but should be{" "}
            <code>aria-hidden=&quot;true&quot;</code> so AT doesn&apos;t read the placeholder
            geometry.
          </li>
        </ul>
      </Step>

      <Step n={7} kind="next" title="UX shipped to everyone. But how do you know it stays that way?">
        <Callout tone="next" title="next bottleneck">
          You can pass every audit on launch day and regress two sprints later. Observability —
          Module 22 — closes the loop with RUM + a11y monitoring in production.
        </Callout>
      </Step>
    </Lesson>
  );
}

/* ─────────── focus path demo ─────────── */

function FocusPathDemo() {
  const [path, setPath] = useState<string[]>([]);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const onFocus = (e: FocusEvent) => {
      const t = e.target as HTMLElement;
      const label = t.getAttribute("data-name") ?? t.tagName.toLowerCase();
      setPath((p) => [...p.slice(-7), label]);
    };
    root.addEventListener("focusin", onFocus);
    return () => root.removeEventListener("focusin", onFocus);
  }, []);

  return (
    <div className="not-prose mt-3 grid gap-3 md:grid-cols-2">
      <div ref={rootRef} className="rounded-lg border border-bg-border bg-bg-panel p-3">
        <p className="mb-2 font-mono text-[10px] uppercase tracking-widest text-ink-dim">
          tab through this mini-dashboard
        </p>
        <div className="space-y-2">
          <input
            data-name="search"
            placeholder="Search…"
            className="w-full rounded-md border border-bg-border bg-bg-elevated px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          />
          <div className="flex flex-wrap gap-2">
            <button data-name="btn:filter" className="rounded-md border border-bg-border bg-bg-elevated px-3 py-1.5 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent">
              Filter
            </button>
            <button data-name="btn:sort" className="rounded-md border border-bg-border bg-bg-elevated px-3 py-1.5 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent">
              Sort
            </button>
            <button data-name="btn:add" className="rounded-md bg-accent px-3 py-1.5 text-xs text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent">
              + Add
            </button>
          </div>
          <a data-name="link:settings" href="#" className="block text-sm text-accent underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent">
            Open settings
          </a>
        </div>
      </div>
      <div className="rounded-lg border border-bg-border bg-bg-panel p-3">
        <p className="mb-2 font-mono text-[10px] uppercase tracking-widest text-ink-dim">
          focus path · last 8
        </p>
        {path.length === 0 ? (
          <p className="font-mono text-[11px] text-ink-dim">tab into the panel on the left</p>
        ) : (
          <ol className="space-y-1 font-mono text-[11px]">
            {path.map((p, i) => (
              <li key={i} className={clsx("flex items-center gap-2", i === path.length - 1 ? "text-accent" : "text-ink-muted")}>
                <span className="w-5 text-ink-dim">{i + 1}.</span>
                {p}
              </li>
            ))}
          </ol>
        )}
      </div>
    </div>
  );
}

/* ─────────── accessibility tree mini-viewer ─────────── */

function AccessibilityTree() {
  return (
    <div className="not-prose mt-3 grid gap-3 md:grid-cols-2">
      <Side title="DOM tree" tone="info">
        <pre className="font-mono text-[11px] leading-relaxed text-ink-muted">{`<div onClick={open}>
  <div class="icon"/>
  Open menu
</div>

<button>
  <svg/>
</button>`}</pre>
      </Side>
      <Side title="What AT 'sees'" tone="warn">
        <pre className="font-mono text-[11px] leading-relaxed text-ink-muted">{`generic · "Open menu"
  (no role, not keyboard-focusable
   by default — AT can't actuate it)

button · "" ← unnamed!
  (icon-only; needs aria-label
   or visible text)`}</pre>
      </Side>
    </div>
  );
}
function Side({ title, tone, children }: { title: string; tone: "info" | "warn"; children: React.ReactNode }) {
  return (
    <div
      className={clsx(
        "rounded-lg border p-3",
        tone === "info" ? "border-accent-info/30 bg-accent-info/5" : "border-accent-warn/30 bg-accent-warn/5"
      )}
    >
      <p
        className={clsx(
          "mb-2 font-mono text-[10px] uppercase tracking-widest",
          tone === "info" ? "text-accent-info" : "text-accent-warn"
        )}
      >
        {title}
      </p>
      {children}
    </div>
  );
}

/* ─────────── modal focus-trap demo ─────────── */

function ModalDemo({ trap }: { trap: boolean }) {
  const [open, setOpen] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open || !trap) return;
    const dialog = dialogRef.current;
    if (!dialog) return;
    const focusables = dialog.querySelectorAll<HTMLElement>("button, a, input, [tabindex]");
    focusables[0]?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
      if (e.key !== "Tab") return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last?.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, trap]);

  useEffect(() => {
    if (!open && trap) triggerRef.current?.focus();
  }, [open, trap]);

  return (
    <div>
      <button
        ref={triggerRef}
        onClick={() => setOpen(true)}
        className="rounded-md bg-accent px-3 py-1.5 text-xs text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
      >
        Open modal
      </button>
      {open && (
        <div
          className="fixed inset-0 z-40 grid place-items-center bg-black/60 p-4"
          onClick={() => setOpen(false)}
        >
          <div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="dlg-title"
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-lg border border-bg-border bg-bg-panel p-4 shadow-glass"
          >
            <h3 id="dlg-title" className="text-base font-medium">
              Edit row
            </h3>
            <p className="mt-1 text-xs text-ink-muted">
              {trap
                ? "Focus is trapped here. Try tabbing — it loops. Press Esc or click outside to close."
                : "No trap. Try tabbing — focus escapes behind the overlay."}
            </p>
            <input
              defaultValue="hello"
              className="mt-3 w-full rounded-md border border-bg-border bg-bg-elevated px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            />
            <div className="mt-3 flex justify-end gap-2">
              <button
                onClick={() => setOpen(false)}
                className="rounded-md border border-bg-border bg-bg-elevated px-3 py-1.5 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              >
                Cancel
              </button>
              <button
                onClick={() => setOpen(false)}
                className="rounded-md bg-accent px-3 py-1.5 text-xs text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
