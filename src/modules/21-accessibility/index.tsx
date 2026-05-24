"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { Lesson } from "@/engine/Lesson";
import { Step } from "@/engine/Step";
import { Callout } from "@/engine/Callout";
import { ArchitectNotes } from "@/engine/ArchitectNotes";
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

      <ArchitectNotes
        framing="A11y questions probe whether you treat accessibility as architecture vs lint-rule compliance. Senior interviewers test for the AOM mental model and the focus-management patterns."
        followUps={[
          {
            q: "What's the difference between the DOM and the Accessibility Object Model (AOM)?",
            a: "DOM is what JS manipulates. AOM is what assistive tech (screen readers, switch devices, voice control) READS — a parallel tree built by the browser from your DOM + ARIA + semantic tags. Each node has role + name + state + value. A `<div onClick>` has DOM presence but NO accessibility node (no role) — invisible to AT. A `<button>` has role='button', name='Save', state='enabled' — fully described. The architect tests if you can name three things AOM exposes that DOM doesn't (roles, names, states).",
          },
          {
            q: "Focus management when a modal opens — walk me through the contract.",
            a: "(1) Remember the trigger element so focus can return on close. (2) Move focus into the dialog (usually the first interactive or the dialog itself). (3) Trap focus inside the dialog: tab from last → first, shift-tab from first → last, intercept escape. (4) Apply `inert` to the rest of the page so AT doesn't traverse into hidden content. (5) On close, restore focus to the trigger. Skip any of these and a keyboard user is stranded — either focus escapes behind the overlay, or it returns to the wrong place. The architect may ask: 'how does React 19's inert prop affect this?' Answer: React supports the `inert` boolean prop natively now; you mark the rest-of-page tree with `<div inert>` to apply AT exclusion.",
          },
          {
            q: "How do you announce async state to screen readers?",
            a: "Live regions. `aria-live='polite'` for non-urgent updates ('Saved', 'Loading complete'). `aria-live='assertive'` (or `role='alert'`) for urgent ('Error', 'Time expiring'). The region must EXIST before the content changes — AT watches it for mutations. Common bug: people create the live region with the content already in it, then update it — AT doesn't announce because there was no MUTATION. The architect tests: 'what's wrong with assertive toasts?' Answer: assertive interrupts current speech; for non-critical toasts (success), use polite or no announcement.",
          },
          {
            q: "Virtualised lists are widely-known a11y disasters. How do you fix one?",
            a: "Three properties on the scroller. (1) `role='grid'` or `role='list'`. (2) `aria-rowcount={total}` — the FULL count, not the rendered count. (3) Per row: `aria-rowindex={position + 1}` (1-indexed in WAI-ARIA). Now AT announces 'item 50 of 10,000' correctly. The next problem: screen readers walk DOM, can't reach off-window rows. The fix is a complement, not a workaround — provide in-app search/filter UI. Cmd+F users miss content; in-app filter doesn't.",
          },
          {
            q: "How do you test for keyboard accessibility — what's your workflow?",
            a: "(1) Unplug the mouse. Navigate the page with Tab, Shift+Tab, Enter, Space, Esc, Arrow keys. (2) Verify visible focus indicator on every interactive element (focus-visible CSS). (3) Confirm focus order is left-to-right, top-to-bottom — `tabindex` should be 0 or unset, not positive. (4) Confirm focus traps on modals (described above). (5) Confirm escape closes overlays. The architect may probe: 'how do you automate this?' Answer: axe-core + @testing-library/react + jest-dom — interaction tests assert focus moves correctly.",
          },
        ]}
        pivots={[
          { to: "Portals + focus restoration", why: "Modals are the canonical focus-management example." },
          { to: "Virtualisation a11y (Module 10)", why: "Aria-rowindex pattern." },
          { to: "Form labels + error messages", why: "Common follow-up for forms-heavy products." },
        ]}
        dontSay={[
          {
            phrase: "Lighthouse a11y score is 100, so we're good.",
            why: "Lighthouse catches mechanical issues (missing alt, contrast). Real a11y bugs (focus traps, keyboard nav, screen-reader UX) require manual testing. The architect tests if you've ever USED a screen reader.",
          },
          {
            phrase: "Just add ARIA roles.",
            why: "The first rule of ARIA is don't use ARIA — use semantic HTML. ARIA fills gaps where semantic markup can't (custom widgets); using it as a substitute is wrong.",
          },
        ]}
      />

      <Step n={7} kind="profile" title="Screen-reader transcript — what the user actually hears">
        <ScreenReaderTranscript />
        <p className="mt-3 text-xs leading-relaxed text-ink-muted">
          Click each control. The transcript shows what a screen reader would announce —
          accessible name, role, state, value. Notice how an unlabelled icon button is just
          &quot;button&quot;; how a disabled control announces its state; how aria-live regions
          interrupt the user. The right text in the right role is what makes a UI usable
          eyes-free.
        </p>
      </Step>

      <Step n={8} kind="next" title="UX shipped to everyone. But how do you know it stays that way?">
        <Callout tone="next" title="next bottleneck">
          You can pass every audit on launch day and regress two sprints later. Observability —
          Module 22 — closes the loop with RUM + a11y monitoring in production.
        </Callout>
      </Step>
    </Lesson>
  );
}

/* ─────────── screen-reader transcript ─────────── */

type SrEntry = { id: number; text: string; tone: "ok" | "warn" | "bad" };

