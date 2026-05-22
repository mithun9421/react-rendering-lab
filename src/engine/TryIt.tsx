"use client";

import { useId, useState } from "react";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";

/**
 * Sandbox card with a row of toggleable knobs and a live render slot.
 * Each knob is `{key, label, default}` and exposed via the render prop as a `flags` map.
 *
 * Visually a shadcn `Card`:
 *   header: title + "try it" badge + knob switches
 *   content: render-prop output
 *   footer (optional): muted hint string
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
  const groupId = useId();

  return (
    <Card className="overflow-hidden">
      <CardHeader className="gap-3 border-b border-bg-border bg-bg-subtle p-3 sm:p-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-2">
            <Badge variant="secondary" className="font-mono uppercase tracking-widest text-[10px]">
              try it
            </Badge>
            <span className="truncate font-mono text-xs">{title}</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {knobs.map((k) => {
              const id = `${groupId}-${k.key}`;
              return (
                <label
                  key={k.key}
                  htmlFor={id}
                  title={k.hint}
                  className="flex cursor-pointer items-center gap-2 rounded-md bg-bg-elevated px-2 py-1 text-[11px]"
                >
                  <Switch
                    id={id}
                    checked={flags[k.key]}
                    onCheckedChange={(checked) =>
                      setFlags((f) => ({ ...f, [k.key]: checked }))
                    }
                  />
                  <span className="font-mono text-ink-muted">{k.label}</span>
                </label>
              );
            })}
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-4 pt-4">{children(flags)}</CardContent>

      {hint && (
        <CardFooter className="border-t border-bg-border bg-bg-subtle px-4 py-2 font-mono text-[11px] text-ink-dim">
          {hint}
        </CardFooter>
      )}
    </Card>
  );
}
