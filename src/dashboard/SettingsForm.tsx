"use client";

import { useState } from "react";
import clsx from "clsx";
import { useRenderCount } from "@/profiler/useRenderCount";

/**
 * Dynamic form panel. Used to demonstrate:
 *  - controlled vs uncontrolled inputs
 *  - validation (server-side via Actions in Module 13)
 *  - field-level memo (Module 11)
 *
 * The `optimisticSave` flag toggles instant-feedback save UX (Module 13 fix).
 */
export function SettingsForm({ optimisticSave = false }: { optimisticSave?: boolean }) {
  useRenderCount("SettingsForm");
  const [name, setName] = useState("Mithun");
  const [theme, setTheme] = useState<"dark" | "auto">("dark");
  const [tickMs, setTickMs] = useState(800);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  const save = () => {
    setSaving(true);
    if (optimisticSave) {
      setSavedAt(Date.now());
    }
    setTimeout(() => {
      setSaving(false);
      if (!optimisticSave) setSavedAt(Date.now());
    }, 700);
  };

  return (
    <div className="overflow-hidden rounded-lg border border-bg-border bg-bg-panel">
      <header className="flex items-center justify-between border-b border-bg-border px-3 py-2 text-xs">
        <span className="font-mono uppercase tracking-widest text-ink-dim">settings</span>
        <span className="font-mono text-ink-dim">{optimisticSave ? "optimistic save" : "round-trip save"}</span>
      </header>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          save();
        }}
        className="space-y-2 p-3 text-xs"
      >
        <Field label="display name">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-md border border-bg-border bg-bg-elevated px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-accent/40"
          />
        </Field>
        <Field label="theme">
          <div className="flex gap-1">
            {(["dark", "auto"] as const).map((t) => (
              <button
                type="button"
                key={t}
                onClick={() => setTheme(t)}
                className={clsx(
                  "rounded-md px-2 py-1 font-mono text-[10px] uppercase tracking-widest",
                  theme === t ? "bg-accent text-white" : "border border-bg-border text-ink-muted"
                )}
              >
                {t}
              </button>
            ))}
          </div>
        </Field>
        <Field label={`tick rate · ${tickMs}ms`}>
          <input
            type="range"
            min={200}
            max={2000}
            step={100}
            value={tickMs}
            onChange={(e) => setTickMs(+e.target.value)}
            className="w-full accent-accent"
          />
        </Field>
        <div className="flex items-center justify-between pt-1">
          <span className="font-mono text-[10px] text-ink-dim">
            {savedAt && `saved ${Math.max(0, Math.floor((Date.now() - savedAt) / 1000))}s ago`}
          </span>
          <button
            type="submit"
            disabled={saving}
            className="rounded-md bg-accent px-3 py-1.5 font-mono text-[11px] text-white disabled:opacity-50"
          >
            {saving ? "saving…" : "save"}
          </button>
        </div>
      </form>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block font-mono text-[10px] uppercase tracking-widest text-ink-dim">{label}</span>
      {children}
    </label>
  );
}