/** What a screen reader would announce for each control type. */
function announceFor(kind: string, state?: string): { text: string; tone: SrEntry["tone"] } {
  switch (kind) {
    case "labelled-btn":
      return { text: "Save changes, button", tone: "ok" };
    case "icon-btn":
      return { text: "button", tone: "bad" };
    case "icon-btn-labelled":
      return { text: "Close, button", tone: "ok" };
    case "disabled-btn":
      return { text: "Submit, button, dimmed", tone: "warn" };
    case "link":
      return { text: "Documentation, link, visited", tone: "ok" };
    case "checkbox-on":
      return { text: "Remember me, checkbox, checked", tone: "ok" };
    case "checkbox-off":
      return { text: "Remember me, checkbox, not checked", tone: "ok" };
    case "live":
      return { text: state ?? "Region update", tone: "ok" };
    case "form":
      return { text: "Email, required, edit text, blank", tone: "ok" };
    default:
      return { text: "(no accessible name)", tone: "bad" };
  }
}

function ScreenReaderTranscript() {
  const [log, setLog] = useState<SrEntry[]>([]);
  const [checked, setChecked] = useState(false);
  const [tick, setTick] = useState(0);

  const announce = (kind: string, state?: string) => {
    const { text, tone } = announceFor(kind, state);
    setLog((l) => [...l.slice(-7), { id: Date.now() + Math.random(), text, tone }]);
  };

  return (
    <div className="grid gap-3 lg:grid-cols-[1.1fr_1fr]">
      {/* Interactive surface */}
      <div className="space-y-3 rounded-xl border border-bg-border bg-bg-panel p-4">
        <div className="font-mono text-[10px] uppercase tracking-widest text-ink-dim">
          tap a control
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => announce("labelled-btn")}
            className="rounded-md border border-bg-border bg-bg-elevated px-3 py-1.5 text-xs text-ink hover:border-accent/40"
          >
            Save changes
          </button>
          <button
            onClick={() => announce("icon-btn")}
            aria-label=""
            className="grid size-8 place-items-center rounded-md border border-accent-bad/30 bg-bg-elevated text-ink hover:bg-bg-subtle"
            title="Icon-only — no aria-label (bad)"
          >
            ✕
          </button>
          <button
            onClick={() => announce("icon-btn-labelled")}
            aria-label="Close"
            className="grid size-8 place-items-center rounded-md border border-accent-good/30 bg-bg-elevated text-ink hover:bg-bg-subtle"
            title="Same icon — with aria-label (good)"
          >
            ✕
          </button>
          <button
            onClick={() => announce("disabled-btn")}
            disabled
            className="rounded-md border border-bg-border bg-bg-elevated px-3 py-1.5 text-xs text-ink-dim opacity-60"
          >
            Submit
          </button>
          <button
            onClick={() => announce("link")}
            className="rounded-md border border-bg-border bg-bg-elevated px-3 py-1.5 text-xs text-accent-info underline hover:bg-bg-subtle"
          >
            Documentation
          </button>
          <label className="flex items-center gap-2 rounded-md border border-bg-border bg-bg-elevated px-3 py-1.5 text-xs text-ink">
            <input
              type="checkbox"
              checked={checked}
              onChange={(e) => {
                setChecked(e.target.checked);
                announce(e.target.checked ? "checkbox-on" : "checkbox-off");
              }}
            />
            Remember me
          </label>
          <input
            type="email"
            placeholder="Email"
            required
            onFocus={() => announce("form")}
            className="rounded-md border border-bg-border bg-bg-elevated px-3 py-1.5 text-xs text-ink placeholder:text-ink-dim"
          />
          <button
            onClick={() => {
              setTick((t) => t + 1);
              announce("live", `Saved · ${tick + 1}`);
            }}
            className="rounded-md border border-accent-info/30 bg-accent-info/10 px-3 py-1.5 text-xs text-accent-info hover:bg-accent-info/15"
          >
            Trigger aria-live
          </button>
        </div>
        <div className="border-t border-bg-border pt-2 font-mono text-[10px] text-ink-dim">
          red border = icon-only, no label (announced just as &quot;button&quot;) · green border = same icon with aria-label
        </div>
      </div>

      {/* Transcript */}
      <div className="rounded-xl border border-bg-border bg-bg-panel">
        <div className="flex items-center justify-between border-b border-bg-border px-3 py-2 font-mono text-[10px] uppercase tracking-widest text-ink-dim">
          <span>screen reader transcript</span>
          {log.length > 0 && (
            <button
              onClick={() => setLog([])}
              className="text-ink-muted hover:text-accent-bad"
            >
              clear
            </button>
          )}
        </div>
        <div className="max-h-[260px] space-y-1 overflow-y-auto p-3 font-mono text-[11px]">
          {log.length === 0 ? (
            <div className="text-ink-dim">tap a control to see the announcement…</div>
          ) : (
            log.map((e) => (
              <div
                key={e.id}
                className={cn(
                  "rounded-md border px-2 py-1.5",
                  e.tone === "ok" && "border-accent-good/30 bg-accent-good/5 text-ink",
                  e.tone === "warn" && "border-accent-warn/30 bg-accent-warn/5 text-ink",
                  e.tone === "bad" && "border-accent-bad/30 bg-accent-bad/5 text-accent-bad",
                )}
              >
                <span className="text-ink-dim">▸ </span>
                {e.text}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
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
              <li key={i} className={cn("flex items-center gap-2", i === path.length - 1 ? "text-accent" : "text-ink-muted")}>
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
      className={cn(
        "rounded-lg border p-3",
        tone === "info" ? "border-accent-info/30 bg-accent-info/5" : "border-accent-warn/30 bg-accent-warn/5"
      )}
    >
      <p
        className={cn(
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
