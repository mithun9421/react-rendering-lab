"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRenderCount } from "@/profiler/useRenderCount";
import { rng, pick } from "@/lib/rng";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type Notification = {
  id: string;
  t: number;
  level: "info" | "warn" | "alert";
  text: string;
};

const TEMPLATES = [
  { level: "info" as const, text: "Deploy v3.4.1 succeeded" },
  { level: "info" as const, text: "Quarterly report ready" },
  { level: "warn" as const, text: "API p95 above 800ms" },
  { level: "warn" as const, text: "Cache hit rate dropping" },
  { level: "alert" as const, text: "5xx spike on /api/orders" },
  { level: "alert" as const, text: "Hydration mismatch on iOS" },
  { level: "info" as const, text: "Cron run · etl.daily" },
];

/**
 * High-frequency feed simulating a notifications panel.
 * Use `tickMs` to slow/speed the firehose. `bounded` clamps the list — the
 * unbounded mode demonstrates Module 23's memory growth pattern.
 */
export function NotificationsPanel({
  tickMs = 1400,
  bounded = true,
  level = "all",
}: {
  tickMs?: number;
  bounded?: boolean;
  level?: "all" | "info" | "warn" | "alert";
}) {
  useRenderCount("NotificationsPanel");
  const seq = useRef(0);
  const r = useRef(rng(31));
  const [items, setItems] = useState<Notification[]>(() => seed(8, r.current));

  useEffect(() => {
    const id = setInterval(() => {
      setItems((prev) => {
        const tmpl = pick(TEMPLATES, r.current);
        const next: Notification = {
          id: `n-${++seq.current}`,
          t: Date.now(),
          level: tmpl.level,
          text: tmpl.text,
        };
        const merged = [next, ...prev];
        return bounded ? merged.slice(0, 60) : merged;
      });
    }, tickMs);
    return () => clearInterval(id);
  }, [tickMs, bounded]);

  const filtered = useMemo(
    () => (level === "all" ? items : items.filter((i) => i.level === level)),
    [items, level]
  );

  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 border-b border-bg-border px-3 py-2">
        <CardTitle className="font-mono text-xs uppercase tracking-widest text-ink-dim">notifications</CardTitle>
        <Badge variant={bounded ? "outline" : "destructive"} className="font-mono text-[10px]">
          {filtered.length} {bounded ? "" : "(unbounded!)"}
        </Badge>
      </CardHeader>
      <CardContent className="p-0">
        <ul className="max-h-56 divide-y divide-bg-border overflow-y-auto">
          <AnimatePresence initial={false}>
            {filtered.slice(0, 14).map((n) => (
              <motion.li
                key={n.id}
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.14 }}
                className="flex items-center gap-2 px-3 py-1.5 text-xs"
              >
                <span
                  className={cn(
                    "size-1.5 shrink-0 rounded-full",
                    n.level === "info" && "bg-accent",
                    n.level === "warn" && "bg-accent-warn",
                    n.level === "alert" && "bg-accent-bad animate-pulse_dot"
                  )}
                />
                <span className="flex-1 truncate text-ink-muted">{n.text}</span>
                <span className="font-mono text-[10px] text-ink-dim">{rel(n.t)}</span>
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
      </CardContent>
    </Card>
  );
}

function seed(n: number, r: () => number): Notification[] {
  return Array.from({ length: n }, (_, i) => {
    const t = pick(TEMPLATES, r);
    return { id: `seed-${i}`, t: Date.now() - i * 14000, level: t.level, text: t.text };
  });
}
function rel(t: number) {
  const s = Math.max(0, Math.floor((Date.now() - t) / 1000));
  if (s < 60) return `${s}s`;
  if (s < 3600) return `${Math.floor(s / 60)}m`;
  return `${Math.floor(s / 3600)}h`;
}
