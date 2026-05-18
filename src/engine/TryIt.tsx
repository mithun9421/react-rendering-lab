"use client";

import { useState } from "react";

/**
 * Sandbox card with a row of toggleable knobs and a live render slot.
 * Each knob is `{key, label, default}` and exposed via the render prop as a `flags` map.
 */
export function TryIt<K extends string>({
  title,
  knobs,
  children,
  hint,
}: {
  title: string;
  knobs: ReadonlyArray<{ key: K; label: string; default?: boolean; hint?: string }>;
  children: (flags: Record<K, boolean>) => React.ReactNode;
  hint?: string;
}) {
  const [flags, setFlags] = useState<Record<K, boolean>>(
    () => Object.fromEntries(knobs.map((k) => [k.key, k.default ?? false])) as Record<K, boolean>
  );

  return (
    <div className="overflow-hidden rounded-xl border border-bg-border bg-bg-panel">
      <div className="flex flex-col gap-2 border-b border-bg-border bg-bg-subtle px-3 py-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-2">
          <span className="font-mono text-[10px] uppercase tracking-widest text-ink-dim">try it</span>
          <span className="truncate font-mono text-xs">{title}</span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {knobs.map((k) => (
            <label
              key={k.key}
              title={k.hint}
              className="flex cursor-pointer items-center gap-2 rounded-md bg-bg-elevated px-2 py-1 text-[11px]"
            >
              <input
                type="checkbox"
                checked={flags[k.key]}
                onChange={(e) => setFlags((f) => ({ ...f, [k.key]: e.target.checked }))}
                className="accent-accent"
              />
              <span className="font-mono text-ink-muted">{k.label}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="p-4">{children(flags)}</div>

      {hint && (
        <div className="border-t border-bg-border bg-bg-subtle px-4 py-2 font-mono text-[11px] text-ink-dim">{hint}</div>
      )}
    </div>
  );
}
