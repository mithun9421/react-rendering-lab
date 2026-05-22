"use client";

import { useState } from "react";
import { useRenderCount } from "@/profiler/useRenderCount";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

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
    <Card className="overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 border-b border-bg-border px-3 py-2">
        <CardTitle className="font-mono text-xs uppercase tracking-widest text-ink-dim">settings</CardTitle>
        <Badge variant="outline" className="font-mono text-[10px] text-ink-dim">
          {optimisticSave ? "optimistic save" : "round-trip save"}
        </Badge>
      </CardHeader>
      <CardContent className="p-3">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            save();
          }}
          className="space-y-2 text-xs"
        >
          <Field label="display name">
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-8"
            />
          </Field>
          <Field label="theme">
            <div className="flex gap-1">
              {(["dark", "auto"] as const).map((t) => (
                <Button
                  type="button"
                  key={t}
                  size="sm"
                  variant={theme === t ? "default" : "outline"}
                  onClick={() => setTheme(t)}
                  className="h-7 font-mono text-[10px] uppercase tracking-widest"
                >
                  {t}
                </Button>
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
            <Button type="submit" disabled={saving} size="sm" className="h-7 font-mono text-[11px]">
              {saving ? "saving…" : "save"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
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
